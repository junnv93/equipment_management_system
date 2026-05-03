import { getTranslations } from 'next-intl/server';
import { FEEDBACK_KEYS } from '@/lib/i18n/feedback-keys';
import { CalibrationFactorsLoadingSkeleton } from './CalibrationFactorsLoadingSkeleton';

export default async function CalibrationFactorsLoading() {
  const t = await getTranslations();
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t(FEEDBACK_KEYS.loadingList)}</span>
      <CalibrationFactorsLoadingSkeleton />
    </div>
  );
}
