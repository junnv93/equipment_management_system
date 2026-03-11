'use client';

import { useTranslations } from 'next-intl';
import { SETTINGS_PAGE_HEADER_TOKENS, getSettingsPageHeaderClasses } from '@/lib/design-tokens';

/**
 * 설정 페이지 헤더 (Client Component)
 *
 * i18n 지원을 위해 CSC로 분리.
 * layout.tsx(RSC)에서 임포트하여 PPR 정적 셸을 유지하면서
 * 다국어 텍스트를 클라이언트에서 렌더링합니다.
 *
 * 와이어프레임 v2: 그라디언트/격자 overlay 제거 → 단순 border-b 구분선
 */
export function SettingsPageHeader() {
  const t = useTranslations('settings');

  return (
    <div className={getSettingsPageHeaderClasses()}>
      <h1 className={SETTINGS_PAGE_HEADER_TOKENS.title}>{t('title')}</h1>
      <p className={SETTINGS_PAGE_HEADER_TOKENS.description}>{t('description')}</p>
    </div>
  );
}
