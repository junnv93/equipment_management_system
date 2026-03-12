import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';

export default function NonConformancesLoading() {
  return (
    <ListPageSkeleton
      title="부적합 관리"
      description="장비 부적합 사항을 등록, 분석, 조치하고 종결합니다"
      showFilters={true}
      filterCount={3}
      showSearch={true}
      gridCols={{ base: 1 }}
      cardCount={8}
    />
  );
}
