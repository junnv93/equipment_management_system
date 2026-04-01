'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RepairResultEnum, RepairResultValues as RRVal } from '@equipment-management/schemas';
import { createRepairHistory, type CreateRepairHistoryDto } from '@/lib/api/repair-history-api';
import { NonConformanceCacheInvalidation } from '@/lib/api/cache-invalidation';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';
import { queryKeys } from '@/lib/api/query-config';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useToast } from '@/components/ui/use-toast';
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
import type { NonConformance } from '@/lib/api/non-conformances-api';

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

  const createRepairMutation = useMutation({
    mutationFn: (dto: CreateRepairHistoryDto) => createRepairHistory(nc.equipmentId, dto),
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

  const handleSubmit = form.handleSubmit((data) => {
    createRepairMutation.mutate({
      repairDate: data.repairDate,
      repairDescription: data.repairDescription,
      repairResult: data.repairResult,
      notes: data.notes,
      nonConformanceId: nc.id, // NC 자동 연결
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('detail.repairDialog.title')}</DialogTitle>
          <DialogDescription>{t('detail.repairDialog.description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                      <SelectItem value={RRVal.COMPLETED}>{t('repairResult.completed')}</SelectItem>
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
              <Button type="submit" disabled={createRepairMutation.isPending}>
                {createRepairMutation.isPending
                  ? t('detail.repairDialog.registering')
                  : t('detail.repairDialog.register')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
