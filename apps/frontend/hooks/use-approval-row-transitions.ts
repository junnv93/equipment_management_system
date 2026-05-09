import { useState, useCallback } from 'react';
import { APPROVAL_MOTION } from '@/lib/design-tokens';
import { useSafeTimeout } from '@/hooks/use-safe-timeout';

/**
 * 승인/반려 행 전환 애니메이션 상태 머신
 *
 * processingIds: 처리 중(스피너), exitingIds: exit 애니메이션 중.
 * 타이머 정리는 useSafeTimeout SSOT에 위임 — unmount 시 자동 clearTimeout.
 */
export function useApprovalRowTransitions() {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [exitingIds, setExitingIds] = useState<Map<string, 'success' | 'reject'>>(new Map());

  const setSafeTimeout = useSafeTimeout();

  const startProcessing = useCallback((id: string) => {
    setProcessingIds((prev) => new Set(prev).add(id));
  }, []);

  const startProcessingMany = useCallback((ids: string[]) => {
    setProcessingIds((prev) => new Set([...prev, ...ids]));
  }, []);

  const completeTransition = useCallback(
    (id: string, outcome: 'success' | 'reject') => {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
      setExitingIds((prev) => new Map(prev).set(id, outcome));
      setSafeTimeout(() => {
        setExitingIds((prev) => {
          const m = new Map(prev);
          m.delete(id);
          return m;
        });
      }, APPROVAL_MOTION.exitDurationMs);
    },
    [setSafeTimeout]
  );

  const completeTransitionMany = useCallback(
    (ids: string[], outcome: 'success' | 'reject') => {
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
      setSafeTimeout(() => {
        setExitingIds((prev) => {
          const m = new Map(prev);
          ids.forEach((id) => m.delete(id));
          return m;
        });
      }, APPROVAL_MOTION.exitDurationMs);
    },
    [setSafeTimeout]
  );

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
