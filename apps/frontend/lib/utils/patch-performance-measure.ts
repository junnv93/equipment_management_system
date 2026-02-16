import {
  isPerformanceMeasureError,
  isDevelopmentEnvironment,
  isBrowserEnvironment,
} from './performance-errors';

/**
 * Next.js 16 PPR + Turbopack Performance.measure 버그 패치 (아키텍처 개선)
 *
 * ## 문제 분석
 *
 * **근본 원인:**
 * Next.js 16 Turbopack의 `flushComponentPerformance()`가 PPR 컴포넌트 측정 시
 * 음수 startTime으로 `performance.measure()` 호출.
 *
 * **발생 조건:**
 * - Next.js 16 + Turbopack 개발 모드
 * - PPR (Partial Prerendering) 활성화
 * - React Strict Mode 이중 렌더링 + HMR 타이밍 충돌
 *
 * **영향 범위:**
 * - 개발 환경 전용 (프로덕션 빌드 무영향)
 * - PPR async 함수 (SettingsPage, TeamListAsync 등)
 *
 * ## 아키텍처 개선 사항
 *
 * 1. **SSOT 에러 패턴** (`performance-errors.ts`)
 *    - 중앙화된 에러 감지 로직
 *    - 타입 안전한 에러 체크 (TypeError + DOMException)
 *    - 정규식 패턴 매칭 (하드코딩 제거)
 *
 * 2. **크로스 브라우저 호환**
 *    - Chrome/Edge: TypeError
 *    - Firefox/Safari: DOMException
 *
 * 3. **환경별 전략 분리**
 *    - 개발/프로덕션 체크 (`isDevelopmentEnvironment`)
 *    - 브라우저/서버 체크 (`isBrowserEnvironment`)
 *
 * ## 업스트림 추적
 *
 * @see {@link https://github.com/vercel/next.js/issues/86060}
 *
 * **제거 조건:** Next.js에서 수정되면 이 패치 전체 제거
 *
 * @returns void - 부작용만 있음 (performance.measure 전역 패치)
 */
export function patchPerformanceMeasure(): void {
  // 환경 검증: 개발 환경 + 브라우저에서만 실행
  if (!isDevelopmentEnvironment() || !isBrowserEnvironment()) {
    return;
  }

  // Performance.measure 존재 여부 확인
  if (typeof performance.measure !== 'function') {
    return;
  }

  const originalMeasure = performance.measure.bind(performance);

  /**
   * 패치된 Performance.measure (타입 안전, 에러 필터링)
   *
   * @param args - 원본 measure() 인자
   * @returns PerformanceMeasure 또는 noop measure
   * @throws 예상치 못한 에러만 재throw (PPR 에러는 무시)
   */
  performance.measure = function patchedMeasure(
    ...args: Parameters<typeof performance.measure>
  ): PerformanceMeasure {
    try {
      return originalMeasure(...args);
    } catch (error) {
      // SSOT 에러 패턴 매칭: PPR 관련 에러만 무시
      if (isPerformanceMeasureError(error)) {
        // 개발 환경에서만 경고 로그 (프로덕션 로그 오염 방지)
        if (process.env.NODE_ENV === 'development') {
          const measureName = args[0];
          console.debug(
            `[Performance Patch] PPR measure skipped: "${measureName}"`,
            error instanceof Error ? error.message : error
          );
        }

        // API 계약 유지: 빈 PerformanceMeasure 반환
        // Note: '__ppr_noop__' 마크는 존재하지 않지만 무시됨 (fallback)
        try {
          return originalMeasure('__ppr_noop__');
        } catch {
          // Noop measure도 실패하면 undefined 반환 (극히 드문 케이스)
          // TypeScript는 PerformanceMeasure 기대하지만 실제로는 무시됨
          return undefined as unknown as PerformanceMeasure;
        }
      }

      // 예상치 못한 에러는 재throw (디버깅 가능하도록)
      throw error;
    }
  };
}
