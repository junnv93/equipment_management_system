/**
 * 인증 관련 유틸리티 함수
 */

/**
 * URL이 안전한 콜백 URL인지 확인
 * 외부 URL로의 리다이렉트를 방지
 */
export function isValidCallbackUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  // 상대 경로는 항상 허용
  if (url.startsWith('/')) return true;

  try {
    const parsedUrl = new URL(url);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

    // localhost는 개발 환경에서 허용
    if (parsedUrl.hostname === 'localhost') return true;

    // 같은 origin만 허용
    if (currentOrigin && parsedUrl.origin === currentOrigin) return true;

    return false;
  } catch {
    // URL 파싱 실패 시 허용하지 않음
    return false;
  }
}

/**
 * 안전한 콜백 URL 반환
 * 유효하지 않은 URL은 기본값으로 대체
 */
export function getSafeCallbackUrl(
  url: string | null | undefined,
  defaultUrl: string = '/'
): string {
  if (isValidCallbackUrl(url)) {
    return url!;
  }
  return defaultUrl;
}
