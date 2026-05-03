import {
  getStaggerFadeInStyle,
  LOW_HARDWARE_CONCURRENCY_THRESHOLD,
  shouldUseStaggerFadeIn,
  STAGGER_ROW_LIMIT,
} from '../motion';

function mockMotionAndHardware({
  reducedMotion = false,
  hardwareConcurrency = LOW_HARDWARE_CONCURRENCY_THRESHOLD,
}: {
  reducedMotion?: boolean;
  hardwareConcurrency?: number;
}) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    configurable: true,
    value: hardwareConcurrency,
  });
}

describe('motion stagger guards', () => {
  it('uses stagger fade-in for rows below the limit on capable hardware', () => {
    mockMotionAndHardware({ hardwareConcurrency: LOW_HARDWARE_CONCURRENCY_THRESHOLD });

    expect(shouldUseStaggerFadeIn(0)).toBe(true);
    expect(getStaggerFadeInStyle(2, 'grid')).toEqual({ animationDelay: '120ms' });
  });

  it('disables stagger fade-in when row index reaches the limit', () => {
    mockMotionAndHardware({ hardwareConcurrency: LOW_HARDWARE_CONCURRENCY_THRESHOLD });

    expect(shouldUseStaggerFadeIn(STAGGER_ROW_LIMIT)).toBe(false);
    expect(getStaggerFadeInStyle(STAGGER_ROW_LIMIT, 'grid')).toBeUndefined();
  });

  it('disables stagger fade-in for reduced-motion users', () => {
    mockMotionAndHardware({ reducedMotion: true });

    expect(shouldUseStaggerFadeIn(0)).toBe(false);
    expect(getStaggerFadeInStyle(0, 'grid')).toBeUndefined();
  });

  it('disables stagger fade-in on low-concurrency hardware', () => {
    mockMotionAndHardware({ hardwareConcurrency: LOW_HARDWARE_CONCURRENCY_THRESHOLD - 1 });

    expect(shouldUseStaggerFadeIn(0)).toBe(false);
    expect(getStaggerFadeInStyle(0, 'grid')).toBeUndefined();
  });
});
