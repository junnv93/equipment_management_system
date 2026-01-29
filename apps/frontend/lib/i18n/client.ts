/**
 * i18n 클라이언트 훅
 *
 * next-intl을 사용한 클라이언트 사이드 번역 훅
 * 서버 컴포넌트에서는 getTranslations를 사용하고,
 * 클라이언트 컴포넌트에서는 useTranslations를 사용합니다.
 */

import { useTranslations } from 'next-intl';

/**
 * 클라이언트 컴포넌트에서 사용하는 번역 훅
 *
 * @param namespace 번역 네임스페이스 (예: 'reservations', 'equipment')
 * @returns 번역 함수 객체
 */
export function useTranslation(namespace: string) {
  const t = useTranslations(namespace);

  return {
    t: (key: string, values?: Record<string, string | number | Date>) => {
      try {
        return t(key, values);
      } catch {
        // 번역 키가 없는 경우 키를 그대로 반환
        console.warn(`Translation key not found: ${namespace}.${key}`);
        return key;
      }
    },
  };
}
