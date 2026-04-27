'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { INSPECTION_SPACING, INSPECTION_TABLE, TRANSITION_PRESETS } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { documentApi } from '@/lib/api/document-api';
import { useToast } from '@/components/ui/use-toast';
import DocumentImage from '@/components/shared/DocumentImage';
import type { RichCell } from '@/lib/api/calibration-api';

// ============================================================================
// Types
// ============================================================================

interface VisualTableEditorProps {
  headers: string[];
  rows: RichCell[][];
  onChange: (headers: string[], rows: RichCell[][]) => void;
}

// ============================================================================
// Component
// ============================================================================

export default function VisualTableEditor({ headers, rows, onChange }: VisualTableEditorProps) {
  const t = useTranslations('calibration.resultSections');
  const { toast } = useToast();
  const [focusedCell, setFocusedCell] = useState<{ r: number; c: number } | null>(null);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  // ── Column operations ──

  const addColumn = useCallback(() => {
    const newHeaders = [...headers, ''];
    const newRows = rows.map((row) => [...row, { type: 'text' as const, value: '' }]);
    onChange(newHeaders, newRows);
  }, [headers, rows, onChange]);

  const removeColumn = useCallback(
    (ci: number) => {
      if (headers.length <= 1) return;
      const newHeaders = headers.filter((_, i) => i !== ci);
      const newRows = rows.map((row) => row.filter((_, i) => i !== ci));
      onChange(newHeaders, newRows);
    },
    [headers, rows, onChange]
  );

  const updateHeader = useCallback(
    (ci: number, value: string) => {
      const newHeaders = [...headers];
      newHeaders[ci] = value;
      onChange(newHeaders, rows);
    },
    [headers, rows, onChange]
  );

  // ── Row operations ──

  const addRow = useCallback(() => {
    const newRow: RichCell[] = headers.map(() => ({ type: 'text' as const, value: '' }));
    onChange(headers, [...rows, newRow]);
  }, [headers, rows, onChange]);

  const removeRow = useCallback(
    (ri: number) => {
      onChange(
        headers,
        rows.filter((_, i) => i !== ri)
      );
    },
    [headers, rows, onChange]
  );

  // ── Cell operations ──

  const updateCell = useCallback(
    (ri: number, ci: number, cell: RichCell) => {
      const newRows = rows.map((row, r) =>
        r === ri ? row.map((c, i) => (i === ci ? cell : c)) : row
      );
      onChange(headers, newRows);
    },
    [headers, rows, onChange]
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
          updateCell(ri, ci, { type: 'image', documentId: doc.id });
        } catch {
          toast({ variant: 'destructive', description: t('toasts.error') });
        }
      };
      input.click();
    },
    [updateCell, t, toast]
  );

  const toggleCellToText = useCallback(
    (ri: number, ci: number) => {
      updateCell(ri, ci, { type: 'text', value: '' });
    },
    [updateCell]
  );

  // ── Paste fill ──

  const handlePasteFill = useCallback(
    (raw: string) => {
      const lines = raw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length === 0) return;

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

      onChange(parsedHeaders, paddedRows);
      setShowPasteArea(false);
    },
    [onChange]
  );

  // ── Render ──

  return (
    <div className={INSPECTION_SPACING.group}>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addColumn} className="text-xs">
          <Plus className="h-3 w-3 mr-1" />
          {t('form.addColumn')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={addRow} className="text-xs">
          <Plus className="h-3 w-3 mr-1" />
          {t('form.addRow')}
        </Button>
        <div className="flex-1" />
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
          <textarea
            ref={pasteRef}
            className="w-full h-24 border rounded-md p-2 font-mono text-xs resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Freq (GHz)&#9;Gain (dB)&#9;Spec&#10;1.0&#9;44.12&#9;45 ± 2.5"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handlePasteFill(e.currentTarget.value);
              }
            }}
          />
          <div className="flex justify-end gap-2">
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
      )}

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
                    value={h}
                    onChange={(e) => updateHeader(ci, e.target.value)}
                    placeholder={`Col ${ci + 1}`}
                    className={cn(
                      'border-0 rounded-none bg-transparent text-xs font-semibold h-9 px-2',
                      'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-primary/5'
                    )}
                  />
                  {headers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColumn(ci)}
                      className={cn(
                        'absolute -top-1 -right-1 z-10 h-4 w-4 rounded-full bg-destructive text-destructive-foreground',
                        'flex items-center justify-center opacity-0 group-hover:opacity-100',
                        TRANSITION_PRESETS.fastOpacity
                      )}
                      aria-label={t('deleteSection')}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </th>
              ))}
              <th className="w-8 border-b bg-muted/50" />
            </tr>
          </thead>

          {/* Data rows */}
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={cn(INSPECTION_TABLE.stripe, INSPECTION_TABLE.rowHover)}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      'relative border-r last:border-r-0 border-b p-0',
                      focusedCell?.r === ri &&
                        focusedCell?.c === ci &&
                        'ring-2 ring-inset ring-primary/40'
                    )}
                    onClick={() => setFocusedCell({ r: ri, c: ci })}
                  >
                    {cell.type === 'text' ? (
                      <Input
                        value={cell.value}
                        onChange={(e) =>
                          updateCell(ri, ci, { type: 'text', value: e.target.value })
                        }
                        onFocus={() => setFocusedCell({ r: ri, c: ci })}
                        onBlur={() => setFocusedCell(null)}
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
                          <X className="h-3 w-3" />
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
                      >
                        <Upload className="h-2.5 w-2.5 text-muted-foreground" />
                      </button>
                    )}
                  </td>
                ))}

                {/* Row delete button */}
                <td className="w-8 border-b text-center">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(ri)}
                    aria-label={t('form.deleteRow')}
                  >
                    <Trash2 className="h-3 w-3" />
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
