'use client';

/**
 * 장비 상세 라우트 에러 페이지
 *
 * Next.js 16 패턴:
 * - 'use client' 필수 (Error boundary는 Client Component)
 * - equipment/[id]/* 하위 모든 라우트에서 공유
 * - error와 reset props 사용
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, List } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EquipmentDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 에러 로깅 (production에서는 Sentry 등으로 전송)
    console.error('Equipment detail route error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {/* 에러 아이콘 */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        {/* 에러 메시지 */}
        <h2 className="mt-6 text-2xl font-bold tracking-tight">
          페이지를 불러올 수 없습니다
        </h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          {error.message || '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
        </p>

        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground/60">
            오류 코드: {error.digest}
          </p>
        )}

        {/* 액션 버튼 */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/equipment">
              <List className="h-4 w-4" />
              장비 목록으로
            </Link>
          </Button>
        </div>

        {/* 추가 도움말 */}
        <p className="mt-8 text-sm text-muted-foreground">
          문제가 지속되면 시스템 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  );
}
