import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import {
  EquipmentListContent,
  EquipmentListSkeleton,
} from '@/components/equipment/EquipmentListContent';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import {
  parseEquipmentFiltersFromSearchParams,
  convertFiltersToApiParams,
} from '@/lib/utils/equipment-filter-utils';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 장비 목록 페이지 (Server Component)
 *
 * Next.js 16 패턴:
 * - Server Component로 초기 데이터 fetch (FCP 최적화)
 * - Client Component(EquipmentListContent)에 initialData 전달
 * - Suspense로 스트리밍 지원
 */
export default async function EquipmentPage(props: PageProps) {
  // searchParams는 Promise이므로 await 필요
  const searchParams = await props.searchParams;

  // ============================================================================
  // 🔴 SSOT: 직접 searchParams 파싱 금지!
  // 반드시 equipment-filter-utils.ts의 공유 함수를 사용하세요.
  // 이유: 클라이언트(useEquipmentFilters)와 서버(page.tsx) 간 파싱 로직 불일치로
  //       새 필터가 서버에서 누락되는 버그 발생 (2026-01-30)
  // @see lib/utils/equipment-filter-utils.ts
  // ============================================================================
  const uiFilters = parseEquipmentFiltersFromSearchParams(searchParams);
  const initialQuery = convertFiltersToApiParams(uiFilters);

  // Server에서 초기 데이터 fetch
  let initialData;
  try {
    initialData = await equipmentApiServer.getEquipmentList(initialQuery);
  } catch (error) {
    // 에러 시 클라이언트에서 fetch하도록 initialData 없이 렌더링
    console.error('Failed to fetch initial equipment list:', error);
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
        <EquipmentListContent initialData={initialData} />
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
