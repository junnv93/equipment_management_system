/**
 * E2E 테스트 경로 변환 유틸리티
 *
 * API_ENDPOINTS는 `/api/` globalPrefix를 포함하지만,
 * createTestApp은 globalPrefix를 설정하지 않습니다.
 * 이 유틸리티가 해당 차이를 중앙화합니다.
 */
export const toTestPath = (apiPath: string): string => apiPath.replace(/^\/api/, '');
