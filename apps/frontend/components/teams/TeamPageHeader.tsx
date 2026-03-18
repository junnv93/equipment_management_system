'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/shared/PageHeader';

/**
 * 팀 목록 페이지 헤더 (Client Component)
 *
 * PPR sync Server Component에서 async getTranslations() 불가 → 별도 Client Component로 분리.
 * IntlProvider는 layout.tsx에서 이미 로드되므로 useTranslations() 즉시 작동.
 */
export function TeamPageHeader() {
  const t = useTranslations('teams');

  return <PageHeader title={t('title')} subtitle={t('pageDescription')} />;
}
