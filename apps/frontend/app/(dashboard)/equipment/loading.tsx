import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';

/**
 * 장비 관리 페이지 로딩 상태
 *
 * ListPageSkeleton 공통 컴포넌트 사용
 * - 필터: search + site + teamId + status + classification + calibrationDue (6개)
 * - 그리드: 1열(모바일) → 2열(태블릿) → 3열(데스크톱)
 * - 카드: 9개 (3x3 그리드)
 */
export default function EquipmentLoading() {
  return (
    <ListPageSkeleton
      title="장비 관리"
      description="시험소 장비를 등록하고 관리합니다"
      showFilters={true}
      filterCount={6}
      showSearch={true}
      gridCols={{ base: 1, md: 2, lg: 3 }}
      cardCount={9}
      showActionButton={true}
    />
  );
}
