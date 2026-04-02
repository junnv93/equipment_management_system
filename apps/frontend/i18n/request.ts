import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from '@equipment-management/schemas';

/**
 * next-intl 서버 설정 — Middleware 헤더 기반 로케일 (PPR 친화적)
 *
 * 로케일 해석 체인:
 * 1. requestLocale — Middleware가 x-next-intl-locale 헤더로 주입한 값
 *    (JWT locale → SUPPORTED_LOCALES 검증 → DEFAULT_LOCALE 폴백)
 * 2. 폴백: DEFAULT_LOCALE ('ko')
 *    - /login 등 Middleware matcher 외부 경로에서 적용
 *
 * PPR 호환성:
 * - cookies() 제거 → Dynamic API를 Suspense 외부에서 사용하지 않음
 * - requestLocale은 next-intl이 내부적으로 x-next-intl-locale 헤더를 읽음
 * - app/layout.tsx의 IntlProvider(Suspense 내부)에서 getLocale()을 호출하므로
 *   Dynamic hole 내에서만 실행됨 → RootLayout 정적 셸 블로킹 없음
 *
 * 네임스페이스:
 * - Phase 0: common, equipment, auth, reservations (기존 4개)
 * - Phase 1+: errors, navigation, dashboard, checkouts, calibration,
 *             approvals, settings, notifications, teams (추가 예정)
 *
 * 없는 네임스페이스 파일은 무시 (점진적 추가 지원)
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  const locale: SupportedLocale = hasLocale(SUPPORTED_LOCALES, requested)
    ? (requested as SupportedLocale)
    : DEFAULT_LOCALE;

  // 네임스페이스 동적 로딩 (없는 파일은 무시)
  const namespaces = [
    'common',
    'equipment',
    'auth',
    'reservations',
    'errors',
    'navigation',
    'dashboard',
    'checkouts',
    'calibration',
    'approvals',
    'settings',
    'notifications',
    'teams',
    'disposal',
    'non-conformances',
    'audit',
    'software',
    'data-migration',
    'monitoring',
  ];

  const loadedMessages: Record<string, Record<string, unknown>> = {};

  await Promise.all(
    namespaces.map(async (ns) => {
      try {
        const mod = await import(`../messages/${locale}/${ns}.json`);
        loadedMessages[ns] = mod.default;
      } catch {
        // 아직 생성되지 않은 네임스페이스 무시
      }
    })
  );

  return {
    locale,
    messages: loadedMessages,
  };
});
