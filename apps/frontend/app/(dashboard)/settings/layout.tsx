import type { ReactNode } from 'react';
import { SettingsNavigationClient } from './SettingsNavigationClient';
import { SettingsPageHeader } from './SettingsPageHeader';
import { SETTINGS_LAYOUT_TOKENS } from '@/lib/design-tokens';

/**
 * 설정 레이아웃 (Server Component — Non-Blocking)
 *
 * cacheComponents 호환 아키텍처:
 * - async 없음 → 정적 셸로 즉시 프리렌더 가능
 * - i18n 텍스트: SettingsPageHeader(CSC)에서 useTranslations 사용
 * - 인증 가드: middleware.ts에서 처리 (렌더링 전 JWT 검증)
 * - 역할 기반 네비게이션: SettingsNavigationClient에서 useSession()으로 자체 접근
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={SETTINGS_LAYOUT_TOKENS.container}>
      {/* CSC 헤더: useTranslations('settings')으로 i18n 지원 */}
      <SettingsPageHeader />

      <div className={SETTINGS_LAYOUT_TOKENS.contentRow}>
        {/* CSC 네비게이션: useSession()으로 역할 자체 접근 */}
        <SettingsNavigationClient />

        {/* 콘텐츠 영역 */}
        <div className={SETTINGS_LAYOUT_TOKENS.mainArea}>
          <div
            className={SETTINGS_LAYOUT_TOKENS.enterAnimation}
            style={{ animationFillMode: 'backwards' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
