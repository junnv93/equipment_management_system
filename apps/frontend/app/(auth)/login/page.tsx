import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginPageContent } from '@/components/auth/LoginPageContent';

/**
 * 로그인 페이지 (Server Component)
 *
 * 디자인: Split Screen — 좌 브랜딩(네이비) + 우 로그인 폼(라이트)
 */
export default function LoginPage() {
  const showDevAccounts =
    process.env.NODE_ENV === 'development' || process.env.ENABLE_TEST_AUTH === 'true';

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen">
          {/* 좌측 브랜딩 스켈레톤 */}
          <div className="hidden lg:flex lg:w-2/5 bg-ul-midnight" />
          {/* 우측 폼 스켈레톤 */}
          <div className="flex flex-1 items-center justify-center bg-brand-bg-base p-8">
            <div className="w-full max-w-sm space-y-6">
              <Skeleton className="h-8 w-24 rounded" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      }
    >
      <LoginPageContent showDevAccounts={showDevAccounts} />
    </Suspense>
  );
}
