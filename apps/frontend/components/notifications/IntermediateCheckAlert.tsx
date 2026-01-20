'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
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
import { format, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { apiClient } from '@/lib/api/api-client';

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

// 상태별 스타일
const statusStyles = {
  overdue: {
    alertClass: 'border-red-500 bg-red-50',
    badgeClass: 'bg-red-100 text-red-800',
    icon: AlertTriangle,
    iconClass: 'text-red-500',
    label: '기한 초과',
  },
  today: {
    alertClass: 'border-orange-500 bg-orange-50',
    badgeClass: 'bg-orange-100 text-orange-800',
    icon: Clock,
    iconClass: 'text-orange-500',
    label: '오늘',
  },
  upcoming: {
    alertClass: 'border-yellow-500 bg-yellow-50',
    badgeClass: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    iconClass: 'text-yellow-500',
    label: '임박',
  },
  future: {
    alertClass: 'border-blue-200 bg-blue-50',
    badgeClass: 'bg-blue-100 text-blue-800',
    icon: Clock,
    iconClass: 'text-blue-500',
    label: '예정',
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

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  const status = getCheckStatus(check.intermediateCheckDate);
  const style = statusStyles[status];
  const IconComponent = style.icon;
  const daysUntil = differenceInDays(new Date(check.intermediateCheckDate), new Date());

  // 중간점검 완료 뮤테이션
  const completeMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/api/calibration/${check.id}/intermediate-check/complete`, {
        completedBy: session?.user?.id,
        notes: completionNotes || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: '중간점검 완료',
        description: '중간점검이 완료 처리되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['intermediate-checks'] });
      queryClient.invalidateQueries({ queryKey: ['calibrations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsCompleteDialogOpen(false);
      setCompletionNotes('');
      onComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: '완료 처리 실패',
        description: error.response?.data?.message || '중간점검 완료 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
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
          <IconComponent className={`h-4 w-4 ${style.iconClass}`} />
          <div>
            <span className="font-medium">{equipmentName || `장비 ${check.equipmentId}`}</span>
            {managementNumber && (
              <span className="text-muted-foreground ml-2 text-sm">({managementNumber})</span>
            )}
          </div>
          <Badge className={style.badgeClass}>
            {status === 'overdue'
              ? `${Math.abs(daysUntil)}일 초과`
              : status === 'today'
                ? '오늘'
                : `D-${daysUntil}`}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsCompleteDialogOpen(true)}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            완료
          </Button>
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 완료 다이얼로그 */}
        <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>중간점검 완료</DialogTitle>
              <DialogDescription>
                {equipmentName || `장비 ${check.equipmentId}`}의 중간점검을 완료합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="notes">점검 내용 (선택)</Label>
                <Textarea
                  id="notes"
                  placeholder="점검 결과나 특이사항을 입력하세요"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleComplete} disabled={completeMutation.isPending}>
                {completeMutation.isPending ? '처리 중...' : '완료 처리'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Alert className={style.alertClass}>
      <IconComponent className={`h-4 w-4 ${style.iconClass}`} />
      <AlertTitle className="flex items-center gap-2">
        중간점검 {style.label}
        <Badge className={style.badgeClass}>
          {status === 'overdue'
            ? `${Math.abs(daysUntil)}일 초과`
            : status === 'today'
              ? '오늘'
              : `D-${daysUntil}`}
        </Badge>
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          <p>
            <strong>{equipmentName || `장비 ${check.equipmentId}`}</strong>
            {managementNumber && (
              <span className="text-muted-foreground"> ({managementNumber})</span>
            )}
            의 중간점검일이{' '}
            <strong>
              {format(new Date(check.intermediateCheckDate), 'yyyy년 M월 d일', { locale: ko })}
            </strong>
            입니다.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => setIsCompleteDialogOpen(true)}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              점검 완료
            </Button>
            {onDismiss && (
              <Button size="sm" variant="outline" onClick={onDismiss}>
                나중에
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>

      {/* 완료 다이얼로그 */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>중간점검 완료</DialogTitle>
            <DialogDescription>
              {equipmentName || `장비 ${check.equipmentId}`}의 중간점검을 완료합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>점검 예정일:</strong>{' '}
                {format(new Date(check.intermediateCheckDate), 'yyyy년 M월 d일', { locale: ko })}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">점검 내용 (선택)</Label>
              <Textarea
                id="notes"
                placeholder="점검 결과나 특이사항을 입력하세요"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleComplete} disabled={completeMutation.isPending}>
              {completeMutation.isPending ? '처리 중...' : '완료 처리'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Alert>
  );
}

export default IntermediateCheckAlert;
