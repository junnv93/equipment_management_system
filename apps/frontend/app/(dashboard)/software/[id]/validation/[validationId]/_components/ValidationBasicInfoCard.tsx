'use client';

import { useTranslations } from 'next-intl';
import { FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VALIDATION_INFO_CARD_TOKENS as TOK } from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import type { SoftwareValidation } from '@/lib/api/software-api';

interface ValidationBasicInfoCardProps {
  validation: SoftwareValidation;
}

/**
 * P2-2 + 스니펫5: dt/dd 위계 강화 — 라벨은 더 작고 균등(uppercase tracking-wider),
 * 값은 더 크고 진하게. VALIDATION_INFO_CARD_TOKENS SSOT 사용.
 */
export function ValidationBasicInfoCard({ validation }: ValidationBasicInfoCardProps) {
  const t = useTranslations('software');
  const { fmtDate } = useDateFormatter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCheck className="h-5 w-5 text-brand-info" aria-hidden="true" />
          {t('validation.detail.basicInfo')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className={TOK.dl}>
          <div>
            <dt className={TOK.dt}>{t('validation.detail.validationType')}</dt>
            <dd className={TOK.dd}>{t(`validationType.${validation.validationType}`)}</dd>
          </div>
          <div>
            <dt className={TOK.dt}>{t('validation.detail.softwareVersion')}</dt>
            <dd className={TOK.ddMono}>{validation.softwareVersion || '-'}</dd>
          </div>
          <div>
            <dt className={TOK.dt}>{t('validation.detail.testDate')}</dt>
            <dd className={TOK.dd}>{validation.testDate ? fmtDate(validation.testDate) : '-'}</dd>
          </div>
          {validation.infoDate && (
            <div>
              <dt className={TOK.dt}>{t('validation.detail.infoDate')}</dt>
              <dd className={TOK.dd}>{fmtDate(validation.infoDate)}</dd>
            </div>
          )}
          {validation.softwareAuthor && (
            <div>
              <dt className={TOK.dt}>{t('validation.detail.softwareAuthor')}</dt>
              <dd className={TOK.dd}>{validation.softwareAuthor}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
