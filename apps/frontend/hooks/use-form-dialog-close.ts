'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Form Dialog Close Guard — Phase 0A-ext SSOT
 *
 * 작성 중 데이터가 있는 form dialog의 cancel/X/Esc 닫기 동작에서
 * 사용자 실수로 인한 데이터 손실을 막는 confirmation 패턴.
 *
 * 설계 원칙 (Plan §6 cross-cutting "3가지 destructive 원칙"):
 * 모든 destructive 동작은 (1) 시각적 마찰 (2) undo (3) 명시적 확인 중 최소 1.
 * 다이얼로그 cancel/X 버튼이 누락된 안전망 — 본 훅으로 통일.
 *
 * SSOT 적용 대상:
 * - InspectionFormDialog (중간점검 작성)
 * - SelfInspectionFormDialog (자체점검 작성/수정)
 * - ResultSectionFormDialog (결과 섹션 편집)
 *
 * 업계 표준: Material Design / Apple HIG의 "Discard changes?" 패턴.
 *
 * @example
 * const close = useFormDialogClose({
 *   isDirty: () => items.length > 0 || resultSections.length > 0,
 *   onConfirmClose: () => onOpenChange(false),
 * });
 *
 * <Dialog open={open} onOpenChange={(o) => !o ? close.requestClose() : onOpenChange(o)}>
 *   <DialogContent onEscapeKeyDown={(e) => { e.preventDefault(); close.requestClose(); }}>
 *     ...
 *     <Button onClick={close.requestClose}>Cancel</Button>
 *   </DialogContent>
 * </Dialog>
 *
 * <AlertDialog open={close.confirmOpen} onOpenChange={(o) => !o && close.cancel()}>
 *   <AlertDialogContent>
 *     <AlertDialogTitle>{t('cancelConfirm.title')}</AlertDialogTitle>
 *     ...
 *     <AlertDialogAction onClick={close.confirm}>...</AlertDialogAction>
 *   </AlertDialogContent>
 * </AlertDialog>
 */

export interface UseFormDialogCloseArgs {
  /**
   * 작성 중 데이터 존재 여부.
   * 함수로 전달 — closure로 최신 state 참조 (re-render 시점 의존성 없음).
   * 반환 true면 닫기 시 confirmation 노출.
   */
  isDirty: () => boolean;
  /**
   * 실제 닫기 동작.
   * 호출자에서 `onOpenChange(false)` 또는 추가 정리 로직 수행.
   */
  onConfirmClose: () => void;
}

export interface UseFormDialogCloseResult {
  /** AlertDialog open 상태 (호출자가 controlled로 사용) */
  confirmOpen: boolean;
  /**
   * 닫기 요청 진입점.
   * - committed=true → confirm 우회 (정상 submit 흐름)
   * - isDirty() === true → confirmation AlertDialog 노출
   * - isDirty() === false → 즉시 onConfirmClose 호출
   */
  requestClose: () => void;
  /** AlertDialog confirm 버튼 클릭 — 실제 닫기 */
  confirm: () => void;
  /** AlertDialog cancel 버튼 / Esc / outside-click — confirmation 닫고 dialog 유지 */
  cancel: () => void;
  /**
   * submit 성공 시 호출 — 다음 requestClose에서 confirm 우회.
   * 사용 예: handleSubmit 마지막에 close.markCommitted() → setFormOpen(false).
   *
   * SSOT: handleSubmit에서 form 직접 비우는 대신 markCommitted 호출 (단순).
   */
  markCommitted: () => void;
}

export function useFormDialogClose(args: UseFormDialogCloseArgs): UseFormDialogCloseResult {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const committedRef = useRef(false);
  const { isDirty, onConfirmClose } = args;

  const requestClose = useCallback(() => {
    // submit 성공 후 닫기 — confirm 우회
    if (committedRef.current) {
      committedRef.current = false;
      onConfirmClose();
      return;
    }
    if (isDirty()) {
      setConfirmOpen(true);
    } else {
      onConfirmClose();
    }
  }, [isDirty, onConfirmClose]);

  const confirm = useCallback(() => {
    onConfirmClose();
    setConfirmOpen(false);
  }, [onConfirmClose]);

  const cancel = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  const markCommitted = useCallback(() => {
    committedRef.current = true;
  }, []);

  return {
    confirmOpen,
    requestClose,
    confirm,
    cancel,
    markCommitted,
  };
}
