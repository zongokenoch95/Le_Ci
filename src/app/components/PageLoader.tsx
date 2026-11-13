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
        playPromise.catch(() => {
          // Lecture silencieuse gérée en fallback par le timer ci-dessous
        });
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
      aria-label="Chargement Les Douceurs de Lê-Ci"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FDF8F2] transition-opacity duration-500 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-sm sm:max-w-md px-6 flex flex-col items-center">
        <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border-2 border-[#F8BE40] bg-white shadow-2xl flex items-center justify-center">
          <video
            ref={videoRef}
            src="/img/loader.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="mt-5 font-fredoka text-xs sm:text-sm font-medium tracking-[0.2em] uppercase text-[#2B1204]/80">
          Les Douceurs de Lê-Ci
        </p>
      </div>
    </div>
  );
};

