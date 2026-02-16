/**
 * Performance API 에러 패턴 SSOT
 *
 * Next.js 16 PPR + Turbopack 환경에서 발생하는 Performance.measure() 에러를
 * 일관되게 감지하고 처리하기 위한 중앙화된 에러 패턴 정의
 *
 * @see {@link https://github.com/vercel/next.js/issues/86060}
 */

/**
 * Performance.measure() 음수 타임스탬프 에러 패턴
 *
 * SSOT: 모든 Performance 관련 에러 감지에서 이 패턴 사용
 */
export const PERFORMANCE_ERROR_PATTERNS = {
  /**
   * 음수 타임스탬프 에러 메시지 패턴
   *
   * 발생 케이스:
   * - "cannot have a negative time stamp"
   * - "cannot have negative time stamp"
   * - "negative time stamp" (하위 호환)
   */
  NEGATIVE_TIMESTAMP: /negative time stamp/i,

  /**
   * 유효하지 않은 마크 에러
   *
   * PPR 컴포넌트가 unmount된 후 measure 시도 시 발생
   */
  INVALID_MARK: /mark .+ does not exist|mark .+ not found/i,
} as const;

/**
 * Performance.measure() 에러 타입 SSOT
 *
 * 브라우저별로 다른 에러 타입 반환:
 * - Chrome/Edge: TypeError
 * - Firefox/Safari: DOMException
 */
export const PERFORMANCE_ERROR_TYPES = ['TypeError', 'DOMException'] as const;

export type PerformanceErrorType = (typeof PERFORMANCE_ERROR_TYPES)[number];

/**
 * Performance.measure() 에러 여부 판별 (타입 안전)
 *
 * @param error - 에러 객체
 * @returns Performance.measure() 관련 에러 여부
 *
 * @example
 * try {
 *   performance.measure(...);
 * } catch (error) {
 *   if (isPerformanceMeasureError(error)) {
 *     // 안전하게 무시
 *   }
 * }
 */
export function isPerformanceMeasureError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // 타입 체크: TypeError 또는 DOMException
  const isValidType = PERFORMANCE_ERROR_TYPES.some((type) => error.name === type);
  if (!isValidType) return false;

  // 패턴 매칭: 음수 타임스탬프 또는 유효하지 않은 마크
  const message = error.message;
  return (
    PERFORMANCE_ERROR_PATTERNS.NEGATIVE_TIMESTAMP.test(message) ||
    PERFORMANCE_ERROR_PATTERNS.INVALID_MARK.test(message)
  );
}

/**
 * 개발 환경 여부 체크 (SSOT)
 *
 * Performance 패치는 개발 환경에서만 적용
 */
export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 브라우저 환경 여부 체크 (SSOT)
 *
 * Performance API는 브라우저에서만 사용 가능
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof performance !== 'undefined';
}
