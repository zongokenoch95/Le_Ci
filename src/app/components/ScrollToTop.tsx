import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Composant ScrollToTop
 * Réinitialise automatiquement le défilement de la fenêtre tout en haut (top: 0)
 * lors de chaque changement de page/route pour éviter que la page suivante ne commence par le footer.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Si l'URL ne contient pas d'ancre (#id), on remonte tout en haut
    if (!window.location.hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }
  }, [pathname, search]);

  return null;
}
