'use client';

import { useEffect } from 'react';
import type { ApprovalItem } from '@/lib/api/approvals-api';

interface UseApprovalKeyboardOptions {
  items: ApprovalItem[];
  activeItemId: string | null;
  onSelectItem: (item: ApprovalItem) => void;
  onApprove: (item: ApprovalItem) => void;
  onReject: (item: ApprovalItem) => void;
  onToggleSelect: (id: string) => void;
  onClearActive: () => void;
  /** xl 이상에서만 활성화 (Split View) */
  enabled: boolean;
}

/**
 * 승인 Triage 키보드 내비게이션 훅
 *
 * - ↑↓: 이전/다음 항목 선택
 * - A: 현재 항목 승인
 * - R: 현재 항목 반려
 * - Space: 현재 항목 체크박스 토글
 * - Escape: 상세 패널 닫기
 *
 * Input/Textarea 포커스 시 비활성화
 */
export function useApprovalKeyboard({
  items,
  activeItemId,
  onSelectItem,
  onApprove,
  onReject,
  onToggleSelect,
  onClearActive,
  enabled,
}: UseApprovalKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // input, textarea, select, contenteditable, dialog 내부에서는 비활성화
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('[role="dialog"]')
      ) {
        return;
      }

      const currentIndex = activeItemId ? items.findIndex((item) => item.id === activeItemId) : -1;

      switch (e.key) {
        case 'ArrowDown':
        case 'j': {
          e.preventDefault();
          const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : currentIndex;
          if (items[nextIndex]) onSelectItem(items[nextIndex]);
          break;
        }

        case 'ArrowUp':
        case 'k': {
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
          if (items[prevIndex]) onSelectItem(items[prevIndex]);
          break;
        }

        case 'a':
        case 'A': {
          if (activeItemId && items[currentIndex]) {
            e.preventDefault();
            onApprove(items[currentIndex]);
          }
          break;
        }

        case 'r':
        case 'R': {
          if (activeItemId && items[currentIndex]) {
            e.preventDefault();
            onReject(items[currentIndex]);
          }
          break;
        }

        case ' ': {
          const isInteractive = target.closest('button, [role="button"], [role="checkbox"], a');
          if (activeItemId && !isInteractive) {
            e.preventDefault();
            onToggleSelect(activeItemId);
          }
          break;
        }

        case 'Escape': {
          e.preventDefault();
          onClearActive();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    items,
    activeItemId,
    onSelectItem,
    onApprove,
    onReject,
    onToggleSelect,
    onClearActive,
  ]);
}
