import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: ['text/*', 'application/text'] }));

// ==========================================
// RATE LIMITING (anti-DoS / anti-SMS bombing)
// Faille #11 de l'audit security.md
// ==========================================

// Limite stricte sur les webhooks : 30 requêtes / minute / IP
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Trop de requêtes. Limite : 30 par minute. Réessayez plus tard.'
  },
  handler: async (req, res, next, options) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    console.warn(`🚫 [Rate Limit] IP ${ip} bloquée sur ${req.path}`);

    // Log d'audit pour le rate limiting
    try {
      await db.logAuditEvent({
        eventType: 'RATE_LIMITED',
        ipAddress: ip,
        rawPayload: JSON.stringify(req.body)?.slice(0, 500),
        result: 'REJECTED',
        details: `IP ${ip} bloquée — dépassement de la limite de 30 req/min sur ${req.path}`
      });
    } catch (e) {}

    res.status(options.statusCode).json(options.message);
  }
});

// Limite générale API : 100 requêtes / minute / IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Trop de requêtes API. Limite : 100 par minute.'
  }
});

// Appliquer le rate limiting
app.use('/api/webhooks', webhookLimiter);
app.use('/api', apiLimiter);

// Middleware de tolérance JSON mobile (SMS / MacroDroid)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && (err.status === 400 || 'body' in err)) {
    console.warn('⚠️ [Webhook] JSON mobile mal formé. Réparation automatique...');
    const raw = req.rawBody || err.body || '';
    try {
      const fixed = String(raw).replace(/[\r\n]+/g, ' ').replace(/'/g, '"');
      req.body = JSON.parse(fixed);
      return next();
    } catch (e) {
      req.body = { message: String(raw) };
      return next();
    }
  }
  next(err);
});

// ==========================================
// SOCKET.IO (TEMPS RÉEL)
// ==========================================
io.on('connection', (socket) => {
  socket.on('join:order', (orderId) => {
    if (orderId) socket.join(`order:${orderId}`);
  });

  socket.on('leave:order', (orderId) => {
    if (orderId) socket.leave(`order:${orderId}`);
  });

  socket.on('join:admin', () => {
    socket.join('staff:admin');
  });
});

export function emitOrderCreated(order) {
  io.to('staff:admin').emit('order:created', order);
  io.emit('order:new', order);
}

export function emitOrderValidated(order) {
  io.to(`order:${order.id}`).emit('order:status_changed', { orderId: order.id, statut: order.statut, order });
  io.to('staff:admin').emit('order:validated', order);
}

export function emitOrderCancelled(order) {
  io.to(`order:${order.id}`).emit('order:status_changed', { orderId: order.id, statut: order.statut, order });
  io.to('staff:admin').emit('order:cancelled', order);
}

export function emitOrderExpired(orderId) {
  io.to(`order:${orderId}`).emit('order:status_changed', { orderId, statut: 'ANNULEE' });
  io.to('staff:admin').emit('order:expired', { id: orderId });
}

export function emitOrderReady(order) {
  io.to(`order:${order.id}`).emit('order:status_changed', { orderId: order.id, statut: order.statut, order });
  io.to('staff:admin').emit('order:ready', order);
}

// Notification spécifique : montant élevé en attente de vérification
export function emitHighValueFlagged(order) {
  io.to(`order:${order.id}`).emit('order:status_changed', { orderId: order.id, statut: order.statut, order });
  io.to('staff:admin').emit('order:high_value_flagged', order);
}

// Vérification continue de l'expiration TTL (10 min)
setInterval(async () => {
  try {
    const expiredIds = await db.checkAndExpireOrders();
    if (expiredIds && expiredIds.length > 0) {
      for (const id of expiredIds) {
        emitOrderExpired(id);
      }
    }
  } catch (err) {}
}, 5000);

await db.initDb();

// ==========================================
// PARSER LEXICAL SMS ORANGE MONEY (Adapté aux SMS réels BF)
// ==========================================
export function parsePaymentNotification(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { amount: null, senderPhone: null, senderName: null, transactionRef: null, codeReference: null };
  }

  const text = rawText.trim();

  // 1. Montant (gère '350.0 FCFA', '1000.0 FCFA', '10 000 FCFA', '10.000 FCFA')
  let amount = null;
  const amountMatch = text.match(/(?:re[cç]u|montant|payer|pay[eé]|somme)?\s*:?\s*([\d\s.,]+)\s*(?:FCFA|F\s*CFA|XOF|DT|Dinar|F\b)/i);
  if (amountMatch && amountMatch[1]) {
    const rawVal = amountMatch[1].trim().replace(/\s+/g, '');
    if (/^[0-9]+\.[0-9]{1,2}$/.test(rawVal)) {
      // Ex: 350.0 ou 1500.50 -> 350 ou 1501
      amount = Math.round(parseFloat(rawVal));
    } else if (/^[0-9]+,[0-9]{1,2}$/.test(rawVal)) {
      // Ex: 350,0 -> 350
      amount = Math.round(parseFloat(rawVal.replace(',', '.')));
    } else if (/^[0-9]{4,}\.[0-9]{3}$/.test(rawVal)) {
      // Solde avec 3 décimales (ex: 10522.685)
      amount = Math.round(parseFloat(rawVal));
    } else if (/^[0-9]{1,3}\.[0-9]{3}$/.test(rawVal)) {
      // Milliers (ex: 10.000 ou 25.000)
      amount = parseInt(rawVal.replace(/\./g, ''), 10);
    } else {
      const parsed = parseInt(rawVal.replace(/[^\d]/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) amount = parsed;
    }
  }

  // 2. Numéro de téléphone expéditeur & Nom client
  // Format exact Orange Money : 'du 46545478,KISWENDSIDA ENOCH.'
  let senderPhone = null;
  let senderName = null;
  const detailedSenderMatch = text.match(/(?:du|de)\s+(?:\+?226)?([0-9]{8})\s*(?:,\s*([^.]+?))?\./i);
  if (detailedSenderMatch) {
    senderPhone = detailedSenderMatch[1];
    senderName = detailedSenderMatch[2] ? detailedSenderMatch[2].trim() : null;
  } else {
    // Fallback téléphone général
    const phoneMatch = text.match(/(?:de|du|exp[eé]diteur|client|num[eé]ro)?\s*:?\s*(?:\+?226|\+?\d{2,3})?\s*([0-9]\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/i);
    if (phoneMatch && phoneMatch[1]) {
      senderPhone = phoneMatch[1].replace(/[\s.-]/g, '');
    }
  }

  // 3. Référence Transaction (Trans ID: PP...)
  let transactionRef = null;
  const refMatch = text.match(/(?:Trans(?:\.|\s+)?ID|R[eé]f(?:\.|\s+)?Trans(?:action)?|ID(?:\.|\s+)?Trans(?:action)?|TxId|Transaction\s*(?:N[°o]|ID|Ref)?)\s*:?\s*([A-Za-z0-9_.-]+)/i);
  if (refMatch && refMatch[1]) {
    transactionRef = refMatch[1].trim().replace(/[.,;:]+$/, '');
  }

  // 4. Code Référence Marchand (ex: "ref K9X2", "Code: K9X2")
  let codeReference = null;
  const codeRefMatch = text.match(/(?:code\s*r[eé]f(?:[eé]rence)?|r[eé]f(?:\.|\s+)?(?!\s*id|\s*trans)|r[eé]f[eé]rence)\s*:?\s*([A-Za-z0-9]{4,8})/i);
  if (codeRefMatch && codeRefMatch[1]) {
    codeReference = codeRefMatch[1].trim().toUpperCase();
  }

  return { amount, senderPhone, senderName, transactionRef, codeReference };
}

// ==========================================
// WEBHOOK RECONCILIATION (avec audit intégré)
// ==========================================
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'resto_secret_2026';

export function verifyWebhookSecret(req) {
  const secretHeader = req.headers['x-webhook-secret'] || req.headers['x-secret-token'];
  const secretQuery = req.query.secret;
  const provided = secretHeader || secretQuery;
  return Boolean(provided && provided === WEBHOOK_SECRET);
}

async function handleWebhook(req, res) {
  const timestamp = new Date().toISOString();
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';

  console.log(`📥 [Webhook Orange Money - ${timestamp}] Requête reçue :`, {
    path: req.path,
    ip: clientIp,
    body: req.body
  });

  // Log d'audit : réception du webhook
  await db.logAuditEvent({
    eventType: 'WEBHOOK_RECEIVED',
    ipAddress: clientIp,
    rawPayload: JSON.stringify(req.body),
    result: 'PENDING',
    details: `Webhook reçu sur ${req.path} depuis IP ${clientIp}`
  });

  if (!verifyWebhookSecret(req)) {
    console.warn(`⛔ [Webhook] Rejet : Secret invalide ou absent (IP: ${clientIp})`);

    // Log d'audit : rejet secret
    await db.logAuditEvent({
      eventType: 'SECRET_REJECTED',
      ipAddress: clientIp,
      rawPayload: JSON.stringify(req.body),
      result: 'REJECTED',
      details: `Secret webhook invalide ou absent depuis IP ${clientIp}`
    });

    return res.status(401).json({
      success: false,
      error: "Accès non autorisé : header 'x-webhook-secret' manquant ou invalide"
    });
  }

  try {
    const rawMessage = typeof req.body === 'string'
      ? req.body
      : (req.body?.message || req.body?.sms_body || req.body?.text || '');

    const explicitSender = req.body?.sender || req.body?.sms_number || req.body?.phone;
    const explicitAmount = req.body?.amount || req.body?.montant;
    const explicitRef = req.body?.ref || req.body?.transaction_id || req.body?.txId || req.body?.transactionRef;
    const explicitCodeRef = req.body?.codeReference || req.body?.code_reference;

    const parsed = parsePaymentNotification(rawMessage);

    const finalAmount = explicitAmount ? parseInt(explicitAmount, 10) : parsed.amount;
    // Si explicitSender n'est pas un numéro (ex: "OrangeMoney"), utiliser parsed.senderPhone extrait du SMS
    const cleanExplicit = explicitSender ? String(explicitSender).replace(/\D/g, '') : '';
    const finalSender = cleanExplicit.length >= 8 ? cleanExplicit.slice(-8) : parsed.senderPhone;
    const finalRef = explicitRef || parsed.transactionRef;
    const finalCodeRef = explicitCodeRef ? String(explicitCodeRef).trim().toUpperCase() : parsed.codeReference;
    const finalSenderName = parsed.senderName || null;

    console.log(`🔍 [Webhook Orange Money] Données réconciliées :`, {
      amount: finalAmount,
      senderPhone: finalSender,
      transactionRef: finalRef,
      codeReference: finalCodeRef
    });

    const reconciliation = await db.reconcilePaymentWebhook({
      rawMessage,
      senderPhone: finalSender,
      senderName: finalSenderName,
      amount: finalAmount,
      transactionRef: finalRef,
      codeReference: finalCodeRef,
      ipAddress: clientIp
    });

    // Gestion des différents cas de réconciliation
    if (reconciliation.matched && !reconciliation.duplicate) {
      if (reconciliation.highValue) {
        // Montant élevé → notification spéciale au staff
        console.log(`⚠️ [Webhook] Commande ${reconciliation.order.id} — MONTANT ÉLEVÉ (${reconciliation.order.montantTotal} FCFA). En attente de vérification manuelle.`);
        emitHighValueFlagged(reconciliation.order);
      } else {
        // Validation normale
        console.log(`✅ [Webhook] Commande ${reconciliation.order.id} validée ! Diffusion temps réel...`);
        emitOrderValidated(reconciliation.order);
        // Crédit automatique des points de fidélité
        try {
          const credited = await db.creditOrderPoints(reconciliation.order);
          if (credited) {
            console.log(`🎁 [Fidélité] Points crédités pour ${credited.name} (${credited.phone}) : Total ${credited.points} pts (Palier ${credited.tier})`);
          }
        } catch (e) {
          console.error('[Fidélité] Erreur crédit points:', e);
        }
      }
    }

    return res.json({
      success: true,
      matched: reconciliation.matched,
      duplicate: reconciliation.duplicate || false,
      highValue: reconciliation.highValue || false,
      matchedBy: reconciliation.matchedBy || null,
      order: reconciliation.order || null,
      parsed: {
        amount: finalAmount,
        senderPhone: finalSender,
        transactionRef: finalRef,
        codeReference: finalCodeRef
      },
      message: reconciliation.message
    });
  } catch (err) {
    console.error("❌ [Webhook] Erreur :", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

app.post([
  '/api/webhooks/orange-money',
  '/api/webhooks/orange-money-notification'
], handleWebhook);

// Simulation de test directe depuis l'UI ou curl
app.post('/api/webhooks/simulate', async (req, res) => {
  const { message, amount, phone, codeReference, txId } = req.body;
  const mockBody = {
    message: message || `Paiement de ${amount || 75} FCFA recu de ${phone || '70123456'} ref ${codeReference || ''} Trans ID: ${txId || ('SIM-' + Date.now())}.`,
    amount,
    phone,
    codeReference,
    transactionRef: txId || ('SIM-' + Date.now())
  };
  req.body = mockBody;
  req.headers['x-webhook-secret'] = WEBHOOK_SECRET;
  return handleWebhook(req, res);
});

// ==========================================
// ROUTES REST COMMANDES
// ==========================================

// Santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Les Douceurs de Lê Ci Payment API', time: new Date() });
});

// Créer une commande (avec codeReference et TTL 10 min)
app.post('/api/orders', async (req, res) => {
  try {
    const order = await db.createOrder(req.body);
    emitOrderCreated(order);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Liste des commandes (avec filtre de statut)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.getAllOrders();
    const { status } = req.query;
    if (status) {
      return res.json(orders.filter(o => o.statut === status));
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Détail commande
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    const remainingSeconds = order.expiresAt
      ? Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000))
      : 0;

    res.json({
      ...order,
      remainingSeconds,
      tempsRestantSecondes: remainingSeconds
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Statut commande (Polling 3s)
app.get('/api/orders/:id/status', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    const remainingSeconds = order.expiresAt
      ? Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000))
      : 0;

    res.json({
      id: order.id,
      statut: order.statut,
      codeReference: order.codeReference,
      transactionRef: order.transactionRef,
      montantTotal: order.montantTotal,
      expiresAt: order.expiresAt,
      paidAt: order.paidAt,
      remainingSeconds,
      order
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Annulation client
app.post('/api/orders/:id/cancel', async (req, res) => {
  try {
    const order = await db.cancelOrder(req.params.id);
    emitOrderCancelled(order);
    res.json({ success: true, message: 'Commande annulée', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Validation manuelle (Caisse / Admin)
app.post('/api/orders/:id/validate', async (req, res) => {
  try {
    const order = await db.validateOrder(req.params.id);
    emitOrderValidated(order);
    try {
      await db.creditOrderPoints(order);
    } catch (e) {}
    res.json({ success: true, message: 'Commande validée manuellement', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Marquer comme prête
app.post('/api/orders/:id/finish', async (req, res) => {
  try {
    const order = await db.finishOrder(req.params.id);
    emitOrderReady(order);
    res.json({ success: true, message: 'Commande prête', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// ROUTES MONTANT ÉLEVÉ (vérification manuelle)
// ==========================================

// Approuver un paiement de montant élevé
app.post('/api/orders/:id/approve-high-value', async (req, res) => {
  try {
    const order = await db.approveHighValue(req.params.id);
    emitOrderValidated(order);
    try {
      await db.creditOrderPoints(order);
    } catch (e) {}
    res.json({
      success: true,
      message: `Commande ${order.id} approuvée manuellement (montant élevé : ${order.montantTotal} FCFA)`,
      order
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Rejeter un paiement de montant élevé
app.post('/api/orders/:id/reject-high-value', async (req, res) => {
  try {
    const order = await db.rejectHighValue(req.params.id);
    emitOrderCancelled(order);
    res.json({
      success: true,
      message: `Commande ${order.id} rejetée (montant élevé suspect)`,
      order
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// ROUTES JOURNAL D'AUDIT
// ==========================================

// Consulter les logs d'audit (admin)
app.get('/api/audit-logs', async (req, res) => {
  try {
    const { eventType, result, orderId, limit, offset } = req.query;
    const logs = await db.getAuditLogs({
      eventType,
      result,
      orderId,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0
    });
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Statistiques d'audit (dashboard admin)
app.get('/api/audit-stats', async (req, res) => {
  try {
    const stats = await db.getAuditStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// DISTRIBUTION DU FRONTEND (SPA VITE/REACT) EN PRODUCTION
// ==========================================
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const isDirect = !process.argv[1] || process.argv[1].includes('index.js') || process.argv[1].includes('server');
if (isDirect && !process.argv[1].includes('api.test.js')) {
  
// ==========================================
// ROUTES PROGRAMME DE FIDÉLISATION (Paramétrable par le gérant)
// ==========================================

// Obtenir la configuration actuelle du programme
app.get('/api/loyalty/settings', async (req, res) => {
  try {
    const settings = await db.getLoyaltySettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mettre à jour la configuration du programme (Gérant)
app.put('/api/loyalty/settings', async (req, res) => {
  try {
    const updated = await db.updateLoyaltySettings(req.body);
    res.json({ success: true, message: 'Paramètres de fidélité enregistrés', settings: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Consulter le solde et statut d'un membre par téléphone
app.get('/api/loyalty/member/:phone', async (req, res) => {
  try {
    const member = await db.getLoyaltyMember(req.params.phone);
    if (!member) {
      return res.status(404).json({ error: 'Membre non trouvé' });
    }
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir tous les membres (Espace Gérant)
app.get('/api/loyalty/members', async (req, res) => {
  try {
    const members = await db.getAllLoyaltyMembers();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Utiliser des points pour une réduction (Panier)
app.post('/api/loyalty/redeem', async (req, res) => {
  try {
    const { phone, pointsToRedeem, orderId } = req.body;
    const result = await db.redeemPoints({ phone, pointsToRedeem: Number(pointsToRedeem), orderId });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Ajustement manuel de points par le gérant
app.post('/api/loyalty/adjust', async (req, res) => {
  try {
    const { phone, name, pointsDelta, reason } = req.body;
    const member = await db.adjustMemberPoints({
      phone,
      name,
      pointsDelta: Number(pointsDelta),
      reason
    });
    res.json({ success: true, message: 'Points ajustés avec succès', member });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

server.listen(PORT, () => {
    console.log(`🚀 [Les Douceurs de Lê Ci] Serveur de paiement démarré sur http://localhost:${PORT}`);
    console.log(`🛡️ [Sécurité] Rate limiting actif — Webhooks: 30 req/min, API: 100 req/min`);
    console.log(`📋 [Audit] Journal d'audit actif — GET /api/audit-logs pour consulter`);
  });
}

export { app, server, io };
