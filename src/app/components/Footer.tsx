import { Facebook, Instagram, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="relative mt-20 text-[#FDF8F2]">
      {/* Vague décorative brun cacao en transition vers le footer */}
      <div className="w-full overflow-hidden leading-none bg-transparent">
        <svg
          viewBox="0 0 1440 70"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="w-full h-12 sm:h-16 block"
        >
          <path
            fill="#2B1204"
            d="M0 40C220 12 420 62 680 38C920 16 1140 52 1440 24V70H0Z"
          />
        </svg>
      </div>

      <div className="bg-[#2B1204]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          {/* Bloc central vertical inspiré de chezzazapatisserie.com */}
          <div className="flex flex-col items-center text-center space-y-5">
            <img
              src="/img/logo.png"
              alt="Les Douceurs de Lê-Ci"
              className="h-20 sm:h-24 w-auto object-contain select-none"
            />

            <div className="space-y-2 text-xs sm:text-sm text-[#F6C58E] leading-relaxed">
              <p className="font-bold text-[#FDF8F2] text-sm sm:text-base">
                Les Douceurs de Lê-Ci · Pâtisserie Fine &amp; Créations d’Exception
              </p>

              <p className="flex items-center justify-center gap-1.5">
                <MapPin size={14} className="text-[#F8BE40] shrink-0" />
                <a
                  href="https://maps.app.goo.gl/RewzGk5Cqdiy5Q576?g_st=aw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#F8BE40] transition"
                >
                  01BP 6131, Ouagadougou
                </a>
              </p>

              <p className="flex items-center justify-center gap-1.5">
                <Phone size={14} className="text-[#F8BE40] shrink-0" />
                <span>
                  Commandes WhatsApp &amp; Appel :{' '}
                  <a
                    href="https://wa.me/22670000001"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#FDF8F2] hover:text-[#F8BE40] transition"
                  >
                    +226 70 00 00 01
                  </a>
                </span>
              </p>

              <p className="flex items-center justify-center gap-1.5">
                <Mail size={14} className="text-[#F8BE40] shrink-0" />
                <a
                  href="mailto:contact@lesdouceursdeleci.com"
                  className="hover:text-[#F8BE40] transition"
                >
                  contact@lesdouceursdeleci.com
                </a>
              </p>

              <p className="text-xs text-[#F6C58E]/85 pt-1">
                Paiement : Orange Money, Moov Money, Wave ou espèces.
              </p>
            </div>

            {/* Réseaux sociaux */}
            <div className="flex items-center justify-center gap-4 pt-1">
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

            {/* Mentions légales & Copyright */}
            <div className="w-full border-t border-[#F6C58E]/20 pt-5 mt-2 flex flex-col items-center gap-2 text-xs text-[#F6C58E]/70">
              <Link to="/mentions-legales" className="hover:text-[#F8BE40] transition font-medium">
                Mentions légales
              </Link>
              <p className="text-[11px] text-[#F6C58E]/55">
                © 2026 Les Douceurs de Lê-Ci. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
