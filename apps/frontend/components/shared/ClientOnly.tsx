'use client';

import { useState, useEffect, type ReactNode } from 'react';

interface ClientOnlyProps {
  /**
   * 클라이언트에서만 렌더링할 컨텐츠
   */
  children: ReactNode;

  /**
   * 서버 렌더링 중 또는 마운트 전에 표시할 fallback
   * @default null
   */
  fallback?: ReactNode;
}

/**
 * ClientOnly 컴포넌트
 *
 * **목적**:
 * - Radix UI 등 자동 ID 생성 컴포넌트의 hydration mismatch 방지
 * - 서버에서는 fallback(skeleton 등)만 렌더링
 * - 클라이언트 마운트 후 실제 interactive 컴포넌트 렌더링
 *
 * **사용 예시**:
 * ```tsx
 * <ClientOnly fallback={<EquipmentListSkeleton />}>
 *   <EquipmentListContent initialData={data} />
 * </ClientOnly>
 * ```
 *
 * **Best Practice (Vercel/React 19)**:
 * - Interactive 컴포넌트를 client-side에서만 렌더링
 * - SEO를 위해 fallback에 의미 있는 skeleton 제공
 * - Server Component에서 데이터 fetch, Client Component에서 UI 렌더링
 *
 * @see https://react.dev/link/hydration-mismatch
 * @see https://nextjs.org/docs/messages/react-hydration-error
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 서버 렌더링 중이거나 아직 마운트되지 않은 경우 fallback 표시
  if (!mounted) {
    return <>{fallback}</>;
  }

  // 클라이언트 마운트 완료 후 실제 컨텐츠 렌더링
  return <>{children}</>;
}
