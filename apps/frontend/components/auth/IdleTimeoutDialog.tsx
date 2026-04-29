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
        {/* ── 헤더: 아이콘 + 제목 + 설명 ── */}
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={IDLE_TIMEOUT_DIALOG_TOKENS.iconContainer}>
              <Clock className={IDLE_TIMEOUT_DIALOG_TOKENS.iconSize} aria-hidden="true" />
            </div>
            <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-balance">
            {t('description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* ── 카운트다운 영역 ──
            ring: 시간 숫자만 표시 (영문/한국어 라벨 오버플로 방지)
            라벨: ring 하단 별도 배치 → 전체 다이얼로그 너비 활용 가능
        */}
        <div
          className="flex flex-col items-center gap-3 py-2"
          role="timer"
          aria-label={`${formatCountdown(secondsRemaining)} ${t('remaining')}`}
          aria-live="off"
        >
          {/* Ring */}
          <div className="relative" style={{ width: RING.size, height: RING.size }}>
            <svg
              className="-rotate-90"
              width={RING.size}
              height={RING.size}
              viewBox={`0 0 ${RING.size} ${RING.size}`}
              aria-hidden="true"
            >
              {/* 트랙 (배경 원) */}
              <circle
                cx={RING.size / 2}
                cy={RING.size / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={RING.strokeWidth}
                className={IDLE_TIMEOUT_DIALOG_TOKENS.ringTrack}
                stroke="currentColor"
              />
              {/* 진행 원 */}
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

            {/* 중심: 시간만 — 라벨은 ring 밖으로 분리 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(IDLE_TIMEOUT_DIALOG_TOKENS.countdownText, urgency.text)}>
                {formatCountdown(secondsRemaining)}
              </span>
            </div>
          </div>

          {/* ring 하단 라벨 — 전체 너비 확보로 영문 긴 텍스트도 안전 */}
          <p className={IDLE_TIMEOUT_DIALOG_TOKENS.countdownLabel}>{t('remaining')}</p>
        </div>

        {/* ── 버튼 영역 ──
            DOM 순서: [로그아웃(Action), 계속사용(Cancel)]
            AlertDialogFooter(flex-col-reverse sm:flex-row sm:justify-end):
              - 모바일: col-reverse → Cancel(계속사용)이 시각 상단 = 안전 액션 우선 ✓
              - 데스크톱: row → Action(로그아웃) 왼쪽, Cancel(계속사용) 오른쪽 = 주요 액션 우측 ✓
        */}
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onLogout}
            className={buttonVariants({ variant: 'destructive' })}
          >
            {t('logoutButton')}
          </AlertDialogAction>
          <AlertDialogCancel onClick={onContinue} autoFocus>
            {t('continueButton')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
