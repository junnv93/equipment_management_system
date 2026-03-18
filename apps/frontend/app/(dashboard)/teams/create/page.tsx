import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { TeamForm } from '@/components/teams/TeamForm';
import { getPageContainerClasses } from '@/lib/design-tokens';

/**
 * 팀 등록 페이지 (Server Component)
 *
 * 권한:
 * - technical_manager, lab_manager, system_admin만 접근 가능
 * - 클라이언트에서 권한 체크 후 리다이렉트
 */
export default function CreateTeamPage() {
  return (
    <div className={getPageContainerClasses('form')}>
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/teams" aria-label="팀 목록으로 돌아가기">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">팀 등록</h1>
          <p className="text-muted-foreground">새로운 팀을 등록합니다</p>
        </div>
      </div>

      {/* 폼 */}
      <TeamForm mode="create" />
    </div>
  );
}

export const metadata: Metadata = {
  title: '팀 등록',
  description: '새로운 팀을 등록합니다.',
};
