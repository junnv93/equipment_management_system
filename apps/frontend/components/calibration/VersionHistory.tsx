'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { queryKeys } from '@/lib/api/query-config';
import { formatDate } from '@/lib/utils/date';
import calibrationPlansApi, { CalibrationPlanVersion } from '@/lib/api/calibration-plans-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { History, FileText, ExternalLink } from 'lucide-react';
import {
  CALIBRATION_VERSION_HISTORY,
  CALIBRATION_PLAN_STATUS_BADGE_COLORS,
} from '@/lib/design-tokens';

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
  const t = useTranslations('calibration');
  const {
    data: versions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.calibrationPlans.versions(planUuid),
    queryFn: () => calibrationPlansApi.getVersionHistory(planUuid),
    enabled: !!planUuid,
  });

  // 버전이 1개 이하면 히스토리 표시 안함
  if (!isLoading && (!versions || versions.length <= 1)) {
    return null;
  }

  if (isLoading) {
    return (
      <div>
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

  const vh = 'planDetail.versionHistory' as const;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <History className="h-5 w-5" aria-hidden="true" />
        {t(`${vh}.title`)}
      </h3>
      <div
        className="space-y-2"
        role="list"
        aria-label={t(`${vh}.ariaLabel`)}
        data-testid="version-history"
      >
        {versions.map((version: CalibrationPlanVersion) => {
          const isCurrent = currentVersion === version.version;
          const versionAriaLabel =
            t(`${vh}.versionLabel`, { version: version.version }) +
            (version.isLatestVersion ? ` (${t(`${vh}.latestBadge`)})` : '') +
            (isCurrent ? t(`${vh}.currentSuffix`) : '');

          return (
            <div
              key={version.id}
              className={`${CALIBRATION_VERSION_HISTORY.row.base} ${
                isCurrent
                  ? CALIBRATION_VERSION_HISTORY.row.current
                  : CALIBRATION_VERSION_HISTORY.row.default
              }`}
              role="listitem"
              aria-label={versionAriaLabel}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <div className="flex items-center gap-3">
                <FileText
                  className={`h-4 w-4 ${isCurrent ? CALIBRATION_VERSION_HISTORY.icon.current : CALIBRATION_VERSION_HISTORY.icon.default}`}
                  aria-hidden="true"
                />
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {t(`${vh}.versionLabel`, { version: version.version })}
                    {version.isLatestVersion && (
                      <Badge className={CALIBRATION_VERSION_HISTORY.latestBadge}>
                        {t(`${vh}.latestBadge`)}
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="outline" className={CALIBRATION_VERSION_HISTORY.currentBadge}>
                        {t(`${vh}.currentBadge`)}
                      </Badge>
                    )}
                    <Badge className={CALIBRATION_PLAN_STATUS_BADGE_COLORS[version.status]}>
                      {t(`planStatus.${version.status}` as Parameters<typeof t>[0])}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t(`${vh}.createdAt`, {
                      date: formatDate(version.createdAt, 'yyyy-MM-dd HH:mm'),
                    })}
                    {version.approvedAt && (
                      <>
                        {' · '}
                        {t(`${vh}.approvedAt`, {
                          date: formatDate(version.approvedAt, 'yyyy-MM-dd'),
                        })}
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
                  aria-label={t(`${vh}.viewAriaLabel`, { version: version.version })}
                >
                  <ExternalLink className="h-4 w-4 mr-1" aria-hidden="true" />
                  {t(`${vh}.viewButton`)}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
