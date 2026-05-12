'use client';

import { useState, useId } from 'react';
import { useTranslations } from 'next-intl';
import { Undo2 } from 'lucide-react';

import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRevocationWindow } from '@/hooks/use-revocation-window';

interface RevocationWindowCountdownProps {
  /** 승인 시각 ISO 8601 timestamp (서버 응답 SSOT). */
  approvedAt: string | null | undefined;
  /** 사유 입력 후 호출되는 callback — 부모가 revoke-approval mutation 트리거. */
  onRevoke: (reason: string) => void;
  /** mutation pending 상태 (부모에서 전달). */
  isPending?: boolean;
}

/**
 * 승인 철회 5분 윈도우 countdown UI (S-2).
 *
 * - WCAG 2.1 AA: `role="timer"` + `aria-live="polite"` + `aria-atomic="true"`.
 * - 만료 시 button disabled + Tooltip 사유 swap (hide 금지, MEMORY `feedback_disabled_with_reason_over_hide`).
 * - 5초 undo toast(use-undo-toast.tsx)와 별도 경로 — 5초 후에도 5분 윈도우 진행.
 * - 사유 입력 dialog: REVOCATION_REASON_MIN_LENGTH(10) + LONG_TEXT_MAX_LENGTH(500) SSOT.
 *
 * **하드코딩 0**: 5분 윈도우는 `useRevocationWindow` hook 내부에서 SSOT 임포트 — 본 컴포넌트는
 * 상수를 직접 참조하지 않음. mm:ss 포맷도 hook 결과 사용.
 */
export function RevocationWindowCountdown({
  approvedAt,
  onRevoke,
  isPending,
}: RevocationWindowCountdownProps) {
  const t = useTranslations('checkouts.revocationWindow');
  const window_ = useRevocationWindow(approvedAt);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const reasonId = useId();
  const counterId = useId();
  const disabledReasonId = useId();

  const trimmedReason = reason.trim();
  const reasonLen = reason.length;
  const isReasonValid =
    trimmedReason.length >= VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH &&
    reasonLen <= VALIDATION_RULES.LONG_TEXT_MAX_LENGTH;
  const canSubmit = isReasonValid && window_.isActive && !isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onRevoke(trimmedReason);
    setDialogOpen(false);
    setReason('');
  };

  // 승인 미진행 상태(approvedAt 없음)는 컴포넌트 자체를 렌더 안 함 — 부모가 status guard.
  // 만료 후에는 본 컴포넌트가 disabled 상태로 계속 표시되어 사용자에게 "왜 안 되는가" 사유 전달.
  if (!approvedAt) return null;

  const buttonLabel = window_.isExpired
    ? t('expiredLabel')
    : t('countdownLabel', { time: window_.mmss });

  return (
    <>
      <div className="flex items-center gap-2">
        <span
          role="timer"
          aria-live="polite"
          aria-atomic="true"
          aria-label={t('aria.timer', { time: window_.mmss })}
          className="sr-only"
        >
          {t('aria.remaining', { time: window_.mmss })}
        </span>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                  disabled={!window_.isActive || isPending}
                  aria-disabled={!window_.isActive || isPending}
                  aria-describedby={window_.isExpired ? disabledReasonId : undefined}
                >
                  <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  {buttonLabel}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent role="tooltip">
              {window_.isExpired ? (
                <span id={disabledReasonId}>{t('expiredTooltip')}</span>
              ) : (
                t('activeTooltip', { time: window_.mmss })
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialog.title')}</DialogTitle>
            <DialogDescription>{t('dialog.description', { time: window_.mmss })}</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor={reasonId}>{t('dialog.reasonLabel')}</Label>
            <Textarea
              id={reasonId}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={VALIDATION_RULES.LONG_TEXT_MAX_LENGTH}
              rows={4}
              aria-invalid={!isReasonValid}
              aria-describedby={counterId}
              disabled={isPending}
              placeholder={t('dialog.reasonPlaceholder', {
                min: VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH,
              })}
            />
            <p
              id={counterId}
              className="text-2xs font-mono text-muted-foreground text-right"
              aria-live="polite"
            >
              {reasonLen} / {VALIDATION_RULES.LONG_TEXT_MAX_LENGTH}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setReason('');
              }}
              disabled={isPending}
            >
              {t('dialog.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {t('dialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
