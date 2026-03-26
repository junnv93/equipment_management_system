'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Calendar, FileText, FileSpreadsheet, Download } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import {
  CONTENT_TOKENS,
  CALIBRATION_TABLE,
  CALIBRATION_EMPTY_STATE,
  getCalibrationRowClasses,
} from '@/lib/design-tokens';
import calibrationApi, { type Calibration } from '@/lib/api/calibration-api';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
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
 * - 성적서/원시데이터: 장비 단위 일괄 조회 → calibrationId 그룹핑 (N+1 방지)
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

  // 장비의 모든 문서를 단일 API 호출로 조회 → calibrationId로 그룹핑
  // (이전: calibrationIds.map → Promise.all N개 동시 호출, 현재: 1회 호출)
  const { data: allDocs = [] } = useQuery({
    queryKey: queryKeys.documents.byEquipment(equipmentId),
    queryFn: () => documentApi.getEquipmentDocuments(equipmentId, { includeCalibrations: true }),
    enabled: calibrations.length > 0,
    staleTime: CACHE_TIMES.LONG,
  });

  // calibrationId → documents[] 그룹핑 (O(n) Map)
  const docsByCalibrationId = useMemo(() => {
    const map = new Map<string, DocumentRecord[]>();
    for (const doc of allDocs) {
      if (!doc.calibrationId) continue;
      const list = map.get(doc.calibrationId) ?? [];
      list.push(doc);
      map.set(doc.calibrationId, list);
    }
    return map;
  }, [allDocs]);

  const canCreate = hasRole([URVal.TEST_ENGINEER]);

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
                  {calibrations.map((cal: Calibration) => {
                    const calDocs = docsByCalibrationId.get(cal.id) ?? [];
                    return (
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
                          <CalibrationDocumentsCell docs={calDocs} />
                        </TableCell>
                        <TableCell>
                          <CalibrationApprovalActions calibration={cal} equipmentId={equipmentId} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 교정별 문서 셀 — 부모에서 일괄 조회한 docs를 props로 수신 (N+1 방지)
 */
function CalibrationDocumentsCell({ docs }: { docs: DocumentRecord[] }) {
  const t = useTranslations('equipment');

  if (docs.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        {t('calibrationHistoryTab.certificate.noFile')}
      </span>
    );
  }

  const handleDownload = async (doc: DocumentRecord) => {
    await documentApi.downloadDocument(doc.id, doc.originalFileName);
  };

  return (
    <div className="flex flex-col gap-1">
      {docs.map((doc) => (
        <Button
          key={doc.id}
          variant="ghost"
          size="sm"
          className="h-auto py-1 px-2 justify-start gap-1.5 text-xs font-normal"
          onClick={() => handleDownload(doc)}
          title={doc.originalFileName}
        >
          {doc.documentType === 'raw_data' ? (
            <FileSpreadsheet className="h-3.5 w-3.5" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          <span className="truncate max-w-[120px]">
            {doc.documentType === 'raw_data'
              ? t('calibrationHistoryTab.certificate.rawData')
              : t('calibrationHistoryTab.certificate.download')}
          </span>
          <Download className="h-3 w-3 opacity-50" />
        </Button>
      ))}
    </div>
  );
}
