'use client';

import { useSearchParams } from 'next/navigation';
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
      <div className="space-y-3" aria-busy="true" aria-label="인증 제공자 로딩 중">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5 motion-safe:animate-fade-in motion-reduce:animate-none">
      {hasAzureAD && (
        <>
          <AzureAdButton callbackUrl={callbackUrl} />
          {hasCredentials && (
            <div
              className={AUTH_LAYOUT_TOKENS.separator.container}
              role="separator"
              aria-label={AUTH_CONTENT.separator}
            >
              <Separator className="flex-1 bg-brand-border-default" />
              <span className="text-xs text-brand-text-muted font-mono tracking-widest uppercase">
                or
              </span>
              <Separator className="flex-1 bg-brand-border-default" />
            </div>
          )}
        </>
      )}
      {hasCredentials && <LoginForm callbackUrl={callbackUrl} />}
      {!hasAzureAD && !hasCredentials && (
        <div
          className="flex items-start gap-3 p-4 text-sm text-brand-critical bg-brand-critical/10 border border-brand-critical/20 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div
            className="flex-shrink-0 w-1.5 h-1.5 mt-1.5 bg-brand-critical rounded-full motion-safe:animate-pulse"
            aria-hidden="true"
          />
          <div className="font-medium">{AUTH_CONTENT.error.configRequired}</div>
        </div>
      )}
    </div>
  );
}

const CURRENT_YEAR = 2026;

interface LoginPageContentProps {
  showDevAccounts?: boolean;
}

/**
 * LoginPageContent — Brand Integrity Split
 *
 * 좌: UL 네이비(#122C49) + 실제 컬러 로고(빨간 그라디언트) + 대형 시스템명
 * 우: 라이트 화이트 + 클린 폼 (다크 모드 없음, 브랜드 토큰 그대로)
 */
export function LoginPageContent({ showDevAccounts = false }: LoginPageContentProps) {
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams?.get('callbackUrl'), '/');

  return (
    <div className="flex min-h-screen">
      {/* Skip Link */}
      <a
        href="#login-form"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50
                   focus-visible:px-4 focus-visible:py-2 focus-visible:bg-[#ca0123] focus-visible:text-white focus-visible:rounded-lg
                   focus-visible:ring-2 focus-visible:ring-[#ca0123] focus-visible:ring-offset-2"
      >
        {AUTH_CONTENT.button.skipToForm}
      </a>

      {/* ── 좌측: UL 브랜드 패널 ── */}
      <aside
        className="hidden lg:flex lg:w-[45%] flex-col relative overflow-hidden"
        style={{ backgroundColor: '#122C49' }}
        aria-hidden="true"
      >
        {/* 서브틀 격자 패턴 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '56px 56px',
          }}
        />

        {/* 오른쪽 경계 — 얇은 레드 라인 */}
        <div
          className="absolute top-0 right-0 bottom-0 w-px"
          style={{
            background:
              'linear-gradient(to bottom, transparent, #ca0123 30%, #ca0123 70%, transparent)',
          }}
        />

        {/* 상단: 실제 컬러 UL 로고 */}
        <div className="relative z-10 px-12 pt-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ul-logo.svg"
            alt="UL Solutions"
            width={160}
            height={66}
            style={{ display: 'block' }}
          />
        </div>

        {/* 중앙: 시스템명 */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12">
          {/* 레드 구분선 */}
          <div className="w-10 h-0.5 bg-[#ca0123] mb-8" />

          <h1
            className="font-sans font-bold text-white leading-tight mb-4"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', letterSpacing: '-0.02em' }}
          >
            장비 관리 시스템
          </h1>

          <p
            className="font-mono text-[11px] tracking-[0.2em] uppercase"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Equipment Management System
          </p>

          {/* 기능 리스트 */}
          <div className="mt-10 space-y-3">
            {[
              '장비 등록 · 교정 · 반출 관리',
              '역할 기반 승인 워크플로우',
              'ISO/IEC 17025 준수',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-[#ca0123] flex-shrink-0" />
                <span className="font-sans text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 */}
        <div className="relative z-10 px-12 pb-10">
          <p
            className="font-mono text-[10px] tracking-[0.15em]"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            © {CURRENT_YEAR} UL Solutions. All rights reserved.
          </p>
        </div>

        {/* 장식: 대형 원형 요소 */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{
            border: '1px solid rgba(202,1,35,0.12)',
          }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
          style={{
            border: '1px solid rgba(202,1,35,0.08)',
          }}
        />
      </aside>

      {/* ── 우측: 로그인 폼 ── */}
      <main
        id="login-form"
        className="flex flex-1 flex-col bg-brand-bg-base relative"
        aria-label="로그인"
      >
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-12">
          {/* 모바일 전용 로고 */}
          <div className="lg:hidden mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/ul-logo.svg"
              alt="UL Solutions"
              width={130}
              height={54}
              style={{ display: 'block' }}
            />
          </div>

          <div className="w-full max-w-[380px]">
            {/* 헤더 */}
            <div className="mb-8">
              <h2
                className="font-sans text-2xl font-bold text-brand-text-primary mb-1"
                style={{ letterSpacing: '-0.02em' }}
              >
                로그인
              </h2>
              <p className="text-sm text-brand-text-muted">계정으로 로그인하여 계속하세요</p>
            </div>

            {/* 폼 */}
            <div className="bg-white rounded-2xl border border-brand-border-subtle shadow-sm p-8 space-y-6 motion-safe:animate-fade-in motion-reduce:animate-none">
              <LoginProviders />
            </div>

            {/* 개발자 계정 */}
            {showDevAccounts && (
              <div
                className="mt-4 bg-white rounded-2xl border border-brand-border-subtle shadow-sm p-6 motion-safe:animate-fade-in motion-reduce:animate-none"
                style={{ animationDelay: getAuthStaggerDelay(0, 100, 100) }}
              >
                <DevLoginButtons callbackUrl={callbackUrl} />
              </div>
            )}

            {/* 푸터 */}
            <div
              className="mt-6 text-center motion-safe:animate-fade-in motion-reduce:animate-none"
              style={{ animationDelay: getAuthStaggerDelay(1, 100, 100) }}
            >
              <p className="text-xs text-brand-text-muted tabular-nums">
                {AUTH_CONTENT.copyright(CURRENT_YEAR)}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
