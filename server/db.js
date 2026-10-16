import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'maison.db');

const db = new sqlite3.Database(dbPath);

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

export async function initDb() {
  await run('PRAGMA foreign_keys = ON');

  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      customer_email TEXT,
      items TEXT NOT NULL,
      montant_total INTEGER NOT NULL,
      statut TEXT NOT NULL,
      code_reference TEXT UNIQUE,
      transaction_ref TEXT,
      mode_paiement TEXT DEFAULT 'orange_money',
      notes TEXT,
      created_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL,
      paid_at DATETIME
    )
  `);
  console.log('✅ [SQLite] Base de données Maison Al Fann connectée et table orders prête.');
}

function generateCodeReference() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatOrder(row) {
  if (!row) return null;
  let items = [];
  try {
    items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
  } catch (e) {
    items = [];
  }
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    items,
    montantTotal: row.montant_total,
    statut: row.statut,
    codeReference: row.code_reference,
    transactionRef: row.transaction_ref,
    modePaiement: row.mode_paiement,
    notes: row.notes,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    paidAt: row.paid_at
  };
}

export async function checkAndExpireOrders() {
  const now = new Date().toISOString();
  const rows = await all(
    `SELECT id FROM orders WHERE statut = 'EN_ATTENTE_DE_PAIEMENT' AND expires_at <= ?`,
    [now]
  );
  if (rows && rows.length > 0) {
    for (const r of rows) {
      await run(`UPDATE orders SET statut = 'ANNULEE' WHERE id = ?`, [r.id]);
    }
  }
  return rows ? rows.map(r => r.id) : [];
}

export async function createOrder(data) {
  const id = `CMD-${Date.now()}`;
  let codeReference = generateCodeReference();
  let existing = await get('SELECT id FROM orders WHERE code_reference = ?', [codeReference]);
  while (existing) {
    codeReference = generateCodeReference();
    existing = await get('SELECT id FROM orders WHERE code_reference = ?', [codeReference]);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // TTL 10 minutes

  const itemsJson = JSON.stringify(data.items || []);
  const amount = parseInt(data.montantTotal || data.amount || 0, 10);

  await run(`
    INSERT INTO orders (id, customer_name, customer_phone, customer_email, items, montant_total, statut, code_reference, mode_paiement, notes, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    data.customerName || 'Client Maison Al Fann',
    data.customerPhone || '',
    data.customerEmail || '',
    itemsJson,
    amount,
    'EN_ATTENTE_DE_PAIEMENT',
    codeReference,
    data.modePaiement || 'orange_money',
    data.notes || '',
    now.toISOString(),
    expiresAt.toISOString()
  ]);

  const row = await get('SELECT * FROM orders WHERE id = ?', [id]);
  return formatOrder(row);
}

export async function getOrderById(id) {
  const row = await get('SELECT * FROM orders WHERE id = ?', [id]);
  return formatOrder(row);
}

export async function getAllOrders() {
  await checkAndExpireOrders();
  const rows = await all('SELECT * FROM orders ORDER BY created_at DESC');
  return rows.map(formatOrder);
}

export async function cancelOrder(id) {
  await run(`UPDATE orders SET statut = 'ANNULEE' WHERE id = ?`, [id]);
  return getOrderById(id);
}

export async function validateOrder(id) {
  const now = new Date().toISOString();
  await run(`UPDATE orders SET statut = 'EN_PREPARATION', paid_at = ? WHERE id = ?`, [now, id]);
  return getOrderById(id);
}

export async function finishOrder(id) {
  await run(`UPDATE orders SET statut = 'PRETE' WHERE id = ?`, [id]);
  return getOrderById(id);
}

export async function reconcilePaymentWebhook({
  rawMessage = '',
  senderPhone = null,
  amount = null,
  transactionRef = null,
  codeReference = null
}) {
  await checkAndExpireOrders();

  // 1. Contrôle Idempotence
  if (transactionRef) {
    const existing = await get('SELECT * FROM orders WHERE transaction_ref = ?', [transactionRef]);
    if (existing) {
      return {
        success: true,
        duplicate: true,
        matched: true,
        order: formatOrder(existing),
        message: `Transaction ${transactionRef} déjà enregistrée pour la commande ${existing.id}`
      };
    }
  }

  // 2. Recherche des commandes en attente
  let query = `SELECT * FROM orders WHERE statut = 'EN_ATTENTE_DE_PAIEMENT'`;
  const params = [];
  if (amount && Number(amount) > 0) {
    query += ` AND montant_total = ?`;
    params.push(Number(amount));
  }
  query += ` ORDER BY created_at ASC`;

  const pendingOrders = await all(query, params);

  if (!pendingOrders || pendingOrders.length === 0) {
    return {
      success: true,
      duplicate: false,
      matched: false,
      order: null,
      message: `Aucune commande en attente ne correspond au montant ${amount || 'non spécifié'} FCFA/DT`
    };
  }

  let chosenOrder = null;
  let matchedBy = 'fifo';

  // NIVEAU 1 : Code référence marchand (ex: "K9X2")
  if (codeReference) {
    const cleanRef = String(codeReference).trim().toUpperCase();
    chosenOrder = pendingOrders.find(o => o.code_reference && o.code_reference.toUpperCase() === cleanRef);
    if (chosenOrder) matchedBy = 'code_reference';
  }

  if (!chosenOrder && rawMessage) {
    for (const order of pendingOrders) {
      if (order.code_reference && rawMessage.toUpperCase().includes(order.code_reference.toUpperCase())) {
        chosenOrder = order;
        matchedBy = 'code_reference_in_message';
        break;
      }
    }
  }

  // NIVEAU 2 : Téléphone client + montant
  if (!chosenOrder && senderPhone) {
    const cleanPhone = String(senderPhone).replace(/\D/g, '').slice(-8);
    chosenOrder = pendingOrders.find(o => {
      const clientPhone = String(o.customer_phone || '').replace(/\D/g, '').slice(-8);
      return clientPhone && clientPhone === cleanPhone;
    });
    if (chosenOrder) matchedBy = 'phone_and_amount';
  }

  // NIVEAU 3 : Montant unique dans la fenêtre active (TTL 10 min)
  if (!chosenOrder) {
    if (pendingOrders.length === 1) {
      chosenOrder = pendingOrders[0];
      matchedBy = 'amount_unique';
    } else {
      chosenOrder = pendingOrders[0];
      matchedBy = 'amount_fifo';
    }
  }

  // Validation
  const now = new Date().toISOString();
  await run(
    `UPDATE orders SET statut = 'EN_PREPARATION', paid_at = ?, transaction_ref = ? WHERE id = ?`,
    [now, transactionRef || null, chosenOrder.id]
  );

  const updatedOrder = await getOrderById(chosenOrder.id);
  return {
    success: true,
    duplicate: false,
    matched: true,
    matchedBy,
    order: updatedOrder,
    message: `Commande ${chosenOrder.id} validée automatiquement avec succès (${matchedBy})`
  };
}

export default {
  initDb,
  createOrder,
  getOrderById,
  getAllOrders,
  cancelOrder,
  validateOrder,
  finishOrder,
  checkAndExpireOrders,
  reconcilePaymentWebhook
};
