import { TablePageSkeleton } from '@/components/ui/list-page-skeleton';

export default function AuditLogsLoading() {
  return (
    <TablePageSkeleton
      title="감사 로그"
      description="시스템 활동 기록"
      showFilters={true}
      filterCount={3}
      columnCount={7}
      showActionButton={false}
    />
  );
}
