import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';

export const CartDrawer: React.FC = () => {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount } = useCart();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Votre panier est vide.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const order = await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.numericPrice,
          quantity: item.quantity,
          image: item.image
        })),
        montantTotal: totalAmount,
        modePaiement: 'orange_money',
        notes: notes.trim() || 'Commande depuis le panier'
      });

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
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#111827] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Mon Panier Gourmand</h2>
                  <p className="text-xs text-gray-400">
                    {totalItems} article{totalItems > 1 ? 's' : ''} sélectionné{totalItems > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
                aria-label="Fermer le panier"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                  <div className="w-20 h-20 rounded-full bg-[#FAF8F5] border border-gray-200 flex items-center justify-center mb-4 text-gray-400">
                    <ShoppingBag size={36} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Votre panier est vide</h3>
                  <p className="text-sm text-gray-500 max-w-xs mb-6">
                    Laissez-vous tenter par nos créations artisanales à partir de 500 FCFA.
                  </p>
                  <button
                    onClick={() => {
                      closeCart();
                      navigate('/catalogue');
                    }}
                    className="px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#c29d2b] text-white text-xs font-bold shadow-md transition"
                  >
                    Découvrir nos créations
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-2xl border border-gray-100 hover:border-[#D4AF37]/30 transition"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover border border-white shadow-sm flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                          <p className="text-xs text-[#D4AF37] font-semibold">
                            {item.numericPrice.toLocaleString('fr-FR')} FCFA
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                              aria-label="Diminuer quantité"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold text-gray-800 px-1">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                              aria-label="Augmenter quantité"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right flex flex-col justify-between items-end h-16">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-500 transition p-1"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                          <p className="text-xs font-extrabold text-gray-900">
                            {(item.numericPrice * item.quantity).toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-between items-center text-xs text-gray-500">
                    <button
                      onClick={clearCart}
                      className="text-gray-400 hover:text-red-500 transition underline"
                    >
                      Vider le panier
                    </button>
                    <span>Paiement direct à la livraison ou en ligne</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer with Checkout Form */}
            {items.length > 0 && (
              <div className="p-5 border-t border-gray-100 bg-white">
                {/* Récapitulatif Total */}
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-gray-200 mb-4 space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Nombre d'articles</span>
                    <span className="font-semibold text-gray-900">{totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-extrabold text-gray-900 pt-1 border-t border-gray-200">
                    <span>Total à payer</span>
                    <span className="text-base text-[#D4AF37] font-black">
                      {totalAmount.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                {/* Formulaire de Commande */}
                <form onSubmit={handleCheckout} className="space-y-3">
                  {errorMsg && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Votre Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Amina Kaboré"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Numéro WhatsApp / Orange Money *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 70123456"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white shadow-sm"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Validation automatique instantanée dès réception du SMS Orange Money.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#c29d2b] text-white font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Création de la commande...</span>
                    ) : (
                      <>
                        <span>Commander & Payer ({totalAmount.toLocaleString('fr-FR')} FCFA)</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-semibold pt-1">
                    <ShieldCheck size={14} />
                    <span>Paiement sécurisé et vérifié par Orange Money</span>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
