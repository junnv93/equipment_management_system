'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Upload, X, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  INSPECTION_SPACING,
  INSPECTION_TABLE,
  INSPECTION_TABLE_PASTE_MODE,
  INSPECTION_KEYBOARD_HINT,
  INSPECTION_TABLE_FOCUS_RING,
  INSPECTION_CELL_PROVENANCE,
  TRANSITION_PRESETS,
  type InspectionPasteMode,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { documentApi } from '@/lib/api/document-api';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DocumentImage from '@/components/shared/DocumentImage';
import type { RichCell } from '@/lib/api/calibration-api';
import { useInspectionForm } from '@/lib/inspection/form-context';
import { useUndoableState } from '@/hooks/use-undoable-state';

// ============================================================================
// Types
// ============================================================================

interface VisualTableEditorProps {
  headers: string[];
  rows: RichCell[][];
  onChange: (headers: string[], rows: RichCell[][]) => void;
  /**
   * Phase 1A-b: 결과 섹션의 sortOrder.
   * InspectionFormContext의 셀 provenance 추적 키로 사용 (prefilled vs user-modified 시각).
   * 부재 시 Context는 NO_OP — 셀 시각 미적용 (graceful fallback).
   */
  sortOrder?: number;
}

interface TableSnapshot {
  headers: string[];
  rows: RichCell[][];
}

const HISTORY_LIMIT = 10;

/**
 * Phase 1A-c: shallow clone (성능 최적화)
 *
 * 모든 mutation(updateCell/addRow/removeRow/etc)은 새 cell/row 객체를 생성하므로
 * cell 자체는 immutable로 취급 가능. deep clone (cell spread) 불필요.
 *
 * Before: 100x10 표 = 1000 cell spread 비용
 * After:  100 row spread만 (cell reference 공유 안전)
 */
const cloneSnapshot = (headers: string[], rows: RichCell[][]): TableSnapshot => ({
  headers: [...headers],
  rows: rows.map((row) => [...row]),
});

const isMacPlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');
};

// ============================================================================
// Component
// ============================================================================

export default function VisualTableEditor({
  headers,
  rows,
  onChange,
  sortOrder,
}: VisualTableEditorProps) {
  const t = useTranslations('calibration.resultSections');
  const { toast } = useToast();
  const [focusedCell, setFocusedCell] = useState<{ r: number; c: number } | null>(null);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  // Phase 1A-b: InspectionFormContext consumer (Provider 부재 시 NO_OP).
  // 셀 단위 provenance(prefilled vs user-modified) 시각 SSOT.
  const inspectionForm = useInspectionForm();
  const isProvenanceTracked = sortOrder !== undefined;
  const trackedSortOrder = sortOrder ?? -1;
  /** 셀 변경 시 Context에 marked — onChange 직전 호출 (idempotent) */
  const markCellModifiedTracked = useCallback(
    (ri: number, ci: number) => {
      if (!isProvenanceTracked) return;
      inspectionForm.markCellModified(trackedSortOrder, ri, ci);
    },
    [isProvenanceTracked, trackedSortOrder, inspectionForm]
  );
  /** 헤더/행/열 구조 변경 시 — 섹션 자체 user-modified로 마킹 */
  const markSectionStructureModified = useCallback(() => {
    if (!isProvenanceTracked) return;
    inspectionForm.markSectionModified(trackedSortOrder);
  }, [isProvenanceTracked, trackedSortOrder, inspectionForm]);

  // ── Phase 0A: Undo/Redo history — useUndoableState 훅으로 위임 ──

  const {
    push: pushHistory,
    undo: undoStructural,
    redo: redoStructural,
    canUndo,
    canRedo,
  } = useUndoableState<TableSnapshot>({
    current: { headers, rows },
    onChange: (snap) => onChange(snap.headers, snap.rows),
    clone: (snap) => cloneSnapshot(snap.headers, snap.rows),
    limit: HISTORY_LIMIT,
    enableKeyboard: true,
  });

  // ── Phase 0A: Paste mode (append default / replace warning) ──

  const [pasteMode, setPasteMode] = useState<InspectionPasteMode>('append');
  const [replaceConfirmText, setReplaceConfirmText] = useState<string | null>(null);

  // ── Phase 0A: Keyboard shortcut hint bar (dismissible per session) ──

  const [hintsDismissed, setHintsDismissed] = useState(false);
  const undoShortcutLabel = useMemo(() => (isMacPlatform() ? '⌘Z' : 'Ctrl+Z'), []);

  // ── Phase 0A: data-cell ref map for keyboard navigation ──

  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const cellKey = (ri: number, ci: number) => `${ri}:${ci}`;

  const focusCell = useCallback((ri: number, ci: number) => {
    const el = cellRefs.current.get(cellKey(ri, ci));
    if (el) {
      el.focus();
      // place caret at end for predictable IME behavior
      const len = el.value.length;
      try {
        el.setSelectionRange(len, len);
      } catch {
        // some inputs don't support setSelectionRange — ignore
      }
    }
  }, []);

  // ── Column operations ──

  const addColumn = useCallback(() => {
    pushHistory();
    markSectionStructureModified();
    const newHeaders = [...headers, ''];
    const newRows = rows.map((row) => [...row, { type: 'text' as const, value: '' }]);
    onChange(newHeaders, newRows);
  }, [headers, rows, onChange, pushHistory, markSectionStructureModified]);

  const removeColumn = useCallback(
    (ci: number) => {
      if (headers.length <= 1) return;
      pushHistory();
      markSectionStructureModified();
      const newHeaders = headers.filter((_, i) => i !== ci);
      const newRows = rows.map((row) => row.filter((_, i) => i !== ci));
      onChange(newHeaders, newRows);
    },
    [headers, rows, onChange, pushHistory, markSectionStructureModified]
  );

  const updateHeader = useCallback(
    (ci: number, value: string) => {
      // 키 입력 단위 — history push 하지 않음 (Excel 패턴 / 디자인 리뷰 b9 "구조적 변경 보호")
      // 헤더 텍스트는 구조적 의미라 변경 시 섹션 user-modified 마킹 (1C SoftFork 트리거 후보)
      markSectionStructureModified();
      const newHeaders = [...headers];
      newHeaders[ci] = value;
      onChange(newHeaders, rows);
    },
    [headers, rows, onChange, markSectionStructureModified]
  );

  // ── Row operations ──

  const addRow = useCallback(() => {
    pushHistory();
    markSectionStructureModified();
    const newRow: RichCell[] = headers.map(() => ({ type: 'text' as const, value: '' }));
    onChange(headers, [...rows, newRow]);
  }, [headers, rows, onChange, pushHistory, markSectionStructureModified]);

  const removeRow = useCallback(
    (ri: number) => {
      pushHistory();
      markSectionStructureModified();
      onChange(
        headers,
        rows.filter((_, i) => i !== ri)
      );
    },
    [headers, rows, onChange, pushHistory, markSectionStructureModified]
  );

  // ── Cell operations ──

  const updateCell = useCallback(
    (ri: number, ci: number, cell: RichCell) => {
      // Phase 1A-b: 셀 변경 → Context에 user-modified 마킹 (idempotent, prefilled section만 추적)
      markCellModifiedTracked(ri, ci);
      const newRows = rows.map((row, r) =>
        r === ri ? row.map((c, i) => (i === ci ? cell : c)) : row
      );
      onChange(headers, newRows);
    },
    [headers, rows, onChange, markCellModifiedTracked]
  );

  const toggleCellToImage = useCallback(
    async (ri: number, ci: number) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.jpg,.jpeg,.png,.gif,.webp';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        try {
          const doc = await documentApi.uploadDocument(file, 'inspection_photo');
          // 셀 타입 변경은 구조적 변경 — undo로 복구 가능해야 함
          pushHistory();
          updateCell(ri, ci, { type: 'image', documentId: doc.id });
        } catch {
          toast({ variant: 'destructive', description: t('toasts.error') });
        }
      };
      input.click();
    },
    [updateCell, pushHistory, t, toast]
  );

  const toggleCellToText = useCallback(
    (ri: number, ci: number) => {
      // 셀 타입 변경은 구조적 변경 — undo로 복구 가능해야 함
      pushHistory();
      updateCell(ri, ci, { type: 'text', value: '' });
    },
    [updateCell, pushHistory]
  );

  // ── Paste fill ──

  /**
   * paste 영역 텍스트 → 헤더 + 행 배열로 파싱.
   * delimiter: 탭 우선, 없으면 콤마.
   */
  const parsePasteText = useCallback(
    (raw: string): { headers: string[]; rows: RichCell[][] } | null => {
      const lines = raw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length === 0) return null;

      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const parsedHeaders = lines[0].split(delimiter).map((h) => h.trim());
      const parsedRows: RichCell[][] = lines
        .slice(1)
        .map((line) =>
          line.split(delimiter).map((v) => ({ type: 'text' as const, value: v.trim() }))
        );

      // Pad rows to match header count
      const colCount = parsedHeaders.length;
      const paddedRows = parsedRows.map((row) => {
        while (row.length < colCount) row.push({ type: 'text', value: '' });
        return row.slice(0, colCount);
      });

      return { headers: parsedHeaders, rows: paddedRows };
    },
    []
  );

  const hasExistingTextData = useCallback(
    (): boolean =>
      rows.some((row) => row.some((cell) => cell.type === 'text' && cell.value.trim() !== '')),
    [rows]
  );

  const applyPasteAppend = useCallback(
    (parsed: { headers: string[]; rows: RichCell[][] }) => {
      pushHistory();
      // append 모드: 기존 헤더 보존, 행만 끝에 추가. 컬럼 수가 다르면 기존 헤더 기준으로 정규화.
      const colCount = headers.length;
      const normalizedRows = parsed.rows.map((row) => {
        const out: RichCell[] = [...row];
        while (out.length < colCount) out.push({ type: 'text', value: '' });
        return out.slice(0, colCount);
      });
      onChange(headers, [...rows, ...normalizedRows]);
      setShowPasteArea(false);
    },
    [headers, rows, onChange, pushHistory]
  );

  const applyPasteReplace = useCallback(
    (parsed: { headers: string[]; rows: RichCell[][] }) => {
      pushHistory();
      onChange(parsed.headers, parsed.rows);
      setShowPasteArea(false);
    },
    [onChange, pushHistory]
  );

  const handlePasteFill = useCallback(
    (raw: string) => {
      const parsed = parsePasteText(raw);
      if (!parsed) return;
      if (pasteMode === 'replace' && hasExistingTextData()) {
        // confirmation 분기 — replace + 기존 데이터 → AlertDialog
        setReplaceConfirmText(raw);
        return;
      }
      if (pasteMode === 'replace') {
        applyPasteReplace(parsed);
      } else {
        applyPasteAppend(parsed);
      }
    },
    [pasteMode, parsePasteText, hasExistingTextData, applyPasteReplace, applyPasteAppend]
  );

  const confirmReplace = useCallback(() => {
    if (replaceConfirmText === null) return;
    const parsed = parsePasteText(replaceConfirmText);
    if (parsed) applyPasteReplace(parsed);
    setReplaceConfirmText(null);
  }, [replaceConfirmText, parsePasteText, applyPasteReplace]);

  const cancelReplace = useCallback(() => setReplaceConfirmText(null), []);

  // ── Phase 0A: 키보드 셀 이동 (Enter / ArrowDown / ArrowUp) ──

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, ri: number, ci: number) => {
      // IME composition 가드 — 한글 합성 중에는 이동 트리거 안 함
      if (e.nativeEvent.isComposing) return;

      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        // submit 차단 + 다음 행 이동
        if (ri < rows.length - 1) {
          focusCell(ri + 1, ci);
        } else {
          // 마지막 행 → addRow 자동 호출 후 새 행으로 focus
          addRow();
          // addRow가 비동기 onChange로 새 row를 추가 → 다음 frame에 focus
          requestAnimationFrame(() => focusCell(ri + 1, ci));
        }
      } else if (e.key === 'ArrowUp') {
        if (ri > 0) {
          e.preventDefault();
          focusCell(ri - 1, ci);
        }
      }
      // 좌우는 브라우저 기본 Tab/Shift+Tab 동작 유지
    },
    [rows.length, focusCell, addRow]
  );

  // ── Render ──

  const replacePreviewCount = rows.filter((row) =>
    row.some((cell) => cell.type === 'text' && cell.value.trim() !== '')
  ).length;

  return (
    <div className={INSPECTION_SPACING.group}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addColumn} className="text-xs">
          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
          {t('form.addColumn')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={addRow} className="text-xs">
          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
          {t('form.addRow')}
        </Button>

        {/* Phase 0A: Undo / Redo */}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={undoStructural}
          disabled={!canUndo}
          aria-label={t('keyboardHints.undo')}
          title={`${t('keyboardHints.undo')} (${undoShortcutLabel})`}
          className="text-xs"
        >
          <Undo2 className="h-3 w-3" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={redoStructural}
          disabled={!canRedo}
          aria-label={t('keyboardHints.redo')}
          title={t('keyboardHints.redo')}
          className="text-xs"
        >
          <Redo2 className="h-3 w-3" aria-hidden="true" />
        </Button>

        {/* Phase 0A: Keyboard hint bar (dismissible) */}
        {!hintsDismissed && (
          <div
            className={cn(INSPECTION_KEYBOARD_HINT.bar, 'ml-auto')}
            role="note"
            aria-label={t('keyboardHints.ariaLabel')}
          >
            <span className={INSPECTION_KEYBOARD_HINT.item}>
              <kbd className={INSPECTION_KEYBOARD_HINT.kbd}>↵</kbd>
              {t('keyboardHints.nextRow')}
            </span>
            <span className={INSPECTION_KEYBOARD_HINT.item}>
              <kbd className={INSPECTION_KEYBOARD_HINT.kbd}>↑↓</kbd>
              {t('keyboardHints.cellNav')}
            </span>
            <span className={INSPECTION_KEYBOARD_HINT.item}>
              <kbd className={INSPECTION_KEYBOARD_HINT.kbd}>{undoShortcutLabel}</kbd>
              {t('keyboardHints.undo')}
            </span>
            <button
              type="button"
              className={INSPECTION_KEYBOARD_HINT.dismissButton}
              onClick={() => setHintsDismissed(true)}
              aria-label={t('keyboardHints.dismiss')}
              title={t('keyboardHints.dismiss')}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        )}

        <Button
          type="button"
          size="sm"
          variant={showPasteArea ? 'default' : 'ghost'}
          onClick={() => {
            setShowPasteArea(!showPasteArea);
            if (!showPasteArea) setTimeout(() => pasteRef.current?.focus(), 50);
          }}
          className="text-xs"
        >
          {t('form.pasteData')}
        </Button>
      </div>

      {/* Paste area (collapsible) */}
      {showPasteArea && (
        <div className={INSPECTION_SPACING.field}>
          {/* Phase 0A: Mode 라디오 (append default / replace warning) */}
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-medium text-muted-foreground">
              {t('pasteMode.groupLabel')}
            </legend>
            <div className={INSPECTION_TABLE_PASTE_MODE.radioGroup}>
              <label className={INSPECTION_TABLE_PASTE_MODE.radioItem}>
                <input
                  type="radio"
                  name="paste-mode"
                  value="append"
                  checked={pasteMode === 'append'}
                  onChange={() => setPasteMode('append')}
                  className="h-3 w-3 cursor-pointer"
                />
                <span
                  className={
                    pasteMode === 'append'
                      ? 'font-medium text-foreground'
                      : INSPECTION_TABLE_PASTE_MODE.appendLabel
                  }
                >
                  {t('pasteMode.appendLabel')}
                </span>
              </label>
              <label className={INSPECTION_TABLE_PASTE_MODE.radioItem}>
                <input
                  type="radio"
                  name="paste-mode"
                  value="replace"
                  checked={pasteMode === 'replace'}
                  onChange={() => setPasteMode('replace')}
                  className="h-3 w-3 cursor-pointer"
                />
                <span
                  className={
                    pasteMode === 'replace'
                      ? INSPECTION_TABLE_PASTE_MODE.replaceLabel
                      : 'text-muted-foreground'
                  }
                >
                  {t('pasteMode.replaceLabel')}
                </span>
              </label>
            </div>
            {pasteMode === 'replace' && replacePreviewCount > 0 && (
              <div
                className={INSPECTION_TABLE_PASTE_MODE.replaceWarning}
                role="status"
                aria-live="polite"
              >
                <span aria-hidden="true">⚠</span>
                {t('pasteMode.replaceWarning', { rowCount: replacePreviewCount })}
              </div>
            )}
          </fieldset>

          <textarea
            ref={pasteRef}
            className="w-full h-24 border rounded-md p-2 font-mono text-xs resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={
              pasteMode === 'replace'
                ? t('pasteMode.replacePlaceholder')
                : t('pasteMode.appendPlaceholder')
            }
            onKeyDown={(e) => {
              // IME 가드 — 합성 중 Cmd/Ctrl+Enter 무시
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handlePasteFill(e.currentTarget.value);
              }
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs-tight text-muted-foreground">
              {t('pasteMode.shortcutHint', {
                shortcut: isMacPlatform() ? '⌘+Enter' : 'Ctrl+Enter',
              })}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowPasteArea(false)}
                className="text-xs"
              >
                {t('form.cancel')}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (pasteRef.current) handlePasteFill(pasteRef.current.value);
                }}
                className="text-xs"
              >
                {t('form.applyPaste')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 0A: Replace 모드 + 기존 데이터 → AlertDialog confirmation */}
      <AlertDialog
        open={replaceConfirmText !== null}
        onOpenChange={(open) => {
          if (!open) cancelReplace();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pasteMode.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('pasteMode.confirmDescription', { rowCount: replacePreviewCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelReplace}>
              {t('pasteMode.confirmCancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReplace}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('pasteMode.confirmAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Visual table grid */}
      <div className={cn(INSPECTION_TABLE.wrapper, 'relative')}>
        <table className="w-full border-collapse">
          {/* Header row */}
          <thead>
            <tr>
              {headers.map((h, ci) => (
                <th
                  key={ci}
                  className="relative group border-b border-r last:border-r-0 bg-muted/50"
                >
                  <Input
                    name={`resultSectionHeader.${ci}`}
                    aria-label={t('form.columnHeaderAriaLabel', { number: ci + 1 })}
                    value={h}
                    onChange={(e) => updateHeader(ci, e.target.value)}
                    placeholder={t('form.defaultColumnHeader', { number: ci + 1 })}
                    className={cn(
                      'border-0 rounded-none bg-transparent text-xs font-semibold h-9 px-2',
                      'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-primary/5'
                    )}
                  />
                  {headers.length > 1 && (
                    // Phase 0B: 항상 노출 + 28×28 hit area (WCAG SC 2.4.7, 디자인 리뷰 b6)
                    <button
                      type="button"
                      onClick={() => removeColumn(ci)}
                      className={cn(
                        'absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center',
                        'rounded-full bg-destructive text-destructive-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/60 focus-visible:ring-offset-1',
                        'hover:scale-110',
                        TRANSITION_PRESETS.fastOpacity
                      )}
                      aria-label={t('form.deleteColumn')}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </th>
              ))}
              <th className="w-12 border-b bg-muted/50" />
            </tr>
          </thead>

          {/* Data rows */}
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={cn(INSPECTION_TABLE.stripe, INSPECTION_TABLE.rowHover)}>
                {row.map((cell, ci) => {
                  // Phase 1A-b: Context에서 셀 provenance 조회 (Provider 부재 시 false 반환)
                  const isPrefilledCell = isProvenanceTracked
                    ? inspectionForm.isPrefilledCell(trackedSortOrder, ri, ci)
                    : false;
                  const isUserModifiedCell = isProvenanceTracked
                    ? inspectionForm.isUserModifiedCell(trackedSortOrder, ri, ci)
                    : false;
                  const provenanceClass = isUserModifiedCell
                    ? INSPECTION_CELL_PROVENANCE.userModified
                    : isPrefilledCell
                      ? INSPECTION_CELL_PROVENANCE.prefilled
                      : INSPECTION_CELL_PROVENANCE.empty;
                  return (
                    <td
                      key={ci}
                      className={cn(
                        'relative border-r last:border-r-0 border-b p-0',
                        // Phase 1A-b: 셀 provenance 시각 (sky/primary left border)
                        provenanceClass,
                        // Phase 0B: focus ring 강화 (WCAG SC 1.4.11, 디자인 리뷰 b6/b11)
                        focusedCell?.r === ri &&
                          focusedCell?.c === ci &&
                          INSPECTION_TABLE_FOCUS_RING.cell
                      )}
                      onClick={() => setFocusedCell({ r: ri, c: ci })}
                    >
                      {/* Phase 1A-b: prefilled 셀 우상단 dot 마이크로 hint */}
                      {isPrefilledCell && (
                        <span
                          className={INSPECTION_CELL_PROVENANCE.prefillDot}
                          aria-hidden="true"
                        />
                      )}
                      {cell.type === 'text' ? (
                        <Input
                          name={`resultSectionCell.${ri}.${ci}`}
                          aria-label={t('form.tableCellAriaLabel', {
                            row: ri + 1,
                            column: ci + 1,
                          })}
                          value={cell.value}
                          onChange={(e) =>
                            updateCell(ri, ci, { type: 'text', value: e.target.value })
                          }
                          onFocus={() => setFocusedCell({ r: ri, c: ci })}
                          onBlur={() => setFocusedCell(null)}
                          // Phase 0A: 키보드 셀 이동 (Enter/↑↓ + IME 가드)
                          onKeyDown={(e) => handleCellKeyDown(e, ri, ci)}
                          // Phase 0A: data-cell attr + ref map 등록
                          data-cell-r={ri}
                          data-cell-c={ci}
                          ref={(el) => {
                            const key = cellKey(ri, ci);
                            if (el) cellRefs.current.set(key, el);
                            else cellRefs.current.delete(key);
                          }}
                          className={cn(
                            'border-0 rounded-none bg-transparent h-9 px-2',
                            'font-mono tabular-nums text-xs',
                            'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-primary/5'
                          )}
                        />
                      ) : (
                        <div className="flex items-center gap-1 px-1 h-9">
                          {cell.documentId ? (
                            <DocumentImage
                              documentId={cell.documentId}
                              alt={t('types.photo')}
                              className="h-7 w-7 rounded object-cover border border-border/60"
                              fallbackClassName="h-7 w-7"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 ml-auto shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCellToText(ri, ci);
                            }}
                            aria-label={t('types.text')}
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        </div>
                      )}

                      {/* Cell context menu: toggle to image */}
                      {cell.type === 'text' && focusedCell?.r === ri && focusedCell?.c === ci && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCellToImage(ri, ci);
                          }}
                          className={cn(
                            'absolute bottom-0 right-0 z-10 h-5 w-5 rounded-tl-md',
                            'bg-muted/80 hover:bg-primary/10 flex items-center justify-center',
                            TRANSITION_PRESETS.fastBg
                          )}
                          title={t('types.photo')}
                          aria-label={t('types.photo')}
                        >
                          <Upload
                            className="h-2.5 w-2.5 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    </td>
                  );
                })}

                {/* Row delete button — Phase 0A: hit area 48×48 (WCAG SC 2.5.5, 디자인 리뷰 b6) */}
                <td className="w-12 border-b text-center align-middle p-0">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 text-muted-foreground hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive/60"
                    onClick={() => removeRow(ri)}
                    aria-label={t('form.deleteRow')}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            ))}

            {/* Empty state */}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
                  {t('form.addRow')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
