'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { INSPECTION_SPACING } from '@/lib/design-tokens';
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';
import { documentApi } from '@/lib/api/document-api';
import { useToast } from '@/components/ui/use-toast';
import type { ResultSection, CreateResultSectionDto, RichCell } from '@/lib/api/calibration-api';
import VisualTableEditor from './VisualTableEditor';

/**
 * 사용자에게 노출되는 결과 형식 (프론트엔드 전용)
 *
 * 백엔드 sectionType과의 매핑:
 * - 'table' → rich_table (통합)
 * - 'text'  → text
 * - 'photo' → photo
 * - 'title' → title
 */
const SECTION_TYPE_OPTIONS = ['table', 'text', 'photo', 'title'] as const;
type SectionTypeOption = (typeof SECTION_TYPE_OPTIONS)[number];

/** 프론트엔드 타입 → 백엔드 sectionType 변환 */
function toBackendType(frontendType: SectionTypeOption): string {
  return frontendType === 'table' ? 'rich_table' : frontendType;
}

/** 백엔드 sectionType → 프론트엔드 타입 변환 */
function toFrontendType(backendType: string): SectionTypeOption {
  if (backendType === 'rich_table' || backendType === 'data_table') return 'table';
  return backendType as SectionTypeOption;
}

interface ResultSectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (dto: CreateResultSectionDto) => void;
  editTarget?: ResultSection | null;
  /** 인라인 타입 선택에서 전달된 초기 sectionType */
  initialSectionType?: string | null;
  nextSortOrder: number;
  isSubmitting?: boolean;
}

export default function ResultSectionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  editTarget,
  initialSectionType,
  nextSortOrder,
  isSubmitting,
}: ResultSectionFormDialogProps) {
  const t = useTranslations('calibration.resultSections');
  const { toast } = useToast();

  // ── Form state ──
  const resolvedInitialType = initialSectionType
    ? toFrontendType(initialSectionType)
    : editTarget
      ? toFrontendType(editTarget.sectionType)
      : 'title';

  const [sectionType, setSectionType] = useState<SectionTypeOption>(resolvedInitialType);
  const [title, setTitle] = useState(editTarget?.title ?? '');
  const [content, setContent] = useState(editTarget?.content ?? '');

  // photo state
  const [documentId, setDocumentId] = useState(editTarget?.documentId ?? '');
  const [imageWidthCm, setImageWidthCm] = useState(Number(editTarget?.imageWidthCm) || 12);
  const [imageHeightCm, setImageHeightCm] = useState(Number(editTarget?.imageHeightCm) || 9);
  const [photoFiles, setPhotoFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // table state (통합: data_table + rich_table → VisualTableEditor)
  const getInitialHeaders = (): string[] => {
    if (editTarget?.richTableData) return editTarget.richTableData.headers;
    if (editTarget?.tableData) return editTarget.tableData.headers;
    return ['', '', ''];
  };
  const getInitialRows = (): RichCell[][] => {
    if (editTarget?.richTableData) return editTarget.richTableData.rows;
    if (editTarget?.tableData) {
      return editTarget.tableData.rows.map((row) =>
        row.map((v) => ({ type: 'text' as const, value: v }))
      );
    }
    return [['', '', ''].map(() => ({ type: 'text' as const, value: '' }))];
  };
  const [tableHeaders, setTableHeaders] = useState<string[]>(getInitialHeaders);
  const [tableRows, setTableRows] = useState<RichCell[][]>(getInitialRows);

  // ── Reset ──
  const resetForm = useCallback(() => {
    const type = initialSectionType
      ? toFrontendType(initialSectionType)
      : editTarget
        ? toFrontendType(editTarget.sectionType)
        : 'title';
    setSectionType(type);
    setTitle(editTarget?.title ?? '');
    setContent(editTarget?.content ?? '');
    setDocumentId(editTarget?.documentId ?? '');
    setImageWidthCm(Number(editTarget?.imageWidthCm) || 12);
    setImageHeightCm(Number(editTarget?.imageHeightCm) || 9);
    setPhotoFiles([]);
    setIsUploading(false);

    if (editTarget?.richTableData) {
      setTableHeaders(editTarget.richTableData.headers);
      setTableRows(editTarget.richTableData.rows);
    } else if (editTarget?.tableData) {
      setTableHeaders(editTarget.tableData.headers);
      setTableRows(
        editTarget.tableData.rows.map((row) =>
          row.map((v) => ({ type: 'text' as const, value: v }))
        )
      );
    } else {
      setTableHeaders(['', '', '']);
      setTableRows([['', '', ''].map(() => ({ type: 'text' as const, value: '' }))]);
    }
  }, [editTarget, initialSectionType]);

  useEffect(() => {
    if (open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Photo upload ──
  const handlePhotoFilesChange = useCallback(
    async (files: UploadedFile[]) => {
      setPhotoFiles(files);
      const pendingFile = files.find((f) => f.status === 'pending');
      if (!pendingFile) return;

      setIsUploading(true);
      try {
        const doc = await documentApi.uploadDocument(pendingFile.file, 'inspection_photo');
        setDocumentId(doc.id);
        setPhotoFiles(
          files.map((f) =>
            f === pendingFile ? { ...f, status: 'success' as const, uuid: doc.id } : f
          )
        );
      } catch {
        setPhotoFiles(
          files.map((f) =>
            f === pendingFile ? { ...f, status: 'error' as const, error: t('toasts.error') } : f
          )
        );
        toast({ variant: 'destructive', description: t('toasts.error') });
      } finally {
        setIsUploading(false);
      }
    },
    [t, toast]
  );

  // ── Submit ──
  const handleSubmit = () => {
    const backendType = toBackendType(sectionType);
    const dto: CreateResultSectionDto = {
      sortOrder: editTarget ? editTarget.sortOrder : nextSortOrder,
      sectionType: backendType,
    };

    if (title) dto.title = title;

    switch (sectionType) {
      case 'text':
        dto.content = content;
        break;
      case 'table':
        dto.richTableData = {
          headers: tableHeaders.map((h) => h || `Col`),
          rows: tableRows,
        };
        break;
      case 'photo':
        if (documentId) dto.documentId = documentId;
        dto.imageWidthCm = imageWidthCm;
        dto.imageHeightCm = imageHeightCm;
        break;
    }

    onSubmit(dto);
  };

  // ── Table change handler ──
  const handleTableChange = useCallback((newHeaders: string[], newRows: RichCell[][]) => {
    setTableHeaders(newHeaders);
    setTableRows(newRows);
  }, []);

  // ── Render ──
  const isInlineTypeEntry = !!initialSectionType && !!editTarget;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto ${sectionType === 'table' ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <DialogHeader>
          <DialogTitle>
            {isInlineTypeEntry
              ? `${title} — ${t(`types.${toBackendType(sectionType)}`)}`
              : editTarget
                ? t('editSection')
                : t('addSection')}
          </DialogTitle>
        </DialogHeader>

        <div className={`${INSPECTION_SPACING.group} py-2`}>
          {/* 검사 항목명 — 인라인 타입 선택 진입 시 숨김 */}
          {!isInlineTypeEntry && (
            <div className={INSPECTION_SPACING.field}>
              <Label>{t('form.inspectionItemName')}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('form.inspectionItemNamePlaceholder')}
              />
            </div>
          )}

          {/* 결과 형식 선택 */}
          {!isInlineTypeEntry && (!editTarget || editTarget.sectionType === 'title') && (
            <div className={INSPECTION_SPACING.field}>
              <Label>{t('form.resultFormat')}</Label>
              <Select
                value={sectionType}
                onValueChange={(v) => setSectionType(v as SectionTypeOption)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`types.${toBackendType(type)}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── 타입별 콘텐츠 입력 ── */}

          {sectionType === 'text' && (
            <div className={INSPECTION_SPACING.field}>
              <Label>{t('form.content')}</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
            </div>
          )}

          {sectionType === 'table' && (
            <VisualTableEditor
              headers={tableHeaders}
              rows={tableRows}
              onChange={handleTableChange}
            />
          )}

          {sectionType === 'photo' && (
            <>
              <FileUpload
                files={photoFiles}
                onChange={handlePhotoFilesChange}
                accept=".jpg,.jpeg,.png,.gif,.webp"
                maxFiles={1}
                label={t('form.selectFile')}
                disabled={isUploading}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className={INSPECTION_SPACING.field}>
                  <Label>{t('form.imageWidth')}</Label>
                  <Input
                    type="number"
                    value={imageWidthCm}
                    onChange={(e) => setImageWidthCm(Number(e.target.value))}
                    min={1}
                    max={30}
                  />
                </div>
                <div className={INSPECTION_SPACING.field}>
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
          <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
            {t('form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
