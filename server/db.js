import bcrypt from 'bcryptjs';
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

  // ==========================================
  // TABLE UTILISATEURS ADMINISTRATIFS & SÉCURITÉ RBAC
  // ==========================================
  await run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employe', -- 'gerant' ou 'employe'
      status TEXT NOT NULL DEFAULT 'active', -- 'active' ou 'blocked'
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      last_login_at DATETIME
    )
  `);

  // Initialisation du Gérant et d'un Employé par défaut
  const defaultGerant = await get("SELECT id FROM admin_users WHERE email = 'gerant@lesdouceursdeleci.com'");
  if (!defaultGerant) {
    const salt = bcrypt.genSaltSync(10);
    const gerantHash = bcrypt.hashSync('Admin@Leci2026!', salt);
    const staffHash = bcrypt.hashSync('Staff@Leci2026!', salt);
    const now = new Date().toISOString();

    await run(`
      INSERT INTO admin_users (name, email, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['Gérant Principal', 'gerant@lesdouceursdeleci.com', gerantHash, 'gerant', 'active', now, now]);

    await run(`
      INSERT INTO admin_users (name, email, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['Équipe Cuisine (KDS)', 'cuisine@lesdouceursdeleci.com', staffHash, 'employe', 'active', now, now]);

    console.log('👑 [RBAC] Comptes Gérant & Employé créés par défaut.');
  }

  // ==========================================
  // TABLE EMPLOYÉS & AUTHENTIFICATION PIN
  // ==========================================
  await run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pin TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee', -- 'admin', 'caissier', 'patissier'
      created_at DATETIME NOT NULL
    )
  `);

  // Vérifier et créer le compte administrateur par défaut si aucun employé n'existe
  const adminExists = await get("SELECT id FROM employees WHERE role = 'admin' LIMIT 1");
  if (!adminExists) {
    const now = new Date().toISOString();
    await run(`
      INSERT INTO employees (name, pin, role, created_at)
      VALUES (?, ?, ?, ?)
    `, ['Gérant Principal', '1234', 'admin', now]);
    console.log('🔐 [Auth] Compte Administrateur initialisé (Code PIN par défaut: 1234)');
  }

  // ==========================================
  // TABLES RÉCOMPENSES & COUPONS DE FIDÉLITÉ (fidelity.md)
  // ==========================================
  await run(`
    CREATE TABLE IF NOT EXISTS loyalty_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      points_cost INTEGER NOT NULL,
      category TEXT DEFAULT 'Pâtisserie',
      image TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS loyalty_coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      reward_id INTEGER NOT NULL,
      reward_title TEXT NOT NULL,
      phone TEXT NOT NULL,
      points_spent INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'USED', 'EXPIRED'
      created_at DATETIME NOT NULL,
      used_at DATETIME,
      validated_by TEXT
    )
  `);

  // Insérer des récompenses par défaut si la table est vide
  const rewardsCount = await get('SELECT COUNT(*) as count FROM loyalty_rewards');
  if (rewardsCount && rewardsCount.count === 0) {
    const now = new Date().toISOString();
    await run(`
      INSERT INTO loyalty_rewards (title, description, points_cost, category, image, created_at) VALUES
      ('Croissant Beurre Pur Offert', 'Un délicieux croissant croustillant artisanal au pur beurre', 25, 'Viennoiserie', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', ?),
      ('Boisson Fraîche ou Café Espresso', 'Un rafraîchissement au choix ou un café de spécialité', 20, 'Boisson', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', ?),
      ('Boîte Découverte 4 Macarons', 'Assortiment de 4 macarons parisiens faits maison', 50, 'Macarons', 'https://images.unsplash.com/photo-1728566842903-59fbc50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', ?),
      ('Tartelette aux Fruits Frais', 'Pâte sablée dorée garnie de crème vanillée et fruits de saison', 75, 'Gâteaux', 'https://images.unsplash.com/photo-1582180834946-f3d376b18376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', ?)
    `, [now, now, now, now]);
  }

    // ==========================================
  // TABLE PRODUITS / PLATS DU MENU
  // Gérable entièrement par l'administrateur
  // ==========================================
  await run(`
        CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Gâteaux',
      price INTEGER NOT NULL,
      description TEXT,
      image TEXT,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )
  `);

  // Table pour le bandeau d'annonces / promotions défilant
  await run(`
    CREATE TABLE IF NOT EXISTS delivery_settings (
      id INTEGER PRIMARY KEY,
      price_per_km REAL NOT NULL DEFAULT 250,
      min_fee REAL NOT NULL DEFAULT 1000,
      free_threshold REAL NOT NULL DEFAULT 50000,
      origin_lat REAL NOT NULL DEFAULT 12.3714,
      origin_lng REAL NOT NULL DEFAULT -1.5197,
      origin_address TEXT NOT NULL DEFAULT 'Atelier Les Douceurs de Lê Ci, Ouagadougou',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    INSERT OR IGNORE INTO delivery_settings (id, price_per_km, min_fee, free_threshold, origin_lat, origin_lng, origin_address, is_active)
    VALUES (1, 250, 1000, 50000, 12.3714, -1.5197, 'Atelier Les Douceurs de Lê Ci, Ouagadougou', 1)
  `);

  try {
    await run(`ALTER TABLE delivery_settings ADD COLUMN neighborhoods TEXT`);
  } catch (e) {}

  try {
    await run(`ALTER TABLE orders ADD COLUMN payer_name TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    await run(`ALTER TABLE orders ADD COLUMN payer_phone TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    await run(`ALTER TABLE orders ADD COLUMN delivery_fee INTEGER DEFAULT 0`);
  } catch (e) {}

  await run(`
    CREATE TABLE IF NOT EXISTS announcement_banner (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      message TEXT NOT NULL,
      is_permanent INTEGER DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      text_color TEXT DEFAULT '#FFFFFF',
      bg_color TEXT DEFAULT '#3B0764',
      is_active INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    INSERT OR IGNORE INTO announcement_banner (id, message, is_permanent, start_date, end_date, text_color, bg_color, is_active)
    VALUES (1, '✦ OFFRE SPÉCIALE : -10% sur votre commande avec le code « DOUCEUR10 » ✦ Inscription fidélité offerte dès aujourd''hui ✦ Livraison soignée à domicile ✦', 1, '', '', '#FFFFFF', '#3B0764', 1)
  `);

  // Seeding initial du catalogue si vide
  
  try {
    await run(`ALTER TABLE products ADD COLUMN portions_json TEXT DEFAULT '[]'`);
    try {
      await run(`ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 10`);
    } catch (e) {}
  } catch (e) {
    // Colonne déjà existante
  }

  const prodCount = await get('SELECT COUNT(*) as count FROM products');
  if (prodCount && prodCount.count === 0) {
    const now = new Date().toISOString();
    const initialProducts = [
  [
    "Plateau Feuilletés Salés Apéritifs",
    "Douceurs salées",
    2500,
    "Feuilletés croustillants au fromage fondant et épices douces, parfaits pour vos réceptions.",
    "/products/salee_1.jpeg"
  ],
  [
    "Croissants Salés Gourmets Farcis",
    "Douceurs salées",
    2000,
    "Pâte pur beurre croustillante garnie de volaille assaisonnée et crème onctueuse.",
    "/products/salee_2.jpeg"
  ],
  [
    "Assortiment Bouchées & Pastels Salés",
    "Douceurs salées",
    3000,
    "Beignets salés dorés et croustillants avec sauce maison parfumée de Lê Ci.",
    "/products/salee_3.jpeg"
  ],
  [
    "Éclairs Fondants Chocolat & Ganache Dorée",
    "Douceurs sucrées",
    1500,
    "Pâte à choux aérée garnie de ganache onctueuse au chocolat grand cru.",
    "/products/sucree_1.jpeg"
  ],
  [
    "Cupcakes Moelleux Crème Vanille Bourbon",
    "Douceurs sucrées",
    1500,
    "Gâteau ultra moelleux surmonté d'un tourbillon de crème montée veloutée.",
    "/products/sucree_2.jpeg"
  ],
  [
    "Macarons Assortis Prestige (Boîte Découverte)",
    "Douceurs sucrées",
    2000,
    "Coques craquantes et cœurs fondants : pistache, framboise, chocolat et caramel fleur de sel.",
    "/products/sucree_3.jpeg"
  ],
  [
    "Tartelettes Sablées Fraises & Fruits Rouges",
    "Douceurs sucrées",
    2500,
    "Pâte sablée dorée, crème pâtissière légère et fruits frais sélectionnés.",
    "/products/sucree_4.jpeg"
  ],
  [
    "Choux Craquelins Cœur Praliné Noisette",
    "Douceurs sucrées",
    1800,
    "Craquelin doré et croustillant garni d'une crème pralinée maison.",
    "/products/sucree_5.jpeg"
  ],
  [
    "Donuts Gourmands Glacés & Vermicelles",
    "Douceurs sucrées",
    1000,
    "Pâte briochée moelleuse avec glaçage gourmand coloré.",
    "/products/sucree_6.jpeg"
  ],
  [
    "Sablés Délicats au Beurre & Confiture",
    "Douceurs sucrées",
    1200,
    "Biscuits fondants pur beurre garnis de confiture artisanale.",
    "/products/sucree_7.jpeg"
  ],
  [
    "Mignardises Sucrées Festives de Lê Ci",
    "Douceurs sucrées",
    3500,
    "Sélection raffinée de petites bouchées sucrées pour vos pauses gourmandes.",
    "/products/sucree_8.jpeg"
  ],
  [
    "Fraisier Signature Suprême Crème Mousseline",
    "Gâteaux",
    6500,
    "Génoise aérienne, fraises fraîches parfumées et crème mousseline vanillée.",
    "/products/gateau_1.jpeg"
  ],
  [
    "Gâteau Festif Personnalisé Pâte d'Amande",
    "Gâteaux",
    12000,
    "Création sur-mesure décorée à la main pour vos anniversaires et célébrations.",
    "/products/gateau_2.jpeg"
  ],
  [
    "Forêt Noire Grand Cru Cacao & Cerises",
    "Gâteaux",
    7000,
    "Génoise cacao intense, crème chantilly légère et cerises griottes juteuses.",
    "/products/gateau_3.jpeg"
  ],
  [
    "Layer Cake Chocolat Praliné & Drip Caramel",
    "Gâteaux",
    9500,
    "Étages gourmands de chocolat et praliné avec coulant de caramel doré.",
    "/products/gateau_4.jpeg"
  ],
  [
    "Entremet Miroir Fruits Rouges & Mousse Velours",
    "Gâteaux",
    8000,
    "Glaçage miroir étincelant sur mousse onctueuse aux fruits rouges frais.",
    "/products/gateau_5.jpeg"
  ],
  [
    "Red Velvet Cake Onctueux Cream Cheese",
    "Gâteaux",
    7500,
    "Gâteau rouge velours traditionnel avec son glaçage doux au fromage frais.",
    "/products/gateau_6.jpeg"
  ],
  [
    "Number Cake Décoré Fruits Frais & Macarons",
    "Gâteaux",
    14000,
    "Chiffre personnalisé sur sablé amande garni de crème vanille et macarons.",
    "/products/gateau_7.jpeg"
  ],
  [
    "Pièce Montée d'Exception & Mariage Prestige",
    "Gâteaux",
    25000,
    "Chef-d'œuvre de haute pâtisserie pour mariages et grandes réceptions.",
    "/products/gateau_8.jpeg"
  ],
  [
    "Box Découverte Douceurs de Lê Ci",
    "Paquets",
    5000,
    "Coffret cadeau assorti contenant un mix de nos meilleures pâtisseries artisanales.",
    "/products/paquet_1.jpeg"
  ],
  [
    "Paquet Cadeau Gourmand Ruban Doré",
    "Paquets",
    6500,
    "Emballage d'exception prêt à offrir avec sélection de douceurs raffinées.",
    "/products/paquet_2.jpeg"
  ],
  [
    "Coffret Dégustation Macarons & Mignardises",
    "Paquets",
    8000,
    "Assortiment luxueux présenté dans son écrin de fête personnalisé.",
    "/products/paquet_3.jpeg"
  ],
  [
    "Pack Fête Familiale (Gâteaux + Mignardises)",
    "Paquets",
    15000,
    "Le pack complet pour combler vos invités : gâteau central et bouchées variées.",
    "/products/paquet_4.jpeg"
  ],
  [
    "Box Pause Douceur & Viennoiseries Assorties",
    "Paquets",
    4500,
    "Idéal pour les réunions et pauses gourmandes de bureau.",
    "/products/paquet_5.jpeg"
  ],
  [
    "Coffret Écrin Anniversaire Surprise",
    "Paquets",
    10000,
    "Pack festif avec bougies, douceurs personnalisées et finitions prestige.",
    "/products/paquet_6.jpeg"
  ],
  [
    "Pack Réception & Cocktails d'Entreprise",
    "Paquets",
    20000,
    "Grande sélection de douceurs salées et sucrées pour événements professionnels.",
    "/products/paquet_7.jpeg"
  ]
];

    for (const p of initialProducts) {
      await run(`
        INSERT INTO products (name, category, price, description, image, is_available, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `, [p[0], p[1], p[2], p[3], p[4], now, now]);
    }
    console.log('🥐 [Catalogue] Plats et pâtisseries initialisés dans SQLite.');
  }

  console.log('✅ [SQLite] Base de données connectée — orders, audit_logs, fidélisation, récompenses, employés et plats prêts.');
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

  const notesStr = row.notes || '';
  let payerName = row.payer_name || '';
  let payerPhone = row.payer_phone || '';
  if (!payerName) {
    const mName = notesStr.match(/Payeur:\s*([^|(]+?)\s*\(/i);
    if (mName && mName[1] && mName[1].trim() !== 'Non précisé') {
      payerName = mName[1].trim();
    }
  }
  if (!payerPhone) {
    const mPhone = notesStr.match(/Payeur:[^)]*\(([^)]+)\)/i);
    if (mPhone && mPhone[1]) {
      payerPhone = mPhone[1].trim();
    }
  }

  let deliveryFee = row.delivery_fee !== undefined && row.delivery_fee !== null ? Number(row.delivery_fee) : 0;
  if (!deliveryFee && notesStr.includes('Livraison')) {
    const mFee = notesStr.match(/Livraison\s*\([^)]*?(\d+)\s*FCFA\)/i);
    if (mFee && mFee[1]) {
      deliveryFee = Number(mFee[1]);
    }
  }

  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    payerName,
    payerPhone,
    deliveryFee,
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

  const items = data.items || [];
  const itemsJson = JSON.stringify(items);
  
  // Sécurité renforcée Notion 28/10/26 :
  // Le calcul du montant total et de la livraison est vérifié et validé côté serveur
  const itemsTotal = items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  let serverDeliveryFee = 0;
  let distanceKm = 0;

  const isDelivery = data.deliveryType === 'livraison' || (data.notes && data.notes.includes('Livraison')) || data.customerLat || data.manualDistanceKm;
  if (isDelivery && data.deliveryType !== 'sur_place') {
    if (data.deliveryFee !== undefined && !isNaN(Number(data.deliveryFee)) && Number(data.deliveryFee) >= 0) {
      serverDeliveryFee = Math.round(Number(data.deliveryFee));
      distanceKm = Number(data.distanceKm || data.manualDistanceKm || 3.5);
    } else {
      const deliveryCalc = await calculateDeliveryFee({
        customerLat: data.customerLat,
        customerLng: data.customerLng,
        totalCartAmount: itemsTotal,
        manualDistanceKm: data.manualDistanceKm || data.distanceKm
      });
      serverDeliveryFee = deliveryCalc.deliveryFee;
      distanceKm = deliveryCalc.distanceKm;
    }
  }

  const cardSupplement = data.hasGreetingCard ? 200 : 0;
  const discountAmount = Math.max(0, Number(data.discountAmount || 0));
  
  // Si le calcul serveur est possible, garantir que le montant total n'est pas manipulable côté client
  let finalAmount = parseInt(data.montantTotal || data.amount || 0, 10);
  if (itemsTotal > 0) {
    const verifiedTotal = Math.max(0, itemsTotal + serverDeliveryFee + cardSupplement - discountAmount);
    finalAmount = verifiedTotal;
  }

  await run(`
    INSERT INTO orders (id, customer_name, customer_phone, customer_email, items, montant_total, delivery_fee, statut, code_reference, mode_paiement, notes, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    data.customerName || 'Client Les Douceurs de Lê Ci',
    data.customerPhone || '',
    data.customerEmail || '',
    itemsJson,
    finalAmount,
    serverDeliveryFee,
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


export async function registerLoyaltyMember({ phone, name }) {
  if (!phone || !name) throw new Error('Nom et numéro de téléphone obligatoires');
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-8);
  if (cleanPhone.length < 8) throw new Error('Numéro de téléphone invalide (8 chiffres requis)');

  const settings = await getLoyaltySettings();
  let existing = await get('SELECT * FROM loyalty_members WHERE phone = ?', [cleanPhone]);
  const now = new Date().toISOString();

  if (existing) {
    if (name && name.trim()) {
      await run('UPDATE loyalty_members SET name = ?, updated_at = ? WHERE phone = ?', [name.trim(), now, cleanPhone]);
    }
    return getLoyaltyMember(cleanPhone);
  }

  const welcomePts = settings.welcome_bonus_points || 50;
  await run(`
    INSERT INTO loyalty_members (phone, name, points, tier, total_spent, orders_count, created_at, updated_at)
    VALUES (?, ?, ?, 'BRONZE', 0, 0, ?, ?)
  `, [cleanPhone, name.trim(), welcomePts, now, now]);

  if (welcomePts > 0) {
    await run(`
      INSERT INTO loyalty_history (phone, order_id, type, points, description, created_at)
      VALUES (?, NULL, 'BONUS', ?, 'Bonus de bienvenue Club Fidélisation', ?)
    `, [cleanPhone, welcomePts, now]);
  }

  return getLoyaltyMember(cleanPhone);
}

export async function loginLoyaltyMember({ phone, name }) {
  if (!phone) throw new Error('Numéro de téléphone requis');
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-8);
  if (cleanPhone.length < 8) throw new Error('Numéro de téléphone invalide (8 chiffres requis)');

  let member = await getLoyaltyMember(cleanPhone);
  if (!member) {
    if (name && name.trim()) {
      return registerLoyaltyMember({ phone: cleanPhone, name: name.trim() });
    }
    return null;
  }

  if (name && name.trim() && name.trim() !== member.name) {
    const now = new Date().toISOString();
    await run('UPDATE loyalty_members SET name = ?, updated_at = ? WHERE phone = ?', [name.trim(), now, cleanPhone]);
    member = await getLoyaltyMember(cleanPhone);
  }

  return member;
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
      Math.max(0, Number(stock_quantity) || 0),
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


// ==========================================
// GESTION DES EMPLOYÉS & AUTHENTIFICATION PIN
// ==========================================

export async function verifyStaffPin(pin) {
  if (!pin) return null;
  const employee = await get('SELECT id, name, role, created_at FROM employees WHERE pin = ?', [String(pin).trim()]);
  return employee || null;
}

export async function getAllEmployees() {
  const employees = await all('SELECT id, name, role, created_at FROM employees ORDER BY id ASC');
  return employees || [];
}

export async function addEmployee({ name, pin, role }) {
  if (!name || !pin) throw new Error('Nom et code PIN obligatoires');
  const cleanPin = String(pin).trim();
  if (cleanPin.length < 4) throw new Error('Le code PIN doit comporter au moins 4 chiffres');

  const existing = await get('SELECT id FROM employees WHERE pin = ?', [cleanPin]);
  if (existing) throw new Error('Ce code PIN est déjà attribué à un autre employé');

  const now = new Date().toISOString();
  const validRole = ['admin', 'caissier', 'patissier', 'employee'].includes(role) ? role : 'employee';

  const res = await run(
    'INSERT INTO employees (name, pin, role, created_at) VALUES (?, ?, ?, ?)',
    [name.trim(), cleanPin, validRole, now]
  );

  return { id: res.lastID, name: name.trim(), role: validRole, created_at: now };
}

export async function deleteEmployee(id) {
  const employee = await get('SELECT * FROM employees WHERE id = ?', [id]);
  if (!employee) throw new Error('Employé non trouvé');

  if (employee.role === 'admin') {
    const adminCount = await get("SELECT COUNT(*) as count FROM employees WHERE role = 'admin'");
    if (adminCount && adminCount.count <= 1) {
      throw new Error('Impossible de supprimer le dernier compte administrateur');
    }
  }

  await run('DELETE FROM employees WHERE id = ?', [id]);
  return { success: true, message: 'Employé supprimé avec succès' };
}

// ==========================================
// RÉCOMPENSES & COUPONS DE FIDÉLITÉ (fidelity.md)
// ==========================================

export async function getLoyaltyRewards() {
  return await all('SELECT * FROM loyalty_rewards WHERE is_active = 1 ORDER BY points_cost ASC');
}

export async function createLoyaltyReward({ title, description, points_cost, category, image }) {
  if (!title || !points_cost) throw new Error('Titre et coût en points obligatoires');
  const now = new Date().toISOString();
  const res = await run(`
    INSERT INTO loyalty_rewards (title, description, points_cost, category, image, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `, [title, description || '', Number(points_cost), category || 'Général', image || '', now]);

  return { id: res.lastID, title, points_cost: Number(points_cost) };
}

export async function deleteLoyaltyReward(id) {
  await run('UPDATE loyalty_rewards SET is_active = 0 WHERE id = ?', [id]);
  return { success: true };
}

export async function claimRewardCoupon({ phone, rewardId }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-8);
  const member = await get('SELECT * FROM loyalty_members WHERE phone = ?', [cleanPhone]);
  if (!member) throw new Error('Membre introuvable. Veuillez vous inscrire au programme.');

  const reward = await get('SELECT * FROM loyalty_rewards WHERE id = ? AND is_active = 1', [rewardId]);
  if (!reward) throw new Error('Récompense introuvable ou inactive');

  if (member.points < reward.points_cost) {
    throw new Error(`Solde de points insuffisant (${member.points} pts disponibles pour ${reward.points_cost} pts requis)`);
  }

  // Déduire les points
  const newPoints = member.points - reward.points_cost;
  const now = new Date().toISOString();
  await run('UPDATE loyalty_members SET points = ?, updated_at = ? WHERE phone = ?', [newPoints, now, cleanPhone]);

  // Générer un code coupon unique (ex: CPN-74892)
  const code = 'CPN-' + Math.floor(10000 + Math.random() * 90000);

  await run(`
    INSERT INTO loyalty_coupons (code, reward_id, reward_title, phone, points_spent, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
  `, [code, reward.id, reward.title, cleanPhone, reward.points_cost, now]);

  // Tracer dans l'historique
  await run(`
    INSERT INTO loyalty_history (phone, order_id, type, points, description, created_at)
    VALUES (?, NULL, 'REDEEM', ?, ?, ?)
  `, [cleanPhone, -reward.points_cost, `Échange contre récompense : ${reward.title} (Coupon: ${code})`, now]);

  return {
    success: true,
    code,
    rewardTitle: reward.title,
    pointsSpent: reward.points_cost,
    remainingPoints: newPoints
  };
}

export async function getMemberCoupons(phone) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-8);
  return await all('SELECT * FROM loyalty_coupons WHERE phone = ? ORDER BY created_at DESC', [cleanPhone]);
}

export async function validateCouponCode({ code, staffName }) {
  if (!code) throw new Error('Code coupon manquant');
  const cleanCode = String(code).trim().toUpperCase();

  const coupon = await get('SELECT * FROM loyalty_coupons WHERE UPPER(code) = ?', [cleanCode]);
  if (!coupon) throw new Error('Coupon inexistant');
  if (coupon.status === 'USED') {
    throw new Error(`Coupon déjà utilisé le ${new Date(coupon.used_at).toLocaleString('fr-FR')} (validé par ${coupon.validated_by || 'le personnel'})`);
  }
  if (coupon.status !== 'ACTIVE') {
    throw new Error(`Coupon non valide (Statut : ${coupon.status})`);
  }

  const now = new Date().toISOString();
  await run(`
    UPDATE loyalty_coupons SET status = 'USED', used_at = ?, validated_by = ? WHERE id = ?
  `, [now, staffName || 'Personnel', coupon.id]);

  return {
    success: true,
    message: `Récompense validée avec succès : ${coupon.reward_title} !`,
    coupon: {
      ...coupon,
      status: 'USED',
      used_at: now,
      validated_by: staffName || 'Personnel'
    }
  };
}

export async function recordClientVisit({ phone, name, staffName }) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-8);
  if (!cleanPhone || cleanPhone.length < 8) throw new Error('Numéro de téléphone invalide');

  const settings = await getLoyaltySettings();
  const now = new Date().toISOString();
  const pointsToAdd = 5; // Points par visite selon fidelity.md

  let member = await get('SELECT * FROM loyalty_members WHERE phone = ?', [cleanPhone]);
  if (!member) {
    const welcomePts = settings.welcome_bonus_points || 50;
    const totalPts = welcomePts + pointsToAdd;
    await run(`
      INSERT INTO loyalty_members (phone, name, points, tier, total_spent, orders_count, created_at, updated_at)
      VALUES (?, ?, ?, 'BRONZE', 0, 1, ?, ?)
    `, [cleanPhone, name || 'Client Lê Ci', totalPts, now, now]);

    await run(`
      INSERT INTO loyalty_history (phone, order_id, type, points, description, created_at)
      VALUES (?, NULL, 'BONUS', ?, 'Bonus de bienvenue Club Privilège', ?)
    `, [cleanPhone, welcomePts, now]);
  } else {
    await run(`
      UPDATE loyalty_members SET
        points = points + ?,
        orders_count = orders_count + 1,
        updated_at = ?
      WHERE phone = ?
    `, [pointsToAdd, now, cleanPhone]);
  }

  await run(`
    INSERT INTO loyalty_history (phone, order_id, type, points, description, created_at)
    VALUES (?, NULL, 'EARN', ?, ?, ?)
  `, [cleanPhone, pointsToAdd, `Visite enregistrée par ${staffName || 'la caisse'}`, now]);

  return getLoyaltyMember(cleanPhone);
}


// ==========================================
// GESTION DES PRODUITS / PLATS (CRUD GÉRANT)
// ==========================================

export async function getAllProducts({ onlyAvailable = false } = {}) {
  let query = 'SELECT * FROM products';
  if (onlyAvailable) {
    query += ' WHERE is_available = 1';
  }
  query += ' ORDER BY id ASC';
  return await all(query);
}

export async function getProductById(id) {
  return await get('SELECT * FROM products WHERE id = ?', [id]);
}

export async function createProduct({ name, category, price, description, image, is_available = 1, portions_json, stock_quantity = 10 }) {
  if (!name || !price) throw new Error('Le nom et le prix du plat sont obligatoires');
  const now = new Date().toISOString();
  const numPrice = Math.max(500, Number(price)); // Minimum 500 FCFA
  const numStock = Math.max(0, parseInt(stock_quantity, 10) || 0);
  const portionsStr = typeof portions_json === 'string' ? portions_json : JSON.stringify(portions_json || []);

  const res = await run(`
    INSERT INTO products (name, category, price, description, image, is_available, portions_json, stock_quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    name.trim(),
    category ? category.trim() : 'Gâteaux',
    numPrice,
    description ? description.trim() : '',
    image ? image.trim() : 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1080',
    is_available ? 1 : 0,
    portionsStr,
    numStock,
    now,
    now
  ]);

  return getProductById(res.lastID);
}

export async function updateProduct(id, { name, category, price, description, image, is_available, portions_json, stock_quantity }) {
  const prod = await getProductById(id);
  if (!prod) throw new Error('Plat introuvable');

  const now = new Date().toISOString();
  const numPrice = price !== undefined ? Math.max(500, Number(price)) : prod.price;
  const numStock = stock_quantity !== undefined ? Math.max(0, parseInt(stock_quantity, 10) || 0) : (prod.stock_quantity ?? 10);
  const portionsStr = portions_json !== undefined ? (typeof portions_json === 'string' ? portions_json : JSON.stringify(portions_json)) : (prod.portions_json || '[]');

  await run(`
    UPDATE products SET
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      price = ?,
      description = COALESCE(?, description),
      image = COALESCE(?, image),
      is_available = COALESCE(?, is_available),
      portions_json = ?,
      stock_quantity = ?,
      updated_at = ?
    WHERE id = ?
  `, [
    name ? name.trim() : prod.name,
    category ? category.trim() : prod.category,
    numPrice,
    description !== undefined ? description.trim() : prod.description,
    image !== undefined ? image.trim() : prod.image,
    is_available !== undefined ? (is_available ? 1 : 0) : prod.is_available,
    portionsStr,
    numStock,
    now,
    id
  ]);

  return getProductById(id);
}

export async function deleteProduct(id) {
  const prod = await getProductById(id);
  if (!prod) throw new Error('Plat introuvable');

  await run('DELETE FROM products WHERE id = ?', [id]);
  return { success: true, message: `Plat "${prod.name}" supprimé avec succès` };
}

// ==========================================
// STATISTIQUES DÉTAILLÉES & RAPPORTS GÉRANCE
// ==========================================

export async function getAdminDetailedStats() {
  const orders = await all('SELECT * FROM orders ORDER BY created_at DESC');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // 7 jours en arrière
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let totalRevenue = 0;
  let todayRevenue = 0;
  let weekRevenue = 0;
  let paidOrdersCount = 0;
  let pendingOrdersCount = 0;
  let preparingOrdersCount = 0;
  let readyOrdersCount = 0;
  let cancelledOrdersCount = 0;

  // Ventes par jour sur les 7 derniers jours
  const dailySalesMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().slice(0, 10);
    dailySalesMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
  }

  // Top plats vendus
  const productSalesMap = {};

  for (const o of orders) {
    const amount = Number(o.montant_total) || 0;
    const isPaid = ['EN_PREPARATION', 'PRETE', 'LIVREE', 'PAYEE'].includes(o.statut);
    const orderDateStr = (o.created_at || '').slice(0, 10);
    const orderDate = new Date(o.created_at);

    if (o.statut === 'EN_ATTENTE_DE_PAIEMENT') pendingOrdersCount++;
    else if (o.statut === 'EN_PREPARATION') preparingOrdersCount++;
    else if (o.statut === 'PRETE') readyOrdersCount++;
    else if (o.statut === 'ANNULEE') cancelledOrdersCount++;

    if (isPaid) {
      paidOrdersCount++;
      totalRevenue += amount;

      if (orderDateStr === todayStr) {
        todayRevenue += amount;
      }

      if (orderDate >= sevenDaysAgo) {
        weekRevenue += amount;
      }

      if (dailySalesMap[orderDateStr]) {
        dailySalesMap[orderDateStr].revenue += amount;
        dailySalesMap[orderDateStr].orders += 1;
      }

      // Analyser les articles pour le top des ventes
      try {
        const items = JSON.parse(o.items || '[]');
        if (Array.isArray(items)) {
          for (const item of items) {
            const name = item.name || 'Plat inconnu';
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;

            if (!productSalesMap[name]) {
              productSalesMap[name] = {
                name,
                image: item.image || '',
                quantitySold: 0,
                totalRevenue: 0
              };
            }
            productSalesMap[name].quantitySold += qty;
            productSalesMap[name].totalRevenue += (price * qty);
          }
        }
      } catch (e) {}
    }
  }

  const averageOrderValue = paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0;

  // Trier les top plats par quantité vendue
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);

  // Statistiques de fidélité
  const members = await all('SELECT * FROM loyalty_members');
  const totalPoints = members.reduce((sum, m) => sum + (m.points || 0), 0);
  const goldCount = members.filter(m => m.tier === 'GOLD').length;
  const silverCount = members.filter(m => m.tier === 'SILVER').length;
  const bronzeCount = members.filter(m => m.tier === 'BRONZE').length;

  const coupons = await all('SELECT * FROM loyalty_coupons');
  const activeCoupons = coupons.filter(c => c.status === 'ACTIVE').length;
  const usedCoupons = coupons.filter(c => c.status === 'USED').length;

  return {
    kpis: {
      totalRevenue,
      todayRevenue,
      weekRevenue,
      paidOrdersCount,
      pendingOrdersCount,
      preparingOrdersCount,
      readyOrdersCount,
      cancelledOrdersCount,
      totalOrdersCount: orders.length,
      averageOrderValue
    },
    dailySales: Object.values(dailySalesMap),
    topProducts,
    loyaltyStats: {
      totalMembers: members.length,
      totalPoints,
      goldCount,
      silverCount,
      bronzeCount,
      activeCoupons,
      usedCoupons
    }
  };
}



export default {
  getAdminUserByEmail,
  getAdminUserById,
  getAllAdminUsers,
  createAdminUser,
  updateAdminUserStatus,
  deleteAdminUser,
  updateAdminUserLastLogin,
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
  registerLoyaltyMember,
  loginLoyaltyMember,
  getAllLoyaltyMembers,
  creditOrderPoints,
  redeemPoints,
  adjustMemberPoints,
  verifyStaffPin,
  getAllEmployees,
  addEmployee,
  deleteEmployee,
  getLoyaltyRewards,
  createLoyaltyReward,
  deleteLoyaltyReward,
  claimRewardCoupon,
  getMemberCoupons,
  validateCouponCode,
  recordClientVisit,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminDetailedStats,
  getAnnouncementBanner,
  updateAnnouncementBanner,
  getDeliverySettings,
  updateDeliverySettings,
  calculateDeliveryFee,
  updateOrderPaymentInfo
};

// ==========================================
// GESTION DES ACCÈS & PERSONNEL (RBAC)
// ==========================================

export async function getAdminUserByEmail(email) {
  if (!email) return null;
  const user = await get('SELECT * FROM admin_users WHERE email = ?', [email.trim().toLowerCase()]);
  return user || null;
}

export async function getAdminUserById(id) {
  if (!id) return null;
  const user = await get('SELECT id, name, email, role, status, created_at, updated_at, last_login_at FROM admin_users WHERE id = ?', [id]);
  return user || null;
}

export async function getAllAdminUsers() {
  const users = await all('SELECT id, name, email, role, status, created_at, updated_at, last_login_at FROM admin_users ORDER BY id ASC');
  return users || [];
}

export async function createAdminUser({ name, email, password, role = 'employe' }) {
  if (!name || !email || !password) {
    throw new Error('Nom, adresse email et mot de passe sont obligatoires');
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const validRole = ['gerant', 'employe'].includes(role) ? role : 'employe';

  if (password.length < 8) {
    throw new Error('Le mot de passe doit comporter au moins 8 caractères');
  }

  const existing = await get('SELECT id FROM admin_users WHERE email = ?', [cleanEmail]);
  if (existing) {
    throw new Error('Un compte utilisateur existe déjà avec cette adresse email');
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();

  const res = await run(
    'INSERT INTO admin_users (name, email, password_hash, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [cleanName, cleanEmail, hash, validRole, 'active', now, now]
  );

  return {
    id: res.lastID,
    name: cleanName,
    email: cleanEmail,
    role: validRole,
    status: 'active',
    created_at: now
  };
}

export async function updateAdminUserStatus(id, status) {
  if (!['active', 'blocked'].includes(status)) {
    throw new Error('Statut invalide (doit être "active" ou "blocked")');
  }
  const user = await get('SELECT * FROM admin_users WHERE id = ?', [id]);
  if (!user) throw new Error('Utilisateur introuvable');

  // Si on tente de bloquer un gérant, vérifier qu'il reste au moins 1 gérant actif
  if (user.role === 'gerant' && status === 'blocked') {
    const activeGerants = await get("SELECT COUNT(*) as count FROM admin_users WHERE role = 'gerant' AND status = 'active' AND id != ?", [id]);
    if (!activeGerants || activeGerants.count === 0) {
      throw new Error('Impossible de bloquer le dernier compte Gérant actif');
    }
  }

  const now = new Date().toISOString();
  await run('UPDATE admin_users SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
  return getAdminUserById(id);
}

export async function deleteAdminUser(id) {
  const user = await get('SELECT * FROM admin_users WHERE id = ?', [id]);
  if (!user) throw new Error('Utilisateur introuvable');

  // Empêcher de supprimer le dernier compte Gérant
  if (user.role === 'gerant') {
    const gerantCount = await get("SELECT COUNT(*) as count FROM admin_users WHERE role = 'gerant'");
    if (gerantCount && gerantCount.count <= 1) {
      throw new Error('Impossible de supprimer le dernier compte Gérant du système');
    }
  }

  await run('DELETE FROM admin_users WHERE id = ?', [id]);
  return { success: true };
}

export async function updateAdminUserLastLogin(id) {
  const now = new Date().toISOString();
  await run('UPDATE admin_users SET last_login_at = ? WHERE id = ?', [now, id]);
}

// ==========================================
// BANDEAU DÉFILANT D'ANNONCE & PROMOTIONS
// ==========================================
export async function getAnnouncementBanner() {
  let banner = await get('SELECT * FROM announcement_banner WHERE id = 1');
  if (!banner) {
    await run(`INSERT OR IGNORE INTO announcement_banner (id, message, is_permanent, start_date, end_date, text_color, bg_color, is_active)
      VALUES (1, '✦ OFFRE SPÉCIALE : -10% sur votre commande avec le code « DOUCEUR10 » ✦ Inscription fidélité offerte dès aujourd''hui ✦ Livraison soignée à domicile ✦', 1, '', '', '#FFFFFF', '#3B0764', 1)`);
    banner = await get('SELECT * FROM announcement_banner WHERE id = 1');
  }
  return banner;
}

export async function updateAnnouncementBanner({ message, is_permanent, start_date, end_date, text_color, bg_color, is_active }) {
  await getAnnouncementBanner(); // assure l'existence
  await run(`
    UPDATE announcement_banner SET
      message = ?,
      is_permanent = ?,
      start_date = ?,
      end_date = ?,
      text_color = ?,
      bg_color = ?,
      is_active = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `, [
    message,
    is_permanent ? 1 : 0,
    start_date || '',
    end_date || '',
    text_color || '#FFFFFF',
    bg_color || '#3B0764',
    is_active !== undefined ? (is_active ? 1 : 0) : 1
  ]);
  return getAnnouncementBanner();
}

// ==========================================
// CONFIGURATION DE LA LIVRAISON AU KILOMÈTRE & QUARTIERS
// ==========================================
const DEFAULT_NEIGHBORHOODS = [
  { name: 'Koulouba', fee: 1000 },
  { name: 'Zone du Bois', fee: 1000 },
  { name: 'Dassasgho', fee: 1000 },
  { name: 'Gounghin', fee: 1000 },
  { name: 'Patte d\'Oie', fee: 1200 },
  { name: 'Ouaga 2000', fee: 1500 },
  { name: 'Somgandé', fee: 1500 },
  { name: 'Pissy', fee: 1800 },
  { name: 'Karpala', fee: 2000 },
  { name: 'Tampouy', fee: 2000 },
  { name: 'Kossodo', fee: 2000 },
  { name: 'Saaba', fee: 2500 }
];

export async function getDeliverySettings() {
  let settings = await get('SELECT * FROM delivery_settings WHERE id = 1');
  if (!settings) {
    await run(`INSERT OR IGNORE INTO delivery_settings (id, price_per_km, min_fee, free_threshold, origin_lat, origin_lng, origin_address, is_active, neighborhoods)
      VALUES (1, 250, 1000, 50000, 12.3714, -1.5197, 'Atelier Les Douceurs de Lê Ci, Ouagadougou', 1, ?)`, [JSON.stringify(DEFAULT_NEIGHBORHOODS)]);
    settings = await get('SELECT * FROM delivery_settings WHERE id = 1');
  }
  let neighborhoods = DEFAULT_NEIGHBORHOODS;
  if (settings?.neighborhoods) {
    try {
      const parsed = JSON.parse(settings.neighborhoods);
      if (Array.isArray(parsed) && parsed.length > 0) {
        neighborhoods = parsed;
      }
    } catch (e) {}
  }
  return {
    id: 1,
    price_per_km: Number(settings?.price_per_km) || 250,
    min_fee: Number(settings?.min_fee) || 1000,
    free_threshold: Number(settings?.free_threshold) || 50000,
    origin_lat: Number(settings?.origin_lat) || 12.3714,
    origin_lng: Number(settings?.origin_lng) || -1.5197,
    origin_address: settings?.origin_address || 'Atelier Les Douceurs de Lê Ci, Ouagadougou',
    is_active: settings?.is_active === 1 || settings?.is_active === true,
    neighborhoods
  };
}

export async function updateDeliverySettings({ price_per_km, min_fee, free_threshold, origin_lat, origin_lng, origin_address, is_active, neighborhoods }) {
  const current = await getDeliverySettings(); // assure l'existence
  const finalNeighborhoods = Array.isArray(neighborhoods) ? neighborhoods : current.neighborhoods;
  await run(`
    UPDATE delivery_settings SET
      price_per_km = ?,
      min_fee = ?,
      free_threshold = ?,
      origin_lat = ?,
      origin_lng = ?,
      origin_address = ?,
      is_active = ?,
      neighborhoods = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `, [
    price_per_km !== undefined ? Number(price_per_km) : current.price_per_km,
    min_fee !== undefined ? Number(min_fee) : current.min_fee,
    free_threshold !== undefined ? Number(free_threshold) : current.free_threshold,
    origin_lat !== undefined ? Number(origin_lat) : current.origin_lat,
    origin_lng !== undefined ? Number(origin_lng) : current.origin_lng,
    origin_address || current.origin_address,
    is_active !== undefined ? (is_active ? 1 : 0) : (current.is_active ? 1 : 0),
    JSON.stringify(finalNeighborhoods)
  ]);
  return getDeliverySettings();
}

export async function calculateDeliveryFee({ customerLat, customerLng, totalCartAmount = 0, manualDistanceKm = null }) {
  const settings = await getDeliverySettings();
  let distanceKm = 0;

  if (manualDistanceKm !== null && manualDistanceKm !== undefined && !isNaN(manualDistanceKm) && manualDistanceKm > 0) {
    distanceKm = Math.round(Number(manualDistanceKm) * 10) / 10;
  } else if (customerLat && customerLng) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // Rayon moyen Terre en km
    const dLat = toRad(Number(customerLat) - settings.origin_lat);
    const dLng = toRad(Number(customerLng) - settings.origin_lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(settings.origin_lat)) * Math.cos(toRad(Number(customerLat))) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Majoration de 1.35x pour tenir compte du trajet réel routier à Ouagadougou
    distanceKm = Math.max(0.5, Math.round((R * c * 1.35) * 10) / 10);
  }

  // Spécification Notion officielle (28/10/26) :
  // De 0 à 3,5 km : 1000 F.
  // Au-delà : proportionnel à la distance (si 3,5 km = 1000 F, alors 7 km = 2000 F).
  // Résultat arrondi à la centaine de francs.
  let calculatedFee = 1000;
  if (distanceKm <= 3.5) {
    calculatedFee = 1000;
  } else {
    calculatedFee = Math.round(((distanceKm / 3.5) * 1000) / 100) * 100;
  }

  // Vérification de gratuité éventuelle si seuil atteint
  const isFree = settings.free_threshold > 0 && totalCartAmount >= settings.free_threshold;
  if (isFree) {
    calculatedFee = 0;
  }

  return {
    success: true,
    distanceKm,
    pricePerKm: Math.round(1000 / 3.5),
    minFee: 1000,
    freeThreshold: settings.free_threshold,
    isFree,
    deliveryFee: calculatedFee,
    originLat: settings.origin_lat,
    originLng: settings.origin_lng,
    originAddress: settings.origin_address
  };
}

export async function updateOrderPaymentInfo(id, { payerName, payerPhone, paymentMethod }) {
  const row = await get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!row) throw new Error('Commande non trouvée');

  const cleanNotes = (row.notes || '').replace(/\s*\[Paiement Mobile:[^\]]+\]/g, '');
  const notesSuffix = ` [Paiement Mobile: ${paymentMethod || 'Non spécifié'} | Payeur: ${payerName || 'Non précisé'} (${payerPhone || ''})]`;
  const updatedNotes = cleanNotes + notesSuffix;

  await run(
    `UPDATE orders SET mode_paiement = ?, payer_name = ?, payer_phone = ?, notes = ? WHERE id = ?`,
    [paymentMethod || row.mode_paiement, payerName || '', payerPhone || '', updatedNotes, id]
  );
  return getOrderById(id);
}
