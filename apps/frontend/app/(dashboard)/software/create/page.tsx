import { Suspense } from 'react';
import CreateTestSoftwareContent from './CreateTestSoftwareContent';
import { RouteLoading } from '@/components/layout/RouteLoading';

export default function CreateTestSoftwarePage() {
  return (
    <Suspense fallback={<RouteLoading variant="detail" showHeader />}>
      <CreateTestSoftwareContent />
    </Suspense>
  );
}
