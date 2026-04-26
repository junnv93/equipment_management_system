import type { useTranslations } from 'next-intl';

type NCTranslationFn = ReturnType<typeof useTranslations<'non-conformances'>>;

/** NC 번역 키 타입 — next-intl Parameters 집중화 */
export type NCMessageKey = Parameters<NCTranslationFn>[0];

/**
 * 동적으로 구성된 NC 번역 키를 next-intl 타입으로 변환.
 * `as Parameters<typeof t>[0]` 캐스트를 이 파일 1개소에 집중.
 */
export function getNCMessageKey(key: string): NCMessageKey {
  return key as NCMessageKey;
}
