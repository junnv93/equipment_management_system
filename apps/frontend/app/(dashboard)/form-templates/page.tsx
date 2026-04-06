import { Suspense } from 'react';
import FormTemplatesContent from '@/components/form-templates/FormTemplatesContent';
import { RouteLoading } from '@/components/layout/RouteLoading';

export default function FormTemplatesPage() {
  return (
    <Suspense fallback={<RouteLoading variant="table" showHeader />}>
      <FormTemplatesContent />
    </Suspense>
  );
}
