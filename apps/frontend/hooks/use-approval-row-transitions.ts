import { useState, useCallback, useEffect, useRef } from 'react';
import { APPROVAL_MOTION } from '@/lib/design-tokens';

/**
 * 승인/반려 행 전환 애니메이션 상태 머신
 *
 * processingIds: 처리 중(스피너), exitingIds: exit 애니메이션 중.
 * setTimeout cleanup이 이 훅 내부에서만 발생 — 4개 mutation에 흩어진 중복 제거.
 * unmount 시 pendingTimers를 전부 clearTimeout — 메모리 누수 방지.
 */
export function useApprovalRowTransitions() {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [exitingIds, setExitingIds] = useState<Map<string, 'success' | 'reject'>>(new Map());

  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    // ref 배열 참조를 effect 내부에 캡처 — 동일 배열 객체를 가리킴 (exhaustive-deps 준수)
    const timers = pendingTimers.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const startProcessing = useCallback((id: string) => {
    setProcessingIds((prev) => new Set(prev).add(id));
  }, []);

  const startProcessingMany = useCallback((ids: string[]) => {
    setProcessingIds((prev) => new Set([...prev, ...ids]));
  }, []);

  const completeTransition = useCallback((id: string, outcome: 'success' | 'reject') => {
    setProcessingIds((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
    setExitingIds((prev) => new Map(prev).set(id, outcome));
    const timerId = setTimeout(() => {
      setExitingIds((prev) => {
        const m = new Map(prev);
        m.delete(id);
        return m;
      });
    }, APPROVAL_MOTION.exitDurationMs);
    pendingTimers.current.push(timerId);
  }, []);

  const completeTransitionMany = useCallback((ids: string[], outcome: 'success' | 'reject') => {
    setProcessingIds((prev) => {
      const s = new Set(prev);
      ids.forEach((id) => s.delete(id));
      return s;
    });
    setExitingIds((prev) => {
      const m = new Map(prev);
      ids.forEach((id) => m.set(id, outcome));
      return m;
    });
    const timerId = setTimeout(() => {
      setExitingIds((prev) => {
        const m = new Map(prev);
        ids.forEach((id) => m.delete(id));
        return m;
      });
    }, APPROVAL_MOTION.exitDurationMs);
    pendingTimers.current.push(timerId);
  }, []);

  const cancelProcessing = useCallback((id: string) => {
    setProcessingIds((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
  }, []);

  const cancelProcessingMany = useCallback((ids: string[]) => {
    setProcessingIds((prev) => {
      const s = new Set(prev);
      ids.forEach((id) => s.delete(id));
      return s;
    });
  }, []);

  return {
    processingIds,
    exitingIds,
    startProcessing,
    startProcessingMany,
    completeTransition,
    completeTransitionMany,
    cancelProcessing,
    cancelProcessingMany,
  };
}
