import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function FloatingCartButton() {
  const { totalItems, totalAmount } = useCart();
  const { pathname } = useLocation();

  const hiddenRoutes = ['/panier', '/paiement', '/pay', '/admin'];
  const shouldHide =
    totalItems <= 0 || hiddenRoutes.some((route) => pathname.startsWith(route));

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-max max-w-[calc(100vw-2rem)]"
        >
          <Link
            to="/panier"
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] font-extrabold text-xs sm:text-sm shadow-[0_10px_28px_rgba(43,18,4,0.28)] transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <span className="relative flex items-center justify-center">
              <ShoppingBag size={18} />
              <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#2B1204] text-[#F8BE40] text-[11px] font-black">
                {totalItems}
              </span>
            </span>
            <span className="whitespace-nowrap">Voir le panier</span>
            <span className="hidden xs:inline text-[#2B1204]/75">•</span>
            <span className="whitespace-nowrap font-black">
              {totalAmount.toLocaleString('fr-FR')} FCFA
            </span>
            <ArrowRight size={16} className="shrink-0" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
