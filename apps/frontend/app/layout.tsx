import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Inter, Noto_Sans_KR, DM_Sans, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Providers } from '@/lib/providers';
import { Toaster } from '@/components/ui/toaster';
import { DEFAULT_LOCALE } from '@equipment-management/schemas';
import { LocaleHtmlSync } from '@/components/i18n/LocaleHtmlSync';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Equipment Management System',
  description: 'Integrated equipment management system for laboratories',
};

/**
 * Viewport 설정
 *
 * Web Interface Guidelines:
 * - themeColor: 브라우저 크롬(주소바, 스크롤바)이 앱 테마와 일치
 * - colorScheme: 네이티브 폼 컨트롤, 스크롤바가 테마에 맞게 렌더링
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EBEBEB' },
    { media: '(prefers-color-scheme: dark)', color: '#0A1C30' },
  ],
  colorScheme: 'light dark',
};

/**
 * RootLayout — 정적 셸 (PPR Non-Blocking Pattern)
 *
 * Next.js 16 cacheComponents: true 아키텍처:
 * - sync 함수: Dynamic API 없이 즉시 정적 셸 렌더링 → FCP 최소화
 * - lang 속성: DEFAULT_LOCALE 정적 기본값 (suppressHydrationWarning으로 hydration 불일치 허용)
 *   클라이언트 hydration 시 NextIntlClientProvider가 실제 locale로 lang을 업데이트함
 *
 * IntlProvider (Dynamic hole):
 * - Suspense 내부 async 컴포넌트에서 getLocale()/getMessages() 실행
 * - i18n/request.ts → requestLocale (x-next-intl-locale 헤더) → cookies() 없음
 * - Dynamic API가 Suspense 내부에서만 실행 → RootLayout 블로킹 없음
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <body
        className={`${notoSansKR.variable} ${inter.variable} ${dmSans.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} font-sans bg-background text-foreground`}
      >
        <Suspense>
          <IntlProvider>{children}</IntlProvider>
        </Suspense>
      </body>
    </html>
  );
}

/**
 * IntlProvider — Dynamic hole (Suspense 내부 async 컴포넌트)
 *
 * getLocale() → next-intl이 x-next-intl-locale 헤더를 읽음 (Middleware 주입)
 * getMessages() → i18n/request.ts의 requestLocale 기반 메시지 로딩
 *
 * Suspense 내부에서만 실행되므로 Dynamic API 블로킹이 정적 셸에 영향 없음
 */
async function IntlProvider({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <LocaleHtmlSync />
      <Providers>
        <div className="min-h-screen bg-background flex flex-col">{children}</div>
        <Toaster />
      </Providers>
    </NextIntlClientProvider>
  );
}
