'use client';

import { useTranslations } from 'next-intl';
import { Info, X } from 'lucide-react';
import { INSPECTION_PREFILL_NOTICE } from '@/lib/design-tokens';
import { track } from '@/lib/analytics/track';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

export interface InspectionPrefillNoticesProps {
  previousInspectionApplied: boolean;
  prefillBannerSummary: string | null;
  prefillBannerDismissed: boolean;
  sourceInspectionDate?: string | null;
  showNoSourceNotice: boolean;
  onDismissBanner: () => void;
}

export function InspectionPrefillNotices({
  previousInspectionApplied,
  prefillBannerSummary,
  prefillBannerDismissed,
  sourceInspectionDate,
  showNoSourceNotice,
  onDismissBanner,
}: InspectionPrefillNoticesProps) {
  const t = useTranslations('calibration');

  return (
    <>
      {previousInspectionApplied && prefillBannerSummary && !prefillBannerDismissed && (
        <div role="status" aria-live="polite" className={INSPECTION_PREFILL_NOTICE.banner}>
          <Info className={INSPECTION_PREFILL_NOTICE.icon} aria-hidden="true" />
          <div className={INSPECTION_PREFILL_NOTICE.body}>
            <p className="font-medium">{t('intermediateInspection.prefill.banner.title')}</p>
            <p>
              {t('intermediateInspection.prefill.banner.description', {
                summary: prefillBannerSummary,
              })}
            </p>
            {sourceInspectionDate && (
              <p className={INSPECTION_PREFILL_NOTICE.meta}>
                {t('intermediateInspection.prefill.banner.meta', { date: sourceInspectionDate })}
              </p>
            )}
          </div>
          <button
            type="button"
            className={INSPECTION_PREFILL_NOTICE.dismissButton}
            onClick={() => {
              onDismissBanner();
              track(ANALYTICS_EVENTS.INSPECTION_PREFILL_BANNER_DISMISSED, {
                inspectionType: 'intermediate',
              });
            }}
            aria-label={t('intermediateInspection.prefill.banner.dismiss')}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {showNoSourceNotice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {t('intermediateInspection.prefill.noSourceNotice.title')}
            </p>
            <p>{t('intermediateInspection.prefill.noSourceNotice.description')}</p>
          </div>
        </div>
      )}
    </>
  );
}
