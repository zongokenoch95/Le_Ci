import { Facebook, Instagram, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#3B0764] text-white mt-20 border-t border-purple-800/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          
          {/* Logo & Description */}
          <div className="space-y-4">
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

          {/* Contact & Commandes (Notion #19 : conservé uniquement Contact & Commandes et Réseaux) */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-4 text-purple-300">Contact & Commandes</h4>
            <ul className="space-y-3.5 text-xs text-purple-100/90">
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Phone size={14} className="text-purple-300" />
                </div>
                <a href="tel:+22670000001" className="hover:text-white transition font-medium">
                  +226 70 00 00 01
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Mail size={14} className="text-purple-300" />
                </div>
                <a href="mailto:contact@lesdouceursdeleci.com" className="hover:text-white transition">
                  contact@lesdouceursdeleci.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <MapPin size={14} className="text-purple-300" />
                </div>
                <span>Atelier Lê Ci, Ouagadougou, Burkina Faso</span>
              </li>
            </ul>
          </div>

          {/* Réseaux sociaux & Bouton WhatsApp au même niveau (Notion #19) */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-4 text-purple-300">Suivez Lê Ci & Échangez</h4>
            <p className="text-xs text-purple-200/80 mb-4 font-light">
              Rejoignez notre communauté gourmande ou contactez-nous directement en temps réel :
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-6">
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

              {/* Bouton WhatsApp au même niveau que les réseaux (Notion #19) */}
              <a
                href="https://wa.me/22670000001"
                target="_blank"
                rel="noopener noreferrer"
                title="Commander sur WhatsApp"
                className="px-4 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center gap-2 text-xs font-bold transition cursor-pointer shadow-lg hover:scale-105"
              >
                <MessageCircle size={18} />
                <span>WhatsApp</span>
              </a>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-900/40 border border-purple-700/40 text-[11px] text-purple-200 leading-relaxed font-light">
              ✦ Confection artisanale fraîche & livraison sécurisée.
            </div>
          </div>
        </div>

        <div className="border-t border-purple-800/40 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-purple-300/60 font-light">
          <p>© 2026 Les Douceurs de Lê Ci. Tous droits réservés.</p>
          <Link to="/admin/login" className="text-purple-400/50 hover:text-purple-300 transition text-[11px]">
            Espace Gestionnaire
          </Link>
        </div>
      </div>
    </footer>
  );
}
