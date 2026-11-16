import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Crown, 
  Gift, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Ticket, 
  LogOut, 
  User, 
  Phone, 
  Sparkles, 
  ShoppingBag,
  ShieldCheck,
  Check,
  UserPlus,
  Lock,
  MapPin,
  Package,
  Settings,
  RotateCcw,
  X
} from 'lucide-react';
import { 
  getLoyaltySettings, 
  getLoyaltyMember, 
  getLoyaltyRewards, 
  claimRewardCoupon, 
  getMemberCoupons, 
  registerLoyaltyMember,
  loginLoyaltyMember,
  getCustomerMe,
  getCustomerOrders,
  updateCustomerProfile,
  logoutCustomer,
  LoyaltySettings, 
  LoyaltyMember, 
  LoyaltyReward, 
  LoyaltyCoupon,
  CustomerOrderSummary
} from '../services/api';
import { validateBurkinaPhone } from '../utils/phoneValidation';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';

function CupcakeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3c.7 0 1.25.55 1.25 1.25S12.7 5.5 12 5.5s-1.25-.55-1.25-1.25S11.3 3 12 3z" />
      <path d="M6.5 13.5c-1.4 0-2.5-1.05-2.5-2.4 0-1.15.8-2.1 1.9-2.35A3.5 3.5 0 0 1 9.25 6c1.05 0 2 .45 2.75 1.18A3.75 3.75 0 0 1 14.75 6a3.5 3.5 0 0 1 3.35 2.75c1.1.25 1.9 1.2 1.9 2.35 0 1.35-1.1 2.4-2.5 2.4H6.5z" />
      <path d="M6.2 13.5 7.6 20a1.2 1.2 0 0 0 1.18.95h6.44a1.2 1.2 0 0 0 1.18-.95l1.4-6.5" />
      <path d="M9.5 13.5 10.1 20.9" />
      <path d="M14.5 13.5 13.9 20.9" />
    </svg>
  );
}

export function Loyalty() {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [member, setMember] = useState<LoyaltyMember | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [myCoupons, setMyCoupons] = useState<LoyaltyCoupon[]>([]);

  // Authentification / Connexion Portail 2
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPin, setFormPin] = useState('');
  const [needsPinSetup, setNeedsPinSetup] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Onglets Espace Client
  const [activeTab, setActiveTab] = useState<'loyalty' | 'orders' | 'profile'>('loyalty');
  const [myOrders, setMyOrders] = useState<CustomerOrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrderSummary | null>(null);

  // Édition profil
  const [profileName, setProfileName] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Récompenses
  const [claimingRewardId, setClaimingRewardId] = useState<number | null>(null);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState('');

  const { addToCart, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const initialNavMember = (location.state as { member?: LoyaltyMember } | null)?.member || null;
  const [checkingSession, setCheckingSession] = useState(!initialNavMember);

  const loadAuthenticatedMember = (m: LoyaltyMember) => {
    setMember(m);
    setProfileName(m.name || '');
    setProfileAddress(m.default_address || '');
    fetchCoupons(m.phone);
    getCustomerOrders().then(setMyOrders).catch(() => []);
  };

  // Chargement des paramètres et vérification session JWT client existante
  useEffect(() => {
    getLoyaltySettings().then(setSettings).catch(() => null);
    getLoyaltyRewards().then(setRewards).catch(() => []);

    if (initialNavMember) {
      loadAuthenticatedMember(initialNavMember);
      setCheckingSession(false);
    }

    getCustomerMe()
      .then((m) => {
        if (m) {
          loadAuthenticatedMember(m);
        } else if (!initialNavMember) {
          try {
            const savedSession = localStorage.getItem('le_ci_customer_loyalty');
            if (savedSession) {
              const parsed = JSON.parse(savedSession);
              if (parsed.phone) setFormPhone(parsed.phone);
              if (parsed.name) setFormName(parsed.name);
            }
          } catch {}
        }
      })
      .catch(() => null)
      .finally(() => setCheckingSession(false));
  }, []);

  const fetchCoupons = (phone: string) => {
    getMemberCoupons(phone).then(setMyCoupons).catch(() => []);
  };

  // Connexion ou Inscription (Compte Client = Fidélité)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneVal = validateBurkinaPhone(formPhone);
    if (!phoneVal.isValid) {
      setAuthError(phoneVal.error || 'Le numéro doit comporter 8 chiffres (avec ou sans +226 ou 00226).');
      return;
    }
    if (authMode === 'register' && !formName.trim()) {
      setAuthError('Veuillez renseigner votre nom complet.');
      return;
    }
    if (formPin.trim() && formPin.trim().length < 4) {
      setAuthError('Le mot de passe / code PIN doit comporter au moins 4 caractères.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');

    try {
      if (authMode === 'register') {
        const res = await registerLoyaltyMember({
          phone: formPhone.trim(),
          name: formName.trim(),
          pin: formPin.trim() || undefined
        });
        setAuthSuccessMsg(`🎉 Bienvenue ! Votre compte client & fidélité est créé avec vos points offerts !`);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#10B981', '#F59E0B']
        });
        loadAuthenticatedMember(res.member);
        setFormPhone('');
        setFormName('');
        setFormPin('');
        setNeedsPinSetup(false);
      } else {
        const res = await loginLoyaltyMember({
          phone: formPhone.trim(),
          pin: formPin.trim(),
          name: formName.trim() || undefined
        });
        if (res.needsPinSetup) {
          setNeedsPinSetup(true);
          setAuthError(res.message || 'Définissez un code PIN à 4 chiffres pour activer votre compte.');
          return;
        }
        if (res.member) {
          loadAuthenticatedMember(res.member);
          setFormPhone('');
          setFormName('');
          setFormPin('');
          setNeedsPinSetup(false);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erreur lors de la connexion. Vérifiez vos informations.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setMember(null);
    setMyCoupons([]);
    setMyOrders([]);
    setActiveTab('loyalty');
    logoutCustomer();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setProfileError('Le nom complet est obligatoire.');
      return;
    }
    if (newPin && newPin.trim().length < 4) {
      setProfileError('Le mot de passe / code PIN doit comporter au moins 4 caractères.');
      return;
    }
    setProfileSaving(true);
    setProfileError('');
    setProfileMsg('');
    try {
      const res = await updateCustomerProfile({
        name: profileName.trim(),
        defaultAddress: profileAddress.trim(),
        currentPin: currentPin.trim() || undefined,
        newPin: newPin.trim() || undefined
      });
      setMember(res.member);
      setCurrentPin('');
      setNewPin('');
      setProfileMsg('Profil mis à jour avec succès.');
    } catch (err: any) {
      setProfileError(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Échange de points contre un coupon de récompense (fidelity.md §2)
  const handleClaimReward = async (reward: LoyaltyReward) => {
    if (!member) return;
    if (member.points < reward.points_cost) {
      alert(`Points insuffisants (${member.points} pts disponibles pour ${reward.points_cost} pts requis)`);
      return;
    }
    if (confirm(`Échanger ${reward.points_cost} points contre "${reward.title}" ?`)) {
      setClaimingRewardId(reward.id);
      setClaimSuccessMsg('');
      try {
        const res = await claimRewardCoupon({ phone: member.phone, rewardId: reward.id });
        setClaimSuccessMsg(`🎉 Bravo ! Votre coupon ${res.code} pour "${res.rewardTitle}" est disponible !`);
        // Mettre à jour le membre et ses coupons
        const updated = await getLoyaltyMember(member.phone);
        setMember(updated);
        fetchCoupons(member.phone);
      } catch (err: any) {
        alert(err.message || 'Erreur lors de l\'échange');
      } finally {
        setClaimingRewardId(null);
      }
    }
  };

  const getTierDetails = (tier: string) => {
    switch (tier) {
      case 'GOLD':
        return {
          title: 'Membre Or Prestige',
          badge: 'bg-gradient-to-r from-amber-400 via-[#D4AF37] to-amber-600 text-white',
          discount: settings?.gold_discount_percent || 10,
          next: null,
          nextPoints: 0,
          progress: 100
        };
      case 'SILVER':
        const goldTarget = settings?.gold_min_points || 1500;
        const curPts = member?.points || 0;
        return {
          title: 'Membre Argent Gourmand',
          badge: 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-white',
          discount: settings?.silver_discount_percent || 5,
          next: 'Or Prestige',
          nextPoints: Math.max(0, goldTarget - curPts),
          progress: Math.min(100, Math.round((curPts / goldTarget) * 100))
        };
      default:
        const silverTarget = settings?.silver_min_points || 500;
        const curBronze = member?.points || 0;
        return {
          title: 'Membre Bronze Découverte',
          badge: 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 text-white',
          discount: 0,
          next: 'Argent Gourmand',
          nextPoints: Math.max(0, silverTarget - curBronze),
          progress: Math.min(100, Math.round((curBronze / silverTarget) * 100))
        };
    }
  };

  const tierInfo = member ? getTierDetails(member.tier) : null;
  const totalOrders = member?.orders_count || 0;
  const cardCount = totalOrders > 0 && totalOrders % 10 === 0 ? 10 : totalOrders % 10;
  const cycleProgress = totalOrders % 10;

  const handleReorder = (ord: CustomerOrderSummary) => {
    if (!ord.items || ord.items.length === 0) return;
    clearCart();
    ord.items.forEach((item: any, idx: number) => {
      const unitPrice = Number(item.price ?? item.numericPrice ?? 0);
      const qty = Math.max(1, Number(item.quantity || 1));
      const itemId =
        item.id && item.id !== 9999
          ? item.id
          : `reorder-${ord.id}-${idx}`;
      addToCart(
        {
          id: itemId,
          name: item.name || 'Article',
          numericPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
          price: `${(Number.isFinite(unitPrice) ? unitPrice : 0).toLocaleString('fr-FR')} FCFA`,
          image: item.image,
          category: item.category,
          description: item.description,
          portion: item.portion,
          flavor: item.flavor,
          catalogModel: item.catalogModel,
          isCake: item.isCake
        },
        qty
      );
    });
    navigate('/panier');
  };

  return (
    <div className="min-h-screen py-12 bg-[#FAF8F5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* En-tête Page Fidélisation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3 whitespace-nowrap truncate">
            {member ? `Bienvenue ${member.name}` : 'Mon Compte & Fidélité'}
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto text-sm">
            {member 
              ? `Bienvenue dans votre espace personnel, ${member.name}. Retrouvez vos commandes et vos avantages fidélité.`
              : 'Connectez-vous avec votre numéro WhatsApp (et votre mot de passe si vous en avez créé un) pour accéder à vos commandes et vos avantages fidélité.'}
          </p>
        </motion.div>

        {/* ========================================================================= */}
        {/* PORTAIL 2 : FORMULAIRE DE CONNEXION / INSCRIPTION SI NON CONNECTÉ */}
        {/* ========================================================================= */}
        {!member && !checkingSession && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-gray-100 mb-14"
          >
            {/* Onglets Toggle : Se connecter vs S'inscrire */}
            <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                  authMode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                  authMode === 'register' ? 'bg-[#D4AF37] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                S'inscrire
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                {authError}
              </div>
            )}

            {authSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {authSuccessMsg}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Votre Nom complet *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Amina Kaboré"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Numéro de téléphone (WhatsApp / Mobile Money) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 70123456"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {authMode === 'register'
                    ? 'Mot de passe (optionnel)'
                    : 'Mot de passe / Code PIN (si déjà défini)'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="password"
                    placeholder="••••"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {authMode === 'register'
                    ? 'Facultatif : vous pourrez aussi créer un mot de passe plus tard dans votre espace.'
                    : 'Laissez vide si vous n\'avez pas encore défini de mot de passe.'}
                </span>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 px-4 rounded-full bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] border-2 border-[#F8BE40] font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {authLoading ? (
                  <span>Vérification...</span>
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Accéder à mon Espace' : 'Rejoindre le programme'}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* ESPACE PERSONNEL DU CLIENT CONNECTÉ */}
        {/* ========================================================================= */}
        {member && tierInfo && (
          <div className="space-y-10">
            
            {!member.has_pin && (
              <div className="bg-red-50 border-2 border-[#C20A0A] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-[#C20A0A] shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-xs font-extrabold text-[#C20A0A]">
                      Protégez votre espace fidélité
                    </p>
                    <p className="text-[11px] text-[#C20A0A]/85">
                      Créez un mot de passe dans votre profil pour éviter qu'un autre appareil accède à votre espace fidélité.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setTimeout(() => {
                      document.getElementById('profile-settings-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 80);
                  }}
                  className="px-4 py-2 rounded-full bg-[#C20A0A] hover:bg-red-700 text-white text-xs font-bold shrink-0 cursor-pointer transition"
                >
                  Créer un mot de passe
                </button>
              </div>
            )}
            {/* NOTIFICATION DE RÉCOMPENSE DÉBLOQUÉE (4/10 ou 9/10) */}
            {(cycleProgress === 4 || cycleProgress === 9) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl mx-auto bg-gradient-to-r from-amber-50 via-[#FDF3E3] to-amber-50 border-2 border-[#F8BE40] rounded-3xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F8BE40] text-[#2B1204] flex items-center justify-center shrink-0">
                    <Gift size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#2B1204]">
                      {cycleProgress === 4
                        ? `Bravo ${member.name} ! -10% débloqués !`
                        : `Bravo ${member.name} ! -50% sur la livraison débloqués !`}
                    </p>
                    <p className="text-xs text-[#2B1204]/80 mt-0.5">
                      {cycleProgress === 4
                        ? 'Votre prochaine commande (5ème) bénéficie automatiquement de -10% de réduction dans votre panier.'
                        : 'Votre prochaine commande (10ème) bénéficie automatiquement de -50% sur les frais de livraison.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/catalogue')}
                  className="px-5 py-2.5 rounded-full bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] border-2 border-[#F8BE40] font-extrabold text-xs shadow-sm transition inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>
                    {cycleProgress === 4 ? 'Profiter de mes -10%' : 'Profiter des -50% liv.'}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </motion.div>
            )}

            {/* CARTE FIDÉLITÉ (10 CUPCAKES) */}
            <div className="flex justify-center">
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-md rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-2xl bg-gradient-to-br from-[#1F2937] via-[#111827] to-[#030712] text-white border border-[#D4AF37]/30 flex flex-col justify-between group">
                  <div className="absolute -right-20 -top-20 w-60 h-60 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
                  
                  <div className="flex justify-between items-center relative z-10">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Les Douceurs de Lissi
                    </h3>
                    <span className="text-base sm:text-lg font-black text-[#F8BE40] tracking-wide">
                      {cardCount} / 10
                    </span>
                  </div>

                  {/* 2 lignes de 5 cercles contenant chacun un cupcake */}
                  <div className="relative z-10 my-6 grid grid-cols-5 gap-2.5 sm:gap-3.5 justify-items-center">
                    {Array.from({ length: 10 }, (_, idx) => {
                      const step = idx + 1;
                      const isEarned = step <= cardCount;
                      const isMilestone = step === 5 || step === 10;
                      return (
                        <div key={step} className="flex flex-col items-center gap-1">
                          <div
                            title={
                              step === 5
                                ? '5ème commande : -10%'
                                : step === 10
                                  ? '10ème commande : Livraison -50%'
                                  : `Commande ${step}/10`
                            }
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                              isEarned
                                ? 'bg-[#F8BE40] text-[#2B1204] border-2 border-[#F8BE40] shadow-md'
                                : isMilestone
                                  ? 'bg-white/5 text-[#F8BE40]/85 border-2 border-dashed border-[#F8BE40]/75'
                                  : 'bg-white/5 text-white/40 border-2 border-white/25'
                            }`}
                          >
                            <CupcakeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          {step === 5 && (
                            <span className="text-[9px] font-extrabold text-[#F8BE40] leading-none">-10%</span>
                          )}
                          {step === 10 && (
                            <span className="text-[9px] font-extrabold text-[#F8BE40] leading-none">-50% liv.</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="relative z-10 flex justify-between items-end pt-3 border-t border-white/10">
                    <div>
                      <p className="text-sm font-bold text-white tracking-wide uppercase">{member.name}</p>
                      <p className="text-xs text-gray-400 font-mono">📱 +226 {member.phone}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-[#D4AF37]">
                      <Crown size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Onglets de l'Espace Client Unifié */}
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('loyalty')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'loyalty'
                    ? 'bg-[#2B1204] text-[#FDF8F2] shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Crown size={15} />
                <span>Fidélité & Avantages</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#2B1204] text-[#FDF8F2] shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Package size={15} />
                <span>Mes Commandes ({myOrders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#2B1204] text-[#FDF8F2] shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Settings size={15} />
                <span>Mon Profil</span>
              </button>
            </div>

            {activeTab === 'orders' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Package size={20} className="text-[#F8BE40]" />
                  <span>Historique de mes commandes</span>
                </h3>
                {myOrders.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <p className="text-sm text-gray-500">Vous n'avez pas encore passé de commande avec ce numéro.</p>
                    <button
                      onClick={() => navigate('/catalogue')}
                      className="px-6 py-2.5 rounded-full bg-[#F8BE40] text-[#2B1204] font-bold text-xs cursor-pointer"
                    >
                      Découvrir le catalogue
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myOrders.map((ord) => {
                      const statusLabel =
                        ord.statut === 'PAYEE' || ord.statut === 'EN_PREPARATION'
                          ? 'Payée / En préparation'
                          : ord.statut === 'PRETE'
                          ? 'Prête'
                          : ord.statut === 'LIVREE'
                          ? 'Livrée'
                          : ord.statut === 'ANNULEE'
                          ? 'Annulée'
                          : 'En attente de paiement';
                      const statusColor =
                        ord.statut === 'PAYEE' || ord.statut === 'EN_PREPARATION' || ord.statut === 'PRETE' || ord.statut === 'LIVREE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ord.statut === 'ANNULEE'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200';
                      return (
                        <div
                          key={ord.id}
                          className="p-4 rounded-2xl border border-gray-200 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-black text-[#2B1204]">
                                {ord.codeReference || ord.id}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {new Date(ord.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}{' '}
                              • {ord.items.length} article{ord.items.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <span className="font-black text-sm text-[#2B1204]">
                              {ord.totalAmount.toLocaleString('fr-FR')} FCFA
                            </span>
                            {ord.items && ord.items.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleReorder(ord)}
                                className="px-4 py-2 rounded-full bg-[#F8BE40] hover:bg-[#e5ac2e] text-xs font-extrabold text-[#2B1204] transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                              >
                                <RotateCcw size={13} />
                                <span>Commander</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              className="px-4 py-2 rounded-full bg-white border border-gray-200 hover:border-[#F8BE40] text-xs font-bold text-[#2B1204] transition cursor-pointer"
                            >
                              Voir détails
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
              <div id="profile-settings-card" className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 max-w-xl">
                <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Settings size={20} className="text-[#F8BE40]" />
                  <span>Paramètres de mon compte</span>
                </h3>
                {profileError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                    {profileError}
                  </div>
                )}
                {profileMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    {profileMsg}
                  </div>
                )}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nom complet</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F8BE40]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                      <MapPin size={14} className="text-gray-400" />
                      <span>Adresse / Lieu de livraison habituel (pré-rempli dans le panier)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Ouaga 2000, près de la pharmacie..."
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F8BE40]"
                    />
                  </div>
                  <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {member.has_pin && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Mot de passe actuel</label>
                        <input
                          type="password"
                          placeholder="••••"
                          value={currentPin}
                          onChange={(e) => setCurrentPin(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl"
                        />
                      </div>
                    )}
                    <div className={member.has_pin ? '' : 'sm:col-span-2'}>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {member.has_pin ? 'Nouveau mot de passe (min. 4 caractères)' : 'Sécuriser mon espace avec un mot de passe (min. 4 caractères)'}
                      </label>
                      <input
                        type="password"
                        placeholder="••••"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-3 rounded-full bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] font-black text-xs shadow-md transition cursor-pointer"
                  >
                    {profileSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </form>
              </div>
                {/* Barre nom, numéro & déconnexion */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{member.name}</h2>
                    <p className="text-xs text-gray-500 font-mono">📱 +226 {member.phone}</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => navigate('/panier')}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] border-2 border-[#F8BE40] font-bold text-xs rounded-full shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag size={15} />
                      <span>Mon Panier</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2.5 rounded-full border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'loyalty' && (
            <>
              {/* Progression & Récompenses par nombre de commandes */}
            <div className="space-y-4">
                <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="text-[#D4AF37]" size={20} />
                    <span>Progression Fidélité ({cardCount} / 10)</span>
                  </h3>

                  {cycleProgress === 4 && (
                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-[#F8BE40] text-[#2B1204] text-xs font-bold">
                      <Gift size={15} className="text-[#C20A0A]" />
                      <span>Votre prochaine commande (5ème commande) bénéficie de -10% automatiques !</span>
                    </div>
                  )}
                  {cycleProgress === 9 && (
                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-[#F8BE40] text-[#2B1204] text-xs font-bold">
                      <Gift size={15} className="text-[#C20A0A]" />
                      <span>Votre prochaine commande (10ème commande) bénéficie de -50% sur la livraison !</span>
                    </div>
                  )}
                  {cycleProgress < 4 && (
                    <p className="text-xs text-gray-600 mb-4">
                      Plus que <strong>{4 - cycleProgress}</strong> commande{4 - cycleProgress > 1 ? 's' : ''} pour débloquer <strong>-10%</strong> sur votre 5ème commande.
                    </p>
                  )}
                  {cycleProgress >= 5 && cycleProgress < 9 && (
                    <p className="text-xs text-gray-600 mb-4">
                      Plus que <strong>{9 - cycleProgress}</strong> commande{9 - cycleProgress > 1 ? 's' : ''} pour débloquer <strong>-50% sur la livraison</strong> à votre 10ème commande.
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-gray-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F8BE40] text-[#2B1204] flex items-center justify-center shrink-0 font-black text-xs">
                        5e
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-900">5ème commande</p>
                        <p className="text-[11px] text-gray-600">-10% de réduction sur la commande</p>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-gray-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F8BE40] text-[#2B1204] flex items-center justify-center shrink-0 font-black text-xs">
                        10e
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-900">10ème commande</p>
                        <p className="text-[11px] text-gray-600">-50% sur les frais de livraison</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-gray-100">
                      <span className="text-[11px] text-gray-500 font-semibold block">Total Dépensé</span>
                      <span className="text-base font-black text-gray-900">{member.total_spent.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-gray-100">
                      <span className="text-[11px] text-gray-500 font-semibold block">Commandes Réglées</span>
                      <span className="text-base font-black text-gray-900">{member.orders_count} commandes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historique des récompenses obtenues */}
              {(() => {
                const fifthCount = Math.floor((member.orders_count + 5) / 10);
                const tenthCount = Math.floor(member.orders_count / 10);
                const rewardedOrders = myOrders.filter((ord) => {
                  const notesStr = ord.notes || '';
                  const itemsSum = (ord.items || []).reduce((acc: number, it: any) => {
                    const p = Number(it.price ?? it.numericPrice ?? 0);
                    const q = Math.max(1, Number(it.quantity || 1));
                    return acc + (Number.isFinite(p) ? p * q : 0);
                  }, 0);
                  const hasCard = /Carte de v[œo]eux\s*\(\+200F\)/i.test(notesStr);
                  const saved = Math.max(0, itemsSum + (hasCard ? 200 : 0) - Number(ord.totalAmount || 0));
                  return saved > 0 || /Livraison -50%/i.test(notesStr);
                });

                if (fifthCount === 0 && tenthCount === 0 && rewardedOrders.length === 0) {
                  return null;
                }

                return (
                  <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="text-[#D4AF37]" size={18} />
                      <span>Mes Récompenses Déjà Obtenues</span>
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {fifthCount > 0 && (
                        <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
                          🎉 -10% (5ème commande) obtenu {fifthCount} fois
                        </span>
                      )}
                      {tenthCount > 0 && (
                        <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-[#F8BE40] text-[#2B1204] text-xs font-extrabold">
                          🚚 -50% livraison (10ème commande) obtenu {tenthCount} fois
                        </span>
                      )}
                    </div>

                    {rewardedOrders.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {rewardedOrders.map((ord) => {
                          const notesStr = ord.notes || '';
                          const itemsSum = (ord.items || []).reduce((acc: number, it: any) => {
                            const p = Number(it.price ?? it.numericPrice ?? 0);
                            const q = Math.max(1, Number(it.quantity || 1));
                            return acc + (Number.isFinite(p) ? p * q : 0);
                          }, 0);
                          const hasCard = /Carte de v[œo]eux\s*\(\+200F\)/i.test(notesStr);
                          const saved = Math.max(0, itemsSum + (hasCard ? 200 : 0) - Number(ord.totalAmount || 0));
                          const hasHalfDeliv = /Livraison -50%/i.test(notesStr);
                          return (
                            <div
                              key={ord.id}
                              className="p-3 rounded-2xl bg-[#FAF8F5] border border-gray-100 flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <p className="font-bold text-gray-900">
                                  Commande {ord.codeReference || ord.id}
                                </p>
                                <p className="text-[11px] text-gray-500">
                                  {new Date(ord.createdAt).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div className="text-right font-extrabold text-emerald-700">
                                {saved > 0 && <div>-{saved.toLocaleString('fr-FR')} FCFA (-10%)</div>}
                                {hasHalfDeliv && <div className="text-[#2B1204]">Livraison -50%</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            {/* MES COUPONS PRÊTS À L'EMPLOI (fidelity.md §2) */}
            {myCoupons.filter(c => c.status === 'ACTIVE').length > 0 && (
              <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <Ticket size={22} className="text-[#D4AF37]" />
                  <span>Mes Coupons de Récompense Actifs</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {myCoupons.filter(c => c.status === 'ACTIVE').map(c => (
                    <div key={c.id} className="p-5 rounded-2xl bg-gradient-to-br from-[#111827] to-[#1F2937] text-white border border-[#D4AF37]/40 shadow-md flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#D4AF37]">Coupon Lê-Ci</span>
                        <h4 className="text-sm font-bold text-white mt-1">{c.reward_title}</h4>
                        <div className="mt-3 p-3 bg-white/10 rounded-xl text-center border border-white/15">
                          <span className="text-[10px] text-gray-300 block mb-0.5">Code à présenter en caisse :</span>
                          <span className="text-xl font-mono font-black text-[#D4AF37] tracking-widest">{c.code}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-400 font-semibold mt-3 text-center">
                        ✓ Prêt à être validé par le personnel
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            </>
            )}

          </div>
        )}


        {/* ========================================================================= */}
        {/* FENÊTRE DÉTAILS DE COMMANDE */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {selectedOrder && (() => {
            const itemsSubtotal = (selectedOrder.items || []).reduce((sum: number, item: any) => {
              const price = Number(item.price ?? item.numericPrice ?? 0);
              const qty = Math.max(1, Number(item.quantity || 1));
              return sum + (Number.isFinite(price) ? price * qty : 0);
            }, 0);
            const hasCard = /Carte de v[œo]eux\s*\(\+200F\)/i.test(selectedOrder.notes || '');
            const hasHalfDelivery = /Livraison -50%/i.test(selectedOrder.notes || '');
            const expectedBeforeDiscount = itemsSubtotal + (hasCard ? 200 : 0);
            const discountAmount = Math.max(0, expectedBeforeDiscount - Number(selectedOrder.totalAmount || 0));

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedOrder(null)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border-2 border-[#F8BE40] space-y-5"
                >
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                    <div>
                      <span className="font-mono text-xs font-black text-[#581C87] bg-purple-100 px-2.5 py-0.5 rounded-full">
                        {selectedOrder.codeReference || selectedOrder.id}
                      </span>
                      <p className="text-xs text-gray-500 mt-1.5">
                        {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      aria-label="Fermer"
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* 1. Détails de la pâtisserie commandée */}
                  <div className="space-y-2.5">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-[#581C87]">
                      1. Détails de la pâtisserie commandée
                    </h4>
                    {(selectedOrder.items || []).map((item: any, idx: number) => {
                      const unitPrice = Number(item.price ?? item.numericPrice ?? 0);
                      const qty = Math.max(1, Number(item.quantity || 1));
                      return (
                        <div key={idx} className="p-3 rounded-xl bg-[#FAF8F5] border border-gray-200 text-xs space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-extrabold text-gray-900">{item.name || 'Article'}</span>
                            <span className="font-black text-[#2B1204] shrink-0">
                              {(unitPrice * qty).toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                          {item.flavor && (
                            <div className="text-gray-600">
                              <span className="font-semibold text-gray-700">Saveur :</span> {item.flavor}
                            </div>
                          )}
                          {item.catalogModel && (
                            <div className="text-gray-600">
                              <span className="font-semibold text-gray-700">Modèle :</span> {item.catalogModel}
                            </div>
                          )}
                          {item.description && (
                            <div className="text-gray-600 text-[11px]">{item.description}</div>
                          )}
                          <div className="flex flex-wrap gap-4 pt-1 text-gray-800 font-bold">
                            <span>Quantité : {qty}</span>
                            {item.portion && (
                              <span className="text-[#581C87]">Parts : {item.portion}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. Récapitulatif financier */}
                  <div className="pt-3 border-t border-gray-200 space-y-1.5 text-xs sm:text-sm">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-[#581C87] mb-2">
                      2. Récapitulatif financier
                    </h4>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-600">Prix des pâtisseries :</span>
                      <span className="font-bold text-gray-900">{itemsSubtotal.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    {hasCard && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-600">Carte de vœux :</span>
                        <span className="font-bold text-[#581C87]">+200 FCFA</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-emerald-700 font-semibold">Réduction fidélité :</span>
                        <span className="font-extrabold text-emerald-700">
                          -{discountAmount.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    )}
                    {hasHalfDelivery && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-amber-700 font-semibold">Avantage livraison :</span>
                        <span className="font-extrabold text-amber-700">-50% sur la livraison</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-black text-sm sm:text-base">
                      <span className="text-gray-900">Montant total :</span>
                      <span className="text-[#2B1204]">{Number(selectedOrder.totalAmount || 0).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="flex-1 py-2.5 px-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
                    >
                      Fermer
                    </button>
                    {selectedOrder.items && selectedOrder.items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const ord = selectedOrder;
                          setSelectedOrder(null);
                          handleReorder(ord);
                        }}
                        className="flex-1 py-2.5 px-4 rounded-full bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] border-2 border-[#F8BE40] font-extrabold text-xs shadow-md transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        <span>Commander</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

      </div>
    </div>
  );
}
