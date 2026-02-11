'use client';

import { useSearchParams } from 'next/navigation';
import { Wrench } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AzureAdButton } from '@/components/auth/AzureAdButton';
import { useAuthProviders } from '@/components/auth/AuthProviders';
import { LoginForm } from '@/components/auth/LoginForm';
import { DevLoginButtons } from '@/components/auth/DevLoginButtons';
import { getSafeCallbackUrl } from '@/lib/auth/auth-utils';

function LoginProviders() {
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams?.get('callbackUrl'), '/');
  const { hasAzureAD, hasCredentials, isLoading } = useAuthProviders();

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="인증 제공자 로딩 중">
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
            <div className="flex items-center gap-3" role="separator" aria-label="또는">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground font-medium">또는</span>
              <Separator className="flex-1" />
            </div>
          )}
        </>
      )}
      {hasCredentials && <LoginForm callbackUrl={callbackUrl} />}
      {!hasAzureAD && !hasCredentials && (
        <div
          className="flex items-center gap-3 p-4 text-sm text-ul-orange bg-ul-orange/10 border border-ul-orange/20 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <span className="flex-shrink-0 w-2 h-2 bg-ul-orange rounded-full" aria-hidden="true" />
          인증 설정이 필요합니다.
        </div>
      )}
    </div>
  );
}

interface LoginPageContentProps {
  showDevAccounts?: boolean;
}

/**
 * 로그인 페이지 클라이언트 컴포넌트
 * - 인증 제공자 로딩 및 표시
 * - 로그인 폼 상호작용 처리
 */
export function LoginPageContent({ showDevAccounts = false }: LoginPageContentProps) {
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams?.get('callbackUrl'), '/');

  return (
    <div className="flex-1 lg:w-1/2 flex flex-col bg-white dark:bg-background">
      {/* 스킵 링크 (접근성) */}
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50
                   focus:px-4 focus:py-2 focus:bg-ul-midnight focus:text-white focus:rounded-lg
                   focus:ring-2 focus:ring-ul-midnight focus:ring-offset-2"
      >
        로그인 폼으로 이동
      </a>

      {/* 모바일 헤더 (lg 미만에서만 표시) */}
      <header className="lg:hidden flex items-center gap-3 p-6 border-b border-border bg-ul-midnight">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-ul-red">
          <Wrench className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">장비 관리 시스템</h1>
          <p className="text-xs text-white/60">Equipment Management System</p>
        </div>
      </header>

      {/* 로그인 폼 컨테이너 */}
      <main
        id="login-form"
        className="flex-1 flex items-center justify-center p-6 lg:p-12"
        role="main"
        aria-label="로그인"
      >
        <div className="w-full max-w-md">
          {/* 카드 */}
          <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
            {/* 헤더 */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
              <p className="text-sm text-muted-foreground">계정에 로그인하여 시작하세요</p>
            </div>

            {/* 로그인 콘텐츠 - Suspense는 Server Component(page.tsx)에서 처리 */}
            <LoginProviders />

            {/* 개발자 모드 빠른 로그인 (개발 환경) */}
            {showDevAccounts && (
              <div className="mt-8 pt-6 border-t border-border">
                <DevLoginButtons callbackUrl={callbackUrl} />
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
  );
}
