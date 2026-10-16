export interface OrderItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: OrderItem[];
  montantTotal: number;
  statut: 'EN_ATTENTE_DE_PAIEMENT' | 'PAYEE' | 'EN_PREPARATION' | 'PRETE' | 'LIVREE' | 'ANNULEE';
  codeReference?: string;
  transactionRef?: string;
  modePaiement?: string;
  notes?: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  remainingSeconds?: number;
}

const API_BASE = '/api';

export async function createOrder(data: {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: OrderItem[];
  montantTotal: number;
  modePaiement?: string;
  notes?: string;
}): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur lors de la création de la commande');
  }
  return res.json();
}

export async function getOrder(id: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`);
  if (!res.ok) throw new Error('Commande introuvable');
  return res.json();
}

export async function getOrderStatus(id: string): Promise<{
  id: string;
  statut: string;
  codeReference?: string;
  transactionRef?: string;
  montantTotal: number;
  remainingSeconds: number;
  order: Order;
}> {
  const res = await fetch(`${API_BASE}/orders/${id}/status`);
  if (!res.ok) throw new Error('Erreur lecture statut');
  return res.json();
}

export async function cancelOrder(id: string): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/orders/${id}/cancel`, { method: 'POST' });
  if (!res.ok) throw new Error('Impossible d\'annuler la commande');
  return res.json();
}

export async function getAdminOrders(status?: string): Promise<Order[]> {
  const url = status ? `${API_BASE}/orders?status=${encodeURIComponent(status)}` : `${API_BASE}/orders`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur chargement commandes');
  return res.json();
}

export async function validateOrder(id: string): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/orders/${id}/validate`, { method: 'POST' });
  if (!res.ok) throw new Error('Erreur validation commande');
  return res.json();
}

export async function finishOrder(id: string): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/orders/${id}/finish`, { method: 'POST' });
  if (!res.ok) throw new Error('Erreur marquage commande prête');
  return res.json();
}

export async function simulateWebhook(payload: {
  message?: string;
  amount?: number;
  phone?: string;
  codeReference?: string;
  txId?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/webhooks/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}
