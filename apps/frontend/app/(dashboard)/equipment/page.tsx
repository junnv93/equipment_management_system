import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { EquipmentListContent, EquipmentListSkeleton } from '@/components/equipment/EquipmentListContent';

/**
 * 장비 목록 페이지 (Server Component)
 *
 * Next.js 16 패턴:
 * - Server Component로 메타데이터 및 정적 UI 처리
 * - Client Component(EquipmentListContent)에 인터랙션 위임
 * - Link 컴포넌트로 prefetch 최적화
 */
export default function EquipmentPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">장비 관리</h1>
          <p className="text-muted-foreground mt-1">
            시험소 장비를 검색하고 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/equipment/create-shared">
              공용장비 등록
            </Link>
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
        <EquipmentListContent />
      </Suspense>
    </div>
  );
}

/**
 * 정적 메타데이터
 */
export const metadata: Metadata = {
  title: '장비 목록',
  description: '시험소 장비 목록을 조회하고 관리합니다. 필터, 검색, 정렬 기능을 통해 원하는 장비를 쉽게 찾을 수 있습니다.',
  openGraph: {
    title: '장비 관리 - 장비 목록',
    description: '시험소 장비를 효율적으로 관리하세요.',
  },
};
