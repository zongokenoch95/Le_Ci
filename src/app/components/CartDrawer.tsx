import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Crown, 
  Gift, 
  CheckCircle2, 
  Sparkles,
  Truck,
  Store,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Navigation,
  MessageSquare,
  Cake,
  Heart,
  ChevronDown,
  Info
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { 
  createOrder, 
  getLoyaltyMember, 
  redeemLoyaltyPoints, 
  LoyaltyMember,
  getDeliverySettings,
  calculateDeliveryFee,
  DeliverySettings
} from '../services/api';

// Options de parts pour les gâteaux dans le panier
const cakePortions = [
  { id: '6-8', label: '6 à 8 parts', multiplier: 1 },
  { id: '10-12', label: '10 à 12 parts', multiplier: 1.5 },
  { id: '15-20', label: '15 à 20 parts', multiplier: 2.2 },
  { id: '25-30', label: '25 à 30 parts', multiplier: 3.2 }
];

// Saveurs signatures pour gâteaux
const cakeFlavors = [
  'Vanille Bourbon pure',
  'Chocolat noir Grand Cru',
  'Fraisier / Fruits rouges',
  'Caramel au beurre salé',
  'Mangue & Passion locale',
  'Pistache & Framboise',
  'Red Velvet & Cream cheese',
  'Citron meringué'
];

export const CartDrawer: React.FC = () => {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount } = useCart();
  const navigate = useNavigate();

  // 1. Type de commande
  const [deliveryType, setDeliveryType] = useState<'livraison' | 'sur_place'>('livraison');

  // 2. Date et heure
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [deliveryDate, setDeliveryDate] = useState(minDate);
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('14h00 - 17h00');

  // 3. Coordonnées
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [backupPhone, setBackupPhone] = useState('');

  // 4. Lieu & Livraison au kilomètre
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [geoLocating, setGeoLocating] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number>(5);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(1000);
  const [isFreeDelivery, setIsFreeDelivery] = useState(false);

  // 5. Options gâteau (pour les gâteaux dans le panier)
  const [cakeOptions, setCakeOptions] = useState<{ [itemId: number]: { portion: string; flavor: string } }>({});

  // 6. Carte de petit mot
  const [hasGreetingCard, setHasGreetingCard] = useState(false);
  const [cardMessage, setCardMessage] = useState('');

  // 7. Fidélité
  const [memberInfo, setMemberInfo] = useState<LoyaltyMember | null>(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);

  // Soumission & erreurs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Chargement des paramètres de livraison au kilomètre
  useEffect(() => {
    getDeliverySettings()
      .then(settings => {
        if (settings) {
          setDeliverySettings(settings);
          // Calcul initial avec distance par défaut (5km)
          updateCalculatedFee(distanceKm, totalAmount, settings);
        }
      })
      .catch(err => console.warn('Erreur chargement barème livraison:', err));
  }, []);

  // Fonction de recalcul des frais de livraison
  const updateCalculatedFee = (km: number, cartTotal: number, settings: DeliverySettings | null) => {
    const currentSettings = settings || deliverySettings;
    if (!currentSettings || deliveryType === 'sur_place') {
      setDeliveryFee(0);
      setIsFreeDelivery(false);
      return;
    }

    if (currentSettings.free_threshold > 0 && cartTotal >= currentSettings.free_threshold) {
      setDeliveryFee(0);
      setIsFreeDelivery(true);
      return;
    }

    setIsFreeDelivery(false);
    const fee = Math.max(currentSettings.min_fee, Math.round(km * currentSettings.price_per_km));
    setDeliveryFee(fee);
  };

  // Recalcul dès que la distance, le total du panier ou le mode de livraison changent
  useEffect(() => {
    if (deliveryType === 'sur_place') {
      setDeliveryFee(0);
      setIsFreeDelivery(false);
    } else {
      updateCalculatedFee(distanceKm, totalAmount, deliverySettings);
    }
  }, [distanceKm, totalAmount, deliveryType, deliverySettings]);

  // Géolocalisation GPS multi-niveaux ultra robuste
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }
    setGeoLocating(true);

    const onGpsSuccess = async (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await calculateDeliveryFee({
          customerLat: latitude,
          customerLng: longitude,
          totalCartAmount: totalAmount
        });
        if (res && res.success) {
          setDistanceKm(res.distanceKm);
          setDeliveryFee(res.deliveryFee);
          setIsFreeDelivery(res.isFree);
          const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
          setDeliveryAddress(prev => prev ? `${prev} (GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})` : `Position GPS : ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (${mapsLink})`);
        }
      } catch (e) {
        console.warn('Erreur calcul serveur GPS:', e);
      } finally {
        setGeoLocating(false);
      }
    };

    const tryLowAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        onGpsSuccess,
        (err) => {
          console.warn('Erreur GPS client basse précision:', err);
          alert('Position GPS introuvable ou refusée. Vous pouvez indiquer votre quartier et ajuster le curseur de distance.');
          setGeoLocating(false);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      onGpsSuccess,
      () => {
        tryLowAccuracy();
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Fidélité : Recherche automatique du membre dès que 8 chiffres sont saisis
  useEffect(() => {
    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-8);
    if (cleanPhone.length === 8) {
      getLoyaltyMember(cleanPhone)
        .then((m) => {
          setMemberInfo(m);
          if (m && m.name && !customerName) {
            setCustomerName(m.name);
          }
          if (m && m.settings && m.points >= (m.settings.min_points_to_redeem || 50)) {
            const maxPointsByTotal = Math.floor(totalAmount / (m.settings.point_value_fcfa || 1));
            const availablePoints = Math.min(m.points, maxPointsByTotal);
            setPointsToUse(availablePoints);
          } else {
            setUseLoyaltyPoints(false);
            setPointsToUse(0);
          }
        })
        .catch(() => setMemberInfo(null));
    } else {
      setMemberInfo(null);
      setUseLoyaltyPoints(false);
    }
  }, [customerPhone, totalAmount]);

  // Calcul réductions fidélité
  const pointValue = memberInfo?.settings?.point_value_fcfa || 1;
  const loyaltyDiscount = useLoyaltyPoints ? pointsToUse * pointValue : 0;
  const tierDiscountPercent = memberInfo?.tier === 'GOLD' 
    ? (memberInfo.settings?.gold_discount_percent || 10) 
    : (memberInfo?.tier === 'SILVER' ? (memberInfo.settings?.silver_discount_percent || 5) : 0);
  const tierDiscountAmount = Math.round((totalAmount * tierDiscountPercent) / 100);
  const totalDiscount = loyaltyDiscount + tierDiscountAmount;

  // Montant Net Total
  const finalAmountToPay = Math.max(0, totalAmount + deliveryFee - totalDiscount);

  // Validation & Checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }
    if (deliveryType === 'livraison' && !deliveryAddress.trim()) {
      setErrorMsg('Veuillez préciser le quartier / adresse de livraison.');
      return;
    }
// Second numéro de secours facultatif (Point 12)
    if (hasGreetingCard && !cardMessage.trim()) {
      setErrorMsg('Veuillez renseigner le mot à inscrire sur la carte de vœux.');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Votre panier est vide.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Construction des notes complètes structurées
      const orderNotes = [
        `Mode: ${deliveryType === 'livraison' ? `Livraison (${distanceKm} km - ${deliveryFee} FCFA)` : 'Retrait sur place (Atelier)'}`,
        `Date souhaitée: ${deliveryDate} (${deliveryTimeSlot})`,
        deliveryType === 'livraison' ? `Adresse: ${deliveryAddress}` : '',
        backupPhone ? `Tél secours: ${backupPhone}` : '',
        hasGreetingCard ? `Carte de vœux: « ${cardMessage} »` : 'Sans carte',
        useLoyaltyPoints ? `Fidélité: -${loyaltyDiscount} FCFA (${pointsToUse} pts)` : '',
        tierDiscountPercent > 0 ? `Remise VIP ${memberInfo?.tier}: -${tierDiscountAmount} FCFA` : ''
      ].filter(Boolean).join(' | ');

      const order = await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: items.map((item) => {
          const opts = cakeOptions[item.id];
          return {
            id: item.id,
            name: opts ? `${item.name} (${opts.portion}, ${opts.flavor})` : item.name,
            price: item.numericPrice,
            quantity: item.quantity,
            image: item.image
          };
        }),
        montantTotal: finalAmountToPay,
        modePaiement: 'orange_money',
        notes: orderNotes
      });

      // Déduction des points fidélité si activé
      if (useLoyaltyPoints && pointsToUse > 0) {
        try {
          await redeemLoyaltyPoints({
            phone: customerPhone.trim(),
            pointsToRedeem: pointsToUse,
            orderId: order.id
          });
        } catch (e) {
          console.warn('Erreur déduction points (non bloquante):', e);
        }
      }

      clearCart();
      closeCart();
      navigate(`/paiement/${order.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la validation de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-purple-900/20 flex items-center justify-between bg-[#3B0764] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-purple-200">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base">Votre Panier</h3>
                    <button
                      onClick={() => { closeCart(); navigate('/panier'); }}
                      className="text-[11px] underline text-purple-200 hover:text-white font-medium"
                    >
                      (Ouvrir la page)
                    </button>
                  </div>
                  <p className="text-[11px] text-purple-200/80">
                    {totalItems} douceur{totalItems > 1 ? 's' : ''} sélectionnée{totalItems > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {items.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-300 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag size={28} />
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Votre panier est vide</p>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto mb-6">
                    Découvrez nos douceurs fraîches et ajoutez vos délices préférés en un clic.
                  </p>
                  <button
                    onClick={closeCart}
                    className="px-6 py-2.5 rounded-full bg-[#581C87] text-white text-xs font-bold shadow-md hover:bg-[#6B21A8] transition"
                  >
                    Explorer nos produits
                  </button>
                </div>
              ) : (
                <>
                  {/* LISTE DES ARTICLES AVEC OPTIONS GÂTEAUX */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                      Articles sélectionnés
                    </h4>
                    {items.map((item) => {
                      const isCake = item.category === 'Gâteaux' || item.name.toLowerCase().includes('gâteau') || item.name.toLowerCase().includes('layer') || item.name.toLowerCase().includes('fraisier');
                      const currentOpts = cakeOptions[item.id] || { portion: '10-12 parts', flavor: 'Vanille Bourbon pure' };

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-purple-200 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-xs text-gray-900 truncate">{item.name}</h5>
                              <p className="text-xs font-extrabold text-[#581C87] mt-0.5">
                                {(item.numericPrice * item.quantity).toLocaleString('fr-FR')} FCFA
                              </p>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center border border-gray-200 rounded-full bg-white px-2 py-0.5 shadow-sm">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="p-0.5 text-gray-400 hover:text-gray-700"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="w-6 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="p-0.5 text-gray-400 hover:text-gray-700"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>

                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition"
                                  title="Retirer l'article"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Options spécifiques aux Gâteaux */}
                          {isCake && (
                            <div className="mt-3 pt-3 border-t border-gray-200/60 grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                  <Cake size={11} className="text-[#581C87]" /> Parts :
                                </label>
                                <select
                                  value={currentOpts.portion}
                                  onChange={(e) => setCakeOptions({
                                    ...cakeOptions,
                                    [item.id]: { ...currentOpts, portion: e.target.value }
                                  })}
                                  className="w-full p-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-800 text-[11px]"
                                >
                                  {cakePortions.map(p => (
                                    <option key={p.id} value={p.label}>{p.label}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                  Saveur :
                                </label>
                                <select
                                  value={currentOpts.flavor}
                                  onChange={(e) => setCakeOptions({
                                    ...cakeOptions,
                                    [item.id]: { ...currentOpts, flavor: e.target.value }
                                  })}
                                  className="w-full p-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-800 text-[11px]"
                                >
                                  {cakeFlavors.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* FORMULAIRE UNIQUE DE COMMANDE & LIVRAISON */}
                  <form id="checkout-form" onSubmit={handleCheckout} className="space-y-5 pt-2">
                    
                    {/* 1. Mode de commande : Livraison vs Retrait */}
                    <div className="space-y-2">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700">
                        1. Mode de réception *
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setDeliveryType('livraison')}
                          className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex items-center gap-2.5 ${
                            deliveryType === 'livraison'
                              ? 'border-[#581C87] bg-purple-50/60 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Truck size={18} className={deliveryType === 'livraison' ? 'text-[#581C87]' : 'text-gray-400'} />
                          <div>
                            <div className="text-xs font-bold text-gray-900">Livraison</div>
                            <div className="text-[10px] text-gray-500">Au kilomètre</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeliveryType('sur_place')}
                          className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex items-center gap-2.5 ${
                            deliveryType === 'sur_place'
                              ? 'border-[#581C87] bg-purple-50/60 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Store size={18} className={deliveryType === 'sur_place' ? 'text-[#581C87]' : 'text-gray-400'} />
                          <div>
                            <div className="text-xs font-bold text-gray-900">Retrait atelier</div>
                            <div className="text-[10px] text-emerald-600 font-bold">Gratuit</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* 2. Lieu de livraison et calcul kilométrique (si livraison) */}
                    {deliveryType === 'livraison' && (
                      <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#581C87] flex items-center gap-1.5">
                            <MapPin size={14} /> Adresse / Quartier de livraison *
                          </label>
                          <button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={geoLocating}
                            className="text-[11px] font-bold text-[#581C87] bg-white px-2.5 py-1 rounded-full border border-purple-200 hover:bg-purple-100 flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Navigation size={11} className={geoLocating ? 'animate-spin' : ''} />
                            <span>{geoLocating ? 'GPS...' : '📍 Ma position GPS'}</span>
                          </button>
                        </div>

                        <input
                          type="text"
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Ex: Quartier Ouaga 2000, près de la pharmacie, porte 12..."
                          className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs text-gray-800 focus:border-[#581C87] focus:ring-1 focus:ring-[#581C87] outline-none"
                        />

                        {/* Réglage / Estimation de distance en km */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-gray-600 text-[11px] font-medium">Distance estimée :</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="1"
                              max="30"
                              step="0.5"
                              value={distanceKm}
                              onChange={(e) => setDistanceKm(Number(e.target.value))}
                              className="w-24 accent-[#581C87] cursor-pointer"
                            />
                            <span className="font-bold text-[#581C87] text-xs w-12 text-right">
                              {distanceKm} km
                            </span>
                          </div>
                        </div>

                        {/* Bandeau d'information tarifaire livraison */}
                        <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 flex items-center justify-between text-xs">
                          <span className="text-gray-600 text-[11px]">
                            {isFreeDelivery ? '🎉 Seuil gratuité atteint !' : `Tarif : ${deliverySettings?.price_per_km || 250} FCFA / km`}
                          </span>
                          <span className="font-extrabold text-[#581C87]">
                            {isFreeDelivery ? 'GRATUIT' : `+ ${deliveryFee.toLocaleString('fr-FR')} FCFA`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 3. Date et heure de réception */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Calendar size={13} className="text-[#581C87]" /> Date souhaitée *
                        </label>
                        <input
                          type="date"
                          min={minDate}
                          required
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:border-[#581C87] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Clock size={13} className="text-[#581C87]" /> Créneau horaire *
                        </label>
                        <select
                          value={deliveryTimeSlot}
                          onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:border-[#581C87] outline-none"
                        >
                          <option value="09h00 - 12h00">09h00 - 12h00 (Matin)</option>
                          <option value="14h00 - 17h00">14h00 - 17h00 (Après-midi)</option>
                          <option value="17h00 - 19h30">17h00 - 19h30 (Soir)</option>
                        </select>
                      </div>
                    </div>

                    {/* 4. Coordonnées client & Numéro de secours */}
                    <div className="space-y-2.5">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700">
                        2. Vos coordonnées *
                      </label>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <input
                            type="text"
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Nom complet *"
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-[#581C87] outline-none"
                          />
                        </div>

                        <div>
                          <input
                            type="tel"
                            required
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="Tél / WhatsApp *"
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-[#581C87] outline-none"
                          />
                        </div>
                      </div>

                      {/* Second numéro de secours pour la livraison */}
                      {deliveryType === 'livraison' && (
                        <div>
                          <input
                            type="tel"
                            required
                            value={backupPhone}
                            onChange={(e) => setBackupPhone(e.target.value)}
                            placeholder="Second numéro de secours (si le 1er ne passe pas) *"
                            className="w-full px-3 py-2 text-xs border border-purple-200 bg-purple-50/20 rounded-xl focus:border-[#581C87] outline-none"
                          />
                          <span className="block text-[10px] text-gray-400 mt-1">
                            Important pour le livreur en cas d'injoignabilité du premier numéro.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 5. Carte de petit mot (Option 9 et 10) */}
                    <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <MessageSquare size={13} className="text-[#581C87]" />
                          Carte de petit mot (offerte)
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setHasGreetingCard(false)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                              !hasGreetingCard ? 'bg-[#581C87] text-white shadow-xs' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            Sans
                          </button>
                          <button
                            type="button"
                            onClick={() => setHasGreetingCard(true)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                              hasGreetingCard ? 'bg-[#581C87] text-white shadow-xs' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            Avec carte
                          </button>
                        </div>
                      </div>

                      {hasGreetingCard && (
                        <textarea
                          rows={2}
                          required
                          value={cardMessage}
                          onChange={(e) => setCardMessage(e.target.value)}
                          placeholder="Saisissez votre mot doux ou vœux personnalisés à écrire sur la carte..."
                          className="w-full p-2.5 rounded-xl border border-gray-200 text-xs bg-white outline-none focus:border-[#581C87]"
                        />
                      )}
                    </div>

                    {/* Module Fidélité si reconnu */}
                    {memberInfo && (
                      <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-[#581C87] flex items-center gap-1.5">
                            <Crown size={14} /> Membre {memberInfo.tier} : {memberInfo.points} pts
                          </span>
                          {pointsToUse > 0 && (
                            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-[#581C87]">
                              <input
                                type="checkbox"
                                checked={useLoyaltyPoints}
                                onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                                className="rounded text-[#581C87]"
                              />
                              <span>Utiliser {pointsToUse} pts (-{loyaltyDiscount} FCFA)</span>
                            </label>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Messages d'erreur */}
                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                        {errorMsg}
                      </div>
                    )}

                    {/* Récapitulatif des montants */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-500">
                        <span>Sous-total douceurs</span>
                        <span className="font-semibold text-gray-900">{totalAmount.toLocaleString('fr-FR')} FCFA</span>
                      </div>

                      <div className="flex justify-between text-gray-500">
                        <span>Frais de livraison {deliveryType === 'livraison' ? `(${distanceKm} km)` : ''}</span>
                        <span className={`font-semibold ${deliveryFee === 0 ? 'text-emerald-600 font-bold' : 'text-gray-900'}`}>
                          {deliveryType === 'sur_place' ? 'Gratuit (Retrait)' : (deliveryFee === 0 ? 'Offerte' : `+ ${deliveryFee.toLocaleString('fr-FR')} FCFA`)}
                        </span>
                      </div>

                      {totalDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Réductions fidélité</span>
                          <span>- {totalDiscount.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-2 flex justify-between items-center text-sm">
                        <span className="font-extrabold text-gray-900">Total à payer</span>
                        <span className="text-lg font-black text-[#581C87]">
                          {finalAmountToPay.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </div>

                    {/* Bouton de validation Pill */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 px-6 rounded-full bg-[#581C87] hover:bg-[#6B21A8] text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-purple-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5"
                    >
                      <ShieldCheck size={16} />
                      <span>{isSubmitting ? 'Validation...' : 'Commander et Payer (Orange Money)'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
