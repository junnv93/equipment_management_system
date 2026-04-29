import { getTranslations } from 'next-intl/server';
import { FEEDBACK_KEYS } from '@/lib/i18n/feedback-keys';
import { CreateEquipmentFormSkeleton } from './page';

export default async function CreateEquipmentLoading() {
  const t = await getTranslations();
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t(FEEDBACK_KEYS.loadingForm)}</span>
      <CreateEquipmentFormSkeleton />
    </div>
  );
}
