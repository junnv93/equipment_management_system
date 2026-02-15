import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Next.js 16 PageProps 타입
 */
type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * 팀 수정 페이지 (Server Component)
 *
 * Next.js 16 패턴:
 * - params는 Promise이므로 await 필수
 * - Client Component에서 데이터 fetch 및 폼 처리
 *
 * 권한:
 * - technical_manager, lab_manager, system_admin만 수정 가능
 */
export default async function EditTeamPage(props: PageProps) {
  const { id } = await props.params;

  // UUID 형식 검증 (detail 페이지와 동일 패턴)
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(id)) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-2xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/teams/${id}`} aria-label="팀 상세로 돌아가기">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">팀 수정</h1>
          <p className="text-muted-foreground">팀 정보를 수정합니다</p>
        </div>
      </div>

      {/* 폼 (Client Component) */}
      <Suspense fallback={<EditTeamFormSkeleton />}>
        <EditTeamFormWrapper teamId={id} />
      </Suspense>
    </div>
  );
}

/**
 * 팀 수정 폼 래퍼
 */
async function EditTeamFormWrapper({ teamId }: { teamId: string }) {
  const { EditTeamFormClient } = await import('@/components/teams/EditTeamFormClient');
  return <EditTeamFormClient teamId={teamId} />;
}

/**
 * 폼 스켈레톤
 */
function EditTeamFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 동적 메타데이터
 */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;

  return {
    title: '팀 수정',
    description: '팀 정보를 수정합니다.',
  };
}
