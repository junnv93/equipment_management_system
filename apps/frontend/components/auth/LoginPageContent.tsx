'use client';

import { useSearchParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AUTH_ERROR_CODE } from '@equipment-management/shared-constants';
import { AlertCircle } from 'lucide-react';
import { AzureAdButton } from '@/components/auth/AzureAdButton';
import { useAuthProviders } from '@/components/auth/AuthProviders';
import { LoginForm } from '@/components/auth/LoginForm';
import { DevLoginButtons } from '@/components/auth/DevLoginButtons';
import { getSafeCallbackUrl } from '@/lib/auth/auth-utils';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  AUTH_CONTENT,
  AUTH_LAYOUT_TOKENS,
  AUTH_SPLIT_TOKENS,
  getAuthStaggerDelay,
  getSemanticContainerColorClasses,
  getSemanticContainerTextClasses,
  TRANSITION_PRESETS,
} from '@/lib/design-tokens';

function LoginProviders() {
  const tLogin = useTranslations('auth.login');
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams?.get('callbackUrl'), '/');
  const { hasAzureAD, hasCredentials, isLoading, error } = useAuthProviders();

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label={tLogin('ssoLoading')}>
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
          className={`flex items-start gap-3 p-4 text-sm border rounded-lg ${getSemanticContainerColorClasses('critical')} ${getSemanticContainerTextClasses('critical')}`}
          role="alert"
          aria-live="polite"
        >
          <div
            className="flex-shrink-0 w-1.5 h-1.5 mt-1.5 bg-brand-critical rounded-full motion-safe:animate-pulse"
            aria-hidden="true"
          />
          <div className="font-medium">
            {error ? tLogin('serverUnavailable') : tLogin('configRequired')}
          </div>
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
/**
 * URL 에러 파라미터 표시 (redirect: true 사용 시 NextAuth가 설정)
 * code=server_unavailable: 백엔드 연결 불가 / 그 외: 인증 실패
 */
function UrlErrorBanner() {
  const searchParams = useSearchParams();
  const t = useTranslations('auth.login');

  const error = searchParams?.get('error');
  const code = searchParams?.get('code');

  if (!error) return null;

  const isServerDown = code === AUTH_ERROR_CODE.SERVER_UNAVAILABLE;
  const message = isServerDown ? t('serverUnavailable') : t('authFailed');

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 py-3 px-4 rounded-lg mb-4',
        'bg-brand-critical/[0.06] border-l-[3px] border-brand-critical',
        'motion-safe:animate-slide-down motion-reduce:animate-none'
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="flex-shrink-0 w-4 h-4 text-brand-critical" aria-hidden="true" />
      <span className="text-sm font-medium text-brand-critical">{message}</span>
    </div>
  );
}

export function LoginPageContent({ showDevAccounts = false }: LoginPageContentProps) {
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams?.get('callbackUrl'), '/');
  const tBranding = useTranslations('auth.branding');
  const tLogin = useTranslations('auth.login');

  return (
    <div className="flex min-h-screen">
      {/* Skip Link */}
      <a
        href="#login-form"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50
                   focus-visible:px-4 focus-visible:py-2 focus-visible:bg-brand-critical focus-visible:text-white focus-visible:rounded-lg
                   focus-visible:ring-2 focus-visible:ring-brand-critical focus-visible:ring-offset-2"
      >
        {AUTH_CONTENT.button.skipToForm}
      </a>

      {/* ── 좌측: UL 브랜드 패널 ── */}
      <aside
        className="hidden lg:flex lg:w-[45%] flex-col relative overflow-hidden"
        style={{ backgroundColor: AUTH_SPLIT_TOKENS.left.bg }}
        aria-hidden="true"
      >
        {/* 서브틀 격자 패턴 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: AUTH_SPLIT_TOKENS.left.grid.opacity,
            backgroundImage: `
              linear-gradient(${AUTH_SPLIT_TOKENS.left.grid.lineColor} 1px, transparent 1px),
              linear-gradient(90deg, ${AUTH_SPLIT_TOKENS.left.grid.lineColor} 1px, transparent 1px)
            `,
            backgroundSize: `${AUTH_SPLIT_TOKENS.left.grid.size}px ${AUTH_SPLIT_TOKENS.left.grid.size}px`,
          }}
        />

        {/* 오른쪽 경계 — 얇은 레드 라인 */}
        <div
          className="absolute top-0 right-0 bottom-0 w-px"
          style={{
            background: `linear-gradient(to bottom, transparent, ${AUTH_SPLIT_TOKENS.left.accent} 30%, ${AUTH_SPLIT_TOKENS.left.accent} 70%, transparent)`,
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
          <div
            className="w-10 h-0.5 mb-8"
            style={{ backgroundColor: AUTH_SPLIT_TOKENS.left.accent }}
          />

          <h1
            className="font-sans font-bold text-white leading-tight mb-4"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', letterSpacing: '-0.02em' }}
          >
            {tBranding('systemTitle')}
          </h1>

          <p
            className="font-mono text-[11px] tracking-[0.2em] uppercase"
            style={{ color: AUTH_SPLIT_TOKENS.left.text.muted }}
          >
            Equipment Management System
          </p>

          {/* 기능 리스트 */}
          <div className="mt-10 space-y-3">
            {(['equipmentManagement', 'approvalWorkflow', 'isoCompliance'] as const).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <div
                  className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: AUTH_SPLIT_TOKENS.left.accent }}
                />
                <span
                  className="font-sans text-sm"
                  style={{ color: AUTH_SPLIT_TOKENS.left.text.subtle }}
                >
                  {tBranding(`highlights.${key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 */}
        <div className="relative z-10 px-12 pb-10">
          <p
            className="font-mono text-[10px] tracking-[0.15em]"
            style={{ color: AUTH_SPLIT_TOKENS.left.text.faint }}
          >
            © {CURRENT_YEAR} UL Solutions. All rights reserved.
          </p>
        </div>

        {/* 장식: 대형 원형 요소 */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ border: `1px solid ${AUTH_SPLIT_TOKENS.left.decoRing.strong}` }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ border: `1px solid ${AUTH_SPLIT_TOKENS.left.decoRing.subtle}` }}
        />
      </aside>

      {/* ── 우측: 로그인 폼 ── */}
      <main
        id="login-form"
        className="flex flex-1 flex-col bg-brand-bg-base relative"
        aria-label={tLogin('formAriaLabel')}
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

            {/* URL 에러 파라미터 배너 (redirect 모드 로그인 실패 시) */}
            <UrlErrorBanner />

            {/* 폼 — raised → focus-within: floating (AP-04 깊이 차등) */}
            <div
              className={cn(
                'bg-brand-bg-surface rounded-2xl border border-brand-border-subtle p-8 space-y-6',
                'shadow-sm focus-within:shadow-lg',
                TRANSITION_PRESETS.moderateShadow,
                'motion-safe:animate-fade-in motion-reduce:animate-none'
              )}
            >
              <LoginProviders />
            </div>

            {/* 개발자 계정 — flush elevation (폼 카드보다 한 단계 낮음, AP-04) */}
            {showDevAccounts && (
              <div
                className="mt-4 bg-brand-bg-surface rounded-2xl border border-brand-border-subtle p-6 motion-safe:animate-fade-in motion-reduce:animate-none"
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
