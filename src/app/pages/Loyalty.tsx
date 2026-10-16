import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  Award, 
  Sparkles, 
  Search, 
  Gift, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  TrendingUp, 
  Star,
  QrCode,
  Clock
} from 'lucide-react';
import { getLoyaltySettings, getLoyaltyMember, LoyaltySettings, LoyaltyMember } from '../services/api';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export function Loyalty() {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [member, setMember] = useState<LoyaltyMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { openCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    getLoyaltySettings()
      .then(setSettings)
      .catch((e) => console.error('Erreur chargement paramètres fidélité', e));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSearch.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await getLoyaltyMember(phoneSearch);
      setMember(data);
    } catch (err) {
      console.error(err);
      setMember(null);
    } finally {
      setLoading(false);
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
        const currentSilverPts = member?.points || 0;
        return {
          title: 'Membre Argent Gourmand',
          badge: 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-white',
          discount: settings?.silver_discount_percent || 5,
          next: 'Or Prestige',
          nextPoints: Math.max(0, goldTarget - currentSilverPts),
          progress: Math.min(100, Math.round((currentSilverPts / goldTarget) * 100))
        };
      default:
        const silverTarget = settings?.silver_min_points || 500;
        const currentBronzePts = member?.points || 0;
        return {
          title: 'Membre Bronze Découverte',
          badge: 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 text-white',
          discount: 0,
          next: 'Argent Gourmand',
          nextPoints: Math.max(0, silverTarget - currentBronzePts),
          progress: Math.min(100, Math.round((currentBronzePts / silverTarget) * 100))
        };
    }
  };

  const tierInfo = member ? getTierDetails(member.tier) : null;
  const discountValueFcfa = member && settings ? member.points * settings.point_value_fcfa : 0;

  return (
    <div className="min-h-screen py-12 bg-[#FAF8F5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* En-tête Prestige */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-extrabold uppercase tracking-widest mb-3">
            <Crown size={15} />
            <span>Club Privilège & Gourmandise</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Votre Fidélité Récompensée
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-base">
            Cumulez des points à chaque douceur dégustée chez <strong>Les Douceurs de Lê Ci</strong> et transformez-les en réductions immédiates sur vos prochaines commandes.
          </p>
        </motion.div>

        {/* Barre de Recherche par Téléphone */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto mb-12"
        >
          <form onSubmit={handleSearch} className="bg-white p-3 rounded-3xl shadow-lg border border-gray-100 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                placeholder="Entrez votre numéro (ex: 70123456)..."
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-[#D4AF37] hover:bg-[#c29d2b] text-white text-xs font-black shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Recherche...' : (
                <>
                  <span>Consulter</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Section Carte Membre VIP */}
        <AnimatePresence mode="wait">
          {member && tierInfo && (
            <motion.div
              key="member-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Carte Numérique Stylisée VIP */}
              <div className="lg:col-span-6 flex flex-col items-center">
                <div className="w-full max-w-md aspect-[1.6/1] rounded-3xl p-7 relative overflow-hidden shadow-2xl bg-gradient-to-br from-[#1F2937] via-[#111827] to-[#030712] text-white border border-[#D4AF37]/30 flex flex-col justify-between group">
                  {/* Effet holographique doré */}
                  <div className="absolute -right-20 -top-20 w-60 h-60 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Les Douceurs de Lê Ci</span>
                      <h3 className="text-xl font-black text-[#D4AF37] tracking-wider mt-0.5">CLUB PRIVILÈGE</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${tierInfo.badge}`}>
                      {member.tier}
                    </span>
                  </div>

                  {/* Puce Carte + Solde */}
                  <div className="relative z-10 my-auto flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Solde disponible</p>
                      <p className="text-4xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                        <span>{member.points.toLocaleString('fr-FR')}</span>
                        <span className="text-sm font-bold text-[#D4AF37]">Points</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Équivalent remise</p>
                      <p className="text-xl font-extrabold text-emerald-400">
                        {discountValueFcfa.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>

                  {/* Bas de carte */}
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

                {/* Bouton rapide commander avec réduction */}
                <button
                  onClick={() => openCart()}
                  className="mt-6 w-full max-w-md py-3.5 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#c29d2b] text-white font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Gift size={18} />
                  <span>Utiliser mes points dans le panier</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Détails & Progression du Membre */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="text-[#D4AF37]" size={20} />
                    <span>Statut : {tierInfo.title}</span>
                  </h3>

                  {tierInfo.discount > 0 && (
                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 size={15} />
                      <span>Vous bénéficiez de {tierInfo.discount}% de remise permanente sur toutes vos commandes !</span>
                    </div>
                  )}

                  {tierInfo.next && (
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-xs font-semibold text-gray-600">
                        <span>Progression vers le palier <strong>{tierInfo.next}</strong></span>
                        <span className="text-[#D4AF37] font-bold">{tierInfo.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-[#D4AF37] h-full rounded-full transition-all duration-700"
                          style={{ width: `${tierInfo.progress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Encore <strong>{tierInfo.nextPoints} points</strong> pour débloquer les avantages exclusifs du statut {tierInfo.next}.
                      </p>
                    </div>
                  )}

                  {/* Statistiques d'achats */}
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                    <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-gray-100">
                      <span className="text-[11px] text-gray-500 font-semibold block">Total Dépensé</span>
                      <span className="text-base font-black text-gray-900">{member.total_spent.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-gray-100">
                      <span className="text-[11px] text-gray-500 font-semibold block">Commandes Passées</span>
                      <span className="text-base font-black text-gray-900">{member.orders_count} commande{member.orders_count > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Historique des points */}
                {member.history && member.history.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span>Historique récent des points</span>
                    </h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {member.history.map((h) => (
                        <div key={h.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-gray-50 border border-gray-100">
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
            </motion.div>
          )}

          {hasSearched && !member && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-md mx-auto text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-200 mb-12"
            >
              <div className="w-16 h-16 rounded-full bg-amber-50 text-[#D4AF37] flex items-center justify-center mx-auto mb-4">
                <Gift size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun compte lié au {phoneSearch}</h3>
              <p className="text-xs text-gray-500 mb-6">
                Passez votre première commande pour recevoir automatiquement vos <strong>{settings?.welcome_bonus_points || 50} points de bienvenue</strong> !
              </p>
              <button
                onClick={() => navigate('/catalogue')}
                className="px-6 py-3 rounded-full bg-[#D4AF37] text-white font-bold text-xs shadow-md hover:bg-[#c29d2b] transition"
              >
                Passer ma première commande
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section Explicative : Règles définies par le Gérant */}
        <div className="mt-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Comment fonctionne le Club ?</h2>
            <p className="text-xs text-gray-500">Un barème clair et transparent pour vous faire plaisir à chaque commande.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Règle 1 : Gain */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mb-4 font-black text-xl">
                1 pt
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Dépensez & Cumulez</h3>
              <p className="text-xs text-gray-500">
                Gagnez <strong>1 point</strong> tous les <strong>{settings?.fcfa_per_point || 100} FCFA</strong> dépensés dès validation automatique Orange Money.
              </p>
            </div>

            {/* Règle 2 : Déduction */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Gift size={26} />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Déductions Immédiates</h3>
              <p className="text-xs text-gray-500">
                Chaque point vaut <strong>{settings?.point_value_fcfa || 1} FCFA</strong> de réduction directe dans le panier dès <strong>{settings?.min_points_to_redeem || 50} points</strong>.
              </p>
            </div>

            {/* Règle 3 : Paliers VIP */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#111827] text-[#D4AF37] flex items-center justify-center mb-4">
                <Crown size={26} />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Paliers Exclusifs</h3>
              <p className="text-xs text-gray-500">
                Passez <strong>Argent ({settings?.silver_min_points || 500} pts)</strong> ou <strong>Or ({settings?.gold_min_points || 1500} pts)</strong> pour débloquer jusqu'à <strong>{settings?.gold_discount_percent || 10}%</strong> de remise permanente.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
