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
import type { ResultSection, CreateResultSectionDto } from '@/lib/api/calibration-api';

const SECTION_TYPES = ['title', 'text', 'data_table', 'photo'] as const;

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

  // 편집 대상 변경 시 폼 초기화
  const resetForm = useCallback(() => {
    setSectionType(editTarget?.sectionType ?? 'title');
    setTitle(editTarget?.title ?? '');
    setContent(editTarget?.content ?? '');
    setPasteData('');
    setDocumentId(editTarget?.documentId ?? '');
    setImageWidthCm(Number(editTarget?.imageWidthCm) || 12);
    setImageHeightCm(Number(editTarget?.imageHeightCm) || 9);
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
                  {SECTION_TYPES.map((type) => (
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
