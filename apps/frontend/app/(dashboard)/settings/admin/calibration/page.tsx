import { Suspense } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import CalibrationSettingsContent from './CalibrationSettingsContent';

export default function CalibrationSettingsPage() {
  return (
    <Suspense fallback={<CalibrationSettingsSkeleton />}>
      <CalibrationSettingsContent />
    </Suspense>
  );
}

function CalibrationSettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-80 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}
