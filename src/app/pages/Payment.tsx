import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Clock,
  Copy,
  PhoneCall,
  QrCode,
  ShieldCheck,
  Smartphone,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  Sparkles,
  ExternalLink,
  Crown,
  Gift,
  UserCheck,
  ArrowRight,
  CreditCard,
  Loader2,
  RefreshCw,
  Share2
} from 'lucide-react';
import { 
  getOrder, 
  getOrderStatus, 
  cancelOrder, 
  registerLoyaltyMember, 
  getLoyaltyMember, 
  getLoyaltySettings,
  updateOrderPaymentInfo,
  generateOrderPayToken,
  Order, 
  LoyaltyMember, 
  LoyaltySettings 
} from '../services/api';
import { getSocket, joinOrder, leaveOrder } from '../services/socket';
import { validateBurkinaPhone } from '../utils/phoneValidation';

export function Payment() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<'orange' | 'wave' | 'moov'>('orange');
  const [remainingSeconds, setRemainingSeconds] = useState(600);

  // État de confirmation du paiement (Étape 1 : Choix moyen + saisie nom & numéro VS Étape 2 : Page d'attente)
  const [payerName, setPayerName] = useState(() => {
    try {
      return localStorage.getItem(`le_ci_payer_name_${orderId}`) || '';
    } catch {
      return '';
    }
  });

  const [payerPhone, setPayerPhone] = useState(() => {
    try {
      return localStorage.getItem(`le_ci_payer_phone_${orderId}`) || '';
    } catch {
      return '';
    }
  });

  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(() => {
    try {
      return localStorage.getItem(`le_ci_payment_confirmed_${orderId}`) === 'true';
    } catch {
      return false;
    }
  });

  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // État Portail 1 Fidélité
  const [loyaltyMember, setLoyaltyMember] = useState<LoyaltyMember | null>(null);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledSuccess, setEnrolledSuccess] = useState(false);
  const [enrollName, setEnrollName] = useState('');
  const [enrollPhone, setEnrollPhone] = useState('');

  // Vérifier statut fidélité dès que la commande est payée
  useEffect(() => {
    if (order && (order.statut === 'EN_PREPARATION' || order.statut === 'PAYEE') && order.customerPhone) {
      setEnrollName(order.customerName || '');
      setEnrollPhone(order.customerPhone || '');

      getLoyaltySettings().then(setLoyaltySettings).catch(() => null);
      getLoyaltyMember(order.customerPhone)
        .then((m) => {
          setLoyaltyMember(m);
        })
        .catch(() => setLoyaltyMember(null));
    }
  }, [order?.statut, order?.customerPhone]);

  const handleEnrollLoyalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollName.trim() || !enrollPhone.trim()) return;
    setEnrolling(true);
    try {
      const res = await registerLoyaltyMember({
        name: enrollName.trim(),
        phone: enrollPhone.trim()
      });
      setLoyaltyMember(res.member);
      setEnrolledSuccess(true);
      localStorage.setItem('le_ci_customer_loyalty', JSON.stringify({
        phone: res.member.phone,
        name: res.member.name
      }));
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#10B981', '#F59E0B']
      });
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setEnrolling(false);
    }
  };
  const hasTriggeredConfetti = useRef(false);

  // Détection navigateurs in-app (TikTok, Instagram, Facebook, etc.)
  const userAgent = typeof window !== 'undefined' ? (window.navigator.userAgent || '') : '';
  const isInAppBrowser = useMemo(() => {
    return /FBAN|FBAV|FB_IAB|Instagram|TikTok|musical_ly|Bytedance|Snapchat|Twitter|Line/i.test(userAgent);
  }, [userAgent]);

  const isAndroid = useMemo(() => /Android/i.test(userAgent), [userAgent]);

  const chromeIntentUrl = useMemo(() => {
    if (typeof window === 'undefined') return '#';
    const urlWithoutProtocol = window.location.href.replace(/^https?:\/\//, '');
    return `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;end`;
  }, []);

  // Configuration Marchand
  const merchantConfig = {
    orangeCode: '654321',
    orangePhone: '70000001',
    moovCode: '54321',
    waveUrl: 'https://pay.wave.com/m/maison-al-fann'
  };

  const codeRef = order?.codeReference || '';
  const amount = order?.montantTotal || 0;

  // Calcul du détail transparent de la commande (Notion 28/10/26 : Pâtisseries, Livraison, Total)
  const itemsSubtotal = useMemo(() => {
    if (!order?.items) return 0;
    return order.items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  }, [order]);

  const hasCard = Boolean(order?.notes && order.notes.includes('Carte de vœux'));
  const isDelivery = Boolean(order?.deliveryFee || (order?.notes && (order.notes.includes('Livraison') || order.notes.includes('km'))));
  const cardFee = hasCard ? 200 : 0;
  const calculatedDeliveryFee = order?.deliveryFee !== undefined && order.deliveryFee > 0
    ? order.deliveryFee
    : (isDelivery ? Math.max(0, amount - itemsSubtotal - cardFee) : 0);

  // Extraction structurée des coordonnées de réception depuis order.notes
  const recipientDetails = useMemo(() => {
    const notesStr = order?.notes || '';
    const backupMatch = notesStr.match(/Tél secours:\s*([^|]+)/i);
    const addrMatch = notesStr.match(/Adresse:\s*([^|]+(?:\|\s*Repère:[^|]+)?)/i);
    const dateMatch = notesStr.match(/Date souhaitée:\s*([^|]+)/i);
    return {
      phone: order?.customerPhone || 'Non renseigné',
      backupPhone: backupMatch ? backupMatch[1].trim() : '',
      address: addrMatch ? addrMatch[1].trim() : (isDelivery ? 'Livraison à domicile' : 'Retrait à l\'atelier'),
      dateSlot: dateMatch ? dateMatch[1].trim() : ''
    };
  }, [order, isDelivery]);

  // Extraction structurée des informations produit (Section 1 : Désignation, Saveur, Modèle catalogue, Quantité, Parts si gâteau)
  const parseItemInvoiceInfo = (item: any) => {
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

    const cleanDesignation = (item.name || '').replace(/\s*\[.*\]$/, '');
    const flavor = item.flavor || (flavorMatch ? flavorMatch[1].trim() : (isCake ? 'Recette Signature Lê Ci' : 'Classique artisanale'));
    const catalogModel = item.catalogModel || (modelMatch ? modelMatch[1].replace(/^Modèle catalogue\s*:\s*/i, '').trim() : cleanDesignation);
    const portion = isCake ? (item.portion || (portionMatch ? portionMatch[1].trim() : '6 à 8 parts')) : null;

    return {
      designation: cleanDesignation,
      flavor,
      catalogModel,
      quantity: item.quantity || 1,
      isCake,
      portion,
      image: item.image
    };
  };

  // Syntaxes USSD
  const omUssdMarchand = `*144*10*77121289*${amount}#`;
  const omTelUrl = `tel:${encodeURIComponent(omUssdMarchand)}`;
  const moovUssd = `*555*4*1*${merchantConfig.moovCode}*${amount}#`;
  const moovTelUrl = `tel:${encodeURIComponent(moovUssd)}`;

  // Chargement initial de la commande
  useEffect(() => {
    if (!orderId) return;

    let isMounted = true;
    getOrder(orderId)
      .then((data) => {
        if (!isMounted) return;
        setOrder(data);
        if (data.remainingSeconds !== undefined) {
          setRemainingSeconds(data.remainingSeconds);
        }
        if (data.modePaiement === 'moov' || data.modePaiement === 'wave' || data.modePaiement === 'orange') {
          setSelectedOperator(data.modePaiement);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erreur chargement commande:', err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // Validation du formulaire de paiement (Étape 1 -> Étape 2) avec validation stricte numéro BF
  const handleConfirmPaymentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerPhone.trim()) {
      setPaymentError('Veuillez saisir votre numéro Mobile Money utilisé pour le transfert.');
      return;
    }

    // Validation du numéro de téléphone émetteur (Burkina Faso : 8 chiffres)
    const phoneVal = validateBurkinaPhone(payerPhone);
    if (!phoneVal.isValid) {
      setPaymentError(phoneVal.error || 'Veuillez saisir un numéro de téléphone valide du Burkina Faso (8 chiffres).');
      return;
    }

    if (!payerName.trim()) {
      setPaymentError('Veuillez renseigner votre nom pour identifier le transfert.');
      return;
    }

    setConfirmingPayment(true);
    setPaymentError('');

    try {
      if (orderId) {
        localStorage.setItem(`le_ci_payer_name_${orderId}`, payerName.trim());
        localStorage.setItem(`le_ci_payer_phone_${orderId}`, payerPhone.trim());
        localStorage.setItem(`le_ci_payment_confirmed_${orderId}`, 'true');

        try {
          const res = await updateOrderPaymentInfo(orderId, {
            payerName: payerName.trim(),
            payerPhone: payerPhone.trim(),
            paymentMethod: selectedOperator
          });
          if (res?.order) {
            setOrder(res.order);
          }
        } catch (apiErr) {
          console.warn('API updateOrderPaymentInfo warning (fallback local actif):', apiErr);
        }
      }
      setIsPaymentConfirmed(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setPaymentError(err.message || 'Erreur lors de la confirmation des coordonnées.');
    } finally {
      setConfirmingPayment(false);
    }
  };

  // Navigation vers OtherPaymentView (/pay/:token) - Point 10 validAuto.md
  const [openingOtherPay, setOpeningOtherPay] = useState(false);
  const handleOpenOtherPayment = async () => {
    if (!orderId) return;
    setOpeningOtherPay(true);
    try {
      const cachedToken = localStorage.getItem(`le_ci_pay_token_${orderId}`);
      if (cachedToken) {
        navigate(`/pay/${cachedToken}`);
        return;
      }
      const res = await generateOrderPayToken(orderId);
      if (res.payToken) {
        navigate(`/pay/${res.payToken}`);
      }
    } catch (err: any) {
      alert(err.message || 'Impossible d\'ouvrir la page de paiement avec un autre numéro');
    } finally {
      setOpeningOtherPay(false);
    }
  };

  // Génération du QR Code Desktop
  useEffect(() => {
    if (!order) return;
    const targetUrl = selectedOperator === 'wave' ? merchantConfig.waveUrl : omUssdMarchand;
    QRCode.toDataURL(targetUrl, { width: 220, margin: 2, color: { dark: '#111827', light: '#ffffff' } })
      .then(setQrCodeDataUrl)
      .catch(console.error);
  }, [order, selectedOperator, omUssdMarchand]);

  // Décompte temps restant (10:00) sur la page d'attente
  useEffect(() => {
    if (!order || order.statut !== 'EN_ATTENTE_DE_PAIEMENT' || !isPaymentConfirmed) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          getOrderStatus(order.id).then((res) => setOrder(res.order));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [order, isPaymentConfirmed]);

  // Écoute WebSockets temps réel + Polling 3s
  useEffect(() => {
    if (!orderId) return;

    joinOrder(orderId);
    const socket = getSocket();

    const handleStatusChanged = (data: { orderId: string; statut: any; order: Order }) => {
      if (data.orderId === orderId && data.order) {
        setOrder(data.order);
      }
    };

    socket.on('order:status_changed', handleStatusChanged);

    // Polling de secours toutes les 3s
    const pollInterval = setInterval(() => {
      if (order && order.statut === 'EN_ATTENTE_DE_PAIEMENT') {
        getOrderStatus(orderId)
          .then((res) => {
            if (res.statut !== order.statut) {
              setOrder(res.order);
            }
          })
          .catch(() => { });
      }
    }, 3000);

    return () => {
      leaveOrder(orderId);
      socket.off('order:status_changed', handleStatusChanged);
      clearInterval(pollInterval);
    };
  }, [orderId, order]);

  // Effet Confetti lors de la validation
  useEffect(() => {
    if (order && (order.statut === 'EN_PREPARATION' || order.statut === 'PAYEE') && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#581C87', '#10B981', '#3B82F6', '#F59E0B']
      });
    }
  }, [order?.statut]);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCancel = async () => {
    if (!orderId || !window.confirm('Voulez-vous vraiment annuler cette commande ?')) return;
    setCancelling(true);
    try {
      const res = await cancelOrder(orderId);
      setOrder(res.order);
    } catch (e: any) {
      alert(e.message || 'Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#581C87] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Chargement des détails de paiement...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF8F5]">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center border border-purple-100">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Commande introuvable</h2>
          <p className="text-gray-600 mb-6 text-sm font-light">Cette commande n'existe pas ou a expiré.</p>
          <button
            onClick={() => navigate('/catalogue')}
            className="w-full py-3.5 bg-[#581C87] hover:bg-[#6B21A8] text-white font-bold rounded-full transition shadow-md"
          >
            Retour au Catalogue
          </button>
        </div>
      </div>
    );
  }

  const isPaid = order.statut === 'EN_PREPARATION' || order.statut === 'PAYEE' || order.statut === 'PRETE';
  const isCancelled = order.statut === 'ANNULEE';

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6] text-gray-900">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation retour */}
        <button
          onClick={() => navigate('/catalogue')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-6 transition cursor-pointer"
        >
          <ArrowLeft size={16} /> Retour au catalogue
        </button>

        <AnimatePresence mode="wait">
          
          {/* ========================================================================= */}
          {/* ÉCRAN SUCCÈS : COMMANDE PAYÉE & VALIDÉE */}
          {/* ========================================================================= */}
          {isPaid && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-emerald-100 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100"
              >
                <CheckCircle2 size={48} />
              </motion.div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
                <Sparkles size={14} /> Paiement Validé avec Succès
              </span>

              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Paiement Reçu avec Succès !</h1>
              <p className="text-gray-600 max-w-lg mx-auto mb-8 text-sm font-light">
                Merci <span className="font-semibold text-gray-900">{payerName || order.customerName}</span>. Votre commande est confirmée et nos chefs pâtissiers préparent vos délices.
              </p>

              {/* Programme de Fidélité */}
              <div className="max-w-lg mx-auto mb-8">
                {loyaltyMember ? (
                  <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] text-white p-6 rounded-3xl border border-purple-500/40 shadow-xl text-left relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                        <Crown size={16} />
                        <span>Club Fidélité ({loyaltyMember.tier})</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500 text-white">
                        Membre Actif
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white mb-1">
                      {enrolledSuccess ? '🎉 Inscription Réussie !' : 'Vos Points ont été Crédités !'}
                    </h3>
                    <p className="text-xs text-gray-300 mb-4">
                      Votre solde actuel est de <strong className="text-purple-300 text-sm">{loyaltyMember.points} points</strong>.
                    </p>

                    <button
                      onClick={() => {
                        localStorage.setItem('le_ci_customer_loyalty', JSON.stringify({
                          phone: loyaltyMember.phone,
                          name: loyaltyMember.name
                        }));
                        navigate('/fidelite');
                      }}
                      className="w-full py-2.5 px-4 rounded-full bg-[#581C87] hover:bg-[#6B21A8] text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Gift size={16} />
                      <span>Accéder à mon Espace Fidélité</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-3xl border-2 border-purple-200 shadow-xl text-left relative overflow-hidden">
                    <div className="flex items-center gap-2 text-[#581C87] font-extrabold text-xs uppercase tracking-wider mb-2">
                      <Gift size={18} />
                      <span>Club Fidélité Les Douceurs de Lê Ci</span>
                    </div>

                    <h3 className="text-lg font-black text-gray-900 mb-1">
                      Rejoignez notre Club de Fidélité !
                    </h3>
                    <p className="text-xs text-gray-600 mb-4">
                      Cette commande vous rapporte des points + <strong className="text-[#581C87]">{loyaltySettings?.welcome_bonus_points || 50} points de bienvenue</strong> offerts immédiatement.
                    </p>

                    <form onSubmit={handleEnrollLoyalty} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Votre Nom</label>
                          <input
                            type="text"
                            required
                            value={enrollName}
                            onChange={(e) => setEnrollName(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#581C87]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Numéro Mobile / WhatsApp</label>
                          <input
                            type="tel"
                            required
                            value={enrollPhone}
                            onChange={(e) => setEnrollPhone(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#581C87]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={enrolling}
                        className="w-full py-3 px-4 rounded-full bg-[#581C87] hover:bg-[#6B21A8] text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserCheck size={16} />
                        <span>{enrolling ? 'Inscription en cours...' : `M'inscrire & Récupérer mes points offerts`}</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Récapitulatif ticket (Reçu officiel en 3 sections) */}
              <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-gray-200 text-left max-w-lg mx-auto mb-8 space-y-5">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-200">
                  <span className="font-mono font-bold text-gray-700">Commande {order.id}</span>
                  <span className="font-mono font-bold text-[#581C87] bg-purple-100 px-2.5 py-0.5 rounded-full">Réf : {order.codeReference}</span>
                </div>

                {/* SECTION 1 : Désignation, Saveur, Modèle catalogue, Quantité, Parts (si gâteau) */}
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#581C87]">
                    1. Détails de la pâtisserie commandée
                  </h4>
                  {order.items && order.items.map((item, idx) => {
                    const info = parseItemInvoiceInfo(item);
                    return (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-purple-100 text-xs space-y-1">
                        <div className="font-extrabold text-gray-900">{info.designation}</div>
                        <div className="text-gray-600"><span className="font-semibold text-gray-700">Saveur :</span> {info.flavor}</div>
                        <div className="text-gray-600"><span className="font-semibold text-gray-700">Modèle du catalogue :</span> {info.catalogModel}</div>
                        <div className="flex flex-wrap gap-4 pt-1 text-gray-800 font-bold">
                          <span>Quantité : {info.quantity}</span>
                          {info.isCake && info.portion && (
                            <span className="text-[#581C87]">Nombre de parts : {info.portion}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* SECTION 2 : Prix des pâtisseries, Frais de livraison (+), Carte de vœux, Montant total */}
                <div className="pt-3 border-t border-gray-200 space-y-1.5 text-xs sm:text-sm">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#581C87] mb-2">
                    2. Récapitulatif financier
                  </h4>
                  <div className="flex justify-between py-0.5">
                    <span className="text-gray-600">Prix des pâtisseries :</span>
                    <span className="font-bold text-gray-900">{itemsSubtotal.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-gray-600">Frais de livraison :</span>
                    <span className="font-bold text-gray-900">
                      +{calculatedDeliveryFee.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  {hasCard && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-600">Carte de vœux :</span>
                      <span className="font-bold text-[#581C87]">+200 FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-black text-sm sm:text-base">
                    <span className="text-gray-900">Montant total :</span>
                    <span className="text-emerald-700">{amount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                {/* SECTION 3 : Coordonnées de la personne qui reçoit */}
                <div className="pt-3 border-t border-gray-200 space-y-1 text-xs">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#581C87] mb-1.5">
                    3. Coordonnées de la personne qui reçoit
                  </h4>
                  <div className="text-gray-700">
                    <span className="font-semibold">Téléphone de réception :</span> {recipientDetails.phone}
                  </div>
                  {recipientDetails.backupPhone && (
                    <div className="text-gray-700">
                      <span className="font-semibold">Second numéro de secours :</span> {recipientDetails.backupPhone}
                    </div>
                  )}
                  <div className="text-gray-700">
                    <span className="font-semibold">Lieu / Réception :</span> {recipientDetails.address}
                  </div>
                  {recipientDetails.dateSlot && (
                    <div className="text-gray-700">
                      <span className="font-semibold">Date & Heure :</span> {recipientDetails.dateSlot}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/catalogue')}
                  className="px-8 py-3.5 bg-[#581C87] hover:bg-[#6B21A8] text-white font-bold rounded-full transition shadow-lg shadow-purple-900/20 cursor-pointer"
                >
                  Continuer mes achats
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN ANNULATION / EXPIRATION */}
          {/* ========================================================================= */}
          {isCancelled && (
            <motion.div
              key="cancelled"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-red-100 text-center"
            >
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={48} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Commande Annulée</h1>
              <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm font-light">
                Cette commande a été annulée. Aucun montant n'a été débité de votre compte.
              </p>
              <button
                onClick={() => navigate('/catalogue')}
                className="px-8 py-3.5 bg-[#581C87] hover:bg-[#6B21A8] text-white font-semibold rounded-full transition cursor-pointer"
              >
                Passer une nouvelle commande
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* ÉTAPE 1 : PAGE DE PAIEMENT - CHOIX DU MOYEN DE PAIEMENT & SAISIE NOM + TÉL */}
          {/* ========================================================================= */}
          {!isPaid && !isCancelled && !isPaymentConfirmed && (
            <motion.div
              key="payment_form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden"
            >
              {/* En-tête Violet Brand */}
              <div className="bg-gradient-to-r from-purple-950 via-[#581C87] to-purple-900 text-white p-6 sm:p-8">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white/15 text-purple-200">
                    <CreditCard size={13} /> Étape 1/2 : Choix du règlement
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
                    Réf : {codeRef}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Règlement de votre commande</h1>
                <p className="text-xs sm:text-sm text-purple-200/90 font-light mt-1">
                  Choisissez votre moyen de paiement mobile puis renseignez vos coordonnées pour initier le transfert.
                </p>

                <div className="mt-6 pt-4 border-t border-purple-800/80 flex flex-wrap items-baseline justify-between gap-3">
                  <div className="text-xs sm:text-sm text-purple-200">
                    Commande <span className="font-mono font-bold text-white">{order.id}</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {amount.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              </div>

              {/* Corps du formulaire de paiement */}
              <div className="p-6 sm:p-8 space-y-8">
                
                {/* Détails de la facture en 3 sections distinctes */}
                <div className="bg-purple-50/50 p-5 sm:p-6 rounded-2xl border border-purple-100 text-xs sm:text-sm text-gray-700 space-y-5">
                  <div className="font-extrabold text-gray-900 flex items-center gap-2 border-b border-purple-200/70 pb-2.5">
                    <Sparkles size={16} className="text-[#581C87]" />
                    <span>Détails de la facture</span>
                  </div>

                  {/* SECTION 1 : Désignation du produit, Saveur, Modèle du catalogue, Quantité, Nombre de parts (si gâteau) */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-black uppercase tracking-wider text-[#581C87]">
                      1. Produit(s) commandé(s)
                    </div>
                    {order.items && order.items.map((item, idx) => {
                      const info = parseItemInvoiceInfo(item);
                      return (
                        <div key={idx} className="p-3.5 rounded-xl bg-white border border-purple-100 space-y-1.5 shadow-2xs">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-extrabold text-gray-900 text-sm">{info.designation}</span>
                            <span className="font-black text-[#581C87] shrink-0">
                              {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-600 pt-1">
                            <div><span className="font-bold text-gray-800">Saveur :</span> {info.flavor}</div>
                            <div><span className="font-bold text-gray-800">Modèle du catalogue :</span> {info.catalogModel}</div>
                            <div><span className="font-bold text-gray-800">Quantité :</span> {info.quantity}</div>
                            {info.isCake && info.portion && (
                              <div><span className="font-bold text-[#581C87]">Nombre de parts :</span> <span className="font-bold text-[#581C87]">{info.portion}</span></div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* SECTION 2 : Prix des pâtisseries, Frais de livraison (+ devant), Carte de vœux, Montant total */}
                  <div className="pt-3 border-t border-purple-200/70 space-y-2">
                    <div className="text-[11px] font-black uppercase tracking-wider text-[#581C87]">
                      2. Montants & Livraison
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm text-gray-700">
                      <span>Prix des pâtisseries :</span>
                      <span className="font-bold text-gray-900">{itemsSubtotal.toLocaleString('fr-FR')} FCFA</span>
                    </div>

                    <div className="flex justify-between items-center text-xs sm:text-sm text-gray-700">
                      <span>Frais de livraison :</span>
                      <span className="font-bold text-[#581C87]">
                        +{calculatedDeliveryFee.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    {hasCard && (
                      <div className="flex justify-between items-center text-xs sm:text-sm text-gray-700">
                        <span>Carte de vœux :</span>
                        <span className="font-bold text-[#581C87]">+200 FCFA</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-purple-200/70 font-extrabold text-sm sm:text-base">
                      <span className="text-gray-900">Montant total :</span>
                      <span className="text-[#581C87] text-base sm:text-lg font-black">{amount.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>

                  {/* SECTION 3 : Coordonnées de la personne qui reçoit */}
                  <div className="pt-3 border-t border-purple-200/70 space-y-1.5 text-xs">
                    <div className="text-[11px] font-black uppercase tracking-wider text-[#581C87]">
                      3. Coordonnées de la personne qui reçoit
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-gray-700">
                      <div>
                        <span className="font-bold text-gray-900">Téléphone de réception :</span> {recipientDetails.phone}
                      </div>
                      {recipientDetails.backupPhone && (
                        <div>
                          <span className="font-bold text-gray-900">Numéro de secours :</span> {recipientDetails.backupPhone}
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <span className="font-bold text-gray-900">Lieu de réception :</span> {recipientDetails.address}
                      </div>
                      {recipientDetails.dateSlot && (
                        <div className="sm:col-span-2">
                          <span className="font-bold text-gray-900">Date & Créneau :</span> {recipientDetails.dateSlot}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmPaymentDetails} className="space-y-8">
                  {/* 1. Choix du moyen de paiement mobile */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-[#581C87] text-[11px] font-black flex items-center justify-center">1</span>
                      Choisissez votre moyen de paiement mobile *
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Orange Money */}
                      <button
                        type="button"
                        onClick={() => setSelectedOperator('orange')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          selectedOperator === 'orange'
                            ? 'border-[#FF6600] bg-orange-50/40 text-gray-900 shadow-md ring-2 ring-orange-400/20'
                            : 'border-gray-200 hover:border-orange-200 text-gray-600 hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#FF6600] text-white flex items-center justify-center font-black text-xs shadow-sm">
                            OM
                          </div>
                          {selectedOperator === 'orange' && <CheckCircle2 size={18} className="text-[#FF6600]" />}
                        </div>
                        <div>
                          <span className="font-extrabold text-sm block text-gray-900">Orange Money</span>
                          <span className="text-[11px] text-gray-500 font-light">Burkina Faso (Code *144#)</span>
                        </div>
                      </button>

                      {/* Moov Money */}
                      <button
                        type="button"
                        onClick={() => setSelectedOperator('moov')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          selectedOperator === 'moov'
                            ? 'border-[#0055A5] bg-blue-50/40 text-gray-900 shadow-md ring-2 ring-blue-400/20'
                            : 'border-gray-200 hover:border-blue-200 text-gray-600 hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#0055A5] text-white flex items-center justify-center font-black text-xs shadow-sm">
                            M
                          </div>
                          {selectedOperator === 'moov' && <CheckCircle2 size={18} className="text-[#0055A5]" />}
                        </div>
                        <div>
                          <span className="font-extrabold text-sm block text-gray-900">Moov Money</span>
                          <span className="text-[11px] text-gray-500 font-light">Burkina Faso (Code *555#)</span>
                        </div>
                      </button>

                      {/* Wave */}
                      <button
                        type="button"
                        onClick={() => setSelectedOperator('wave')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          selectedOperator === 'wave'
                            ? 'border-[#1DA1F2] bg-sky-50/40 text-gray-900 shadow-md ring-2 ring-sky-400/20'
                            : 'border-gray-200 hover:border-sky-200 text-gray-600 hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#1DA1F2] text-white flex items-center justify-center font-black text-xs shadow-sm">
                            W
                          </div>
                          {selectedOperator === 'wave' && <CheckCircle2 size={18} className="text-[#1DA1F2]" />}
                        </div>
                        <div>
                          <span className="font-extrabold text-sm block text-gray-900">Wave</span>
                          <span className="text-[11px] text-gray-500 font-light">Paiement direct Wave</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 2. Saisie du numéro de transfert et du nom du payeur */}
                  <div className="bg-gray-50/80 p-6 rounded-3xl border border-gray-200 space-y-4">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-[#581C87] text-[11px] font-black flex items-center justify-center">2</span>
                      Coordonnées de l'émetteur du transfert mobile
                    </label>
                    <p className="text-xs text-gray-500 font-light">
                      Indiquez le numéro et le nom depuis lesquels vous allez envoyer les fonds pour la validation immédiate de votre commande.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          Votre Nom & Prénom *
                        </label>
                        <input
                          type="text"
                          required
                          value={payerName}
                          onChange={(e) => { setPayerName(e.target.value); setPaymentError(''); }}
                          placeholder="Ex: Alassane Ouédraogo"
                          className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          Votre Numéro Mobile Money de transfert *
                        </label>
                        <input
                          type="tel"
                          required
                          value={payerPhone}
                          onChange={(e) => { setPayerPhone(e.target.value); setPaymentError(''); }}
                          placeholder="Ex: 70 00 00 00 ou 76 00 00 00"
                          className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {/* Bouton de confirmation vers la page d'attente */}
                  <div className="pt-2 space-y-3">
                    <button
                      type="submit"
                      disabled={confirmingPayment}
                      className="w-full py-4 px-8 rounded-full bg-[#581C87] hover:bg-[#6B21A8] text-white font-black text-sm sm:text-base shadow-xl shadow-purple-900/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {confirmingPayment ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-white" />
                          <span>Validation en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirmer et passer à l'attente de paiement</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>

                    {/* Bouton Payer avec un autre numéro visible dès l'affichage (§10.6.1) */}
                    <button
                      type="button"
                      onClick={handleOpenOtherPayment}
                      disabled={openingOtherPay}
                      className="w-full py-3.5 px-6 rounded-full border-2 border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-[#581C87] font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Share2 size={16} />
                      <span>
                        {openingOtherPay
                          ? 'Ouverture du lien sécurisé...'
                          : 'Payer avec un autre numéro / Faire payer par un proche'}
                      </span>
                    </button>

                    <p className="text-[11px] text-center text-gray-400 mt-2 font-light">
                      À l'étape suivante, vous accéderez à la page d'attente avec le code USSD direct ou le lien de paiement.
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* ÉTAPE 2 : PAGE D'ATTENTE DE PAIEMENT ACTIVE (AVEC MINUTEUR & CODE RÉF) */}
          {/* ========================================================================= */}
          {!isPaid && !isCancelled && isPaymentConfirmed && (
            <motion.div
              key="waiting_screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              {/* En-tête avec minuteur */}
              <div className="bg-gradient-to-r from-purple-950 via-[#581C87] to-purple-900 text-white p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-purple-200 font-semibold flex items-center gap-1.5 mb-1">
                      <Clock size={14} className="text-amber-400" /> Étape 2/2 : Attente de confirmation
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold">Finalisez votre règlement</h1>
                  </div>

                  {/* Minuteur TTL 10 min */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
                    <Clock size={20} className="text-amber-300 animate-pulse" />
                    <div>
                      <div className="text-[10px] uppercase text-purple-200 font-semibold tracking-wider">Temps restant</div>
                      <div className="text-lg font-mono font-bold text-white">{formatTimer(remainingSeconds)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-t border-purple-800/80 pt-4">
                  <div className="text-xs sm:text-sm text-purple-200">
                    Commande <span className="font-mono font-bold text-white">{order.id}</span>
                  </div>
                  <div className="text-2xl font-black text-amber-300">
                    {amount.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              </div>

              {/* Corps de la page d'attente */}
              <div className="p-6 sm:p-8 space-y-8">
                
                {/* Rappel des coordonnées de transfert saisies + Bouton Payer avec un autre numéro (§10.6.1) */}
                <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 flex flex-col gap-3 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-gray-500 block text-xs">Paiement attendu depuis :</span>
                      <span className="font-extrabold text-gray-900">
                        {payerName || 'Client'} ({payerPhone}) • via {selectedOperator === 'orange' ? 'Orange Money' : (selectedOperator === 'moov' ? 'Moov Money' : 'Wave')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPaymentConfirmed(false)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#581C87] hover:underline cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      <span>Modifier</span>
                    </button>
                  </div>

                  <div className="pt-3 border-t border-purple-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-gray-600">
                      Solde insuffisant ou paiement par un proche ?
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenOtherPayment}
                      disabled={openingOtherPay}
                      className="px-4 py-2 rounded-xl bg-[#581C87] hover:bg-[#6B21A8] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      <Share2 size={13} />
                      <span>{openingOtherPay ? 'Ouverture...' : 'Payer avec un autre numéro'}</span>
                    </button>
                  </div>
                </div>

                {/* Alerte WebView Réseaux Sociaux si applicable */}
                {isInAppBrowser && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 space-y-1">
                      <p className="font-bold">Vous êtes dans un navigateur de réseau social</p>
                      <p>Les appels USSD directs peuvent être restreints. Copiez le code ci-dessous et collez-le dans votre téléphone.</p>
                      {isAndroid && (
                        <a
                          href={chromeIntentUrl}
                          className="inline-flex items-center gap-1 font-semibold text-amber-900 underline mt-1"
                        >
                          Ouvrir dans Google Chrome <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Bloc d'action paiement USSD / Wave */}
                <div className="bg-[#FAF8F5] border border-gray-200 rounded-3xl p-6 sm:p-8 text-center space-y-6">
                  {/* Code Référence Unique */}
                  <div className="inline-block bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                      Votre Code Référence Unique
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono text-3xl font-black text-[#581C87] tracking-widest">
                        {order.codeReference}
                      </span>
                      <button
                        onClick={() => copyCode(order.codeReference || '')}
                        className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                        title="Copier le code"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                    {copied && <span className="text-[11px] font-semibold text-emerald-600">Copié dans le presse-papier !</span>}
                  </div>

                  {/* Actions Mobile (Bouton USSD ou Wave Direct) */}
                  <div className="space-y-3 max-w-md mx-auto">
                    {selectedOperator === 'orange' && (
                      <a
                        href={omTelUrl}
                        className="w-full py-4 px-6 bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-full shadow-xl shadow-orange-500/25 flex items-center justify-center gap-3 transition transform active:scale-[0.98]"
                      >
                        <PhoneCall size={22} />
                        Lancer le paiement USSD Orange (*144#)
                      </a>
                    )}

                    {selectedOperator === 'moov' && (
                      <a
                        href={moovTelUrl}
                        className="w-full py-4 px-6 bg-[#0055A5] hover:bg-[#004485] text-white font-bold rounded-full shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition transform active:scale-[0.98]"
                      >
                        <PhoneCall size={22} />
                        Lancer le paiement USSD Moov (*555#)
                      </a>
                    )}

                    {selectedOperator === 'wave' && (
                      <a
                        href={merchantConfig.waveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-4 px-6 bg-[#1DA1F2] hover:bg-[#1890d9] text-white font-bold rounded-full shadow-xl shadow-sky-500/25 flex items-center justify-center gap-3 transition transform active:scale-[0.98]"
                      >
                        <Smartphone size={22} />
                        Payer directement via Wave
                      </a>
                    )}

                    {/* Syntaxe USSD brute copiable */}
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
                      <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                        {selectedOperator === 'orange' ? omUssdMarchand : (selectedOperator === 'moov' ? moovUssd : 'Paiement Wave')}
                      </span>
                      <button
                        onClick={() => copyCode(selectedOperator === 'orange' ? omUssdMarchand : moovUssd)}
                        className="text-gray-400 hover:text-gray-900 cursor-pointer"
                        title="Copier la commande USSD"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Desktop QR Code */}
                  <div className="pt-6 border-t border-gray-200/60 max-w-xs mx-auto">
                    <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center justify-center gap-1.5">
                      <QrCode size={16} /> Ou scannez depuis votre smartphone
                    </p>
                    {qrCodeDataUrl ? (
                      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 inline-block">
                        <img src={qrCodeDataUrl} alt="QR Code Paiement" className="w-44 h-44 mx-auto" />
                      </div>
                    ) : (
                      <div className="w-44 h-44 bg-gray-100 rounded-2xl animate-pulse mx-auto" />
                    )}
                  </div>
                </div>

                {/* État de synchronisation en direct */}
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 py-3 rounded-2xl border border-gray-200/50">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>En attente de détection automatique de votre transfert...</span>
                </div>

                {/* Bouton Annulation très visible au format Pill (Point 1 UPDATE) */}
                <div className="pt-6 pb-2 text-center border-t border-purple-100/60 mt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="px-8 py-3.5 rounded-full border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 font-extrabold text-xs shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5"
                  >
                    <XCircle size={17} className="text-red-500" />
                    <span>{cancelling ? 'Annulation en cours...' : 'Annuler cette commande'}</span>
                  </button>
                  <p className="text-[11px] text-gray-400 mt-2 font-light">
                    Vous pouvez annuler sans frais à tout moment avant la confirmation du paiement.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
