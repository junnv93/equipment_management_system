import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  EquipmentListContent,
  EquipmentListSkeleton,
} from '@/components/equipment/EquipmentListContent';
import { ClientOnly } from '@/components/shared/ClientOnly';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import {
  parseEquipmentFiltersFromSearchParams,
  convertFiltersToApiParams,
} from '@/lib/utils/equipment-filter-utils';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { buildRoleBasedRedirectUrl } from '@/lib/utils/role-filter-utils';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 역할별 기본 필터 정책
 *
 * ✅ SSOT: TEAM_RESTRICTED_ROLES, SITE_RESTRICTED_ROLES from @equipment-management/shared-constants
 * ✅ 공유 유틸리티: buildRoleBasedRedirectUrl() from lib/utils/role-filter-utils.ts
 *
 * - test_engineer, technical_manager: 사이트 + 팀 필터 자동 적용
 * - quality_manager, lab_manager: 사이트 필터만 적용
 * - system_admin: 필터 미적용 (전체 조회 가능)
 */

/**
 * 장비 목록 페이지 (Server Component)
 *
 * Next.js 16 패턴:
 * - Server Component로 초기 데이터 fetch (FCP 최적화)
 * - Client Component(EquipmentListContent)에 initialData 전달
 * - ClientOnly wrapper로 hydration mismatch 방지
 * - Suspense로 스트리밍 지원
 *
 * ✅ SSOT: getServerAuthSession() 래퍼 사용 (lib/auth/server-session.ts)
 * ✅ 역할별 기본 필터는 서버 사이드 redirect로 URL에 반영 (URL = 유일한 진실의 소스)
 */
export default async function EquipmentPage(props: PageProps) {
  const searchParams = await props.searchParams;

  // ============================================================================
  // ✅ 역할별 기본 필터 적용 (서버 사이드 redirect)
  // SSOT: getServerAuthSession() → lib/auth/server-session.ts
  // ============================================================================
  const session = await getServerAuthSession();
  if (session?.user) {
    const redirectUrl = buildRoleBasedRedirectUrl('/equipment', searchParams, session.user);
    if (redirectUrl) redirect(redirectUrl);
  }

  // ============================================================================
  // 🔴 SSOT: 직접 searchParams 파싱 금지!
  // 반드시 equipment-filter-utils.ts의 공유 함수를 사용하세요.
  // @see lib/utils/equipment-filter-utils.ts
  // ============================================================================
  const uiFilters = parseEquipmentFiltersFromSearchParams(searchParams);
  const initialQuery = convertFiltersToApiParams(uiFilters);

  // Server에서 초기 데이터 fetch
  let initialData;
  try {
    initialData = await equipmentApiServer.getEquipmentList(initialQuery);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '[Equipment Page] Server-side fetch 실패\n' +
          `Query: ${JSON.stringify(initialQuery, null, 2)}\n` +
          `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } else {
      console.error('Failed to fetch initial equipment list:', error);
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">장비 관리</h1>
          <p className="text-muted-foreground mt-1">시험소 장비를 검색하고 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/equipment/create-shared">공용장비 등록</Link>
          </Button>
          <Button asChild>
            <Link href="/equipment/create">
              <Plus className="h-4 w-4 mr-2" />
              장비 등록
            </Link>
          </Button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <Suspense fallback={<EquipmentListSkeleton />}>
        <ClientOnly fallback={<EquipmentListSkeleton />}>
          <EquipmentListContent initialData={initialData} />
        </ClientOnly>
      </Suspense>
    </div>
  );
}

/**
 * 정적 메타데이터
 */
export const metadata: Metadata = {
  title: '장비 목록',
  description:
    '시험소 장비 목록을 조회하고 관리합니다. 필터, 검색, 정렬 기능을 통해 원하는 장비를 쉽게 찾을 수 있습니다.',
  openGraph: {
    title: '장비 관리 - 장비 목록',
    description: '시험소 장비를 효율적으로 관리하세요.',
  },
};
