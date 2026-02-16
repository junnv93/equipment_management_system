/**
 * PPR-Safe Performance API 유틸리티
 *
 * Next.js 16 PPR 환경에서 안전하게 Performance API를 사용하기 위한 래퍼.
 * 전역 패치(`patchPerformanceMeasure`)의 보완적 접근법.
 *
 * ## 사용 시점
 *
 * - PPR 컴포넌트 내부에서 직접 performance 측정이 필요한 경우
 * - 커스텀 성능 모니터링 구현 시
 * - 에러 핸들링을 명시적으로 제어하고 싶을 때
 *
 * ## 전역 패치 vs Safe 래퍼
 *
 * | 접근법 | 장점 | 단점 |
 * |--------|------|------|
 * | 전역 패치 | Next.js 내부 호출 자동 커버 | 전역 상태 변경 |
 * | Safe 래퍼 | 명시적, 타입 안전 | 수동 사용 필요 |
 *
 * **권장:** 둘 다 사용 (전역 패치 + 명시적 래퍼)
 */

import { isPerformanceMeasureError, isBrowserEnvironment } from './performance-errors';

/**
 * Safe Performance Measure Options
 */
export interface SafeMeasureOptions {
  /**
   * 에러 발생 시 콘솔 경고 출력 여부
   * @default true (개발 환경에서만)
   */
  warn?: boolean;

  /**
   * 에러 발생 시 fallback 마크 이름
   * @default '__fallback__'
   */
  fallbackName?: string;
}

/**
 * PPR-safe performance.measure() 래퍼
 *
 * Next.js 16 PPR 환경에서 안전하게 performance 측정을 수행합니다.
 * 음수 타임스탬프 에러를 자동으로 처리하고 null을 반환합니다.
 *
 * @param measureName - measure 이름
 * @param startOrMeasureOptions - startMark 또는 MeasureOptions
 * @param endMark - endMark (선택)
 * @param options - Safe measure 옵션
 * @returns PerformanceMeasure 또는 null (실패 시)
 *
 * @example
 * ```typescript
 * // PPR async 함수 내부
 * const mark = safeMeasure('data-fetch', 'fetch-start', 'fetch-end');
 * if (mark) {
 *   console.log('Duration:', mark.duration);
 * }
 * ```
 */
export function safeMeasure(
  measureName: string,
  startOrMeasureOptions?: string | PerformanceMeasureOptions,
  endMark?: string,
  options: SafeMeasureOptions = {}
): PerformanceMeasure | null {
  // 브라우저 환경 체크
  if (!isBrowserEnvironment() || typeof performance.measure !== 'function') {
    return null;
  }

  const { warn = process.env.NODE_ENV === 'development', fallbackName = '__fallback__' } = options;

  try {
    // 타입 안전: performance.measure 오버로드 지원
    if (endMark !== undefined) {
      // measure(name, startMark, endMark)
      return performance.measure(measureName, startOrMeasureOptions as string, endMark);
    } else if (typeof startOrMeasureOptions === 'object') {
      // measure(name, options)
      return performance.measure(measureName, startOrMeasureOptions);
    } else if (typeof startOrMeasureOptions === 'string') {
      // measure(name, startMark)
      return performance.measure(measureName, startOrMeasureOptions);
    } else {
      // measure(name)
      return performance.measure(measureName);
    }
  } catch (error) {
    // PPR 관련 에러만 무시
    if (isPerformanceMeasureError(error)) {
      if (warn) {
        console.debug(
          `[Safe Performance] Measure skipped: "${measureName}"`,
          error instanceof Error ? error.message : error
        );
      }

      // Fallback measure 시도 (선택적)
      if (fallbackName) {
        try {
          return performance.measure(fallbackName);
        } catch {
          // Fallback도 실패하면 null 반환
        }
      }

      return null;
    }

    // 예상치 못한 에러는 재throw
    throw error;
  }
}

/**
 * Safe performance.mark() 래퍼
 *
 * 마크 생성도 실패할 수 있으므로 안전한 래퍼 제공.
 *
 * @param markName - 마크 이름
 * @param options - PerformanceMarkOptions
 * @returns PerformanceMark 또는 null
 *
 * @example
 * ```typescript
 * safeMark('fetch-start');
 * const data = await fetch(...);
 * safeMark('fetch-end');
 * safeMeasure('fetch-duration', 'fetch-start', 'fetch-end');
 * ```
 */
export function safeMark(
  markName: string,
  options?: PerformanceMarkOptions
): PerformanceMark | null {
  if (!isBrowserEnvironment() || typeof performance.mark !== 'function') {
    return null;
  }

  try {
    return options ? performance.mark(markName, options) : performance.mark(markName);
  } catch (error) {
    // 마크 생성 실패는 조용히 무시 (PPR 환경에서 흔함)
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Safe Performance] Mark skipped: "${markName}"`, error);
    }
    return null;
  }
}

/**
 * Performance Entry 조회 (타입 안전)
 *
 * @param name - Entry 이름 (선택)
 * @param type - Entry 타입 (선택)
 * @returns PerformanceEntryList 또는 빈 배열
 */
export function safeGetEntries(name?: string, type?: string): PerformanceEntryList {
  if (!isBrowserEnvironment()) {
    return [];
  }

  try {
    if (name && type) {
      return performance.getEntriesByName(name, type);
    } else if (name) {
      return performance.getEntriesByName(name);
    } else if (type) {
      return performance.getEntriesByType(type);
    } else {
      return performance.getEntries();
    }
  } catch {
    return [];
  }
}

/**
 * Performance Entry 클리어 (안전)
 *
 * PPR 환경에서 stale entries를 정리할 때 사용.
 */
export function safeClearMarks(markName?: string): void {
  if (!isBrowserEnvironment() || typeof performance.clearMarks !== 'function') {
    return;
  }

  try {
    performance.clearMarks(markName);
  } catch {
    // 실패 무시
  }
}

export function safeClearMeasures(measureName?: string): void {
  if (!isBrowserEnvironment() || typeof performance.clearMeasures !== 'function') {
    return;
  }

  try {
    performance.clearMeasures(measureName);
  } catch {
    // 실패 무시
  }
}
