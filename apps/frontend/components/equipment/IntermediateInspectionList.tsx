'use client';

import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Undo2,
  Trash2,
  MoreHorizontal,
  Download,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormNumberBadge } from '@/components/form-templates/FormNumberBadge';
import { FORM_CATALOG } from '@equipment-management/shared-constants';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { exportFormTemplate } from '@/lib/api/reports-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import calibrationApi from '@/lib/api/calibration-api';
import type { IntermediateInspection } from '@/lib/api/calibration-api';
import type { Equipment } from '@/lib/api/equipment-api';
import type { InspectionApprovalStatus } from '@equipment-management/schemas';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Permission } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  INSPECTION_EMPTY_STATE,
  INSPECTION_SPACING,
  INSPECTION_TABLE,
  INSPECTION_FOCUS,
  getResultBadgeClasses,
  getSemanticBadgeClasses,
  getSemanticLeftBorderClasses,
  type SemanticColorKey,
} from '@/lib/design-tokens';
import ResultSectionsPanel from '@/components/inspections/result-sections/ResultSectionsPanel';

const InspectionFormDialog = dynamic(
  () => import('@/components/inspections/InspectionFormDialog'),
  { ssr: false }
);

/** 승인 상태 → 시멘틱 색상 키 매핑 */
const APPROVAL_SEMANTIC_MAP: Record<InspectionApprovalStatus, SemanticColorKey> = {
  draft: 'neutral',
  submitted: 'info',
  reviewed: 'purple',
  approved: 'ok',
  rejected: 'critical',
};

interface IntermediateInspectionListProps {
  equipment: Equipment;
}

export function IntermediateInspectionList({ equipment }: IntermediateInspectionListProps) {
  const t = useTranslations('calibration');
  const tEquip = useTranslations('equipment');
  const equipmentId = String(equipment.id);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { can, user } = useAuth();
  const { toast } = useToast();

  const primaryQueryKey = queryKeys.equipment.intermediateInspections(equipmentId);
  const crossInvalidateKeys = [
    queryKeys.calibrations.all,
    queryKeys.equipment.detail(equipmentId),
  ] as const;

  const {
    data: inspections,
    isLoading,
    isError,
  } = useQuery({
    queryKey: primaryQueryKey,
    queryFn: () => calibrationApi.intermediateInspections.listByEquipment(equipmentId),
    ...QUERY_CONFIG.CALIBRATION_LIST,
  });

  // 승인 상태 전이를 위한 optimistic update 헬퍼
  const makeStatusUpdate = (targetStatus: InspectionApprovalStatus) => {
    return (
      old: IntermediateInspection[] | undefined,
      { id }: { id: string; version: number }
    ): IntermediateInspection[] =>
      (old ?? []).map((item) =>
        item.id === id ? { ...item, approvalStatus: targetStatus } : item
      );
  };

  const submitMutation = useOptimisticMutation<
    IntermediateInspection,
    { id: string; version: number },
    IntermediateInspection[]
  >({
    mutationFn: ({ id, version }) => calibrationApi.intermediateInspections.submit(id, version),
    queryKey: primaryQueryKey,
    optimisticUpdate: makeStatusUpdate('submitted'),
    invalidateKeys: crossInvalidateKeys,
    successMessage: t('intermediateInspection.toasts.submitSuccess'),
    errorMessage: t('intermediateInspection.toasts.submitError'),
  });

  const reviewMutation = useOptimisticMutation<
    IntermediateInspection,
    { id: string; version: number },
    IntermediateInspection[]
  >({
    mutationFn: ({ id, version }) => calibrationApi.intermediateInspections.review(id, version),
    queryKey: primaryQueryKey,
    optimisticUpdate: makeStatusUpdate('reviewed'),
    invalidateKeys: crossInvalidateKeys,
    successMessage: t('intermediateInspection.toasts.reviewSuccess'),
    errorMessage: t('intermediateInspection.toasts.reviewError'),
  });

  const approveMutation = useOptimisticMutation<
    IntermediateInspection,
    { id: string; version: number },
    IntermediateInspection[]
  >({
    mutationFn: ({ id, version }) => calibrationApi.intermediateInspections.approve(id, version),
    queryKey: primaryQueryKey,
    optimisticUpdate: makeStatusUpdate('approved'),
    invalidateKeys: crossInvalidateKeys,
    successMessage: t('intermediateInspection.toasts.approveSuccess'),
    errorMessage: t('intermediateInspection.toasts.approveError'),
  });

  const rejectMutation = useOptimisticMutation<
    IntermediateInspection,
    { id: string; version: number; reason: string },
    IntermediateInspection[]
  >({
    mutationFn: ({ id, version, reason }) =>
      calibrationApi.intermediateInspections.reject(id, version, reason),
    queryKey: primaryQueryKey,
    optimisticUpdate: (old, { id }) =>
      (old ?? []).map((item) =>
        item.id === id ? { ...item, approvalStatus: 'rejected' as const } : item
      ),
    invalidateKeys: crossInvalidateKeys,
    successMessage: t('intermediateInspection.toasts.rejectSuccess'),
    errorMessage: t('intermediateInspection.toasts.rejectError'),
    onSuccessCallback: () => {
      setRejectingId(null);
      setRejectionReason('');
    },
  });

  const withdrawMutation = useOptimisticMutation<
    IntermediateInspection,
    { id: string; version: number },
    IntermediateInspection[]
  >({
    mutationFn: ({ id, version }) => calibrationApi.intermediateInspections.withdraw(id, version),
    queryKey: primaryQueryKey,
    optimisticUpdate: makeStatusUpdate('draft'),
    invalidateKeys: crossInvalidateKeys,
    successMessage: t('intermediateInspection.toasts.withdrawSuccess'),
    errorMessage: t('intermediateInspection.toasts.withdrawError'),
  });

  const resubmitMutation = useOptimisticMutation<
    IntermediateInspection,
    { id: string; version: number },
    IntermediateInspection[]
  >({
    mutationFn: ({ id, version }) => calibrationApi.intermediateInspections.resubmit(id, version),
    queryKey: primaryQueryKey,
    optimisticUpdate: makeStatusUpdate('draft'),
    invalidateKeys: crossInvalidateKeys,
    successMessage: t('intermediateInspection.toasts.resubmitSuccess'),
    errorMessage: t('intermediateInspection.toasts.resubmitError'),
  });

  const deleteMutation = useOptimisticMutation<
    { success: boolean },
    { id: string },
    IntermediateInspection[]
  >({
    mutationFn: ({ id }) => calibrationApi.intermediateInspections.delete(id),
    queryKey: primaryQueryKey,
    optimisticUpdate: (old, { id }) => (old ?? []).filter((item) => item.id !== id),
    invalidateKeys: crossInvalidateKeys,
    successMessage: t('intermediateInspection.toasts.deleteSuccess'),
    errorMessage: t('intermediateInspection.toasts.deleteError'),
  });

  const isPending =
    submitMutation.isPending ||
    reviewMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    withdrawMutation.isPending ||
    resubmitMutation.isPending ||
    deleteMutation.isPending;

  const canSubmit = can(Permission.SUBMIT_INTERMEDIATE_INSPECTION);
  const canWithdraw = can(Permission.WITHDRAW_INTERMEDIATE_INSPECTION);
  const canReview = can(Permission.REVIEW_INTERMEDIATE_INSPECTION);
  const canApprove = can(Permission.APPROVE_INTERMEDIATE_INSPECTION);
  const canReject = can(Permission.REJECT_INTERMEDIATE_INSPECTION);
  const canDelete = can(Permission.DELETE_INTERMEDIATE_INSPECTION);

  const canExport = can(Permission.EXPORT_REPORTS);

  const handleExport = async (inspectionId: string) => {
    try {
      await exportFormTemplate('UL-QP-18-03', { inspectionId });
    } catch {
      toast({
        variant: 'destructive',
        description: t('intermediateInspection.actions.exportFormError'),
      });
    }
  };

  const renderActions = (inspection: IntermediateInspection) => {
    const { id, version, approvalStatus } = inspection;
    const inspectionDateLabel = format(new Date(inspection.inspectionDate), 'yyyy-MM-dd');

    // 반려 사유 입력 모드 — 인라인 표시
    if (rejectingId === id) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder={t('intermediateInspection.rejectionReasonPlaceholder')}
            className="h-8 text-xs w-40"
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={!rejectionReason || isPending}
            onClick={() => rejectMutation.mutate({ id, version, reason: rejectionReason })}
          >
            <XCircle className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setRejectingId(null);
              setRejectionReason('');
            }}
          >
            {t('intermediateInspection.cancel')}
          </Button>
        </div>
      );
    }

    // 삭제 가시성: 시험실무자(draft/submitted/rejected), 기술책임자(모든 상태)
    const showDelete =
      canDelete &&
      (canReview ||
        approvalStatus === 'draft' ||
        approvalStatus === 'submitted' ||
        approvalStatus === 'rejected');

    // 메뉴 아이템 수집
    const items: Array<{
      key: string;
      icon: React.ReactNode;
      label: string;
      onClick: () => void;
      destructive?: boolean;
    }> = [];

    if (approvalStatus === 'draft' && canSubmit) {
      items.push({
        key: 'submit',
        icon: <Send className="h-4 w-4 mr-2" />,
        label: t('intermediateInspection.actions.submit'),
        onClick: () => submitMutation.mutate({ id, version }),
      });
    }
    if (approvalStatus === 'submitted' && canWithdraw && inspection.submittedBy === user?.id) {
      items.push({
        key: 'withdraw',
        icon: <Undo2 className="h-4 w-4 mr-2" />,
        label: t('intermediateInspection.actions.withdraw'),
        onClick: () => withdrawMutation.mutate({ id, version }),
      });
    }
    if (approvalStatus === 'submitted' && canReview) {
      items.push({
        key: 'review',
        icon: <CheckCircle className="h-4 w-4 mr-2" />,
        label: t('intermediateInspection.actions.review'),
        onClick: () => reviewMutation.mutate({ id, version }),
      });
    }
    if ((approvalStatus === 'submitted' || approvalStatus === 'reviewed') && canReject) {
      items.push({
        key: 'reject',
        icon: <XCircle className="h-4 w-4 mr-2" />,
        label: t('intermediateInspection.actions.reject'),
        onClick: () => setRejectingId(id),
      });
    }
    if (approvalStatus === 'reviewed' && canApprove) {
      items.push({
        key: 'approve',
        icon: <CheckCircle className="h-4 w-4 mr-2" />,
        label: t('intermediateInspection.actions.approve'),
        onClick: () => approveMutation.mutate({ id, version }),
      });
    }
    if (approvalStatus === 'rejected' && canSubmit) {
      items.push({
        key: 'resubmit',
        icon: <Undo2 className="h-4 w-4 mr-2" />,
        label: t('intermediateInspection.actions.resubmit'),
        onClick: () => resubmitMutation.mutate({ id, version }),
      });
    }
    if (approvalStatus === 'approved' && canExport) {
      items.push({
        key: 'export',
        icon: <Download className="h-4 w-4 mr-2" />,
        label: t('intermediateInspection.actions.exportForm'),
        onClick: () => handleExport(id),
      });
    }
    if (showDelete) {
      items.push({
        key: 'delete',
        icon: <Trash2 className="h-4 w-4 mr-2" />,
        label: t('intermediateInspection.actions.delete'),
        onClick: () => deleteMutation.mutate({ id }),
        destructive: true,
      });
    }

    if (items.length === 0) return null;

    const destructiveItems = items.filter((i) => i.destructive);
    const normalItems = items.filter((i) => !i.destructive);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isPending}
            aria-label={t('intermediateInspection.actions.menuAriaLabel', {
              date: inspectionDateLabel,
            })}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {normalItems.map((item) => (
            <DropdownMenuItem key={item.key} onClick={item.onClick} disabled={isPending}>
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ))}
          {destructiveItems.length > 0 && normalItems.length > 0 && <DropdownMenuSeparator />}
          {destructiveItems.map((item) => (
            <DropdownMenuItem
              key={item.key}
              onClick={item.onClick}
              disabled={isPending}
              className="text-destructive focus:text-destructive"
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className={cn('p-6', INSPECTION_SPACING.field)}>
          <Skeleton className="h-8 w-1/3" />
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
            {tEquip('inspection.intermediateTitle')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-03'].name} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            {t('intermediateInspection.loadError')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {tEquip('inspection.intermediateTitle')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-03'].name} />
          </CardTitle>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <FileText className="h-4 w-4 mr-1" />
            {tEquip('inspection.createButton')}
          </Button>
        </CardHeader>
        <CardContent>
          {!inspections?.length ? (
            <div className={INSPECTION_EMPTY_STATE.container}>
              <ClipboardList className={INSPECTION_EMPTY_STATE.icon} aria-hidden="true" />
              <p className={INSPECTION_EMPTY_STATE.title}>
                {t('intermediateInspection.noRecords')}
              </p>
              <p className={INSPECTION_EMPTY_STATE.description}>
                {tEquip('inspection.emptyDescription')}
              </p>
            </div>
          ) : (
            <div className={INSPECTION_TABLE.wrapper}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background z-10">
                      {t('intermediateInspection.inspectionDate')}
                    </TableHead>
                    <TableHead className="sticky top-0 bg-background z-10">
                      {t('intermediateInspection.overallResult')}
                    </TableHead>
                    <TableHead className="sticky top-0 bg-background z-10">
                      {t('content.intermediateChecks.table.status')}
                    </TableHead>
                    <TableHead className="sticky top-0 bg-background z-10 text-right">
                      {t('content.intermediateChecks.table.action')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((inspection) => {
                    const semanticColor = APPROVAL_SEMANTIC_MAP[inspection.approvalStatus];
                    return (
                      <Fragment key={inspection.id}>
                        <TableRow
                          className={cn(
                            'cursor-pointer',
                            INSPECTION_TABLE.stripe,
                            INSPECTION_TABLE.rowHover,
                            `border-l-2 ${getSemanticLeftBorderClasses(semanticColor)}`,
                            INSPECTION_FOCUS
                          )}
                          tabIndex={0}
                          onClick={() =>
                            setExpandedId(expandedId === inspection.id ? null : inspection.id)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setExpandedId(expandedId === inspection.id ? null : inspection.id);
                            }
                          }}
                        >
                          <TableCell className={INSPECTION_TABLE.numericCell}>
                            <span className="mr-1 inline-block w-4">
                              {expandedId === inspection.id ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              <span className="sr-only">
                                {expandedId === inspection.id
                                  ? tEquip('inspection.collapse')
                                  : tEquip('inspection.expand')}
                              </span>
                            </span>
                            {format(new Date(inspection.inspectionDate), 'yyyy-MM-dd')}
                          </TableCell>
                          <TableCell>
                            {inspection.overallResult ? (
                              <Badge className={getResultBadgeClasses(inspection.overallResult)}>
                                {t(
                                  `intermediateInspection.resultOptions.${inspection.overallResult}` as Parameters<
                                    typeof t
                                  >[0]
                                )}
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getSemanticBadgeClasses(semanticColor)}>
                              {t(
                                `intermediateInspection.status.${inspection.approvalStatus}` as Parameters<
                                  typeof t
                                >[0]
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            {renderActions(inspection)}
                          </TableCell>
                        </TableRow>
                        {expandedId === inspection.id && (
                          <TableRow key={`${inspection.id}-sections`}>
                            <TableCell colSpan={4} className="bg-muted/30 p-4">
                              <ResultSectionsPanel
                                inspectionId={inspection.id}
                                inspectionType="intermediate"
                                canEdit={canSubmit}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <InspectionFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          equipmentId={equipmentId}
          equipmentName={equipment.name}
        />
      )}
    </>
  );
}
