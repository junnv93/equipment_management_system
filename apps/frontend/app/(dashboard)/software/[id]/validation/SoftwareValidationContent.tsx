'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, FileCheck, FileEdit, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  softwareValidationApi,
  type SoftwareValidation,
  type CreateSoftwareValidationDto,
} from '@/lib/api/software-api';
import testSoftwareApi from '@/lib/api/software-api';
import { queryKeys } from '@/lib/api/query-config';
import type { PaginatedResponse } from '@/lib/api/types';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import type { ValidationType, ValidationStatus } from '@equipment-management/schemas';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { FRONTEND_ROUTES, Permission } from '@equipment-management/shared-constants';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useAuth } from '@/hooks/use-auth';
import { ValidationCreateDialog, type CreateFormState } from './_components/ValidationCreateDialog';
import { ValidationActionsBar } from './_components/ValidationActionsBar';

interface SoftwareValidationContentProps {
  softwareId: string;
}

const STATUS_ICON: Record<ValidationStatus, React.ReactNode> = {
  draft: <FileEdit className="h-4 w-4 text-muted-foreground" />,
  submitted: <Clock className="h-4 w-4 text-yellow-600" />,
  approved: <CheckCircle2 className="h-4 w-4 text-blue-600" />,
  quality_approved: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  rejected: <XCircle className="h-4 w-4 text-red-600" />,
};

const STATUS_VARIANT: Record<
  ValidationStatus,
  'secondary' | 'outline' | 'default' | 'destructive'
> = {
  draft: 'secondary',
  submitted: 'outline',
  approved: 'outline',
  quality_approved: 'default',
  rejected: 'destructive',
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
  const { fmtDate } = useDateFormatter();
  const router = useRouter();
  const { can, user } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<SoftwareValidation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
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
            meta: { pagination: { total: 0, pageSize: 20, currentPage: 1, totalPages: 1 } },
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
        meta: { pagination: { total: 0, pageSize: 20, currentPage: 1, totalPages: 1 } },
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
    { id: string; version: number },
    ValidationCache
  >({
    mutationFn: ({ id, version }) => softwareValidationApi.approve(id, version),
    queryKey: listQueryKey,
    optimisticUpdate: makeStatusUpdate('approved'),
    invalidateKeys: commonInvalidateKeys,
    successMessage: t('toast.validationApproveSuccess'),
  });

  const qualityApproveMutation = useOptimisticMutation<
    SoftwareValidation,
    { id: string; version: number },
    ValidationCache
  >({
    mutationFn: ({ id, version }) => softwareValidationApi.qualityApprove(id, version),
    queryKey: listQueryKey,
    optimisticUpdate: makeStatusUpdate('quality_approved'),
    invalidateKeys: commonInvalidateKeys,
    successMessage: t('toast.validationApproveSuccess'),
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
    onSuccessCallback: () => {
      setIsRejectOpen(false);
      setRejectTarget(null);
      setRejectionReason('');
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
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <XCircle className="mb-3 h-10 w-10 text-destructive" />
          <p>{t('validation.loadError')}</p>
        </div>
      ) : validations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileCheck className="mb-3 h-10 w-10" />
          <p>{t('validation.empty')}</p>
        </div>
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
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICON[v.status]}
                      <Badge variant={STATUS_VARIANT[v.status]}>
                        {t(`validationStatus.${v.status}`)}
                      </Badge>
                    </div>
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
                      onReject={(target) => {
                        setRejectTarget(target);
                        setRejectionReason('');
                        setIsRejectOpen(true);
                      }}
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

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('validation.rejectDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('validation.rejectDialog.reasonLabel')}</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t('validation.rejectDialog.reasonPlaceholder')}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              {t('validation.rejectDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectTarget && rejectionReason.trim()) {
                  rejectMutation.mutate({
                    id: rejectTarget.id,
                    version: rejectTarget.version,
                    reason: rejectionReason,
                  });
                }
              }}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {t('validation.rejectDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
