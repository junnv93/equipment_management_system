'use client';

/**
 * 대시보드 에러 페이지
 *
 * Next.js 16 App Router의 error.tsx 컨벤션을 따릅니다.
 * - 'use client' 필수 (Error Boundary는 클라이언트 컴포넌트여야 함)
 * - error 객체와 reset 함수를 props로 받음
 * - 재시도 및 홈으로 이동 옵션 제공
 *
 * 접근성 (WCAG 2.1 AA):
 * - role="alert"로 에러 상태 알림
 * - aria-live="assertive"로 스크린 리더에 즉시 알림
 * - aria-label로 버튼 목적 명시
 * - 키보드 탐색 가능한 인터랙티브 요소
 * - focus-visible 스타일로 포커스 표시
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 Sentry 등으로 전송)
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center p-4">
      <Card
        className="w-full max-w-md"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <CardHeader className="text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10"
            aria-hidden="true"
          >
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle className="text-xl">
            대시보드를 불러올 수 없습니다
          </CardTitle>
          <CardDescription>
            일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 개발 환경에서만 상세 에러 표시 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-3">
              <p className="font-mono text-xs text-muted-foreground break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* 에러 코드 (digest) */}
          {error.digest && (
            <p className="text-center text-xs text-muted-foreground">
              오류 코드: {error.digest}
            </p>
          )}

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={reset}
              variant="default"
              className="flex-1 gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="대시보드 다시 불러오기"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              다시 시도
            </Button>
            <Button
              variant="outline"
              asChild
              className="flex-1 gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Link href="/" aria-label="홈 페이지로 이동">
                <Home className="h-4 w-4" aria-hidden="true" />
                홈으로
              </Link>
            </Button>
          </div>

          {/* 지원 안내 */}
          <p className="text-center text-xs text-muted-foreground">
            문제가 지속되면{' '}
            <Link
              href="/support"
              className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
            >
              지원 센터
            </Link>
            에 문의해 주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
