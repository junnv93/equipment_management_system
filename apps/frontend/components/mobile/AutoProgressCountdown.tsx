/**
 * AutoProgressCountdown — 1액션 자동 진행 카운트다운 UI (qr-visual-redesign TASK 4 / 2026-05-11).
 *
 * QR 스캔 후 가능한 액션이 1개뿐이고 `priority >= 100` (즉시성 액션) 일 때,
 * 2초 카운트다운 후 자동 라우팅한다. 사용자가 환경설정으로 `prefers-reduced-motion: reduce`
 * 를 활성화하면 인디케이터 없이 1.5초 단순 지연으로 대체.
 *
 * 1차 텍스트 ≥16px (text-sm 14→16px), 취소 버튼 ≥48px (`--touch-target-min`).
 *
 * Cancel callback 은 호출자 (`EquipmentLandingClient`) 가 일반 `EquipmentActionSheet`
 * 폴백으로 전환하는 책임을 진다.
 */
'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CSS_VAR_NAMES, cssVar } from '@/lib/design-tokens/css-variables';

export interface AutoProgressCountdownProps {
  /** 카운트다운 지속 시간 (ms). 기본 2000. */
  durationMs?: number;
  /** reduced-motion 감지 시 사용할 단순 지연 (ms). 기본 1500. */
  reducedMotionDurationMs?: number;
  /** 진행 라벨 (이미 i18n 으로 해석된 텍스트) */
  actionLabel: string;
  onComplete: () => void;
  onCancel: () => void;
  className?: string;
}

/** SSR-safe `prefers-reduced-motion: reduce` 감지 */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

const CIRCLE_RADIUS = 28;
const CIRCLE_CIRCUMFERENCE = Math.PI * 2 * CIRCLE_RADIUS;

export function AutoProgressCountdown({
  durationMs = 2000,
  reducedMotionDurationMs = 1500,
  actionLabel,
  onComplete,
  onCancel,
  className,
}: AutoProgressCountdownProps) {
  const t = useTranslations('qr.landing.autoProgress');
  const reduced = useReducedMotion();

  // G-8: rAF setState 제거 — circle 의 strokeDashoffset 은 ref + CSS transition 으로 일임 (React reconciliation 0회).
  //      카운트다운 텍스트만 1초 tick (setInterval) — 총 re-render 수 durationMs(2s) ≈ 2~3 회.
  const circleRef = React.useRef<SVGCircleElement | null>(null);
  const cancelledRef = React.useRef(false);
  const completeRef = React.useRef(onComplete);
  React.useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const [remainingSec, setRemainingSec] = React.useState(() =>
    Math.ceil((reduced ? reducedMotionDurationMs : durationMs) / 1000)
  );

  // reduced-motion: simple timeout, no indicator
  React.useEffect(() => {
    if (!reduced) return undefined;
    const tid = window.setTimeout(() => {
      if (!cancelledRef.current) completeRef.current();
    }, reducedMotionDurationMs);
    return () => window.clearTimeout(tid);
  }, [reduced, reducedMotionDurationMs]);

  // standard: CSS transition + 1s tick for countdown text.
  React.useEffect(() => {
    if (reduced) return undefined;
    cancelledRef.current = false;
    // Initial state — full circumference offset (0% progress).
    if (circleRef.current) {
      circleRef.current.style.transition = 'none';
      circleRef.current.style.strokeDashoffset = String(CIRCLE_CIRCUMFERENCE);
    }
    // Next task: switch transition to linear durationMs, drive offset to 0 (100% progress).
    // setTimeout(0) 으로 다음 task tick 에 적용 (같은 frame 내 style 변경은 브라우저가 batch 처리하여 transition trigger 누락).
    const startTid = window.setTimeout(() => {
      if (circleRef.current && !cancelledRef.current) {
        circleRef.current.style.transition = `stroke-dashoffset ${durationMs}ms linear`;
        circleRef.current.style.strokeDashoffset = '0';
      }
    }, 0);
    // 완료 트리거 — durationMs 후 onComplete (단일 setTimeout, re-render 없음).
    const completeTid = window.setTimeout(() => {
      if (!cancelledRef.current) completeRef.current();
    }, durationMs);
    // 카운트다운 텍스트 tick — 1초마다 re-render (총 2~3회 / 2s).
    const tickInterval = window.setInterval(() => {
      setRemainingSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      window.clearTimeout(startTid);
      window.clearTimeout(completeTid);
      window.clearInterval(tickInterval);
    };
  }, [reduced, durationMs]);

  const handleCancel = React.useCallback(() => {
    cancelledRef.current = true;
    onCancel();
  }, [onCancel]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t('label', { action: actionLabel })}
      className={cn(
        'flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center',
        className
      )}
    >
      {!reduced && (
        <svg
          viewBox="0 0 64 64"
          className="h-16 w-16"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="32" cy="32" r="28" className="stroke-border" strokeWidth="4" fill="none" />
          <circle
            ref={circleRef}
            cx="32"
            cy="32"
            r="28"
            className="stroke-brand-urgent"
            strokeWidth="4"
            fill="none"
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            strokeDashoffset={CIRCLE_CIRCUMFERENCE}
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
          />
        </svg>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground md:text-base">
          {t('label', { action: actionLabel })}
        </p>
        {!reduced && (
          <p className="font-mono tabular-nums text-xs text-foreground/70">
            {t('countdown', { seconds: remainingSec })}
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        className="w-full max-w-xs"
        style={{ minHeight: cssVar(CSS_VAR_NAMES.touchTargetMin) }}
      >
        <X className="mr-1 h-4 w-4" aria-hidden="true" />
        <span className="text-sm font-medium">{t('cancel')}</span>
      </Button>
    </div>
  );
}
