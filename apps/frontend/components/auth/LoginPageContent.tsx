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
import { AUTH_CONTENT, AUTH_LAYOUT_TOKENS, getAuthStaggerDelay } from '@/lib/design-tokens';

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
    <div className="space-y-6 motion-safe:animate-fade-in motion-reduce:animate-none">
      {hasAzureAD && (
        <>
          <AzureAdButton callbackUrl={callbackUrl} />
          {hasCredentials && (
            <div
              className={AUTH_LAYOUT_TOKENS.separator.container}
              role="separator"
              aria-label={AUTH_CONTENT.separator}
            >
              <Separator className="flex-1" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/50">{AUTH_CONTENT.separator}</span>
              </div>
              <Separator className="flex-1" />
            </div>
          )}
        </>
      )}
      {hasCredentials && <LoginForm callbackUrl={callbackUrl} />}
      {!hasAzureAD && !hasCredentials && (
        <div
          className="flex items-start gap-3 p-4 text-sm text-ul-orange bg-ul-orange/10 border border-ul-orange/20 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div
            className="flex-shrink-0 w-1.5 h-1.5 mt-1.5 bg-ul-orange rounded-full motion-safe:animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
          <div>
            <div className="font-medium">{AUTH_CONTENT.error.configRequired}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 빌드 시점 연도 계산
 * Next.js 16 PPR: Client Component에서도 초기 렌더링에서 new Date() 사용 시 hydration mismatch 가능
 * → 빌드 시점 연도로 고정
 */
const CURRENT_YEAR = 2026;

interface LoginPageContentProps {
  showDevAccounts?: boolean;
}

/**
 * LoginPageContent - Refined Corporate Design
 *
 * 디자인 개선:
 * - 모바일 헤더: UL Solutions 브랜드 강조
 * - 컨텐츠 레이아웃: 중앙 정렬 최적화
 * - 불필요한 장식 제거
 */
export function LoginPageContent({ showDevAccounts = false }: LoginPageContentProps) {
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams?.get('callbackUrl'), '/');

  return (
    <div className="flex-1 lg:w-1/2 flex flex-col bg-white dark:bg-background relative overflow-hidden">
      {/* Skip Link (Accessibility) */}
      <a
        href="#login-form"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50
                   focus-visible:px-4 focus-visible:py-2 focus-visible:bg-ul-midnight focus-visible:text-white focus-visible:rounded-lg
                   focus-visible:ring-2 focus-visible:ring-ul-midnight focus-visible:ring-offset-2
                   focus-visible:font-semibold"
      >
        {AUTH_CONTENT.button.skipToForm}
      </a>

      {/* Mobile Header (lg 미만에서만 표시) */}
      <header className="lg:hidden relative z-10 flex items-center gap-3 p-6 border-b border-border/50 bg-gradient-to-r from-ul-midnight to-ul-midnight-dark">
        <div
          className={`flex items-center justify-center ${AUTH_LAYOUT_TOKENS.logo.container} ${AUTH_LAYOUT_TOKENS.logo.borderRadius} bg-ul-red shadow-lg`}
        >
          <Wrench className={`${AUTH_LAYOUT_TOKENS.logo.iconSize} text-white`} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white tracking-tight">
            {AUTH_CONTENT.brand.systemName}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div
              className="w-1.5 h-1.5 rounded-full bg-ul-green motion-safe:animate-pulse motion-reduce:animate-none"
              aria-hidden="true"
            />
            <p className="text-xs text-white/70 uppercase tracking-wide">
              {AUTH_CONTENT.brand.systemNameEn.replace(' System', '')}
            </p>
          </div>
        </div>
      </header>

      {/* Login Form Container */}
      <main
        id="login-form"
        className="relative z-10 flex-1 flex items-center justify-center p-6 lg:p-12"
        aria-label="로그인"
      >
        <div className="w-full max-w-md space-y-8">
          {/* Welcome Header - Desktop Only */}
          <div className="hidden lg:block text-center space-y-2 motion-safe:animate-fade-in motion-reduce:animate-none">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {AUTH_CONTENT.login.heading}
            </h2>
            <p className="text-sm text-muted-foreground">{AUTH_CONTENT.login.description}</p>
          </div>

          {/* Login Content */}
          <div
            className="motion-safe:animate-fade-in motion-reduce:animate-none"
            style={{ animationDelay: getAuthStaggerDelay(0, 100, 100) }}
          >
            <LoginProviders />
          </div>

          {/* Developer Mode (Development Only) */}
          {showDevAccounts && (
            <div
              className="pt-6 border-t border-border/50 motion-safe:animate-fade-in motion-reduce:animate-none"
              style={{ animationDelay: getAuthStaggerDelay(1, 100, 100) }}
            >
              <DevLoginButtons callbackUrl={callbackUrl} />
            </div>
          )}

          {/* Footer Info */}
          <div
            className="text-center space-y-2 motion-safe:animate-fade-in motion-reduce:animate-none"
            style={{ animationDelay: getAuthStaggerDelay(2, 100, 100) }}
          >
            {/* Copyright */}
            <p className="text-xs text-muted-foreground/70 tabular-nums">
              {AUTH_CONTENT.copyright(CURRENT_YEAR)}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
