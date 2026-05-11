'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, FileEdit, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { ValidationListEmptyState } from '@/components/software/SoftwareEmptyState';
import {
  softwareValidationApi,
  type SoftwareValidation,
  type CreateSoftwareValidationDto,
} from '@/lib/api/software-api';
import testSoftwareApi from '@/lib/api/software-api';
import { queryKeys } from '@/lib/api/query-config';
import type { PaginatedResponse } from '@/lib/api/types';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { useToast } from '@/components/ui/use-toast';
import { mapSoftwareValidationErrorToToast } from '@/lib/errors/software-validation-errors';
import type { ValidationType, ValidationStatus } from '@equipment-management/schemas';
import {
  getPageContainerClasses,
  PAGE_HEADER_TOKENS,
  SOFTWARE_VALIDATION_STATUS_BADGE_TOKENS,
  SOFTWARE_VALIDATION_STATUS_ICON_TOKENS,
} from '@/lib/design-tokens';
import {
  DEFAULT_PAGE_SIZE,
  FRONTEND_ROUTES,
  Permission,
} from '@equipment-management/shared-constants';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useAuth } from '@/hooks/use-auth';
import { ValidationCreateDialog } from './_components/ValidationCreateDialog';
import type { CreateFormState } from './_components/validation-create-form.types';
import { ValidationActionsBar } from './_components/ValidationActionsBar';
import { ValidationApproveDialog } from './_components/ValidationApproveDialog';
import { ValidationRejectDialog } from './_components/ValidationRejectDialog';

interface SoftwareValidationContentProps {
  softwareId: string;
}

/**
 * P2-1: raw Tailwind 색상(text-yellow-600 등)을 시멘틱 토큰으로 대체.
 * 다크모드 자동 전환 보장.
 */
const STATUS_ICON_COMPONENT: Record<
  ValidationStatus,
  React.ComponentType<{ className?: string }>
> = {
  draft: FileEdit,
  submitted: Clock,
  approved: CheckCircle2,
  quality_approved: CheckCircle2,
  rejected: XCircle,
};

const EMPTY_FORM: CreateFormState = {
  validationType: '',
  softwareVersion: '',
  testDate: '',
  vendorName: '',
  vendorSummary: '',
  receivedBy: '',
  receivedDate: '',
  attachmentNote: '',
  referenceDocuments: '',
  operatingUnitDescription: '',
  softwareComponents: '',
  hardwareComponents: '',
  performedBy: '',
  acquisitionFunctions: [],
  processingFunctions: [],
  controlFunctions: [],
};

export default function SoftwareValidationContent({ softwareId }: SoftwareValidationContentProps) {
  const t = useTranslations('software');
  const tErrors = useTranslations('errors');
  const { toast } = useToast();
  const { fmtDate } = useDateFormatter();
  const router = useRouter();
  const { can, user } = useAuth();

  type ActiveDialog =
    | { type: 'approve'; target: SoftwareValidation }
    | { type: 'qualityApprove'; target: SoftwareValidation }
    | { type: 'reject'; target: SoftwareValidation }
    | null;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [createForm, setCreateForm] = useState<CreateFormState>(EMPTY_FORM);

  const { data: software } = useQuery({
    queryKey: queryKeys.testSoftware.detail(softwareId),
    queryFn: () => testSoftwareApi.get(softwareId),
  });

  const {
    data: validationsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.softwareValidations.byTestSoftware(softwareId),
    queryFn: () => softwareValidationApi.list(softwareId),
  });

  const validations = validationsData?.data ?? [];

  type ValidationCache = PaginatedResponse<SoftwareValidation>;

  const listQueryKey = queryKeys.softwareValidations.byTestSoftware(softwareId);
  const commonInvalidateKeys = [
    queryKeys.approvals.all,
    queryKeys.testSoftware.detail(softwareId),
    queryKeys.softwareValidations.lists(),
  ] as const;

  const makeStatusUpdate =
    (status: SoftwareValidation['status']) =>
    (old: ValidationCache | undefined, { id }: { id: string; version: number }) =>
      old
        ? { ...old, data: old.data.map((v) => (v.id === id ? { ...v, status } : v)) }
        : ({
            data: [],
            meta: {
              pagination: { total: 0, pageSize: DEFAULT_PAGE_SIZE, currentPage: 1, totalPages: 1 },
            },
          } as ValidationCache);

  const createMutation = useOptimisticMutation<
    SoftwareValidation,
    CreateSoftwareValidationDto,
    ValidationCache
  >({
    mutationFn: (data) => softwareValidationApi.create(softwareId, data),
    queryKey: listQueryKey,
    optimisticUpdate: (old) =>
      old ??
      ({
        data: [],
        meta: {
          pagination: { total: 0, pageSize: DEFAULT_PAGE_SIZE, currentPage: 1, totalPages: 1 },
        },
      } as ValidationCache),
    invalidateKeys: commonInvalidateKeys,
    successMessage: t('toast.validationCreateSuccess'),
    onSuccessCallback: () => {
      setIsCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    },
  });

  const submitMutation = useOptimisticMutation<
    SoftwareValidation,
    { id: string; version: number },
    ValidationCache
  >({
    mutationFn: ({ id, version }) => softwareValidationApi.submit(id, version),
    queryKey: listQueryKey,
    optimisticUpdate: makeStatusUpdate('submitted'),
    invalidateKeys: commonInvalidateKeys,
    successMessage: t('toast.validationSubmitSuccess'),
  });

  const approveMutation = useOptimisticMutation<
    SoftwareValidation,
    { id: string; version: number; approvalComment?: string },
    ValidationCache
  >({
    mutationFn: ({ id, version, approvalComment }) =>
      softwareValidationApi.approve(id, version, approvalComment),
    queryKey: listQueryKey,
    optimisticUpdate: makeStatusUpdate('approved'),
    invalidateKeys: commonInvalidateKeys,
    successMessage: t('toast.validationApproveSuccess'),
    onSuccessCallback: () => setActiveDialog(null),
  });

  const qualityApproveMutation = useOptimisticMutation<
    SoftwareValidation,
    { id: string; version: number; qualityApprovalComment?: string },
    ValidationCache
  >({
    mutationFn: ({ id, version, qualityApprovalComment }) =>
      softwareValidationApi.qualityApprove(id, version, qualityApprovalComment),
    queryKey: listQueryKey,
    optimisticUpdate: makeStatusUpdate('quality_approved'),
    invalidateKeys: commonInvalidateKeys,
    successMessage: t('toast.validationApproveSuccess'),
    onSuccessCallback: () => setActiveDialog(null),
  });

  const rejectMutation = useOptimisticMutation<
    SoftwareValidation,
    { id: string; version: number; reason: string },
    ValidationCache
  >({
    mutationFn: ({ id, version, reason }) => softwareValidationApi.reject(id, version, reason),
    queryKey: listQueryKey,
    optimisticUpdate: makeStatusUpdate('rejected'),
    invalidateKeys: commonInvalidateKeys,
    successMessage: t('toast.validationRejectSuccess'),
    onSuccessCallback: () => setActiveDialog(null),
    onErrorCallback: (error: unknown) => {
      const { title, description } = mapSoftwareValidationErrorToToast(error, t, tErrors);
      toast({ title, description, variant: 'destructive' });
    },
  });

  const reviseMutation = useOptimisticMutation<
    SoftwareValidation,
    { id: string; version: number },
    ValidationCache
  >({
    mutationFn: ({ id, version }) => softwareValidationApi.revise(id, version),
    queryKey: listQueryKey,
    optimisticUpdate: makeStatusUpdate('draft'),
    invalidateKeys: commonInvalidateKeys,
    successMessage: t('toast.validationCreateSuccess'),
  });

  const handleCreate = () => {
    if (!createForm.validationType) return;
    const data: CreateSoftwareValidationDto = {
      validationType: createForm.validationType as ValidationType,
      ...(createForm.softwareVersion ? { softwareVersion: createForm.softwareVersion } : {}),
      ...(createForm.testDate ? { testDate: createForm.testDate } : {}),
      ...(createForm.vendorName ? { vendorName: createForm.vendorName } : {}),
      ...(createForm.vendorSummary ? { vendorSummary: createForm.vendorSummary } : {}),
      ...(createForm.receivedBy ? { receivedBy: createForm.receivedBy } : {}),
      ...(createForm.receivedDate ? { receivedDate: createForm.receivedDate } : {}),
      ...(createForm.attachmentNote ? { attachmentNote: createForm.attachmentNote } : {}),
      ...(createForm.referenceDocuments
        ? { referenceDocuments: createForm.referenceDocuments }
        : {}),
      ...(createForm.operatingUnitDescription
        ? { operatingUnitDescription: createForm.operatingUnitDescription }
        : {}),
      ...(createForm.softwareComponents
        ? { softwareComponents: createForm.softwareComponents }
        : {}),
      ...(createForm.hardwareComponents
        ? { hardwareComponents: createForm.hardwareComponents }
        : {}),
      ...(createForm.performedBy ? { performedBy: createForm.performedBy } : {}),
      ...(createForm.acquisitionFunctions.length > 0
        ? { acquisitionFunctions: createForm.acquisitionFunctions }
        : {}),
      ...(createForm.processingFunctions.length > 0
        ? { processingFunctions: createForm.processingFunctions }
        : {}),
      ...(createForm.controlFunctions.length > 0
        ? { controlFunctions: createForm.controlFunctions }
        : {}),
    };
    createMutation.mutate(data);
  };

  return (
    <div className={getPageContainerClasses('detail')}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(FRONTEND_ROUTES.SOFTWARE.DETAIL(softwareId))}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t('validation.backToDetail')}
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className={PAGE_HEADER_TOKENS.title}>{t('validation.title')}</h1>
          <p className={PAGE_HEADER_TOKENS.subtitle}>
            {software?.name} — {t('validation.subtitle')}
          </p>
        </div>
        {can(Permission.CREATE_SOFTWARE_VALIDATION) && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('validation.createButton')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-16 flex justify-center">
          <ErrorState title={t('validation.loadError')} />
        </div>
      ) : validations.length === 0 ? (
        <ValidationListEmptyState
          canCreate={can(Permission.CREATE_SOFTWARE_VALIDATION)}
          onCreateClick={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('validation.columns.type')}</TableHead>
                <TableHead>{t('validation.columns.status')}</TableHead>
                <TableHead>{t('validation.columns.version')}</TableHead>
                <TableHead>{t('validation.columns.testDate')}</TableHead>
                <TableHead>{t('validation.columns.submittedAt')}</TableHead>
                <TableHead>{t('validation.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validations.map((v) => (
                <TableRow
                  key={v.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    router.push(FRONTEND_ROUTES.SOFTWARE.VALIDATION_DETAIL(softwareId, v.id))
                  }
                >
                  <TableCell>{t(`validationType.${v.validationType}`)}</TableCell>
                  <TableCell>
                    {(() => {
                      const Icon = STATUS_ICON_COMPONENT[v.status];
                      return (
                        <Badge
                          className={`flex w-fit items-center gap-1 ${SOFTWARE_VALIDATION_STATUS_BADGE_TOKENS[v.status]}`}
                        >
                          <Icon
                            className={`h-3.5 w-3.5 ${SOFTWARE_VALIDATION_STATUS_ICON_TOKENS[v.status]}`}
                            aria-hidden="true"
                          />
                          {t(`validationStatus.${v.status}`)}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {v.softwareVersion || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>{v.testDate ? fmtDate(v.testDate) : '-'}</TableCell>
                  <TableCell>{v.submittedAt ? fmtDate(v.submittedAt) : '-'}</TableCell>
                  <TableCell>
                    <ValidationActionsBar
                      validation={v}
                      softwareId={softwareId}
                      can={can}
                      userId={user?.id}
                      submitMutation={submitMutation}
                      approveMutation={approveMutation}
                      qualityApproveMutation={qualityApproveMutation}
                      reviseMutation={reviseMutation}
                      onApprove={(target) => setActiveDialog({ type: 'approve', target })}
                      onQualityApprove={(target) =>
                        setActiveDialog({ type: 'qualityApprove', target })
                      }
                      onReject={(target) => setActiveDialog({ type: 'reject', target })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ValidationCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        createForm={createForm}
        setCreateForm={setCreateForm}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
      />

      <ValidationApproveDialog
        open={activeDialog?.type === 'approve'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        type="technical"
        isPending={approveMutation.isPending}
        onConfirm={(comment) => {
          if (activeDialog?.type === 'approve') {
            approveMutation.mutate({
              id: activeDialog.target.id,
              version: activeDialog.target.version,
              approvalComment: comment,
            });
          }
        }}
      />

      <ValidationApproveDialog
        open={activeDialog?.type === 'qualityApprove'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        type="quality"
        isPending={qualityApproveMutation.isPending}
        onConfirm={(comment) => {
          if (activeDialog?.type === 'qualityApprove') {
            qualityApproveMutation.mutate({
              id: activeDialog.target.id,
              version: activeDialog.target.version,
              qualityApprovalComment: comment,
            });
          }
        }}
      />

      <ValidationRejectDialog
        open={activeDialog?.type === 'reject'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        isPending={rejectMutation.isPending}
        onConfirm={(reason) => {
          if (activeDialog?.type === 'reject') {
            rejectMutation.mutate({
              id: activeDialog.target.id,
              version: activeDialog.target.version,
              reason,
            });
          }
        }}
      />
    </div>
  );
}
