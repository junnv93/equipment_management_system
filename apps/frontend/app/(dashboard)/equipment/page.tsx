import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import {
  EquipmentListContent,
  EquipmentListSkeleton,
} from '@/components/equipment/EquipmentListContent';
import { EquipmentPageHeader } from '@/components/equipment/EquipmentPageHeader';
import { ClientOnly } from '@/components/shared/ClientOnly';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import {
  parseEquipmentFiltersFromSearchParams,
  convertFiltersToApiParams,
} from '@/lib/utils/equipment-filter-utils';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { buildRoleBasedRedirectUrl } from '@/lib/utils/role-filter-utils';
import { getPageContainerClasses } from '@/lib/design-tokens';

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
 * 장비 목록 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Static Shell: 헤더 + 등록 버튼 (즉시 렌더링)
 * ✅ Dynamic Hole: 필터/데이터 (Suspense로 서버 스트리밍)
 */
export default function EquipmentPage(props: PageProps) {
  return (
    <div className={getPageContainerClasses()}>
      {/* Static Shell: 페이지 헤더 (Client Component, i18n 사용) */}
      <EquipmentPageHeader />

      {/* Dynamic Hole: 메인 컨텐츠 */}
      <Suspense fallback={<EquipmentListSkeleton />}>
        <EquipmentListAsync searchParamsPromise={props.searchParams} />
      </Suspense>
    </div>
  );
}

/**
 * 비동기 데이터 로딩 컴포넌트 (Suspense 내부에서 실행)
 *
 * 역할별 기본 필터 → 필터 파싱 → 서버 fetch → ClientOnly 래핑
 */
async function EquipmentListAsync({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await searchParamsPromise;

  // ✅ 역할별 기본 필터 적용 (서버 사이드 redirect)
  const session = await getServerAuthSession();
  if (session?.user) {
    const redirectUrl = buildRoleBasedRedirectUrl('/equipment', searchParams, session.user);
    if (redirectUrl) redirect(redirectUrl);
  }

  // 🔴 SSOT: 직접 searchParams 파싱 금지! equipment-filter-utils.ts 사용
  const uiFilters = parseEquipmentFiltersFromSearchParams(searchParams);
  const initialQuery = convertFiltersToApiParams(uiFilters);

  // Server에서 초기 데이터 fetch
  let initialData;
  try {
    initialData = await equipmentApiServer.getEquipmentList(initialQuery);
  } catch (error) {
    if (isRedirectError(error)) throw error;
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
    <ClientOnly fallback={<EquipmentListSkeleton />}>
      <EquipmentListContent initialData={initialData} />
    </ClientOnly>
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
