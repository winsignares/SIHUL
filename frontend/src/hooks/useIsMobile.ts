import { useEffect, useState } from 'react';

/**
 * Hook que detecta si el dispositivo es móvil
 * Retorna true si el ancho de la pantalla es menor a 768px (breakpoint md de Tailwind)
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    // SSR-safe default
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
