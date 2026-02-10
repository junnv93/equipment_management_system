/**
 * 보고서 관리 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component 경계가 Turbopack의 코드 분할 포인트로 작용
 * - Client bundle 분리를 통해 컴파일 성능 개선
 *
 * 보고서 페이지는 초기 데이터 fetch가 불필요 (순수 폼 UI)
 */

import ReportsContent from './ReportsContent';

export default function ReportsPage() {
  return <ReportsContent />;
}
