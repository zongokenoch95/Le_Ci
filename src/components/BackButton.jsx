import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Bouton Retour réutilisable revenant strictement à la page précédente de l'historique.
 * Automatiquement masqué sur la page d'accueil ('/').
 */
export function BackButton({ className = '' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (pathname === '/') {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F8BE40]/20 text-[#2B1204] border border-[#F6C58E] text-xs font-extrabold shadow-xs transition cursor-pointer shrink-0 ${className}`}
    >
      <ArrowLeft size={14} strokeWidth={2.5} />
      <span>Retour</span>
    </button>
  );
}

export default BackButton;
