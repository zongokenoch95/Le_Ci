import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';

const navPages = [
  { label: 'Accueil', path: '/' },
  { label: 'Nos douceurs', path: '/nos-douceurs' },
  { label: 'Gâteaux sur mesure', path: '/sur-commande' },
  { label: 'Mon Panier', path: '/panier' },
  { label: 'Carte de fidélité', path: '/fidelite' },
  { label: 'À propos', path: '/a-propos' },
  { label: 'Mentions légales', path: '/mentions-legales' },
];

export const PageNavigator: React.FC = () => {
  const location = useLocation();
  const { totalItems } = useCart();

  // Masquer sur l'espace administration
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const isHome = location.pathname === '/';

  const isPageActive = (path: string) => {
    if (path === '/nos-douceurs') {
      return ['/nos-douceurs', '/catalogue', '/nos-produits'].includes(location.pathname);
    }
    if (path === '/fidelite') {
      return ['/fidelite', '/fidelisation'].includes(location.pathname);
    }
    return location.pathname === path;
  };

  const currentPageLabel = (() => {
    if (location.pathname.startsWith('/paiement')) return 'Paiement';
    if (location.pathname.startsWith('/pay')) return 'Validation de paiement';
    const found = navPages.find((p) => isPageActive(p.path));
    return found ? found.label : 'Navigation';
  })();

  return (
    <nav
      aria-label="Navigateur de pages"
      className={
        isHome
          ? 'absolute top-20 sm:top-24 left-0 right-0 z-30 bg-[#2B1204]/60 backdrop-blur-sm border-b border-[#F8BE40]/25'
          : 'w-full bg-[#FDF8F2] border-b border-[#F6C58E]/70 shadow-2xs'
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Fil d'Ariane rapide */}
        <div
          className={`flex items-center gap-1.5 text-[11px] font-bold shrink-0 ${
            isHome ? 'text-[#FDF8F2]/85' : 'text-[#2B1204]/70'
          }`}
        >
          <Link
            to="/"
            className={`inline-flex items-center gap-1 transition ${
              isHome ? 'hover:text-[#F8BE40]' : 'hover:text-[#C20A0A]'
            }`}
          >
            <HomeIcon size={12} />
            <span>Accueil</span>
          </Link>
          {!isHome && (
            <>
              <ChevronRight size={12} className="opacity-60" />
              <span className="text-[#C20A0A] font-extrabold">{currentPageLabel}</span>
            </>
          )}
        </div>

        {/* Liens pilules rapides entre toutes les pages */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {navPages.map((page) => {
            const active = isPageActive(page.path);
            return (
              <Link
                key={page.path}
                to={page.path}
                className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                  active
                    ? 'bg-[#F8BE40] text-[#2B1204] border-[#F8BE40] shadow-xs font-extrabold'
                    : isHome
                      ? 'bg-white/10 text-[#FDF8F2] border-white/20 hover:border-[#F8BE40] hover:text-[#F8BE40]'
                      : 'bg-white text-[#2B1204] border-[#F6C58E] hover:border-[#F8BE40] hover:bg-[#FDF6EC]'
                }`}
              >
                {page.label}
                {page.path === '/panier' && totalItems > 0 ? ` (${totalItems})` : ''}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

