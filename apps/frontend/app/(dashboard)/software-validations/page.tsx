import { Suspense } from 'react';
import { RouteLoading } from '@/components/layout/RouteLoading';
import SoftwareValidationsListContent from './SoftwareValidationsListContent';

export default function SoftwareValidationsPage() {
  return (
    <Suspense fallback={<RouteLoading variant="table" showHeader />}>
      <SoftwareValidationsListContent />
    </Suspense>
  );
}
