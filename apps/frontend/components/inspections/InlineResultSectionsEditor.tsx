'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Pencil,
  LayoutList,
  Table2,
  Image,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  INSPECTION_EMPTY_STATE,
  INSPECTION_SPACING,
  INSPECTION_SECTION_CARD,
  INSPECTION_INLINE_DELETE_CONFIRM,
  INSPECTION_SECTION_TYPE_CHIP,
  ANIMATION_PRESETS,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import type { CreateResultSectionDto } from '@/lib/api/calibration-api';
import ResultSectionFormDialog from './result-sections/ResultSectionFormDialog';
import ResultSectionPreview from './result-sections/ResultSectionPreview';
import type { ResultSection } from '@/lib/api/calibration-api';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';

interface InlineResultSectionsEditorProps {
  sections: CreateResultSectionDto[];
  onChange: (sections: CreateResultSectionDto[]) => void;
}

export default function InlineResultSectionsEditor({
  sections,
  onChange,
}: InlineResultSectionsEditorProps) {
  const t = useTranslations('calibration.resultSections');
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  /** 인라인 타입 선택 시 초기 sectionType을 전달 */
  const [initialSectionType, setInitialSectionType] = useState<string | null>(null);
  // Phase 0A: 5초 toast undo — 삭제된 섹션 snapshot 보존 (다중 삭제 시 가장 최근만 복원)
  const undoSnapshotRef = useRef<CreateResultSectionDto[] | null>(null);

  const handleAdd = (dto: CreateResultSectionDto) => {
    if (editIndex !== null) {
      const updated = [...sections];
      updated[editIndex] = dto;
      onChange(updated);
      setEditIndex(null);
    } else {
      onChange([...sections, dto]);
    }
    setFormOpen(false);
  };

  const handleRemove = (index: number) => {
    // Phase 0A: 표 30셀 작성 후 1클릭 손실 방지 — 삭제 즉시 + 5초 toast undo
    const snapshot = [...sections];
    undoSnapshotRef.current = snapshot;
    const updated = sections.filter((_, i) => i !== index);
    // Re-index sortOrder
    onChange(updated.map((s, i) => ({ ...s, sortOrder: i })));
    toast({
      description: t('inlineDelete.toastDescription'),
      duration: INSPECTION_INLINE_DELETE_CONFIRM.toastDurationMs,
      action: (
        <ToastAction
          altText={t('inlineDelete.undo')}
          onClick={() => {
            const restore = undoSnapshotRef.current;
            if (restore) {
              onChange(restore);
              undoSnapshotRef.current = null;
            }
          }}
        >
          {t('inlineDelete.undo')}
        </ToastAction>
      ),
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[swapIdx]] = [updated[swapIdx], updated[index]];
    onChange(updated.map((s, i) => ({ ...s, sortOrder: i })));
  };

  const toPreviewSection = (dto: CreateResultSectionDto, index: number): ResultSection => ({
    id: `temp-${index}`,
    inspectionId: '',
    inspectionType: 'intermediate',
    sectionType: dto.sectionType,
    sortOrder: dto.sortOrder,
    title: dto.title ?? null,
    content: dto.content ?? null,
    tableData: dto.tableData ?? null,
    richTableData: dto.richTableData ?? null,
    documentId: dto.documentId ?? null,
    imageWidthCm: dto.imageWidthCm?.toString() ?? null,
    imageHeightCm: dto.imageHeightCm?.toString() ?? null,
    createdAt: '',
    updatedAt: '',
  });

  /** title 타입이면서 아무 데이터도 없으면 = 결과 형식 미선택 */
  const isAwaitingType = (dto: CreateResultSectionDto) =>
    dto.sectionType === 'title' &&
    !dto.content &&
    !dto.tableData &&
    !dto.richTableData &&
    !dto.documentId;

  /** 인라인 타입 선택 시: 해당 섹션을 편집 모드로 열면서 선택한 타입을 전달 */
  const handleSelectType = (idx: number, type: string) => {
    setEditIndex(idx);
    setInitialSectionType(type);
    setFormOpen(true);
  };

  const editTarget = editIndex !== null ? toPreviewSection(sections[editIndex], editIndex) : null;

  return (
    <div className={INSPECTION_SPACING.group}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground">{t('title')}</h4>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setEditIndex(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1 h-3 w-3" />
          {t('addSection')}
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className={INSPECTION_EMPTY_STATE.container}>
          <LayoutList className={INSPECTION_EMPTY_STATE.icon} aria-hidden="true" />
          <p className={INSPECTION_EMPTY_STATE.title}>{t('empty')}</p>
          <p className={INSPECTION_EMPTY_STATE.description}>{t('emptyDescription')}</p>
          {/* Phase 0B-12: 4-type chip preview — 어떤 형식의 결과를 추가할 수 있는지 학습 (디자인 리뷰 b8) */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1">
              <Table2 className="h-3 w-3" aria-hidden="true" />
              {t('types.table')}
            </span>
            <span aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1">
              <Image className="h-3 w-3" aria-hidden="true" />
              {t('types.photo')}
            </span>
            <span aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" aria-hidden="true" />
              {t('types.text')}
            </span>
          </div>
        </div>
      ) : (
        <div className={INSPECTION_SPACING.field}>
          {sections.map((section, idx) => (
            <Card
              key={idx}
              className={cn(
                INSPECTION_SECTION_CARD.base,
                ANIMATION_PRESETS.slideUpFade,
                'motion-safe:duration-200'
              )}
            >
              <CardContent className="p-3">
                <ResultSectionPreview section={toPreviewSection(section, idx)} />
                {isAwaitingType(section) && (
                  <div>
                    <span className="text-xs text-muted-foreground">{t('selectResultFormat')}</span>
                    {/* Phase 0B: 한국어 칩 라벨 길이 차이 균등화 (디자인 리뷰 b6, INSPECTION_SECTION_TYPE_CHIP) */}
                    <div className={INSPECTION_SECTION_TYPE_CHIP.group}>
                      <button
                        type="button"
                        className={INSPECTION_SECTION_TYPE_CHIP.chip}
                        onClick={() => handleSelectType(idx, 'table')}
                      >
                        <Table2 className={INSPECTION_SECTION_TYPE_CHIP.icon} />
                        {t('types.table')}
                      </button>
                      <button
                        type="button"
                        className={INSPECTION_SECTION_TYPE_CHIP.chip}
                        onClick={() => handleSelectType(idx, 'photo')}
                      >
                        <Image className={INSPECTION_SECTION_TYPE_CHIP.icon} />
                        {t('types.photo')}
                      </button>
                      <button
                        type="button"
                        className={INSPECTION_SECTION_TYPE_CHIP.chip}
                        onClick={() => handleSelectType(idx, 'text')}
                      >
                        <FileText className={INSPECTION_SECTION_TYPE_CHIP.icon} />
                        {t('types.text')}
                      </button>
                    </div>
                  </div>
                )}
                <div className={INSPECTION_SECTION_CARD.actions}>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={INSPECTION_SECTION_CARD.actionButton}
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    aria-label={t('moveUp')}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={INSPECTION_SECTION_CARD.actionButton}
                    disabled={idx === sections.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    aria-label={t('moveDown')}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={INSPECTION_SECTION_CARD.actionButton}
                    onClick={() => {
                      setEditIndex(idx);
                      setFormOpen(true);
                    }}
                    aria-label={t('editSection')}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={cn(INSPECTION_SECTION_CARD.actionButton, 'text-destructive')}
                    onClick={() => handleRemove(idx)}
                    aria-label={t('deleteSection')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ResultSectionFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setInitialSectionType(null);
        }}
        onSubmit={handleAdd}
        editTarget={editTarget}
        initialSectionType={initialSectionType}
        nextSortOrder={sections.length}
        isSubmitting={false}
      />
    </div>
  );
}
