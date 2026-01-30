import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ApprovalsClient } from '@/components/approvals/ApprovalsClient';
import type { UserRole } from '@equipment-management/schemas';

/**
 * 승인 관리 통합 페이지 (Server Component)
 *
 * Next.js 16 패턴:
 * - Server Component에서 세션 확인 및 초기 데이터 전달
 * - 인터랙션은 Client Component로 분리
 *
 * @see docs/development/FRONTEND_UI_PROMPTS(UI-3: 승인 관리 통합 페이지_수정O).md
 */
export default async function ApprovalsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ✅ Next.js 16: searchParams는 Promise
  const searchParams = await props.searchParams;
  const initialTab = typeof searchParams.tab === 'string' ? searchParams.tab : undefined;

  // 세션 확인
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = session.user.role as UserRole;
  const userId = session.user.id;
  const userTeamId = session.user.teamId;

  // 승인 권한이 없는 역할은 대시보드로 리다이렉트
  const rolesWithApprovalAccess: UserRole[] = [
    'technical_manager',
    'quality_manager',
    'lab_manager',
  ];

  if (!rolesWithApprovalAccess.includes(userRole)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">승인 관리</h1>
        <p className="text-muted-foreground">
          장비, 교정, 반출 등 각종 승인 요청을 통합 관리합니다
        </p>
      </div>

      <ApprovalsClient
        userRole={userRole}
        userId={userId}
        userTeamId={userTeamId}
        initialTab={initialTab}
      />
    </div>
  );
}
