import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface PageLoaderProps {
  onComplete?: () => void;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, 1200);

    const hideTimer = window.setTimeout(() => {
      setHidden(true);
      onComplete?.();
    }, 1650);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [onComplete]);

  if (hidden) return null;

  return (
    <div
      aria-label="Chargement"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#FDF8F2] transition-opacity duration-500 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <motion.img
        src="/img/logo.png"
        alt="Les Douceurs de Lê-Ci"
        initial={{ opacity: 0.35, scale: 0.88 }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [0.94, 1.05, 0.94] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-36 h-36 sm:w-48 sm:h-48 object-contain select-none pointer-events-none"
      />
    </div>
  );
};
