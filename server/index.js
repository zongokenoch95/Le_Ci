import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
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
// PARSER LEXICAL SMS ORANGE MONEY
// ==========================================
export function parsePaymentNotification(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { amount: null, senderPhone: null, transactionRef: null, codeReference: null };
  }

  const text = rawText.trim();

  // 1. Montant
  let amount = null;
  const amountMatch = text.match(/(?:re[cç]u|montant|payer|pay[eé]|somme)?\s*:?\s*([\d\s.,]+)\s*(?:FCFA|F\s*CFA|XOF|DT|Dinar|F\b)/i);
  if (amountMatch && amountMatch[1]) {
    const cleaned = amountMatch[1].replace(/[\s.,]/g, '').trim();
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed) && parsed > 0) amount = parsed;
  }
  if (!amount) {
    const fallbackMatch = text.match(/(\d+[\s\d]*)\s*(?:FCFA|F\s*CFA|XOF|DT|F\b)/i);
    if (fallbackMatch && fallbackMatch[1]) {
      const cleaned = fallbackMatch[1].replace(/\s/g, '');
      const parsed = parseInt(cleaned, 10);
      if (!isNaN(parsed) && parsed > 0) amount = parsed;
    }
  }

  // 2. Numéro de téléphone expéditeur (8 chiffres)
  let senderPhone = null;
  const phoneMatch = text.match(/(?:de|du|exp[eé]diteur|client|num[eé]ro)?\s*:?\s*(?:\+?\d{2,3})?\s*([0-9]\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/i);
  if (phoneMatch && phoneMatch[1]) {
    senderPhone = phoneMatch[1].replace(/[\s.-]/g, '');
  }

  // 3. Référence Transaction (Trans ID, TxId, Ref Trans)
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

  return { amount, senderPhone, transactionRef, codeReference };
}

// ==========================================
// WEBHOOK RECONCILIATION
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
  console.log(`📥 [Webhook Orange Money - ${timestamp}] Requête reçue :`, {
    path: req.path,
    body: req.body
  });

  if (!verifyWebhookSecret(req)) {
    console.warn(`⛔ [Webhook] Rejet : Secret invalide ou absent`);
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
    const finalSender = explicitSender ? String(explicitSender).replace(/\D/g, '').slice(-8) : parsed.senderPhone;
    const finalRef = explicitRef || parsed.transactionRef;
    const finalCodeRef = explicitCodeRef ? String(explicitCodeRef).trim().toUpperCase() : parsed.codeReference;

    console.log(`🔍 [Webhook Orange Money] Données réconciliées :`, {
      amount: finalAmount,
      senderPhone: finalSender,
      transactionRef: finalRef,
      codeReference: finalCodeRef
    });

    const reconciliation = await db.reconcilePaymentWebhook({
      rawMessage,
      senderPhone: finalSender,
      amount: finalAmount,
      transactionRef: finalRef,
      codeReference: finalCodeRef
    });

    if (reconciliation.matched && !reconciliation.duplicate) {
      console.log(`✅ [Webhook] Commande ${reconciliation.order.id} validée ! Diffusion temps réel...`);
      emitOrderValidated(reconciliation.order);
    }

    return res.json({
      success: true,
      matched: reconciliation.matched,
      duplicate: reconciliation.duplicate || false,
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

const isDirect = !process.argv[1] || process.argv[1].includes('index.js') || process.argv[1].includes('server');
if (isDirect && !process.argv[1].includes('api.test.js')) {
  server.listen(PORT, () => {
    console.log(`🚀 [Les Douceurs de Lê Ci] Serveur de paiement démarré sur http://localhost:${PORT}`);
  });
}

export { app, server, io };
