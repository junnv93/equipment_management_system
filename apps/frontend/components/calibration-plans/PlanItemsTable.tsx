'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCasGuardedMutation } from '@/hooks/use-cas-guarded-mutation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import calibrationPlansApi, {
  type CalibrationPlan,
  type CalibrationPlanItem,
} from '@/lib/api/calibration-plans-api';
import { CalibrationPlansCacheInvalidation } from '@/lib/api/cache-invalidation';
import { CalibrationPlanStatusValues as CPStatus } from '@equipment-management/schemas';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import {
  CheckCircle2,
  Edit2,
  Save,
  X,
  FileText,
  Camera,
  CalendarClock,
  ChevronRight,
  History,
  ClipboardCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalibrationForm } from '@/components/calibration/CalibrationForm';
import { useAuth } from '@/hooks/use-auth';
import { Permission } from '@equipment-management/shared-constants';
import {
  PLAN_TABLE_COLUMN_GROUP_TOKENS,
  PLAN_PROGRESS_TOKENS,
  CONFIRMATION_BADGE_TOKENS,
  NUMERIC_TOKENS,
  TABLE_TOKENS,
  TABLE_SCROLL_HINT_TOKENS,
  VERSION_HISTORY_COLLAPSIBLE_TOKENS,
  CALIBRATION_PLAN_DETAIL_HEADER_TOKENS,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { VersionHistory } from './VersionHistory';

interface PlanItemsTableProps {
  plan: CalibrationPlan;
  planUuid: string;
}

/**
 * 교정계획서 항목 테이블
 *
 * W-1: 확인 진행률 바 (approved 상태에서만)
 * W-2: 컬럼 그룹 배경색 (기본정보 / 스냅샷 / 계획)
 * W-3: 접이식 버전 이력 (카드 하단)
 */
export function PlanItemsTable({ plan, planUuid }: PlanItemsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('calibration');
  const { fmtDate } = useDateFormatter();

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingAgency, setEditingAgency] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const [recordingItemId, setRecordingItemId] = useState<string | null>(null);
  const [optimisticConfirmedId, setOptimisticConfirmedId] = useState<string | null>(null);

  const { can } = useAuth();
  const canCreateCalibration = can(Permission.CREATE_CALIBRATION);

  const isDraft = plan.status === CPStatus.DRAFT;
  const isApproved = plan.status === CPStatus.APPROVED;
  const items = useMemo(() => plan.items || [], [plan.items]);

  // W-1: 진행률 계산
  const { confirmedCount, progressPercent } = useMemo(() => {
    const confirmed = items.filter((item) => item.confirmedBy).length;
    const percent = items.length > 0 ? Math.round((confirmed / items.length) * 100) : 0;
    return { confirmedCount: confirmed, progressPercent: percent };
  }, [items]);

  const updateItemMutation = useMutation({
    mutationFn: ({
      itemUuid,
      data,
    }: {
      itemUuid: string;
      data: { plannedCalibrationAgency?: string; notes?: string };
    }) => calibrationPlansApi.updatePlanItem(planUuid, itemUuid, data),
    onSuccess: () => {
      toast({
        title: t('planDetail.toasts.updateItemSuccess'),
        description: t('planDetail.toasts.updateItemSuccessDesc'),
      });
      CalibrationPlansCacheInvalidation.invalidatePlan(queryClient, planUuid);
      setEditingItemId(null);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: t('planDetail.toasts.updateItemError'),
        description: error.response?.data?.message || t('planDetail.toasts.updateItemErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  const confirmItemMutation = useCasGuardedMutation<CalibrationPlanItem, string>({
    fetchCasVersion: () =>
      calibrationPlansApi.getCalibrationPlan(planUuid).then((p) => p.casVersion),
    mutationFn: (itemUuid, casVersion) =>
      calibrationPlansApi.confirmPlanItem(planUuid, itemUuid, { casVersion }),
    onSuccess: () => {
      toast({
        title: t('planDetail.toasts.confirmItemSuccess'),
        description: t('planDetail.toasts.confirmItemSuccessDesc'),
      });
      CalibrationPlansCacheInvalidation.invalidatePlan(queryClient, planUuid);
    },
    onError: (error) => {
      setOptimisticConfirmedId(null);
      toast({
        title: t('planDetail.toasts.confirmItemError'),
        description: error.response?.data?.message || t('planDetail.toasts.confirmItemErrorDesc'),
        variant: 'destructive',
      });
      CalibrationPlansCacheInvalidation.invalidatePlan(queryClient, planUuid);
    },
  });

  const handleStartEdit = (item: CalibrationPlanItem) => {
    setEditingItemId(item.id);
    setEditingAgency(item.plannedCalibrationAgency || '');
    setEditingNotes(item.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingItemId) return;
    updateItemMutation.mutate({
      itemUuid: editingItemId,
      data: {
        plannedCalibrationAgency: editingAgency,
        notes: editingNotes,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingAgency('');
    setEditingNotes('');
  };

  const colGroup = PLAN_TABLE_COLUMN_GROUP_TOKENS;
  const showActions = isDraft || isApproved;

  const recordingItem = recordingItemId ? items.find((i) => i.id === recordingItemId) : null;

  return (
    <>
      {/* 실적 기록 Dialog */}
      {recordingItem && (
        <Dialog open={!!recordingItemId} onOpenChange={(open) => !open && setRecordingItemId(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('planDetail.items.recordActualDialog.title')}</DialogTitle>
              <DialogDescription>
                {recordingItem.equipment?.name ?? recordingItem.equipmentId}
              </DialogDescription>
            </DialogHeader>
            <CalibrationForm
              mode="plan-item"
              equipmentId={recordingItem.equipmentId}
              planItemId={recordingItem.id}
              onSuccess={() => setRecordingItemId(null)}
              onCancel={() => setRecordingItemId(null)}
            />
          </DialogContent>
        </Dialog>
      )}
      <Card className={CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.cardElevation}>
        <CardHeader>
          <CardTitle>{t('planDetail.items.title')}</CardTitle>
          <CardDescription>
            {isApproved
              ? t('planDetail.items.descriptionApproved')
              : t('planDetail.items.description', { count: items.length })}
          </CardDescription>
        </CardHeader>

        {/* W-1: 확인 진행률 바 (approved 상태에서만) */}
        {isApproved && items.length > 0 && (
          <div className={PLAN_PROGRESS_TOKENS.container}>
            <span className={PLAN_PROGRESS_TOKENS.label} id="progress-label">
              {t('planDetail.items.progress.label')}
            </span>
            <div className={PLAN_PROGRESS_TOKENS.barWrap}>
              <div
                className={PLAN_PROGRESS_TOKENS.track}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-labelledby="progress-label"
              >
                <div
                  className={cn(PLAN_PROGRESS_TOKENS.fill, PLAN_PROGRESS_TOKENS.transition)}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span
                className={
                  progressPercent === 100
                    ? PLAN_PROGRESS_TOKENS.textComplete
                    : progressPercent === 0
                      ? PLAN_PROGRESS_TOKENS.textEmpty
                      : PLAN_PROGRESS_TOKENS.text
                }
              >
                {t('planDetail.items.progress.countWithPercent', {
                  confirmed: confirmedCount,
                  total: items.length,
                  percent: progressPercent,
                })}
              </span>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className={TABLE_TOKENS.empty.container}>
              <FileText className={TABLE_TOKENS.empty.icon} />
              <p className={TABLE_TOKENS.empty.text}>{t('planDetail.items.empty')}</p>
            </div>
          ) : (
            <div
              className={TABLE_SCROLL_HINT_TOKENS.wrapper}
              role="region"
              tabIndex={0}
              aria-label={t('planDetail.items.tableAriaLabel')}
            >
              <div className={TABLE_SCROLL_HINT_TOKENS.fadeRight} />
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    {/* W-2: 컬럼 그룹 헤더 (1행) */}
                    <TableRow>
                      <TableHead
                        className={cn(colGroup.base.header, colGroup.groupHeader.text)}
                        colSpan={3}
                      >
                        <span className={colGroup.groupHeader.gap}>
                          {t('planDetail.items.columnGroup.base')}
                        </span>
                      </TableHead>
                      <TableHead
                        className={cn(
                          colGroup.snapshot.header,
                          colGroup.snapshot.borderStart,
                          colGroup.groupHeader.text,
                          'text-center'
                        )}
                        colSpan={3}
                      >
                        <span className={colGroup.groupHeader.gap}>
                          <Camera className={colGroup.groupHeader.icon} />
                          {t('planDetail.items.columnGroup.snapshot')}
                        </span>
                      </TableHead>
                      <TableHead
                        className={cn(
                          colGroup.plan.header,
                          colGroup.plan.borderStart,
                          colGroup.groupHeader.text,
                          'text-center'
                        )}
                        colSpan={4}
                      >
                        <span className={colGroup.groupHeader.gap}>
                          <CalendarClock className={colGroup.groupHeader.icon} />
                          {t('planDetail.items.columnGroup.plan')}
                        </span>
                      </TableHead>
                      {showActions && <TableHead className={colGroup.base.header} />}
                    </TableRow>

                    {/* 서브 헤더 (2행) */}
                    <TableRow className={colGroup.subHeader.bg}>
                      <TableHead className={cn(colGroup.subHeader.text, 'w-[50px] text-center')}>
                        {t('planDetail.items.headers.sequence')}
                      </TableHead>
                      <TableHead className={colGroup.subHeader.text}>
                        {t('planDetail.items.headers.managementNumber')}
                      </TableHead>
                      <TableHead className={colGroup.subHeader.text}>
                        {t('planDetail.items.headers.equipmentName')}
                      </TableHead>
                      <TableHead
                        className={cn(colGroup.subHeader.text, colGroup.snapshot.borderStart)}
                      >
                        {t('planDetail.items.headers.validityDate')}
                      </TableHead>
                      <TableHead className={colGroup.subHeader.text}>
                        {t('planDetail.items.headers.calibrationCycle')}
                      </TableHead>
                      <TableHead className={colGroup.subHeader.text}>
                        {t('planDetail.items.headers.calibrationAgency')}
                      </TableHead>
                      <TableHead className={cn(colGroup.subHeader.text, colGroup.plan.borderStart)}>
                        {t('planDetail.items.headers.plannedDate')}
                      </TableHead>
                      <TableHead className={colGroup.subHeader.text}>
                        {t('planDetail.items.headers.plannedAgency')}
                      </TableHead>
                      <TableHead className={colGroup.subHeader.text}>
                        {t('planDetail.items.headers.confirmation')}
                      </TableHead>
                      <TableHead className={colGroup.subHeader.text}>
                        {t('planDetail.items.headers.notes')}
                      </TableHead>
                      {showActions && (
                        <TableHead className={cn(colGroup.subHeader.text, 'w-[80px]')} />
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: CalibrationPlanItem) => (
                      <TableRow key={item.id}>
                        {/* 기본정보 그룹 */}
                        <TableCell
                          className={cn(
                            'text-center font-medium text-muted-foreground',
                            NUMERIC_TOKENS.tabular
                          )}
                        >
                          {item.sequenceNumber}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.equipment?.managementNumber || '-'}
                        </TableCell>
                        <TableCell>{item.equipment?.name || '-'}</TableCell>

                        {/* 스냅샷 그룹 (W-2: 배경색) */}
                        <TableCell
                          className={cn(
                            colGroup.snapshot.cell,
                            colGroup.snapshot.borderStart,
                            'font-mono text-sm'
                          )}
                        >
                          {item.snapshotValidityDate ? fmtDate(item.snapshotValidityDate) : '-'}
                        </TableCell>
                        <TableCell className={colGroup.snapshot.cell}>
                          {item.snapshotCalibrationCycle
                            ? t('planDetail.items.monthUnit', {
                                count: item.snapshotCalibrationCycle,
                              })
                            : '-'}
                        </TableCell>
                        <TableCell className={colGroup.snapshot.cell}>
                          {item.snapshotCalibrationAgency || '-'}
                        </TableCell>

                        {/* 계획 그룹 (W-2: 배경색) */}
                        <TableCell
                          className={cn(
                            colGroup.plan.cell,
                            colGroup.plan.borderStart,
                            'font-mono text-sm'
                          )}
                        >
                          {item.plannedCalibrationDate ? fmtDate(item.plannedCalibrationDate) : '-'}
                        </TableCell>
                        <TableCell className={colGroup.plan.cell}>
                          {editingItemId === item.id ? (
                            <Input
                              value={editingAgency}
                              onChange={(e) => setEditingAgency(e.target.value)}
                              className={TABLE_TOKENS.inlineEdit.inputWidth}
                            />
                          ) : (
                            item.plannedCalibrationAgency || '-'
                          )}
                        </TableCell>
                        <TableCell className={cn(colGroup.plan.cell, 'text-center')}>
                          {item.confirmedBy || optimisticConfirmedId === item.id ? (
                            <Badge
                              variant="outline"
                              className={CONFIRMATION_BADGE_TOKENS.confirmed.background}
                            >
                              <CheckCircle2
                                className={cn(CONFIRMATION_BADGE_TOKENS.confirmed.icon, 'mr-1')}
                              />
                              {t('planDetail.items.confirmed')}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className={colGroup.plan.cell}>
                          {editingItemId === item.id ? (
                            <Input
                              value={editingNotes}
                              onChange={(e) => setEditingNotes(e.target.value)}
                              placeholder={t('planDetail.placeholders.notes')}
                              className={TABLE_TOKENS.inlineEdit.inputWidth}
                            />
                          ) : (
                            <div className="flex flex-col gap-1">
                              {item.actualCalibrationDate && (
                                <span className="font-mono text-sm">
                                  {fmtDate(item.actualCalibrationDate)}
                                </span>
                              )}
                              {item.actualCalibrationId ? (
                                <Badge
                                  variant="outline"
                                  className="w-fit text-xs bg-green-50 border-green-300 text-green-700 dark:bg-green-950 dark:border-green-700 dark:text-green-400"
                                >
                                  <Link
                                    href={`/calibration?highlight=${item.actualCalibrationId}`}
                                    className="flex items-center gap-1 hover:underline"
                                  >
                                    <History className="h-3 w-3" />
                                    {t('planDetail.items.actualLinked')}
                                  </Link>
                                </Badge>
                              ) : (
                                !item.actualCalibrationDate &&
                                (item.notes || <span className="text-muted-foreground">—</span>)
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* 액션 */}
                        {showActions && (
                          <TableCell className="text-center">
                            {editingItemId === item.id ? (
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={updateItemMutation.isPending}
                                  className={cn(TABLE_TOKENS.inlineEdit.button.size, 'p-0')}
                                >
                                  <Save className={TABLE_TOKENS.inlineEdit.button.iconSize} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className={cn(TABLE_TOKENS.inlineEdit.button.size, 'p-0')}
                                >
                                  <X className={TABLE_TOKENS.inlineEdit.button.iconSize} />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-1 justify-center">
                                {isDraft && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartEdit(item)}
                                    className={cn(TABLE_TOKENS.inlineEdit.button.size, 'p-0')}
                                  >
                                    <Edit2 className={TABLE_TOKENS.inlineEdit.button.iconSize} />
                                  </Button>
                                )}
                                {isApproved &&
                                  !item.actualCalibrationId &&
                                  canCreateCalibration && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setRecordingItemId(item.id)}
                                      title={t('planDetail.items.recordActual')}
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                    >
                                      <ClipboardCheck className="h-4 w-4" />
                                    </Button>
                                  )}
                                {isApproved &&
                                  !item.confirmedBy &&
                                  optimisticConfirmedId !== item.id && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setOptimisticConfirmedId(item.id);
                                        confirmItemMutation.mutate(item.id);
                                      }}
                                      disabled={confirmItemMutation.isPending}
                                      title={t('planDetail.items.confirm')}
                                      className={cn(
                                        'h-8 w-8 p-0',
                                        CONFIRMATION_BADGE_TOKENS.confirmed.text
                                      )}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  )}
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>

        {/* W-3: 접이식 버전 이력 */}
        <VersionHistoryCollapsible
          planUuid={planUuid}
          currentVersion={plan.version}
          isOpen={isVersionOpen}
          onToggle={() => setIsVersionOpen(!isVersionOpen)}
        />
      </Card>
    </>
  );
}

/**
 * 접이식 버전 이력 래퍼
 *
 * VersionHistory 컴포넌트를 details/summary로 감싸서
 * 기본 접힌 상태로 카드 하단에 배치
 */
function VersionHistoryCollapsible({
  planUuid,
  currentVersion,
  isOpen,
  onToggle,
}: {
  planUuid: string;
  currentVersion?: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('calibration');

  return (
    <div className={VERSION_HISTORY_COLLAPSIBLE_TOKENS.wrapper}>
      <Button
        variant="ghost"
        onClick={onToggle}
        className={VERSION_HISTORY_COLLAPSIBLE_TOKENS.trigger}
        aria-expanded={isOpen}
      >
        <ChevronRight
          className={cn(
            VERSION_HISTORY_COLLAPSIBLE_TOKENS.icon,
            isOpen && VERSION_HISTORY_COLLAPSIBLE_TOKENS.iconOpen
          )}
        />
        <History className="h-4 w-4" />
        {t('planDetail.versionHistory.title')}
      </Button>
      {isOpen && (
        <div className={VERSION_HISTORY_COLLAPSIBLE_TOKENS.content}>
          <VersionHistory planUuid={planUuid} currentVersion={currentVersion} />
        </div>
      )}
    </div>
  );
}
