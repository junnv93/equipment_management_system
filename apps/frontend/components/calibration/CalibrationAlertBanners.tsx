'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, CalendarClock, X } from 'lucide-react';
import { CALIBRATION_ALERT_TOKENS, getTransitionClasses } from '@/lib/design-tokens';

interface CalibrationAlertBannersProps {
  overdue: number;
  upcoming: number;
}

/**
 * 교정 관리 페이지 Alert-First 배너
 *
 * - 교정기한 초과 배너: overdue > 0 (UL-QP-18: 사용 금지 대상)
 * - 교정 예정 배너: upcoming > 0 (30일 이내)
 *
 * 프레젠테이셔널 컴포넌트 — 부모가 stats 전달
 */
export default function CalibrationAlertBanners({
  overdue,
  upcoming,
}: CalibrationAlertBannersProps) {
  const t = useTranslations('calibration');
  const [overdueVisible, setOverdueVisible] = useState(true);
  const [upcomingVisible, setUpcomingVisible] = useState(true);

  const showOverdue = overdue > 0 && overdueVisible;
  const showUpcoming = upcoming > 0 && upcomingVisible;

  if (!showOverdue && !showUpcoming) return null;

  const motionFade = getTransitionClasses('fast', ['opacity']);

  return (
    <div className={`space-y-2 ${motionFade}`} role="alert" aria-live="polite">
      {showOverdue && (
        <div className={CALIBRATION_ALERT_TOKENS.overdue.container}>
          <AlertTriangle className={CALIBRATION_ALERT_TOKENS.overdue.icon} aria-hidden="true" />
          <p className={CALIBRATION_ALERT_TOKENS.overdue.text}>
            {t('alerts.overdueTitle', { count: overdue })}
          </p>
          <button
            type="button"
            className={CALIBRATION_ALERT_TOKENS.overdue.action}
            onClick={() => {
              document
                .querySelector('[role="tabpanel"]')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            {t('alerts.overdueAction')}
          </button>
          <button
            type="button"
            className={CALIBRATION_ALERT_TOKENS.overdue.close}
            onClick={() => setOverdueVisible(false)}
            aria-label="배너 닫기"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {showUpcoming && !showOverdue && (
        <div className={CALIBRATION_ALERT_TOKENS.upcoming.container}>
          <CalendarClock className={CALIBRATION_ALERT_TOKENS.upcoming.icon} aria-hidden="true" />
          <p className={CALIBRATION_ALERT_TOKENS.upcoming.text}>
            {t('alerts.upcomingTitle', { count: upcoming })}
          </p>
          <button
            type="button"
            className={CALIBRATION_ALERT_TOKENS.upcoming.action}
            onClick={() => setUpcomingVisible(false)}
          >
            {t('alerts.upcomingAction')}
          </button>
          <button
            type="button"
            className={CALIBRATION_ALERT_TOKENS.upcoming.close}
            onClick={() => setUpcomingVisible(false)}
            aria-label="배너 닫기"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
