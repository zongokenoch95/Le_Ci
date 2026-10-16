import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'maison.db');

const db = new sqlite3.Database(dbPath);

// ==========================================
// SEUIL MONTANT ÉLEVÉ (configurable via env)
// Au-delà de ce seuil, le paiement nécessite
// une vérification manuelle du caissier
// ==========================================
const HIGH_VALUE_THRESHOLD = parseInt(process.env.HIGH_VALUE_THRESHOLD || '25000', 10);

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

  // ==========================================
  // TABLE JOURNAL D'AUDIT PAIEMENTS
  // Traçabilité complète de chaque tentative
  // ==========================================
  await run(`
    CREATE TABLE IF NOT EXISTS payment_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      order_id TEXT,
      ip_address TEXT,
      raw_payload TEXT,
      parsed_amount INTEGER,
      parsed_phone TEXT,
      parsed_code_ref TEXT,
      parsed_tx_ref TEXT,
      matched_by TEXT,
      result TEXT,
      details TEXT,
      created_at DATETIME NOT NULL
    )
  `);

    // ==========================================
  // TABLES PROGRAMME DE FIDÉLISATION
  // Entièrement paramétrable par le gérant
  // ==========================================
  await run(`
    CREATE TABLE IF NOT EXISTS loyalty_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER DEFAULT 1,
      fcfa_per_point INTEGER DEFAULT 100,
      point_value_fcfa INTEGER DEFAULT 1,
      min_points_to_redeem INTEGER DEFAULT 50,
      welcome_bonus_points INTEGER DEFAULT 50,
      silver_min_points INTEGER DEFAULT 500,
      silver_discount_percent INTEGER DEFAULT 5,
      gold_min_points INTEGER DEFAULT 1500,
      gold_discount_percent INTEGER DEFAULT 10,
      updated_at DATETIME
    )
  `);

  // Insérer les paramètres par défaut si inexistant
  const existingSettings = await get('SELECT id FROM loyalty_settings WHERE id = 1');
  if (!existingSettings) {
    await run(`
      INSERT INTO loyalty_settings (id, enabled, fcfa_per_point, point_value_fcfa, min_points_to_redeem, welcome_bonus_points, silver_min_points, silver_discount_percent, gold_min_points, gold_discount_percent, updated_at)
      VALUES (1, 1, 100, 1, 50, 50, 500, 5, 1500, 10, ?)
    `, [new Date().toISOString()]);
  }

  // Membres du programme de fidélité
  await run(`
    CREATE TABLE IF NOT EXISTS loyalty_members (
      phone TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      tier TEXT DEFAULT 'BRONZE',
      total_spent INTEGER DEFAULT 0,
      orders_count INTEGER DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )
  `);

  // Historique des points (gains, déductions, bonus)
  await run(`
    CREATE TABLE IF NOT EXISTS loyalty_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      order_id TEXT,
      type TEXT NOT NULL,
      points INTEGER NOT NULL,
      description TEXT,
      created_at DATETIME NOT NULL
    )
  `);

  console.log('✅ [SQLite] Base de données connectée — orders, audit_logs et tables de fidélisation prêtes.');
}

// ==========================================
// JOURNAL D'AUDIT — Fonctions
// ==========================================

/**
 * Enregistre un événement dans le journal d'audit
 */
export async function logAuditEvent({
  eventType,
  orderId = null,
  ipAddress = null,
  rawPayload = null,
  parsedAmount = null,
  parsedPhone = null,
  parsedCodeRef = null,
  parsedTxRef = null,
  matchedBy = null,
  result = null,
  details = null
}) {
  try {
    await run(`
      INSERT INTO payment_audit_logs (event_type, order_id, ip_address, raw_payload, parsed_amount, parsed_phone, parsed_code_ref, parsed_tx_ref, matched_by, result, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventType,
      orderId,
      ipAddress,
      typeof rawPayload === 'string' ? rawPayload.slice(0, 2000) : JSON.stringify(rawPayload)?.slice(0, 2000) || null,
      parsedAmount,
      parsedPhone,
      parsedCodeRef,
      parsedTxRef,
      matchedBy,
      result,
      details,
      new Date().toISOString()
    ]);
  } catch (err) {
    // Ne jamais bloquer le flux principal à cause d'un échec de log
    console.error("⚠️ [Audit] Erreur d'écriture du log :", err.message);
  }
}

/**
 * Récupère les logs d'audit avec filtres optionnels
 */
export async function getAuditLogs({ eventType, result, orderId, limit = 100, offset = 0 } = {}) {
  let query = 'SELECT * FROM payment_audit_logs WHERE 1=1';
  const params = [];

  if (eventType) {
    query += ' AND event_type = ?';
    params.push(eventType);
  }
  if (result) {
    query += ' AND result = ?';
    params.push(result);
  }
  if (orderId) {
    query += ' AND order_id = ?';
    params.push(orderId);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return await all(query, params);
}

/**
 * Statistiques d'audit résumées (pour le dashboard admin)
 */
export async function getAuditStats() {
  const total = await get('SELECT COUNT(*) as count FROM payment_audit_logs');
  const byType = await all('SELECT event_type, COUNT(*) as count FROM payment_audit_logs GROUP BY event_type ORDER BY count DESC');
  const byResult = await all('SELECT result, COUNT(*) as count FROM payment_audit_logs GROUP BY result ORDER BY count DESC');
  const last24h = await get(
    "SELECT COUNT(*) as count FROM payment_audit_logs WHERE created_at >= datetime('now', '-24 hours')"
  );
  const rejectedLast1h = await get(
    "SELECT COUNT(*) as count FROM payment_audit_logs WHERE result = 'REJECTED' AND created_at >= datetime('now', '-1 hour')"
  );

  return {
    total: total?.count || 0,
    last24h: last24h?.count || 0,
    rejectedLastHour: rejectedLast1h?.count || 0,
    byType,
    byResult
  };
}

// ==========================================
// FONCTIONS COMMANDES (existantes)
// ==========================================

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
    data.customerName || 'Client Les Douceurs de Lê Ci',
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

/**
 * Approuve un paiement de montant élevé marqué EN_VERIFICATION_MANUELLE
 * Le caissier valide manuellement → passage en EN_PREPARATION
 */
export async function approveHighValue(id) {
  const order = await get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) throw new Error('Commande non trouvée');
  if (order.statut !== 'EN_VERIFICATION_MANUELLE') {
    throw new Error(`Commande ${id} n'est pas en vérification manuelle (statut actuel : ${order.statut})`);
  }

  const now = new Date().toISOString();
  await run(
    `UPDATE orders SET statut = 'EN_PREPARATION', paid_at = ? WHERE id = ?`,
    [now, id]
  );

  await logAuditEvent({
    eventType: 'HIGH_VALUE_APPROVED',
    orderId: id,
    parsedAmount: order.montant_total,
    result: 'SUCCESS',
    details: `Montant élevé ${order.montant_total} FCFA approuvé manuellement par le caissier`
  });

  return getOrderById(id);
}

/**
 * Rejette un paiement de montant élevé marqué EN_VERIFICATION_MANUELLE
 */
export async function rejectHighValue(id) {
  const order = await get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) throw new Error('Commande non trouvée');
  if (order.statut !== 'EN_VERIFICATION_MANUELLE') {
    throw new Error(`Commande ${id} n'est pas en vérification manuelle (statut actuel : ${order.statut})`);
  }

  await run(`UPDATE orders SET statut = 'ANNULEE' WHERE id = ?`, [id]);

  await logAuditEvent({
    eventType: 'HIGH_VALUE_REJECTED',
    orderId: id,
    parsedAmount: order.montant_total,
    result: 'REJECTED',
    details: `Montant élevé ${order.montant_total} FCFA rejeté par le caissier`
  });

  return getOrderById(id);
}

// ==========================================
// RÉCONCILIATION WEBHOOK PAIEMENT
// (avec seuil montant élevé et audit)
// ==========================================

export async function reconcilePaymentWebhook({
  rawMessage = '',
  senderPhone = null,
  amount = null,
  transactionRef = null,
  codeReference = null,
  ipAddress = null
}) {
  await checkAndExpireOrders();

  // Données de base pour l'audit
  const auditBase = {
    ipAddress,
    rawPayload: rawMessage,
    parsedAmount: amount,
    parsedPhone: senderPhone,
    parsedCodeRef: codeReference,
    parsedTxRef: transactionRef
  };

  // 1. Contrôle Idempotence
  if (transactionRef) {
    const existing = await get('SELECT * FROM orders WHERE transaction_ref = ?', [transactionRef]);
    if (existing) {
      await logAuditEvent({
        ...auditBase,
        eventType: 'DUPLICATE_REJECTED',
        orderId: existing.id,
        matchedBy: 'transaction_ref',
        result: 'REJECTED',
        details: `Transaction ${transactionRef} déjà enregistrée pour la commande ${existing.id}`
      });

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
    await logAuditEvent({
      ...auditBase,
      eventType: 'MATCH_FAILED',
      result: 'REJECTED',
      details: `Aucune commande en attente pour le montant ${amount || 'non spécifié'} FCFA`
    });

    return {
      success: true,
      duplicate: false,
      matched: false,
      order: null,
      message: `Aucune commande en attente ne correspond au montant ${amount || 'non spécifié'} FCFA`
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

  // ==========================================
  // SEUIL MONTANT ÉLEVÉ
  // Si le montant dépasse HIGH_VALUE_THRESHOLD,
  // on ne valide pas automatiquement → statut
  // EN_VERIFICATION_MANUELLE pour contrôle caissier
  // ==========================================
  const finalAmount = Number(chosenOrder.montant_total);
  const isHighValue = finalAmount > HIGH_VALUE_THRESHOLD;
  const newStatut = isHighValue ? 'EN_VERIFICATION_MANUELLE' : 'EN_PREPARATION';

  const now = new Date().toISOString();
  await run(
    `UPDATE orders SET statut = ?, paid_at = ?, transaction_ref = ? WHERE id = ?`,
    [newStatut, now, transactionRef || null, chosenOrder.id]
  );

  // Log d'audit — succès ou flaggé
  await logAuditEvent({
    ...auditBase,
    eventType: isHighValue ? 'HIGH_VALUE_FLAGGED' : 'MATCH_SUCCESS',
    orderId: chosenOrder.id,
    matchedBy,
    result: isHighValue ? 'FLAGGED' : 'SUCCESS',
    details: isHighValue
      ? `⚠️ Montant élevé ${finalAmount} FCFA (seuil : ${HIGH_VALUE_THRESHOLD}) — En attente de vérification manuelle`
      : `Commande ${chosenOrder.id} validée automatiquement (${matchedBy})`
  });

  const updatedOrder = await getOrderById(chosenOrder.id);
  return {
    success: true,
    duplicate: false,
    matched: true,
    matchedBy,
    highValue: isHighValue,
    order: updatedOrder,
    message: isHighValue
      ? `⚠️ Commande ${chosenOrder.id} — Montant élevé (${finalAmount} FCFA). En attente de vérification manuelle du caissier.`
      : `Commande ${chosenOrder.id} validée automatiquement avec succès (${matchedBy})`
  };
}


// ==========================================
// PROGRAMME DE FIDÉLISATION — Gestion & Paramétrage
// ==========================================

export async function getLoyaltySettings() {
  const settings = await get('SELECT * FROM loyalty_settings WHERE id = 1');
  return settings || {
    id: 1,
    enabled: 1,
    fcfa_per_point: 100,
    point_value_fcfa: 1,
    min_points_to_redeem: 50,
    welcome_bonus_points: 50,
    silver_min_points: 500,
    silver_discount_percent: 5,
    gold_min_points: 1500,
    gold_discount_percent: 10
  };
}

export async function updateLoyaltySettings(data) {
  const now = new Date().toISOString();
  await run(`
    UPDATE loyalty_settings SET
      enabled = ?,
      fcfa_per_point = ?,
      point_value_fcfa = ?,
      min_points_to_redeem = ?,
      welcome_bonus_points = ?,
      silver_min_points = ?,
      silver_discount_percent = ?,
      gold_min_points = ?,
      gold_discount_percent = ?,
      updated_at = ?
    WHERE id = 1
  `, [
    data.enabled ? 1 : 0,
    Number(data.fcfa_per_point) || 100,
    Number(data.point_value_fcfa) || 1,
    Number(data.min_points_to_redeem) || 50,
    Number(data.welcome_bonus_points) || 50,
    Number(data.silver_min_points) || 500,
    Number(data.silver_discount_percent) || 5,
    Number(data.gold_min_points) || 1500,
    Number(data.gold_discount_percent) || 10,
    now
  ]);

  return getLoyaltySettings();
}

function calculateTier(points, settings) {
  if (points >= (settings.gold_min_points || 1500)) return 'GOLD';
  if (points >= (settings.silver_min_points || 500)) return 'SILVER';
  return 'BRONZE';
}

export async function getLoyaltyMember(rawPhone) {
  if (!rawPhone) return null;
  const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-8);
  if (!cleanPhone) return null;

  const member = await get('SELECT * FROM loyalty_members WHERE phone = ?', [cleanPhone]);
  if (!member) return null;

  const history = await all(
    'SELECT * FROM loyalty_history WHERE phone = ? ORDER BY created_at DESC LIMIT 20',
    [cleanPhone]
  );

  const settings = await getLoyaltySettings();

  return {
    ...member,
    history: history || [],
    settings
  };
}

export async function getAllLoyaltyMembers() {
  const members = await all('SELECT * FROM loyalty_members ORDER BY points DESC');
  return members || [];
}

export async function creditOrderPoints(order) {
  if (!order || !order.customerPhone) return null;
  const settings = await getLoyaltySettings();
  if (!settings.enabled) return null;

  const cleanPhone = String(order.customerPhone).replace(/\D/g, '').slice(-8);
  if (!cleanPhone || cleanPhone.length < 8) return null;

  const now = new Date().toISOString();
  const amount = Number(order.montantTotal || order.montant_total) || 0;
  const pointsEarned = Math.floor(amount / (settings.fcfa_per_point || 100));

  let member = await get('SELECT * FROM loyalty_members WHERE phone = ?', [cleanPhone]);
  let isNew = false;

  if (!member) {
    isNew = true;
    const initialPoints = (settings.welcome_bonus_points || 50) + pointsEarned;
    const tier = calculateTier(initialPoints, settings);

    await run(`
      INSERT INTO loyalty_members (phone, name, points, tier, total_spent, orders_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `, [
      cleanPhone,
      order.customerName || order.customer_name || 'Client Lê Ci',
      initialPoints,
      tier,
      amount,
      now,
      now
    ]);

    // Historique bonus de bienvenue
    if (settings.welcome_bonus_points > 0) {
      await run(`
        INSERT INTO loyalty_history (phone, order_id, type, points, description, created_at)
        VALUES (?, ?, 'BONUS', ?, 'Bonus de bienvenue Club Privilège', ?)
      `, [cleanPhone, order.id, settings.welcome_bonus_points, now]);
    }
  } else {
    const newPoints = member.points + pointsEarned;
    const newTotalSpent = member.total_spent + amount;
    const newOrdersCount = member.orders_count + 1;
    const newTier = calculateTier(newPoints, settings);

    await run(`
      UPDATE loyalty_members SET
        name = COALESCE(?, name),
        points = ?,
        tier = ?,
        total_spent = ?,
        orders_count = ?,
        updated_at = ?
      WHERE phone = ?
    `, [
      order.customerName || order.customer_name,
      newPoints,
      newTier,
      newTotalSpent,
      newOrdersCount,
      now,
      cleanPhone
    ]);
  }

  // Historique gain commande
  if (pointsEarned > 0) {
    await run(`
      INSERT INTO loyalty_history (phone, order_id, type, points, description, created_at)
      VALUES (?, ?, 'EARN', ?, ?, ?)
    `, [cleanPhone, order.id, pointsEarned, `Points gagnés sur commande ${order.id} (${amount} FCFA)`, now]);
  }

  return getLoyaltyMember(cleanPhone);
}

export async function redeemPoints({ phone, pointsToRedeem, orderId }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-8);
  const member = await get('SELECT * FROM loyalty_members WHERE phone = ?', [cleanPhone]);
  if (!member) throw new Error('Membre non trouvé');

  const settings = await getLoyaltySettings();
  if (pointsToRedeem < (settings.min_points_to_redeem || 50)) {
    throw new Error(`Seuil minimal d'utilisation : ${settings.min_points_to_redeem} points`);
  }
  if (member.points < pointsToRedeem) {
    throw new Error(`Solde de points insuffisant (${member.points} points disponibles)`);
  }

  const discountAmount = pointsToRedeem * (settings.point_value_fcfa || 1);
  const newPoints = member.points - pointsToRedeem;
  const now = new Date().toISOString();
  const newTier = calculateTier(newPoints, settings);

  await run(`
    UPDATE loyalty_members SET points = ?, tier = ?, updated_at = ? WHERE phone = ?
  `, [newPoints, newTier, now, cleanPhone]);

  await run(`
    INSERT INTO loyalty_history (phone, order_id, type, points, description, created_at)
    VALUES (?, ?, 'REDEEM', ?, ?, ?)
  `, [cleanPhone, orderId || null, -pointsToRedeem, `Utilisation de ${pointsToRedeem} points pour une réduction de ${discountAmount} FCFA`, now]);

  return {
    success: true,
    discountAmount,
    remainingPoints: newPoints,
    tier: newTier
  };
}

export async function adjustMemberPoints({ phone, name, pointsDelta, reason }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-8);
  const now = new Date().toISOString();
  const settings = await getLoyaltySettings();

  let member = await get('SELECT * FROM loyalty_members WHERE phone = ?', [cleanPhone]);
  if (!member) {
    const pts = Math.max(0, pointsDelta);
    await run(`
      INSERT INTO loyalty_members (phone, name, points, tier, total_spent, orders_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, 0, ?, ?)
    `, [cleanPhone, name || 'Membre Lê Ci', pts, calculateTier(pts, settings), now, now]);
  } else {
    const newPoints = Math.max(0, member.points + pointsDelta);
    await run(`
      UPDATE loyalty_members SET
        points = ?,
        tier = ?,
        name = COALESCE(?, name),
        updated_at = ?
      WHERE phone = ?
    `, [newPoints, calculateTier(newPoints, settings), name, now, cleanPhone]);
  }

  await run(`
    INSERT INTO loyalty_history (phone, order_id, type, points, description, created_at)
    VALUES (?, NULL, 'MANUAL_ADJUST', ?, ?, ?)
  `, [cleanPhone, pointsDelta, reason || 'Ajustement gérant', now]);

  return getLoyaltyMember(cleanPhone);
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
  reconcilePaymentWebhook,
  logAuditEvent,
  getAuditLogs,
  getAuditStats,
  approveHighValue,
  rejectHighValue,
  getLoyaltySettings,
  updateLoyaltySettings,
  getLoyaltyMember,
  getAllLoyaltyMembers,
  creditOrderPoints,
  redeemPoints,
  adjustMemberPoints
};
