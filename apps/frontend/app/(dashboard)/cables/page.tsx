import { Suspense } from 'react';
import CableListContent from './CableListContent';
import { RouteLoading } from '@/components/layout/RouteLoading';

export default function CablesPage() {
  return (
    <Suspense fallback={<RouteLoading variant="table" showHeader />}>
      <CableListContent />
    </Suspense>
  );
}
