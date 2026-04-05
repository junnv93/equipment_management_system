'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Send, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import calibrationApi from '@/lib/api/calibration-api';
import type { IntermediateInspection } from '@/lib/api/calibration-api';
import type { InspectionApprovalStatus } from '@equipment-management/schemas';
import { format } from 'date-fns';

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

interface InspectionRecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calibrationId: string;
  equipmentName?: string;
  onCreateNew: () => void;
}

export default function InspectionRecordsDialog({
  open,
  onOpenChange,
  calibrationId,
  equipmentName,
  onCreateNew,
}: InspectionRecordsDialogProps) {
  const t = useTranslations('calibration');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { data: inspections, isLoading } = useQuery({
    queryKey: queryKeys.intermediateInspections.byCalibration(calibrationId),
    queryFn: () => calibrationApi.intermediateInspections.list(calibrationId),
    ...QUERY_CONFIG.CALIBRATION_LIST,
    enabled: open,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.intermediateInspections.byCalibration(calibrationId),
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.calibrations.all });
  };

  const submitMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      calibrationApi.intermediateInspections.submit(id, version),
    onSuccess: () => {
      toast({ description: t('intermediateInspection.toasts.submitSuccess') });
      invalidateAll();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('intermediateInspection.toasts.submitError'),
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      calibrationApi.intermediateInspections.review(id, version),
    onSuccess: () => {
      toast({ description: t('intermediateInspection.toasts.reviewSuccess') });
      invalidateAll();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('intermediateInspection.toasts.reviewError'),
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      calibrationApi.intermediateInspections.approve(id, version),
    onSuccess: () => {
      toast({ description: t('intermediateInspection.toasts.approveSuccess') });
      invalidateAll();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('intermediateInspection.toasts.approveError'),
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, version, reason }: { id: string; version: number; reason: string }) =>
      calibrationApi.intermediateInspections.reject(id, version, reason),
    onSuccess: () => {
      toast({ description: t('intermediateInspection.toasts.rejectSuccess') });
      setRejectingId(null);
      setRejectionReason('');
      invalidateAll();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('intermediateInspection.toasts.rejectError'),
      });
    },
  });

  const isPending =
    submitMutation.isPending ||
    reviewMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending;

  const renderActions = (inspection: IntermediateInspection) => {
    const { id, version, approvalStatus } = inspection;

    if (rejectingId === id) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="반려 사유"
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
              onClick={() => reviewMutation.mutate({ id, version })}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {t('intermediateInspection.actions.review')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
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
              onClick={() => approveMutation.mutate({ id, version })}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {t('intermediateInspection.actions.approve')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() => setRejectingId(id)}
            >
              <XCircle className="h-3 w-3 mr-1" />
              {t('intermediateInspection.actions.reject')}
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('intermediateInspection.records')}</DialogTitle>
          <DialogDescription>
            {equipmentName || calibrationId.substring(0, 8) + '...'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-2">
          <Button size="sm" onClick={onCreateNew}>
            <FileText className="h-4 w-4 mr-1" />
            {t('intermediateInspection.createButton')}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">{t('content.loading')}</p>
          </div>
        ) : !inspections?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('intermediateInspection.noRecords')}
          </div>
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
                <TableRow key={inspection.id}>
                  <TableCell className="tabular-nums">
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
                  <TableCell className="text-right">{renderActions(inspection)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
