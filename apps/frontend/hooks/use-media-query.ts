'use client';

import { useState, useEffect } from 'react';

/**
 * CSS 미디어 쿼리 매칭 훅
 *
 * SSR-safe: 서버에서는 false 반환, 클라이언트에서 hydration 후 실제 값 반영.
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 1280px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
