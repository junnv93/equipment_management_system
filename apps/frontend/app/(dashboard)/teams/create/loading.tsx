import { getTranslations } from 'next-intl/server';
import { getPageContainerClasses } from '@/lib/design-tokens';
import { FEEDBACK_KEYS } from '@/lib/i18n/feedback-keys';
import { CreateTeamPageSkeleton } from './CreateTeamPageSkeleton';

export default async function CreateTeamLoading() {
  const t = await getTranslations();
  return (
    <div
      className={getPageContainerClasses('form')}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{t(FEEDBACK_KEYS.loadingForm)}</span>
      <CreateTeamPageSkeleton />
    </div>
  );
}
