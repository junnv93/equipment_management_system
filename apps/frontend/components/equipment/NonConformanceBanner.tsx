'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface NonConformance {
  id: string;
  status: string;
  cause: string;
  discoveryDate: string | Date;
}

interface NonConformanceBannerProps {
  equipmentId: string;
  nonConformances: NonConformance[];
  showDetails?: boolean;
}

export function NonConformanceBanner({
  equipmentId,
  nonConformances,
  showDetails = false,
}: NonConformanceBannerProps) {
  if (!nonConformances || nonConformances.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-ul-red bg-red-50 dark:bg-red-950/30">
      <AlertTriangle className="h-5 w-5 text-ul-red" />
      <AlertTitle className="text-ul-red font-semibold text-lg">
        부적합 상태 ({nonConformances.length}건)
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-red-800 dark:text-red-200">
          이 장비는 현재 부적합 상태입니다. 부적합 처리가 완료될 때까지 대여 및 반출이 제한됩니다.
        </p>
        {showDetails && (
          <div className="space-y-2">
            {nonConformances.map((nc) => (
              <div
                key={nc.id}
                className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-red-200 dark:border-red-800"
              >
                <p className="text-sm text-gray-900 dark:text-gray-100">{nc.cause}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  발견일:{' '}
                  {new Date(nc.discoveryDate).toLocaleDateString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
        )}
        <Link href={`/equipment/${equipmentId}/non-conformance`}>
          <Button variant="default" size="sm" className="mt-2">
            부적합 관리
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
