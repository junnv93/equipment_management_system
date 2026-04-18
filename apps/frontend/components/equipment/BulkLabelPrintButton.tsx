'use client';

import * as React from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LABEL_CONFIG } from '@equipment-management/shared-constants';
import type { Equipment } from '@/lib/api/equipment-api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { generateLabelPdf } from '@/lib/qr/generate-label-pdf';
import { toast } from '@/components/ui/use-toast';

interface BulkLabelPrintButtonProps {
  /** 사용자가 선택한 장비 목록 (useBulkSelection의 selectedItems). */
  selectedItems: Equipment[];
  /** 선택 해제 콜백 (다운로드 완료 후 호출). */
  onComplete?: () => void;
  /** 버튼 스타일 변형. */
  variant?: 'default' | 'outline';
}

type Phase = 'idle' | 'confirming' | 'generating' | 'error';

/**
 * 선택된 장비들의 QR 라벨 PDF를 Web Worker로 생성 후 다운로드.
 *
 * 원칙:
 * - `LABEL_CONFIG.maxBatch` SSOT 기반 배치 검증 — 초과 시 confirm 다이얼로그
 * - i18n (`qr.labelPrint.*`)만 사용 — 하드코딩 문자열 0
 * - Blob URL `revokeObjectURL`로 메모리 누수 방지
 * - 실패 시 toast.error + 상태 초기화
 */
export function BulkLabelPrintButton({
  selectedItems,
  onComplete,
  variant = 'default',
}: BulkLabelPrintButtonProps) {
  const t = useTranslations('qr.labelPrint');
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });

  const count = selectedItems.length;
  const disabled = count === 0 || phase === 'generating';

  const runGeneration = React.useCallback(async () => {
    setPhase('generating');
    setProgress({ done: 0, total: count });
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || window.location.origin;
      const blob = await generateLabelPdf({
        items: selectedItems.map((e) => ({
          managementNumber: e.managementNumber,
          equipmentName: e.name,
          serialNumber: e.serialNumber ?? undefined,
        })),
        appUrl,
        onProgress: (done, total) => setProgress({ done, total }),
      });

      const url = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `equipment-labels-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } finally {
        URL.revokeObjectURL(url);
      }

      toast({ description: t('downloadReady', { count }) });
      setPhase('idle');
      onComplete?.();
    } catch (error) {
      setPhase('error');
      toast({
        variant: 'destructive',
        description: t('generationFailed'),
      });
      console.error('generateLabelPdf failed', error);
      // 재시도 가능하도록 idle로 복귀
      window.setTimeout(() => setPhase('idle'), 1200);
    }
  }, [count, selectedItems, onComplete, t]);

  const handleClick = React.useCallback(() => {
    if (count === 0) return;
    if (count > LABEL_CONFIG.maxBatch) {
      setPhase('confirming');
      return;
    }
    void runGeneration();
  }, [count, runGeneration]);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        aria-label={t('buttonAriaLabel', { count })}
      >
        {phase === 'generating' ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
        )}
        {t('selectedCount', { count })}
      </Button>

      {phase === 'generating' && progress.total > 0 && (
        <div className="mt-2 flex items-center gap-2" role="status" aria-live="polite">
          <Progress
            value={progress.total === 0 ? 0 : (progress.done / progress.total) * 100}
            className="h-2"
          />
          <span className="text-xs text-muted-foreground tabular-nums">
            {progress.done}/{progress.total}
          </span>
        </div>
      )}

      <AlertDialog open={phase === 'confirming'} onOpenChange={(open) => !open && setPhase('idle')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('exceedMaxBatchTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('exceedMaxBatchBody', { count, max: LABEL_CONFIG.maxBatch })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPhase('idle');
                void runGeneration();
              }}
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
