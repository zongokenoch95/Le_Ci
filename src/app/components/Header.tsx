import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { openCart, totalItems } = useCart();

  const isHome = location.pathname === '/';

  // Navigation séparée : gauche et droite du logo centré
  const leftNavItems = [
    { name: 'Accueil', path: '/' },
    { name: 'Nos douceurs', path: '/nos-douceurs' },
  ];

  const rightNavItems = [
    { name: 'Gâteaux personnalisés', path: '/sur-commande' },
    { name: 'Carte de fidélité', path: '/fidelite' },
  ];

  const allNavItems = [...leftNavItems, ...rightNavItems];

  const isActive = (path: string) => {
    if (path === '/nos-douceurs' && (location.pathname === '/nos-douceurs' || location.pathname === '/catalogue')) {
      return true;
    }
    return location.pathname === path;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* BANDEAU LUMINEUX DE PROMOTION DÉFILANT (MARQUEE DROITE VERS GAUCHE) */}
      <div className="w-full bg-gradient-to-r from-black via-[#1a150c] to-black text-[#F8E7B4] border-b border-[#D4AF37]/30 py-2 overflow-hidden relative z-50 shadow-md">
        <div className="flex w-max animate-marquee space-x-12 whitespace-nowrap">
          <div className="flex items-center gap-8 text-xs font-extrabold uppercase tracking-widest text-[#F3E5AB] drop-shadow-[0_0_8px_rgba(212,175,55,0.7)]">
            <span className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#D4AF37] animate-pulse" />
              OFFRE EXCLUSIVE : -10% SUR VOTRE COMMANDE AVEC LE CODE « DOUCEUR10 »
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              PAIEMENT INSTANTANÉ SANS FRAIS VIA ORANGE MONEY
            </span>
            <span>•</span>
            <span>CRÉATIONS GOURMANDES ET GÂTEAUX FAITS MAIN À LA COMMANDE</span>
            <span>•</span>
            <span>LIVRAISON EXPRESS & RETRAIT DISPONIBLES À OUAGADOUGOU</span>
          </div>

          {/* Duplication pour boucle infinie fluide */}
          <div className="flex items-center gap-8 text-xs font-extrabold uppercase tracking-widest text-[#F3E5AB] drop-shadow-[0_0_8px_rgba(212,175,55,0.7)]">
            <span className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#D4AF37] animate-pulse" />
              OFFRE EXCLUSIVE : -10% SUR VOTRE COMMANDE AVEC LE CODE « DOUCEUR10 »
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              PAIEMENT INSTANTANÉ SANS FRAIS VIA ORANGE MONEY
            </span>
            <span>•</span>
            <span>CRÉATIONS GOURMANDES ET GÂTEAUX FAITS MAIN À LA COMMANDE</span>
            <span>•</span>
            <span>LIVRAISON EXPRESS & RETRAIT DISPONIBLES À OUAGADOUGOU</span>
          </div>
        </div>
      </div>

      {/* HEADER PRINCIPAL AVEC LOGO CENTRÉ */}
      <header className={`w-full transition-all duration-300 z-40 ${
        isHome
          ? (scrolled 
              ? 'sticky top-0 bg-[#111827]/95 backdrop-blur-md shadow-xl text-white border-b border-[#D4AF37]/20' 
              : 'absolute top-9 left-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent text-white')
          : 'sticky top-0 bg-white/95 backdrop-blur-md shadow-sm text-gray-900 border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-between items-center h-20 sm:h-24">
            
            {/* ========================================================= */}
            {/* DISPOSITION MOBILE : Burger à gauche, Logo centré, Panier à droite */}
            {/* ========================================================= */}
            <div className="flex md:hidden items-center">
              <button
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isHome && !scrolled ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>

            {/* Logo Mobile (Centré absolument) */}
            <div className="flex md:hidden absolute left-1/2 -translate-x-1/2">
              <Link to="/" className="flex items-center py-1" title="Les Douceurs de Lê Ci">
                <img
                  src="/logo.png"
                  alt="Logo Les Douceurs de Lê Ci"
                  className="h-14 w-auto object-contain drop-shadow-md"
                />
              </Link>
            </div>

            <div className="flex md:hidden items-center">
              <button
                onClick={openCart}
                className={`relative p-2 rounded-xl transition cursor-pointer ${
                  isHome && !scrolled ? 'text-white' : 'text-gray-900'
                }`}
                aria-label="Voir mon panier"
              >
                <ShoppingBag size={24} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

            {/* ========================================================= */}
            {/* DISPOSITION DESKTOP : GAUCHE (2 liens) | LOGO CENTRÉ | DROITE (2 liens + Panier + Bouton) */}
            {/* ========================================================= */}

            {/* Liens de Gauche Desktop : Accueil & Nos douceurs */}
            <nav className="hidden md:flex items-center gap-8 flex-1 justify-end pr-10">
              {leftNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-bold tracking-wide transition-all duration-200 relative py-1 ${
                    isActive(item.path)
                      ? 'text-[#D4AF37]'
                      : (isHome && !scrolled ? 'text-white hover:text-[#D4AF37]' : 'text-gray-700 hover:text-[#D4AF37]')
                  }`}
                >
                  {item.name}
                  {isActive(item.path) && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] rounded-full shadow-[0_0_8px_#D4AF37]" />
                  )}
                </Link>
              ))}
            </nav>

            {/* LOGO CENTRÉ DESKTOP */}
            <div className="hidden md:flex shrink-0 px-2">
              <Link to="/" className="flex items-center group py-1" title="Les Douceurs de Lê Ci - Accueil">
                <img
                  src="/logo.png"
                  alt="Logo Les Douceurs de Lê Ci"
                  className="h-16 sm:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-lg"
                />
              </Link>
            </div>

            {/* Liens de Droite Desktop : Gâteaux personnalisés & Carte de fidélité + Panier + Bouton Commander une douceur */}
            <div className="hidden md:flex items-center gap-8 flex-1 justify-start pl-10">
              <nav className="flex items-center gap-7">
                {rightNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm font-bold tracking-wide transition-all duration-200 relative py-1 ${
                      isActive(item.path)
                        ? 'text-[#D4AF37]'
                        : (isHome && !scrolled ? 'text-white hover:text-[#D4AF37]' : 'text-gray-700 hover:text-[#D4AF37]')
                    }`}
                  >
                    {item.name}
                    {isActive(item.path) && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] rounded-full shadow-[0_0_8px_#D4AF37]" />
                    )}
                  </Link>
                ))}
              </nav>

              {/* Bouton Panier */}
              <button
                onClick={openCart}
                className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isHome && !scrolled
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    : 'bg-[#111827] hover:bg-black text-white'
                }`}
                aria-label="Voir mon panier"
              >
                <ShoppingBag size={16} className="text-[#D4AF37]" />
                <span>Panier</span>
                {totalItems > 0 && (
                  <span className="ml-1 bg-[#D4AF37] text-white text-[11px] font-black rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center animate-bounce">
                    {totalItems}
                  </span>
                )}
              </button>

              
            </div>
          </div>
        </div>

        {/* Menu Mobile Déroulant */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#111827] text-white border-t border-white/10 px-6 py-6 shadow-2xl animate-fade-in">
            <nav className="flex flex-col gap-4">
              {allNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-base font-bold py-2 transition ${
                    isActive(item.path) ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="pt-3 flex flex-col gap-2.5 border-t border-white/10">
                

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCart();
                  }}
                  className="w-full text-center py-3 rounded-2xl bg-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/10"
                >
                  <ShoppingBag size={18} className="text-[#D4AF37]" />
                  <span>Mon Panier ({totalItems} articles)</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
