/**
 * use-count-up 단위 테스트
 *
 * RAF 기반이므로 fake timer + requestAnimationFrame 모킹 사용.
 * prefers-reduced-motion 분기를 별도 모킹으로 검증.
 */

import { renderHook, act } from '@testing-library/react';
import { useCountUp } from '../use-count-up';

// usePrefersReducedMotion 모킹
jest.mock('../use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: jest.fn(() => false),
}));

import { usePrefersReducedMotion } from '../use-prefers-reduced-motion';
const mockUsePrefersReducedMotion = usePrefersReducedMotion as jest.MockedFunction<
  typeof usePrefersReducedMotion
>;

// performance.now 및 requestAnimationFrame 모킹
let currentTime = 0;
const rafCallbacks: FrameRequestCallback[] = [];

beforeEach(() => {
  currentTime = 0;
  rafCallbacks.length = 0;
  mockUsePrefersReducedMotion.mockReturnValue(false);

  jest.spyOn(performance, 'now').mockImplementation(() => currentTime);

  jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return rafCallbacks.length;
  });

  jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

function flushRaf(advanceMs: number) {
  currentTime += advanceMs;
  const cbs = [...rafCallbacks];
  rafCallbacks.length = 0;
  cbs.forEach((cb) => cb(currentTime));
}

describe('useCountUp', () => {
  it('target: 초기값 즉시 반환', () => {
    const { result } = renderHook(() => useCountUp({ target: 100 }));
    expect(result.current).toBe(100);
  });

  it('duration: 800ms 후 target 도달', () => {
    const { result } = renderHook(() => useCountUp({ target: 50, duration: 800 }));

    act(() => flushRaf(800));
    expect(result.current).toBe(50);
  });

  it('precision: 소수점 자리 적용', () => {
    const { result } = renderHook(() => useCountUp({ target: 75.5, duration: 100, precision: 1 }));

    act(() => flushRaf(100));
    expect(result.current).toBe(75.5);
  });

  it('reducedMotion: 즉시 target 반영 (RAF 없음)', () => {
    mockUsePrefersReducedMotion.mockReturnValue(true);

    const { result } = renderHook(() => useCountUp({ target: 200 }));
    expect(result.current).toBe(200);
  });
});
