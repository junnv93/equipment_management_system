import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';

/**
 * 교정 계획 페이지 로딩 상태
 *
 * ListPageSkeleton 공통 컴포넌트 사용
 * - 필터: year + siteId + status (3개)
 * - 그리드: 1열 전체 (테이블 레이아웃)
 * - 카드: 8개 (연간 계획 목록)
 */
export default function CalibrationPlansLoading() {
  return (
    <ListPageSkeleton
      title="교정 계획"
      description="연간 교정 계획을 수립하고 관리합니다"
      showFilters={true}
      filterCount={3}
      showSearch={false}
      gridCols={{ base: 1 }}
      cardCount={8}
      showActionButton={true}
    />
  );
}
