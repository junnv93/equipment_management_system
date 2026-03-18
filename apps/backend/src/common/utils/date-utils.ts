/**
 * UTC 기준 날짜 유틸리티 함수
 *
 * ✅ 타임존 통일: 모든 날짜 연산을 UTC 기준으로 수행하여 일관성 보장
 * - JavaScript Date는 로컬 타임존 영향을 받음
 * - PostgreSQL TIMESTAMP는 UTC로 저장됨
 * - 이 유틸리티로 모든 날짜를 UTC 기준으로 정규화
 */

/**
 * UTC 기준 날짜의 시작 시각(00:00:00.000) 반환
 *
 * @example
 * const today = getUtcStartOfDay(); // 2026-01-26T00:00:00.000Z
 * const specificDate = getUtcStartOfDay(new Date('2026-10-24')); // 2026-10-24T00:00:00.000Z
 */
export function getUtcStartOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * UTC 기준 날짜의 종료 시각(23:59:59.999) 반환
 *
 * @example
 * const endOfToday = getUtcEndOfDay(); // 2026-01-26T23:59:59.999Z
 */
export function getUtcEndOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

/**
 * UTC 기준으로 날짜에 일수를 더함
 *
 * @param date 기준 날짜
 * @param days 더할 일수 (음수 가능)
 * @returns 계산된 날짜
 *
 * @example
 * const today = getUtcStartOfDay();
 * const in30Days = addDaysUtc(today, 30);
 * const yesterday = addDaysUtc(today, -1);
 */
export function addDaysUtc(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * UTC 기준으로 날짜에 개월수를 더함 (월말 클램핑 적용)
 *
 * JavaScript의 setUTCMonth()는 월말 오버플로우 발생:
 *   1월 31일 + 1개월 → 3월 3일 (2월 31일이 없으므로)
 *
 * 이 함수는 원래 일자가 대상 월의 마지막 일보다 크면 해당 월의 말일로 클램핑:
 *   1월 31일 + 1개월 → 2월 28일 (또는 윤년이면 2월 29일)
 *   3월 31일 + 1개월 → 4월 30일
 *   8월 31일 + 6개월 → 2월 28일
 *
 * @param date 기준 날짜
 * @param months 더할 개월수 (음수 가능)
 * @returns 계산된 날짜 (월말 클램핑 적용)
 *
 * @example
 * addMonthsUtc(new Date('2025-01-15'), 12); // 2026-01-15
 * addMonthsUtc(new Date('2025-01-31'), 1);  // 2025-02-28
 * addMonthsUtc(new Date('2024-01-31'), 1);  // 2024-02-29 (윤년)
 */
export function addMonthsUtc(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getUTCDate();
  result.setUTCDate(1); // 오버플로우 방지를 위해 1일로 설정 후 월 변경
  result.setUTCMonth(result.getUTCMonth() + months);
  // 대상 월의 마지막 일 계산
  const daysInTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(originalDay, daysInTargetMonth));
  return result;
}

/**
 * 차기 교정일 계산 (SSOT)
 *
 * 차기 교정일 = 마지막 교정일 + 교정 주기(개월)
 * 모든 서비스에서 이 함수를 사용하여 일관된 계산을 보장합니다.
 *
 * @param lastCalibrationDate 마지막 교정일
 * @param calibrationCycle 교정 주기 (개월)
 * @returns 차기 교정일 (입력값이 없으면 undefined)
 */
export function calculateNextCalibrationDate(
  lastCalibrationDate?: Date | string,
  calibrationCycle?: number
): Date | undefined {
  if (!lastCalibrationDate || !calibrationCycle) {
    return undefined;
  }

  const lastDate =
    typeof lastCalibrationDate === 'string' ? new Date(lastCalibrationDate) : lastCalibrationDate;

  return addMonthsUtc(lastDate, calibrationCycle);
}

/**
 * 두 UTC 날짜 사이의 일수 차이 계산
 *
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 일수 차이 (date2 - date1, 소수점 이하 올림)
 *
 * @example
 * const today = getUtcStartOfDay();
 * const future = addDaysUtc(today, 30);
 * const diff = getDaysDifferenceUtc(today, future); // 30
 */
export function getDaysDifferenceUtc(date1: Date, date2: Date): number {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * UTC 기준으로 날짜가 오늘인지 확인
 *
 * @param date 확인할 날짜
 * @returns 오늘이면 true
 */
export function isToday(date: Date): boolean {
  const today = getUtcStartOfDay();
  const targetDate = getUtcStartOfDay(date);
  return today.getTime() === targetDate.getTime();
}

/**
 * UTC 기준으로 날짜가 과거인지 확인
 *
 * @param date 확인할 날짜
 * @returns 과거면 true
 */
export function isPast(date: Date): boolean {
  const today = getUtcStartOfDay();
  const targetDate = getUtcStartOfDay(date);
  return targetDate.getTime() < today.getTime();
}

/**
 * UTC 기준으로 날짜가 미래인지 확인
 *
 * @param date 확인할 날짜
 * @returns 미래면 true
 */
export function isFuture(date: Date): boolean {
  const today = getUtcStartOfDay();
  const targetDate = getUtcStartOfDay(date);
  return targetDate.getTime() > today.getTime();
}
