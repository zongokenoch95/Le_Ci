import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { openCart, totalItems } = useCart();

  const isHome = location.pathname === '/';

  const navItems = [
    { name: 'Accueil', path: '/' },
    { name: 'Nos Créations', path: '/catalogue' },
    { name: 'Sur Commande', path: '/sur-commande' },
    { name: 'Fidélisation', path: '/fidelite' },
    { name: 'À propos', path: '/a-propos' },
    { name: 'Contact', path: '/contact' },
    { name: 'Administration', path: '/admin' },
  ];

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Banner */}
      <div className={`w-full text-xs font-semibold py-2 px-4 transition-colors duration-300 z-50 ${
        isHome
          ? (scrolled ? 'bg-black/80 text-[#D4AF37] border-b border-white/10' : 'bg-black/40 backdrop-blur-sm text-white/90 border-b border-white/10')
          : 'bg-[#FAF8F5] text-gray-700 border-b border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="mx-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Paiement direct & instantané sans commission via <strong>Orange Money</strong></span>
          </p>
        </div>
      </div>

      {/* Main Header */}
      <header className={`w-full transition-all duration-300 z-40 ${
        isHome
          ? (scrolled 
              ? 'sticky top-0 bg-[#111827]/95 backdrop-blur-md shadow-xl text-white border-b border-[#D4AF37]/20' 
              : 'absolute top-9 left-0 bg-gradient-to-b from-black/60 to-transparent text-white')
          : 'sticky top-0 bg-white/95 backdrop-blur-md shadow-sm text-gray-900 border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24">
            
            {/* Logo uniquement (sans le nom devant) */}
            <Link to="/" className="flex items-center group py-1" title="Les Douceurs de Lê Ci">
              <img
                src="/logo.png"
                alt="Logo Les Douceurs de Lê Ci"
                className="h-16 sm:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-md"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-7">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-semibold tracking-wide transition-all duration-200 relative py-1 ${
                    isActive(item.path)
                      ? 'text-[#D4AF37]'
                      : (isHome && !scrolled ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900')
                  }`}
                >
                  {item.name}
                  {isActive(item.path) && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] rounded-full" />
                  )}
                </Link>
              ))}

              {/* Bouton Panier */}
              <button
                onClick={openCart}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-md ${
                  isHome && !scrolled
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    : 'bg-[#111827] hover:bg-black text-white'
                }`}
                aria-label="Voir mon panier"
              >
                <ShoppingBag size={17} className="text-[#D4AF37]" />
                <span>Panier</span>
                {totalItems > 0 && (
                  <span className="ml-1 bg-[#D4AF37] text-white text-[11px] font-black rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center animate-bounce">
                    {totalItems}
                  </span>
                )}
              </button>

              <Link
                to="/catalogue"
                className="px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md bg-[#D4AF37] hover:bg-[#c29d2b] text-white"
              >
                Commander
              </Link>
            </nav>

            {/* Actions Mobiles : Panier + Menu Burger */}
            <div className="flex md:hidden items-center gap-3">
              <button
                onClick={openCart}
                className={`relative p-2 rounded-xl transition ${
                  isHome && !scrolled ? 'text-white' : 'text-gray-900'
                }`}
                aria-label="Voir mon panier"
              >
                <ShoppingBag size={24} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                className={`p-2 rounded-xl transition ${
                  isHome && !scrolled ? 'text-white' : 'text-gray-900'
                }`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#111827] text-white border-t border-white/10 px-6 py-6 shadow-2xl">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-base font-semibold py-2 transition ${
                    isActive(item.path) ? 'text-[#D4AF37]' : 'text-gray-300 hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCart();
                  }}
                  className="w-full text-center py-3 rounded-xl bg-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/10"
                >
                  <ShoppingBag size={18} className="text-[#D4AF37]" />
                  <span>Mon Panier ({totalItems} articles)</span>
                </button>
                <Link
                  to="/catalogue"
                  className="w-full text-center py-3 rounded-xl bg-[#D4AF37] text-white font-bold text-sm shadow-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Explorer le Catalogue
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
