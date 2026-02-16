/**
 * Dashboard Layout (Server Component — Non-Blocking)
 *
 * cacheComponents + PPR 호환 아키텍처:
 * - DashboardShell(CSC)이 usePathname() + useSession() 사용 → 동적 데이터
 * - Suspense 경계로 감싸서 "dynamic hole"로 처리
 * - 빌드 시: DashboardShellSkeleton이 정적 셸로 프리렌더 (CDN 즉시 제공)
 * - 요청 시: DashboardShell이 스트리밍으로 교체
 *
 * 인증 가드: middleware.ts에서 처리 (렌더링 전 JWT 검증)
 */
import { Suspense } from 'react';
import { DashboardShell, DashboardShellSkeleton } from '@/components/layout/DashboardShell';
import '@/styles/accessibility.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
