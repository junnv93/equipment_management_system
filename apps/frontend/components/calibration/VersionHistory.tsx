'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import calibrationPlansApi, {
  CalibrationPlanVersion,
  CALIBRATION_PLAN_STATUS_LABELS,
  CALIBRATION_PLAN_STATUS_COLORS,
} from '@/lib/api/calibration-plans-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { History, FileText, ExternalLink } from 'lucide-react';

interface VersionHistoryProps {
  /** 현재 교정계획서 UUID */
  planUuid: string;
  /** 현재 버전 번호 (강조 표시용) */
  currentVersion?: number;
}

/**
 * 교정계획서 버전 히스토리 컴포넌트
 *
 * 같은 연도+시험소의 모든 버전을 표시합니다.
 * - 최신 버전 배지 표시
 * - 현재 보고 있는 버전 강조
 * - 각 버전으로 이동 가능
 *
 * WCAG 2.1 AA 접근성:
 * - role="list" / role="listitem" 구조
 * - 각 버전에 aria-label 명시
 * - 키보드 네비게이션 지원
 */
export function VersionHistory({ planUuid, currentVersion }: VersionHistoryProps) {
  const {
    data: versions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['calibration-plan-versions', planUuid],
    queryFn: () => calibrationPlansApi.getVersionHistory(planUuid),
    enabled: !!planUuid,
  });

  // 버전이 1개 이하면 히스토리 표시 안함
  if (!isLoading && (!versions || versions.length <= 1)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-6 border-t pt-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-muted-foreground" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !versions) {
    return null;
  }

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <History className="h-5 w-5" aria-hidden="true" />
        버전 히스토리
      </h3>
      <div
        className="space-y-2"
        role="list"
        aria-label="교정계획서 버전 목록"
        data-testid="version-history"
      >
        {versions.map((version: CalibrationPlanVersion) => {
          const isCurrent = currentVersion === version.version;

          return (
            <div
              key={version.id}
              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                isCurrent ? 'bg-ul-green/5 border-ul-green/30' : 'hover:bg-gray-50'
              }`}
              role="listitem"
              aria-label={`버전 ${version.version}${version.isLatestVersion ? ' (최신)' : ''}${isCurrent ? ' - 현재 보고 있는 버전' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <div className="flex items-center gap-3">
                <FileText
                  className={`h-4 w-4 ${isCurrent ? 'text-ul-green' : 'text-gray-400'}`}
                  aria-hidden="true"
                />
                <div>
                  <div className="font-medium flex items-center gap-2">
                    버전 {version.version}
                    {version.isLatestVersion && (
                      <Badge className="bg-ul-green/10 text-ul-green border border-ul-green/20">
                        최신
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="outline" className="text-ul-midnight border-ul-midnight/30">
                        현재
                      </Badge>
                    )}
                    <Badge className={CALIBRATION_PLAN_STATUS_COLORS[version.status]}>
                      {CALIBRATION_PLAN_STATUS_LABELS[version.status]}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    작성: {format(new Date(version.createdAt), 'yyyy-MM-dd HH:mm')}
                    {version.approvedAt && (
                      <>
                        {' · '}
                        승인: {format(new Date(version.approvedAt), 'yyyy-MM-dd')}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {!isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/calibration-plans/${version.id}`, '_blank')}
                  aria-label={`버전 ${version.version} 새 탭에서 보기`}
                >
                  <ExternalLink className="h-4 w-4 mr-1" aria-hidden="true" />
                  보기
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
