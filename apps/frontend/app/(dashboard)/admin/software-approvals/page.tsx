/**
 * 소프트웨어 승인 관리 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component 경계가 Turbopack의 코드 분할 포인트로 작용
 * - Client bundle 분리를 통해 컴파일 성능 개선
 */

import SoftwareApprovalsContent from './SoftwareApprovalsContent';

export default function SoftwareApprovalsPage() {
  return <SoftwareApprovalsContent />;
}
