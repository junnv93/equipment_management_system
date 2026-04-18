'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { queryKeys } from '@/lib/api/query-config';
import {
  approveSelfInspection,
  deleteSelfInspection,
  getSelfInspections,
  rejectSelfInspection,
  resubmitSelfInspection,
  submitSelfInspection,
  withdrawSelfInspection,
  type SelfInspection,
} from '@/lib/api/self-inspection-api';
import type { Equipment } from '@/lib/api/equipment-api';
import ResultSectionsPanel from '@/components/inspections/result-sections/ResultSectionsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormNumberBadge } from '@/components/form-templates/FormNumberBadge';
import { FORM_CATALOG, Permission } from '@equipment-management/shared-constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  SendHorizontal,
  Trash2,
  Undo2,
  XCircle,
} from 'lucide-react';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useAuth } from '@/hooks/use-auth';
import { isConflictError } from '@/lib/api/error';
import { ExportFormButton } from '@/components/shared/ExportFormButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getJudgmentBadgeClasses,
  getSemanticBadgeClasses,
  type SemanticColorKey,
} from '@/lib/design-tokens';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import type { SelfInspectionStatus } from '@equipment-management/schemas';

const SelfInspectionFormDialog = dynamic(
  () => import('@/components/inspections/SelfInspectionFormDialog'),
  { ssr: false }
);

interface SelfInspectionTabProps {
  equipment: Equipment;
}

/** 자체점검 결재 상태 → 시멘틱 색상 매핑 */
const STATUS_SEMANTIC_MAP: Record<string, SemanticColorKey> = {
  draft: 'neutral',
  submitted: 'info',
  approved: 'ok',
  rejected: 'critical',
};

/** 기존 고정 컬럼 fallback 항목 — i18n 키 사용 */
const LEGACY_ITEM_KEYS = ['appearance', 'functionality', 'safety', 'calibrationStatus'] as const;

type SelfInspectionCache = { data: SelfInspection[]; total: number };

export function SelfInspectionTab({ equipment }: SelfInspectionTabProps) {
  const t = useTranslations('equipment');
  const { fmtDate } = useDateFormatter();
  const { can, user } = useAuth();
  const equipmentId = String(equipment.id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SelfInspection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SelfInspection | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SelfInspection | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canSubmit = can(Permission.SUBMIT_SELF_INSPECTION);
  const canWithdraw = can(Permission.WITHDRAW_SELF_INSPECTION);
  const canApprove = can(Permission.APPROVE_SELF_INSPECTION);
  const canReject = can(Permission.REJECT_SELF_INSPECTION);
  const canDelete = can(Permission.DELETE_SELF_INSPECTION);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.equipment.selfInspections(equipmentId),
    queryFn: () => getSelfInspections(equipmentId),
  });

  const inspections = data?.data ?? [];

  // 짧은 alias (코드 가독성)
  const tSI = (key: string) => t(`selfInspection.${key}` as Parameters<typeof t>[0]);

  const primaryQueryKey = queryKeys.equipment.selfInspections(equipmentId);
  const crossInvalidateKeys = [queryKeys.equipment.detail(equipmentId)] as const;

  // 승인 상태 전이를 위한 optimistic update 헬퍼
  const makeStatusUpdate =
    (targetStatus: SelfInspectionStatus) =>
    (
      old: SelfInspectionCache | undefined,
      { id }: { id: string; version: number }
    ): SelfInspectionCache => ({
      data: (old?.data ?? []).map((item) =>
        item.id === id ? { ...item, approvalStatus: targetStatus } : item
      ),
      total: old?.total ?? 0,
    });

  const submitMutation = useOptimisticMutation<
    SelfInspection,
    { id: string; version: number },
    SelfInspectionCache
  >({
    mutationFn: ({ id, version }) => submitSelfInspection(id, version),
    queryKey: primaryQueryKey,
    optimisticUpdate: makeStatusUpdate('submitted'),
    invalidateKeys: crossInvalidateKeys,
    successMessage: tSI('toast.submitSuccess'),
    errorMessage: tSI('toast.submitError'),
  });

  const withdrawMutation = useOptimisticMutation<
    SelfInspection,
    { id: string; version: number },
    SelfInspectionCache
  >({
    mutationFn: ({ id, version }) => withdrawSelfInspection(id, version),
    queryKey: primaryQueryKey,
    optimisticUpdate: makeStatusUpdate('draft'),
    invalidateKeys: crossInvalidateKeys,
    successMessage: tSI('toast.withdrawSuccess'),
    errorMessage: tSI('toast.withdrawError'),
  });

  const approveMutation = useOptimisticMutation<
    SelfInspection,
    { id: string; version: number },
    SelfInspectionCache
  >({
    mutationFn: ({ id, version }) => approveSelfInspection(id, version),
    queryKey: primaryQueryKey,
    optimisticUpdate: makeStatusUpdate('approved'),
    invalidateKeys: crossInvalidateKeys,
    successMessage: tSI('toast.approveSuccess'),
    errorMessage: tSI('toast.approveError'),
  });

  const rejectMutation = useOptimisticMutation<
    SelfInspection,
    { id: string; version: number; reason: string },
    SelfInspectionCache
  >({
    mutationFn: ({ id, version, reason }) => rejectSelfInspection(id, version, reason),
    queryKey: primaryQueryKey,
    optimisticUpdate: (old, { id, reason }) => ({
      data: (old?.data ?? []).map((item) =>
        item.id === id
          ? { ...item, approvalStatus: 'rejected' as const, rejectionReason: reason }
          : item
      ),
      total: old?.total ?? 0,
    }),
    invalidateKeys: crossInvalidateKeys,
    successMessage: tSI('toast.rejectSuccess'),
    errorMessage: tSI('toast.rejectError'),
    onSuccessCallback: () => {
      setRejectTarget(null);
      setRejectReason('');
    },
    onErrorCallback: (error) => {
      if (isConflictError(error)) setRejectTarget(null);
    },
  });

  const resubmitMutation = useOptimisticMutation<
    SelfInspection,
    { id: string; version: number },
    SelfInspectionCache
  >({
    mutationFn: ({ id, version }) => resubmitSelfInspection(id, version),
    queryKey: primaryQueryKey,
    optimisticUpdate: makeStatusUpdate('draft'),
    invalidateKeys: crossInvalidateKeys,
    successMessage: tSI('toast.resubmitSuccess'),
    errorMessage: tSI('toast.resubmitError'),
  });

  const deleteMutation = useOptimisticMutation<void, { id: string }, SelfInspectionCache>({
    mutationFn: ({ id }) => deleteSelfInspection(id),
    queryKey: primaryQueryKey,
    optimisticUpdate: (old, { id }) => ({
      data: (old?.data ?? []).filter((item) => item.id !== id),
      total: (old?.total ?? 1) - 1,
    }),
    invalidateKeys: crossInvalidateKeys,
    successMessage: tSI('toast.deleteSuccess'),
    errorMessage: tSI('toast.deleteError'),
    onSuccessCallback: () => setDeleteTarget(null),
    onErrorCallback: (error) => {
      if (isConflictError(error)) setDeleteTarget(null);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tSI('title')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-05'].name} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-brand-warning" />
            <p className="text-muted-foreground mt-2 text-sm">{tSI('error')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {tSI('title')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-05'].name} />
          </CardTitle>
          {canSubmit && (
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <FileText className="h-4 w-4 mr-1" />
              {t('inspection.createButton')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">{tSI('empty')}</p>
          ) : (
            <div className="space-y-6">
              {inspections.map((inspection) => {
                const approvalStatus = inspection.approvalStatus;
                const items =
                  inspection.items && inspection.items.length > 0
                    ? inspection.items
                    : LEGACY_ITEM_KEYS.map((key, idx) => ({
                        itemNumber: idx + 1,
                        checkItem: t(`selfInspection.${key}` as Parameters<typeof t>[0]),
                        checkResult: inspection[key],
                      }));

                const inspectionDateLabel = fmtDate(inspection.inspectionDate);
                const isExpanded = expandedId === inspection.id;
                const isSubmitter = inspection.submittedBy === user?.id;

                // 상태별 사용 가능한 액션
                const canDoEdit = canSubmit && approvalStatus === 'draft';
                const canDoSubmit = canSubmit && approvalStatus === 'draft';
                const canDoWithdraw = canWithdraw && approvalStatus === 'submitted' && isSubmitter;
                const canDoApprove = canApprove && approvalStatus === 'submitted';
                const canDoReject = canReject && approvalStatus === 'submitted';
                const canDoResubmit = canSubmit && approvalStatus === 'rejected';
                const canDoResubmitEdit = canSubmit && approvalStatus === 'rejected';
                const canDoDelete = canDelete && approvalStatus !== 'approved';
                const showMenu =
                  canDoEdit ||
                  canDoSubmit ||
                  canDoWithdraw ||
                  canDoApprove ||
                  canDoReject ||
                  canDoResubmit ||
                  canDoDelete;

                return (
                  <div key={inspection.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          aria-label={tSI('actions.toggleResultSections').replace(
                            '{date}',
                            inspectionDateLabel
                          )}
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedId(isExpanded ? null : inspection.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <span className="font-medium">{inspectionDateLabel}</span>
                        <Badge
                          className={getSemanticBadgeClasses(
                            STATUS_SEMANTIC_MAP[approvalStatus] ?? 'neutral'
                          )}
                        >
                          {tSI(`statusLabel.${approvalStatus}`)}
                        </Badge>
                        <Badge className={getJudgmentBadgeClasses(inspection.overallResult)}>
                          {tSI(`judgment.${inspection.overallResult}`)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* approved 상태에서만 양식 내보내기 */}
                        {approvalStatus === 'approved' && (
                          <ExportFormButton
                            formNumber="UL-QP-18-05"
                            params={{ equipmentId, inspectionId: inspection.id }}
                            label={tSI('actions.exportForm')}
                            errorToastDescription={tSI('actions.exportFormError')}
                          />
                        )}
                        {showMenu && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                aria-label={tSI('actions.menuAriaLabel').replace(
                                  '{date}',
                                  inspectionDateLabel
                                )}
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canDoEdit && (
                                <DropdownMenuItem onClick={() => setEditTarget(inspection)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  {tSI('actions.edit')}
                                </DropdownMenuItem>
                              )}
                              {canDoResubmitEdit && approvalStatus === 'rejected' && (
                                <DropdownMenuItem onClick={() => setEditTarget(inspection)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  {tSI('actions.edit')}
                                </DropdownMenuItem>
                              )}
                              {canDoSubmit && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    submitMutation.mutate({
                                      id: inspection.id,
                                      version: inspection.version,
                                    })
                                  }
                                  disabled={submitMutation.isPending}
                                >
                                  <SendHorizontal className="h-4 w-4 mr-2" />
                                  {tSI('actions.submit')}
                                </DropdownMenuItem>
                              )}
                              {canDoWithdraw && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    withdrawMutation.mutate({
                                      id: inspection.id,
                                      version: inspection.version,
                                    })
                                  }
                                  disabled={withdrawMutation.isPending}
                                >
                                  <Undo2 className="h-4 w-4 mr-2" />
                                  {tSI('actions.withdraw')}
                                </DropdownMenuItem>
                              )}
                              {canDoApprove && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    approveMutation.mutate({
                                      id: inspection.id,
                                      version: inspection.version,
                                    })
                                  }
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  {tSI('actions.approve')}
                                </DropdownMenuItem>
                              )}
                              {canDoReject && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRejectTarget(inspection);
                                    setRejectReason('');
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {tSI('actions.reject')}
                                </DropdownMenuItem>
                              )}
                              {canDoResubmit && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    resubmitMutation.mutate({
                                      id: inspection.id,
                                      version: inspection.version,
                                    })
                                  }
                                  disabled={resubmitMutation.isPending}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  {tSI('actions.resubmit')}
                                </DropdownMenuItem>
                              )}
                              {canDoDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeleteTarget(inspection)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {tSI('actions.delete')}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    {/* 반려 사유 표시 */}
                    {approvalStatus === 'rejected' && inspection.rejectionReason && (
                      <div className="bg-destructive/10 rounded p-2 text-sm text-destructive">
                        <span className="font-medium">{tSI('rejectDialog.reasonLabel')}:</span>{' '}
                        {inspection.rejectionReason}
                      </div>
                    )}

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">{tSI('itemNumber')}</TableHead>
                          <TableHead>{tSI('checkItem')}</TableHead>
                          <TableHead className="w-24">{tSI('checkResult')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={`${inspection.id}-${item.itemNumber}`}>
                            <TableCell>{item.itemNumber}</TableCell>
                            <TableCell>{item.checkItem}</TableCell>
                            <TableCell>
                              <Badge className={getJudgmentBadgeClasses(item.checkResult)}>
                                {tSI(`judgment.${item.checkResult}`)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {inspection.remarks && (
                      <p className="text-muted-foreground text-sm">
                        <span className="font-medium">{tSI('remarks')}:</span> {inspection.remarks}
                      </p>
                    )}

                    {/* 기타 특기사항 (QP-18-05 섹션 3) */}
                    {Array.isArray(inspection.specialNotes) &&
                      inspection.specialNotes.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{tSI('specialNotes.label')}</p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
                            {inspection.specialNotes.map((note, i) => (
                              <li key={i}>
                                {note.content}
                                {note.date && <span className="ml-2 text-xs">({note.date})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {isExpanded && (
                      <ResultSectionsPanel
                        inspectionId={inspection.id}
                        inspectionType="self"
                        canEdit={canSubmit && approvalStatus === 'draft'}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <SelfInspectionFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          equipmentId={equipmentId}
          equipment={equipment}
        />
      )}

      {editTarget && (
        <SelfInspectionFormDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          equipmentId={equipmentId}
          equipment={equipment}
          initialData={editTarget}
        />
      )}

      {/* 반려 다이얼로그 (rejectionReason 입력) */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tSI('rejectDialog.title')}</DialogTitle>
            <DialogDescription>{tSI('rejectDialog.message')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">{tSI('rejectDialog.reasonLabel')}</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={tSI('rejectDialog.reasonPlaceholder')}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason('');
              }}
            >
              {tSI('rejectDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => {
                if (rejectTarget)
                  rejectMutation.mutate({
                    id: rejectTarget.id,
                    version: rejectTarget.version,
                    reason: rejectReason,
                  });
              }}
            >
              {tSI('rejectDialog.action')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tSI('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{tSI('deleteDialog.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tSI('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate({ id: deleteTarget.id });
              }}
            >
              {tSI('deleteDialog.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
