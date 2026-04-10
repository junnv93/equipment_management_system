'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  INSPECTION_EMPTY_STATE,
  INSPECTION_SPACING,
  INSPECTION_SECTION_CARD,
  ANIMATION_PRESETS,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { queryKeys } from '@/lib/api/query-config';
import calibrationApi from '@/lib/api/calibration-api';
import { selfInspectionResultSections } from '@/lib/api/self-inspection-api';
import type { ResultSection, CreateResultSectionDto } from '@/lib/api/calibration-api';
import ResultSectionPreview from './ResultSectionPreview';
import ResultSectionFormDialog from './ResultSectionFormDialog';

interface ResultSectionsPanelProps {
  inspectionId: string;
  inspectionType: 'intermediate' | 'self';
  canEdit: boolean;
}

export default function ResultSectionsPanel({
  inspectionId,
  inspectionType,
  canEdit,
}: ResultSectionsPanelProps) {
  const t = useTranslations('calibration.resultSections');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ResultSection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResultSection | null>(null);

  const api =
    inspectionType === 'intermediate'
      ? calibrationApi.intermediateInspections.resultSections
      : selfInspectionResultSections;

  const queryKey =
    inspectionType === 'intermediate'
      ? queryKeys.intermediateInspections.resultSections(inspectionId)
      : queryKeys.selfInspections.resultSections(inspectionId);

  const { data: sections = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => api.list(inspectionId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: (dto: CreateResultSectionDto) => api.create(inspectionId, dto),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      toast({ description: t('toasts.createSuccess') });
    },
    onError: () => toast({ variant: 'destructive', description: t('toasts.error') }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ sectionId, dto }: { sectionId: string; dto: Partial<CreateResultSectionDto> }) =>
      api.update(inspectionId, sectionId, dto),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      setEditTarget(null);
      toast({ description: t('toasts.updateSuccess') });
    },
    onError: () => toast({ variant: 'destructive', description: t('toasts.error') }),
  });

  const deleteMutation = useMutation({
    mutationFn: (sectionId: string) => api.delete(inspectionId, sectionId),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast({ description: t('toasts.deleteSuccess') });
    },
    onError: () => toast({ variant: 'destructive', description: t('toasts.error') }),
  });

  const handleSubmit = (dto: CreateResultSectionDto) => {
    if (editTarget) {
      updateMutation.mutate({ sectionId: editTarget.id, dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  const handleMove = async (section: ResultSection, direction: 'up' | 'down') => {
    const idx = sections.findIndex((s) => s.id === section.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;

    const swapTarget = sections[swapIdx];
    // 두 섹션의 sortOrder를 순차 교환 (레이스 컨디션 방지)
    await updateMutation.mutateAsync({
      sectionId: section.id,
      dto: { sortOrder: swapTarget.sortOrder },
    });
    await updateMutation.mutateAsync({
      sectionId: swapTarget.id,
      dto: { sortOrder: section.sortOrder },
    });
  };

  if (isLoading) {
    return (
      <div className={`${INSPECTION_SPACING.field} p-4`}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className={INSPECTION_SPACING.group}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground">{t('title')}</h4>
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1 h-3 w-3" />
            {t('addSection')}
          </Button>
        )}
      </div>

      {sections.length === 0 ? (
        <div className={INSPECTION_EMPTY_STATE.container}>
          <LayoutList className={INSPECTION_EMPTY_STATE.icon} aria-hidden="true" />
          <p className={INSPECTION_EMPTY_STATE.title}>{t('empty')}</p>
          <p className={INSPECTION_EMPTY_STATE.description}>{t('emptyDescription')}</p>
        </div>
      ) : (
        <div className={INSPECTION_SPACING.field}>
          {sections.map((section, idx) => (
            <Card
              key={section.id}
              className={cn(
                INSPECTION_SECTION_CARD.base,
                ANIMATION_PRESETS.slideUpFade,
                'motion-safe:duration-200'
              )}
            >
              <CardContent className="p-3">
                <ResultSectionPreview section={section} />
                {canEdit && (
                  <div className={INSPECTION_SECTION_CARD.actions}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={INSPECTION_SECTION_CARD.actionButton}
                      disabled={idx === 0}
                      onClick={() => handleMove(section, 'up')}
                      aria-label={t('moveUp')}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={INSPECTION_SECTION_CARD.actionButton}
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMove(section, 'down')}
                      aria-label={t('moveDown')}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={INSPECTION_SECTION_CARD.actionButton}
                      onClick={() => {
                        setEditTarget(section);
                        setFormOpen(true);
                      }}
                      aria-label={t('editSection')}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(INSPECTION_SECTION_CARD.actionButton, 'text-destructive')}
                      onClick={() => setDeleteTarget(section)}
                      aria-label={t('deleteSection')}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 추가/수정 다이얼로그 */}
      <ResultSectionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        editTarget={editTarget}
        nextSortOrder={sections.length > 0 ? Math.max(...sections.map((s) => s.sortOrder)) + 1 : 0}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* 삭제 확인 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteSection')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {t('deleteSection')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
