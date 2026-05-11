/// <reference types="@testing-library/jest-dom" />
/**
 * CalibrationDueBadge — RTL spec (qr-visual-redesign TASK 2 / 2026-05-11).
 *
 * Contract M-25 검증 범위:
 *   - 30일 boundary: ≤30일 → D-N 노출 / ≥31일 → null
 *   - 0일 (오늘) — `dueToday` i18n 진입
 *   - 음수 (overdue) — `overdue` + urgent tone
 *   - 1~7일 urgent tone (warning 톤은 ≤30 동일 — 본 컴포넌트는 단일 boundary 정책)
 *   - tabular-nums + font-mono — 자릿수 점프 차단
 *   - null / 잘못된 날짜 → null 렌더
 *
 * i18n: `qr.calibrationDueBadge.{overdue|dueToday|dueIn}` (mock).
 */
import { render, screen } from '@testing-library/react';
import { CalibrationDueBadge } from '../CalibrationDueBadge';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === 'overdue' && params && 'days' in params) return `overdue D+${params.days}`;
    if (key === 'dueToday') return 'due today';
    if (key === 'dueIn' && params && 'days' in params) return `due in ${params.days}`;
    return key;
  },
}));

const NOW = new Date('2026-05-11T00:00:00.000Z');

function dateInDays(days: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

describe('CalibrationDueBadge', () => {
  describe('30-day visibility boundary (M-25)', () => {
    it('renders when nextCalibrationDate is exactly 30 days away', () => {
      render(<CalibrationDueBadge nextCalibrationDate={dateInDays(30)} now={NOW} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/due in 30/)).toBeInTheDocument();
    });

    it('does NOT render when nextCalibrationDate is 31 days away', () => {
      const { container } = render(
        <CalibrationDueBadge nextCalibrationDate={dateInDays(31)} now={NOW} />
      );
      expect(container).toBeEmptyDOMElement();
      expect(screen.queryByRole('status')).toBeNull();
    });

    it('does NOT render for far-future date (90 days)', () => {
      const { container } = render(
        <CalibrationDueBadge nextCalibrationDate={dateInDays(90)} now={NOW} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('boundary labels (D-N / D-0 / D+N)', () => {
    it('renders "due today" when 0 days remaining', () => {
      render(<CalibrationDueBadge nextCalibrationDate={dateInDays(0)} now={NOW} />);
      expect(screen.getByText(/due today/)).toBeInTheDocument();
    });

    it('renders "due in N" for 7 days remaining', () => {
      render(<CalibrationDueBadge nextCalibrationDate={dateInDays(7)} now={NOW} />);
      expect(screen.getByText(/due in 7/)).toBeInTheDocument();
    });

    it('renders "overdue D+N" for -1 day (yesterday)', () => {
      render(<CalibrationDueBadge nextCalibrationDate={dateInDays(-1)} now={NOW} />);
      expect(screen.getByText(/overdue D\+1/)).toBeInTheDocument();
    });
  });

  describe('null / invalid input safety', () => {
    it('renders null when nextCalibrationDate is null', () => {
      const { container } = render(<CalibrationDueBadge nextCalibrationDate={null} now={NOW} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('renders null when nextCalibrationDate is undefined', () => {
      const { container } = render(
        <CalibrationDueBadge nextCalibrationDate={undefined} now={NOW} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('renders null for invalid date string', () => {
      const { container } = render(
        <CalibrationDueBadge nextCalibrationDate="not-a-date" now={NOW} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('typography (font-mono + tabular-nums)', () => {
    it('label uses font-mono + tabular-nums (자릿수 점프 방지)', () => {
      render(<CalibrationDueBadge nextCalibrationDate={dateInDays(13)} now={NOW} />);
      // span containing the day count has font-mono + tabular-nums classes
      const label = screen.getByText(/due in 13/);
      expect(label.className).toMatch(/font-mono/);
      expect(label.className).toMatch(/tabular-nums/);
    });
  });
});
