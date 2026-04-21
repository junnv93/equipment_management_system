'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, PackageCheck, X } from 'lucide-react';
import { CHECKOUT_ALERT_TOKENS } from '@/lib/design-tokens';
import { getTransitionClasses } from '@/lib/design-tokens';
import type { CheckoutSummary } from '@/lib/api/checkout-api';

interface CheckoutAlertBannersProps {
  summary: CheckoutSummary;
  overdueSectionId?: string;
}

/**
 * 반출 관리 페이지 Alert-First 배너
 *
 * - 기한 초과 배너: summary.overdue > 0
 * - 반입 승인 대기 배너: summary.returnedToday > 0
 *
 * 프레젠테이셔널 컴포넌트 — 부모가 summary 전달
 */
export default function CheckoutAlertBanners({
  summary,
  overdueSectionId = 'overdue-group-section',
}: CheckoutAlertBannersProps) {
  const t = useTranslations('checkouts');
  const [overdueVisible, setOverdueVisible] = useState(true);
  const [pendingCheckVisible, setPendingCheckVisible] = useState(true);
  const pendingCheckRef = useRef<HTMLDivElement>(null);

  const showOverdue = summary.overdue > 0 && overdueVisible;
  const showPendingCheck = summary.returnedToday > 0 && pendingCheckVisible;

  if (!showOverdue && !showPendingCheck) return null;

  const motionFade = getTransitionClasses('fast', ['opacity']);

  return (
    <div className={`space-y-2 mb-4 ${motionFade}`} role="alert" aria-live="polite">
      {/* 기한 초과 배너 */}
      {showOverdue && (
        <div className={CHECKOUT_ALERT_TOKENS.overdue.container}>
          <AlertTriangle className={CHECKOUT_ALERT_TOKENS.overdue.icon} aria-hidden="true" />
          <p className={CHECKOUT_ALERT_TOKENS.overdue.text}>
            {t('alerts.overdueTitle', { count: summary.overdue })}
          </p>
          <button
            type="button"
            className={CHECKOUT_ALERT_TOKENS.overdue.action}
            onClick={() => {
              const el = document.getElementById(overdueSectionId);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                el.focus({ preventScroll: true });
              }
            }}
            aria-label={t('alerts.overdueScrollAriaLabel')}
          >
            {t('alerts.overdueAction')}
          </button>
          <button
            type="button"
            className={CHECKOUT_ALERT_TOKENS.overdue.close}
            onClick={() => {
              setOverdueVisible(false);
              // WCAG 2.1 SC 2.4.3: 배너 제거 후 포커스 이전
              requestAnimationFrame(() => {
                const btn = pendingCheckRef.current?.querySelector<HTMLButtonElement>('button');
                if (btn) {
                  btn.focus();
                } else {
                  document.getElementById(overdueSectionId)?.focus();
                }
              });
            }}
            aria-label={t('alerts.bannerClose')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 반입 승인 대기 배너 */}
      {showPendingCheck && (
        <div ref={pendingCheckRef} className={CHECKOUT_ALERT_TOKENS.pendingCheck.container}>
          <PackageCheck className={CHECKOUT_ALERT_TOKENS.pendingCheck.icon} aria-hidden="true" />
          <p className={CHECKOUT_ALERT_TOKENS.pendingCheck.text}>
            {t('alerts.pendingCheckTitle', { count: summary.returnedToday })}
          </p>
          <button
            type="button"
            className={CHECKOUT_ALERT_TOKENS.pendingCheck.action}
            onClick={() => setPendingCheckVisible(false)}
          >
            {t('alerts.pendingCheckAction')}
          </button>
        </div>
      )}
    </div>
  );
}
