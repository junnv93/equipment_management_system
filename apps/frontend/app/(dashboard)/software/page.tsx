import { Suspense } from 'react';
import TestSoftwareListContent from './TestSoftwareListContent';
import { RouteLoading } from '@/components/layout/RouteLoading';

export default function TestSoftwarePage() {
  return (
    <Suspense fallback={<RouteLoading variant="table" showHeader />}>
      <TestSoftwareListContent />
    </Suspense>
  );
}
