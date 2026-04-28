'use client';

import * as React from 'react';

/**
 * NavigationPendingContext — 글로벌 navigation pending 카운터 SSOT
 *
 * 역할:
 * - L1 NavLink(useLinkStatus)가 pending일 때 begin() 호출
 * - L3 useNavigateWithPending(router.push wrapper)이 transition 동안 begin()
 * - useNavigationPending() = (count > 0)을 GlobalProgressBar가 구독
 *
 * **카운터 vs boolean** — 동시 N개 transition 안전 (race 회피).
 *
 * Provider는 app/layout.tsx 1회 마운트.
 *
 * @see components/layout/global-progress-bar.tsx (구독자)
 * @see hooks/use-navigate-with-pending.ts (호출자)
 */
interface NavigationPendingState {
  count: number;
  begin: () => () => void;
}

const NavigationPendingContext = React.createContext<NavigationPendingState | null>(null);

export function NavigationPendingProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = React.useState(0);

  const begin = React.useCallback(() => {
    setCount((c) => c + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setCount((c) => Math.max(0, c - 1));
    };
  }, []);

  const value = React.useMemo<NavigationPendingState>(() => ({ count, begin }), [count, begin]);

  return (
    <NavigationPendingContext.Provider value={value}>{children}</NavigationPendingContext.Provider>
  );
}

/**
 * 글로벌 pending 여부 — GlobalProgressBar 등이 구독.
 * Provider 외부에서 호출하면 false 반환 (안전한 default).
 */
export function useNavigationPending(): boolean {
  const ctx = React.useContext(NavigationPendingContext);
  return (ctx?.count ?? 0) > 0;
}

/**
 * pending 카운터 manipulator — NavLink/useNavigateWithPending에서 사용.
 * Provider 외부 호출 시 noop cleanup 반환.
 */
export function useNavigationPendingBegin(): () => () => void {
  const ctx = React.useContext(NavigationPendingContext);
  return ctx?.begin ?? (() => () => {});
}
