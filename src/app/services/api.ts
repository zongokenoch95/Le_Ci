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

// ==========================================
// PROGRAMME DE FIDÉLISATION API
// ==========================================

export interface LoyaltySettings {
  id: number;
  enabled: number | boolean;
  fcfa_per_point: number;
  point_value_fcfa: number;
  min_points_to_redeem: number;
  welcome_bonus_points: number;
  silver_min_points: number;
  silver_discount_percent: number;
  gold_min_points: number;
  gold_discount_percent: number;
  updated_at?: string;
}

export interface LoyaltyMember {
  phone: string;
  name: string;
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  total_spent: number;
  orders_count: number;
  created_at: string;
  updated_at: string;
  history?: Array<{
    id: number;
    phone: string;
    order_id?: string;
    type: 'EARN' | 'REDEEM' | 'BONUS' | 'MANUAL_ADJUST';
    points: number;
    description: string;
    created_at: string;
  }>;
  settings?: LoyaltySettings;
}

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const res = await fetch(`${API_BASE}/loyalty/settings`);
  if (!res.ok) throw new Error('Erreur lecture paramètres fidélité');
  return res.json();
}

export async function updateLoyaltySettings(settings: Partial<LoyaltySettings>): Promise<{ success: boolean; settings: LoyaltySettings }> {
  const res = await fetch(`${API_BASE}/loyalty/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Erreur mise à jour paramètres fidélité');
  return res.json();
}

export async function getLoyaltyMember(phone: string): Promise<LoyaltyMember | null> {
  const cleanPhone = phone.replace(/\D/g, '').slice(-8);
  if (!cleanPhone) return null;
  const res = await fetch(`${API_BASE}/loyalty/member/${cleanPhone}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Erreur consultation fidélité');
  return res.json();
}

export async function getAllLoyaltyMembers(): Promise<LoyaltyMember[]> {
  const res = await fetch(`${API_BASE}/loyalty/members`);
  if (!res.ok) throw new Error('Erreur chargement membres fidélité');
  return res.json();
}

export async function redeemLoyaltyPoints(data: {
  phone: string;
  pointsToRedeem: number;
  orderId?: string;
}): Promise<{ success: boolean; discountAmount: number; remainingPoints: number; tier: string }> {
  const res = await fetch(`${API_BASE}/loyalty/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur utilisation points');
  }
  return res.json();
}

export async function adjustLoyaltyMember(data: {
  phone: string;
  name?: string;
  pointsDelta: number;
  reason?: string;
}): Promise<{ success: boolean; member: LoyaltyMember }> {
  const res = await fetch(`${API_BASE}/loyalty/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur ajustement points');
  }
  return res.json();
}
