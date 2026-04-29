import { TablePageSkeleton } from '@/components/ui/list-page-skeleton';

export default function AuditLogsLoading() {
  return (
    <TablePageSkeleton
      showTitle
      showDescription
      showFilters={true}
      filterCount={3}
      columnCount={7}
      showActionButton={false}
    />
  );
}
