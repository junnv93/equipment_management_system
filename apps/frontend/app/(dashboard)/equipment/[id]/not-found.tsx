import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowLeft, List } from 'lucide-react';
import { getPageContainerClasses } from '@/lib/design-tokens';

/**
 * 장비 상세 404 페이지
 *
 * Next.js 16 패턴:
 * - notFound() 호출 시 렌더링되는 컴포넌트
 * - Server Component로 작성 가능 (상태 불필요)
 * - 전역 not-found.tsx 대신 라우트별 맞춤 UI 제공
 */
export default function EquipmentNotFound() {
  return (
    <div className={getPageContainerClasses('list', '')}>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {/* 404 아이콘 */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* 404 메시지 */}
        <h2 className="mt-6 text-2xl font-bold tracking-tight">장비를 찾을 수 없습니다</h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          요청하신 장비가 존재하지 않거나 삭제되었습니다.
          <br />
          장비 ID를 다시 확인해주세요.
        </p>

        {/* 액션 버튼 */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="gap-2">
            <Link href="/equipment">
              <List className="h-4 w-4" />
              장비 목록으로
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              홈으로 이동
            </Link>
          </Button>
        </div>

        {/* 도움말 */}
        <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4 max-w-md">
          <p className="text-sm text-muted-foreground">찾으시는 장비가 있으신가요?</p>
          <p className="mt-2 text-sm text-muted-foreground">
            장비 목록에서 검색하거나, 관리번호로 직접 찾아보세요.
          </p>
        </div>
      </div>
    </div>
  );
}
