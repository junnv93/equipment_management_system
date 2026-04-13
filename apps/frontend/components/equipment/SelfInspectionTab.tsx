'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { queryKeys } from '@/lib/api/query-config';
import {
  confirmSelfInspection,
  deleteSelfInspection,
  getSelfInspections,
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
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { isConflictError } from '@/lib/api/error';
import { EquipmentErrorCode, getLocalizedErrorInfo } from '@/lib/errors/equipment-errors';
import { ExportFormButton } from '@/components/shared/ExportFormButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SelfInspectionFormDialog = dynamic(
  () => import('@/components/inspections/SelfInspectionFormDialog'),
  { ssr: false }
);

interface SelfInspectionTabProps {
  equipment: Equipment;
}

const JUDGMENT_COLORS: Record<string, string> = {
  pass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  fail: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  na: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

/** 기존 고정 컬럼 fallback 항목 — i18n 키 사용 */
const LEGACY_ITEM_KEYS = ['appearance', 'functionality', 'safety', 'calibrationStatus'] as const;

export function SelfInspectionTab({ equipment }: SelfInspectionTabProps) {
  const t = useTranslations('equipment');
  const tErrors = useTranslations('errors');
  const { fmtDate } = useDateFormatter();
  const { can } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const equipmentId = String(equipment.id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SelfInspection | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<SelfInspection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SelfInspection | null>(null);
  /**
   * 지연 마운트: ResultSectionsPanel 은 펼친 카드에서만 렌더.
   * 기존 무조건 렌더는 N 개 점검 × 1 API 호출(N+1) 을 유발했다.
   * IntermediateInspectionList 의 expandedId 패턴과 동일.
   */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canEdit = can(Permission.CREATE_SELF_INSPECTION);
  const canConfirm = can(Permission.CONFIRM_SELF_INSPECTION);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.equipment.selfInspections(equipmentId),
    queryFn: () => getSelfInspections(equipmentId),
  });

  const inspections = data?.data ?? [];

  const handleConflictError = (_error: Error) => {
    const conflictInfo = getLocalizedErrorInfo(EquipmentErrorCode.VERSION_CONFLICT, tErrors);
    toast({
      title: conflictInfo.title,
      description: conflictInfo.message,
      variant: 'destructive',
    });
    queryClient.removeQueries({ queryKey: queryKeys.equipment.selfInspections(equipmentId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.equipment.selfInspections(equipmentId) });
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.equipment.selfInspections(equipmentId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(equipmentId) });
  };

  const confirmMutation = useMutation({
    mutationFn: (target: SelfInspection) => confirmSelfInspection(target.id, target.version),
    onSuccess: () => {
      toast({ description: t('selfInspection.confirmDialog.success') });
      invalidate();
      setConfirmTarget(null);
    },
    onError: (error: Error) => {
      if (isConflictError(error)) {
        handleConflictError(error);
        setConfirmTarget(null);
        return;
      }
      toast({
        variant: 'destructive',
        description: t('selfInspection.confirmDialog.error'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (target: SelfInspection) => deleteSelfInspection(target.id),
    onSuccess: () => {
      toast({ description: t('selfInspection.deleteDialog.success') });
      invalidate();
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      if (isConflictError(error)) {
        handleConflictError(error);
        setDeleteTarget(null);
        return;
      }
      toast({
        variant: 'destructive',
        description: t('selfInspection.deleteDialog.error'),
      });
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
            {t('selfInspection.title')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-05'].name} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-brand-warning" />
            <p className="text-muted-foreground mt-2 text-sm">{t('selfInspection.error')}</p>
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
            {t('selfInspection.title')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-05'].name} />
          </CardTitle>
          <div className="flex items-center gap-2">
            {inspections.length > 0 && (
              <ExportFormButton
                formNumber="UL-QP-18-05"
                params={{ equipmentId }}
                label={t('selfInspection.actions.exportForm')}
                errorToastDescription={t('selfInspection.actions.exportFormError')}
              />
            )}
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <FileText className="h-4 w-4 mr-1" />
              {t('inspection.createButton')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              {t('selfInspection.empty')}
            </p>
          ) : (
            <div className="space-y-6">
              {inspections.map((inspection) => {
                const items =
                  inspection.items && inspection.items.length > 0
                    ? inspection.items
                    : LEGACY_ITEM_KEYS.map((key, idx) => ({
                        itemNumber: idx + 1,
                        checkItem: t(`selfInspection.${key}`),
                        checkResult: inspection[key],
                      }));

                const isConfirmed = inspection.status === 'confirmed';
                const inspectionDateLabel = fmtDate(inspection.inspectionDate);
                const isExpanded = expandedId === inspection.id;
                return (
                  <div key={inspection.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          aria-label={t('selfInspection.actions.toggleResultSections', {
                            date: inspectionDateLabel,
                          })}
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
                        <Badge className={STATUS_COLORS[inspection.status]}>
                          {t(`selfInspection.statusLabel.${inspection.status}`)}
                        </Badge>
                        <Badge className={JUDGMENT_COLORS[inspection.overallResult]}>
                          {t(`selfInspection.judgment.${inspection.overallResult}`)}
                        </Badge>
                      </div>
                      {!isConfirmed && (canEdit || canConfirm) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label={t('selfInspection.actions.menuAriaLabel', {
                                date: inspectionDateLabel,
                              })}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && (
                              <DropdownMenuItem onClick={() => setEditTarget(inspection)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {t('selfInspection.actions.edit')}
                              </DropdownMenuItem>
                            )}
                            {canConfirm && (
                              <DropdownMenuItem onClick={() => setConfirmTarget(inspection)}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {t('selfInspection.actions.confirm')}
                              </DropdownMenuItem>
                            )}
                            {canEdit && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(inspection)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('selfInspection.actions.delete')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">{t('selfInspection.itemNumber')}</TableHead>
                          <TableHead>{t('selfInspection.checkItem')}</TableHead>
                          <TableHead className="w-24">{t('selfInspection.checkResult')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={`${inspection.id}-${item.itemNumber}`}>
                            <TableCell>{item.itemNumber}</TableCell>
                            <TableCell>{item.checkItem}</TableCell>
                            <TableCell>
                              <Badge className={JUDGMENT_COLORS[item.checkResult]}>
                                {t(`selfInspection.judgment.${item.checkResult}`)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {inspection.remarks && (
                      <p className="text-muted-foreground text-sm">
                        <span className="font-medium">{t('selfInspection.remarks')}:</span>{' '}
                        {inspection.remarks}
                      </p>
                    )}

                    {isExpanded && (
                      <ResultSectionsPanel
                        inspectionId={inspection.id}
                        inspectionType="self"
                        canEdit={can(Permission.CREATE_SELF_INSPECTION)}
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
        />
      )}

      {editTarget && (
        <SelfInspectionFormDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          equipmentId={equipmentId}
          initialData={editTarget}
        />
      )}

      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('selfInspection.confirmDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('selfInspection.confirmDialog.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('selfInspection.confirmDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (confirmTarget) confirmMutation.mutate(confirmTarget);
              }}
            >
              {t('selfInspection.confirmDialog.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('selfInspection.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('selfInspection.deleteDialog.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('selfInspection.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget);
              }}
            >
              {t('selfInspection.deleteDialog.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
