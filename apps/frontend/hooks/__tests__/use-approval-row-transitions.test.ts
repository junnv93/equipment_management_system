/**
 * use-approval-row-transitions — 승인 행 전환 상태 머신 테스트
 *
 * 검증 범위:
 * 1. startProcessing / startProcessingMany — processingIds Set 갱신
 * 2. completeTransition / completeTransitionMany — processingIds 제거 + exitingIds 추가
 * 3. cancelProcessing / cancelProcessingMany — processingIds만 제거
 * 4. setTimeout 후 exitingIds 자동 클리어 (jest.useFakeTimers)
 */

import { renderHook, act } from '@testing-library/react';
import { useApprovalRowTransitions } from '../use-approval-row-transitions';

// APPROVAL_MOTION.exitDurationMs = 600ms
jest.mock('@/lib/design-tokens', () => ({
  APPROVAL_MOTION: { exitDurationMs: 600 },
}));

describe('useApprovalRowTransitions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('초기 상태는 processingIds, exitingIds 모두 빈 컬렉션', () => {
    const { result } = renderHook(() => useApprovalRowTransitions());
    expect(result.current.processingIds.size).toBe(0);
    expect(result.current.exitingIds.size).toBe(0);
  });

  it('startProcessing — 단일 id를 processingIds에 추가', () => {
    const { result } = renderHook(() => useApprovalRowTransitions());
    act(() => {
      result.current.startProcessing('id-1');
    });
    expect(result.current.processingIds.has('id-1')).toBe(true);
    expect(result.current.processingIds.size).toBe(1);
  });

  it('startProcessingMany — 복수 id를 processingIds에 추가', () => {
    const { result } = renderHook(() => useApprovalRowTransitions());
    act(() => {
      result.current.startProcessingMany(['id-a', 'id-b', 'id-c']);
    });
    expect(result.current.processingIds.has('id-a')).toBe(true);
    expect(result.current.processingIds.has('id-b')).toBe(true);
    expect(result.current.processingIds.has('id-c')).toBe(true);
  });

  it('completeTransition — processingIds 제거 + exitingIds 추가 + 600ms 후 자동 클리어', () => {
    const { result } = renderHook(() => useApprovalRowTransitions());

    act(() => {
      result.current.startProcessing('id-1');
    });
    act(() => {
      result.current.completeTransition('id-1', 'success');
    });

    expect(result.current.processingIds.has('id-1')).toBe(false);
    expect(result.current.exitingIds.get('id-1')).toBe('success');

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(result.current.exitingIds.has('id-1')).toBe(false);
  });

  it('completeTransition — reject outcome도 동일하게 동작', () => {
    const { result } = renderHook(() => useApprovalRowTransitions());
    act(() => {
      result.current.startProcessing('id-2');
      result.current.completeTransition('id-2', 'reject');
    });
    expect(result.current.exitingIds.get('id-2')).toBe('reject');
  });

  it('completeTransitionMany — 복수 id를 일괄 처리', () => {
    const { result } = renderHook(() => useApprovalRowTransitions());
    act(() => {
      result.current.startProcessingMany(['id-x', 'id-y']);
      result.current.completeTransitionMany(['id-x', 'id-y'], 'success');
    });
    expect(result.current.processingIds.has('id-x')).toBe(false);
    expect(result.current.processingIds.has('id-y')).toBe(false);
    expect(result.current.exitingIds.get('id-x')).toBe('success');
    expect(result.current.exitingIds.get('id-y')).toBe('success');

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(result.current.exitingIds.size).toBe(0);
  });

  it('cancelProcessing — processingIds만 제거 (exitingIds 변경 없음)', () => {
    const { result } = renderHook(() => useApprovalRowTransitions());
    act(() => {
      result.current.startProcessing('id-err');
      result.current.cancelProcessing('id-err');
    });
    expect(result.current.processingIds.has('id-err')).toBe(false);
    expect(result.current.exitingIds.size).toBe(0);
  });

  it('cancelProcessingMany — 복수 id 일괄 취소', () => {
    const { result } = renderHook(() => useApprovalRowTransitions());
    act(() => {
      result.current.startProcessingMany(['id-e1', 'id-e2']);
      result.current.cancelProcessingMany(['id-e1', 'id-e2']);
    });
    expect(result.current.processingIds.size).toBe(0);
  });

  it('completeTransition 중 타이머 미경과 시 exitingIds는 유지됨', () => {
    const { result } = renderHook(() => useApprovalRowTransitions());
    act(() => {
      result.current.startProcessing('id-timer');
      result.current.completeTransition('id-timer', 'success');
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.exitingIds.has('id-timer')).toBe(true);
  });
});
