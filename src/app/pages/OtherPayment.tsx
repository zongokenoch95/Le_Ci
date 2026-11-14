import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Copy,
  PhoneCall,
  Share2,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Loader2,
  PlusCircle,
  MessageCircle
} from 'lucide-react';
import {
  getPayTokenInfo,
  addPayTokenPayerNumber,
  PayTokenPublicInfo
} from '../services/api';
import { getSocket, joinOrder, leaveOrder } from '../services/socket';
import { validateBurkinaPhone } from '../utils/phoneValidation';

const MERCHANT_OM_PHONE = '77121289';

export function OtherPayment() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [info, setInfo] = useState<PayTokenPublicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalidOrExpiredError, setInvalidOrExpiredError] = useState<string | null>(null);

  const [newPhone, setNewPhone] = useState('');
  const [addedPhone, setAddedPhone] = useState<string | null>(null);
  const [submittingPhone, setSubmittingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState('');

  const [copiedUssd, setCopiedUssd] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const hasTriggeredConfetti = useRef(false);

  // Chargement initial via GET /api/pay/:token (Zéro donnée personnelle exposée)
  useEffect(() => {
    if (!token) {
      setInvalidOrExpiredError('Lien invalide ou expiré');
      setLoading(false);
      return;
    }

    getPayTokenInfo(token)
      .then((data) => {
        setInfo(data);
      })
      .catch((err) => {
        setInvalidOrExpiredError(err.message || 'Lien invalide ou expiré');
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Synchronisation temps réel via Socket.io + Polling 3s (sans compte à rebours affiché)
  useEffect(() => {
    if (!info?.reference || !token) return;

    const orderId = info.reference;
    joinOrder(orderId);
    const socket = getSocket();

    const handleStatusChanged = (data: { orderId: string; statut: string }) => {
      if (data.orderId === orderId && data.statut) {
        setInfo((prev) => (prev ? { ...prev, status: data.statut } : prev));
      }
    };

    socket.on('order:status_changed', handleStatusChanged);

    const pollInterval = setInterval(() => {
      if (info.status === 'EN_ATTENTE_DE_PAIEMENT') {
        getPayTokenInfo(token)
          .then((fresh) => {
            setInfo(fresh);
          })
          .catch(() => {});
      }
    }, 3000);

    return () => {
      leaveOrder(orderId);
      socket.off('order:status_changed', handleStatusChanged);
      clearInterval(pollInterval);
    };
  }, [info?.reference, info?.status, token]);

  // Effet Confetti dès que la commande passe en PAYEE / EN_PREPARATION
  useEffect(() => {
    if (
      info &&
      (info.status === 'EN_PREPARATION' || info.status === 'PAYEE' || info.status === 'PRETE') &&
      !hasTriggeredConfetti.current
    ) {
      hasTriggeredConfetti.current = true;
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2B1204', '#F8BE40', '#5DBA68']
      });
    }
  }, [info?.status]);

  const handleAddPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !info) return;

    const phoneVal = validateBurkinaPhone(newPhone);
    if (!phoneVal.isValid) {
      setPhoneError(
        phoneVal.error || 'Veuillez saisir un numéro à 8 chiffres (avec ou sans +226 ou 00226).'
      );
      return;
    }

    setSubmittingPhone(true);
    setPhoneError('');
    setPhoneSuccessMsg('');

    try {
      const res = await addPayTokenPayerNumber(token, phoneVal.cleanPhone);
      setAddedPhone(res.phone);
      setNewPhone('');

      setInfo((prev) =>
        prev
          ? {
              ...prev,
              status: res.status,
              expiresAt: res.expiresAt,
              payerNumbersCount: res.payerNumbersCount,
              maxPayerNumbers: res.maxPayerNumbers
            }
          : prev
      );

      if (res.autoValidated) {
        setPhoneSuccessMsg(
          `Paiement déjà reçu depuis le ${res.phone} dans les 30 dernières minutes : commande validée automatiquement !`
        );
      } else {
        setPhoneSuccessMsg(
          `Numéro ${res.phone} autorisé avec succès ! Vous pouvez maintenant lancer la syntaxe USSD ci-dessous.`
        );
      }
    } catch (err: any) {
      setPhoneError(err.message || 'Impossible d\'ajouter ce numéro');
    } finally {
      setSubmittingPhone(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = info
    ? `Bonjour ! Peux-tu régler ma commande chez ${info.shopName} (${info.amount.toLocaleString('fr-FR')} FCFA, réf ${info.reference}) via ce lien sécurisé : ${shareUrl}`
    : '';

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Paiement commande ${info?.reference || ''} — Les Douceurs de Lê Ci`,
          text: `Règlement de ${info?.amount?.toLocaleString('fr-FR') || ''} FCFA chez Les Douceurs de Lê Ci`,
          url: shareUrl
        });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyUssd = (syntax: string) => {
    navigator.clipboard.writeText(syntax);
    setCopiedUssd(true);
    setTimeout(() => setCopiedUssd(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#581C87] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium text-sm">Vérification du lien de paiement sécurisé...</p>
        </div>
      </div>
    );
  }

  // État : Lien invalide
  if (invalidOrExpiredError || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF8F5]">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-red-100">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Lien invalide ou expiré</h2>
          <p className="text-gray-600 mb-6 text-sm font-light">
            Ce lien de paiement partagé n'est plus valide ou a expiré. Aucune donnée personnelle n'est exposée.
          </p>
          <button
            onClick={() => navigate('/catalogue')}
            className="w-full py-3.5 bg-[#581C87] hover:bg-[#6B21A8] text-white font-bold rounded-full transition shadow-md cursor-pointer"
          >
            Retour à la boutique
          </button>
        </div>
      </div>
    );
  }

  const isPaid =
    info.status === 'EN_PREPARATION' || info.status === 'PAYEE' || info.status === 'PRETE' || info.status === 'LIVREE';
  const isExpiredOrCancelled = info.status === 'EXPIREE' || info.status === 'ANNULEE';
  const isManualReview = info.status === 'EN_VERIFICATION_MANUELLE';

  const ussdSyntax = `*144*10*${MERCHANT_OM_PHONE}*${info.amount}#`;
  const ussdTelHref = `tel:${encodeURIComponent(ussdSyntax)}`;
  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#FDF8F2] text-[#2B1204] font-fredoka">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* ÉTAT 1 : COMMANDE DÉJÀ PAYÉE / CONFIRMÉE */}
          {/* ========================================================================= */}
          {isPaid && (
            <motion.div
              key="other_paid"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-[#5DBA68] overflow-hidden text-center p-8 sm:p-10 space-y-6 font-fredoka"
            >
              <div className="w-20 h-20 bg-emerald-100 text-[#5DBA68] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase tracking-wider">
                  Paiement confirmé
                </span>
                <h1 className="font-fredoka text-2xl sm:text-3xl font-extrabold text-[#2B1204]">
                  Commande déjà payée !
                </h1>
                <p className="text-sm text-[#2B1204]/75 max-w-md mx-auto">
                  Le règlement de <span className="font-bold text-[#2B1204]">{info.amount.toLocaleString('fr-FR')} FCFA</span> a bien été reçu et validé automatiquement.
                </p>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 font-medium">
                Aucune action supplémentaire n'est requise sur ce lien. La pâtisserie prépare actuellement la commande.
              </div>

              <button
                onClick={() => navigate('/catalogue')}
                className="px-8 py-3.5 bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] border-2 border-[#F8BE40] font-extrabold rounded-full shadow-lg transition cursor-pointer"
              >
                Découvrir Les Douceurs de Lê Ci
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* ÉTAT 2 : LIEN EXPIRÉ OU COMMANDE ANNULÉE */}
          {/* ========================================================================= */}
          {!isPaid && isExpiredOrCancelled && (
            <motion.div
              key="other_expired"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-xl border-2 border-[#C20A0A]/40 overflow-hidden text-center p-8 sm:p-10 space-y-6 font-fredoka"
            >
              <div className="w-16 h-16 bg-red-50 text-[#C20A0A] rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h1 className="font-fredoka text-2xl font-extrabold text-[#2B1204]">Lien expiré</h1>
                <p className="text-sm text-[#2B1204]/75 max-w-md mx-auto">
                  Le délai de réservation de cette commande est écoulé ou la commande a été annulée.
                </p>
              </div>
              <button
                onClick={() => navigate('/catalogue')}
                className="px-8 py-3.5 bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] border-2 border-[#F8BE40] font-extrabold rounded-full shadow-md transition cursor-pointer"
              >
                Retour au catalogue
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* ÉTAT 3 : PAIEMENT EN ATTENTE (SAISIE AUTRE NUMÉRO / PARTAGE TIERS) */}
          {/* ========================================================================= */}
          {!isPaid && !isExpiredOrCancelled && (
            <motion.div
              key="other_active"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-[#F8BE40] overflow-hidden font-fredoka"
            >
              {/* En-tête Charte Brun Cacao & Or (sans compte à rebours ni section informations de commande) */}
              <div className="bg-[#2B1204] text-[#FDF8F2] p-6 sm:p-8 border-b-2 border-[#F8BE40]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="font-fredoka text-xs uppercase tracking-wider text-[#F8BE40] font-semibold flex items-center gap-1.5 mb-1">
                      <ShieldCheck size={15} className="text-[#F8BE40]" /> {info.shopName} • Lien sécurisé
                    </span>
                    <h1 className="font-fredoka text-xl sm:text-2xl font-extrabold text-[#FDF8F2]">
                      Payer avec un autre numéro
                    </h1>
                  </div>

                  <div className="font-fredoka text-2xl sm:text-3xl font-black text-[#F8BE40]">
                    {info.amount.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-7">
                {isManualReview && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-amber-600" />
                      Paiement reçu — En cours de vérification par le caissier
                    </p>
                    <p>Votre transfert a bien été détecté et sera validé dans un instant.</p>
                  </div>
                )}

                {/* Bloc partage à un proche */}
                <div className="bg-[#FDF8F2] border border-[#F6C58E] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-extrabold text-[#2B1204] flex items-center gap-1.5">
                      <Share2 size={14} className="text-[#C20A0A]" /> Un proche paie à votre place ?
                    </div>
                    <p className="text-[11px] text-[#2B1204]/75">
                      Partagez-lui cette page : aucune donnée personnelle ni adresse n'y est affichée.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={whatsappShareHref}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition"
                    >
                      <MessageCircle size={14} />
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={handleShareLink}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FDF6EC] text-[#2B1204] border border-[#F8BE40] font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Copy size={14} />
                      {copiedLink ? 'Lien copié !' : 'Copier le lien'}
                    </button>
                  </div>
                </div>

                {/* Étape 1 : Saisie du nouveau numéro payeur (validation temps réel vert / rouge) */}
                <form onSubmit={handleAddPhone} className="space-y-4 bg-[#FDF8F2] p-5 sm:p-6 rounded-3xl border border-[#F6C58E] font-fredoka">
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-adapt text-xs font-extrabold uppercase tracking-wider text-[#2B1204] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#F8BE40] text-[#2B1204] text-[11px] font-black flex items-center justify-center">
                        1
                      </span>
                      Enregistrer le numéro qui va effectuer le transfert
                    </label>
                    <span className="text-[11px] font-semibold text-[#2B1204]/70">
                      {info.payerNumbersCount}/{info.maxPayerNumbers} numéros autorisés
                    </span>
                  </div>

                  <p className="text-xs text-[#2B1204]/75 font-light">
                    Ce numéro s'ajoute aux numéros autorisés pour la commande (sans écraser le premier). Si vous avez déjà envoyé les fonds dans les <strong>30 dernières minutes</strong>, la commande sera validée immédiatement.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewPhone(val);
                        if (!val.trim()) {
                          setPhoneError('');
                        } else {
                          const res = validateBurkinaPhone(val);
                          setPhoneError(
                            res.isValid ? '' : res.error || 'Numéro invalide (8 chiffres du Burkina Faso requis).'
                          );
                        }
                      }}
                      placeholder="Ex: 76 00 00 00 ou 70 00 00 00"
                      disabled={info.payerNumbersCount >= info.maxPayerNumbers}
                      className={`flex-1 px-4 py-3.5 rounded-2xl bg-white outline-none text-sm font-semibold disabled:opacity-50 transition ${
                        phoneError
                          ? 'border-2 border-[#C20A0A] bg-red-50/20 ring-2 ring-red-200'
                          : newPhone.trim() && validateBurkinaPhone(newPhone).isValid
                            ? 'border-2 border-[#5DBA68] bg-emerald-50/20'
                            : 'border border-[#F6C58E] focus:border-[#F8BE40]'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={submittingPhone || info.payerNumbersCount >= info.maxPayerNumbers}
                      className="px-6 py-3.5 rounded-full bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] border-2 border-[#F8BE40] font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submittingPhone ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Vérification...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle size={16} />
                          <span>Autoriser ce numéro</span>
                        </>
                      )}
                    </button>
                  </div>

                  {phoneError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle size={15} className="shrink-0" />
                      <span>{phoneError}</span>
                    </div>
                  )}

                  {phoneSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      <span>{phoneSuccessMsg}</span>
                    </div>
                  )}
                </form>

                {/* Étape 2 : Moyen de paiement opérationnel (§10.8 : Orange Money) & Syntaxe USSD (visible uniquement après saisie du numéro) */}
                {addedPhone ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-[#2B1204] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#2B1204] text-[#F8BE40] text-[11px] font-black flex items-center justify-center">
                          2
                        </span>
                        Lancer le paiement Orange Money
                      </label>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Numéro actif : {addedPhone}
                      </span>
                    </div>

                    {/* Opérateur opérationnel (§10.8) */}
                    <div className="flex justify-center">
                      <div className="h-24 w-36 p-3 rounded-2xl border-2 border-[#FF6600] bg-white shadow-md ring-2 ring-orange-400/30 flex items-center justify-center">
                        <img
                          src="/img/Orange.jpg"
                          alt="Orange Money"
                          className="max-h-14 w-auto max-w-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Syntaxe USSD générée avec bouton Copier et bouton Composer */}
                    <div className="bg-[#FAF8F5] border border-gray-200 rounded-3xl p-6 text-center space-y-4">
                      <div className="text-xs text-gray-500 font-medium">
                        Syntaxe USSD à composer depuis le numéro autorisé ({addedPhone}) :
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono text-base sm:text-lg font-black text-gray-900 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
                          {ussdSyntax}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyUssd(ussdSyntax)}
                          className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                          title="Copier la syntaxe USSD"
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                      {copiedUssd && (
                        <div className="text-xs font-bold text-emerald-600">
                          Syntaxe USSD copiée dans le presse-papier !
                        </div>
                      )}

                      <div className="max-w-md mx-auto pt-1">
                        <a
                          href={ussdTelHref}
                          className="w-full py-4 px-6 bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-full shadow-xl shadow-orange-500/25 flex items-center justify-center gap-3 transition transform active:scale-[0.98]"
                        >
                          <PhoneCall size={20} />
                          Composer la syntaxe USSD (*144#)
                        </a>
                      </div>
                    </div>

                    {/* État de synchronisation temps réel */}
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 py-3 rounded-2xl border border-gray-200/50">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>En attente de détection automatique du transfert Orange Money...</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 text-center font-medium">
                    ☝️ Veuillez d'abord saisir et autoriser le numéro qui effectuera le transfert à l'étape 1 pour débloquer la syntaxe USSD et activer la validation automatique.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
