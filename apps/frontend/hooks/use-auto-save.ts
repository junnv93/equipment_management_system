'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebouncedValue } from './use-debounced-value';
import { isConflictError } from '@/lib/api/error';

/** 자동 저장 상태 4-State FSM */
export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'conflict';

export interface UseAutoSaveOptions<T> {
  /** 감시할 값 (react-hook-form watch() 결과 또는 useState 값) */
  value: T;
  /** 실제 저장 함수. 실패 시 throw */
  saveFn: (value: T) => Promise<void>;
  /** 디바운스 딜레이 ms (기본 2000 — 텍스트 폼에 적합) */
  delay?: number;
  /** 409 충돌 발생 시 추가 콜백 (stale 데이터 갱신 등) */
  onConflict?: () => void;
  /**
   * true로 설정하면 초기 마운트 시 자동 저장 트리거 방지.
   * 기본값 true — 폼이 처음 렌더될 때 저장 안 함.
   */
  skipInitial?: boolean;
}

export interface UseAutoSaveReturn {
  /** 현재 자동 저장 상태 */
  status: AutoSaveStatus;
  /** 마지막 저장 완료 시각 (null: 아직 저장 안 됨) */
  lastSavedAt: Date | null;
  /** 수동 즉시 저장 트리거 */
  saveNow: () => Promise<void>;
}

/**
 * 자동 저장 훅 — 4-State FSM (idle/saving/saved/conflict)
 *
 * 값이 변경되면 debounce 후 자동으로 saveFn을 호출한다.
 * AutoSaveStatus 컴포넌트와 함께 사용하면 사용자에게 저장 상태를 시각적으로 알릴 수 있다.
 *
 * @example
 * ```tsx
 * const form = useForm({ defaultValues: { content: draft.content } });
 * const content = form.watch('content');
 *
 * const { status, lastSavedAt, saveNow } = useAutoSave({
 *   value: content,
 *   saveFn: (v) => draftsApi.update(draftId, { content: v }),
 *   onConflict: () => queryClient.invalidateQueries({ queryKey: queryKeys.drafts.detail(draftId) }),
 * });
 *
 * <AutoSaveStatus status={status} lastSavedAt={lastSavedAt} />
 * ```
 */
export function useAutoSave<T>({
  value,
  saveFn,
  delay = 2000,
  onConflict,
  skipInitial = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const debouncedValue = useDebouncedValue(value, delay);

  // Stable refs — refs don't trigger re-render and don't need to be in dep arrays
  const saveFnRef = useRef(saveFn);
  const onConflictRef = useRef(onConflict);
  const skipInitialRef = useRef(skipInitial);
  const isFirstRender = useRef(true);
  const isSaving = useRef(false);
  useEffect(() => {
    saveFnRef.current = saveFn;
    onConflictRef.current = onConflict;
  });

  // 디바운스 완료 시 자동 저장
  useEffect(() => {
    if (skipInitialRef.current && isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 이미 저장 중이면 스킵 (최신 debouncedValue는 다음 변경 시 재시도)
    if (isSaving.current) return;

    const run = async () => {
      isSaving.current = true;
      setStatus('saving');
      try {
        await saveFnRef.current(debouncedValue);
        setStatus('saved');
        setLastSavedAt(new Date());
      } catch (err) {
        if (isConflictError(err)) {
          setStatus('conflict');
          onConflictRef.current?.();
        } else {
          // 비-충돌 에러: idle로 복귀 (재시도 허용)
          setStatus('idle');
        }
      } finally {
        isSaving.current = false;
      }
    };

    void run();
  }, [debouncedValue]);

  const saveNow = useCallback(async () => {
    if (isSaving.current) return;
    isSaving.current = true;
    setStatus('saving');
    try {
      await saveFnRef.current(value);
      setStatus('saved');
      setLastSavedAt(new Date());
    } catch (err) {
      if (isConflictError(err)) {
        setStatus('conflict');
        onConflictRef.current?.();
      } else {
        setStatus('idle');
      }
    } finally {
      isSaving.current = false;
    }
  }, [value]);

  return { status, lastSavedAt, saveNow };
}
