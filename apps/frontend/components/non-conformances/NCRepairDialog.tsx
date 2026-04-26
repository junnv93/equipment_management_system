'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { RepairResultEnum, RepairResultValues as RRVal } from '@equipment-management/schemas';
import nonConformancesApi from '@/lib/api/non-conformances-api';
import type { NonConformance } from '@/lib/api/non-conformances-api';
import { createRepairHistory, type CreateRepairHistoryDto } from '@/lib/api/repair-history-api';
import {
  NonConformanceCacheInvalidation,
  EquipmentCacheInvalidation,
} from '@/lib/api/cache-invalidation';
import { queryKeys } from '@/lib/api/query-config';
import { useCasGuardedMutation } from '@/hooks/use-cas-guarded-mutation';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useToast } from '@/components/ui/use-toast';
import { CONFIRM_PREVIEW_TOKENS, NC_DIALOG_TOKENS } from '@/lib/design-tokens';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function createRepairSchema(t: (key: string) => string) {
  return z.object({
    repairDate: z.string().min(1, t('detail.repairDialog.validation.dateRequired')),
    repairDescription: z.string().min(10, t('detail.repairDialog.validation.descriptionMin')),
    repairResult: RepairResultEnum.optional(),
    notes: z.string().optional(),
  });
}
type RepairFormData = z.infer<ReturnType<typeof createRepairSchema>>;

interface NCRepairDialogProps {
  nc: NonConformance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NCRepairDialog({ nc, open, onOpenChange }: NCRepairDialogProps) {
  const t = useTranslations('non-conformances');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { fmtDate } = useDateFormatter();
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const repairSchema = useMemo(() => createRepairSchema(t), [t]);

  const form = useForm<RepairFormData>({
    resolver: zodResolver(repairSchema),
    defaultValues: {
      repairDate: fmtDate(new Date()),
      repairDescription: '',
      repairResult: undefined,
      notes: '',
    },
  });

  // 다이얼로그 닫힐 때 step 초기화
  useEffect(() => {
    if (!open) setStep('input');
  }, [open]);

  // step 전환 시 screen reader 공지
  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = t('detail.repairDialog.stepLabel', {
        current: step === 'input' ? 1 : 2,
        total: 2,
      });
    }
  }, [step, t]);

  const createRepairMutation = useCasGuardedMutation<RepairHistory, CreateRepairHistoryDto>({
    // confirm 단계 제출 직전 버전 재확인 — CAS stale 이중 방어
    fetchCasVersion: async () => (await nonConformancesApi.getNonConformance(nc.id)).version,
    mutationFn: async (vars, _casVersion) => createRepairHistory(nc.equipmentId, vars),
    onSuccess: () => {
      toast({ title: t('detail.repairDialog.toasts.success') });
      onOpenChange(false);
      form.reset();
      // NC + 장비 캐시 교차 무효화
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        nc.id,
        nc.equipmentId
      );
      EquipmentCacheInvalidation.invalidateEquipment(queryClient, nc.equipmentId);
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.repairHistory(nc.equipmentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.incidentHistory(nc.equipmentId),
      });
    },
    onError: () => {
      toast({ title: t('detail.repairDialog.toasts.error'), variant: 'destructive' });
    },
  });

  const handleNext = form.handleSubmit(() => {
    setStep('confirm');
  });

  const values = form.getValues();
  const previewTokens = CONFIRM_PREVIEW_TOKENS.card('ok');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* aria-live 공지 영역 (sr-only) */}
        <div ref={liveRegionRef} aria-live="polite" className="sr-only" />

        {step === 'input' ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('detail.repairDialog.title')}</DialogTitle>
              <DialogDescription>{t('detail.repairDialog.description')}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={handleNext} className="space-y-4">
                <FormField
                  control={form.control}
                  name="repairDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('detail.repairDialog.repairDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repairDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('detail.repairDialog.repairDescription')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('detail.repairDialog.repairDescriptionPlaceholder')}
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repairResult"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('detail.repairDialog.repairResult')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('detail.repairDialog.repairResultPlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={RRVal.COMPLETED}>
                            {t('repairResult.completed')}
                          </SelectItem>
                          <SelectItem value={RRVal.PARTIAL}>{t('repairResult.partial')}</SelectItem>
                          <SelectItem value={RRVal.FAILED}>{t('repairResult.failed')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('detail.repairDialog.notes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('detail.repairDialog.notesPlaceholder')}
                          className="min-h-[80px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    {t('detail.repairDialog.cancel')}
                  </Button>
                  <Button type="submit">{t('detail.repairDialog.next')} →</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('detail.repairDialog.confirm.title')}</DialogTitle>
              <DialogDescription>{t('detail.repairDialog.confirm.subtitle')}</DialogDescription>
            </DialogHeader>
            <div className={previewTokens.container}>
              <div className={previewTokens.row}>
                <span className={previewTokens.rowLabel}>
                  {t('detail.repairDialog.repairDate')}
                </span>
                <span className="font-mono">{values.repairDate}</span>
              </div>
              {values.repairResult && (
                <div className={previewTokens.row}>
                  <span className={previewTokens.rowLabel}>
                    {t('detail.repairDialog.repairResult')}
                  </span>
                  <Badge
                    variant={values.repairResult === RRVal.COMPLETED ? 'default' : 'secondary'}
                  >
                    {t(`repairResult.${values.repairResult.toLowerCase()}`)}
                  </Badge>
                </div>
              )}
              <div className={previewTokens.row}>
                <span className={previewTokens.rowLabel}>
                  {t('detail.repairDialog.repairDescription')}
                </span>
                <span>{values.repairDescription}</span>
              </div>
              {values.notes && (
                <div className={previewTokens.row}>
                  <span className={previewTokens.rowLabel}>{t('detail.repairDialog.notes')}</span>
                  <span className="text-muted-foreground">{values.notes}</span>
                </div>
              )}
            </div>
            <Alert className={CONFIRM_PREVIEW_TOKENS.hint}>
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              <AlertDescription>{t('detail.repairDialog.confirm.hint')}</AlertDescription>
            </Alert>
            <DialogFooter className="justify-between">
              <Button variant="outline" onClick={() => setStep('input')}>
                ← {t('detail.repairDialog.edit')}
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  {t('detail.repairDialog.cancel')}
                </Button>
                <Button
                  onClick={() =>
                    createRepairMutation.mutate({
                      repairDate: values.repairDate,
                      repairDescription: values.repairDescription,
                      repairResult: values.repairResult,
                      notes: values.notes,
                      nonConformanceId: nc.id,
                    })
                  }
                  disabled={createRepairMutation.isPending}
                  className={NC_DIALOG_TOKENS.repairSubmit}
                >
                  {createRepairMutation.isPending
                    ? t('detail.repairDialog.registering')
                    : t('detail.repairDialog.register')}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// RepairHistory 타입 (useCasGuardedMutation 제네릭용)
type RepairHistory = Awaited<ReturnType<typeof createRepairHistory>>;
