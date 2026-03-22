/**
 * 소프트웨어 관리 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component 경계가 Turbopack의 코드 분할 포인트로 작용
 * - Client bundle 분리를 통해 컴파일 성능 개선
 *
 * 역할별 데이터 스코핑:
 * - 백엔드 @SiteScoped 데코레이터가 JWT 기반으로 자동 필터링 (SSOT)
 * - URL 기반 buildRoleBasedRedirectUrl은 사용하지 않음
 *   (SoftwareContent가 URL 파라미터로 site/teamId를 소비하지 않으므로)
 */

import SoftwareContent from './SoftwareContent';

export default function SoftwarePage() {
  return <SoftwareContent />;
}
