import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag,
  Truck,
  MapPin,
  Navigation, 
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
  ArrowRight,
  UtensilsCrossed,
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Edit3,
  Eye,
  EyeOff,
  Flame,
  Layers,
  ChefHat,
  Ban,
  UserCheck,
  AlertTriangle,
  KeyRound,
  Loader2,
  Phone,
  User,
  CreditCard
} from 'lucide-react';
import { 
  getAdminOrders, 
  validateOrder, 
  finishOrder, 
  cancelOrder, 
  simulateWebhook, 
  Order, 
  getStoredAdminUser,
  getAuthToken,
  removeAuthToken,
  AdminUser,
  getAdminUsers,
  createAdminUser,
  updateAdminUserStatus,
  deleteAdminUser,
  getLoyaltySettings, 
  updateLoyaltySettings, 
  getAllLoyaltyMembers, 
  adjustLoyaltyMember, 
  getLoyaltyRewards, 
  createLoyaltyReward, 
  deleteLoyaltyReward, 
  validateCouponCode, 
  recordClientVisit,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  addProductCategory,
  deleteProductCategory,
  ProductCategory,
  getAdminDetailedStats,
  Product,
  AdminDetailedStats,
  LoyaltySettings, 
  LoyaltyMember, 
  LoyaltyReward,
  getAnnouncementBanner,
  updateAnnouncementBanner,
  AnnouncementBanner,
  getDeliverySettings,
  updateDeliverySettings,
  DeliverySettings,
  DeliveryNeighborhood,
  getUnmatchedPayments,
  resolveUnmatchedPayment,
  UnmatchedPayment
} from '../services/api';
import { getSocket, joinAdmin } from '../services/socket';

export function AdminDashboard() {
  // État pour le bandeau d'annonces et promotions
  const [bannerData, setBannerData] = useState<AnnouncementBanner>({
    message: '',
    is_permanent: true,
    start_date: '',
    end_date: '',
    text_color: '#FFFFFF',
    bg_color: '#3B0764',
    is_active: true
  });
  const [savingBanner, setSavingBanner] = useState(false);
  // État pour les tarifs et paramètres de livraison au kilomètre et par quartier
  const [deliveryData, setDeliveryData] = useState<DeliverySettings>({
    id: 1,
    price_per_km: 250,
    min_fee: 1000,
    free_threshold: 50000,
    origin_lat: 12.3714,
    origin_lng: -1.5197,
    origin_address: 'Atelier Les Douceurs de Lê Ci, Ouagadougou',
    is_active: true,
    neighborhoods: [
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
    ]
  });
  const [newNeighborhoodName, setNewNeighborhoodName] = useState('');
  const [newNeighborhoodFee, setNewNeighborhoodFee] = useState<number>(1000);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [deliverySuccessMsg, setDeliverySuccessMsg] = useState('');
  const [simulatedKm, setSimulatedKm] = useState<number>(5);

  const [bannerSuccessMsg, setBannerSuccessMsg] = useState('');
  const navigate = useNavigate();

  // Session & Auth RBAC
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(getStoredAdminUser());
  const isGerant = currentUser?.role === 'gerant';

  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'stats' | 'loyalty' | 'team' | 'simulator' | 'delivery' | 'banner'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [unmatchedPayments, setUnmatchedPayments] = useState<UnmatchedPayment[]>([]);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Record<number, string>>({});
  const [resolvingPaymentId, setResolvingPaymentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // État Gestion de l'équipe (RBAC)
  const [teamUsers, setTeamUsers] = useState<AdminUser[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employe' as 'gerant' | 'employe'
  });
  const [teamMessage, setTeamMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // État Gestion des Plats & Catégories
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([
    { id: 1, name: 'Signature de la maison' },
    { id: 2, name: 'Douceurs salées' },
    { id: 3, name: 'Douceurs sucrées' },
    { id: 4, name: 'Gâteaux' },
    { id: 5, name: 'Paquets' }
  ]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [categorySuccessMsg, setCategorySuccessMsg] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState('Tous');
  const [productSearch, setProductSearch] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [portionsList, setPortionsList] = useState<{ label: string; price: number }[]>([
    { label: '6 parts', price: 15000 },
    { label: '8 parts', price: 20000 },
    { label: '10-12 parts', price: 25000 }
  ]);
  const [productFormData, setProductFormData] = useState({
    name: '',
    category: 'Gâteaux',
    price: 1500,
    description: '',
    image: '',
    is_available: true,
    stock_quantity: 10
  });

  // État Statistiques Ventes Détaillées
  const [detailedStats, setDetailedStats] = useState<AdminDetailedStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Simulation Webhook OM
  const [simPhone, setSimPhone] = useState('70123456');
  const [simAmount, setSimAmount] = useState('1500');
  const [simCodeRef, setSimCodeRef] = useState('');
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  // Fidélité
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [loyaltyMembers, setLoyaltyMembers] = useState<LoyaltyMember[]>([]);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>([]);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponValidationResult, setCouponValidationResult] = useState<any>(null);

  // Contrôle de session au montage
  useEffect(() => {
    const token = getAuthToken();
    const stored = getStoredAdminUser();
    if (!token || !stored) {
      navigate('/admin/login', { replace: true });
      return;
    }
    setCurrentUser(stored);
  }, [navigate]);

  // Si un employé tente d'accéder à un onglet réservé au gérant, on le force sur les commandes
  useEffect(() => {
    if (!isGerant && ['menu', 'stats', 'team', 'simulator'].includes(activeTab)) {
      setActiveTab('orders');
    }
  }, [isGerant, activeTab]);

  // Déconnexion
  const handleLogout = () => {
    removeAuthToken();
    navigate('/admin/login', { replace: true });
  };

  // Chargement des commandes et des paiements orphelins
  const loadOrders = async () => {
    try {
      setLoading(true);
      const [data, unmatched] = await Promise.all([
        getAdminOrders(),
        getUnmatchedPayments().catch(() => [])
      ]);
      setOrders(data);
      setUnmatchedPayments(unmatched);
    } catch (err: any) {
      if (err.message && err.message.includes('expiré')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResolveUnmatchedPayment = async (paymentId: number) => {
    const orderId = selectedOrderForPayment[paymentId];
    if (!orderId) {
      alert('Veuillez sélectionner une commande à associer à ce paiement.');
      return;
    }
    setResolvingPaymentId(paymentId);
    try {
      await resolveUnmatchedPayment(paymentId, orderId);
      await loadOrders();
      if (isGerant) loadDetailedStats();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'association du paiement');
    } finally {
      setResolvingPaymentId(null);
    }
  };

  // Chargement de l'équipe (Gérant uniquement)
  const loadTeam = async () => {
    if (!isGerant) return;
    try {
      setLoadingTeam(true);
      const list = await getAdminUsers();
      setTeamUsers(list);
    } catch (err: any) {
      if (err.message && err.message.includes('expiré')) {
        handleLogout();
      }
    } finally {
      setLoadingTeam(false);
    }
  };

  // Chargement des plats et des catégories
  const loadProducts = async () => {
    if (!isGerant) return;
    try {
      setLoadingProducts(true);
      const [list, cats] = await Promise.all([
        getProducts(),
        getProductCategories().catch(() => [])
      ]);
      setProducts(list);
      if (cats && cats.length > 0) {
        setProductCategories(cats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCategoryName.trim();
    if (!clean) return;
    setAddingCategory(true);
    setCategorySuccessMsg('');
    try {
      const updated = await addProductCategory(clean);
      setProductCategories(updated);
      setNewCategoryName('');
      setCategorySuccessMsg(`Catégorie « ${clean} » ajoutée avec succès !`);
      setTimeout(() => setCategorySuccessMsg(''), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'ajout de la catégorie');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: ProductCategory) => {
    if (!window.confirm(`Supprimer la catégorie « ${cat.name} » ?`)) return;
    try {
      const updated = await deleteProductCategory(cat.id);
      setProductCategories(updated);
      if (productCategoryFilter === cat.name) {
        setProductCategoryFilter('Tous');
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression de la catégorie');
    }
  };

  // Chargement des stats détaillées
  const loadDetailedStats = async () => {
    if (!isGerant) return;
    try {
      setLoadingStats(true);
      const stats = await getAdminDetailedStats();
      setDetailedStats(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Chargement fidélité
  const loadLoyaltyData = async () => {
    try {
      const [s, m, r] = await Promise.all([
        getLoyaltySettings().catch(() => null),
        getAllLoyaltyMembers().catch(() => []),
        getLoyaltyRewards().catch(() => [])
      ]);
      if (s) setLoyaltySettings(s);
      setLoyaltyMembers(m);
      setLoyaltyRewards(r);
    } catch (err) {
      console.error(err);
    }
  };

  // Chargement bandeau & livraison (Gérant)
  const loadBannerAndDelivery = async () => {
    if (!isGerant) return;
    try {
      const [b, d] = await Promise.all([
        getAnnouncementBanner().catch(() => null),
        getDeliverySettings().catch(() => null)
      ]);
      if (b) setBannerData(b);
      if (d) setDeliveryData(d);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBanner(true);
    setBannerSuccessMsg('');
    try {
      const res = await updateAnnouncementBanner(bannerData);
      if (res && res.banner) setBannerData(res.banner);
      setBannerSuccessMsg(res.message || 'Bandeau enregistré avec succès !');
      setTimeout(() => setBannerSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde du bandeau');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleAddNeighborhood = () => {
    const cleanName = newNeighborhoodName.trim();
    if (!cleanName) return;
    const feeVal = Math.max(0, Number(newNeighborhoodFee) || 1000);
    const currentList = deliveryData.neighborhoods || [];
    const existsIdx = currentList.findIndex(q => q.name.toLowerCase() === cleanName.toLowerCase());
    let updatedList: DeliveryNeighborhood[];
    if (existsIdx >= 0) {
      updatedList = currentList.map((q, idx) => idx === existsIdx ? { name: cleanName, fee: feeVal } : q);
    } else {
      updatedList = [...currentList, { name: cleanName, fee: feeVal }];
    }
    setDeliveryData(prev => ({ ...prev, neighborhoods: updatedList }));
    setNewNeighborhoodName('');
    setNewNeighborhoodFee(1000);
  };

  const handleUpdateNeighborhoodFee = (index: number, fee: number) => {
    const currentList = [...(deliveryData.neighborhoods || [])];
    if (currentList[index]) {
      currentList[index] = { ...currentList[index], fee: Math.max(0, Number(fee) || 0) };
      setDeliveryData(prev => ({ ...prev, neighborhoods: currentList }));
    }
  };

  const handleUpdateNeighborhoodName = (index: number, name: string) => {
    const currentList = [...(deliveryData.neighborhoods || [])];
    if (currentList[index]) {
      currentList[index] = { ...currentList[index], name };
      setDeliveryData(prev => ({ ...prev, neighborhoods: currentList }));
    }
  };

  const handleRemoveNeighborhood = (index: number) => {
    const currentList = (deliveryData.neighborhoods || []).filter((_, i) => i !== index);
    setDeliveryData(prev => ({ ...prev, neighborhoods: currentList }));
  };

  const handleSaveDeliverySettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingDelivery(true);
    setDeliverySuccessMsg('');
    try {
      const res = await updateDeliverySettings(deliveryData);
      if (res && res.settings) {
        setDeliveryData(res.settings);
      }
      setDeliverySuccessMsg(res.message || 'Liste des quartiers et tarifs de livraison enregistrée avec succès !');
      setTimeout(() => setDeliverySuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde des paramètres de livraison');
    } finally {
      setSavingDelivery(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    loadOrders();

    if (isGerant) {
      loadTeam();
      loadProducts();
      loadDetailedStats();
      loadBannerAndDelivery();
    }
    loadLoyaltyData();

    // Connexion WebSocket pour notifications temps réel
    const socket = getSocket();
    joinAdmin();

    const handleOrderEvent = () => {
      loadOrders();
      if (isGerant) loadDetailedStats();
    };

    socket.on('order:created', handleOrderEvent);
    socket.on('order:status_changed', handleOrderEvent);
    socket.on('order:validated', handleOrderEvent);
    socket.on('payment:unmatched', handleOrderEvent);

    return () => {
      socket.off('order:created', handleOrderEvent);
      socket.off('order:status_changed', handleOrderEvent);
      socket.off('order:validated', handleOrderEvent);
      socket.off('payment:unmatched', handleOrderEvent);
    };
  }, [currentUser, isGerant]);

  // Actions Commandes
  const handleValidateOrder = async (id: string) => {
    try {
      await validateOrder(id);
      loadOrders();
      if (isGerant) loadDetailedStats();
    } catch (err: any) {
      alert(err.message || 'Erreur validation commande');
    }
  };

  const handleFinishOrder = async (id: string) => {
    try {
      await finishOrder(id);
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  // Actions Gestion de l'équipe (RBAC)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      setTeamMessage({ type: 'error', text: 'Tous les champs sont requis.' });
      return;
    }
    if (newUserForm.password.length < 8) {
      setTeamMessage({ type: 'error', text: 'Le mot de passe doit comporter au moins 8 caractères.' });
      return;
    }

    try {
      await createAdminUser(newUserForm);
      setTeamMessage({ type: 'success', text: `Accès créé pour ${newUserForm.name} (${newUserForm.email})` });
      setNewUserForm({ name: '', email: '', password: '', role: 'employe' });
      loadTeam();
    } catch (err: any) {
      setTeamMessage({ type: 'error', text: err.message || 'Erreur création compte' });
    }
  };

  const handleToggleUserStatus = async (user: AdminUser) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    const actionText = newStatus === 'blocked' ? 'bloquer' : 'débloquer';
    if (!confirm(`Voulez-vous vraiment ${actionText} l'accès de ${user.name} ?`)) return;

    try {
      await updateAdminUserStatus(user.id, newStatus);
      loadTeam();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte connecté.');
      return;
    }
    if (!confirm(`ATTENTION : Supprimer définitivement le compte de ${user.name} (${user.email}) ?`)) return;

    try {
      await deleteAdminUser(user.id);
      loadTeam();
    } catch (err: any) {
      alert(err.message || 'Erreur suppression');
    }
  };

  // Actions Gestion des Plats
  
  const handleAddPortionRow = () => {
    setPortionsList([...portionsList, { label: `${portionsList.length * 2 + 6} parts`, price: 20000 }]);
  };

  const handleUpdatePortion = (idx: number, field: 'label' | 'price', val: any) => {
    const copy = [...portionsList];
    copy[idx] = { ...copy[idx], [field]: val };
    setPortionsList(copy);
  };

  const handleRemovePortion = (idx: number) => {
    setPortionsList(portionsList.filter((_, i) => i !== idx));
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setPortionsList([
      { label: '6 parts', price: 15000 },
      { label: '8 parts', price: 20000 },
      { label: '10-12 parts', price: 25000 }
    ]);
    setProductFormData({
      name: '',
      category: 'Gâteaux',
      price: 1500,
      description: '',
      image: 'https://images.unsplash.com/photo-1582180834946-f3d376b18376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
      is_available: true,
      stock_quantity: 10
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    let parsedPortions: { label: string; price: number }[] = [];
    try {
      if (p.portions && Array.isArray(p.portions)) {
        parsedPortions = p.portions;
      } else if (p.portions_json) {
        parsedPortions = JSON.parse(p.portions_json);
      }
    } catch (e) {}
    if (parsedPortions.length === 0 && (p.category === 'Gâteaux' || p.category?.includes('Gât'))) {
      parsedPortions = [
        { label: '6 parts', price: p.price },
        { label: '8 parts', price: Math.round(p.price * 1.3) },
        { label: '10-12 parts', price: Math.round(p.price * 1.6) }
      ];
    }
    setPortionsList(parsedPortions);
    setProductFormData({
      name: p.name,
      category: p.category || 'Gâteaux',
      price: p.price,
      description: p.description || '',
      image: p.image || '',
      is_available: Boolean(p.is_available),
      stock_quantity: p.stock_quantity !== undefined ? p.stock_quantity : 10
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, { ...productFormData, portions_json: JSON.stringify(portionsList) });
      } else {
        await createProduct({ ...productFormData, portions_json: JSON.stringify(portionsList) });
      }
      setIsProductModalOpen(false);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Erreur enregistrement du plat');
    }
  };

  const handleToggleProductAvailability = async (p: Product) => {
    try {
      const nextState = !Boolean(p.is_available);
      await updateProduct(p.id, { is_available: nextState });
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`Supprimer définitivement le plat "${name}" du catalogue ?`)) return;
    try {
      await deleteProduct(id);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Erreur suppression');
    }
  };

  // Validation Coupon
  const handleValidateCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    try {
      const res = await validateCouponCode({
        code: couponCodeInput.trim(),
        staffName: currentUser?.name || 'Personnel'
      });
      setCouponValidationResult(res);
      setCouponCodeInput('');
      loadLoyaltyData();
    } catch (err: any) {
      alert(err.message || 'Coupon invalide ou expiré');
    }
  };

  // Filtrage commandes : une commande EN_ATTENTE_DE_PAIEMENT n'apparaît dans le Dashboard
  // qu'à partir du moment où le client a saisi le nom et le numéro de transfert
  const visibleOrders = orders.filter(o => {
    if (o.statut === 'EN_ATTENTE_DE_PAIEMENT') {
      return Boolean(o.payerPhone && o.payerPhone.trim());
    }
    return true;
  });

  const filteredOrders = visibleOrders.filter(o => {
    if (filterStatus === 'ALL') return true;
    return o.statut === filterStatus;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION GÉRANCE & ÉQUIPE */}
      <aside className="w-full md:w-72 bg-[#1E293B] border-r border-white/10 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Info Session */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] text-black flex items-center justify-center font-black shadow-lg">
                <UtensilsCrossed size={20} />
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-white tracking-wide">Les Douceurs de Lê Ci</h1>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Back-Office Sécurisé</span>
              </div>
            </div>

            {/* Badge Rôle Utilisateur */}
            <div className="mt-3 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isGerant ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-sky-500/20 text-sky-400'
                }`}>
                  {isGerant ? <Crown size={15} /> : <ChefHat size={15} />}
                </div>
                <div className="truncate max-w-[130px]">
                  <div className="text-xs font-bold text-white truncate">{currentUser?.name}</div>
                  <div className="text-[10px] text-gray-400 capitalize">{currentUser?.role === 'gerant' ? '👑 Gérant' : '👨‍🍳 Employé'}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Se déconnecter"
                className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Onglets Navigation RBAC */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'orders' ? 'bg-[#581C87] text-white shadow-lg shadow-purple-900/30'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package size={17} />
                <span>Commandes & KDS</span>
              </div>
              {visibleOrders.filter(o => o.statut === 'EN_ATTENTE_DE_PAIEMENT' || o.statut === 'EN_PREPARATION').length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  activeTab === 'orders' ? 'bg-black text-white' : 'bg-[#D4AF37] text-black'
                }`}>
                  {visibleOrders.filter(o => o.statut === 'EN_ATTENTE_DE_PAIEMENT' || o.statut === 'EN_PREPARATION').length}
                </span>
              )}
            </button>

            {/* Onglets réservés au Gérant */}
            {isGerant && (
              <>
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'menu' ? 'bg-[#581C87] text-white shadow-lg shadow-purple-900/30'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <UtensilsCrossed size={17} />
                  <span>Gestion des Plats</span>
                </button>

                <button
                  onClick={() => setActiveTab('stats')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'stats' ? 'bg-[#581C87] text-white shadow-lg shadow-purple-900/30'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <BarChart3 size={17} />
                  <span>Statistiques & Ventes</span>
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('loyalty')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'loyalty' ? 'bg-[#581C87] text-white shadow-lg shadow-purple-900/30'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Award size={17} />
              <span>Fidélité & Coupons</span>
            </button>

            {/* Onglet Équipe - Réservé au Gérant */}
            {isGerant && (
              <>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'team' ? 'bg-[#581C87] text-white shadow-lg shadow-purple-900/30'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users size={17} />
                    <span>Gestion de l'Équipe</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-bold">
                    {teamUsers.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('banner')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'banner'
                      ? 'bg-[#581C87] text-white shadow-lg shadow-purple-900/30'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Sparkles size={17} className={activeTab === 'banner' ? 'text-purple-300' : ''} />
                  <span>Bandeau & Promo</span>
                </button>

                <button
                    onClick={() => setActiveTab('delivery')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'delivery'
                        ? 'bg-[#581C87] text-white shadow-lg shadow-purple-900/30'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Truck size={17} className={activeTab === 'delivery' ? 'text-purple-300' : ''} />
                    <span>Tarifs Livraison</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('simulator')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'simulator' ? 'bg-[#581C87] text-white shadow-lg shadow-purple-900/30'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Zap size={17} />
                  <span>Simulateur OM</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Pied de sidebar */}
        <div className="p-4 border-t border-white/10 text-[11px] text-gray-500 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connecté • RBAC Actif</span>
          </div>
          <span>Expiration automatique après 4h</span>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {/* ============================================================ */}
        {/* ONGLET 1 : COMMANDES & KDS (ACCESSIBLE TOUS PROFILS)           */}
        {/* ============================================================ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>Commandes en Cuisine</span>
                  {!isGerant && (
                    <span className="text-xs px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30">
                      Vue Opérationnelle Employé
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-400">
                  {isGerant 
                    ? 'Supervision globale de l\'activité, encaissements Orange Money et statut des commandes.'
                    : 'Préparez les douceurs commandées et mettez à jour leur statut en temps réel.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadOrders}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Actualiser</span>
                </button>
              </div>
            </div>

            {/* Section Paiements Orphelins (unmatched_payments - §10.9 point 6) */}
            {unmatchedPayments.filter(p => !p.resolved_order_id).length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                        Paiements reçus en attente d'association ({unmatchedPayments.filter(p => !p.resolved_order_id).length})
                      </h3>
                      <p className="text-xs text-gray-300">
                        Ces transferts SMS n'ont pas pu être associés automatiquement (ou attendent que le client renseigne son nouveau numéro dans les 30 min). Vous pouvez les associer manuellement :
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unmatchedPayments
                    .filter(p => !p.resolved_order_id)
                    .map(payment => {
                      const candidateOrders = orders.filter(
                        o => o.statut === 'EN_ATTENTE_DE_PAIEMENT' || o.statut === 'ANNULEE'
                      );
                      return (
                        <div
                          key={payment.id}
                          className="bg-black/40 border border-amber-500/25 rounded-2xl p-4 space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black text-base text-amber-400">
                              {Number(payment.amount).toLocaleString('fr-FR')} FCFA
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              {new Date(payment.received_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="space-y-1 text-gray-300">
                            <div>
                              <span className="text-gray-400">Expéditeur SMS :</span>{' '}
                              <span className="font-bold text-white">{payment.sender_phone || 'Inconnu'}</span>
                              {payment.sender_name && <span className="text-amber-300 ml-1">({payment.sender_name})</span>}
                            </div>
                            {payment.transaction_ref && (
                              <div>
                                <span className="text-gray-400">Réf Trans :</span>{' '}
                                <span className="font-mono text-gray-200">{payment.transaction_ref}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <select
                              value={selectedOrderForPayment[payment.id] || ''}
                              onChange={e =>
                                setSelectedOrderForPayment(prev => ({ ...prev, [payment.id]: e.target.value }))
                              }
                              className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                            >
                              <option value="" className="bg-gray-900 text-gray-300">
                                — Choisir la commande à associer —
                              </option>
                              {candidateOrders.map(ord => (
                                <option key={ord.id} value={ord.id} className="bg-gray-900 text-white">
                                  {ord.id} • {ord.montantTotal.toLocaleString('fr-FR')} FCFA ({ord.payerName || ord.customerName})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleResolveUnmatchedPayment(payment.id)}
                              disabled={resolvingPaymentId === payment.id || !selectedOrderForPayment[payment.id]}
                              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition cursor-pointer disabled:opacity-50"
                            >
                              {resolvingPaymentId === payment.id ? 'Association...' : 'Associer'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Filtres de statut */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'ALL', label: 'Toutes' },
                { id: 'EN_ATTENTE_DE_PAIEMENT', label: 'En attente de validation' },
                { id: 'EN_PREPARATION', label: 'En préparation' },
                { id: 'PRETE', label: 'Prêtes' },
                { id: 'LIVREE', label: 'Livrées' },
                { id: 'ANNULEE', label: 'Annulées' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterStatus === f.id
                      ? 'bg-[#D4AF37] text-black shadow-md'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Grille de cartes de commandes (Facture 3 sections + Payeur + Photo pâtisserie) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOrders.map(order => {
                const notesStr = order.notes || '';
                const itemsSubtotal = (order.items || []).reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
                const hasCard = notesStr.includes('Carte de vœux');
                const cardTextMatch = notesStr.match(/Carte de vœux\s*\(\+200F\):\s*«\s*([^»]+)\s*»/i);
                const cardFee = hasCard ? 200 : 0;
                const isDelivery = Boolean(order.deliveryFee || notesStr.includes('Livraison') || notesStr.includes('km'));
                const calcDelivFee = order.deliveryFee !== undefined && order.deliveryFee > 0
                  ? order.deliveryFee
                  : (isDelivery ? Math.max(0, Number(order.montantTotal || 0) - itemsSubtotal - cardFee) : 0);

                const backupPhoneMatch = notesStr.match(/Tél secours:\s*([^|\[]+)/i);
                const addrMatch = notesStr.match(/Adresse:\s*([^|\[]+(?:\|\s*Repère:[^|\[]+)?)/i);
                const dateMatch = notesStr.match(/Date souhaitée:\s*([^|\[]+)/i);

                const payerNameVal = order.payerName || (notesStr.match(/Payeur:\s*([^|(]+?)\s*\(/i)?.[1]?.trim()) || 'En attente de saisie';
                const payerPhoneVal = order.payerPhone || (notesStr.match(/Payeur:[^)]*\(([^)]+)\)/i)?.[1]?.trim()) || 'En attente de saisie';

                return (
                  <div
                    key={order.id}
                    className={`p-5 sm:p-6 rounded-3xl border transition flex flex-col justify-between ${
                      order.statut === 'EN_PREPARATION'
                        ? 'bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5'
                        : order.statut === 'PRETE'
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-[#1E293B] border-white/10'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header Carte */}
                      <div className="flex justify-between items-start gap-2 pb-3 border-b border-white/10">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#D4AF37]">{order.id}</span>
                            {order.codeReference && (
                              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Réf : {order.codeReference}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-1">
                            Créée le {new Date(order.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        </div>
                        <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                          order.statut === 'EN_PREPARATION'
                            ? 'bg-amber-400 text-black animate-pulse'
                            : order.statut === 'PRETE'
                            ? 'bg-emerald-400 text-black'
                            : order.statut === 'PAYEE'
                            ? 'bg-blue-400 text-black'
                            : order.statut === 'ANNULEE'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                        }`}>
                          {order.statut === 'EN_ATTENTE_DE_PAIEMENT'
                            ? 'EN ATTENTE DE VALIDATION'
                            : order.statut.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* ENCADRÉ PAYEUR : Nom & Numéro de la personne qui paye la commande */}
                      <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-purple-200 font-bold">
                          <CreditCard size={15} className="text-[#D4AF37] shrink-0" />
                          <span>Personne qui paye :</span>
                        </div>
                        <div className="text-white font-extrabold">
                          {payerNameVal} • <span className="font-mono text-[#D4AF37]">📞 {payerPhoneVal}</span>
                        </div>
                      </div>

                      {/* SECTION 1 : Désignation du produit, Photo de la pâtisserie, Saveur, Modèle catalogue, Quantité, Parts (si gâteau) */}
                      <div className="space-y-2.5">
                        <div className="text-[11px] font-black uppercase tracking-wider text-[#D4AF37]">
                          1. Pâtisserie(s) commandée(s)
                        </div>
                        <div className="space-y-2.5">
                          {order.items && order.items.map((item, idx) => {
                            const desc = item.description || item.name || '';
                            const isCake = Boolean(
                              item.isCake ||
                              item.category === 'Gâteaux' ||
                              /gâteau|gateau|fraisier|layer|forêt noire|red velvet|number cake|pièce montée|entremet/i.test(item.name || '') ||
                              /Format:|parts/i.test(desc)
                            );
                            const flavorMatch = desc.match(/Saveur:\s*([^|\]]+)/i);
                            const modelMatch = desc.match(/Modèle(?:\s*catalogue)?:\s*([^|\]]+)/i);
                            const portionMatch = desc.match(/Format:\s*([^|\]]+)/i) || (item.name || '').match(/\(([^)]*parts[^)]*)\)/i);
                            const inscrMatch = desc.match(/Inscription:\s*([^|\]]+)/i);
                            const eventMatch = desc.match(/Événement:\s*([^|\]]+)/i);

                            const cleanDesignation = (item.name || '').replace(/\s*\[.*\]$/, '');
                            const flavor = item.flavor || (flavorMatch ? flavorMatch[1].trim() : (isCake ? 'Recette Signature Lê Ci' : 'Classique artisanale'));
                            const catalogModel = item.catalogModel || (modelMatch ? modelMatch[1].replace(/^Modèle catalogue\s*:\s*/i, '').trim() : cleanDesignation);
                            const portion = isCake ? (item.portion || (portionMatch ? portionMatch[1].trim() : '6 à 8 parts')) : null;
                            const itemPhoto = item.image || '/products/gateau_1.jpeg';

                            return (
                              <div key={idx} className="p-3 rounded-2xl bg-[#0F172A]/80 border border-white/10 flex gap-3.5 items-start">
                                {/* Photo de la pâtisserie */}
                                <img
                                  src={itemPhoto}
                                  alt={cleanDesignation}
                                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/15 bg-black/40 shadow-md"
                                />
                                <div className="flex-1 min-w-0 text-xs space-y-1">
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="font-extrabold text-white text-sm leading-snug">{cleanDesignation}</span>
                                    {isGerant && (
                                      <span className="font-mono font-bold text-[#D4AF37] shrink-0">
                                        {(item.price * item.quantity).toLocaleString('fr-FR')} F
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-gray-300">
                                    <span className="text-gray-400 font-semibold">Saveur :</span> {flavor}
                                  </div>
                                  <div className="text-gray-300">
                                    <span className="text-gray-400 font-semibold">Modèle catalogue :</span> {catalogModel}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <span className="px-2 py-0.5 rounded bg-white/10 text-white font-extrabold">
                                      Quantité : {item.quantity}
                                    </span>
                                    {isCake && portion && (
                                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30 font-extrabold">
                                        Parts : {portion}
                                      </span>
                                    )}
                                  </div>
                                  {(eventMatch || inscrMatch) && (
                                    <div className="text-[11px] text-amber-300/90 pt-1">
                                      {eventMatch ? `🎉 ${eventMatch[1].trim()} ` : ''}
                                      {inscrMatch ? `• ✍️ ${inscrMatch[1].trim()}` : ''}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* SECTION 2 : Détails financiers (Prix des pâtisseries, Frais de livraison avec +, Carte de vœux, Montant total) */}
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
                        <div className="text-[11px] font-black uppercase tracking-wider text-[#D4AF37] mb-1">
                          2. Détails de facturation
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Prix des pâtisseries :</span>
                          <span className="font-bold text-white">{itemsSubtotal.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Frais de livraison :</span>
                          <span className="font-bold text-amber-300">+{calcDelivFee.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        {hasCard && (
                          <div className="flex justify-between text-gray-300">
                            <span>Carte de vœux {cardTextMatch ? `(« ${cardTextMatch[1]} »)` : ''} :</span>
                            <span className="font-bold text-purple-300">+200 FCFA</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-white/10 font-black text-sm">
                          <span className="text-white">Montant Total :</span>
                          <span className="text-[#D4AF37] text-base">{Number(order.montantTotal).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      </div>

                      {/* SECTION 3 : Coordonnées de la personne qui reçoit */}
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs">
                        <div className="text-[11px] font-black uppercase tracking-wider text-[#D4AF37] mb-1">
                          3. Coordonnées de la personne qui reçoit
                        </div>
                        <div className="text-gray-200">
                          <span className="text-gray-400 font-semibold">Téléphone de réception :</span>{' '}
                          <strong className="font-mono text-white">{order.customerPhone || 'Non renseigné'}</strong>
                        </div>
                        {backupPhoneMatch && (
                          <div className="text-gray-200">
                            <span className="text-gray-400 font-semibold">Second numéro de secours :</span>{' '}
                            <strong className="font-mono text-white">{backupPhoneMatch[1].trim()}</strong>
                          </div>
                        )}
                        <div className="text-gray-200">
                          <span className="text-gray-400 font-semibold">Lieu / Adresse :</span>{' '}
                          <span>{addrMatch ? addrMatch[1].trim() : (isDelivery ? 'Livraison à domicile' : 'Retrait à l\'atelier')}</span>
                        </div>
                        {dateMatch && (
                          <div className="text-gray-200">
                            <span className="text-gray-400 font-semibold">Date & Heure :</span>{' '}
                            <span className="text-amber-300 font-semibold">{dateMatch[1].trim()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Opérationnelles */}
                    <div className="pt-4 mt-4 border-t border-white/10 flex gap-2">
                      {order.statut === 'EN_ATTENTE_DE_PAIEMENT' && isGerant && (
                        <button
                          onClick={() => handleValidateOrder(order.id)}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs transition cursor-pointer"
                        >
                          Valider Manuellement
                        </button>
                      )}

                      {order.statut === 'EN_PREPARATION' && (
                        <button
                          onClick={() => handleFinishOrder(order.id)}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
                        >
                          <CheckCircle2 size={16} />
                          <span>Marquer Prête</span>
                        </button>
                      )}

                      {order.statut === 'PRETE' && (
                        <button
                          onClick={async () => {
                            await finishOrder(order.id);
                            loadOrders();
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30 transition cursor-pointer"
                        >
                          Commande Récupérée
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredOrders.length === 0 && !loading && (
              <div className="text-center py-16 bg-[#1E293B] rounded-3xl border border-white/10">
                <Package size={40} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 font-medium text-sm">Aucune commande dans cette catégorie.</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ONGLET 2 : GESTION DE L'ÉQUIPE (RÉSERVÉ GÉRANT UNIQUEMENT)   */}
        {/* ============================================================ */}
        {activeTab === 'team' && isGerant && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Users className="text-[#D4AF37]" size={26} />
                <span>Gestion de l'Équipe & Rôles RBAC</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Générez des accès pour votre brigade de cuisine, attribuez les permissions et bloquez instantanément un collaborateur en cas de départ.
              </p>
            </div>

            {teamMessage && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
                teamMessage.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {teamMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{teamMessage.text}</span>
              </div>
            )}

            {/* Formulaire Nouvel Accès */}
            <div className="bg-[#1E293B] p-6 rounded-3xl border border-white/10">
              <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
                <UserPlus className="text-[#D4AF37]" size={18} />
                <span>Créer un Nouvel Accès Collaborateur</span>
              </h3>

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Nom Complet
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="ex: Mamadou Traoré"
                    className="w-full px-4 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Email Professionnel
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="mamadou@lesdouceursdeleci.com"
                    className="w-full px-4 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Mot de Passe (min. 8 car.)
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="P@ssword2026!"
                    className="w-full px-4 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Rôle Attribué
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="employe">Employé (Commandes & KDS seul)</option>
                    <option value="gerant">Gérant (Administration totale & CA)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#c29d2b] text-black font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                  >
                    <UserPlus size={16} />
                    <span>Générer l'Accès Sécurisé</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Tableau des Collaborateurs */}
            <div className="bg-[#1E293B] rounded-3xl border border-white/10 overflow-hidden">
              <div className="p-5 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-sm text-white">Membres Actuels de la Brigade ({teamUsers.length})</h3>
                <span className="text-[11px] text-gray-400">Authentification forte active par JWT</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F172A] text-gray-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-5">Collaborateur</th>
                      <th className="py-3 px-5">Rôle Attribué</th>
                      <th className="py-3 px-5">Statut</th>
                      <th className="py-3 px-5">Création</th>
                      <th className="py-3 px-5">Dernière Connexion</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {teamUsers.map(user => {
                      const isSelf = user.id === currentUser?.id;
                      return (
                        <tr key={user.id} className="hover:bg-white/5 transition">
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{user.name}</span>
                              {isSelf && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                  Vous
                                </span>
                              )}
                            </div>
                            <div className="text-gray-400 text-[11px] font-mono">{user.email}</div>
                          </td>

                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              user.role === 'gerant'
                                ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                                : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            }`}>
                              {user.role === 'gerant' ? <Crown size={12} /> : <ChefHat size={12} />}
                              <span>{user.role === 'gerant' ? 'Gérant' : 'Employé'}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              user.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {user.status === 'active' ? <UserCheck size={12} /> : <Ban size={12} />}
                              <span>{user.status === 'active' ? 'Actif' : 'Bloqué'}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-5 text-gray-400">
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </td>

                          <td className="py-3.5 px-5 text-gray-400">
                            {user.last_login_at 
                              ? new Date(user.last_login_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                              : 'Jamais'}
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Bouton Bloquer / Débloquer */}
                              <button
                                disabled={isSelf}
                                onClick={() => handleToggleUserStatus(user)}
                                title={user.status === 'active' ? 'Bloquer l\'accès' : 'Réactiver l\'accès'}
                                className={`p-1.5 rounded-lg border text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                                  user.status === 'active'
                                    ? 'border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                                    : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                                }`}
                              >
                                {user.status === 'active' ? <Ban size={14} /> : <UserCheck size={14} />}
                              </button>

                              {/* Bouton Supprimer */}
                              <button
                                disabled={isSelf}
                                onClick={() => handleDeleteUser(user)}
                                title="Supprimer définitivement"
                                className="p-1.5 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ONGLET 3 : GESTION DES PLATS (RÉSERVÉ GÉRANT)                 */}
        {/* ============================================================ */}
        {activeTab === 'menu' && isGerant && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <UtensilsCrossed className="text-[#D4AF37]" size={26} />
                  <span>Gestion des Plats & Carte Sucrée</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Ajoutez, modifiez, ajustez les prix (minimum 500 FCFA) et activez la disponibilité de vos pâtisseries.
                </p>
              </div>

              <button
                onClick={handleOpenAddProduct}
                className="px-5 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#c29d2b] text-black font-extrabold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Plus size={16} />
                <span>Nouveau Plat</span>
              </button>
            </div>

            {/* Gestion & Ajout de catégories de plats */}
            <div className="bg-[#1E293B] p-4 sm:p-5 rounded-3xl border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers size={15} className="text-[#D4AF37]" />
                    <span>Catégories de plats ({productCategories.length})</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Ajoutez de nouvelles catégories pour classer vos pâtisseries dans le catalogue et le menu.
                  </p>
                </div>

                <form onSubmit={handleAddCategory} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nouvelle catégorie (ex: Viennoiseries)..."
                    className="px-3.5 py-2 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-[#D4AF37] focus:outline-none min-w-[210px]"
                  />
                  <button
                    type="submit"
                    disabled={addingCategory || !newCategoryName.trim()}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c29d2b] text-black font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Plus size={14} />
                    <span>{addingCategory ? 'Ajout...' : 'Ajouter la catégorie'}</span>
                  </button>
                </form>
              </div>

              {categorySuccessMsg && (
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>{categorySuccessMsg}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {productCategories.map(cat => (
                  <div
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-200 font-semibold"
                  >
                    <span>{cat.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      title={`Supprimer la catégorie ${cat.name}`}
                      className="text-gray-500 hover:text-rose-400 transition cursor-pointer ml-1"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtres et recherche plats */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Rechercher une pâtisserie..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B] border border-white/10 rounded-2xl text-white text-xs focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['Tous', ...Array.from(new Set([...productCategories.map(c => c.name), ...products.map(p => p.category).filter(Boolean)]))].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setProductCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      productCategoryFilter === cat
                        ? 'bg-[#D4AF37] text-black'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille des plats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products
                .filter(p => productCategoryFilter === 'Tous' || p.category === productCategoryFilter)
                .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                .map(product => (
                  <div
                    key={product.id}
                    className={`p-4 rounded-3xl border transition flex flex-col justify-between group ${
                      product.is_available ? 'bg-[#1E293B] border-white/10' : 'bg-black/30 border-dashed border-gray-700 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 bg-black/40">
                        <img
                          src={product.image || 'https://images.unsplash.com/photo-1582180834946-f3d376b18376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-[#D4AF37]">
                          {product.category}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-sm mb-1">{product.name}</h3>
                      <p className="text-[11px] text-gray-400 line-clamp-2 mb-3">
                        {product.description || 'Pâtisserie fine confectionnée à la main.'}
                      </p>
                      <div className="text-base font-black text-[#D4AF37] mb-2">
                        {product.price.toLocaleString('fr-FR')} FCFA
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        {(product.stock_quantity ?? 10) > 5 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {product.stock_quantity ?? 10} en stock
                          </span>
                        ) : (product.stock_quantity ?? 10) > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Plus que {product.stock_quantity} restant(s)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Rupture de stock
                          </span>
                        )}
                        {product.category === 'Gâteaux' && (
                          <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30 font-medium">
                            Multi-parts
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleProductAvailability(product)}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                          product.is_available
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {product.is_available ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{product.is_available ? 'En Stock' : 'Indisponible'}</span>
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleOpenEditProduct(product)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ONGLET 4 : STATISTIQUES FINANCIÈRES (RÉSERVÉ GÉRANT)          */}
        {/* ============================================================ */}
        {activeTab === 'stats' && isGerant && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <BarChart3 className="text-[#D4AF37]" size={26} />
                <span>Statistiques Financières & Ventes</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Données financières confidentielles réservées au Gérant. Suivi du chiffre d'affaires et performances.
              </p>
            </div>

            {/* 4 Cartes KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-[#1E293B] border border-white/10">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Chiffre d'Affaires</span>
                <div className="text-2xl font-black text-[#D4AF37] mt-2">
                  {(detailedStats?.kpis.totalRevenue || 0).toLocaleString('fr-FR')} FCFA
                </div>
                <div className="text-[11px] text-gray-400 mt-1">Total encaissé via Orange Money</div>
              </div>

              <div className="p-5 rounded-3xl bg-[#1E293B] border border-white/10">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Commandes Payées</span>
                <div className="text-2xl font-black text-emerald-400 mt-2">
                  {detailedStats?.kpis.paidOrdersCount || 0}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">Validées sans commission</div>
              </div>

              <div className="p-5 rounded-3xl bg-[#1E293B] border border-white/10">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Panier Moyen</span>
                <div className="text-2xl font-black text-white mt-2">
                  {(detailedStats?.kpis.averageOrderValue || 0).toLocaleString('fr-FR')} FCFA
                </div>
                <div className="text-[11px] text-gray-400 mt-1">Par commande client</div>
              </div>

              <div className="p-5 rounded-3xl bg-[#1E293B] border border-white/10">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Membres Fidélité</span>
                <div className="text-2xl font-black text-sky-400 mt-2">
                  {detailedStats?.loyaltyStats.totalMembers || 0}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">{detailedStats?.loyaltyStats.totalPoints || 0} points distribués</div>
              </div>
            </div>

            {/* Classement Meilleures Ventes */}
            <div className="bg-[#1E293B] p-6 rounded-3xl border border-white/10">
              <h3 className="font-extrabold text-white text-base mb-4 flex items-center gap-2">
                <Flame className="text-[#D4AF37]" size={20} />
                <span>Top des Pâtisseries les Plus Vendues</span>
              </h3>

              <div className="space-y-3">
                {detailedStats?.topProducts && detailedStats.topProducts.map((p, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] font-extrabold text-xs flex items-center justify-center">
                        #{i + 1}
                      </span>
                      <span className="font-bold text-sm text-white">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-[#D4AF37] text-xs">
                        {p.totalRevenue.toLocaleString('fr-FR')} FCFA
                      </div>
                      <div className="text-[11px] text-gray-400">{p.quantitySold} vendus</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ONGLET 5 : FIDÉLITÉ & COUPONS                                */}
        {/* ============================================================ */}
        {activeTab === 'loyalty' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Award className="text-[#D4AF37]" size={26} />
                <span>Programme de Fidélité & Validation Coupons</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Scannez ou saisissez un coupon présenté par un client en caisse pour le valider.
              </p>
            </div>

            {/* Validation Rapide Coupon */}
            <div className="p-6 rounded-3xl bg-[#1E293B] border border-white/10 max-w-xl">
              <h3 className="text-sm font-bold text-white mb-3">Validation Coupon Caisse</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  placeholder="ex: CPN-9X2A"
                  className="flex-1 px-4 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
                <button
                  onClick={handleValidateCoupon}
                  className="px-5 py-2.5 bg-[#D4AF37] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  Valider
                </button>
              </div>

              {couponValidationResult && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs">
                  ✅ <strong>{couponValidationResult.message}</strong> — {couponValidationResult.coupon.reward_title}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ONGLET 6 : SIMULATEUR OM (RÉSERVÉ GÉRANT)                     */}
        {/* ============================================================ */}
                {/* ========================================================================= */}
        {/* ONGLET BANDEAU & PROMOTION (PARAMÉTRABLE CÔTÉ GÉRANT) */}
        {/* ========================================================================= */}
        {activeTab === 'banner' && isGerant && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-3xl p-8 border border-purple-100 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#581C87] bg-purple-100 px-3 py-1 rounded-full">
                    Promotion & Annonces
                  </span>
                  <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Paramétrage du Bandeau Lumineux</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Personnalisez le message défilant tout en haut du site, sa durée de diffusion et ses couleurs.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">Statut du bandeau :</span>
                  <button
                    type="button"
                    onClick={() => setBannerData(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                      bannerData.is_active
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${bannerData.is_active ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                    <span>{bannerData.is_active ? 'Bandeau Actif' : 'Bandeau Masqué'}</span>
                  </button>
                </div>
              </div>

              {/* Aperçu en direct */}
              <div className="mb-8 p-5 bg-[#FAF7F5] rounded-2xl border border-purple-100">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                  Aperçu en direct sur le site :
                </span>
                <div
                  className="w-full overflow-hidden text-xs py-2.5 rounded-xl shadow-inner font-bold uppercase tracking-wider text-[11px]"
                  style={{ backgroundColor: bannerData.bg_color, color: bannerData.text_color }}
                >
                  <div className="animate-marquee whitespace-nowrap flex items-center gap-10">
                    <span className="flex items-center gap-2">
                      <Sparkles size={14} /> {bannerData.message || 'Votre message défilera ici...'}
                    </span>
                    <span>•</span>
                    <span>PAIEMENT INSTANTANÉ ORANGE MONEY SANS FRAIS</span>
                    <span>•</span>
                    <span className="flex items-center gap-2">
                      <Sparkles size={14} /> {bannerData.message || 'Votre message défilera ici...'}
                    </span>
                  </div>
                </div>
              </div>

              {bannerSuccessMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <Check size={16} />
                  <span>{bannerSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveBanner} className="space-y-6">
                {/* 1. Message */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Message de la promotion ou de l'annonce *
                  </label>
                  <textarea
                    rows={3}
                    value={bannerData.message}
                    onChange={(e) => setBannerData(prev => ({ ...prev, message: e.target.value }))}
                    required
                    placeholder="Ex: ✦ OFFRE SPÉCIALE : -10% sur votre commande avec le code « DOUCEUR10 » ✦ Inscription fidélité offerte dès aujourd'hui ✦"
                    className="w-full p-4 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#581C87] focus:border-transparent font-medium"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Conseil : Utilisez les symboles ✦ ou • pour séparer vos arguments d'appel.
                  </span>
                </div>

                {/* 2. Durée : Permanente vs Période déterminée */}
                <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-4">
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Durée de diffusion de l'annonce *
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${
                      bannerData.is_permanent
                        ? 'border-[#581C87] bg-white text-[#581C87] shadow-sm'
                        : 'border-gray-200 bg-white/50 text-gray-600 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="banner_duration"
                        checked={bannerData.is_permanent}
                        onChange={() => setBannerData(prev => ({ ...prev, is_permanent: true }))}
                        className="text-[#581C87] focus:ring-[#581C87]"
                      />
                      <div>
                        <div className="font-extrabold text-xs">Durée indéterminée</div>
                        <div className="text-[11px] text-gray-500 font-normal">Information permanente toujours visible</div>
                      </div>
                    </label>

                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${
                      !bannerData.is_permanent
                        ? 'border-[#581C87] bg-white text-[#581C87] shadow-sm'
                        : 'border-gray-200 bg-white/50 text-gray-600 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="banner_duration"
                        checked={!bannerData.is_permanent}
                        onChange={() => setBannerData(prev => ({ ...prev, is_permanent: false }))}
                        className="text-[#581C87] focus:ring-[#581C87]"
                      />
                      <div>
                        <div className="font-extrabold text-xs">Promotion programmée</div>
                        <div className="text-[11px] text-gray-500 font-normal">Date de début et date de fin précises</div>
                      </div>
                    </label>
                  </div>

                  {/* Dates si non permanent */}
                  {!bannerData.is_permanent && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-purple-200/50 animate-fade-in">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                          Date et heure de début
                        </label>
                        <input
                          type="datetime-local"
                          value={bannerData.start_date || ''}
                          onChange={(e) => setBannerData(prev => ({ ...prev, start_date: e.target.value }))}
                          className="w-full p-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#581C87]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                          Date et heure de fin
                        </label>
                        <input
                          type="datetime-local"
                          value={bannerData.end_date || ''}
                          onChange={(e) => setBannerData(prev => ({ ...prev, end_date: e.target.value }))}
                          className="w-full p-3 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#581C87]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Couleurs du bandeau */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Couleur du texte */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Couleur du texte
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bannerData.text_color || '#FFFFFF'}
                        onChange={(e) => setBannerData(prev => ({ ...prev, text_color: e.target.value }))}
                        className="w-12 h-10 p-0 rounded-xl cursor-pointer border border-gray-300"
                      />
                      <input
                        type="text"
                        value={bannerData.text_color || '#FFFFFF'}
                        onChange={(e) => setBannerData(prev => ({ ...prev, text_color: e.target.value }))}
                        className="w-28 p-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                      />
                      <div className="flex gap-1.5">
                        {['#FFFFFF', '#F3E8FF', '#FDE047', '#A7F3D0'].map(c => (
                          <button
                            type="button"
                            key={c}
                            onClick={() => setBannerData(prev => ({ ...prev, text_color: c }))}
                            className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer shadow-sm"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Couleur de fond */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Couleur de fond du bandeau
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bannerData.bg_color || '#3B0764'}
                        onChange={(e) => setBannerData(prev => ({ ...prev, bg_color: e.target.value }))}
                        className="w-12 h-10 p-0 rounded-xl cursor-pointer border border-gray-300"
                      />
                      <input
                        type="text"
                        value={bannerData.bg_color || '#3B0764'}
                        onChange={(e) => setBannerData(prev => ({ ...prev, bg_color: e.target.value }))}
                        className="w-28 p-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                      />
                      <div className="flex gap-1.5">
                        {['#3B0764', '#581C87', '#1E1B4B', '#111827'].map(c => (
                          <button
                            type="button"
                            key={c}
                            onClick={() => setBannerData(prev => ({ ...prev, bg_color: c }))}
                            className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer shadow-sm"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton de sauvegarde */}
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingBanner}
                    className="px-8 py-3.5 rounded-2xl bg-[#581C87] hover:bg-[#6B21A8] text-white font-extrabold text-xs shadow-lg shadow-purple-900/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {savingBanner ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Enregistrer le bandeau</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET LIVRAISON & GESTION DES QUARTIERS (GÉRANT)                         */}
        {/* ========================================================================= */}
        {activeTab === 'delivery' && isGerant && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Truck className="text-[#D4AF37]" size={26} />
                <span>Gestion des Quartiers & Tarifs de Livraison</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Enrichissez la liste déroulante des quartiers proposée aux clients dans le panier avec le montant de livraison associé à chaque quartier.
              </p>
            </div>

            {deliverySuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>{deliverySuccessMsg}</span>
              </div>
            )}

            {/* 1. Ajout d'un nouveau quartier dans la liste déroulante */}
            <div className="p-6 rounded-3xl bg-[#1E293B] border border-white/10 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <MapPin size={18} className="text-[#D4AF37]" />
                    <span>Liste des Quartiers de Livraison ({(deliveryData.neighborhoods || []).length})</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ces quartiers s'affichent sous forme de liste déroulante avec leur tarif lorsque le client choisit « Un autre endroit ».
                  </p>
                </div>
              </div>

              {/* Formulaire d'ajout rapide */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-[#0F172A] p-4 rounded-2xl border border-white/10">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Nom du nouveau quartier
                  </label>
                  <input
                    type="text"
                    value={newNeighborhoodName}
                    onChange={(e) => setNewNeighborhoodName(e.target.value)}
                    placeholder="Ex : Karpala, Wayalghin, Cissin, Tanghin..."
                    className="w-full px-4 py-2.5 bg-[#1E293B] border border-gray-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Montant de la livraison (FCFA)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={newNeighborhoodFee}
                    onChange={(e) => setNewNeighborhoodFee(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#1E293B] border border-gray-700 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddNeighborhood}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#c29d2b] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>

              {/* Liste des quartiers existants modifiables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {(deliveryData.neighborhoods || []).map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#0F172A] border border-white/10 flex items-center justify-between gap-2"
                  >
                    <input
                      type="text"
                      value={q.name}
                      onChange={(e) => handleUpdateNeighborhoodName(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-[#1E293B] border border-gray-700 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="100"
                        min="0"
                        value={q.fee}
                        onChange={(e) => handleUpdateNeighborhoodFee(idx, Number(e.target.value))}
                        className="w-24 px-2.5 py-1.5 bg-[#1E293B] border border-gray-700 rounded-lg text-[#D4AF37] text-xs font-mono font-bold text-right focus:outline-none focus:border-[#D4AF37]"
                      />
                      <span className="text-[10px] text-gray-400 font-bold">FCFA</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNeighborhood(idx)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition cursor-pointer"
                        title="Supprimer ce quartier"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paramètres généraux de livraison */}
              <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Frais minimum GPS (0 à 3,5 km) en FCFA
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={deliveryData.min_fee}
                    onChange={(e) => setDeliveryData(prev => ({ ...prev, min_fee: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Seuil de livraison offerte (FCFA, 0 = désactivé)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={deliveryData.free_threshold}
                    onChange={(e) => setDeliveryData(prev => ({ ...prev, free_threshold: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  disabled={savingDelivery}
                  onClick={() => handleSaveDeliverySettings()}
                  className="px-8 py-3.5 rounded-2xl bg-[#D4AF37] hover:bg-[#c29d2b] text-black font-extrabold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingDelivery ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Enregistrer les quartiers et tarifs de livraison</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'simulator' && isGerant && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Zap className="text-[#D4AF37]" size={26} />
                <span>Simulateur Webhook Orange Money</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Testez la réconciliation automatique instantanée en simulant un SMS de caisse MacroDroid.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#1E293B] border border-white/10 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Numéro Client
                </label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Code Réf Marchand (optionnel)
                </label>
                <input
                  type="text"
                  value={simCodeRef}
                  onChange={(e) => setSimCodeRef(e.target.value)}
                  placeholder="ex: K9X2"
                  className="w-full px-4 py-2 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs font-mono"
                />
              </div>

              <button
                disabled={simulating}
                onClick={async () => {
                  setSimulating(true);
                  try {
                    const res = await simulateWebhook({
                      phone: simPhone,
                      amount: Number(simAmount),
                      codeReference: simCodeRef || undefined
                    });
                    setSimResult(res);
                    loadOrders();
                    loadDetailedStats();
                  } catch (err: any) {
                    alert(err.message || 'Erreur');
                  } finally {
                    setSimulating(false);
                  }
                }}
                className="w-full py-3 bg-[#D4AF37] hover:bg-[#c29d2b] text-black font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                {simulating ? 'Envoi du SMS...' : 'Déclencher Webhook SMS Orange Money'}
              </button>

              {simResult && (
                <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-[11px] text-emerald-400 overflow-x-auto">
                  {JSON.stringify(simResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL AJOUT / ÉDITION DE PLAT (GÉRANT) */}
      {isProductModalOpen && isGerant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] rounded-3xl border border-white/15 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-white">
                {editingProduct ? 'Modifier la Pâtisserie' : 'Ajouter un Nouveau Plat'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Nom du plat
                </label>
                <input
                  type="text"
                  required
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  placeholder="ex: Fraisier Prestige"
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Catégorie
                  </label>
                  <select
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs"
                  >
                    {Array.from(new Set([...productCategories.map(c => c.name), productFormData.category].filter(Boolean))).map(catName => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Prix de base (FCFA)
                  </label>
                  <input
                    type="number"
                    min="500"
                    required
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Quantité en stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productFormData.stock_quantity}
                    onChange={(e) => setProductFormData({ ...productFormData, stock_quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs"
                    placeholder="ex: 10"
                  />
                </div>
              </div>

              {/* Configurateur de tarifs multi-parts (Gâteaux uniquement, Notion #6) */}
              {(productFormData.category === 'Gâteaux' || productFormData.category?.includes('Gât')) && (
                <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                        Tarifs selon les parts (Gâteaux)
                      </label>
                      <p className="text-[10px] text-gray-400">
                        Définissez les formats (6 parts, 8 parts...) et le prix de chaque part
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPortionRow}
                      className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-[11px] font-bold cursor-pointer transition"
                    >
                      + Ajouter une part
                    </button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {portionsList.map((pRow, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={pRow.label}
                          onChange={(e) => handleUpdatePortion(idx, 'label', e.target.value)}
                          placeholder="ex: 6 parts"
                          className="w-1/2 px-3 py-1.5 bg-[#0F172A] border border-gray-700 rounded-lg text-white text-xs"
                        />
                        <div className="flex items-center gap-1.5 w-1/2">
                          <input
                            type="number"
                            step="500"
                            min="500"
                            value={pRow.price}
                            onChange={(e) => handleUpdatePortion(idx, 'price', Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-[#0F172A] border border-gray-700 rounded-lg text-white text-xs"
                          />
                          <span className="text-[10px] text-gray-400">FCFA</span>
                          {portionsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePortion(idx)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 rounded cursor-pointer transition"
                              title="Supprimer ce palier"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  placeholder="Ingrédients nobles, préparation artisanale..."
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  URL de l'image
                </label>
                <input
                  type="url"
                  value={productFormData.image}
                  onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={productFormData.is_available}
                  onChange={(e) => setProductFormData({ ...productFormData, is_available: e.target.checked })}
                  className="rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <label htmlFor="availCheck" className="text-xs text-gray-300 font-semibold cursor-pointer">
                  Activer immédiatement ce plat au catalogue (En stock)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-gray-300 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c29d2b] text-black text-xs font-extrabold shadow"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
