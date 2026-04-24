'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import nonConformancesApi, { type NonConformance } from '@/lib/api/non-conformances-api';
import { queryKeys } from '@/lib/api/query-config';
import { useCasGuardedMutation } from '@/hooks/use-cas-guarded-mutation';
import { isConflictError } from '@/lib/api/error';
import { REQUIRED_FIELD_TOKENS, REQUIRED_FIELD_A11Y } from '@/lib/design-tokens/form-field-tokens';
import { CONFIRM_PREVIEW_TOKENS } from '@/lib/design-tokens/semantic';
import { NC_DIALOG_TOKENS } from '@/lib/design-tokens';
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
  const queryClient = useQueryClient();
  const [cause, setCause] = useState(nc.cause);
  const [actionPlan, setActionPlan] = useState(nc.actionPlan ?? '');

  // nc가 변경될 때 폼 상태 동기화
  useEffect(() => {
    if (open) {
      setCause(nc.cause);
      setActionPlan(nc.actionPlan ?? '');
    }
  }, [open, nc.cause, nc.actionPlan]);

  const changed = {
    cause: cause.trim() !== nc.cause,
    actionPlan: actionPlan.trim() !== (nc.actionPlan ?? ''),
  };
  const changeCount = Object.values(changed).filter(Boolean).length;
  const previewTokens = CONFIRM_PREVIEW_TOKENS.card('neutral');

  const editMutation = useCasGuardedMutation({
    fetchCasVersion: async () => (await nonConformancesApi.getNonConformance(nc.id)).version,
    mutationFn: (vars: { cause: string; actionPlan?: string }, casVersion: number) =>
      nonConformancesApi.updateNonConformance(nc.id, {
        version: casVersion,
        cause: vars.cause,
        actionPlan: vars.actionPlan || undefined,
      }),
    onSuccess: () => {
      onOpenChange(false);
    },
    onSettled: (_data, error) => {
      // CAS 409 발생 시 NC detail 캐시 무효화 (MEMORY: CAS 409 발생 시 backend detail 캐시 반드시 삭제)
      if (error && isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.nonConformances.detail(nc.id),
        });
      }
    },
  });

  const handleSubmit = () => {
    if (!cause.trim() || changeCount === 0) return;
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
          {/* 원인 — 필수 필드 */}
          <div className="space-y-1.5">
            <Label htmlFor="nc-cause" className={REQUIRED_FIELD_TOKENS.labelWrapper}>
              {t('fields.cause')}
              <span className={REQUIRED_FIELD_TOKENS.asterisk} aria-hidden="true">
                *
              </span>
              <span className={REQUIRED_FIELD_TOKENS.srOnlyLabel}>
                {t('detail.editDialog.required')}
              </span>
            </Label>
            <Textarea
              id="nc-cause"
              value={cause}
              onChange={(e) => setCause(e.target.value.slice(0, 500))}
              maxLength={500}
              placeholder={t('detail.editDialog.causePlaceholder')}
              className={REQUIRED_FIELD_TOKENS.inputBorder}
              rows={3}
              {...REQUIRED_FIELD_A11Y}
            />
            <div className={REQUIRED_FIELD_TOKENS.charCount}>{cause.length} / 500</div>
          </div>

          {/* 조치 계획 — 선택 필드 */}
          <div className="space-y-1.5">
            <Label htmlFor="nc-action-plan" className={REQUIRED_FIELD_TOKENS.labelWrapper}>
              {t('fields.actionPlan')}
              <span className={REQUIRED_FIELD_TOKENS.optionalHint}>
                ({t('detail.editDialog.optional')})
              </span>
            </Label>
            <Textarea
              id="nc-action-plan"
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              placeholder={t('detail.editDialog.actionPlanPlaceholder')}
              rows={3}
            />
          </div>

          {/* 변경 요약 카드 */}
          <div className={previewTokens.container}>
            <div className="font-mono text-[10.5px] text-muted-foreground">
              {t('detail.editDialog.changeSummary.title')}
            </div>
            <div className={previewTokens.row}>
              <span className={previewTokens.rowLabel}>{t('fields.cause')}</span>
              <span>
                {changed.cause ? (
                  <strong className={NC_DIALOG_TOKENS.changeSummaryModified}>
                    {t('detail.editDialog.changeSummary.modified')}
                  </strong>
                ) : (
                  t('detail.editDialog.changeSummary.unchanged')
                )}
              </span>
            </div>
            <div className={previewTokens.row}>
              <span className={previewTokens.rowLabel}>{t('fields.actionPlan')}</span>
              <span>
                {changed.actionPlan ? (
                  <strong className={NC_DIALOG_TOKENS.changeSummaryModified}>
                    {t('detail.editDialog.changeSummary.modified')}
                  </strong>
                ) : (
                  t('detail.editDialog.changeSummary.unchanged')
                )}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('detail.editDialog.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={editMutation.isPending || !cause.trim() || changeCount === 0}
          >
            {editMutation.isPending
              ? t('detail.editDialog.saving')
              : changeCount > 0
                ? t('detail.editDialog.save.withCount', { count: changeCount })
                : t('detail.editDialog.save.default')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
