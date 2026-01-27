/**
 * 전역 404 페이지
 *
 * Next.js 16 Best Practice:
 * - Server Component로 구현 가능 (상태 관리 불필요)
 * - notFound() 호출 시 자동으로 렌더링
 */

import { Button } from '@/components/ui/button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* 404 아이콘 */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* 404 메시지 */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tight text-foreground">
            404
          </h1>
          <h2 className="text-xl font-semibold text-foreground">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-muted-foreground">
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="default" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              홈으로 이동
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/equipment">
              <ArrowLeft className="h-4 w-4" />
              장비 목록으로
            </Link>
          </Button>
        </div>

        {/* 추가 안내 */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            찾으시는 페이지가 있으신가요?
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link
              href="/equipment"
              className="text-sm text-primary hover:underline"
            >
              장비 관리
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link
              href="/calibration"
              className="text-sm text-primary hover:underline"
            >
              교정 관리
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link
              href="/checkouts"
              className="text-sm text-primary hover:underline"
            >
              반출 관리
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
