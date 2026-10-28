import { Facebook, Instagram, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#3B0764] text-white mt-20 border-t border-purple-800/50 shadow-2xl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Partie Contact & Commandes avec les 3 réseaux sociaux au même niveau et même aspect */}
        <div className="flex flex-col items-center text-center space-y-6">
          
          <h4 className="text-sm uppercase tracking-widest font-extrabold text-purple-200">
            Contact & Commandes
          </h4>

          {/* Coordonnées de contact directes */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-purple-100">
            <a
              href="tel:+22670000001"
              className="flex items-center gap-2 hover:text-white transition font-medium"
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Phone size={15} className="text-purple-300" />
              </div>
              <span>+226 70 00 00 01</span>
            </a>

            <a
              href="mailto:contact@lesdouceursdeleci.com"
              className="flex items-center gap-2 hover:text-white transition"
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Mail size={15} className="text-purple-300" />
              </div>
              <span>contact@lesdouceursdeleci.com</span>
            </a>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <MapPin size={15} className="text-purple-300" />
              </div>
              <span>Atelier Lê Ci, Ouagadougou, Burkina Faso</span>
            </div>
          </div>

          {/* Les 3 boutons des réseaux sociaux avec le même aspect (Notion 28/10/26) */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Page Facebook"
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-[#1877F2] text-white flex items-center justify-center transition cursor-pointer shadow-sm hover:scale-105"
            >
              <Facebook size={18} />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Compte Instagram"
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-white flex items-center justify-center transition cursor-pointer shadow-sm hover:scale-105"
            >
              <Instagram size={18} />
            </a>

            {/* Logo WhatsApp avec le même aspect que les autres logos */}
            <a
              href="https://wa.me/22670000001"
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp direct"
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-[#25D366] text-white flex items-center justify-center transition cursor-pointer shadow-sm hover:scale-105"
            >
              <MessageCircle size={18} />
            </a>
          </div>

        </div>

        {/* Ligne Copyright & Espace Gestionnaire */}
        <div className="border-t border-purple-800/40 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-purple-300/60 font-light">
          <p>© 2026 Les Douceurs de Lê Ci. Tous droits réservés.</p>
          <Link to="/admin/login" className="text-purple-400/50 hover:text-purple-300 transition text-[11px]">
            Espace Gestionnaire
          </Link>
        </div>
      </div>
    </footer>
  );
}
