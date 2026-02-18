'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { AlertCircle, ArrowLeft, RefreshCw, Wrench, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

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
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-800">{t('errorPage.systemName')}</span>
      </div>

      <Card className="border-0 shadow-xl rounded-2xl bg-white">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900" data-testid="error-title">
            {title}
          </h1>
        </CardHeader>

        <CardContent className="px-8 pb-4">
          <p className="text-center text-slate-600" role="alert" data-testid="error-description">
            {description}
          </p>

          {errorType !== 'Default' && (
            <div className="mt-4 text-center">
              <span className="inline-block text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-mono">
                {t('errorPage.errorCodeLabel')}: {errorType}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 px-8 pb-8">
          <Button
            asChild
            className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 motion-safe:transition-all motion-reduce:transition-none duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
            className="w-full h-12 text-base font-medium border-slate-200 hover:bg-slate-50 motion-safe:transition-all motion-reduce:transition-none duration-200"
            aria-label={t('errorPage.retry')}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('errorPage.retry')}
          </Button>
        </CardFooter>
      </Card>

      {/* 하단 도움말 */}
      <p className="text-center text-xs text-slate-400 mt-6">
        {t('errorPage.helpText')}{' '}
        <button
          type="button"
          className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
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
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-800">장비 관리 시스템</span>
      </div>

      <Card className="border-0 shadow-xl rounded-2xl bg-white">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
          </div>
          <div className="h-8 w-32 mx-auto bg-slate-200 rounded animate-pulse" />
        </CardHeader>

        <CardContent className="px-8 pb-4">
          <div className="h-4 w-full bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-3/4 mx-auto bg-slate-200 rounded animate-pulse" />
        </CardContent>

        <CardFooter className="flex flex-col gap-3 px-8 pb-8">
          <div className="h-12 w-full bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse" />
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50">
      <Suspense fallback={<LoadingFallback />}>
        <ErrorPageContent />
      </Suspense>
    </div>
  );
}
