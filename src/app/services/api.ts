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

// ==========================================
// AUTHENTIFICATION PAR CODE PIN & EMPLOYÉS
// ==========================================

export interface Employee {
  id: number;
  name: string;
  role: 'admin' | 'caissier' | 'patissier' | 'employee';
  created_at: string;
}

export interface LoyaltyReward {
  id: number;
  title: string;
  description?: string;
  points_cost: number;
  category?: string;
  image?: string;
  is_active: number;
}

export interface LoyaltyCoupon {
  id: number;
  code: string;
  reward_id: number;
  reward_title: string;
  phone: string;
  points_spent: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  created_at: string;
  used_at?: string;
  validated_by?: string;
}

export async function loginWithPin(pin: string): Promise<{ success: boolean; employee: Employee }> {
  const res = await fetch(`${API_BASE}/auth/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Code PIN incorrect');
  }
  return res.json();
}

export async function getEmployees(): Promise<Employee[]> {
  const res = await fetch(`${API_BASE}/employees`);
  if (!res.ok) throw new Error('Erreur chargement des employés');
  return res.json();
}

export async function addEmployee(data: { name: string; pin: string; role: string }): Promise<{ success: boolean; employee: Employee }> {
  const res = await fetch(`${API_BASE}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur création employé');
  }
  return res.json();
}

export async function deleteEmployee(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur suppression employé');
  }
  return res.json();
}

// ==========================================
// RÉCOMPENSES & COUPONS (fidelity.md)
// ==========================================

export async function getLoyaltyRewards(): Promise<LoyaltyReward[]> {
  const res = await fetch(`${API_BASE}/loyalty/rewards`);
  if (!res.ok) throw new Error('Erreur chargement des récompenses');
  return res.json();
}

export async function createLoyaltyReward(data: {
  title: string;
  description?: string;
  points_cost: number;
  category?: string;
  image?: string;
}): Promise<{ success: boolean; reward: any }> {
  const res = await fetch(`${API_BASE}/loyalty/rewards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur création récompense');
  }
  return res.json();
}

export async function deleteLoyaltyReward(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/loyalty/rewards/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur suppression récompense');
  return res.json();
}

export async function claimRewardCoupon(data: {
  phone: string;
  rewardId: number;
}): Promise<{ success: boolean; code: string; rewardTitle: string; pointsSpent: number; remainingPoints: number }> {
  const res = await fetch(`${API_BASE}/loyalty/coupons/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur échange récompense');
  }
  return res.json();
}

export async function getMemberCoupons(phone: string): Promise<LoyaltyCoupon[]> {
  const clean = phone.replace(/\D/g, '').slice(-8);
  const res = await fetch(`${API_BASE}/loyalty/coupons/member/${clean}`);
  if (!res.ok) throw new Error('Erreur lecture coupons');
  return res.json();
}

export async function validateCouponCode(data: {
  code: string;
  staffName?: string;
}): Promise<{ success: boolean; message: string; coupon: LoyaltyCoupon }> {
  const res = await fetch(`${API_BASE}/loyalty/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Coupon invalide ou déjà utilisé');
  }
  return res.json();
}

export async function recordClientVisit(data: {
  phone: string;
  name?: string;
  staffName?: string;
}): Promise<{ success: boolean; message: string; member: LoyaltyMember }> {
  const res = await fetch(`${API_BASE}/loyalty/record-visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur enregistrement visite');
  }
  return res.json();
}

export async function registerLoyaltyMember(data: {
  phone: string;
  name: string;
}): Promise<{ success: boolean; member: LoyaltyMember; message: string }> {
  const res = await fetch(`${API_BASE}/loyalty/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur lors de l\'inscription au programme de fidélité');
  }
  return res.json();
}

export async function loginLoyaltyMember(data: {
  phone: string;
  name?: string;
}): Promise<{ success: boolean; member: LoyaltyMember }> {
  const res = await fetch(`${API_BASE}/loyalty/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Compte introuvable');
  }
  return res.json();
}

// ==========================================
// GESTION DES PLATS / PRODUITS (CRUD GÉRANCE)
// ==========================================

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  is_available: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminDetailedStats {
  kpis: {
    totalRevenue: number;
    todayRevenue: number;
    weekRevenue: number;
    paidOrdersCount: number;
    pendingOrdersCount: number;
    preparingOrdersCount: number;
    readyOrdersCount: number;
    cancelledOrdersCount: number;
    totalOrdersCount: number;
    averageOrderValue: number;
  };
  dailySales: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    name: string;
    image: string;
    quantitySold: number;
    totalRevenue: number;
  }>;
  loyaltyStats: {
    totalMembers: number;
    totalPoints: number;
    goldCount: number;
    silverCount: number;
    bronzeCount: number;
    activeCoupons: number;
    usedCoupons: number;
  };
}

export async function getProducts(options?: { available?: boolean }): Promise<Product[]> {
  const url = options?.available ? `${API_BASE}/products?available=true` : `${API_BASE}/products`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur chargement des plats');
  return res.json();
}

export async function createProduct(data: {
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  is_available?: boolean | number;
}): Promise<{ success: boolean; product: Product; message: string }> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur lors de la création du plat');
  }
  return res.json();
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<{ success: boolean; product: Product; message: string }> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur lors de la modification du plat');
  }
  return res.json();
}

export async function deleteProduct(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur lors de la suppression du plat');
  }
  return res.json();
}

export async function getAdminDetailedStats(): Promise<AdminDetailedStats> {
  const res = await fetch(`${API_BASE}/admin/detailed-stats`);
  if (!res.ok) throw new Error('Erreur lecture des statistiques');
  return res.json();
}
