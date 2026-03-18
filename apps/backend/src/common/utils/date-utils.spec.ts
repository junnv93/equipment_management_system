import {
  getUtcStartOfDay,
  getUtcEndOfDay,
  addDaysUtc,
  addMonthsUtc,
  calculateNextCalibrationDate,
  getDaysDifferenceUtc,
  isToday,
  isPast,
  isFuture,
} from './date-utils';

describe('UTC Date Utils', () => {
  // 고정된 날짜로 테스트 (타임존 무관)
  const FIXED_DATE = new Date('2026-01-26T15:30:45.123Z'); // UTC 기준 2026-01-26 오후 3시 30분

  describe('getUtcStartOfDay', () => {
    it('UTC 기준 날짜의 시작 시각 반환', () => {
      const result = getUtcStartOfDay(FIXED_DATE);

      expect(result.toISOString()).toBe('2026-01-26T00:00:00.000Z');
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
      expect(result.getUTCMilliseconds()).toBe(0);
    });

    it('인수 없으면 오늘 날짜의 시작 시각 반환', () => {
      const result = getUtcStartOfDay();
      const now = new Date();

      expect(result.getUTCFullYear()).toBe(now.getUTCFullYear());
      expect(result.getUTCMonth()).toBe(now.getUTCMonth());
      expect(result.getUTCDate()).toBe(now.getUTCDate());
      expect(result.getUTCHours()).toBe(0);
    });

    it('KST 시간대 날짜도 UTC 기준으로 정규화', () => {
      // KST 2026-01-27 00:30 (UTC 2026-01-26 15:30)
      const kstDate = new Date('2026-01-27T00:30:00+09:00');
      const result = getUtcStartOfDay(kstDate);

      // UTC 기준으로 2026-01-26 00:00:00이어야 함
      expect(result.toISOString()).toBe('2026-01-26T00:00:00.000Z');
    });
  });

  describe('getUtcEndOfDay', () => {
    it('UTC 기준 날짜의 종료 시각 반환', () => {
      const result = getUtcEndOfDay(FIXED_DATE);

      expect(result.toISOString()).toBe('2026-01-26T23:59:59.999Z');
      expect(result.getUTCHours()).toBe(23);
      expect(result.getUTCMinutes()).toBe(59);
      expect(result.getUTCSeconds()).toBe(59);
      expect(result.getUTCMilliseconds()).toBe(999);
    });

    it('인수 없으면 오늘 날짜의 종료 시각 반환', () => {
      const result = getUtcEndOfDay();
      const now = new Date();

      expect(result.getUTCFullYear()).toBe(now.getUTCFullYear());
      expect(result.getUTCMonth()).toBe(now.getUTCMonth());
      expect(result.getUTCDate()).toBe(now.getUTCDate());
      expect(result.getUTCHours()).toBe(23);
    });
  });

  describe('addDaysUtc', () => {
    it('UTC 기준으로 날짜에 양수 일수 더하기', () => {
      const baseDate = getUtcStartOfDay(new Date('2026-01-26'));
      const result = addDaysUtc(baseDate, 30);

      expect(result.toISOString()).toBe('2026-02-25T00:00:00.000Z');
    });

    it('UTC 기준으로 날짜에 음수 일수 더하기', () => {
      const baseDate = getUtcStartOfDay(new Date('2026-01-26'));
      const result = addDaysUtc(baseDate, -5);

      expect(result.toISOString()).toBe('2026-01-21T00:00:00.000Z');
    });

    it('월 경계 넘어가는 경우도 정확히 계산', () => {
      const baseDate = getUtcStartOfDay(new Date('2026-01-30'));
      const result = addDaysUtc(baseDate, 5);

      expect(result.toISOString()).toBe('2026-02-04T00:00:00.000Z');
    });

    it('윤년 계산도 정확', () => {
      const baseDate = getUtcStartOfDay(new Date('2024-02-28'));
      const result = addDaysUtc(baseDate, 1);

      expect(result.toISOString()).toBe('2024-02-29T00:00:00.000Z');
    });
  });

  describe('addMonthsUtc', () => {
    it('UTC 기준으로 개월수 더하기', () => {
      const baseDate = new Date('2025-01-15T00:00:00.000Z');
      const result = addMonthsUtc(baseDate, 12);

      expect(result.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    });

    it('음수 개월수도 정확히 계산', () => {
      const baseDate = new Date('2026-03-15T00:00:00.000Z');
      const result = addMonthsUtc(baseDate, -2);

      expect(result.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    });

    it('월말 클램핑: 1월 31일 + 1개월 = 2월 28일 (평년)', () => {
      const baseDate = new Date('2026-01-31T00:00:00.000Z');
      const result = addMonthsUtc(baseDate, 1);

      expect(result.toISOString()).toBe('2026-02-28T00:00:00.000Z');
    });

    it('월말 클램핑: 1월 31일 + 1개월 = 2월 29일 (윤년)', () => {
      const baseDate = new Date('2024-01-31T00:00:00.000Z');
      const result = addMonthsUtc(baseDate, 1);

      expect(result.toISOString()).toBe('2024-02-29T00:00:00.000Z');
    });

    it('월말 클램핑: 3월 31일 + 1개월 = 4월 30일', () => {
      const baseDate = new Date('2026-03-31T00:00:00.000Z');
      const result = addMonthsUtc(baseDate, 1);

      expect(result.toISOString()).toBe('2026-04-30T00:00:00.000Z');
    });

    it('월말 클램핑: 8월 31일 + 6개월 = 2월 28일', () => {
      const baseDate = new Date('2025-08-31T00:00:00.000Z');
      const result = addMonthsUtc(baseDate, 6);

      expect(result.toISOString()).toBe('2026-02-28T00:00:00.000Z');
    });

    it('30일 월은 그대로 유지: 4월 30일 + 1개월 = 5월 30일', () => {
      const baseDate = new Date('2026-04-30T00:00:00.000Z');
      const result = addMonthsUtc(baseDate, 1);

      expect(result.toISOString()).toBe('2026-05-30T00:00:00.000Z');
    });

    it('12개월 더하면 동일 일자 유지', () => {
      const baseDate = new Date('2025-04-17T00:00:00.000Z');
      const result = addMonthsUtc(baseDate, 12);

      expect(result.toISOString()).toBe('2026-04-17T00:00:00.000Z');
    });
  });

  describe('calculateNextCalibrationDate (SSOT)', () => {
    it('마지막 교정일 + 교정주기로 차기 교정일 계산', () => {
      const result = calculateNextCalibrationDate('2025-04-17', 12);
      expect(result?.toISOString()).toContain('2026-04-17');
    });

    it('마지막 교정일이 없으면 undefined', () => {
      expect(calculateNextCalibrationDate(undefined, 12)).toBeUndefined();
    });

    it('교정주기가 없으면 undefined', () => {
      expect(calculateNextCalibrationDate('2025-04-17', undefined)).toBeUndefined();
    });

    it('Date 객체도 동일하게 처리', () => {
      const result = calculateNextCalibrationDate(new Date('2025-04-17'), 12);
      expect(result?.toISOString()).toContain('2026-04-17');
    });
  });

  describe('getDaysDifferenceUtc', () => {
    it('정확히 30일 차이 계산', () => {
      const date1 = getUtcStartOfDay(new Date('2026-01-26'));
      const date2 = getUtcStartOfDay(new Date('2026-02-25'));

      expect(getDaysDifferenceUtc(date1, date2)).toBe(30);
    });

    it('음수 일수 차이 계산', () => {
      const date1 = getUtcStartOfDay(new Date('2026-02-25'));
      const date2 = getUtcStartOfDay(new Date('2026-01-26'));

      expect(getDaysDifferenceUtc(date1, date2)).toBe(-30);
    });

    it('같은 날짜는 0 반환', () => {
      const date1 = getUtcStartOfDay(new Date('2026-01-26'));
      const date2 = getUtcStartOfDay(new Date('2026-01-26T23:59:59'));

      expect(getDaysDifferenceUtc(date1, date2)).toBe(0);
    });

    it('소수점 이하는 올림 처리', () => {
      const date1 = new Date('2026-01-26T00:00:00.000Z');
      const date2 = new Date('2026-01-26T12:00:00.000Z'); // 0.5일

      expect(getDaysDifferenceUtc(date1, date2)).toBe(1);
    });
  });

  describe('isToday', () => {
    it('오늘 날짜면 true 반환', () => {
      const today = new Date();

      expect(isToday(today)).toBe(true);
    });

    it('과거 날짜면 false 반환', () => {
      const yesterday = addDaysUtc(new Date(), -1);

      expect(isToday(yesterday)).toBe(false);
    });

    it('미래 날짜면 false 반환', () => {
      const tomorrow = addDaysUtc(new Date(), 1);

      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('isPast', () => {
    it('과거 날짜면 true 반환', () => {
      const pastDate = new Date('2025-01-01');

      expect(isPast(pastDate)).toBe(true);
    });

    it('오늘 날짜면 false 반환', () => {
      const today = new Date();

      expect(isPast(today)).toBe(false);
    });

    it('미래 날짜면 false 반환', () => {
      const futureDate = new Date('2027-01-01');

      expect(isPast(futureDate)).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('미래 날짜면 true 반환', () => {
      const futureDate = new Date('2027-01-01');

      expect(isFuture(futureDate)).toBe(true);
    });

    it('오늘 날짜면 false 반환', () => {
      const today = new Date();

      expect(isFuture(today)).toBe(false);
    });

    it('과거 날짜면 false 반환', () => {
      const pastDate = new Date('2025-01-01');

      expect(isFuture(pastDate)).toBe(false);
    });
  });

  describe('실제 교정 필터 시나리오', () => {
    it('30일 이내 필터: 경계값 정확히 포함', () => {
      const today = getUtcStartOfDay(new Date('2026-01-26'));
      const in30Days = addDaysUtc(today, 30); // 2026-02-25

      const equipmentDate = getUtcStartOfDay(new Date('2026-02-25'));

      expect(equipmentDate.getTime()).toBe(in30Days.getTime());
      expect(getDaysDifferenceUtc(today, equipmentDate)).toBe(30);
    });

    it('31일 이상 남은 장비는 제외', () => {
      const today = getUtcStartOfDay(new Date('2026-01-26'));
      const in30Days = getUtcEndOfDay(addDaysUtc(today, 30)); // 2026-02-25 23:59:59.999Z

      const equipmentDate = getUtcStartOfDay(new Date('2026-02-26')); // 31일 후

      expect(equipmentDate.getTime()).toBeGreaterThan(in30Days.getTime());
    });

    it('교정 기한 초과 장비: 오늘 이전', () => {
      const today = getUtcStartOfDay(new Date('2026-01-26'));
      const overdue = getUtcStartOfDay(new Date('2026-01-21')); // 5일 전

      expect(overdue.getTime()).toBeLessThan(today.getTime());
      expect(getDaysDifferenceUtc(overdue, today)).toBe(5);
    });

    it('사용자가 제시한 버그 재현: 2026-10-24는 30일 이내가 아님', () => {
      const today = getUtcStartOfDay(new Date('2026-01-26'));
      const in30Days = getUtcEndOfDay(addDaysUtc(today, 30)); // 2026-02-25 23:59:59.999Z

      const buggyEquipment = getUtcStartOfDay(new Date('2026-10-24')); // 약 270일 후

      expect(buggyEquipment.getTime()).toBeGreaterThan(in30Days.getTime());
      expect(getDaysDifferenceUtc(today, buggyEquipment)).toBeGreaterThan(30);
    });
  });
});
