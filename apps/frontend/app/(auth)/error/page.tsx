'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { AlertCircle, ArrowLeft, RefreshCw, Wrench, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: '서버 설정 오류',
    description: '인증 서버 설정에 문제가 있습니다. 관리자에게 문의하세요.',
  },
  AccessDenied: {
    title: '접근 거부',
    description: '이 리소스에 접근할 권한이 없습니다.',
  },
  Verification: {
    title: '인증 실패',
    description: '인증 링크가 만료되었거나 이미 사용되었습니다.',
  },
  OAuthSignin: {
    title: 'OAuth 로그인 오류',
    description: 'OAuth 로그인 프로세스를 시작하는 데 실패했습니다.',
  },
  OAuthCallback: {
    title: 'OAuth 콜백 오류',
    description: 'OAuth 제공자로부터 응답을 처리하는 데 실패했습니다.',
  },
  OAuthCreateAccount: {
    title: '계정 생성 오류',
    description: 'OAuth 계정을 생성하는 데 실패했습니다.',
  },
  EmailCreateAccount: {
    title: '이메일 계정 오류',
    description: '이메일 계정을 생성하는 데 실패했습니다.',
  },
  Callback: {
    title: '콜백 오류',
    description: '인증 콜백을 처리하는 데 실패했습니다.',
  },
  OAuthAccountNotLinked: {
    title: '계정 연결 오류',
    description: '이 이메일 주소는 다른 로그인 방법으로 이미 등록되어 있습니다.',
  },
  EmailSignin: {
    title: '이메일 로그인 오류',
    description: '이메일 로그인 링크를 전송하는 데 실패했습니다.',
  },
  CredentialsSignin: {
    title: '로그인 실패',
    description: '이메일 또는 비밀번호가 올바르지 않습니다.',
  },
  SessionRequired: {
    title: '세션 필요',
    description: '이 페이지에 접근하려면 로그인이 필요합니다.',
  },
  Default: {
    title: '인증 오류',
    description: '인증 과정에서 오류가 발생했습니다. 다시 시도해주세요.',
  },
};

function ErrorPageContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams?.get('error') || 'Default';

  const { title, description } =
    errorMessages[errorType] || errorMessages.Default;

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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle
              className="h-8 w-8 text-red-600"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900" data-testid="error-title">
            {title}
          </h1>
        </CardHeader>

        <CardContent className="px-8 pb-4">
          <p
            className="text-center text-slate-600"
            role="alert"
            data-testid="error-description"
          >
            {description}
          </p>

          {errorType !== 'Default' && (
            <div className="mt-4 text-center">
              <span className="inline-block text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-mono">
                오류 코드: {errorType}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 px-8 pb-8">
          <Button
            asChild
            className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            aria-label="로그인 페이지로 돌아가기"
          >
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              로그인 페이지로 돌아가기
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full h-12 text-base font-medium border-slate-200 hover:bg-slate-50 transition-all duration-200"
            aria-label="페이지 새로고침"
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            다시 시도
          </Button>
        </CardFooter>
      </Card>

      {/* 하단 도움말 */}
      <p className="text-center text-xs text-slate-400 mt-6">
        문제가 계속되면{' '}
        <button
          type="button"
          className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          onClick={() => alert('관리자에게 문의하세요.')}
        >
          관리자에게 문의
        </button>
        하세요.
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
