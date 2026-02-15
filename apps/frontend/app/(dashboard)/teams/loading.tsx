import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';

/**
 * 팀 관리 페이지 로딩 상태
 *
 * ListPageSkeleton 공통 컴포넌트 사용
 * - 필터: search + site + type (3개)
 * - 그리드: 1열(모바일) → 2열(태블릿) → 3열(데스크톱)
 * - 카드: 6개 (기본값)
 */
export default function TeamsLoading() {
  return (
    <ListPageSkeleton
      title="팀 관리"
      description="시험소 팀을 관리하고 팀원 및 장비 현황을 확인합니다"
      showFilters={true}
      filterCount={3}
      showSearch={true}
      gridCols={{ base: 1, md: 2, lg: 3 }}
      cardCount={6}
      showActionButton={true}
    />
  );
}
