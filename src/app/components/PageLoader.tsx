import React, { useEffect, useRef, useState } from 'react';

interface PageLoaderProps {
  onComplete?: () => void;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.muted = true;
      videoEl.defaultMuted = true;
      videoEl.volume = 0;
      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    }

    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, 1800);

    const hideTimer = window.setTimeout(() => {
      setHidden(true);
      onComplete?.();
    }, 2300);

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
      <video
        ref={videoRef}
        src="/img/loader.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="w-56 h-56 sm:w-72 sm:h-72 object-contain pointer-events-none select-none"
      />
    </div>
  );
};
