'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Bookmark, BookmarkPlus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSavedViews } from '@/hooks/use-saved-views';
import { SaveViewDialog } from './SaveViewDialog';
import type { SavedView } from '@/lib/checkouts/saved-views';

export function SavedViewsToolbar() {
  const t = useTranslations('checkouts.savedViews');
  const { views, addView, removeView, moveView } = useSavedViews();
  const [dialogOpen, setDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /** 현재 URL params (저장 시 스냅샷) */
  const currentParams = searchParams.toString();

  /** 드래그 상태 */
  const dragSrcIndex = useRef<number | null>(null);

  const handleViewClick = useCallback(
    (view: SavedView) => {
      startTransition(() => {
        router.push(`?${view.params}`, { scroll: false });
      });
    },
    [router]
  );

  const handleSave = useCallback(
    (name: string, params: string): boolean => addView(name, params),
    [addView]
  );

  /* ── Keyboard handlers ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLLIElement>, view: SavedView, _index: number) => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveView(view.id, 'up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveView(view.id, 'down');
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleViewClick(view);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeView(view.id);
      }
    },
    [moveView, handleViewClick, removeView]
  );

  /* ── HTML5 drag handlers ── */
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    dragSrcIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetIndex: number) => {
    e.preventDefault();
    const srcIndex = dragSrcIndex.current;
    if (srcIndex === null || srcIndex === targetIndex) return;
    dragSrcIndex.current = null;

    const srcView = views[srcIndex];
    if (!srcView) return;

    const direction = srcIndex < targetIndex ? 'down' : 'up';
    const steps = Math.abs(srcIndex - targetIndex);
    for (let i = 0; i < steps; i++) {
      moveView(srcView.id, direction);
    }
  };

  const handleDragEnd = () => {
    dragSrcIndex.current = null;
  };

  if (views.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="text-xs text-muted-foreground">{t('noViews')}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => setDialogOpen(true)}
          aria-label={t('saveButton')}
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
          {t('saveButton')}
        </Button>

        <SaveViewDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentParams={currentParams}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 px-4 py-2">
      <Bookmark className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />

      <ul
        role="listbox"
        aria-label={t('title')}
        aria-orientation="horizontal"
        className="flex flex-1 flex-wrap gap-1.5"
      >
        {views.map((view, index) => (
          <li
            key={view.id}
            role="option"
            aria-selected={false}
            tabIndex={0}
            draggable
            aria-roledescription="draggable item"
            onKeyDown={(e) => handleKeyDown(e, view, index)}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'group flex cursor-pointer items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs transition-colors',
              'hover:border-foreground/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isPending && 'pointer-events-none opacity-50'
            )}
          >
            <GripVertical
              className="h-3 w-3 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground"
              aria-hidden="true"
            />
            <button
              type="button"
              className="max-w-[120px] truncate focus:outline-none"
              onClick={() => handleViewClick(view)}
              tabIndex={-1}
            >
              {view.name}
            </button>

            {/* 키보드 정렬 버튼 */}
            <div className="ml-1 hidden items-center gap-0.5 group-focus-within:flex group-hover:flex">
              <button
                type="button"
                tabIndex={-1}
                disabled={index === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  moveView(view.id, 'up');
                }}
                aria-label={t('moveUp')}
                className="rounded p-0.5 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronUp className="h-2.5 w-2.5" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                disabled={index === views.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  moveView(view.id, 'down');
                }}
                aria-label={t('moveDown')}
                className="rounded p-0.5 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronDown className="h-2.5 w-2.5" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  removeView(view.id);
                }}
                aria-label={t('deleteButton')}
                className="rounded p-0.5 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 shrink-0 gap-1.5 text-xs"
        onClick={() => setDialogOpen(true)}
        aria-label={t('saveButton')}
      >
        <BookmarkPlus className="h-3.5 w-3.5" />
        {t('saveButton')}
      </Button>

      <SaveViewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentParams={currentParams}
        onSave={handleSave}
      />
    </div>
  );
}
