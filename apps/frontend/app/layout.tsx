import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '@/lib/providers';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '장비 관리 시스템',
  description: '조직 내 장비 관리를 위한 통합 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <Providers>
          <main className="min-h-screen bg-background flex flex-col">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
} 