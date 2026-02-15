import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';

/**
 * 교정 관리 페이지 로딩 상태
 *
 * ListPageSkeleton 공통 컴포넌트 사용
 * - 필터: search + site + teamId + approvalStatus + result + date range (7개)
 * - 그리드: 1열 전체 (테이블 레이아웃이지만 카드 스타일 사용)
 * - 카드: 10개 (테이블 페이지네이션 기본)
 */
export default function CalibrationLoading() {
  return (
    <ListPageSkeleton
      title="교정 관리"
      description="장비 교정 기록을 관리하고 승인합니다"
      showFilters={true}
      filterCount={7}
      showSearch={true}
      gridCols={{ base: 1 }}
      cardCount={10}
      showActionButton={true}
    />
  );
}
