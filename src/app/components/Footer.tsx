import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#111827] text-white mt-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* About */}
          <div className="col-span-1 space-y-4">
            <Link to="/" className="inline-block">
              <img src="/logo.png" alt="Les Douceurs de Lê Ci" className="h-16 w-auto object-contain drop-shadow" />
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong>Les Douceurs de Lê Ci</strong> — Douceurs sucrées et salées faites main, gâteaux de fête et créations d'exception avec validation automatique des paiements Orange Money.
            </p>
          </div>

          {/* Navigation */}
          <div className="col-span-1">
            <h4 className="text-xs uppercase tracking-widest font-bold mb-4 text-[#D4AF37]">Navigation</h4>
            <ul className="space-y-2.5 text-xs text-gray-300">
              <li><Link to="/" className="hover:text-white transition">Accueil</Link></li>
              <li><Link to="/nos-douceurs" className="hover:text-white transition">Nos douceurs</Link></li>
              <li><Link to="/sur-commande" className="hover:text-white transition">Gâteaux personnalisés</Link></li>
              <li><Link to="/fidelite" className="hover:text-white transition">Carte de fidélité</Link></li>
              <li><Link to="/admin/login" className="text-gray-500 hover:text-[#D4AF37] transition">Accès Gestionnaire</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h4 className="text-xs uppercase tracking-widest font-bold mb-4 text-[#D4AF37]">Contact & Commandes</h4>
            <ul className="space-y-3 text-xs text-gray-300">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[#D4AF37]" />
                <span>+226 70 00 00 01</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[#D4AF37]" />
                <span>contact@lesdouceursdeleci.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-[#D4AF37]" />
                <span>Ouagadougou, Burkina Faso</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="col-span-1">
            <h4 className="text-xs uppercase tracking-widest font-bold mb-4 text-[#D4AF37]">Suivez Lê Ci</h4>
            <div className="flex gap-3 mb-4">
              <a href="#" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#D4AF37] flex items-center justify-center transition">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#D4AF37] flex items-center justify-center transition">
                <Instagram size={16} />
              </a>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400">
              Paiements sécurisés sans frais intermédiaires.
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-xs text-gray-500">
          <p>© 2026 Les Douceurs de Lê Ci. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
