'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslations } from 'next-intl';
import { format, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import calibrationApi, { type IntermediateCheckItem } from '@/lib/api/calibration-api';
import InspectionFormDialog from './InspectionFormDialog';
import InspectionRecordsDialog from './InspectionRecordsDialog';
import {
  getIntermediateCheckBadgeClasses,
  getIntermediateCheckIcon,
  getIntermediateCheckIconColor,
  CALIBRATION_TABLE,
  CALIBRATION_EMPTY_STATE,
  CALIBRATION_STATS_TEXT,
  CALIBRATION_CARD_BORDER,
  CALIBRATION_THRESHOLDS,
  type IntermediateCheckStatus,
} from '@/lib/design-tokens';

// D-day 기반 중간점검 상태 계산
function getStatusStyle(checkDate: string, t: ReturnType<typeof useTranslations<'calibration'>>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(checkDate);
  date.setHours(0, 0, 0, 0);
  const diff = differenceInDays(date, today);

  let status: IntermediateCheckStatus;
  let text: string;

  if (diff < 0) {
    status = 'overdue';
    text = t('content.intermediateChecks.statusText.overdue', { days: Math.abs(diff) });
  } else if (diff === 0) {
    status = 'today';
    text = t('content.intermediateChecks.statusText.today');
  } else if (diff <= CALIBRATION_THRESHOLDS.INTERMEDIATE_CHECK_UPCOMING_DAYS) {
    status = 'upcoming';
    text = `D-${diff}`;
  } else {
    status = 'future';
    text = `D-${diff}`;
  }

  return {
    badge: getIntermediateCheckBadgeClasses(status),
    icon: getIntermediateCheckIcon(status),
    iconColor: getIntermediateCheckIconColor(status),
    text,
  };
}

interface Props {
  /** 역할별 필터: 서버사이드 필터링에 사용 */
  defaultTeamId?: string;
  defaultSite?: string;
  onComplete: (check: IntermediateCheckItem) => void;
  isCompleting: boolean;
}

export default function IntermediateChecksTab({
  defaultTeamId,
  defaultSite,
  onComplete,
  isCompleting,
}: Props) {
  const t = useTranslations('calibration');
  const [selectedCheck, setSelectedCheck] = useState<IntermediateCheckItem | null>(null);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // ✅ 쿼리 소유: 이 컴포넌트가 자신의 데이터를 책임짐
  // TanStack Query가 오케스트레이터의 동일 queryKey와 캐시를 공유 → 네트워크 요청 1회만 발생
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.calibrations.intermediateChecks(defaultTeamId, defaultSite),
    queryFn: () => calibrationApi.getAllIntermediateChecks(defaultTeamId, defaultSite),
    ...QUERY_CONFIG.CALIBRATION_LIST,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p>{t('content.loading')}</p>
      </div>
    );
  }

  if (!data?.items?.length) {
    return (
      <div className={CALIBRATION_EMPTY_STATE.container}>
        <CheckCircle2 className={CALIBRATION_EMPTY_STATE.icon} />
        <h3 className={CALIBRATION_EMPTY_STATE.title}>
          {t('content.intermediateChecks.empty.title')}
        </h3>
        <p className={CALIBRATION_EMPTY_STATE.description}>
          {t('content.intermediateChecks.empty.description')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 중간점검 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('content.intermediateChecks.stats.total')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {t('content.intermediateChecks.stats.unit', { count: data.meta.totalItems })}
            </div>
          </CardContent>
        </Card>

        <Card className={CALIBRATION_CARD_BORDER.overdue}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${CALIBRATION_STATS_TEXT.overdue}`}>
              {t('content.intermediateChecks.stats.overdue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${CALIBRATION_STATS_TEXT.overdue}`}>
              {t('content.intermediateChecks.stats.unit', { count: data.meta.overdueCount })}
            </div>
          </CardContent>
        </Card>

        <Card className={CALIBRATION_CARD_BORDER.pending}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${CALIBRATION_STATS_TEXT.pending}`}>
              {t('content.intermediateChecks.stats.pending')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${CALIBRATION_STATS_TEXT.pending}`}>
              {t('content.intermediateChecks.stats.unit', { count: data.meta.pendingCount })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 중간점검 목록 */}
      <div className={CALIBRATION_TABLE.wrapper}>
        <Table>
          <TableHeader className={CALIBRATION_TABLE.stickyHeader}>
            <TableRow>
              <TableHead>{t('content.intermediateChecks.table.status')}</TableHead>
              <TableHead>{t('content.intermediateChecks.table.checkDate')}</TableHead>
              <TableHead>{t('content.intermediateChecks.table.equipmentName')}</TableHead>
              <TableHead>{t('content.intermediateChecks.table.managementNumber')}</TableHead>
              <TableHead>{t('content.intermediateChecks.table.team')}</TableHead>
              <TableHead>{t('content.intermediateChecks.table.nextCalibrationDate')}</TableHead>
              <TableHead>{t('intermediateInspection.records')}</TableHead>
              <TableHead className="text-right">
                {t('content.intermediateChecks.table.action')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((check) => {
              const style = getStatusStyle(check.intermediateCheckDate, t);
              const IconComponent = style.icon;
              return (
                <TableRow
                  key={check.id}
                  className={`${CALIBRATION_TABLE.stripe} ${CALIBRATION_TABLE.rowHover}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-4 w-4 ${style.iconColor}`} />
                      <Badge className={style.badge}>{style.text}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className={CALIBRATION_TABLE.numericColumn}>
                    {format(new Date(check.intermediateCheckDate), 'yyyy-MM-dd', { locale: ko })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {check.equipmentName ? (
                      <Link
                        href={`/equipment/${check.equipmentId}`}
                        className={CALIBRATION_TABLE.link}
                      >
                        {check.equipmentName}
                      </Link>
                    ) : (
                      <span className="font-mono text-sm text-muted-foreground">
                        {check.equipmentId.substring(0, 8)}...
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={CALIBRATION_TABLE.numericColumn}>
                    {check.managementNumber || '-'}
                  </TableCell>
                  <TableCell>{check.teamName || check.team || '-'}</TableCell>
                  <TableCell className={CALIBRATION_TABLE.numericColumn}>
                    {format(new Date(check.nextCalibrationDate), 'yyyy-MM-dd', { locale: ko })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCheck(check);
                        setRecordsOpen(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      {t('intermediateInspection.actions.view')}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => onComplete(check)} disabled={isCompleting}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {t('content.intermediateChecks.table.complete')}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 점검 기록 목록 다이얼로그 */}
      {selectedCheck && (
        <InspectionRecordsDialog
          open={recordsOpen}
          onOpenChange={setRecordsOpen}
          calibrationId={selectedCheck.id}
          equipmentName={selectedCheck.equipmentName}
          onCreateNew={() => {
            setRecordsOpen(false);
            setFormOpen(true);
          }}
        />
      )}

      {/* 점검 기록 작성 다이얼로그 */}
      {selectedCheck && (
        <InspectionFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          calibrationId={selectedCheck.id}
          equipmentId={selectedCheck.equipmentId}
        />
      )}
    </div>
  );
}
