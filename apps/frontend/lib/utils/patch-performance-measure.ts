/**
 * Turbopack 개발 모드 Performance.measure 음수 타임스탬프 버그 패치
 *
 * 원인: Next.js 16 Turbopack의 flushComponentPerformance()가
 *       컴포넌트 렌더링 시간을 측정할 때 음수 startTime으로 measure()를 호출.
 *       React Strict Mode 이중 렌더링과 HMR 타이밍이 겹치면서 발생.
 *
 * 영향 범위: 개발 모드 + Turbopack에서만 발생. 프로덕션 빌드에는 영향 없음.
 *
 * 추적: https://github.com/vercel/next.js/issues/86060
 *       Next.js 업스트림에서 수정되면 이 패치를 제거하세요.
 *
 * @see {@link https://github.com/vercel/next.js/issues/86060}
 */
export function patchPerformanceMeasure(): void {
  if (
    process.env.NODE_ENV !== 'development' ||
    typeof window === 'undefined' ||
    typeof performance === 'undefined' ||
    typeof performance.measure !== 'function'
  ) {
    return;
  }

  const originalMeasure = performance.measure.bind(performance);

  performance.measure = function patchedMeasure(
    ...args: Parameters<typeof performance.measure>
  ): PerformanceMeasure {
    try {
      return originalMeasure(...args);
    } catch (error) {
      // 음수 타임스탬프 에러만 선택적으로 무시
      if (error instanceof DOMException && error.message.includes('negative time stamp')) {
        // 빈 PerformanceMeasure 반환 (measure API 계약 유지)
        return originalMeasure('__turbopack_noop__');
      }
      throw error;
    }
  };
}
