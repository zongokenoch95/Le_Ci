import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
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
  MapPin,
  AlertCircle,
  Crown,
  Gift,
  Sparkles,
  CreditCard,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import {
  createOrder,
  getLoyaltyMember,
  redeemLoyaltyPoints,
  LoyaltyMember
} from '../services/api';
import { validateBurkinaPhone } from '../utils/phoneValidation';

export const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount } = useCart();
  const navigate = useNavigate();

  // Chargement des préférences de commande pré-remplies
  const savedPref = useMemo(() => {
    try {
      const p = localStorage.getItem('le_ci_checkout_pref');
      return p ? JSON.parse(p) : null;
    } catch {
      return null;
    }
  }, []);

  // Détection si le panier contient au moins un gâteau (pour afficher la carte de vœux manuscrite)
  const hasCakeInCart = useMemo(() => {
    return items.some((item) =>
      Boolean(
        item.isCake ||
          item.category === 'Gâteaux' ||
          /g[aâ]teau|layer|fraisier|moka|for[eê]t|arzanier|orsia|pi[eè]ce mont[eé]e/i.test(item.name || '')
      )
    );
  }, [items]);

  // 1. Mode de réception
  const [deliveryType, setDeliveryType] = useState<'livraison' | 'sur_place'>(
    savedPref?.deliveryType || 'livraison'
  );

  // 2. Date et heure — Cadrage selon les horaires Google Maps de la boutique + 1h30 de préparation
  // Horaires boutique (Google Maps : Les Douceurs de Lê-Ci, 01BP 6131, Ouagadougou) :
  // - Lundi au Samedi : 08h30 – 18h00 -> Livraison autorisée de 10h00 (08h30 + 1h30) à 19h30 (18h00 + 1h30)
  // - Dimanche        : 10h30 – 12h00 -> Livraison autorisée de 12h00 (10h30 + 1h30) à 13h30 (12h00 + 1h30)
  const formatLocalDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const formatMinutesToTime = (totalMins: number) =>
    `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;

  const getShopDeliveryWindowForDate = (dateStr: string) => {
    const parts = (dateStr || '').split('-').map(Number);
    const d =
      parts.length === 3 && !parts.some(isNaN)
        ? new Date(parts[0], parts[1] - 1, parts[2])
        : new Date();
    const dayOfWeek = d.getDay(); // 0 = Dimanche, 1..6 = Lundi..Samedi
    if (dayOfWeek === 0) {
      return {
        isSunday: true,
        dayLabel: 'Dimanche',
        openTimeDisplay: '10h30',
        closeTimeDisplay: '12h00',
        minDeliveryMinutes: 12 * 60, // 10h30 + 1h30 = 12h00
        maxDeliveryMinutes: 13 * 60 + 30, // 12h00 + 1h30 = 13h30
        minDeliveryTime: '12:00',
        maxDeliveryTime: '13:30'
      };
    }
    return {
      isSunday: false,
      dayLabel: 'Lundi au Samedi',
      openTimeDisplay: '08h30',
      closeTimeDisplay: '18h00',
      minDeliveryMinutes: 10 * 60, // 08h30 + 1h30 = 10h00
      maxDeliveryMinutes: 19 * 60 + 30, // 18h00 + 1h30 = 19h30
      minDeliveryTime: '10:00',
      maxDeliveryTime: '19:30'
    };
  };

  const { minDate, defaultTimeForMinDate, todayDateStr } = useMemo(() => {
    const now = new Date();
    const todayStr = formatLocalDate(now);
    const earliest = new Date(now.getTime() + 90 * 60 * 1000); // +1h30 (90 minutes)
    const earliestDateStr = formatLocalDate(earliest);
    const earliestMinutes = earliest.getHours() * 60 + earliest.getMinutes();
    const todayWindow = getShopDeliveryWindowForDate(todayStr);

    // Si aujourd'hui + 1h30 reste dans la journée et ne dépasse pas (fermeture + 1h30)
    if (earliestDateStr === todayStr && earliestMinutes <= todayWindow.maxDeliveryMinutes) {
      const effectiveMinMins = Math.max(todayWindow.minDeliveryMinutes, earliestMinutes);
      return {
        todayDateStr: todayStr,
        minDate: todayStr,
        defaultTimeForMinDate: formatMinutesToTime(effectiveMinMins)
      };
    }

    // Sinon (commande passée trop tard en soirée / après fermeture), basculer au lendemain dès (ouverture + 1h30)
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowStr = formatLocalDate(tomorrow);
    const tomorrowWindow = getShopDeliveryWindowForDate(tomorrowStr);
    return {
      todayDateStr: todayStr,
      minDate: tomorrowStr,
      defaultTimeForMinDate: tomorrowWindow.minDeliveryTime
    };
  }, []);

  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    if (savedPref?.deliveryDate && savedPref.deliveryDate >= minDate) {
      return savedPref.deliveryDate;
    }
    return minDate;
  });

  const selectedDateWindow = useMemo(
    () => getShopDeliveryWindowForDate(deliveryDate || minDate),
    [deliveryDate, minDate]
  );

  // Heure minimale et maximale autorisées pour la date actuellement sélectionnée
  const { minAllowedTimeForSelectedDate, maxAllowedTimeForSelectedDate } = useMemo(() => {
    const maxTime = selectedDateWindow.maxDeliveryTime;
    if (deliveryDate === todayDateStr) {
      const now = new Date();
      const earliest = new Date(now.getTime() + 90 * 60 * 1000);
      if (formatLocalDate(earliest) === todayDateStr) {
        const earliestMins = earliest.getHours() * 60 + earliest.getMinutes();
        const effectiveMin = Math.min(
          selectedDateWindow.maxDeliveryMinutes,
          Math.max(selectedDateWindow.minDeliveryMinutes, earliestMins)
        );
        return {
          minAllowedTimeForSelectedDate: formatMinutesToTime(effectiveMin),
          maxAllowedTimeForSelectedDate: maxTime
        };
      }
    }
    return {
      minAllowedTimeForSelectedDate: selectedDateWindow.minDeliveryTime,
      maxAllowedTimeForSelectedDate: maxTime
    };
  }, [deliveryDate, todayDateStr, selectedDateWindow]);

  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<string>(() => {
    if (savedPref?.deliveryTimeSlot && /^\d{2}:\d{2}$/.test(savedPref.deliveryTimeSlot)) {
      const [h, m] = savedPref.deliveryTimeSlot.split(':').map(Number);
      const savedMins = h * 60 + m;
      const initWin = getShopDeliveryWindowForDate(
        savedPref?.deliveryDate && savedPref.deliveryDate >= minDate ? savedPref.deliveryDate : minDate
      );
      if (savedMins >= initWin.minDeliveryMinutes && savedMins <= initWin.maxDeliveryMinutes) {
        return savedPref.deliveryTimeSlot;
      }
    }
    return defaultTimeForMinDate;
  });

  // Ajuster automatiquement l'heure si le client change de jour (ex: passe d'un jour de semaine au dimanche)
  useEffect(() => {
    const match = deliveryTimeSlot.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return;
    const currentMins = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    const [minH, minM] = minAllowedTimeForSelectedDate.split(':').map(Number);
    const [maxH, maxM] = maxAllowedTimeForSelectedDate.split(':').map(Number);
    const minMins = minH * 60 + minM;
    const maxMins = maxH * 60 + maxM;
    if (currentMins < minMins) {
      setDeliveryTimeSlot(minAllowedTimeForSelectedDate);
    } else if (currentMins > maxMins) {
      setDeliveryTimeSlot(maxAllowedTimeForSelectedDate);
    }
  }, [deliveryDate, minAllowedTimeForSelectedDate, maxAllowedTimeForSelectedDate]);

  // 3. Coordonnées de la personne qui reçoit le colis
  const [recipientPhone, setRecipientPhone] = useState<string>(savedPref?.customerPhone || '');
  const [recipientName, setRecipientName] = useState<string>(savedPref?.customerName || '');
  const [backupPhone, setBackupPhone] = useState<string>(savedPref?.backupPhone || '');

  // 4. Lieu de livraison (Quartier uniquement, champ géolocalisation supprimé)
  const [deliveryQuarter, setDeliveryQuarter] = useState<string>(savedPref?.deliveryQuarter || '');

  // Carte de vœux manuscrite (+200 FCFA) — uniquement quand il s'agit d'un gâteau
  const [hasGreetingCard, setHasGreetingCard] = useState<boolean>(Boolean(savedPref?.hasGreetingCard));
  const [cardMessage, setCardMessage] = useState<string>(savedPref?.cardMessage || '');

  // Fidélité
  const [memberInfo, setMemberInfo] = useState<LoyaltyMember | null>(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);

  // Notes additionnelles
  const [orderNotes] = useState<string>(savedPref?.notes || '');

  // États de soumission et erreurs de validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [errorMsg, setErrorMsg] = useState('');

  const setSingleError = (key: string, msg: string, elementId: string) => {
    setFieldErrors({ [key]: msg });
    setErrorMsg('');
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
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      setErrorMsg('');
    }
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

  // Calcul réductions et suppléments
  const pointValue = memberInfo?.settings?.point_value_fcfa || 1;
  const loyaltyDiscount = useLoyaltyPoints ? pointsToUse * pointValue : 0;
  const tierDiscountPercent =
    memberInfo?.tier === 'GOLD'
      ? memberInfo.settings?.gold_discount_percent || 10
      : memberInfo?.tier === 'SILVER'
        ? memberInfo.settings?.silver_discount_percent || 5
        : 0;
  const tierDiscountAmount = Math.round((totalAmount * tierDiscountPercent) / 100);
  const effectiveGreetingCard = hasCakeInCart && hasGreetingCard;
  const cardSupplement = effectiveGreetingCard ? 200 : 0;

  // Montant à payer
  const finalAmountToPay = Math.max(
    0,
    totalAmount + cardSupplement - loyaltyDiscount - tierDiscountAmount
  );

  // Validation du formulaire de panier
  const validateCartCheckout = () => {
    if (!deliveryDate) {
      setSingleError(
        'deliveryDate',
        'Veuillez sélectionner la date souhaitée pour votre commande.',
        'field-cart-date'
      );
      return false;
    }
    if (!deliveryTimeSlot.trim()) {
      setSingleError(
        'deliveryTimeSlot',
        "Veuillez indiquer l'heure souhaitée pour la réception.",
        'field-cart-time'
      );
      return false;
    }

    const now = new Date();
    const currentTodayStr = formatLocalDate(now);
    if (deliveryDate < currentTodayStr) {
      setSingleError(
        'deliveryDate',
        'La date choisie ne peut pas être dans le passé.',
        'field-cart-date'
      );
      return false;
    }

    const timeMatch = deliveryTimeSlot.trim().match(/^(\d{1,2})\s*[:hH]\s*(\d{1,2})?$/);
    if (!timeMatch) {
      setSingleError(
        'deliveryTimeSlot',
        'Veuillez sélectionner une heure valide (ex: 14:30).',
        'field-cart-time'
      );
      return false;
    }
    const chosenHours = parseInt(timeMatch[1], 10);
    const chosenMinutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const chosenTotalMinutes = chosenHours * 60 + chosenMinutes;
    const [year, month, day] = deliveryDate.split('-').map(Number);
    const chosenDateTime = new Date(year, month - 1, day, chosenHours, chosenMinutes, 0, 0);
    const dayWindow = getShopDeliveryWindowForDate(deliveryDate);

    // Règle 2 : Pas d'heure de livraison en dessous de l'heure d'ouverture + 1h30
    if (chosenTotalMinutes < dayWindow.minDeliveryMinutes) {
      setSingleError(
        'deliveryTimeSlot',
        `La boutique ouvre à ${dayWindow.openTimeDisplay} (${dayWindow.dayLabel}). Avec 1h30 de préparation, l'heure de réception ne peut pas être avant ${dayWindow.minDeliveryTime.replace(':', 'h')} (ouverture + 1h30).`,
        'field-cart-time'
      );
      return false;
    }

    // Règle 1 : Pas d'heure de livraison au-delà de l'heure de fermeture + 1h30
    if (chosenTotalMinutes > dayWindow.maxDeliveryMinutes) {
      setSingleError(
        'deliveryTimeSlot',
        `La boutique ferme à ${dayWindow.closeTimeDisplay} (${dayWindow.dayLabel}). L'heure de réception ne peut pas dépasser ${dayWindow.maxDeliveryTime.replace(':', 'h')} (fermeture + 1h30).`,
        'field-cart-time'
      );
      return false;
    }

    // Règle temps réel : Délai minimum de préparation de 1h30 à partir de l'instant présent
    const minAllowedDateTime = new Date(now.getTime() + 89 * 60 * 1000);
    const displayMinDateTime = new Date(now.getTime() + 90 * 60 * 1000);
    const nowFormatted = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
    const minFormatted = `${String(displayMinDateTime.getHours()).padStart(2, '0')}h${String(displayMinDateTime.getMinutes()).padStart(2, '0')}`;

    if (chosenDateTime.getTime() < minAllowedDateTime.getTime()) {
      setSingleError(
        'deliveryTimeSlot',
        `La préparation d'une commande prend 1h à 1h30. En commandant à ${nowFormatted}, vous ne pouvez pas choisir une heure avant ${minFormatted} (minimum +1h30).`,
        'field-cart-time'
      );
      return false;
    }

    if (deliveryType === 'livraison') {
      const phoneVal = validateBurkinaPhone(recipientPhone);
      if (!phoneVal.isValid) {
        setSingleError(
          'recipientPhone',
          phoneVal.error || 'Veuillez saisir un numéro valide du Burkina Faso (8 chiffres).',
          'field-cart-phone'
        );
        return false;
      }

      if (backupPhone.trim()) {
        const backupVal = validateBurkinaPhone(backupPhone, true);
        if (!backupVal.isValid) {
          setSingleError(
            'backupPhone',
            backupVal.error || 'Numéro de secours invalide (8 chiffres requis).',
            'field-cart-backupPhone'
          );
          return false;
        }
      }
    }

    if (effectiveGreetingCard && !cardMessage.trim()) {
      setSingleError(
        'cardMessage',
        'Veuillez rédiger le mot à inscrire sur la carte de vœux.',
        'field-cart-cardMessage'
      );
      return false;
    }
    setFieldErrors({});
    setErrorMsg('');
    return true;
  };

  // Soumission et redirection vers le paiement
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
      const fullDeliveryAddress = deliveryQuarter.trim()
        ? `Quartier: ${deliveryQuarter.trim()}`
        : 'Livraison à domicile (à convenir avec le livreur)';

      const finalNotes = [
        `Mode: ${deliveryType === 'livraison' ? 'Livraison à domicile' : 'Sans livraison (Retrait boutique)'}`,
        `Date souhaitée: ${deliveryDate} (${deliveryTimeSlot})`,
        deliveryType === 'livraison' && recipientPhone.trim()
          ? `Réceptionnaire: ${recipientPhone.trim()}`
          : '',
        deliveryType === 'livraison' && backupPhone.trim()
          ? `Tél secours: ${backupPhone.trim()}`
          : '',
        deliveryType === 'livraison' ? `Adresse: ${fullDeliveryAddress}` : 'Retrait boutique',
        effectiveGreetingCard ? `Carte de vœux (+200F): « ${cardMessage.trim()} »` : 'Sans carte',
        useLoyaltyPoints ? `Fidélité: -${loyaltyDiscount} FCFA (${pointsToUse} pts)` : '',
        tierDiscountPercent > 0 ? `Remise VIP ${memberInfo?.tier}: -${tierDiscountAmount} FCFA` : '',
        orderNotes.trim() ? `Notes spéciales: ${orderNotes.trim()}` : ''
      ]
        .filter(Boolean)
        .join(' | ');

      const order = await createOrder({
        customerName:
          deliveryType === 'livraison'
            ? memberInfo?.name || `Client (${recipientPhone.trim()})`
            : memberInfo?.name || 'Client (Retrait boutique)',
        customerPhone: deliveryType === 'livraison' ? recipientPhone.trim() : '',
        items: items.map((item) => {
          const isCakeItem = Boolean(
            item.isCake ||
              item.category === 'Gâteaux' ||
              /g[aâ]teau|layer|fraisier/i.test(item.name || '')
          );
          const isCustomCakeItem = String(item.id).startsWith('custom-cake') || !!item.description;
          return {
            id: typeof item.id === 'number' ? item.id : 9999,
            name: item.name,
            price: item.numericPrice,
            quantity: item.quantity,
            image: item.image || '/products/gateau_1.jpeg',
            category: item.category || (isCakeItem ? 'Gâteaux' : 'Pâtisserie'),
            portion: item.portion,
            flavor: item.flavor,
            catalogModel: item.catalogModel || (!isCustomCakeItem ? item.name : undefined),
            isCake: isCakeItem,
            description: item.description
          };
        }),
        montantTotal: finalAmountToPay,
        modePaiement: 'orange_money',
        notes: finalNotes,
        deliveryType,
        deliveryFee: 0,
        hasGreetingCard: effectiveGreetingCard,
        discountAmount: loyaltyDiscount + tierDiscountAmount
      });

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
            <Link to="/" className="hover:text-[#581C87] transition">
              Accueil
            </Link>
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
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
              Votre panier est vide
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-light mb-8 max-w-sm mx-auto leading-relaxed">
              Laissez-vous tenter par nos douceurs artisanales fraîches ou concevez un gâteau d'exception sur-mesure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/catalogue"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#581C87] text-white text-xs font-bold shadow-md hover:bg-[#6B21A8] transition text-center"
              >
                Explorer nos douceurs
              </Link>
              <Link
                to="/sur-commande"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-purple-50 text-[#581C87] text-xs font-bold hover:bg-purple-100 transition text-center border border-purple-200"
              >
                Créer un gâteau sur-mesure
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* COLONNE GAUCHE (7 cols) : Formulaire de commande */}
            <div className="lg:col-span-7 space-y-8">
              {/* POINT 1 : MODE DE RÉCEPTION */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                    1
                  </span>
                  Mode de réception
                </h2>

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
                      <div className="font-extrabold text-xs sm:text-sm">Avec livraison</div>
                      <div className="text-[11px] text-gray-500 font-light mt-0.5">
                        A discuter avec le livreur
                      </div>
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
                      <div className="font-extrabold text-xs sm:text-sm">Sans livraison</div>
                      <div className="text-[11px] text-gray-500 font-light mt-0.5">
                        Passer retirer à la boutique
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* POINT 2 : DATE & HEURE */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  Date & Heure
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="relative">
                      <button
                        type="button"
                        id="field-cart-date"
                        onClick={() => {
                          const picker = document.getElementById(
                            'cart-reception-date-input'
                          ) as HTMLInputElement | null;
                          if (picker) {
                            if ('showPicker' in HTMLInputElement.prototype) {
                              picker.showPicker();
                            } else {
                              picker.click();
                            }
                          }
                        }}
                        className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm ${
                          fieldErrors.deliveryDate
                            ? 'border-2 border-red-500 bg-red-50/20 text-red-700 ring-2 ring-red-200'
                            : deliveryDate
                              ? 'border-2 border-[#581C87] bg-purple-50/80 text-[#581C87]'
                              : 'border border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Calendar
                            size={18}
                            className={deliveryDate ? 'text-[#581C87]' : 'text-gray-400'}
                          />
                          <span className="truncate">
                            {deliveryDate
                              ? `Date : ${new Date(deliveryDate + 'T00:00:00').toLocaleDateString('fr-FR', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}`
                              : 'Sélectionner votre date de réception'}
                          </span>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-[#581C87] text-white text-[11px] font-extrabold shrink-0">
                          {deliveryDate ? 'Modifier' : 'Choisir'}
                        </span>
                      </button>

                      <input
                        id="cart-reception-date-input"
                        type="date"
                        min={minDate}
                        value={deliveryDate}
                        onChange={(e) => {
                          setDeliveryDate(e.target.value);
                          clearFieldError('deliveryDate');
                        }}
                        className="absolute bottom-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
                      />
                    </div>

                    {fieldErrors.deliveryDate && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-1.5 animate-pulse">
                        <AlertCircle size={13} className="text-red-500 shrink-0" />
                        <span>{fieldErrors.deliveryDate}</span>
                      </p>
                    )}
                    <span className="block text-[11px] text-gray-500 mt-1">
                      Horaires boutique ({selectedDateWindow.dayLabel}) :{' '}
                      <strong className="text-[#581C87]">
                        {selectedDateWindow.openTimeDisplay} – {selectedDateWindow.closeTimeDisplay}
                      </strong>
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Clock size={14} className="text-[#581C87]" />
                      Heure souhaitée ({minAllowedTimeForSelectedDate.replace(':', 'h')} à{' '}
                      {maxAllowedTimeForSelectedDate.replace(':', 'h')}) *
                    </label>
                    <input
                      id="field-cart-time"
                      type="time"
                      min={minAllowedTimeForSelectedDate}
                      max={maxAllowedTimeForSelectedDate}
                      value={deliveryTimeSlot}
                      onChange={(e) => {
                        setDeliveryTimeSlot(e.target.value);
                        clearFieldError('deliveryTimeSlot');
                      }}
                      className={`w-full px-4 py-3.5 rounded-2xl outline-none text-sm font-bold bg-white transition ${
                        fieldErrors.deliveryTimeSlot
                          ? 'border-2 border-red-500 bg-red-50/20 ring-2 ring-red-200 text-red-700'
                          : 'border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 text-gray-900'
                      }`}
                    />
                    {fieldErrors.deliveryTimeSlot && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-1.5 animate-pulse">
                        <AlertCircle size={13} className="text-red-500 shrink-0" />
                        <span>{fieldErrors.deliveryTimeSlot}</span>
                      </p>
                    )}
                    <span className="block text-[11px] text-gray-500 mt-1">
                      ⏱️ Créneau autorisé (+1h30 de préparation) : de{' '}
                      <strong className="text-gray-700">
                        {minAllowedTimeForSelectedDate.replace(':', 'h')}
                      </strong>{' '}
                      à{' '}
                      <strong className="text-gray-700">
                        {maxAllowedTimeForSelectedDate.replace(':', 'h')}
                      </strong>
                      .
                    </span>
                  </div>
                </div>
              </div>

              {/* POINT 3 : PERSONNE QUI REÇOIT LE COLIS (Uniquement si Avec livraison) */}
              {deliveryType === 'livraison' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                  <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                      3
                    </span>
                    Personne qui reçoit le colis
                  </h2>
                  <p className="text-xs text-gray-500 mb-6 font-light">
                    Le livreur contactera ce numéro pour la remise en main propre.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Phone size={14} className="text-[#581C87]" />
                        WhatsApp / Téléphone *
                      </label>
                      <input
                        id="field-cart-phone"
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => {
                          setRecipientPhone(e.target.value);
                          clearFieldError('recipientPhone');
                        }}
                        placeholder="Ex: 70 00 00 00 ou +226 70 12 34 56"
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
                      <span className="block text-[11px] text-gray-400 mt-1">
                        Numéro du Burkina Faso à 8 chiffres (Orange, Moov, Telecel).
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Phone size={14} className="text-[#581C87]" />
                        Second numéro de secours{' '}
                        <span className="text-[11px] font-normal text-gray-400">(optionnel)</span>
                      </label>
                      <input
                        id="field-cart-backupPhone"
                        type="tel"
                        value={backupPhone}
                        onChange={(e) => {
                          setBackupPhone(e.target.value);
                          clearFieldError('backupPhone');
                        }}
                        placeholder="Ex: 76 00 00 00 (famille, conjoint...)"
                        className={`w-full px-4 py-3.5 rounded-2xl border outline-none text-sm bg-white transition ${
                          fieldErrors.backupPhone
                            ? 'border-2 border-red-500 bg-red-50/20 ring-2 ring-red-200'
                            : 'border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200'
                        }`}
                      />
                      {fieldErrors.backupPhone && (
                        <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-1.5 animate-pulse">
                          <AlertCircle size={13} className="text-red-500 shrink-0" />
                          <span>{fieldErrors.backupPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* POINT 4 : LIEU DE LIVRAISON (Sans le champ coller une géolocalisation) */}
              {deliveryType === 'livraison' && (
                <div
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm"
                  id="field-cart-address"
                >
                  <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                      4
                    </span>
                    Lieu de livraison
                  </h2>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#581C87]" />
                      <span>
                        Quartier <span className="text-[11px] font-normal text-gray-400">(facultatif)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={deliveryQuarter}
                      onChange={(e) => setDeliveryQuarter(e.target.value)}
                      placeholder="Ex : Ouaga 2000, Karpala, Patte d'Oie..."
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm bg-white transition"
                    />
                  </div>
                </div>
              )}

              {/* CARTE DE VŒUX MANUSCRITE (+200 FCFA) — Affichée uniquement quand il s'agit d'un gâteau */}
              {hasCakeInCart && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                        {deliveryType === 'livraison' ? '5' : '3'}
                      </span>
                      Carte de vœux manuscrite (+200 FCFA)
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 font-light">
                    Glissez une délicate attention manuscrite dans le coffret pour sublimer votre gâteau.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <label
                      onClick={() => setHasGreetingCard(false)}
                      className={`p-3.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        !hasGreetingCard
                          ? 'border-[#581C87] bg-purple-50/60 shadow-xs'
                          : 'border-gray-200 hover:border-purple-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="greetingCardOption"
                        checked={!hasGreetingCard}
                        onChange={() => setHasGreetingCard(false)}
                        className="w-4 h-4 accent-[#581C87] cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-bold text-gray-900">
                        Sans carte de vœux
                      </span>
                    </label>

                    <label
                      onClick={() => setHasGreetingCard(true)}
                      className={`p-3.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        hasGreetingCard
                          ? 'border-[#581C87] bg-purple-50/60 shadow-xs'
                          : 'border-gray-200 hover:border-purple-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="greetingCardOption"
                          checked={hasGreetingCard}
                          onChange={() => setHasGreetingCard(true)}
                          className="w-4 h-4 accent-[#581C87] cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                          Ajouter une carte de vœux
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[#581C87] shrink-0">+200 FCFA</span>
                    </label>
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
                        onChange={(e) => {
                          setCardMessage(e.target.value);
                          clearFieldError('cardMessage');
                        }}
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
              )}
            </div>

            {/* COLONNE DROITE (5 cols) : Récapitulatif (Nom, Saveur, Montant à payer) */}
            <div className="lg:col-span-5 sticky top-24 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-xl">
                <h3 className="text-lg font-extrabold text-gray-900 mb-4 pb-4 border-b border-gray-100 flex items-center justify-between">
                  <span>Récapitulatif</span>
                  <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-full">
                    {totalItems} article{totalItems > 1 ? 's' : ''}
                  </span>
                </h3>

                {/* Liste des articles du panier dans le Récapitulatif : Image, Nom, Quantité & Prix dynamique */}
                <div className="space-y-3 pb-5 border-b border-gray-100">
                  {items.map((item) => {
                    const descFlavorMatch = (item.description || '').match(/Saveur:\s*([^|\]]+)/i);
                    const flavorLabel =
                      item.flavor || (descFlavorMatch ? descFlavorMatch[1].trim() : '');
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 flex items-center gap-3.5 text-xs sm:text-sm"
                      >
                        <img
                          src={item.image || '/products/gateau_1.jpeg'}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-purple-100 bg-white shadow-xs"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-gray-900 font-extrabold leading-snug truncate">
                                {item.name}
                              </div>
                              {flavorLabel && (
                                <div className="text-[11px] text-gray-600 mt-0.5 truncate">
                                  <span className="font-semibold text-gray-500">Saveur :</span>{' '}
                                  <span className="font-bold text-[#581C87]">{flavorLabel}</span>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer shrink-0"
                              title="Retirer cet article"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-2.5">
                            <div className="flex items-center border border-purple-200 rounded-lg bg-white px-1.5 py-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 text-gray-500 hover:text-[#581C87] transition cursor-pointer"
                                title="Diminuer la quantité"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-7 text-center text-xs font-extrabold text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1 text-gray-500 hover:text-[#581C87] transition cursor-pointer"
                                title="Augmenter la quantité"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            <div className="text-right font-black text-sm sm:text-base text-[#581C87] shrink-0">
                              {(item.numericPrice * item.quantity).toLocaleString('fr-FR')} FCFA
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Espace Fidélité si reconnu */}
                {memberInfo && (
                  <div className="py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-extrabold text-purple-900 flex items-center gap-1">
                        <Crown size={14} className="text-amber-500" /> Membre {memberInfo.tier} (
                        {memberInfo.points} pts)
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
                        <span>
                          Utiliser {pointsToUse} pts pour économiser {pointsToUse * pointValue} FCFA
                        </span>
                      </label>
                    )}
                  </div>
                )}

                {/* Montant à payer */}
                <div className="py-5 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block font-bold">
                      Montant à payer
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#581C87]">
                    {finalAmountToPay.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>

                {/* Bouton Passer au paiement */}
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-lg bg-[#581C87] hover:bg-[#6B21A8] text-white font-extrabold text-sm shadow-xl shadow-purple-900/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-white" />
                      <span>Génération de votre commande...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      <span>Passer au paiement</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

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
