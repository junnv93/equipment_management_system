'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Calendar, FileText } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import {
  CONTENT_TOKENS,
  CALIBRATION_TABLE,
  CALIBRATION_EMPTY_STATE,
  getCalibrationRowClasses,
} from '@/lib/design-tokens';
import calibrationApi, { type Calibration } from '@/lib/api/calibration-api';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useAuth } from '@/hooks/use-auth';
import {
  UserRoleValues as URVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import { CalibrationResultBadge } from './CalibrationResultBadge';
import { CalibrationRegisterDialog } from './CalibrationRegisterDialog';
import { CalibrationApprovalActions } from './CalibrationApprovalActions';

interface CalibrationHistoryTabProps {
  equipment: Equipment;
}

/**
 * 교정 이력 탭 - 테이블 UI
 *
 * - 교정 등록: 시험실무자만 가능 (UL-QP-18 직무분리)
 * - 승인/반려: 기술책임자/시험소장만 가능
 * - 교정기한 초과: 경고 배너 표시
 */
export function CalibrationHistoryTab({ equipment }: CalibrationHistoryTabProps) {
  const t = useTranslations('equipment');
  const { hasRole } = useAuth();
  const { fmtDate } = useDateFormatter();

  const equipmentId = String(equipment.id);

  const { data: calibrations = [], isLoading } = useQuery({
    queryKey: queryKeys.calibrations.byEquipment(equipmentId),
    queryFn: () => calibrationApi.getEquipmentCalibrations(equipmentId),
    enabled: !!equipmentId,
    staleTime: CACHE_TIMES.MEDIUM,
  });

  // UL-QP-18: 시험실무자만 교정 등록 가능 (lab_manager도 등록 불가 — 직무분리)
  const canCreate = hasRole([URVal.TEST_ENGINEER]);

  // 교정기한 초과 여부:
  // - equipment.status: 백엔드 CalibrationOverdueScheduler가 매시간 전환 (정확)
  // - nextCalibrationDate 날짜 비교: 스케줄러 실행 전 gap 구간 커버
  const isOverdue =
    equipment.status === ESVal.CALIBRATION_OVERDUE ||
    (equipment.nextCalibrationDate != null && new Date(equipment.nextCalibrationDate) < new Date());

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isOverdue && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('calibrationHistoryTab.overdueBanner.title')}</AlertTitle>
          <AlertDescription>
            {t('calibrationHistoryTab.overdueBanner.description')}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-info" />
            {t('calibrationHistoryTab.title')}
          </CardTitle>
          {canCreate && <CalibrationRegisterDialog equipmentId={equipmentId} />}
        </CardHeader>
        <CardContent>
          {calibrations.length === 0 ? (
            <div className={CALIBRATION_EMPTY_STATE.container}>
              <Calendar className={CALIBRATION_EMPTY_STATE.icon} />
              <p className={CALIBRATION_EMPTY_STATE.description}>
                {t('calibrationHistoryTab.empty')}
              </p>
            </div>
          ) : (
            <div className={CALIBRATION_TABLE.wrapper}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('calibrationHistoryTab.tableHeaders.calibrationDate')}</TableHead>
                    <TableHead>
                      {t('calibrationHistoryTab.tableHeaders.nextCalibrationDate')}
                    </TableHead>
                    <TableHead>
                      {t('calibrationHistoryTab.tableHeaders.calibrationAgency')}
                    </TableHead>
                    <TableHead>{t('calibrationHistoryTab.tableHeaders.result')}</TableHead>
                    <TableHead>{t('calibrationHistoryTab.tableHeaders.approvalStatus')}</TableHead>
                    <TableHead>{t('calibrationHistoryTab.tableHeaders.certificate')}</TableHead>
                    <TableHead>{t('calibrationHistoryTab.tableHeaders.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calibrations.map((cal: Calibration) => (
                    <TableRow
                      key={cal.id}
                      className={[
                        CALIBRATION_TABLE.rowHover,
                        getCalibrationRowClasses(cal.approvalStatus),
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <TableCell className={CONTENT_TOKENS.numeric.tabular}>
                        {fmtDate(cal.calibrationDate)}
                      </TableCell>
                      <TableCell className={CONTENT_TOKENS.numeric.tabular}>
                        {fmtDate(cal.nextCalibrationDate)}
                      </TableCell>
                      <TableCell>{cal.calibrationAgency}</TableCell>
                      <TableCell>
                        {cal.result ? (
                          <CalibrationResultBadge type="result" value={cal.result} />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {cal.approvalStatus ? (
                          <CalibrationResultBadge type="approval" value={cal.approvalStatus} />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {cal.certificatePath ? (
                          <a
                            href={cal.certificatePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={CALIBRATION_TABLE.link}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {t('calibrationHistoryTab.certificate.download')}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {t('calibrationHistoryTab.certificate.noFile')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <CalibrationApprovalActions calibration={cal} equipmentId={equipmentId} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
