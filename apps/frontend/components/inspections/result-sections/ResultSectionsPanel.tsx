'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
        <p className="py-4 text-center text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <Card key={section.id} className="relative">
              <CardContent className="p-3">
                <ResultSectionPreview section={section} />
                {canEdit && (
                  <div className="mt-2 flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={idx === 0}
                      onClick={() => handleMove(section, 'up')}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMove(section, 'down')}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditTarget(section);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteTarget(section)}
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
