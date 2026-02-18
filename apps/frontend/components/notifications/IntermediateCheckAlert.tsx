'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { queryKeys } from '@/lib/api/query-config';
import { getErrorMessage } from '@/lib/api/error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertTriangle, Clock, X } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { formatDate } from '@/lib/utils/date';
import { apiClient } from '@/lib/api/api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

export interface IntermediateCheck {
  id: string;
  equipmentId: string;
  calibrationManagerId: string;
  intermediateCheckDate: string;
  equipmentName?: string;
  managementNumber?: string;
}

interface IntermediateCheckAlertProps {
  check: IntermediateCheck;
  equipmentName?: string;
  managementNumber?: string;
  onComplete?: () => void;
  onDismiss?: () => void;
  variant?: 'default' | 'compact';
}

// 중간점검 상태 계산
function getCheckStatus(checkDate: string): 'overdue' | 'today' | 'upcoming' | 'future' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(checkDate);
  date.setHours(0, 0, 0, 0);

  const diff = differenceInDays(date, today);

  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= 7) return 'upcoming';
  return 'future';
}

// 상태별 스타일 (label은 컴포넌트 내에서 t()로 처리)
const statusStyles = {
  overdue: {
    alertClass: 'border-red-500 bg-red-50',
    badgeClass: 'bg-red-100 text-red-800',
    icon: AlertTriangle,
    iconClass: 'text-red-500',
  },
  today: {
    alertClass: 'border-orange-500 bg-orange-50',
    badgeClass: 'bg-orange-100 text-orange-800',
    icon: Clock,
    iconClass: 'text-orange-500',
  },
  upcoming: {
    alertClass: 'border-yellow-500 bg-yellow-50',
    badgeClass: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    iconClass: 'text-yellow-500',
  },
  future: {
    alertClass: 'border-blue-200 bg-blue-50',
    badgeClass: 'bg-blue-100 text-blue-800',
    icon: Clock,
    iconClass: 'text-blue-500',
  },
};

export function IntermediateCheckAlert({
  check,
  equipmentName,
  managementNumber,
  onComplete,
  onDismiss,
  variant = 'default',
}: IntermediateCheckAlertProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const t = useTranslations('notifications.alerts.intermediateCheck');
  const tCommon = useTranslations('common.actions');

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  const status = getCheckStatus(check.intermediateCheckDate);
  const style = statusStyles[status];
  const IconComponent = style.icon;
  const daysUntil = differenceInDays(new Date(check.intermediateCheckDate), new Date());
  const statusLabel = t(
    `statusLabels.${status}` as
      | 'statusLabels.overdue'
      | 'statusLabels.today'
      | 'statusLabels.upcoming'
      | 'statusLabels.future'
  );

  const completeMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.COMPLETE(check.id), {
        completedBy: session?.user?.id,
        notes: completionNotes || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: t('toasts.success'),
        description: t('toasts.successDesc'),
      });
      setIsCompleteDialogOpen(false);
      setCompletionNotes('');
      onComplete?.();
    },
    onError: (error: unknown) => {
      toast({
        title: t('toasts.error'),
        description: getErrorMessage(error, t('toasts.error')),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrations.intermediateChecks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const handleComplete = () => {
    completeMutation.mutate();
  };

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-lg border ${style.alertClass}`}
      >
        <div className="flex items-center gap-3">
          <IconComponent className={`h-4 w-4 ${style.iconClass}`} aria-hidden="true" />
          <div>
            <span className="font-medium">
              {equipmentName || t('equipmentFallback', { id: check.equipmentId })}
            </span>
            {managementNumber && (
              <span className="text-muted-foreground ml-2 text-sm">({managementNumber})</span>
            )}
          </div>
          <Badge className={style.badgeClass}>
            {status === 'overdue'
              ? t('overdueDays', { days: Math.abs(daysUntil) })
              : status === 'today'
                ? statusLabel
                : `D-${daysUntil}`}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsCompleteDialogOpen(true)}>
            <CheckCircle2 className="h-4 w-4 mr-1" aria-hidden="true" />
            {t('complete')}
          </Button>
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              aria-label={t('dismissAriaLabel')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dialog.title')}</DialogTitle>
              <DialogDescription>
                {t('dialog.descriptionWithName', {
                  name: equipmentName || t('equipmentFallback', { id: check.equipmentId }),
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="notes">{t('dialog.notesLabel')}</Label>
                <Textarea
                  id="notes"
                  placeholder={t('dialog.notesPlaceholder')}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                {t('dialog.cancel')}
              </Button>
              <Button onClick={handleComplete} disabled={completeMutation.isPending}>
                {completeMutation.isPending ? t('dialog.processing') : t('dialog.submit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Alert className={style.alertClass}>
      <IconComponent className={`h-4 w-4 ${style.iconClass}`} aria-hidden="true" />
      <AlertTitle className="flex items-center gap-2">
        {t('title', { status: statusLabel })}
        <Badge className={style.badgeClass}>
          {status === 'overdue'
            ? t('overdueDays', { days: Math.abs(daysUntil) })
            : status === 'today'
              ? statusLabel
              : `D-${daysUntil}`}
        </Badge>
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          <p>
            <strong>{equipmentName || t('equipmentFallback', { id: check.equipmentId })}</strong>
            {managementNumber && (
              <span className="text-muted-foreground"> ({managementNumber})</span>
            )}
            {t('checkDateMessage', { date: formatDate(check.intermediateCheckDate, 'yyyy-MM-dd') })}
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => setIsCompleteDialogOpen(true)}>
              <CheckCircle2 className="h-4 w-4 mr-1" aria-hidden="true" />
              {t('completeButton')}
            </Button>
            {onDismiss && (
              <Button size="sm" variant="outline" onClick={onDismiss}>
                {t('later')}
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>

      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('dialog.descriptionWithName', {
                name: equipmentName || t('equipmentFallback', { id: check.equipmentId }),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>{t('dialog.scheduledDate')}</strong>{' '}
                {formatDate(check.intermediateCheckDate, 'yyyy-MM-dd')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('dialog.notesLabel')}</Label>
              <Textarea
                id="notes"
                placeholder={t('dialog.notesPlaceholder')}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              {t('dialog.cancel')}
            </Button>
            <Button onClick={handleComplete} disabled={completeMutation.isPending}>
              {completeMutation.isPending ? t('dialog.processing') : t('dialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Alert>
  );
}

export default IntermediateCheckAlert;
