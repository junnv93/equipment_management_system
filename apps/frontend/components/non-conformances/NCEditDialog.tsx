'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import nonConformancesApi, { type NonConformance } from '@/lib/api/non-conformances-api';
import { queryKeys } from '@/lib/api/query-config';
import { Button } from '@/components/ui/button';
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

interface NCEditDialogProps {
  nc: NonConformance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NCEditDialog({ nc, open, onOpenChange }: NCEditDialogProps) {
  const t = useTranslations('non-conformances');
  const [cause, setCause] = useState(nc.cause);
  const [actionPlan, setActionPlan] = useState(nc.actionPlan ?? '');

  // nc가 변경될 때 폼 상태 동기화
  useEffect(() => {
    if (open) {
      setCause(nc.cause);
      setActionPlan(nc.actionPlan ?? '');
    }
  }, [open, nc.cause, nc.actionPlan]);

  const editMutation = useOptimisticMutation<
    NonConformance,
    { cause: string; actionPlan?: string },
    NonConformance
  >({
    mutationFn: (vars) =>
      nonConformancesApi.updateNonConformance(nc.id, {
        version: nc.version,
        cause: vars.cause,
        actionPlan: vars.actionPlan || undefined,
      }),
    queryKey: queryKeys.nonConformances.detail(nc.id),
    optimisticUpdate: (old, vars) => ({
      ...old!,
      cause: vars.cause,
      actionPlan: vars.actionPlan ?? old!.actionPlan,
      version: (old?.version ?? 0) + 1,
    }),
    invalidateKeys: [queryKeys.nonConformances.lists()],
    successMessage: t('toasts.updateSuccess'),
    errorMessage: t('toasts.updateError'),
    onSuccessCallback: () => {
      onOpenChange(false);
    },
  });

  const handleSubmit = () => {
    if (!cause.trim()) return;
    editMutation.mutate({ cause: cause.trim(), actionPlan: actionPlan.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('detail.editDialog.title')}</DialogTitle>
          <DialogDescription>{t('detail.editDialog.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nc-cause">{t('fields.cause')}</Label>
            <Textarea
              id="nc-cause"
              value={cause}
              onChange={(e) => setCause(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nc-action-plan">{t('fields.actionPlan')}</Label>
            <Textarea
              id="nc-action-plan"
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              placeholder={t('detail.editDialog.actionPlanPlaceholder')}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('detail.editDialog.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={editMutation.isPending || !cause.trim()}>
            {editMutation.isPending ? t('detail.editDialog.saving') : t('detail.editDialog.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
