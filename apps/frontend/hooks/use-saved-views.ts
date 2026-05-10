'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { useToast } from '@/components/ui/use-toast';
import {
  MAX_VIEWS,
  getSavedViews,
  saveSavedView,
  deleteSavedView,
  reorderSavedViews,
  type SavedView,
} from '@/lib/checkouts/saved-views';

/**
 * 커스텀 Saved Views 관리 훅.
 *
 * - max 5개 초과 시 toast 안내
 * - 삭제, 재정렬(↑↓ 키보드) 지원
 * - SSR safe: getSavedViews()는 typeof window 가드 내장
 */
export function useSavedViews() {
  const [views, setViews] = useState<SavedView[]>(() => getSavedViews());
  const { toast } = useToast();
  const t = useTranslations('checkouts.savedViews');

  const addView = useCallback(
    (name: string, params: string): boolean => {
      if (views.length >= MAX_VIEWS) {
        toast({ description: t('maxReached', { max: MAX_VIEWS }), variant: 'destructive' });
        return false;
      }
      const saved = saveSavedView({ name, params });
      if (!saved) {
        toast({ description: t('saveError'), variant: 'destructive' });
        return false;
      }
      setViews((prev) => [...prev, saved]);
      return true;
    },
    [views.length, toast, t]
  );

  const removeView = useCallback((id: string) => {
    deleteSavedView(id);
    setViews((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const moveView = useCallback((id: string, direction: 'up' | 'down') => {
    setViews((prev) => {
      const index = prev.findIndex((v) => v.id === id);
      if (index === -1) return prev;
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      reorderSavedViews(next);
      return next;
    });
  }, []);

  return { views, addView, removeView, moveView };
}
