'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Wrench } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AzureAdButton } from '@/components/auth/AzureAdButton';
import { useAuthProviders } from '@/components/auth/AuthProviders';
import { LoginForm } from '@/components/auth/LoginForm';
import { BrandingSection } from '@/components/auth/BrandingSection';
import { getSafeCallbackUrl } from '@/lib/auth/auth-utils';

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams?.get('callbackUrl'), '/');
  const { hasAzureAD, hasCredentials, isLoading } = useAuthProviders();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {hasAzureAD && (
        <>
          <AzureAdButton callbackUrl={callbackUrl} />
          {hasCredentials && (
            <div className="flex items-center gap-3" role="separator">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground font-medium">또는</span>
              <Separator className="flex-1" />
            </div>
          )}
        </>
      )}
      {hasCredentials && <LoginForm callbackUrl={callbackUrl} />}
      {!hasAzureAD && !hasCredentials && (
        <div className="flex items-center gap-3 p-4 text-sm text-warning bg-warning/10 border border-warning/20 rounded-lg" role="alert">
          <span className="flex-shrink-0 w-2 h-2 bg-warning rounded-full" />
          인증 설정이 필요합니다.
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* 좌측: 브랜딩 섹션 (lg 이상에서만 표시) */}
      <BrandingSection />

      {/* 우측: 로그인 폼 섹션 */}
      <div className="flex-1 lg:w-1/2 flex flex-col bg-white dark:bg-background">
        {/* 모바일 헤더 (lg 미만에서만 표시) */}
        <div className="lg:hidden flex items-center gap-3 p-6 border-b border-border bg-ul-midnight">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-ul-red">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">장비 관리 시스템</h1>
            <p className="text-xs text-white/60">Equipment Management System</p>
          </div>
        </div>

        {/* 로그인 폼 컨테이너 */}
        <main
          className="flex-1 flex items-center justify-center p-6 lg:p-12"
          role="main"
          aria-label="로그인"
        >
          <div className="w-full max-w-md">
            {/* 카드 */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
              {/* 헤더 */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Welcome back
                </h2>
                <p className="text-sm text-muted-foreground">
                  계정에 로그인하여 시작하세요
                </p>
              </div>

              {/* 로그인 콘텐츠 */}
              <Suspense
                fallback={
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                }
              >
                <LoginContent />
              </Suspense>

              {/* 테스트 계정 정보 (개발 환경) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3 text-center">
                    개발 환경 테스트 계정
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg text-xs">
                      <span className="font-medium text-foreground">시험소 관리자</span>
                      <code className="text-muted-foreground">admin@example.com / admin123</code>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg text-xs">
                      <span className="font-medium text-foreground">기술책임자</span>
                      <code className="text-muted-foreground">manager@example.com / manager123</code>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg text-xs">
                      <span className="font-medium text-foreground">시험실무자</span>
                      <code className="text-muted-foreground">user@example.com / user123</code>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 하단 텍스트 */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              © 2025 Equipment Management System. All rights reserved.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
