'use client';

import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { FileText, Send, CheckCircle, XCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormNumberBadge } from '@/components/form-templates/FormNumberBadge';
import { FORM_CATALOG } from '@equipment-management/shared-constants';
import { ExportFormButton } from '@/components/shared/ExportFormButton';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import ResultSectionsPanel from '@/components/inspections/result-sections/ResultSectionsPanel';

const InspectionFormDialog = dynamic(
  () => import('@/components/inspections/InspectionFormDialog'),
  { ssr: false }
);

function getStatusBadgeVariant(
  status: InspectionApprovalStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'approved':
      return 'default';
    case 'submitted':
    case 'reviewed':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
}

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
  const { can } = useAuth();

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

  const isPending =
    submitMutation.isPending ||
    reviewMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending;

  const renderActions = (inspection: IntermediateInspection) => {
    const { id, version, approvalStatus } = inspection;
    const inspectionDateLabel = format(new Date(inspection.inspectionDate), 'yyyy-MM-dd');

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

    return (
      <div className="flex items-center gap-1">
        {approvalStatus === 'draft' && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            aria-label={t('intermediateInspection.actions.submitAriaLabel', {
              date: inspectionDateLabel,
            })}
            onClick={() => submitMutation.mutate({ id, version })}
          >
            <Send className="h-3 w-3 mr-1" />
            {t('intermediateInspection.actions.submit')}
          </Button>
        )}
        {approvalStatus === 'submitted' && (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              aria-label={t('intermediateInspection.actions.reviewAriaLabel', {
                date: inspectionDateLabel,
              })}
              onClick={() => reviewMutation.mutate({ id, version })}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {t('intermediateInspection.actions.review')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              aria-label={t('intermediateInspection.actions.rejectAriaLabel', {
                date: inspectionDateLabel,
              })}
              onClick={() => setRejectingId(id)}
            >
              <XCircle className="h-3 w-3 mr-1" />
              {t('intermediateInspection.actions.reject')}
            </Button>
          </>
        )}
        {approvalStatus === 'reviewed' && (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              aria-label={t('intermediateInspection.actions.approveAriaLabel', {
                date: inspectionDateLabel,
              })}
              onClick={() => approveMutation.mutate({ id, version })}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {t('intermediateInspection.actions.approve')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              aria-label={t('intermediateInspection.actions.rejectAriaLabel', {
                date: inspectionDateLabel,
              })}
              onClick={() => setRejectingId(id)}
            >
              <XCircle className="h-3 w-3 mr-1" />
              {t('intermediateInspection.actions.reject')}
            </Button>
          </>
        )}
        {approvalStatus === 'approved' && (
          <ExportFormButton
            formNumber="UL-QP-18-03"
            params={{ inspectionId: id }}
            label={t('intermediateInspection.actions.exportForm')}
            errorToastDescription={t('intermediateInspection.actions.exportFormError')}
          />
        )}
      </div>
    );
  };

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
            <p className="text-muted-foreground text-sm py-8 text-center">
              {t('intermediateInspection.noRecords')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('intermediateInspection.inspectionDate')}</TableHead>
                  <TableHead>{t('intermediateInspection.overallResult')}</TableHead>
                  <TableHead>{t('content.intermediateChecks.table.status')}</TableHead>
                  <TableHead className="text-right">
                    {t('content.intermediateChecks.table.action')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((inspection) => (
                  <Fragment key={inspection.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === inspection.id ? null : inspection.id)
                      }
                    >
                      <TableCell className="tabular-nums">
                        <span className="mr-1 inline-block w-4">
                          {expandedId === inspection.id ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </span>
                        {format(new Date(inspection.inspectionDate), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell>
                        {inspection.overallResult ? (
                          <Badge variant="outline">
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
                        <Badge variant={getStatusBadgeVariant(inspection.approvalStatus)}>
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
                            canEdit={can(Permission.UPDATE_CALIBRATION)}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
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
