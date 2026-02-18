/**
 * API 엔드포인트 설정 (SSOT)
 *
 * 모든 프론트엔드 코드는 이 파일에서 백엔드 URL을 import합니다.
 * ❌ 금지: 파일 내부에서 직접 `process.env.NEXT_PUBLIC_API_URL` 참조
 * ✅ 허용: `import { API_BASE_URL } from '@/lib/config/api-config'`
 *
 * 환경변수:
 * - NEXT_PUBLIC_API_URL: 백엔드 호스트 (예: http://localhost:3001)
 *   - '/api' 접미사 포함 금지 — 각 API 클라이언트가 경로를 결합
 *   - 미설정 시 개발 기본값으로 폴백
 *
 * 크로스 사이트 워크플로우:
 * - 클라이언트 컴포넌트: NEXT_PUBLIC_API_URL (빌드 시 인라인)
 * - 서버 컴포넌트: 동일 변수 (서버 런타임 환경변수)
 * - NextAuth 콜백: 동일 변수 (Node.js 환경)
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
