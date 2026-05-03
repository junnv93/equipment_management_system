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
  DialogDescription,
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
import { INSPECTION_FORM_LAYOUT, INSPECTION_SPACING } from '@/lib/design-tokens';
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';
import { documentApi } from '@/lib/api/document-api';
import { useToast } from '@/components/ui/use-toast';
import type { ResultSection, CreateResultSectionDto, RichCell } from '@/lib/api/calibration-api';
import type { InspectionResultSectionType } from '@equipment-management/schemas';
import VisualTableEditor from './VisualTableEditor';
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
import { useFormDialogClose } from '@/hooks/use-form-dialog-close';
import { track } from '@/lib/analytics/track';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

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

/** 프론트엔드 타입 → 백엔드 sectionType 변환 (SSOT 타입 유지) */
function toBackendType(frontendType: SectionTypeOption): InspectionResultSectionType {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- self-audit-exception: pre-existing, resetForm is stable
  }, [open]);

  // Phase 0A-ext: cancel/X/Esc 작성 데이터 가드 (모든 destructive 1단계 안전망)
  const close = useFormDialogClose({
    isDirty: () => {
      // 새 섹션 작성 모드 — title 입력 / content / 표 셀 / 사진 첨부 중 하나라도 있으면 dirty
      // edit 모드 — 사용자가 변경했는지 비교 (간소화: 항상 dirty로 처리하여 명시 confirm)
      if (editTarget) {
        // edit 모드는 사용자가 의도적으로 열었으므로 작성 중으로 간주
        return true;
      }
      const hasTitleOrContent = title.trim() !== '' || content.trim() !== '';
      const hasPhoto = !!documentId || photoFiles.length > 0;
      const hasTable = tableRows.some((row) =>
        row.some((c) => c.type === 'text' && c.value.trim() !== '')
      );
      const hasTableHeaders = tableHeaders.some((h) => h.trim() !== '');
      return hasTitleOrContent || hasPhoto || hasTable || hasTableHeaders;
    },
    onConfirmClose: () => {
      // Phase 1A-c: confirm 시 analytics
      track(ANALYTICS_EVENTS.INSPECTION_FORM_CLOSE_GUARDED, {
        dialog: 'result_section_form',
        action: 'discard',
        sectionType,
        isEdit: !!editTarget,
      });
      onOpenChange(false);
    },
  });

  // ── Photo upload ──
  const handlePhotoFilesChange = useCallback(
    async (files: UploadedFile[]) => {
      setPhotoFiles(files);
      const pendingFile = files.find((f) => f.status === 'pending'); // eslint-disable-line no-restricted-syntax -- UploadedFile local UI state, not domain status; self-audit-exception
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
          headers: tableHeaders.map((h, index) =>
            h.trim() ? h.trim() : t('form.defaultColumnHeader', { number: index + 1 })
          ),
          rows: tableRows,
        };
        break;
      case 'photo':
        if (documentId) dto.documentId = documentId;
        dto.imageWidthCm = imageWidthCm;
        dto.imageHeightCm = imageHeightCm;
        break;
    }

    // Phase 0A-ext: submit 성공 → 다음 requestClose에서 confirm 우회
    close.markCommitted();
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
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) close.requestClose();
        else onOpenChange(newOpen);
      }}
    >
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto shadow-2xl ${sectionType === 'table' ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
        // Phase 0A: 다이얼로그 위 다이얼로그 — outside-click(부모 클릭)으로 인한
        // VisualTableEditor 셀 데이터 손실 방지. 명시적 cancel/Esc만 허용 (디자인 리뷰 b6)
        // Phase 0B: shadow-2xl 로 elevation +1 (자식 dialog 시각 위계)
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        // Phase 0A-ext: Esc 작성 데이터 가드
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          close.requestClose();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isInlineTypeEntry
              ? `${title} — ${t(`types.${toBackendType(sectionType)}`)}`
              : editTarget
                ? t('editSection')
                : t('addSection')}
          </DialogTitle>
          <DialogDescription>{t('form.description')}</DialogDescription>
        </DialogHeader>

        <div className={`${INSPECTION_SPACING.group} py-2`}>
          {/* 검사 항목명 — 인라인 타입 선택 진입 시 숨김 */}
          {!isInlineTypeEntry && (
            <div className={INSPECTION_SPACING.field}>
              <Label htmlFor="result-section-title">{t('form.inspectionItemName')}</Label>
              <Input
                id="result-section-title"
                name="resultSectionTitle"
                autoComplete="off"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('form.inspectionItemNamePlaceholder')}
              />
            </div>
          )}

          {/* 결과 형식 선택 */}
          {!isInlineTypeEntry && (!editTarget || editTarget.sectionType === 'title') && (
            <div className={INSPECTION_SPACING.field}>
              <Label htmlFor="result-section-type">{t('form.resultFormat')}</Label>
              <Select
                value={sectionType}
                onValueChange={(v) => setSectionType(v as SectionTypeOption)}
              >
                <SelectTrigger id="result-section-type">
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
              <Label htmlFor="result-section-content">{t('form.content')}</Label>
              <Textarea
                id="result-section-content"
                name="resultSectionContent"
                autoComplete="off"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
              />
            </div>
          )}

          {sectionType === 'table' && (
            <VisualTableEditor
              headers={tableHeaders}
              rows={tableRows}
              onChange={handleTableChange}
              // Phase 1A-b: 셀 provenance Context 키 — editTarget의 sortOrder 또는 새 섹션의 nextSortOrder
              sortOrder={editTarget ? editTarget.sortOrder : nextSortOrder}
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
              <div className={INSPECTION_FORM_LAYOUT.twoColumn}>
                <div className={INSPECTION_SPACING.field}>
                  <Label htmlFor="result-section-image-width">{t('form.imageWidth')}</Label>
                  <Input
                    id="result-section-image-width"
                    name="resultSectionImageWidthCm"
                    type="number"
                    inputMode="decimal"
                    autoComplete="off"
                    value={imageWidthCm}
                    onChange={(e) => setImageWidthCm(Number(e.target.value))}
                    min={1}
                    max={30}
                  />
                </div>
                <div className={INSPECTION_SPACING.field}>
                  <Label htmlFor="result-section-image-height">{t('form.imageHeight')}</Label>
                  <Input
                    id="result-section-image-height"
                    name="resultSectionImageHeightCm"
                    type="number"
                    inputMode="decimal"
                    autoComplete="off"
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

        <DialogFooter className={INSPECTION_FORM_LAYOUT.stickyFooter}>
          <Button variant="outline" onClick={close.requestClose}>
            {t('form.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
            {t('form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Phase 0A-ext: cancel/X/Esc 작성 데이터 가드 */}
      <AlertDialog
        open={close.confirmOpen}
        onOpenChange={(o) => {
          if (!o) close.cancel();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cancelConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('cancelConfirm.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={close.cancel}>
              {t('cancelConfirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={close.confirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('cancelConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
