import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft,
  Truck, 
  Store, 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  MapPin, 
  Navigation, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Crown, 
  Gift, 
  Sparkles,
  CreditCard,
  Loader2,
  Cake,
  Heart,
  ChevronRight
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

// Options de parts et saveurs standards pour les gâteaux catalogue
const cakePortions = [
  { id: '6-8', label: '6 à 8 parts' },
  { id: '10-12', label: '10 à 12 parts' },
  { id: '15-20', label: '15 à 20 parts' },
  { id: '25-30', label: '25 à 30 parts' }
];

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

export const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount } = useCart();
  const navigate = useNavigate();

  // Chargement des préférences de commande pré-remplies (depuis la personnalisation de gâteau par ex.)
  const savedPref = useMemo(() => {
    try {
      const p = localStorage.getItem('le_ci_checkout_pref');
      return p ? JSON.parse(p) : null;
    } catch {
      return null;
    }
  }, []);

  // 1. Type de commande
  const [deliveryType, setDeliveryType] = useState<'livraison' | 'sur_place'>(savedPref?.deliveryType || 'livraison');

  // 2. Date et heure
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [deliveryDate, setDeliveryDate] = useState<string>(savedPref?.deliveryDate || minDate);
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<string>(savedPref?.deliveryTimeSlot || '14h00 - 17h00');

  // 3. Coordonnées de réception (Point 21 : coordonnées de la personne qui va recevoir + secours)
  const [recipientPhone, setRecipientPhone] = useState<string>(savedPref?.customerPhone || '');
  const [recipientName, setRecipientName] = useState<string>(savedPref?.customerName || '');
  const [backupPhone, setBackupPhone] = useState<string>(savedPref?.backupPhone || '');

  // 4. Lieu & Livraison au kilomètre
  const [deliveryAddress, setDeliveryAddress] = useState<string>(savedPref?.deliveryAddress || '');
  const [geoLocating, setGeoLocating] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number>(5);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(1000);
  const [isFreeDelivery, setIsFreeDelivery] = useState(false);
  const [geoStatusMsg, setGeoStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 5. Options pour gâteaux standards du catalogue
  const [cakeOptions, setCakeOptions] = useState<{ [itemId: string | number]: { portion: string; flavor: string } }>({});

  // 6. Carte de petit mot manuscrite (+200 FCFA)
  const [hasGreetingCard, setHasGreetingCard] = useState<boolean>(false);
  const [cardMessage, setCardMessage] = useState<string>('');

  // 7. Fidélité
  const [memberInfo, setMemberInfo] = useState<LoyaltyMember | null>(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);

  // Notes additionnelles
  const [orderNotes, setOrderNotes] = useState<string>(savedPref?.notes || '');

  // États de soumission et erreurs de validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [errorMsg, setErrorMsg] = useState('');

  const setSingleError = (key: string, msg: string, elementId: string) => {
    setFieldErrors({ [key]: msg });
    setErrorMsg(msg);
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 60);
  };

  const clearFieldError = (key: string) => {
    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      setErrorMsg('');
    }
  };

  // Chargement des paramètres de livraison
  useEffect(() => {
    getDeliverySettings()
      .then(settings => {
        if (settings) {
          setDeliverySettings(settings);
          updateCalculatedFee(distanceKm, totalAmount, settings);
        }
      })
      .catch(err => console.warn('Erreur barème livraison:', err));
  }, []);

  // Recalcul des frais de livraison
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

  useEffect(() => {
    if (deliveryType === 'sur_place') {
      setDeliveryFee(0);
      setIsFreeDelivery(false);
    } else {
      updateCalculatedFee(distanceKm, totalAmount, deliverySettings);
    }
  }, [distanceKm, totalAmount, deliveryType, deliverySettings]);

  // Géolocalisation GPS multi-niveaux
  const handleGetLocation = () => {
    setGeoStatusMsg(null);
    if (!navigator.geolocation) {
      setGeoStatusMsg({ type: 'error', text: "La géolocalisation n'est pas supportée par votre navigateur." });
      return;
    }
    setGeoLocating(true);

    const onLocationFound = async (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      let label = `Position GPS : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

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
        }
      } catch (e) {
        console.warn('Erreur calcul serveur GPS:', e);
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (geoRes.ok) {
          const data = await geoRes.json();
          if (data && data.display_name) {
            const shortQ = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || data.display_name.split(',')[0];
            label = `📍 ${shortQ} (GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
          }
        }
      } catch (e) {}

      setDeliveryAddress(prev => prev ? `${prev} | ${label}` : label);
      clearFieldError('deliveryAddress');
      setGeoStatusMsg({ type: 'success', text: "Coordonnées GPS capturées et distance calculée !" });
      setGeoLocating(false);
    };

    const tryLowAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        onLocationFound,
        () => {
          setGeoStatusMsg({ type: 'error', text: "Position GPS introuvable. Veuillez choisir un quartier ci-dessous." });
          setGeoLocating(false);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      onLocationFound,
      () => tryLowAccuracy(),
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  // Recherche automatique membre fidélité dès 8 chiffres
  useEffect(() => {
    const cleanPhone = recipientPhone.replace(/\D/g, '').slice(-8);
    if (cleanPhone.length === 8) {
      getLoyaltyMember(cleanPhone)
        .then((m) => {
          setMemberInfo(m);
          if (m && m.name && !recipientName) {
            setRecipientName(m.name);
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
  }, [recipientPhone, totalAmount]);

  // Calcul réductions
  const pointValue = memberInfo?.settings?.point_value_fcfa || 1;
  const loyaltyDiscount = useLoyaltyPoints ? pointsToUse * pointValue : 0;
  const tierDiscountPercent = memberInfo?.tier === 'GOLD' 
    ? (memberInfo.settings?.gold_discount_percent || 10) 
    : (memberInfo?.tier === 'SILVER' ? (memberInfo.settings?.silver_discount_percent || 5) : 0);
  const tierDiscountAmount = Math.round((totalAmount * tierDiscountPercent) / 100);
  const cardSupplement = hasGreetingCard ? 200 : 0;

  // Montant Net Total
  const finalAmountToPay = Math.max(0, totalAmount + deliveryFee + cardSupplement - loyaltyDiscount - tierDiscountAmount);

  // Validation du formulaire de panier
  const validateCartCheckout = () => {
    if (!recipientPhone.trim()) {
      setSingleError('recipientPhone', 'Veuillez renseigner le numéro WhatsApp ou téléphone de la personne qui va recevoir le colis.', 'field-cart-phone');
      return false;
    }
    if (deliveryType === 'livraison' && !deliveryAddress.trim()) {
      setSingleError('deliveryAddress', 'Veuillez préciser le quartier et lieu de livraison.', 'field-cart-address');
      return false;
    }
    if (hasGreetingCard && !cardMessage.trim()) {
      setSingleError('cardMessage', 'Veuillez rédiger le mot à inscrire sur la carte de vœux.', 'field-cart-cardMessage');
      return false;
    }
    setFieldErrors({});
    setErrorMsg('');
    return true;
  };

  // Soumission et redirection vers le paiement Orange Money
  const handleProceedToPayment = async () => {
    if (items.length === 0) {
      setErrorMsg('Votre panier est vide.');
      return;
    }
    if (!validateCartCheckout()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const finalNotes = [
        `Mode: ${deliveryType === 'livraison' ? `Livraison (${distanceKm} km - ${deliveryFee} FCFA)` : 'Retrait atelier'}`,
        `Date souhaitée: ${deliveryDate} (${deliveryTimeSlot})`,
        `Réceptionnaire: ${recipientPhone.trim()}${recipientName.trim() ? ` (${recipientName.trim()})` : ''}`,
        backupPhone.trim() ? `Tél secours: ${backupPhone.trim()}` : '',
        deliveryType === 'livraison' ? `Adresse: ${deliveryAddress.trim()}` : 'Retrait atelier',
        hasGreetingCard ? `Carte de vœux (+200F): « ${cardMessage.trim()} »` : 'Sans carte',
        useLoyaltyPoints ? `Fidélité: -${loyaltyDiscount} FCFA (${pointsToUse} pts)` : '',
        tierDiscountPercent > 0 ? `Remise VIP ${memberInfo?.tier}: -${tierDiscountAmount} FCFA` : '',
        orderNotes.trim() ? `Notes spéciales: ${orderNotes.trim()}` : ''
      ].filter(Boolean).join(' | ');

      const order = await createOrder({
        customerName: recipientName.trim() || 'Client Les Douceurs de Lê Ci',
        customerPhone: recipientPhone.trim(),
        items: items.map((item) => {
          const opts = cakeOptions[item.id];
          return {
            id: typeof item.id === 'number' ? item.id : 9999,
            name: opts 
              ? `${item.name} (${opts.portion}, ${opts.flavor})` 
              : (item.description ? `${item.name} [${item.description}]` : item.name),
            price: item.numericPrice,
            quantity: item.quantity,
            image: item.image
          };
        }),
        montantTotal: finalAmountToPay,
        modePaiement: 'orange_money',
        notes: finalNotes
      });

      // Déduction des points fidélité si activé
      if (useLoyaltyPoints && pointsToUse > 0) {
        try {
          await redeemLoyaltyPoints({
            phone: recipientPhone.trim(),
            pointsToRedeem: pointsToUse,
            orderId: order.id
          });
        } catch (e) {
          console.warn('Erreur déduction points (non bloquante):', e);
        }
      }

      // Nettoyage et redirection vers la page de vérification de paiement
      clearCart();
      localStorage.removeItem('le_ci_checkout_pref');
      navigate(`/paiement/${order.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la validation de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 sm:py-16 bg-[#FAF8F5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Fil d'Ariane & Titre */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-3">
            <Link to="/" className="hover:text-[#581C87] transition">Accueil</Link>
            <ChevronRight size={14} />
            <span className="text-[#581C87] font-bold">Mon Panier Gourmand</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-[#581C87] uppercase tracking-wider mb-2">
                <ShoppingBag size={13} /> Finalisation de commande
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Votre Panier Gourmand
              </h1>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-600 transition cursor-pointer self-start sm:self-center"
              >
                <Trash2 size={14} />
                <span>Vider le panier</span>
              </button>
            )}
          </div>
        </div>

        {/* Message d'erreur global si applicable */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-sm"
          >
            <AlertCircle size={20} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* État panier vide */}
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-purple-100 shadow-sm max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-purple-50 text-purple-400 flex items-center justify-center mx-auto mb-5">
              <ShoppingBag size={36} />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">Votre panier est vide</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-light mb-8 max-w-sm mx-auto leading-relaxed">
              Laissez-vous tenter par nos douceurs artisanales fraîches ou concevez un gâteau d'exception sur-mesure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/catalogue"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#581C87] text-white text-xs font-bold shadow-md hover:bg-[#6B21A8] transition text-center"
              >
                Explorer nos douceurs
              </Link>
              <Link
                to="/sur-commande"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-purple-50 text-[#581C87] text-xs font-bold hover:bg-purple-100 transition text-center border border-purple-200"
              >
                Créer un gâteau sur-mesure
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLONNE GAUCHE (7 cols) : Liste des articles & Formulaire complet */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* 1. LISTE DES ARTICLES SÉLECTIONNÉS */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">1</span>
                    Articles sélectionnés ({totalItems})
                  </h2>
                </div>

                <div className="divide-y divide-gray-100 space-y-4">
                  {items.map((item) => {
                    const isCake = item.category === 'Gâteaux' || item.name.toLowerCase().includes('gâteau') || item.name.toLowerCase().includes('layer') || item.name.toLowerCase().includes('fraisier');
                    const isCustomCake = String(item.id).startsWith('custom-cake') || !!item.description;
                    const currentOpts = cakeOptions[item.id] || { portion: '10 à 12 parts', flavor: 'Vanille Bourbon pure' };

                    return (
                      <div key={item.id} className="pt-4 first:pt-0">
                        <div className="flex items-start gap-4">
                          <img
                            src={item.image || '/products/gateau_1.jpeg'}
                            alt={item.name}
                            className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-gray-200 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-[#581C87] mb-1">
                                  {item.category || 'Pâtisserie'}
                                </span>
                                <h3 className="font-extrabold text-sm text-gray-900 leading-snug">
                                  {item.name}
                                </h3>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition cursor-pointer"
                                title="Supprimer cet article"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {/* Détails personnalisés pour gâteau sur-mesure */}
                            {item.description && (
                              <p className="text-[11px] text-purple-900/80 bg-purple-50/60 p-2.5 rounded-xl border border-purple-100 font-medium mt-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            {/* Options portions & saveurs si gâteau catalogue standard */}
                            {isCake && !isCustomCake && (
                              <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Parts :</label>
                                  <select
                                    value={currentOpts.portion}
                                    onChange={(e) => setCakeOptions({
                                      ...cakeOptions,
                                      [item.id]: { ...currentOpts, portion: e.target.value }
                                    })}
                                    className="w-full p-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-800 text-xs"
                                  >
                                    {cakePortions.map(p => (
                                      <option key={p.id} value={p.label}>{p.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Saveur :</label>
                                  <select
                                    value={currentOpts.flavor}
                                    onChange={(e) => setCakeOptions({
                                      ...cakeOptions,
                                      [item.id]: { ...currentOpts, flavor: e.target.value }
                                    })}
                                    className="w-full p-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-800 text-xs"
                                  >
                                    {cakeFlavors.map(f => (
                                      <option key={f} value={f}>{f}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* Quantité & Prix */}
                            <div className="flex items-center justify-between mt-3 pt-2">
                              <div className="flex items-center border border-gray-200 rounded-full bg-white px-2 py-1 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                                  title="Diminuer la quantité"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="w-8 text-center text-xs font-extrabold text-gray-900">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                                  title="Augmenter la quantité"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>

                              <div className="text-right">
                                <div className="text-xs text-gray-400">
                                  {item.numericPrice.toLocaleString('fr-FR')} F / unité
                                </div>
                                <div className="text-sm sm:text-base font-black text-[#581C87]">
                                  {(item.numericPrice * item.quantity).toLocaleString('fr-FR')} FCFA
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. MODE DE RÉCEPTION */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">2</span>
                  Mode de réception
                </h2>
                <p className="text-xs text-gray-500 mb-4 font-light">
                  Choisissez si vous souhaitez vous faire livrer à l'adresse de votre choix ou retirer directement à notre atelier.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('livraison')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      deliveryType === 'livraison'
                        ? 'border-[#581C87] bg-purple-50/70 shadow-sm ring-2 ring-[#581C87]/20 text-[#581C87]'
                        : 'border-gray-200 hover:border-purple-200 text-gray-700 bg-white'
                    }`}
                  >
                    <Truck size={22} className="shrink-0 text-[#581C87]" />
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm">Livraison à domicile</div>
                      <div className="text-[11px] text-gray-500 font-light mt-0.5">Calculée selon le barème kilométrique</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('sur_place')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      deliveryType === 'sur_place'
                        ? 'border-[#581C87] bg-purple-50/70 shadow-sm ring-2 ring-[#581C87]/20 text-[#581C87]'
                        : 'border-gray-200 hover:border-purple-200 text-gray-700 bg-white'
                    }`}
                  >
                    <Store size={22} className="shrink-0 text-[#581C87]" />
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm">Retrait à l'atelier (Gratuit)</div>
                      <div className="text-[11px] text-gray-500 font-light mt-0.5">Emballage soigné & prêt à l'heure</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. DATE & HEURE DE RÉCEPTION */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">3</span>
                  Date & Heure souhaitées
                </h2>
                <p className="text-xs text-gray-500 mb-6 font-light">
                  Nos créations sont préparées le jour même de votre événement pour garantir une fraîcheur absolue.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#581C87]" />
                      Date de réception *
                    </label>
                    <input
                      type="date"
                      min={minDate}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Clock size={14} className="text-[#581C87]" />
                      Créneau ou heure souhaitée *
                    </label>
                    <input
                      type="text"
                      value={deliveryTimeSlot}
                      onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                      placeholder="Ex: 15h30, début d'après-midi, 18h..."
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4. COORDONNÉES DE LA PERSONNE QUI VA RECEVOIR LE COLIS (Point 21) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">4</span>
                  Coordonnées de la personne qui va recevoir le colis
                </h2>
                <p className="text-xs text-gray-500 mb-6 font-light">
                  Le livreur contactera ce numéro pour la remise en main propre. Vous pouvez ajouter un second numéro de secours.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Phone size={14} className="text-[#581C87]" />
                      Numéro WhatsApp / Téléphone de réception *
                    </label>
                    <input
                      id="field-cart-phone"
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => { setRecipientPhone(e.target.value); clearFieldError('recipientPhone'); }}
                      placeholder="Ex: 70 00 00 00"
                      className={`w-full px-4 py-3.5 rounded-2xl outline-none text-sm transition ${
                        fieldErrors.recipientPhone 
                          ? 'border-2 border-red-500 bg-red-50/20 ring-2 ring-red-200' 
                          : 'border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200'
                      }`}
                    />
                    {fieldErrors.recipientPhone && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-1.5 animate-pulse">
                        <AlertCircle size={13} className="text-red-500 shrink-0" />
                        <span>{fieldErrors.recipientPhone}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                        <User size={14} className="text-[#581C87]" />
                        Nom de la personne qui reçoit <span className="text-[11px] font-normal text-gray-400">(optionnel)</span>
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Ex: Salimata Traoré"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Phone size={14} className="text-[#581C87]" />
                        Second numéro de secours <span className="text-[11px] font-normal text-gray-400">(optionnel)</span>
                      </label>
                      <input
                        type="tel"
                        value={backupPhone}
                        onChange={(e) => setBackupPhone(e.target.value)}
                        placeholder="Ex: 76 00 00 00"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. LIEU DE LIVRAISON (si livraison choisie) */}
              {deliveryType === 'livraison' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">5</span>
                      Lieu & Adresse de livraison
                    </h2>
                    
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={geoLocating}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-100 text-[#581C87] text-xs font-bold hover:bg-purple-200 transition cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Navigation size={13} className={geoLocating ? 'animate-spin' : ''} />
                      <span>{geoLocating ? 'Localisation en cours...' : '📍 Utiliser ma position GPS'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-4 font-light">
                    Indiquez votre quartier et repères visuels pour faciliter l'acheminement de vos douceurs.
                  </p>

                  <textarea
                    id="field-cart-address"
                    rows={3}
                    value={deliveryAddress}
                    onChange={(e) => { setDeliveryAddress(e.target.value); clearFieldError('deliveryAddress'); }}
                    placeholder="Ex: Quartier Ouaga 2000, à 200m de la pharmacie, villa blanche portail marron..."
                    className={`w-full p-4 rounded-2xl outline-none text-sm leading-relaxed transition ${
                      fieldErrors.deliveryAddress 
                        ? 'border-2 border-red-500 bg-red-50/20 ring-2 ring-red-200' 
                        : 'border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200'
                    }`}
                  />
                  {fieldErrors.deliveryAddress && (
                    <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-1.5 animate-pulse">
                      <AlertCircle size={13} className="text-red-500 shrink-0" />
                      <span>{fieldErrors.deliveryAddress}</span>
                    </p>
                  )}

                  {/* Message GPS */}
                  {geoStatusMsg && (
                    <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      geoStatusMsg.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {geoStatusMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      <span>{geoStatusMsg.text}</span>
                    </div>
                  )}

                  {/* Curseur de distance kilométrique */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-[#581C87]" />
                        Distance estimée depuis l'atelier :
                      </span>
                      <span className="text-[#581C87] font-black">{distanceKm} km</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(Number(e.target.value))}
                      className="w-full accent-[#581C87] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>Proche (1 km)</span>
                      <span>Moyen (10 km)</span>
                      <span>Périphérie (30 km)</span>
                    </div>
                  </div>

                  {/* Chips des quartiers de Ouagadougou */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-[11px] font-bold text-gray-500 block mb-1.5">
                      ✦ Sélection rapide par quartier :
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Ouaga 2000', 'Zone du Bois', 'Koulouba', 'Dassasgho', 'Somgandé', 'Patte d\'Oie', 'Gounghin', 'Pissy', 'Karpala', 'Tampouy', 'Wayalghin', 'Tanghin'].map((q) => (
                        <button
                          type="button"
                          key={q}
                          onClick={() => { setDeliveryAddress(prev => prev ? `${prev}, ${q}` : q); clearFieldError('deliveryAddress'); }}
                          className="px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-[#581C87] text-[11px] font-semibold border border-purple-200/80 transition cursor-pointer"
                        >
                          + {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. CARTE DE VŒUX PERSONNALISÉE (+200 FCFA) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">6</span>
                    Carte de vœux manuscrite (+200 FCFA)
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mb-4 font-light">
                  Glissez une délicate attention manuscrite dans le coffret pour sublimer votre cadeau.
                </p>

                <div className="flex gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setHasGreetingCard(false)}
                    className={`flex-1 py-3 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
                      !hasGreetingCard ? 'bg-[#581C87] text-white shadow-sm' : 'bg-purple-50 text-gray-700 hover:bg-purple-100/60'
                    }`}
                  >
                    Sans carte de vœux
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasGreetingCard(true)}
                    className={`flex-1 py-3 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
                      hasGreetingCard ? 'bg-[#581C87] text-white shadow-sm' : 'bg-purple-50 text-gray-700 hover:bg-purple-100/60'
                    }`}
                  >
                    ✦ Ajouter une carte (+200 FCFA)
                  </button>
                </div>

                {hasGreetingCard && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-purple-100"
                  >
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Texte à calligraphier sur la carte :
                    </label>
                    <textarea
                      id="field-cart-cardMessage"
                      rows={2}
                      value={cardMessage}
                      onChange={(e) => { setCardMessage(e.target.value); clearFieldError('cardMessage'); }}
                      placeholder="Ex: Joyeux anniversaire mon amour ! De la part de toute la famille..."
                      className={`w-full p-3.5 rounded-2xl outline-none text-sm transition ${
                        fieldErrors.cardMessage 
                          ? 'border-2 border-red-500 bg-red-50/20 ring-2 ring-red-200' 
                          : 'border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200'
                      }`}
                    />
                    {fieldErrors.cardMessage && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-1.5 animate-pulse">
                        <AlertCircle size={13} className="text-red-500 shrink-0" />
                        <span>{fieldErrors.cardMessage}</span>
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

            </div>

            {/* COLONNE DROITE (5 cols) : Carte Récapitulative Sticky */}
            <div className="lg:col-span-5 sticky top-24 space-y-6">
              
              {/* Carte Récapitulatif Total */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-xl">
                <h3 className="text-lg font-extrabold text-gray-900 mb-4 pb-4 border-b border-gray-100 flex items-center justify-between">
                  <span>Récapitulatif de commande</span>
                  <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-full">
                    {totalItems} article{totalItems > 1 ? 's' : ''}
                  </span>
                </h3>

                <div className="space-y-3 text-sm text-gray-600 pb-5 border-b border-gray-100">
                  <div className="flex justify-between">
                    <span>Sous-total articles :</span>
                    <span className="font-bold text-gray-900">{totalAmount.toLocaleString('fr-FR')} FCFA</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Livraison ({deliveryType === 'sur_place' ? 'Retrait atelier' : `${distanceKm} km`}) :</span>
                    <span className="font-bold text-gray-900">
                      {deliveryType === 'sur_place' ? (
                        <span className="text-emerald-700 font-extrabold">Gratuit</span>
                      ) : (
                        isFreeDelivery ? (
                          <span className="text-emerald-700 font-extrabold">Offerte (Seuil atteint)</span>
                        ) : (
                          `${deliveryFee.toLocaleString('fr-FR')} FCFA`
                        )
                      )}
                    </span>
                  </div>

                  {hasGreetingCard && (
                    <div className="flex justify-between">
                      <span>Carte de vœux manuscrite :</span>
                      <span className="font-bold text-[#581C87]">+200 FCFA</span>
                    </div>
                  )}

                  {/* Remises Fidélité */}
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Déduction fidélité ({pointsToUse} pts) :</span>
                      <span>-{loyaltyDiscount.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  )}

                  {tierDiscountAmount > 0 && (
                    <div className="flex justify-between text-amber-700 font-bold">
                      <span>Remise privilège {memberInfo?.tier} ({tierDiscountPercent}%) :</span>
                      <span>-{tierDiscountAmount.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  )}
                </div>

                {/* Espace Fidélité si reconnu */}
                {memberInfo && (
                  <div className="py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-extrabold text-purple-900 flex items-center gap-1">
                        <Crown size={14} className="text-amber-500" /> Membre {memberInfo.tier} ({memberInfo.points} pts)
                      </span>
                    </div>
                    {memberInfo.points >= (memberInfo.settings?.min_points_to_redeem || 50) && (
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={useLoyaltyPoints}
                          onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                          className="rounded text-[#581C87] focus:ring-[#581C87]"
                        />
                        <span>Utiliser {pointsToUse} pts pour économiser {pointsToUse * pointValue} FCFA</span>
                      </label>
                    )}
                  </div>
                )}

                {/* Net Total */}
                <div className="py-5 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block font-bold">Total net à régler</span>
                    <span className="text-[11px] text-gray-400 font-light">TVA comprise</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#581C87]">
                    {finalAmountToPay.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>

                {/* Bouton de validation Orange Money */}
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-full bg-[#581C87] hover:bg-[#6B21A8] text-white font-extrabold text-sm shadow-xl shadow-purple-900/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-white" />
                      <span>Génération de votre commande...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      <span>Valider & Payer avec Orange Money</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-gray-400 mt-3 font-light">
                  Paiement 100% sécurisé via Orange Money Burkina Faso.
                </p>

                {/* Badges de réassurance */}
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-500 font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <Sparkles size={16} className="text-[#581C87]" />
                    <span>Fraîcheur du jour</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Truck size={16} className="text-[#581C87]" />
                    <span>Livraison soignée</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Gift size={16} className="text-[#581C87]" />
                    <span>Emballage festif</span>
                  </div>
                </div>

              </div>

              {/* Bouton continuer mes achats */}
              <div className="text-center">
                <Link
                  to="/catalogue"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#581C87] hover:underline"
                >
                  <ArrowLeft size={14} />
                  <span>Continuer mes achats (ajouter d'autres douceurs)</span>
                </Link>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
