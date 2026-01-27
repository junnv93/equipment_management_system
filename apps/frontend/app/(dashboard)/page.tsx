import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import DashboardLoading from './loading';

/**
 * 대시보드 페이지 (Server Component)
 *
 * Next.js 16 App Router Best Practice:
 * - Server Component에서 초기 데이터를 fetch (선택적)
 * - Client Component(DashboardClient)로 데이터 전달
 * - Suspense로 로딩 상태 처리
 *
 * 성능 최적화:
 * - 서버에서 초기 렌더링으로 FCP 개선
 * - 클라이언트에서 hydration 후 상호작용
 *
 * 참고:
 * - Server Component에서 세션 접근이 복잡하므로 초기 데이터 fetch는 선택적
 * - 클라이언트에서 React Query로 데이터 관리하는 것도 유효한 패턴
 */
export default function DashboardPage() {
  // 방법 1: Server Component에서 초기 데이터 fetch (세션 필요 시 복잡)
  // 방법 2: Client Component에서 React Query로 데이터 관리 (현재 선택)
  //
  // 현재는 방법 2를 사용합니다.
  // - DashboardClient가 useSession으로 역할 확인
  // - React Query로 역할별 데이터 fetch
  // - 실시간 WebSocket 업데이트 처리

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient />
    </Suspense>
  );
}

// 메타데이터
export const metadata = {
  title: '대시보드 | 장비 관리 시스템',
  description: '역할별 맞춤형 대시보드 - 장비 현황, 승인 대기, 교정 일정 확인',
};
