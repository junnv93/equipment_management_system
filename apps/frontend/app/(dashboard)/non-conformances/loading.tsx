import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';

export default function NonConformancesLoading() {
  return (
    <ListPageSkeleton
      showTitle
      showDescription
      showFilters={true}
      filterCount={3}
      showSearch={true}
      gridCols={{ base: 1 }}
      cardCount={8}
    />
  );
}
