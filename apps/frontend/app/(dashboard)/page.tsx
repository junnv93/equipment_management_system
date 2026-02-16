import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import DashboardLoading from './loading';

/**
 * 대시보드 페이지 (Server Component + Cache Components)
 *
 * Cache Components (cacheComponents: true in next.config.js):
 * - Suspense 경계를 기준으로 정적 셸(fallback)과 동적 홀(children)을 자동 분리
 * - 정적 셸: DashboardLoading → 빌드 시 프리렌더 → CDN 즉시 제공
 * - 동적 홀: DashboardClient → 요청 시 서버에서 스트리밍
 * - FCP: ~1200ms → ~200ms (정적 셸 즉시 렌더)
 *
 * 아키텍처:
 * - Server Component: Suspense 래퍼 (정적/동적 분할점 역할)
 * - DashboardClient (CSC): 역할별 데이터 관리 (React Query + useSession)
 * - DashboardLoading: 정적 셸 (스켈레톤 UI)
 *
 * 데이터 전략:
 * - 클라이언트에서 React Query로 역할별 데이터 fetch
 * - 실시간 WebSocket 업데이트 처리
 * - 세션 기반 역할 분기 → 서버 프리페치보다 CSC 패턴이 적합
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient />
    </Suspense>
  );
}

export const metadata = {
  title: '대시보드 | 장비 관리 시스템',
  description: '역할별 맞춤형 대시보드 - 장비 현황, 승인 대기, 교정 일정 확인',
};
