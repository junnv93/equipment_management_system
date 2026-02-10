/**
 * 알림 센터 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component 경계가 Turbopack의 코드 분할 포인트로 작용
 * - Client bundle 분리를 통해 컴파일 성능 개선
 *
 * 현재 mock 데이터 사용 중 - 향후 API 연동 시 server-side fetch 추가 가능
 */

import AlertsContent from './AlertsContent';

export default function AlertsPage() {
  return <AlertsContent />;
}
