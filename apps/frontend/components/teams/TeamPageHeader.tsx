'use client';

import { useTranslations } from 'next-intl';
import { PAGE_HEADER_TOKENS } from '@/lib/design-tokens';

/**
 * 팀 목록 페이지 헤더 (Client Component)
 *
 * PPR sync Server Component에서 async getTranslations() 불가 → 별도 Client Component로 분리.
 * IntlProvider는 layout.tsx에서 이미 로드되므로 useTranslations() 즉시 작동.
 */
export function TeamPageHeader() {
  const t = useTranslations('teams');

  return (
    <div className={PAGE_HEADER_TOKENS.titleGroup}>
      <h1 className={PAGE_HEADER_TOKENS.title}>{t('title')}</h1>
      <p className={PAGE_HEADER_TOKENS.subtitle}>{t('pageDescription')}</p>
    </div>
  );
}
