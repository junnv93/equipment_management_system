'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, ArrowLeft, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface AuthErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 인증 라우트 레벨 에러 바운더리
 * - 런타임 에러 처리 (서버 에러, 네트워크 에러 등)
 * - NextAuth 에러는 /error 페이지에서 처리
 */
export default function AuthError({ error, reset }: AuthErrorProps) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 외부 서비스로 전송)
    console.error('Auth route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50 dark:bg-background">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* 상단 로고 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-ul-midnight">
            <Wrench className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold text-foreground">장비 관리 시스템</span>
        </div>

        <Card className="border-0 shadow-xl rounded-2xl bg-card">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ul-orange/20">
              <AlertTriangle
                className="h-8 w-8 text-ul-orange"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              오류가 발생했습니다
            </h1>
          </CardHeader>

          <CardContent className="px-8 pb-4">
            <p
              className="text-center text-muted-foreground"
              role="alert"
              aria-live="polite"
            >
              페이지를 불러오는 중 문제가 발생했습니다.
              <br />
              잠시 후 다시 시도해주세요.
            </p>

            {/* 개발 환경에서만 에러 상세 표시 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-xs font-mono text-muted-foreground overflow-auto max-h-32">
                <p className="font-semibold text-foreground mb-1">Error Details:</p>
                <p>{error.message}</p>
                {error.digest && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 px-8 pb-8">
            <Button
              onClick={reset}
              className="w-full h-12 text-base font-medium bg-ul-midnight hover:bg-ul-midnight-dark transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              aria-label="페이지 다시 시도"
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              다시 시도
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-12 text-base font-medium border-border hover:bg-muted transition-all duration-200"
              aria-label="로그인 페이지로 돌아가기"
            >
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                로그인 페이지로 이동
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* 하단 도움말 */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          문제가 계속되면 시스템 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  );
}
