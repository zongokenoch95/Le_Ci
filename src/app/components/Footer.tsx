import { Facebook, Instagram, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#2B1204] text-[#FDF8F2] mt-20 border-t-4 border-[#F8BE40] shadow-2xl">
      {/* Liseré chromatique de la Charte Graphique Les Douceurs de Lê-Ci */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#2B1204]" />
        <div className="flex-1 bg-[#F8BE40]" />
        <div className="flex-1 bg-[#C20A0A]" />
        <div className="flex-1 bg-[#EE7362]" />
        <div className="flex-1 bg-[#F6C58E]" />
        <div className="flex-1 bg-[#5DBA68]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Partie Contact & Commandes avec les 3 réseaux sociaux au même niveau et même aspect */}
        <div className="flex flex-col items-center text-center space-y-6">
          
          <h4 className="text-sm uppercase tracking-widest font-extrabold text-[#F8BE40]">
            Contact & Commandes
          </h4>

          {/* Coordonnées de contact directes */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-[#F6C58E]">
            <a
              href="tel:+22670000001"
              className="flex items-center gap-2 hover:text-[#F8BE40] transition font-medium"
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Phone size={15} className="text-[#F8BE40]" />
              </div>
              <span>+226 70 00 00 01</span>
            </a>

            <a
              href="mailto:contact@lesdouceursdeleci.com"
              className="flex items-center gap-2 hover:text-[#F8BE40] transition"
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Mail size={15} className="text-[#F8BE40]" />
              </div>
              <span>contact@lesdouceursdeleci.com</span>
            </a>

            <a
              href="https://maps.app.goo.gl/RewzGk5Cqdiy5Q576?g_st=aw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[#F8BE40] transition"
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <MapPin size={15} className="text-[#F8BE40]" />
              </div>
              <span>Les Douceurs de Lê-Ci, 01BP 6131, Ouagadougou</span>
            </a>
          </div>

          {/* Les 3 boutons des réseaux sociaux avec le même aspect */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Page Facebook"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#F8BE40] text-white hover:text-[#2B1204] flex items-center justify-center transition cursor-pointer shadow-sm hover:scale-105"
            >
              <Facebook size={18} />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Compte Instagram"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#C20A0A] text-white flex items-center justify-center transition cursor-pointer shadow-sm hover:scale-105"
            >
              <Instagram size={18} />
            </a>

            <a
              href="https://wa.me/22670000001"
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp direct"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#5DBA68] text-white flex items-center justify-center transition cursor-pointer shadow-sm hover:scale-105"
            >
              <MessageCircle size={18} />
            </a>
          </div>

        </div>

        {/* Ligne Copyright & Espace Gestionnaire */}
        <div className="border-t border-[#F6C58E]/20 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-[#F6C58E]/60 font-light">
          <p>© 2026 Les Douceurs de Lê-Ci. Tous droits réservés.</p>
          <Link to="/admin/login" className="text-[#F6C58E]/50 hover:text-[#F8BE40] transition text-[11px]">
            Espace Gestionnaire
          </Link>
        </div>
      </div>
    </footer>
  );
}
