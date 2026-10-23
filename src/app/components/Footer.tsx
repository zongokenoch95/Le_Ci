import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#3B0764] text-white mt-20 border-t border-purple-800/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* About */}
          <div className="col-span-1 space-y-4">
            <Link to="/" className="inline-block">
              <img src="/logo.png" alt="Les Douceurs de Lê Ci" className="h-16 w-auto object-contain drop-shadow" />
            </Link>
            <p className="font-barcelony text-xl text-purple-200">
              La croisée entre la santé consciente, le plaisir gourmand et la fierté locale.
            </p>
            <p className="text-xs text-purple-200/80 leading-relaxed font-light">
              Douceurs sucrées et salées faites main, gâteaux sur mesure et créations d'exception avec paiement direct Orange Money.
            </p>
          </div>

          {/* Navigation */}
          <div className="col-span-1">
            <h4 className="text-xs uppercase tracking-widest font-bold mb-4 text-purple-300">Navigation</h4>
            <ul className="space-y-2.5 text-xs text-purple-100/90">
              <li><Link to="/" className="hover:text-white transition">Accueil</Link></li>
              <li><Link to="/nos-douceurs" className="hover:text-white transition">Nos douceurs</Link></li>
              <li><Link to="/sur-commande" className="hover:text-white transition">Gâteaux sur mesure</Link></li>
              <li><Link to="/fidelite" className="hover:text-white transition">Carte de fidélité</Link></li>
              <li><Link to="/a-propos" className="hover:text-white transition">À propos</Link></li>
              <li><Link to="/admin/login" className="text-purple-300/60 hover:text-purple-200 transition">Accès Gestionnaire</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h4 className="text-xs uppercase tracking-widest font-bold mb-4 text-purple-300">Contact & Commandes</h4>
            <ul className="space-y-3 text-xs text-purple-100/90">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-purple-300" />
                <span>+226 70 00 00 01</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-purple-300" />
                <span>contact@lesdouceursdeleci.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-purple-300" />
                <span>Ouagadougou, Burkina Faso</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="col-span-1">
            <h4 className="text-xs uppercase tracking-widest font-bold mb-4 text-purple-300">Suivez Lê Ci</h4>
            <div className="flex gap-3 mb-4">
              <a href="#" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-purple-600 flex items-center justify-center transition cursor-pointer">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-purple-600 flex items-center justify-center transition cursor-pointer">
                <Instagram size={16} />
              </a>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-900/40 border border-purple-700/40 text-[11px] text-purple-200 leading-relaxed font-light">
              ✦ Préparé avec amour à base d'ingrédients frais et locaux.
            </div>
          </div>
        </div>

        <div className="border-t border-purple-800/40 mt-12 pt-8 text-center text-xs text-purple-300/60 font-light">
          <p>© 2026 Les Douceurs de Lê Ci. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
