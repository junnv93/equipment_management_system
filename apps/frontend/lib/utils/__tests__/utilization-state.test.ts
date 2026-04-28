import { UTILIZATION_THRESHOLDS } from '@/lib/config/dashboard-config';
import { computeUtilizationState } from '../utilization-state';

const { HIGH, MEDIUM, HYSTERESIS } = UTILIZATION_THRESHOLDS;
const HIGH_EXIT = HIGH - HYSTERESIS;
const HIGH_ENTRY = HIGH + HYSTERESIS;
const MEDIUM_EXIT = MEDIUM - HYSTERESIS;
const MEDIUM_ENTRY = MEDIUM + HYSTERESIS;

describe('computeUtilizationState', () => {
  describe('초기 상태 결정', () => {
    it('HIGH 이상 → good', () => {
      expect(computeUtilizationState(HIGH)).toBe('good');
      expect(computeUtilizationState(100)).toBe('good');
      expect(computeUtilizationState(HIGH + 1)).toBe('good');
    });

    it('MEDIUM 이상 HIGH 미만 → warning', () => {
      expect(computeUtilizationState(MEDIUM)).toBe('warning');
      expect(computeUtilizationState(HIGH - 1)).toBe('warning');
      expect(computeUtilizationState(Math.floor((MEDIUM + HIGH) / 2))).toBe('warning');
    });

    it('MEDIUM 미만 → danger', () => {
      expect(computeUtilizationState(MEDIUM - 1)).toBe('danger');
      expect(computeUtilizationState(0)).toBe('danger');
    });
  });

  describe(`prev=good hysteresis (이탈 임계값=${HIGH_EXIT})`, () => {
    it(`HIGH_EXIT(${HIGH_EXIT}) 이상 → good 유지`, () => {
      expect(computeUtilizationState(HIGH_EXIT, 'good')).toBe('good');
      expect(computeUtilizationState(HIGH - 1, 'good')).toBe('good');
    });

    it(`HIGH_EXIT-1(${HIGH_EXIT - 1}) → warning`, () => {
      expect(computeUtilizationState(HIGH_EXIT - 1, 'good')).toBe('warning');
    });

    it(`MEDIUM-1(${MEDIUM - 1}) → danger`, () => {
      expect(computeUtilizationState(MEDIUM - 1, 'good')).toBe('danger');
    });
  });

  describe(`prev=warning hysteresis (진입=${HIGH_ENTRY}, 이탈=${MEDIUM_EXIT})`, () => {
    it(`HIGH_ENTRY(${HIGH_ENTRY}) 이상 → good`, () => {
      expect(computeUtilizationState(HIGH_ENTRY, 'warning')).toBe('good');
      expect(computeUtilizationState(HIGH_ENTRY + 1, 'warning')).toBe('good');
    });

    it(`HIGH_ENTRY-1(${HIGH_ENTRY - 1}) → warning 유지`, () => {
      expect(computeUtilizationState(HIGH_ENTRY - 1, 'warning')).toBe('warning');
    });

    it(`MEDIUM_EXIT(${MEDIUM_EXIT}) 이상 → warning 유지`, () => {
      expect(computeUtilizationState(MEDIUM_EXIT, 'warning')).toBe('warning');
    });

    it(`MEDIUM_EXIT-1(${MEDIUM_EXIT - 1}) → danger`, () => {
      expect(computeUtilizationState(MEDIUM_EXIT - 1, 'warning')).toBe('danger');
    });
  });

  describe(`prev=danger hysteresis (good 진입=${HIGH}, warning 진입=${MEDIUM_ENTRY})`, () => {
    it(`HIGH(${HIGH}) 이상 → good (순수 임계값)`, () => {
      expect(computeUtilizationState(HIGH, 'danger')).toBe('good');
    });

    it(`MEDIUM_ENTRY(${MEDIUM_ENTRY}) 이상 HIGH 미만 → warning`, () => {
      expect(computeUtilizationState(MEDIUM_ENTRY, 'danger')).toBe('warning');
      expect(computeUtilizationState(HIGH - 1, 'danger')).toBe('warning');
    });

    it(`MEDIUM_ENTRY-1(${MEDIUM_ENTRY - 1}) → danger 유지`, () => {
      expect(computeUtilizationState(MEDIUM_ENTRY - 1, 'danger')).toBe('danger');
    });
  });

  describe(`경계값 (${HIGH_EXIT - 1}~${HIGH_ENTRY})`, () => {
    const cases: [
      number,
      'good' | 'warning' | 'danger' | undefined,
      'good' | 'warning' | 'danger',
    ][] = [
      [HIGH_EXIT - 1, 'good', 'warning'],
      [HIGH_EXIT, 'good', 'good'],
      [HIGH - 1, 'good', 'good'],
      [HIGH, undefined, 'good'],
      [HIGH_ENTRY - 1, 'warning', 'warning'],
      [HIGH_ENTRY, 'warning', 'good'],
    ];

    it.each(cases)('pct=%i prev=%s → %s', (pct, prev, expected) => {
      expect(computeUtilizationState(pct, prev)).toBe(expected);
    });
  });
});
