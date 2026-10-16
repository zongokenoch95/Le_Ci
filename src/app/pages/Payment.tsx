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
  ExternalLink
} from 'lucide-react';
import { getOrder, getOrderStatus, cancelOrder, Order } from '../services/api';
import { getSocket, joinOrder, leaveOrder } from '../services/socket';

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

  // Syntaxes USSD
  const omUssdMarchand = `*144*4*6*${merchantConfig.orangeCode}*${amount}*${codeRef}#`;
  const omTelUrl = `tel:${encodeURIComponent(omUssdMarchand)}`;

  const moovUssd = `*555*4*1*${merchantConfig.moovCode}*${amount}#`;
  const moovTelUrl = `tel:${encodeURIComponent(moovUssd)}`;

  // Chargement initial
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

  // Génération du QR Code Desktop
  useEffect(() => {
    if (!order) return;
    const targetUrl = selectedOperator === 'wave' ? merchantConfig.waveUrl : omUssdMarchand;
    QRCode.toDataURL(targetUrl, { width: 220, margin: 2, color: { dark: '#111827', light: '#ffffff' } })
      .then(setQrCodeDataUrl)
      .catch(console.error);
  }, [order, selectedOperator, omUssdMarchand]);

  // Décompte temps restant (10:00)
  useEffect(() => {
    if (!order || order.statut !== 'EN_ATTENTE_DE_PAIEMENT') return;
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
  }, [order]);

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
          .catch(() => {});
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
        colors: ['#D4AF37', '#10B981', '#3B82F6', '#F59E0B']
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
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Chargement des détails de paiement...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF8F5]">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Commande introuvable</h2>
          <p className="text-gray-600 mb-6">Cette commande n'existe pas ou a expiré.</p>
          <button
            onClick={() => navigate('/catalogue')}
            className="w-full py-3 bg-[#D4AF37] hover:bg-[#c29d2b] text-white font-semibold rounded-xl transition"
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
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6] text-gray-900">
      <div className="max-w-3xl mx-auto">
        {/* Navigation retour */}
        <button
          onClick={() => navigate('/catalogue')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft size={16} /> Retour au catalogue
        </button>

        <AnimatePresence mode="wait">
          {/* ÉCRAN SUCCÈS : COMMANDE VALIDÉE */}
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
                <Sparkles size={14} /> Paiement Validé Automatiquement
              </span>

              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Paiement Reçu avec Succès !</h1>
              <p className="text-gray-600 max-w-lg mx-auto mb-8">
                Merci <span className="font-semibold text-gray-900">{order.customerName}</span>. Votre commande est validée et nos chefs pâtissiers ont déjà commencé sa préparation.
              </p>

              {/* Récapitulatif ticket */}
              <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-gray-100 text-left max-w-lg mx-auto mb-8 space-y-3">
                <div className="flex justify-between text-sm py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Numéro Commande</span>
                  <span className="font-mono font-bold text-gray-900">{order.id}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Code Référence</span>
                  <span className="font-mono font-bold text-[#D4AF37]">{order.codeReference}</span>
                </div>
                {order.transactionRef && (
                  <div className="flex justify-between text-sm py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Réf Transaction Mobile</span>
                    <span className="font-mono font-semibold text-emerald-700">{order.transactionRef}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Montant Réglé</span>
                  <span className="font-extrabold text-emerald-700 text-base">{order.montantTotal} FCFA / DT</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-500">Statut de Préparation</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> En cuisine
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/catalogue')}
                  className="px-8 py-3.5 bg-[#D4AF37] hover:bg-[#c29d2b] text-white font-bold rounded-xl transition shadow-lg shadow-[#D4AF37]/20"
                >
                  Continuer mes achats
                </button>
              </div>
            </motion.div>
          )}

          {/* ÉCRAN ANNULATION / EXPIRATION */}
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Commande Expirée ou Annulée</h1>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Le délai de paiement de 10 minutes a expiré ou la commande a été annulée. Aucun montant n'a été débité.
              </p>
              <button
                onClick={() => navigate('/catalogue')}
                className="px-8 py-3 bg-[#D4AF37] hover:bg-[#c29d2b] text-white font-semibold rounded-xl transition"
              >
                Passer une nouvelle commande
              </button>
            </motion.div>
          )}

          {/* ÉCRAN ATTENTE DE PAIEMENT ACTIVE */}
          {!isPaid && !isCancelled && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              {/* Entête avec minuterie TTL */}
              <div className="bg-[#111827] text-white p-6 sm:p-8 relative">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold">Paiement Mobile Direct</span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Finalisez votre règlement</h1>
                  </div>
                  
                  {/* Minuteur TTL 10 min */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
                    <Clock size={20} className="text-[#D4AF37] animate-pulse" />
                    <div>
                      <div className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Temps restant</div>
                      <div className="text-lg font-mono font-bold text-white">{formatTimer(remainingSeconds)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-t border-white/10 pt-4">
                  <div className="text-sm text-gray-300">
                    Commande <span className="font-mono font-bold text-white">{order.id}</span> • {order.customerName}
                  </div>
                  <div className="text-2xl font-black text-[#D4AF37]">
                    {amount} FCFA / DT
                  </div>
                </div>
              </div>

              {/* Corps */}
              <div className="p-6 sm:p-8 space-y-8">
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

                {/* Sélecteur d'opérateur */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Sélectionnez votre moyen de paiement
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedOperator('orange')}
                      className={`p-4 rounded-2xl border-2 text-center transition flex flex-col items-center gap-2 ${
                        selectedOperator === 'orange'
                          ? 'border-[#FF6600] bg-orange-50/50 text-[#FF6600] shadow-md'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#FF6600] text-white flex items-center justify-center font-black text-xs">
                        OM
                      </div>
                      <span className="text-xs font-bold">Orange Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedOperator('wave')}
                      className={`p-4 rounded-2xl border-2 text-center transition flex flex-col items-center gap-2 ${
                        selectedOperator === 'wave'
                          ? 'border-[#1DA1F2] bg-blue-50/50 text-[#1DA1F2] shadow-md'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center font-black text-xs">
                        W
                      </div>
                      <span className="text-xs font-bold">Wave</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedOperator('moov')}
                      className={`p-4 rounded-2xl border-2 text-center transition flex flex-col items-center gap-2 ${
                        selectedOperator === 'moov'
                          ? 'border-[#0055A5] bg-blue-50/50 text-[#0055A5] shadow-md'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0055A5] text-white flex items-center justify-center font-black text-xs">
                        M
                      </div>
                      <span className="text-xs font-bold">Moov Money</span>
                    </button>
                  </div>
                </div>

                {/* Bloc d'action paiement */}
                <div className="bg-[#FAF8F5] border border-gray-200 rounded-3xl p-6 sm:p-8 text-center space-y-6">
                  {/* Code Référence Unique */}
                  <div className="inline-block bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                      Votre Code Référence Unique
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono text-3xl font-black text-[#D4AF37] tracking-widest">
                        {order.codeReference}
                      </span>
                      <button
                        onClick={() => copyCode(order.codeReference || '')}
                        className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
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
                        className="w-full py-4 px-6 bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-3 transition transform active:scale-[0.98]"
                      >
                        <PhoneCall size={22} />
                        Lancer le paiement USSD Orange
                      </a>
                    )}

                    {selectedOperator === 'moov' && (
                      <a
                        href={moovTelUrl}
                        className="w-full py-4 px-6 bg-[#0055A5] hover:bg-[#004485] text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition transform active:scale-[0.98]"
                      >
                        <PhoneCall size={22} />
                        Lancer le paiement USSD Moov
                      </a>
                    )}

                    {selectedOperator === 'wave' && (
                      <a
                        href={merchantConfig.waveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-4 px-6 bg-[#1DA1F2] hover:bg-[#1890d9] text-white font-bold rounded-2xl shadow-xl shadow-sky-500/25 flex items-center justify-center gap-3 transition transform active:scale-[0.98]"
                      >
                        <Smartphone size={22} />
                        Payer directement via Wave
                      </a>
                    )}

                    {/* Syntaxe USSD brute copiable */}
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
                      <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                        {selectedOperator === 'orange' ? omUssdMarchand : moovUssd}
                      </span>
                      <button
                        onClick={() => copyCode(selectedOperator === 'orange' ? omUssdMarchand : moovUssd)}
                        className="text-gray-400 hover:text-gray-900"
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
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 py-3 rounded-xl border border-gray-200/50">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>En attente de détection automatique du SMS de caisse...</span>
                </div>

                {/* Bouton Annulation */}
                <div className="pt-2 text-center">
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="text-xs font-medium text-gray-400 hover:text-red-600 transition"
                  >
                    {cancelling ? 'Annulation en cours...' : 'Annuler cette commande'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
