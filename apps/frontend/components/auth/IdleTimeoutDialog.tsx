'use client';

import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IDLE_WARNING_BEFORE_SECONDS } from '@equipment-management/shared-constants';
import { IDLE_TIMEOUT_DIALOG_TOKENS, getIdleTimeoutUrgencyClasses } from '@/lib/design-tokens';

// SVG ring 상수 (design token에서 파생)
const RING = IDLE_TIMEOUT_DIALOG_TOKENS.ring;
const RADIUS = (RING.size - RING.strokeWidth) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface IdleTimeoutDialogProps {
  open: boolean;
  secondsRemaining: number;
  onContinue: () => void;
  onLogout: () => void;
}

export function IdleTimeoutDialog({
  open,
  secondsRemaining,
  onContinue,
  onLogout,
}: IdleTimeoutDialogProps) {
  const t = useTranslations('auth.idleTimeout');
  const urgency = getIdleTimeoutUrgencyClasses(secondsRemaining);
  const progress = secondsRemaining / IDLE_WARNING_BEFORE_SECONDS;
  const dashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onContinue();
        }}
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={IDLE_TIMEOUT_DIALOG_TOKENS.iconContainer}>
              <Clock className={IDLE_TIMEOUT_DIALOG_TOKENS.iconSize} aria-hidden="true" />
            </div>
            <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>

        {/* Countdown Ring */}
        <div
          className="flex flex-col items-center py-4"
          role="timer"
          aria-label={`${formatCountdown(secondsRemaining)} ${t('remaining')}`}
        >
          <div className="relative" style={{ width: RING.size, height: RING.size }}>
            <svg
              className="-rotate-90"
              width={RING.size}
              height={RING.size}
              viewBox={`0 0 ${RING.size} ${RING.size}`}
              aria-hidden="true"
            >
              {/* Track (배경 원) */}
              <circle
                cx={RING.size / 2}
                cy={RING.size / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={RING.strokeWidth}
                className={IDLE_TIMEOUT_DIALOG_TOKENS.ringTrack}
                stroke="currentColor"
              />
              {/* Progress (잔여 시간) */}
              <circle
                cx={RING.size / 2}
                cy={RING.size / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={RING.strokeWidth}
                strokeLinecap="round"
                stroke="currentColor"
                strokeDasharray={CIRCUMFERENCE}
                className={cn(urgency.ring, IDLE_TIMEOUT_DIALOG_TOKENS.ringTransition)}
                style={{ strokeDashoffset: dashoffset }}
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn(IDLE_TIMEOUT_DIALOG_TOKENS.countdownText, urgency.text)}>
                {formatCountdown(secondsRemaining)}
              </span>
              <span className={IDLE_TIMEOUT_DIALOG_TOKENS.countdownLabel}>{t('remaining')}</span>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onContinue} autoFocus>
            {t('continueButton')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onLogout}
            className={buttonVariants({ variant: 'destructive' })}
          >
            {t('logoutButton')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
