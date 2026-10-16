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
  UserPlus
} from 'lucide-react';
import { 
  getLoyaltySettings, 
  getLoyaltyMember, 
  getLoyaltyRewards, 
  claimRewardCoupon, 
  getMemberCoupons, 
  registerLoyaltyMember,
  loginLoyaltyMember,
  LoyaltySettings, 
  LoyaltyMember, 
  LoyaltyReward, 
  LoyaltyCoupon 
} from '../services/api';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export function Loyalty() {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [member, setMember] = useState<LoyaltyMember | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [myCoupons, setMyCoupons] = useState<LoyaltyCoupon[]>([]);

  // Authentification / Connexion Portail 2
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Récompenses
  const [claimingRewardId, setClaimingRewardId] = useState<number | null>(null);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState('');

  const { openCart } = useCart();
  const navigate = useNavigate();

  // Chargement des paramètres et vérification session existante
  useEffect(() => {
    getLoyaltySettings().then(setSettings).catch(() => null);
    getLoyaltyRewards().then(setRewards).catch(() => []);

    // Vérifier si le client était déjà connecté dans le navigateur
    try {
      const savedSession = localStorage.getItem('le_ci_customer_loyalty');
      if (savedSession) {
        const { phone } = JSON.parse(savedSession);
        if (phone) {
          getLoyaltyMember(phone).then((m) => {
            if (m) {
              setMember(m);
              fetchCoupons(m.phone);
            }
          }).catch(() => null);
        }
      }
    } catch (e) {}
  }, []);

  const fetchCoupons = (phone: string) => {
    getMemberCoupons(phone).then(setMyCoupons).catch(() => []);
  };

  // Connexion ou Inscription (Portail 2)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPhone.trim()) {
      setAuthError('Veuillez renseigner votre numéro de téléphone.');
      return;
    }
    if (authMode === 'register' && !formName.trim()) {
      setAuthError('Veuillez renseigner votre nom complet.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');

    try {
      let loggedMember: LoyaltyMember | null = null;

      if (authMode === 'register') {
        const res = await registerLoyaltyMember({
          phone: formPhone.trim(),
          name: formName.trim()
        });
        loggedMember = res.member;
        setAuthSuccessMsg(`🎉 Bienvenue dans le Programme de Fidélité ! Vous recevez vos points offerts !`);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#10B981', '#F59E0B']
        });
      } else {
        // Mode Connexion
        const res = await loginLoyaltyMember({
          phone: formPhone.trim(),
          name: formName.trim() || undefined
        });
        loggedMember = res.member;
      }

      if (loggedMember) {
        setMember(loggedMember);
        fetchCoupons(loggedMember.phone);
        // Mémoriser la session client
        localStorage.setItem('le_ci_customer_loyalty', JSON.stringify({
          phone: loggedMember.phone,
          name: loggedMember.name
        }));
        setFormPhone('');
        setFormName('');
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
    localStorage.removeItem('le_ci_customer_loyalty');
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
  const discountFcfa = member && settings ? member.points * settings.point_value_fcfa : 0;

  return (
    <div className="min-h-screen py-12 bg-[#FAF8F5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* En-tête Page Fidélisation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-extrabold uppercase tracking-widest mb-3">
            <Crown size={15} />
            <span>Programme de Fidélisation RestoBoost</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-3">
            Espace Fidélisation & Récompenses
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto text-sm">
            {member 
              ? `Bienvenue dans votre espace personnel, ${member.name}. Profitez de vos réductions et douceurs offertes.`
              : 'Connectez-vous avec votre Nom et votre Numéro pour accéder à vos points et échanger vos récompenses.'}
          </p>
        </motion.div>

        {/* ========================================================================= */}
        {/* PORTAIL 2 : FORMULAIRE DE CONNEXION / INSCRIPTION SI NON CONNECTÉ */}
        {/* ========================================================================= */}
        {!member && (
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
                S'inscrire (+{settings?.welcome_bonus_points || 50} pts)
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

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Numéro de téléphone (Orange Money / WhatsApp) *
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
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Identifiant direct sans mot de passe complexe
                </span>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#c29d2b] text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <span>Vérification...</span>
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Accéder à mon Espace' : `Rejoindre & Récupérer ${settings?.welcome_bonus_points || 50} pts`}</span>
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
            
            {/* Barre de bienvenue & déconnexion */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center font-black text-base shadow-sm">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Bonjour, {member.name} !</h2>
                  <p className="text-xs text-gray-500 font-mono">📱 +226 {member.phone} • Membre depuis {new Date(member.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => openCart()}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c29d2b] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag size={15} />
                  <span>Mon Panier</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <LogOut size={14} />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>

            {/* CARTE VIP & PROGRESSION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Carte Numérique VIP */}
              <div className="lg:col-span-6 flex flex-col items-center">
                <div className="w-full max-w-md aspect-[1.6/1] rounded-3xl p-7 relative overflow-hidden shadow-2xl bg-gradient-to-br from-[#1F2937] via-[#111827] to-[#030712] text-white border border-[#D4AF37]/30 flex flex-col justify-between group">
                  <div className="absolute -right-20 -top-20 w-60 h-60 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Les Douceurs de Lê Ci</span>
                      <h3 className="text-xl font-black text-[#D4AF37] tracking-wider mt-0.5">CARTE FIDÉLITÉ</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${tierInfo.badge}`}>
                      {member.tier}
                    </span>
                  </div>

                  <div className="relative z-10 my-auto flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Solde de Points</p>
                      <p className="text-4xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                        <span>{member.points.toLocaleString('fr-FR')}</span>
                        <span className="text-sm font-bold text-[#D4AF37]">Pts</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Remise Équivalente</p>
                      <p className="text-xl font-extrabold text-emerald-400">
                        {discountFcfa.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 flex justify-between items-end pt-2 border-t border-white/10">
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

              {/* Progression & Avantages du Palier */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="text-[#D4AF37]" size={20} />
                    <span>Statut : {tierInfo.title}</span>
                  </h3>

                  {tierInfo.discount > 0 && (
                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 size={15} />
                      <span>Vous bénéficiez de {tierInfo.discount}% de réduction automatique permanente sur vos commandes !</span>
                    </div>
                  )}

                  {tierInfo.next && (
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-xs font-semibold text-gray-600">
                        <span>Progression vers <strong>{tierInfo.next}</strong></span>
                        <span className="text-[#D4AF37] font-bold">{tierInfo.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-[#D4AF37] h-full rounded-full transition-all duration-700"
                          style={{ width: `${tierInfo.progress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Plus que <strong>{tierInfo.nextPoints} points</strong> pour atteindre le statut {tierInfo.next}.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
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
            </div>

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
                        <span className="text-[10px] font-bold uppercase text-[#D4AF37]">Coupon RestoBoost</span>
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

            {/* CATALOGUE DES RÉCOMPENSES (fidelity.md §2) */}
            <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Gift size={22} className="text-[#D4AF37]" />
                    <span>Catalogue des Récompenses Disponibles</span>
                  </h3>
                  <p className="text-xs text-gray-500">Échangez vos points contre ces délices artisanaux</p>
                </div>
                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                  Points disponibles : <strong className="text-[#D4AF37]">{member.points} pts</strong>
                </span>
              </div>

              {claimSuccessMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                  <span>{claimSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {rewards.map(reward => {
                  const canAfford = member.points >= reward.points_cost;
                  const isClaiming = claimingRewardId === reward.id;

                  return (
                    <div key={reward.id} className="bg-[#FAF8F5] rounded-3xl overflow-hidden border border-gray-100 p-4 flex flex-col justify-between group hover:shadow-md transition">
                      {reward.image && (
                        <div className="h-36 rounded-2xl overflow-hidden mb-3 bg-gray-200">
                          <img src={reward.image} alt={reward.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{reward.category}</span>
                        <h4 className="text-sm font-bold text-gray-900 mt-0.5">{reward.title}</h4>
                        {reward.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{reward.description}</p>
                        )}
                        <span className="inline-block mt-3 px-3 py-1 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] font-black text-xs">
                          {reward.points_cost} points
                        </span>
                      </div>

                      <button
                        onClick={() => handleClaimReward(reward)}
                        disabled={!canAfford || isClaiming}
                        className={`mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                          canAfford
                            ? 'bg-[#111827] hover:bg-black text-white cursor-pointer'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isClaiming ? 'Génération...' : (canAfford ? 'Obtenir ce coupon' : `Manque ${reward.points_cost - member.points} pts`)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HISTORIQUE RÉCENT DES POINTS */}
            {member.history && member.history.length > 0 && (
              <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span>Historique des Points & Coupons</span>
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {member.history.map((h) => (
                    <div key={h.id} className="flex justify-between items-center text-xs p-3 rounded-2xl bg-gray-50 border border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-800">{h.description}</p>
                        <span className="text-[10px] text-gray-400">
                          {new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`font-black text-sm ${h.points > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {h.points > 0 ? `+${h.points}` : h.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
