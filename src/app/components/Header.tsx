import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getAnnouncementBanner, AnnouncementBanner } from '../services/api';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [banner, setBanner] = useState<AnnouncementBanner | null>(null);
  const location = useLocation();
  const { openCart, totalItems } = useCart();

  const isHome = location.pathname === '/';

  // Navigation séparée selon demande utilisateur :
  // Gauche : Accueil, Nos douceurs, Gâteaux sur mesure
  // Droite : Carte de fidélité, À propos, + Bouton Panier
  const leftNavItems = [
    { name: 'Accueil', path: '/' },
    { name: 'Nos douceurs', path: '/nos-douceurs' },
    { name: 'Gâteaux sur mesure', path: '/sur-commande' },
  ];

  const rightNavItems = [
    { name: 'Carte de fidélité', path: '/fidelite' },
    { name: 'À propos', path: '/a-propos' },
  ];

  const allNavItems = [...leftNavItems, ...rightNavItems];

  const isActive = (path: string) => {
    if (path === '/nos-douceurs' && (location.pathname === '/nos-douceurs' || location.pathname === '/catalogue' || location.pathname === '/nos-produits')) {
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

  // Chargement du bandeau paramétrable
  useEffect(() => {
    getAnnouncementBanner()
      .then((data) => {
        if (data && data.success) {
          setBanner(data);
        }
      })
      .catch((err) => {
        console.warn('Utilisation du bandeau par défaut', err);
      });
  }, []);

  const bannerText = banner?.message || '✦ OFFRE SPÉCIALE : -10% sur votre commande avec le code « DOUCEUR10 » ✦ Inscription fidélité offerte dès aujourd\'hui ✦ Livraison soignée à domicile ✦';
  const bannerTextColor = banner?.text_color || '#FFFFFF';
  const bannerBgColor = banner?.bg_color || '#3B0764';
  const showBanner = banner ? (banner.is_currently_visible !== false && banner.is_active !== false) : true;

  return (
    <>
      {/* BANDEAU LUMINEUX DE PROMOTION DÉFILANT (PARAMÉTRABLE CÔTÉ GÉRANT) */}
      {showBanner && (
        <div
          className="w-full overflow-hidden text-xs py-2 shadow-inner z-50 select-none border-b border-white/10"
          style={{ backgroundColor: bannerBgColor, color: bannerTextColor }}
        >
          <div className="animate-marquee whitespace-nowrap flex items-center gap-10 font-bold uppercase tracking-wider text-[11px]">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-purple-300 animate-spin" /> {bannerText}</span>
              <span>•</span>
              <span>DES DOUCEURS SAINES & ARTISANALES FAITES AVEC AMOUR</span>
              <span>•</span>
              <span>PAIEMENT INSTANTANÉ ORANGE MONEY SANS FRAIS</span>
              <span>•</span>
              <span>LIVRAISON EXPRESS & RETRAIT DISPONIBLES</span>
            </div>
            <div className="flex items-center gap-6" aria-hidden="true">
              <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-purple-300 animate-spin" /> {bannerText}</span>
              <span>•</span>
              <span>DES DOUCEURS SAINES & ARTISANALES FAITES AVEC AMOUR</span>
              <span>•</span>
              <span>PAIEMENT INSTANTANÉ ORANGE MONEY SANS FRAIS</span>
              <span>•</span>
              <span>LIVRAISON EXPRESS & RETRAIT DISPONIBLES</span>
            </div>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL AVEC LOGO CENTRÉ */}
      {/* Quand on scroll : passe en violet #581C87 avec texte en blanc pur */}
      <header className={`w-full transition-all duration-300 z-40 ${
        isHome
          ? (scrolled 
              ? 'sticky top-0 bg-[#581C87] shadow-xl text-white border-b border-purple-900/40 backdrop-blur-md' 
              : 'absolute top-9 left-0 bg-gradient-to-b from-black/75 via-black/40 to-transparent text-white')
          : (scrolled
              ? 'sticky top-0 bg-[#581C87] shadow-xl text-white border-b border-purple-900/40'
              : 'sticky top-0 bg-[#581C87] shadow-md text-white border-b border-purple-800')
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-between items-center h-20 sm:h-24">
            
            {/* ========================================================= */}
            {/* DISPOSITION MOBILE : Burger à gauche, Logo centré, Panier à droite */}
            {/* ========================================================= */}
            <div className="flex md:hidden items-center">
              <button
                className="p-2 rounded-xl transition cursor-pointer text-white hover:bg-white/10"
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
                className="relative p-2 rounded-xl transition cursor-pointer text-white hover:bg-white/10"
                aria-label="Voir mon panier"
              >
                <ShoppingBag size={24} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center shadow">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

            {/* ========================================================= */}
            {/* DISPOSITION DESKTOP : GAUCHE (3 liens) | LOGO CENTRÉ | DROITE (2 liens + Panier) */}
            {/* ========================================================= */}

            {/* Liens de Gauche Desktop : Accueil, Nos douceurs, Gâteaux sur mesure */}
            <nav className="hidden md:flex items-center gap-7 flex-1 justify-end pr-10">
              {leftNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-bold tracking-wide transition-all duration-200 relative py-1 ${
                    isActive(item.path)
                      ? 'text-purple-200 font-extrabold'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {item.name}
                  {isActive(item.path) && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-300 rounded-full shadow-[0_0_8px_#C084FC]" />
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

            {/* Liens de Droite Desktop : Carte de fidélité, À propos + Bouton Panier */}
            <div className="hidden md:flex items-center gap-7 flex-1 justify-start pl-10">
              <nav className="flex items-center gap-7">
                {rightNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm font-bold tracking-wide transition-all duration-200 relative py-1 ${
                      isActive(item.path)
                        ? 'text-purple-200 font-extrabold'
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    {item.name}
                    {isActive(item.path) && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-300 rounded-full shadow-[0_0_8px_#C084FC]" />
                    )}
                  </Link>
                ))}
              </nav>

              {/* Bouton Panier */}
              <button
                onClick={openCart}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer bg-white/15 hover:bg-white/25 text-white border border-white/25 active:scale-95"
                aria-label="Voir mon panier"
              >
                <ShoppingBag size={16} className="text-purple-300" />
                <span>Panier</span>
                {totalItems > 0 && (
                  <span className="ml-1 bg-purple-400 text-purple-950 text-[11px] font-black rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center animate-bounce">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile Déroulant */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#3B0764] text-white border-t border-purple-800 px-6 py-6 shadow-2xl animate-fade-in">
            <nav className="flex flex-col gap-4">
              {allNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-base font-bold py-2 transition ${
                    isActive(item.path) ? 'text-purple-200' : 'text-gray-200 hover:text-white'
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
                  className="w-full text-center py-3 rounded-2xl bg-white/15 text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/20 cursor-pointer"
                >
                  <ShoppingBag size={18} className="text-purple-300" />
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
