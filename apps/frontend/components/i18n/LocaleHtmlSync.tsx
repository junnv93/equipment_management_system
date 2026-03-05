'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';

/**
 * LocaleHtmlSync — <html lang> 동기화 (Root Cause 5 해결)
 *
 * PPR 정적 셸에서 lang={DEFAULT_LOCALE}으로 고정된 값을
 * 클라이언트 hydration 이후 실제 locale 값으로 업데이트.
 *
 * NextIntlClientProvider 내부에 배치하여 locale 변경 즉시 반영.
 */
export function LocaleHtmlSync() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
