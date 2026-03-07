'use client';

import { ClipboardCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CALIBRATION_EMPTY_STATE } from '@/lib/design-tokens';

export default function SelfInspectionTab() {
  const t = useTranslations('calibration');

  return (
    <div className={CALIBRATION_EMPTY_STATE.container}>
      <ClipboardCheck className={CALIBRATION_EMPTY_STATE.icon} />
      <h3 className={CALIBRATION_EMPTY_STATE.title}>{t('content.selfInspection.empty.title')}</h3>
      <p className={CALIBRATION_EMPTY_STATE.description}>
        {t('content.selfInspection.empty.description')}
      </p>
    </div>
  );
}
