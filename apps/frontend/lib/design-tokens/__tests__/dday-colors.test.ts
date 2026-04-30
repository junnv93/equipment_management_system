/**
 * Sprint 4.5 U-09 — D-day Visual 6-level boundary 단위 테스트.
 *
 * 4-tier SSOT(`getCheckoutDdayTier`)는 별도 시스템이므로 본 테스트는 visual layer만 검증.
 * boundary 임계값 변경 시 본 테스트가 회귀 차단(`CHECKOUT_DDAY_VISUAL_THRESHOLDS`).
 */

import {
  CHECKOUT_DDAY_VISUAL_THRESHOLDS,
  DDAY_VISUAL_LEVEL_CLASSES,
  DDAY_VISUAL_LEVEL_ICON_KEY,
  getCheckoutDdayVisualLevel,
  getCheckoutDdayVisualClasses,
  getCheckoutDdayVisualIconKey,
} from '../components/dday-colors';

describe('CHECKOUT_DDAY_VISUAL_THRESHOLDS', () => {
  it('각 임계값이 의도된 시각 의미와 일치', () => {
    expect(CHECKOUT_DDAY_VISUAL_THRESHOLDS).toEqual({
      relaxedFloor: 7,
      normalFloor: 4,
      warningFloor: 1,
      urgentDay: 0,
      overdueLightFloor: -3,
    });
  });

  it('임계값이 단조 감소 — boundary 일관성 보장', () => {
    const T = CHECKOUT_DDAY_VISUAL_THRESHOLDS;
    expect(T.relaxedFloor).toBeGreaterThan(T.normalFloor);
    expect(T.normalFloor).toBeGreaterThan(T.warningFloor);
    expect(T.warningFloor).toBeGreaterThan(T.urgentDay);
    expect(T.urgentDay).toBeGreaterThan(T.overdueLightFloor);
  });
});

describe('getCheckoutDdayVisualLevel()', () => {
  describe('Level 1 (relaxed) — days >= 7', () => {
    it.each([7, 10, 30, 365])('%d → 1', (days) => {
      expect(getCheckoutDdayVisualLevel(days)).toBe(1);
    });
  });

  describe('Level 2 (normal) — 4 <= days <= 6', () => {
    it.each([4, 5, 6])('%d → 2', (days) => {
      expect(getCheckoutDdayVisualLevel(days)).toBe(2);
    });
  });

  describe('Level 3 (warning-soft) — 1 <= days <= 3', () => {
    it.each([1, 2, 3])('%d → 3', (days) => {
      expect(getCheckoutDdayVisualLevel(days)).toBe(3);
    });
  });

  describe('Level 4 (urgent) — days === 0 (D-day)', () => {
    it('0 → 4', () => {
      expect(getCheckoutDdayVisualLevel(0)).toBe(4);
    });
  });

  describe('Level 5 (overdue-light) — -3 <= days <= -1', () => {
    it.each([-1, -2, -3])('%d → 5', (days) => {
      expect(getCheckoutDdayVisualLevel(days)).toBe(5);
    });
  });

  describe('Level 6 (critical-pulse) — days <= -4', () => {
    it.each([-4, -10, -100])('%d → 6', (days) => {
      expect(getCheckoutDdayVisualLevel(days)).toBe(6);
    });
  });

  describe('boundary 정확성 (off-by-one 방어)', () => {
    it('7 (level 1)과 6 (level 2)는 다른 level', () => {
      expect(getCheckoutDdayVisualLevel(7)).toBe(1);
      expect(getCheckoutDdayVisualLevel(6)).toBe(2);
    });
    it('4 (level 2)와 3 (level 3)는 다른 level', () => {
      expect(getCheckoutDdayVisualLevel(4)).toBe(2);
      expect(getCheckoutDdayVisualLevel(3)).toBe(3);
    });
    it('1 (level 3)과 0 (level 4)는 다른 level', () => {
      expect(getCheckoutDdayVisualLevel(1)).toBe(3);
      expect(getCheckoutDdayVisualLevel(0)).toBe(4);
    });
    it('0 (level 4)과 -1 (level 5)는 다른 level', () => {
      expect(getCheckoutDdayVisualLevel(0)).toBe(4);
      expect(getCheckoutDdayVisualLevel(-1)).toBe(5);
    });
    it('-3 (level 5)과 -4 (level 6)는 다른 level', () => {
      expect(getCheckoutDdayVisualLevel(-3)).toBe(5);
      expect(getCheckoutDdayVisualLevel(-4)).toBe(6);
    });
  });
});

describe('getCheckoutDdayVisualClasses()', () => {
  it('각 level이 매칭되는 className 반환', () => {
    expect(getCheckoutDdayVisualClasses(7)).toBe(DDAY_VISUAL_LEVEL_CLASSES[1]);
    expect(getCheckoutDdayVisualClasses(5)).toBe(DDAY_VISUAL_LEVEL_CLASSES[2]);
    expect(getCheckoutDdayVisualClasses(2)).toBe(DDAY_VISUAL_LEVEL_CLASSES[3]);
    expect(getCheckoutDdayVisualClasses(0)).toBe(DDAY_VISUAL_LEVEL_CLASSES[4]);
    expect(getCheckoutDdayVisualClasses(-2)).toBe(DDAY_VISUAL_LEVEL_CLASSES[5]);
    expect(getCheckoutDdayVisualClasses(-5)).toBe(DDAY_VISUAL_LEVEL_CLASSES[6]);
  });

  it('Level 6은 motion-safe pulse 포함 (WCAG 2.3.3 prefers-reduced-motion)', () => {
    const classes = getCheckoutDdayVisualClasses(-5);
    expect(classes).toContain('motion-safe:animate-pulse');
  });

  it('Level 1~5는 pulse 없음 — 시각 강도 단계적 증가', () => {
    [7, 5, 2, 0, -2].forEach((days) => {
      expect(getCheckoutDdayVisualClasses(days)).not.toContain('animate-pulse');
    });
  });
});

describe('getCheckoutDdayVisualIconKey()', () => {
  it('Level 1~2: 아이콘 없음 (null) — relaxed/normal', () => {
    expect(getCheckoutDdayVisualIconKey(10)).toBeNull();
    expect(getCheckoutDdayVisualIconKey(5)).toBeNull();
  });

  it('Level 3~4: warning 아이콘', () => {
    expect(getCheckoutDdayVisualIconKey(2)).toBe('warning');
    expect(getCheckoutDdayVisualIconKey(0)).toBe('warning');
  });

  it('Level 5~6: critical 아이콘', () => {
    expect(getCheckoutDdayVisualIconKey(-2)).toBe('critical');
    expect(getCheckoutDdayVisualIconKey(-5)).toBe('critical');
  });

  it('icon key 매핑이 DDAY_VISUAL_LEVEL_ICON_KEY와 일관', () => {
    [1, 2, 3, 4, 5, 6].forEach((level) => {
      const days =
        level === 1
          ? 10
          : level === 2
            ? 5
            : level === 3
              ? 2
              : level === 4
                ? 0
                : level === 5
                  ? -2
                  : -5;
      expect(getCheckoutDdayVisualIconKey(days)).toBe(
        DDAY_VISUAL_LEVEL_ICON_KEY[level as 1 | 2 | 3 | 4 | 5 | 6]
      );
    });
  });
});
