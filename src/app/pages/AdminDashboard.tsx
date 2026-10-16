import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Package, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Send,
  Sparkles,
  Zap,
  Crown,
  Award,
  Gift,
  Settings,
  Save,
  Plus,
  Sliders,
  Users,
  Lock,
  LogOut,
  ShieldAlert,
  Check,
  X,
  UserPlus,
  Trash2,
  Ticket,
  Search,
  ScanLine,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { 
  getAdminOrders, 
  validateOrder, 
  finishOrder, 
  cancelOrder, 
  simulateWebhook, 
  Order, 
  loginWithPin, 
  getEmployees, 
  addEmployee, 
  deleteEmployee, 
  Employee,
  getLoyaltySettings, 
  updateLoyaltySettings, 
  getAllLoyaltyMembers, 
  adjustLoyaltyMember, 
  getLoyaltyRewards, 
  createLoyaltyReward, 
  deleteLoyaltyReward, 
  validateCouponCode, 
  recordClientVisit,
  LoyaltySettings, 
  LoyaltyMember, 
  LoyaltyReward 
} from '../services/api';
import { getSocket, joinAdmin } from '../services/socket';

export function AdminDashboard() {
  // Session & Auth PIN
  const [currentStaff, setCurrentStaff] = useState<Employee | null>(() => {
    try {
      const saved = localStorage.getItem('le_ci_staff_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Navigation Sidebar
  const [activeNav, setActiveNav] = useState<'orders' | 'fidelity' | 'employees' | 'simulator'>('orders');

  // Commandes KDS
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'cancelled'>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Employés
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPin, setNewEmpPin] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<'employee' | 'caissier' | 'patissier' | 'admin'>('caissier');
  const [empLoading, setEmpLoading] = useState(false);
  const [empSuccess, setEmpSuccess] = useState('');

  // Fidélité & Récompenses (fidelity.md)
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [loyaltyMembers, setLoyaltyMembers] = useState<LoyaltyMember[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [fidelitySubTab, setFidelitySubTab] = useState<'validate_coupon' | 'rewards' | 'settings' | 'members'>('validate_coupon');
  
  // Validation de coupon
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponResult, setCouponResult] = useState<any>(null);

  // Nouvelle récompense
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('25');
  const [newRewardCategory, setNewRewardCategory] = useState('Pâtisserie');
  const [newRewardDesc, setNewRewardDesc] = useState('');
  const [newRewardImage, setNewRewardImage] = useState('');

  // Simulation Webhook OM
  const [testAmount, setTestAmount] = useState('75');
  const [testPhone, setTestPhone] = useState('70123456');
  const [testCodeRef, setTestCodeRef] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Sauvegarde session staff
  const handleLogin = async (pinToTry: string) => {
    setPinLoading(true);
    setPinError('');
    try {
      const res = await loginWithPin(pinToTry);
      setCurrentStaff(res.employee);
      localStorage.setItem('le_ci_staff_session', JSON.stringify(res.employee));
      setPinInput('');
    } catch (err: any) {
      setPinError(err.message || 'Code PIN incorrect');
      setPinInput('');
    } finally {
      setPinLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentStaff(null);
    localStorage.removeItem('le_ci_staff_session');
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 6) {
      const next = pinInput + digit;
      setPinInput(next);
      if (next.length === 4) {
        handleLogin(next);
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError('');
  };

  // Chargement des données
  const fetchAllData = async () => {
    try {
      const [ord, emp, set, mem, rew] = await Promise.all([
        getAdminOrders(),
        getEmployees().catch(() => []),
        getLoyaltySettings().catch(() => null),
        getAllLoyaltyMembers().catch(() => []),
        getLoyaltyRewards().catch(() => [])
      ]);
      setOrders(ord);
      setEmployees(emp);
      setLoyaltySettings(set);
      setLoyaltyMembers(mem);
      setRewards(rew);
    } catch (err) {
      console.error('Erreur chargement données', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (currentStaff) {
      fetchAllData();
      joinAdmin();
      const socket = getSocket();

      const handleNewOrder = (newOrder: Order) => {
        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      };
      const handleValidated = (valOrder: Order) => {
        setOrders((prev) => prev.map((o) => (o.id === valOrder.id ? valOrder : o)));
      };
      const handleReady = (readyOrder: Order) => {
        setOrders((prev) => prev.map((o) => (o.id === readyOrder.id ? readyOrder : o)));
      };
      const handleCancelled = (cancOrder: Order) => {
        setOrders((prev) => prev.map((o) => (o.id === cancOrder.id ? cancOrder : o)));
      };

      socket.on('order:created', handleNewOrder);
      socket.on('order:new', handleNewOrder);
      socket.on('order:validated', handleValidated);
      socket.on('order:ready', handleReady);
      socket.on('order:cancelled', handleCancelled);

      return () => {
        socket.off('order:created', handleNewOrder);
        socket.off('order:new', handleNewOrder);
        socket.off('order:validated', handleValidated);
        socket.off('order:ready', handleReady);
        socket.off('order:cancelled', handleCancelled);
      };
    }
  }, [currentStaff]);

  // Actions Commandes
  const handleValidateOrder = async (order: Order) => {
    try {
      if (order.statut === 'EN_ATTENTE_DE_PAIEMENT') {
        const res = await validateOrder(order.id);
        setOrders((prev) => prev.map((o) => (o.id === order.id ? res.order : o)));
      } else if (order.statut === 'EN_PREPARATION') {
        const res = await finishOrder(order.id);
        setOrders((prev) => prev.map((o) => (o.id === order.id ? res.order : o)));
      }
    } catch (e: any) {
      alert(e.message || 'Erreur validation');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Voulez-vous vraiment annuler ou rejeter cette commande ?')) {
      try {
        const res = await cancelOrder(orderId);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      } catch (e: any) {
        alert(e.message || 'Erreur annulation');
      }
    }
  };

  // Actions Employés
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpLoading(true);
    setEmpSuccess('');
    try {
      const res = await addEmployee({
        name: newEmpName.trim(),
        pin: newEmpPin.trim(),
        role: newEmpRole
      });
      setEmployees((prev) => [...prev, res.employee]);
      setEmpSuccess(`✅ Employé ${res.employee.name} ajouté avec succès !`);
      setNewEmpName('');
      setNewEmpPin('');
      setTimeout(() => setEmpSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erreur ajout employé');
    } finally {
      setEmpLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (confirm('Supprimer cet employé ?')) {
      try {
        await deleteEmployee(id);
        setEmployees((prev) => prev.filter((e) => e.id !== id));
      } catch (err: any) {
        alert(err.message || 'Erreur suppression');
      }
    }
  };

  // Actions Coupons & Récompenses (fidelity.md)
  const handleValidateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponValidating(true);
    setCouponResult(null);
    try {
      const res = await validateCouponCode({
        code: couponCodeInput.trim(),
        staffName: currentStaff?.name || 'Personnel'
      });
      setCouponResult({ success: true, message: res.message, coupon: res.coupon });
      setCouponCodeInput('');
    } catch (err: any) {
      setCouponResult({ success: false, error: err.message || 'Coupon invalide' });
    } finally {
      setCouponValidating(false);
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardTitle.trim() || !newRewardCost) return;
    try {
      await createLoyaltyReward({
        title: newRewardTitle.trim(),
        points_cost: Number(newRewardCost),
        category: newRewardCategory,
        description: newRewardDesc.trim(),
        image: newRewardImage.trim() || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400'
      });
      setNewRewardTitle('');
      setNewRewardDesc('');
      setNewRewardImage('');
      const r = await getLoyaltyRewards();
      setRewards(r);
    } catch (err: any) {
      alert(err.message || 'Erreur création récompense');
    }
  };

  // Filtrage commandes
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = 
      orderStatusFilter === 'all' ||
      (orderStatusFilter === 'pending' && o.statut === 'EN_ATTENTE_DE_PAIEMENT') ||
      (orderStatusFilter === 'preparing' && o.statut === 'EN_PREPARATION') ||
      (orderStatusFilter === 'ready' && o.statut === 'PRETE') ||
      (orderStatusFilter === 'cancelled' && o.statut === 'ANNULEE');

    const matchesSearch = 
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.customerPhone && o.customerPhone.includes(orderSearch)) ||
      (o.codeReference && o.codeReference.toLowerCase().includes(orderSearch.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const pendingCount = orders.filter((o) => o.statut === 'EN_ATTENTE_DE_PAIEMENT').length;
  const preparingCount = orders.filter((o) => o.statut === 'EN_PREPARATION').length;

  // =========================================================================
  // ÉCRAN DE VERROUILLAGE / CODE PIN
  // =========================================================================
  if (!currentStaff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#111827] via-[#0F172A] to-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/15 p-8 rounded-3xl text-center shadow-2xl text-white"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock size={30} />
          </div>

          <h2 className="text-xl font-black tracking-tight mb-1">Espace Caisse & Gérance</h2>
          <p className="text-xs text-gray-300 mb-6">Saisissez votre code PIN d'accès</p>

          {/* Indicateur de saisie PIN */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  pinInput.length > idx
                    ? 'bg-[#D4AF37] border-[#D4AF37] scale-110 shadow-[0_0_10px_#D4AF37]'
                    : 'border-gray-500 bg-transparent'
                }`}
              />
            ))}
          </div>

          {pinError && (
            <div className="mb-4 p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold">
              {pinError}
            </div>
          )}

          {/* Clavier Numérique */}
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handlePinDigit(digit)}
                className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/20 active:scale-95 border border-white/10 text-xl font-bold text-white transition flex items-center justify-center shadow-sm"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={() => { setPinInput(''); setPinError(''); }}
              className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 border border-white/10 flex items-center justify-center"
            >
              Effacer
            </button>
            <button
              onClick={() => handlePinDigit('0')}
              className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/20 active:scale-95 border border-white/10 text-xl font-bold text-white transition flex items-center justify-center shadow-sm"
            >
              0
            </button>
            <button
              onClick={handlePinDelete}
              className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 text-sm font-bold text-gray-300 border border-white/10 flex items-center justify-center"
              aria-label="Supprimer"
            >
              ⌫
            </button>
          </div>

          <p className="text-[11px] text-gray-400">
            Code PIN Gérant par défaut : <strong className="text-[#D4AF37]">1234</strong>
          </p>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // TABLEAU DE BORD AVEC NAVIGATION EN SIDEBAR
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION GAUCHE */}
      <aside className="w-full md:w-64 bg-[#111827] text-white flex-shrink-0 flex flex-col justify-between border-r border-gray-800 z-30">
        <div>
          {/* Logo & Header Sidebar */}
          <div className="p-6 border-b border-gray-800 flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow" />
            <div>
              <h2 className="text-sm font-black text-white leading-tight">Les Douceurs de Lê Ci</h2>
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Caisse & KDS</span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveNav('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeNav === 'orders' 
                  ? 'bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} />
                <span>Commandes</span>
              </div>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveNav('fidelity')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeNav === 'fidelity' 
                  ? 'bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Crown size={18} />
              <span>Fidélité & Coupons</span>
            </button>

            {currentStaff.role === 'admin' && (
              <button
                onClick={() => setActiveNav('employees')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  activeNav === 'employees' 
                    ? 'bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users size={18} />
                  <span>Employés</span>
                </div>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
                  {employees.length}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveNav('simulator')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeNav === 'simulator' 
                  ? 'bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap size={18} />
              <span>Simulateur OM</span>
            </button>
          </nav>
        </div>

        {/* Profil Personnel & Déconnexion en bas de Sidebar */}
        <div className="p-4 border-t border-gray-800 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-bold text-xs flex-shrink-0">
                {currentStaff.name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{currentStaff.name}</p>
                <span className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-wider">
                  {currentStaff.role === 'admin' ? 'Administrateur' : 'Caisse'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        
        {/* ========================================================================= */}
        {/* VUE 1 : COMMANDES (CARTES CONFORMES À LA CAPTURE D'ÉCRAN) */}
        {/* ========================================================================= */}
        {activeNav === 'orders' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            
            {/* Barre de contrôle / En-tête */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Commandes KDS & Caisse</h1>
                <p className="text-xs text-gray-500">Validation temps réel instantanée Orange Money</p>
              </div>

              {/* Recherche rapide */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher (Nom, N°, Tél)..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <button
                  onClick={fetchAllData}
                  className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
                  title="Actualiser"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Filtres de statut */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { key: 'all', label: 'Toutes', count: orders.length },
                { key: 'pending', label: 'En attente paiement', count: pendingCount },
                { key: 'preparing', label: 'En préparation (Payées)', count: preparingCount },
                { key: 'ready', label: 'Prêtes', count: orders.filter((o) => o.statut === 'PRETE').length },
                { key: 'cancelled', label: 'Annulées', count: orders.filter((o) => o.statut === 'ANNULEE').length },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setOrderStatusFilter(f.key as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                    orderStatusFilter === f.key
                      ? 'bg-[#111827] text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-800 font-extrabold">
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* GRILLE DES CARTES DE COMMANDES (CONFORME À LA CAPTURE D'ÉCRAN) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => {
                const totalItemCount = order.items.reduce((sum, it) => sum + (it.quantity || 1), 0);
                const orderShortId = order.id.replace('CMD-', '#').slice(0, 10);
                const formattedDate = new Date(order.createdAt).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div>
                      {/* En-tête de la carte : Order #351 + Date + Avatar */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                            Order {orderShortId}
                          </h3>
                          <p className="text-xs text-gray-400 font-medium">
                            {formattedDate}
                          </p>
                          {order.customerName && (
                            <p className="text-xs font-bold text-gray-700 mt-1">
                              👤 {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ''}
                            </p>
                          )}
                        </div>

                        {/* Avatar rond du client en haut à droite */}
                        <div className="w-11 h-11 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm">
                          {order.customerName ? order.customerName.charAt(0).toUpperCase() : 'C'}
                        </div>
                      </div>

                      {/* Badge Statut */}
                      <div className="mb-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          order.statut === 'EN_ATTENTE_DE_PAIEMENT'
                            ? 'bg-amber-100 text-amber-800'
                            : (order.statut === 'EN_PREPARATION'
                              ? 'bg-blue-100 text-blue-800'
                              : (order.statut === 'PRETE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'))
                        }`}>
                          {order.statut.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Liste des articles avec photos rondes */}
                      <div className="space-y-4 my-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 py-1">
                            {/* Image ronde de la pâtisserie */}
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400'}
                              alt={item.name}
                              className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-gray-100 flex-shrink-0"
                            />

                            {/* Titre, sous-titre, prix et quantité */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 truncate">
                                {item.name}
                              </h4>
                              <p className="text-xs text-gray-400 truncate">
                                Pâtisserie fraîche artisanale
                              </p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-sm font-bold text-gray-900">
                                  {Number(item.price).toLocaleString('fr-FR')} FCFA
                                </span>
                                <span className="text-xs font-semibold text-gray-800">
                                  Qty: {item.quantity || 1}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Séparateur */}
                      <hr className="border-gray-100 my-4" />
                    </div>

                    {/* Bas de carte : Total + Boutons d'action croix rouge & coche verte */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block">
                          X{totalItemCount} Items
                        </span>
                        <span className="text-base font-black text-gray-900">
                          {order.montantTotal.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>

                      {/* Boutons d'action identiques à la capture */}
                      <div className="flex items-center gap-2.5">
                        {/* Bouton Rejeter / Annuler (Rose / Rouge avec croix X) */}
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="w-11 h-11 rounded-2xl border border-red-200 bg-red-50/60 hover:bg-red-100 active:scale-95 text-red-500 flex items-center justify-center transition shadow-sm"
                          title="Rejeter / Annuler"
                        >
                          <X size={20} strokeWidth={2.5} />
                        </button>

                        {/* Bouton Valider / Passer en préparation (Vert clair avec check ✓) */}
                        <button
                          onClick={() => handleValidateOrder(order)}
                          className="w-11 h-11 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 active:scale-95 text-emerald-600 flex items-center justify-center transition shadow-sm"
                          title={order.statut === 'EN_ATTENTE_DE_PAIEMENT' ? 'Valider le paiement' : 'Marquer comme prête'}
                        >
                          <Check size={20} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8">
                <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-700">Aucune commande trouvée</h3>
                <p className="text-xs text-gray-400 mt-1">Les nouvelles commandes s'afficheront ici en temps réel.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VUE 2 : FIDÉLITÉ & RÉCOMPENSES (fidelity.md) */}
        {/* ========================================================================= */}
        {activeNav === 'fidelity' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Programme de Fidélité RestoBoost</h1>
                <p className="text-xs text-gray-500">Validation de coupons clients, catalogue de récompenses et barème</p>
              </div>

              {/* Sous-onglets fidélité */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFidelitySubTab('validate_coupon')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    fidelitySubTab === 'validate_coupon' ? 'bg-[#D4AF37] text-white shadow-sm' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <ScanLine size={15} />
                  <span>Valider Coupon</span>
                </button>
                <button
                  onClick={() => setFidelitySubTab('rewards')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    fidelitySubTab === 'rewards' ? 'bg-[#D4AF37] text-white shadow-sm' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Gift size={15} />
                  <span>Récompenses ({rewards.length})</span>
                </button>
                <button
                  onClick={() => setFidelitySubTab('members')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    fidelitySubTab === 'members' ? 'bg-[#D4AF37] text-white shadow-sm' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Users size={15} />
                  <span>Membres ({loyaltyMembers.length})</span>
                </button>
              </div>
            </div>

            {/* Sous-onglet 1 : Valider un coupon client en caisse */}
            {fidelitySubTab === 'validate_coupon' && (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mx-auto">
                  <Ticket size={30} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Validation de Coupon Récompense</h3>
                  <p className="text-xs text-gray-500">Entrez le code à usage unique (ex: CPN-81586) présenté par le client</p>
                </div>

                <form onSubmit={handleValidateCoupon} className="space-y-4">
                  <input
                    type="text"
                    required
                    placeholder="Ex: CPN-81586"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    className="w-full text-center text-lg font-mono font-bold tracking-widest px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#D4AF37] focus:outline-none uppercase"
                  />
                  <button
                    type="submit"
                    disabled={couponValidating}
                    className="w-full py-3 px-6 rounded-2xl bg-[#111827] hover:bg-black text-white font-bold text-xs shadow-md transition"
                  >
                    {couponValidating ? 'Vérification...' : 'Valider & Consommer le Coupon'}
                  </button>
                </form>

                {couponResult && (
                  <div className={`p-4 rounded-2xl text-xs font-bold ${
                    couponResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {couponResult.success ? (
                      <div>
                        <p className="text-sm">🎉 {couponResult.message}</p>
                        <p className="text-[11px] font-normal text-emerald-600 mt-1">
                          Client : {couponResult.coupon.phone} • Validé par {couponResult.coupon.validated_by}
                        </p>
                      </div>
                    ) : (
                      <p>⚠️ {couponResult.error}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sous-onglet 2 : Catalogue des récompenses */}
            {fidelitySubTab === 'rewards' && (
              <div className="space-y-6">
                {/* Formulaire ajout récompense (Admin) */}
                {currentStaff.role === 'admin' && (
                  <form onSubmit={handleCreateReward} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Plus size={16} className="text-[#D4AF37]" />
                      <span>Ajouter une Récompense au Catalogue</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Titre de la pâtisserie *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Éclair Chocolat"
                          value={newRewardTitle}
                          onChange={(e) => setNewRewardTitle(e.target.value)}
                          className="w-full px-3 py-2 text-xs border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Coût en points *</label>
                        <input
                          type="number"
                          required
                          value={newRewardCost}
                          onChange={(e) => setNewRewardCost(e.target.value)}
                          className="w-full px-3 py-2 text-xs border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Catégorie</label>
                        <select
                          value={newRewardCategory}
                          onChange={(e) => setNewRewardCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
                        >
                          <option value="Viennoiserie">Viennoiserie</option>
                          <option value="Gâteaux">Gâteaux</option>
                          <option value="Macarons">Macarons</option>
                          <option value="Boisson">Boisson</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-white font-bold text-xs shadow-sm hover:bg-[#c29d2b] transition"
                    >
                      Ajouter au catalogue
                    </button>
                  </form>
                )}

                {/* Liste des récompenses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {rewards.map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm p-4 flex flex-col justify-between">
                      {r.image && (
                        <img src={r.image} alt={r.title} className="w-full h-32 object-cover rounded-xl mb-3" />
                      )}
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{r.category}</span>
                        <h4 className="text-sm font-bold text-gray-900">{r.title}</h4>
                        <span className="inline-block mt-2 px-2.5 py-1 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] font-black text-xs">
                          {r.points_cost} points
                        </span>
                      </div>
                      {currentStaff.role === 'admin' && (
                        <button
                          onClick={() => deleteLoyaltyReward(r.id).then(() => getLoyaltyRewards().then(setRewards))}
                          className="mt-3 text-red-500 hover:text-red-700 text-xs font-bold text-right"
                        >
                          Désactiver
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sous-onglet 3 : Membres */}
            {fidelitySubTab === 'members' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Membres Actifs ({loyaltyMembers.length})</h3>
                <div className="space-y-2">
                  {loyaltyMembers.map((m) => (
                    <div key={m.phone} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl text-xs">
                      <div>
                        <span className="font-bold text-gray-900 block">{m.name}</span>
                        <span className="text-gray-400 font-mono">📱 +226 {m.phone} • {m.orders_count} commandes</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-[#D4AF37] block">{m.points} pts</span>
                        <span className="text-[10px] text-gray-500 font-bold">{m.tier}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VUE 3 : GESTION DES EMPLOYÉS (ACCÈS ADMINISTRATEUR SEULEMENT) */}
        {/* ========================================================================= */}
        {activeNav === 'employees' && currentStaff.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestion des Employés & Équipe</h1>
              <p className="text-xs text-gray-500">Ajoutez des employés et attribuez-leur un code PIN individuel d'accès à la caisse</p>
            </div>

            {empSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                {empSuccess}
              </div>
            )}

            {/* Formulaire ajout employé */}
            <form onSubmit={handleAddEmployee} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <UserPlus size={18} className="text-[#D4AF37]" />
                <span>Créer un nouvel employé</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Nom de l'employé *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fatou Kaboré"
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Code PIN (4 chiffres) *</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="Ex: 5678"
                    value={newEmpPin}
                    onChange={(e) => setNewEmpPin(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Rôle / Poste</label>
                  <select
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                  >
                    <option value="caissier">Caissier(ère)</option>
                    <option value="patissier">Pâtissier(ère)</option>
                    <option value="employee">Employé Polyvalent</option>
                    <option value="admin">Administrateur / Gérant</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={empLoading}
                className="px-5 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-white font-bold text-xs shadow-md transition"
              >
                {empLoading ? 'Création...' : 'Enregistrer cet employé'}
              </button>
            </form>

            {/* Liste des employés */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Membres de l'équipe ({employees.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {employees.map((emp) => (
                  <div key={emp.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{emp.name}</h4>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gray-200 text-gray-800">
                        {emp.role}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Créé le {new Date(emp.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {emp.id !== currentStaff.id && (
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-xl transition"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VUE 4 : SIMULATEUR ORANGE MONEY */}
        {/* ========================================================================= */}
        {activeNav === 'simulator' && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Simulateur Webhook Orange Money</h3>
                <p className="text-xs text-gray-500">Tester la validation automatique sans SMS réel</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Montant Payé (FCFA)</label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Numéro Client</label>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Code Réf Commande (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: 9XSY"
                  value={testCodeRef}
                  onChange={(e) => setTestCodeRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>

              <button
                onClick={async () => {
                  setSimulating(true);
                  try {
                    const res = await simulateWebhook({
                      amount: Number(testAmount),
                      phone: testPhone,
                      codeReference: testCodeRef || undefined
                    });
                    setSimResult(res);
                    fetchAllData();
                  } catch (e: any) {
                    setSimResult({ error: e.message });
                  } finally {
                    setSimulating(false);
                  }
                }}
                disabled={simulating}
                className="w-full py-3 rounded-xl bg-[#D4AF37] text-white font-bold text-xs shadow-md hover:bg-[#c29d2b] transition"
              >
                {simulating ? 'Simulation en cours...' : 'Envoyer Paiement Simulé'}
              </button>

              {simResult && (
                <pre className="p-3 bg-gray-900 text-emerald-400 text-[11px] rounded-xl overflow-x-auto">
                  {JSON.stringify(simResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
