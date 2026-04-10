'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ImageIcon, Type } from 'lucide-react';
import type { ResultSection, CreateResultSectionDto, RichCell } from '@/lib/api/calibration-api';
import { INSPECTION_RESULT_SECTION_TYPE_VALUES } from '@equipment-management/schemas';

interface RichTableRow {
  cells: Array<RichCell>;
}

interface ResultSectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (dto: CreateResultSectionDto) => void;
  editTarget?: ResultSection | null;
  nextSortOrder: number;
  isSubmitting?: boolean;
}

export default function ResultSectionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  editTarget,
  nextSortOrder,
  isSubmitting,
}: ResultSectionFormDialogProps) {
  const t = useTranslations('calibration.resultSections');

  const [sectionType, setSectionType] = useState<string>(editTarget?.sectionType ?? 'title');
  const [title, setTitle] = useState(editTarget?.title ?? '');
  const [content, setContent] = useState(editTarget?.content ?? '');
  const [pasteData, setPasteData] = useState('');
  const [documentId, setDocumentId] = useState(editTarget?.documentId ?? '');
  const [imageWidthCm, setImageWidthCm] = useState(Number(editTarget?.imageWidthCm) || 12);
  const [imageHeightCm, setImageHeightCm] = useState(Number(editTarget?.imageHeightCm) || 9);

  // rich_table 상태
  const defaultRichHeaders = editTarget?.richTableData?.headers ?? [''];
  const defaultRichRows: RichTableRow[] = editTarget?.richTableData?.rows.map((r) => ({
    cells: r,
  })) ?? [{ cells: [{ type: 'text' as const, value: '' }] }];
  const [richHeaders, setRichHeaders] = useState<string[]>(defaultRichHeaders);
  const [richRows, setRichRows] = useState<RichTableRow[]>(defaultRichRows);

  // 편집 대상 변경 시 폼 초기화
  const resetForm = useCallback(() => {
    setSectionType(editTarget?.sectionType ?? 'title');
    setTitle(editTarget?.title ?? '');
    setContent(editTarget?.content ?? '');
    setPasteData('');
    setDocumentId(editTarget?.documentId ?? '');
    setImageWidthCm(Number(editTarget?.imageWidthCm) || 12);
    setImageHeightCm(Number(editTarget?.imageHeightCm) || 9);
    setRichHeaders(editTarget?.richTableData?.headers ?? ['']);
    setRichRows(
      editTarget?.richTableData?.rows.map((r) => ({ cells: r })) ?? [
        { cells: [{ type: 'text' as const, value: '' }] },
      ]
    );
  }, [editTarget]);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const parseTableData = (raw: string): { headers: string[]; rows: string[][] } | null => {
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return null;
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map((h) => h.trim());
    const rows = lines.slice(1).map((line) => line.split(delimiter).map((c) => c.trim()));
    return { headers, rows };
  };

  const handleSubmit = () => {
    const dto: CreateResultSectionDto = {
      sortOrder: editTarget ? editTarget.sortOrder : nextSortOrder,
      sectionType,
    };

    if (title) dto.title = title;

    switch (sectionType) {
      case 'text':
        dto.content = content;
        break;
      case 'data_table': {
        // 편집 모드에서 pasteData가 비어있으면 기존 tableData 유지
        if (pasteData) {
          const parsed = parseTableData(pasteData);
          if (parsed) dto.tableData = parsed;
        } else if (editTarget?.tableData) {
          dto.tableData = editTarget.tableData;
        }
        break;
      }
      case 'photo':
        if (documentId) dto.documentId = documentId;
        dto.imageWidthCm = imageWidthCm;
        dto.imageHeightCm = imageHeightCm;
        break;
      case 'rich_table':
        dto.richTableData = {
          headers: richHeaders.filter((h) => h.trim()),
          rows: richRows.map((row) => row.cells),
        };
        break;
    }

    onSubmit(dto);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editTarget ? t('editSection') : t('addSection')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 섹션 유형 선택 */}
          {!editTarget && (
            <div className="space-y-2">
              <Label>{t('form.sectionType')}</Label>
              <Select value={sectionType} onValueChange={setSectionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSPECTION_RESULT_SECTION_TYPE_VALUES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 제목 (모든 타입) */}
          <div className="space-y-2">
            <Label>{t('form.sectionTitle')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* 타입별 추가 필드 */}
          {sectionType === 'text' && (
            <div className="space-y-2">
              <Label>{t('form.content')}</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
            </div>
          )}

          {sectionType === 'data_table' && (
            <div className="space-y-2">
              <Label>{t('form.pasteData')}</Label>
              <Textarea
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                rows={8}
                placeholder="Freq (GHz)\tGain (dB)\tSpec\n1.0\t44.12\t45 ± 2.5"
                className="font-mono text-xs"
              />
              {pasteData &&
                (() => {
                  const parsed = parseTableData(pasteData);
                  if (!parsed) return null;
                  return (
                    <div className="rounded border p-2 text-xs">
                      <p className="mb-1 font-semibold">{t('form.sectionTitle')}:</p>
                      <p>
                        {parsed.headers.join(' | ')} ({parsed.rows.length})
                      </p>
                    </div>
                  );
                })()}
            </div>
          )}

          {sectionType === 'photo' && (
            <>
              <div className="space-y-2">
                <Label>{t('form.selectFile')}</Label>
                <Input
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  placeholder="UUID"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('form.imageWidth')}</Label>
                  <Input
                    type="number"
                    value={imageWidthCm}
                    onChange={(e) => setImageWidthCm(Number(e.target.value))}
                    min={1}
                    max={30}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('form.imageHeight')}</Label>
                  <Input
                    type="number"
                    value={imageHeightCm}
                    onChange={(e) => setImageHeightCm(Number(e.target.value))}
                    min={1}
                    max={30}
                  />
                </div>
              </div>
            </>
          )}

          {sectionType === 'rich_table' && (
            <div className="space-y-3">
              {/* 헤더 편집 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('form.sectionTitle')}</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRichHeaders([...richHeaders, '']);
                      setRichRows(
                        richRows.map((row) => ({
                          cells: [...row.cells, { type: 'text' as const, value: '' }],
                        }))
                      );
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {t('form.sectionTitle')}
                  </Button>
                </div>
                <div className="flex gap-1">
                  {richHeaders.map((h, hi) => (
                    <Input
                      key={hi}
                      value={h}
                      onChange={(e) => {
                        const next = [...richHeaders];
                        next[hi] = e.target.value;
                        setRichHeaders(next);
                      }}
                      placeholder={`Col ${hi + 1}`}
                      className="text-xs"
                    />
                  ))}
                </div>
              </div>

              {/* 행 편집 */}
              <div className="space-y-2">
                {richRows.map((row, ri) => (
                  <div key={ri} className="flex items-start gap-1">
                    {row.cells.map((cell, ci) => (
                      <div key={ci} className="flex-1 space-y-1">
                        <div className="flex gap-0.5">
                          <Button
                            type="button"
                            size="icon"
                            variant={cell.type === 'text' ? 'default' : 'outline'}
                            className="h-6 w-6"
                            onClick={() => {
                              const nextRows = [...richRows];
                              nextRows[ri] = {
                                cells: nextRows[ri].cells.map((c, i) =>
                                  i === ci ? { type: 'text' as const, value: '' } : c
                                ),
                              };
                              setRichRows(nextRows);
                            }}
                            aria-label={t('types.text')}
                          >
                            <Type className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant={cell.type === 'image' ? 'default' : 'outline'}
                            className="h-6 w-6"
                            onClick={() => {
                              const nextRows = [...richRows];
                              nextRows[ri] = {
                                cells: nextRows[ri].cells.map((c, i) =>
                                  i === ci ? { type: 'image' as const, documentId: '' } : c
                                ),
                              };
                              setRichRows(nextRows);
                            }}
                            aria-label={t('types.photo')}
                          >
                            <ImageIcon className="h-3 w-3" />
                          </Button>
                        </div>
                        {cell.type === 'text' ? (
                          <Input
                            value={cell.value}
                            onChange={(e) => {
                              const nextRows = [...richRows];
                              nextRows[ri] = {
                                cells: nextRows[ri].cells.map((c, i) =>
                                  i === ci ? { ...c, value: e.target.value } : c
                                ),
                              };
                              setRichRows(nextRows);
                            }}
                            className="text-xs"
                            placeholder={richHeaders[ci] || ''}
                          />
                        ) : (
                          <Input
                            value={cell.type === 'image' ? cell.documentId : ''}
                            onChange={(e) => {
                              const nextRows = [...richRows];
                              nextRows[ri] = {
                                cells: nextRows[ri].cells.map((c, i) =>
                                  i === ci
                                    ? { type: 'image' as const, documentId: e.target.value }
                                    : c
                                ),
                              };
                              setRichRows(nextRows);
                            }}
                            className="text-xs"
                            placeholder="Document UUID"
                          />
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="mt-7 h-6 w-6 text-destructive"
                      onClick={() => setRichRows(richRows.filter((_, i) => i !== ri))}
                      aria-label={t('deleteSection')}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setRichRows([
                      ...richRows,
                      {
                        cells: richHeaders.map(() => ({
                          type: 'text' as const,
                          value: '',
                        })),
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {t('addSection')}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('form.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {t('form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
