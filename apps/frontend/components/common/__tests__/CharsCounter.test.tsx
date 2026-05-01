/// <reference types="@testing-library/jest-dom" />
/**
 * CharsCounter unit test — 임계값 색상 토글 + i18n 위임 + a11y 검증
 *
 * SSOT 검증:
 *   - 색상 전이는 `CHAR_COUNTER_TOKENS.warningRatio`(0.8)에 결합
 *   - 디폴트 텍스트는 글로벌 `common.charCounter.ratio` i18n 키
 *   - aria-live + role="status"가 항상 부여됨
 */

import { render, screen } from '@testing-library/react';
import { CharsCounter } from '../CharsCounter';
import { CHAR_COUNTER_TOKENS } from '@/lib/design-tokens';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params && 'count' in params && 'max' in params) {
      return `${params.count}/${params.max}`;
    }
    return key;
  },
}));

describe('CharsCounter', () => {
  describe('threshold color transitions (warningRatio default 0.8)', () => {
    it('renders with muted-foreground when count < warningRatio*max', () => {
      const { container } = render(<CharsCounter count={399} max={500} />);
      const span = container.querySelector('span[role="status"]');
      expect(span).not.toHaveClass(CHAR_COUNTER_TOKENS.warningClass);
      expect(span).not.toHaveClass(CHAR_COUNTER_TOKENS.destructiveClass);
    });

    it('renders with warning class at warningRatio threshold (count = floor(max * 0.8))', () => {
      // floor(500 * 0.8) = 400
      const { container } = render(<CharsCounter count={400} max={500} />);
      const span = container.querySelector('span[role="status"]');
      expect(span).toHaveClass(CHAR_COUNTER_TOKENS.warningClass);
      expect(span).not.toHaveClass(CHAR_COUNTER_TOKENS.destructiveClass);
    });

    it('renders with warning class in 80~99% range', () => {
      const { container } = render(<CharsCounter count={499} max={500} />);
      const span = container.querySelector('span[role="status"]');
      expect(span).toHaveClass(CHAR_COUNTER_TOKENS.warningClass);
    });

    it('renders with destructive class when count = max', () => {
      const { container } = render(<CharsCounter count={500} max={500} />);
      const span = container.querySelector('span[role="status"]');
      expect(span).toHaveClass(CHAR_COUNTER_TOKENS.destructiveClass);
      expect(span).not.toHaveClass(CHAR_COUNTER_TOKENS.warningClass);
    });

    it('renders with destructive class when count exceeds max (boundary)', () => {
      const { container } = render(<CharsCounter count={600} max={500} />);
      const span = container.querySelector('span[role="status"]');
      expect(span).toHaveClass(CHAR_COUNTER_TOKENS.destructiveClass);
    });
  });

  describe('warningRatio override', () => {
    it('respects custom warningRatio prop (0.5)', () => {
      // floor(500 * 0.5) = 250
      const { container } = render(<CharsCounter count={250} max={500} warningRatio={0.5} />);
      const span = container.querySelector('span[role="status"]');
      expect(span).toHaveClass(CHAR_COUNTER_TOKENS.warningClass);
    });
  });

  describe('text rendering', () => {
    it('falls back to common.charCounter.ratio i18n key when no children', () => {
      render(<CharsCounter count={100} max={500} />);
      expect(screen.getByText('100/500')).toBeInTheDocument();
    });

    it('renders custom children when provided (e.g. "X chars remaining")', () => {
      render(
        <CharsCounter count={100} max={500}>
          400 chars remaining
        </CharsCounter>
      );
      expect(screen.getByText('400 chars remaining')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('always renders role="status" + aria-live="polite" by default', () => {
      const { container } = render(<CharsCounter count={50} max={500} />);
      const span = container.querySelector('span[role="status"]');
      expect(span).toBeInTheDocument();
      expect(span).toHaveAttribute('aria-live', 'polite');
    });

    it('respects ariaLive="off" for static labels', () => {
      const { container } = render(<CharsCounter count={50} max={500} ariaLive="off" />);
      const span = container.querySelector('span[role="status"]');
      expect(span).toHaveAttribute('aria-live', 'off');
    });
  });

  describe('className composition', () => {
    it('composes custom className over base tokens', () => {
      const { container } = render(<CharsCounter count={50} max={500} className="custom-extra" />);
      const span = container.querySelector('span[role="status"]');
      expect(span).toHaveClass('custom-extra');
      // base tokens still applied
      expect(span).toHaveClass('block');
    });
  });
});
