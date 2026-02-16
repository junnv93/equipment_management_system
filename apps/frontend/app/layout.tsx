import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Inter, Noto_Sans_KR } from 'next/font/google';
import { Providers } from '@/lib/providers';
import { Toaster } from '@/components/ui/toaster';

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

export const metadata: Metadata = {
  title: '장비 관리 시스템',
  description: '조직 내 장비 관리를 위한 통합 시스템',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${notoSansKR.variable} ${inter.variable} font-sans bg-background text-foreground`}
      >
        <Providers>
          <div className="min-h-screen bg-background flex flex-col">{children}</div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
