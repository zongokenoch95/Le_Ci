import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const SEGMENT_LABELS = {
  'nos-douceurs': 'Nos douceurs',
  catalogue: 'Nos douceurs',
  'nos-produits': 'Nos douceurs',
  'sur-commande': 'Gâteaux sur mesure',
  fidelite: 'Mon compte',
  fidelisation: 'Mon compte',
  'a-propos': 'À propos',
  'mentions-legales': 'Mentions légales',
  panier: 'Panier',
  paiement: 'Paiement',
  pay: 'Paiement tiers',
  promotions: 'Promotions',
};

function formatSegmentLabel(segment) {
  const clean = decodeURIComponent(segment).trim();
  const mapped = SEGMENT_LABELS[clean.toLowerCase()];
  if (mapped) return mapped;

  const withSpaces = clean.replace(/-/g, ' ');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

/**
 * Fil d'Ariane dynamique basé sur l'URL courante.
 * Automatiquement masqué sur la page d'accueil ('/').
 */
export function Breadcrumbs({ className = '' }) {
  const { pathname } = useLocation();

  if (pathname === '/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={`flex items-center flex-wrap gap-1.5 text-xs text-[#2B1204]/70 min-w-0 ${className}`}
    >
      <Link
        to="/"
        className="font-semibold hover:text-[#C20A0A] transition-colors shrink-0"
      >
        Accueil
      </Link>

      {segments.map((segment, index) => {
        const to = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        const label = formatSegmentLabel(segment);

        return (
          <span key={to} className="inline-flex items-center gap-1.5 min-w-0">
            <ChevronRight size={14} className="text-[#2B1204]/40 shrink-0" aria-hidden="true" />
            {isLast ? (
              <span
                aria-current="page"
                className="font-bold text-[#2B1204] truncate max-w-[200px] sm:max-w-xs"
              >
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="font-semibold hover:text-[#C20A0A] transition-colors truncate max-w-[160px] sm:max-w-xs"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
