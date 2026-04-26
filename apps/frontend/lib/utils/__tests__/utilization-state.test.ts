import { computeUtilizationState } from '../utilization-state';

describe('computeUtilizationState', () => {
  // 초기 상태 (prev 없음)
  describe('초기 상태 결정', () => {
    it('70% 이상 → good', () => {
      expect(computeUtilizationState(70)).toBe('good');
      expect(computeUtilizationState(100)).toBe('good');
      expect(computeUtilizationState(71)).toBe('good');
    });

    it('40% 이상 70% 미만 → warning', () => {
      expect(computeUtilizationState(40)).toBe('warning');
      expect(computeUtilizationState(69)).toBe('warning');
      expect(computeUtilizationState(55)).toBe('warning');
    });

    it('40% 미만 → danger', () => {
      expect(computeUtilizationState(39)).toBe('danger');
      expect(computeUtilizationState(0)).toBe('danger');
    });
  });

  // good 상태에서의 hysteresis
  describe('prev=good hysteresis (이탈 임계값 68%)', () => {
    it('68% 이상 → good 유지 (70-2=68)', () => {
      expect(computeUtilizationState(68, 'good')).toBe('good');
      expect(computeUtilizationState(69, 'good')).toBe('good');
    });

    it('67% → warning (68 미만)', () => {
      expect(computeUtilizationState(67, 'good')).toBe('warning');
    });

    it('39% → danger (40 미만)', () => {
      expect(computeUtilizationState(39, 'good')).toBe('danger');
    });
  });

  // warning 상태에서의 hysteresis
  describe('prev=warning hysteresis (진입=72%, 이탈=38%)', () => {
    it('72% 이상 → good (70+2=72)', () => {
      expect(computeUtilizationState(72, 'warning')).toBe('good');
      expect(computeUtilizationState(73, 'warning')).toBe('good');
    });

    it('71% → warning 유지 (72 미만)', () => {
      expect(computeUtilizationState(71, 'warning')).toBe('warning');
    });

    it('38% 이상 → warning 유지 (40-2=38)', () => {
      expect(computeUtilizationState(38, 'warning')).toBe('warning');
    });

    it('37% → danger (38 미만)', () => {
      expect(computeUtilizationState(37, 'warning')).toBe('danger');
    });
  });

  // danger 상태에서의 hysteresis
  describe('prev=danger hysteresis (진입=70%, warning진입=42%)', () => {
    it('70% 이상 → good (순수 임계값)', () => {
      expect(computeUtilizationState(70, 'danger')).toBe('good');
    });

    it('42% 이상 70% 미만 → warning (40+2=42)', () => {
      expect(computeUtilizationState(42, 'danger')).toBe('warning');
      expect(computeUtilizationState(69, 'danger')).toBe('warning');
    });

    it('41% → danger 유지 (42 미만)', () => {
      expect(computeUtilizationState(41, 'danger')).toBe('danger');
    });
  });

  // 경계값 정밀 검증
  describe('경계값 (67~72)', () => {
    const cases: [
      number,
      'good' | 'warning' | 'danger' | undefined,
      'good' | 'warning' | 'danger',
    ][] = [
      [67, 'good', 'warning'],
      [68, 'good', 'good'],
      [69, 'good', 'good'],
      [70, undefined, 'good'],
      [71, 'warning', 'warning'],
      [72, 'warning', 'good'],
    ];

    it.each(cases)('pct=%i prev=%s → %s', (pct, prev, expected) => {
      expect(computeUtilizationState(pct, prev)).toBe(expected);
    });
  });
});
