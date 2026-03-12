'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { AlertCircle, ArrowLeft, RefreshCw, Wrench, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { TRANSITION_PRESETS } from '@/lib/design-tokens';

/** 유효한 에러 타입 목록 (auth.json의 errorPage 하위 키와 대응) */
const VALID_ERROR_TYPES = [
  'Configuration',
  'AccessDenied',
  'Verification',
  'OAuthSignin',
  'OAuthCallback',
  'OAuthCreateAccount',
  'EmailCreateAccount',
  'Callback',
  'OAuthAccountNotLinked',
  'EmailSignin',
  'CredentialsSignin',
  'SessionRequired',
  'Default',
] as const;

function ErrorPageContent() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const rawErrorType = searchParams?.get('error') || 'Default';
  const errorType = VALID_ERROR_TYPES.includes(rawErrorType as (typeof VALID_ERROR_TYPES)[number])
    ? rawErrorType
    : 'Default';

  const title = t(`errorPage.${errorType}.title` as Parameters<typeof t>[0]);
  const description = t(`errorPage.${errorType}.description` as Parameters<typeof t>[0]);

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      {/* 상단 로고 */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-info">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-foreground">{t('errorPage.systemName')}</span>
      </div>

      <Card className="border-0 shadow-xl rounded-2xl bg-background">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-critical/10">
            <AlertCircle className="h-8 w-8 text-brand-critical" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="error-title">
            {title}
          </h1>
        </CardHeader>

        <CardContent className="px-8 pb-4">
          <p
            className="text-center text-muted-foreground"
            role="alert"
            data-testid="error-description"
          >
            {description}
          </p>

          {errorType !== 'Default' && (
            <div className="mt-4 text-center">
              <span className="inline-block text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full font-mono">
                {t('errorPage.errorCodeLabel')}: {errorType}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 px-8 pb-8">
          <Button
            asChild
            className={`w-full h-12 text-base font-medium bg-brand-info hover:bg-brand-info/90 text-white ${TRANSITION_PRESETS.fastBgTransform} hover:scale-[1.02] active:scale-[0.98]`}
            aria-label={t('errorPage.backToLogin')}
          >
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('errorPage.backToLogin')}
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className={`w-full h-12 text-base font-medium border-border hover:bg-muted ${TRANSITION_PRESETS.fastColor}`}
            aria-label={t('errorPage.retry')}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('errorPage.retry')}
          </Button>
        </CardFooter>
      </Card>

      {/* 하단 도움말 */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        {t('errorPage.helpText')}{' '}
        <button
          type="button"
          className={`text-brand-info hover:text-brand-info/80 hover:underline ${TRANSITION_PRESETS.fastColor}`}
          onClick={() => alert(t('errorPage.contactAdmin'))}
        >
          {t('errorPage.contactAdmin')}
        </button>
        {t('errorPage.helpTextSuffix')}
      </p>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md animate-fade-in-up">
      {/* 상단 로고 */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-info">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-foreground">장비 관리 시스템</span>
      </div>

      <Card className="border-0 shadow-xl rounded-2xl bg-background">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          </div>
          <div className="h-8 w-32 mx-auto bg-muted rounded animate-pulse" />
        </CardHeader>

        <CardContent className="px-8 pb-4">
          <div className="h-4 w-full bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-3/4 mx-auto bg-muted rounded animate-pulse" />
        </CardContent>

        <CardFooter className="flex flex-col gap-3 px-8 pb-8">
          <div className="h-12 w-full bg-muted rounded-lg animate-pulse" />
          <div className="h-12 w-full bg-muted/50 rounded-lg animate-pulse" />
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-muted/50">
      <Suspense fallback={<LoadingFallback />}>
        <ErrorPageContent />
      </Suspense>
    </div>
  );
}
