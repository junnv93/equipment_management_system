'use client';

import { useState, useEffect } from 'react';

/**
 * 컴포넌트를 처음 활성화될 때만 마운트하고, 이후에는 유지하는 훅 (SSOT)
 *
 * ## 문제 해결
 * Dialog/Sheet/Drawer에서 `open && <HeavyContent />`를 사용하면 닫을 때마다
 * 컴포넌트가 언마운트되고 다시 열면 재마운트된다 (입력값 초기화, API 재요청).
 * 반면 항상 마운트하면 초기 번들에 포함되어 초기 로딩 비용이 증가한다.
 *
 * `useLazyMount`는 "처음 열릴 때 마운트, 이후 계속 마운트 유지" 패턴을 제공한다.
 * `next/dynamic` 또는 `React.lazy`와 조합하면 코드 스플리팅 효과도 얻을 수 있다.
 *
 * ## 사용 패턴
 * ```tsx
 * const LazyHeavyForm = dynamic(() => import('./HeavyForm'), {
 *   loading: () => <DialogSkeleton />,
 *   ssr: false,
 * });
 *
 * function EditDialog({ open, onOpenChange }) {
 *   const mounted = useLazyMount(open);
 *   return (
 *     <Dialog open={open} onOpenChange={onOpenChange}>
 *       <DialogContent>
 *         {mounted ? <LazyHeavyForm /> : <DialogSkeleton />}
 *       </DialogContent>
 *     </Dialog>
 *   );
 * }
 * ```
 *
 * @param active 처음으로 true가 될 때 마운트 시작
 * @returns true가 되면 영구적으로 true 유지
 */
export function useLazyMount(active: boolean): boolean {
  const [mounted, setMounted] = useState(active);

  useEffect(() => {
    if (active && !mounted) {
      setMounted(true);
    }
  }, [active, mounted]);

  return mounted;
}
