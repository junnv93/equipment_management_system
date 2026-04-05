'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/components/ui/use-toast';
import {
  softwareValidationApi,
  type SoftwareValidation,
  type CreateSoftwareValidationDto,
} from '@/lib/api/software-api';
import testSoftwareApi from '@/lib/api/software-api';
import { queryKeys } from '@/lib/api/query-config';
import { apiClient } from '@/lib/api/api-client';
import { isConflictError } from '@/lib/api/error';
import { VALIDATION_TYPE_VALUES } from '@equipment-management/schemas';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { ValidationType, ValidationStatus } from '@equipment-management/schemas';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { useDateFormatter } from '@/hooks/use-date-formatter';

interface FunctionItem {
  [key: string]: string;
}

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

export default function SoftwareValidationContent({ softwareId }: SoftwareValidationContentProps) {
  const t = useTranslations('software');
  const { fmtDate } = useDateFormatter();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<SoftwareValidation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [createForm, setCreateForm] = useState({
    validationType: '' as ValidationType | '',
    softwareVersion: '',
    testDate: '',
    // Method 1 (vendor)
    vendorName: '',
    vendorSummary: '',
    // Method 2 (self)
    referenceDocuments: '',
    operatingUnitDescription: '',
    softwareComponents: '',
    hardwareComponents: '',
    performedBy: '',
    acquisitionFunctions: [] as FunctionItem[],
    processingFunctions: [] as FunctionItem[],
    controlFunctions: [] as FunctionItem[],
  });

  const { data: usersData } = useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: () =>
      apiClient.get(API_ENDPOINTS.USERS.LIST).then((r) => r.data as { id: string; name: string }[]),
    enabled: createForm.validationType === 'self',
  });

  const { data: software } = useQuery({
    queryKey: queryKeys.testSoftware.detail(softwareId),
    queryFn: () => testSoftwareApi.get(softwareId),
  });

  const { data: validationsData, isLoading } = useQuery({
    queryKey: queryKeys.softwareValidations.byTestSoftware(softwareId),
    queryFn: () => softwareValidationApi.list(softwareId),
  });

  const validations = validationsData?.data ?? [];

  const invalidateValidations = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.softwareValidations.byTestSoftware(softwareId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.approvals.all,
    });
  };

  const handleMutationError = (error: Error) => {
    if (isConflictError(error)) {
      toast({
        title: t('toast.versionConflict'),
        description: t('toast.versionConflictDesc'),
        variant: 'destructive',
      });
    } else {
      toast({ title: t('toast.error'), description: error.message, variant: 'destructive' });
    }
    invalidateValidations();
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateSoftwareValidationDto) =>
      softwareValidationApi.create(softwareId, data),
    onSuccess: () => {
      toast({ title: t('toast.validationCreateSuccess') });
      setIsCreateOpen(false);
      setCreateForm({
        validationType: '',
        softwareVersion: '',
        testDate: '',
        vendorName: '',
        vendorSummary: '',
        referenceDocuments: '',
        operatingUnitDescription: '',
        softwareComponents: '',
        hardwareComponents: '',
        performedBy: '',
        acquisitionFunctions: [],
        processingFunctions: [],
        controlFunctions: [],
      });
    },
    onError: handleMutationError,
    onSettled: invalidateValidations,
  });

  const submitMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      softwareValidationApi.submit(id, version),
    onSuccess: () => toast({ title: t('toast.validationSubmitSuccess') }),
    onError: handleMutationError,
    onSettled: invalidateValidations,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      softwareValidationApi.approve(id, version),
    onSuccess: () => toast({ title: t('toast.validationApproveSuccess') }),
    onError: handleMutationError,
    onSettled: invalidateValidations,
  });

  const qualityApproveMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      softwareValidationApi.qualityApprove(id, version),
    onSuccess: () => toast({ title: t('toast.validationApproveSuccess') }),
    onError: handleMutationError,
    onSettled: invalidateValidations,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, version, reason }: { id: string; version: number; reason: string }) =>
      softwareValidationApi.reject(id, version, reason),
    onSuccess: () => {
      toast({ title: t('toast.validationRejectSuccess') });
      setIsRejectOpen(false);
      setRejectTarget(null);
      setRejectionReason('');
    },
    onError: handleMutationError,
    onSettled: invalidateValidations,
  });

  const handleCreate = () => {
    if (!createForm.validationType) return;
    const data: CreateSoftwareValidationDto = {
      validationType: createForm.validationType as ValidationType,
      ...(createForm.softwareVersion ? { softwareVersion: createForm.softwareVersion } : {}),
      ...(createForm.testDate ? { testDate: createForm.testDate } : {}),
      ...(createForm.vendorName ? { vendorName: createForm.vendorName } : {}),
      ...(createForm.vendorSummary ? { vendorSummary: createForm.vendorSummary } : {}),
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

  const openRejectDialog = (v: SoftwareValidation) => {
    setRejectTarget(v);
    setRejectionReason('');
    setIsRejectOpen(true);
  };

  return (
    <div className={getPageContainerClasses('detail')}>
      {/* Nav */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(FRONTEND_ROUTES.SOFTWARE.DETAIL(softwareId))}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t('validation.backToDetail')}
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={PAGE_HEADER_TOKENS.title}>{t('validation.title')}</h1>
          <p className={PAGE_HEADER_TOKENS.subtitle}>
            {software?.name} — {t('validation.subtitle')}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('validation.createButton')}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
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
                <TableRow key={v.id}>
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
                    <div className="flex items-center gap-1">
                      {v.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => submitMutation.mutate({ id: v.id, version: v.version })}
                          disabled={submitMutation.isPending}
                        >
                          {t('validation.actions.submit')}
                        </Button>
                      )}
                      {v.status === 'submitted' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveMutation.mutate({ id: v.id, version: v.version })}
                            disabled={approveMutation.isPending}
                          >
                            {t('validation.actions.approve')}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openRejectDialog(v)}
                          >
                            {t('validation.actions.reject')}
                          </Button>
                        </>
                      )}
                      {v.status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            qualityApproveMutation.mutate({ id: v.id, version: v.version })
                          }
                          disabled={qualityApproveMutation.isPending}
                        >
                          {t('validation.actions.qualityApprove')}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          className={
            createForm.validationType === 'self'
              ? 'max-w-3xl max-h-[85vh] overflow-y-auto'
              : 'max-w-md'
          }
        >
          <DialogHeader>
            <DialogTitle>{t('validation.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('validation.form.typeLabel')}</Label>
              <Select
                value={createForm.validationType}
                onValueChange={(v) =>
                  setCreateForm({ ...createForm, validationType: v as ValidationType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('validation.form.typePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {VALIDATION_TYPE_VALUES.map((vt) => (
                    <SelectItem key={vt} value={vt}>
                      {t(`validationType.${vt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('validation.form.versionLabel')}</Label>
              <Input
                value={createForm.softwareVersion}
                onChange={(e) => setCreateForm({ ...createForm, softwareVersion: e.target.value })}
                placeholder={t('validation.form.versionPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('validation.form.testDateLabel')}</Label>
              <Input
                type="date"
                value={createForm.testDate}
                onChange={(e) => setCreateForm({ ...createForm, testDate: e.target.value })}
              />
            </div>
            {createForm.validationType === 'vendor' && (
              <>
                <div className="space-y-2">
                  <Label>{t('validation.form.vendorNameLabel')}</Label>
                  <Input
                    value={createForm.vendorName}
                    onChange={(e) => setCreateForm({ ...createForm, vendorName: e.target.value })}
                    placeholder={t('validation.form.vendorNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('validation.form.vendorSummaryLabel')}</Label>
                  <Textarea
                    value={createForm.vendorSummary}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, vendorSummary: e.target.value })
                    }
                    placeholder={t('validation.form.vendorSummaryPlaceholder')}
                  />
                </div>
              </>
            )}
            {createForm.validationType === 'self' && (
              <>
                {/* 기본정보 */}
                <h4 className="text-sm font-semibold pt-2">
                  {t('validation.form.selfBasicInfoTitle')}
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('validation.form.referenceDocumentsLabel')}</Label>
                    <Textarea
                      value={createForm.referenceDocuments}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, referenceDocuments: e.target.value })
                      }
                      placeholder={t('validation.form.referenceDocumentsPlaceholder')}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('validation.form.operatingUnitLabel')}</Label>
                    <Textarea
                      value={createForm.operatingUnitDescription}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, operatingUnitDescription: e.target.value })
                      }
                      placeholder={t('validation.form.operatingUnitPlaceholder')}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('validation.form.softwareComponentsLabel')}</Label>
                    <Textarea
                      value={createForm.softwareComponents}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, softwareComponents: e.target.value })
                      }
                      placeholder={t('validation.form.softwareComponentsPlaceholder')}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('validation.form.hardwareComponentsLabel')}</Label>
                    <Textarea
                      value={createForm.hardwareComponents}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, hardwareComponents: e.target.value })
                      }
                      placeholder={t('validation.form.hardwareComponentsPlaceholder')}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                {/* 수행자 */}
                <div className="space-y-2">
                  <Label>{t('validation.form.performedByLabel')}</Label>
                  <Select
                    value={createForm.performedBy}
                    onValueChange={(v) => setCreateForm({ ...createForm, performedBy: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('validation.form.performedByPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(usersData ?? []).map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 획득 기능 */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">
                        {t('validation.form.acquisitionTitle')}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {t('validation.form.acquisitionDesc')}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCreateForm({
                          ...createForm,
                          acquisitionFunctions: [
                            ...createForm.acquisitionFunctions,
                            { functionName: '', independentMethod: '', acceptanceCriteria: '' },
                          ],
                        })
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {t('validation.form.addFunction')}
                    </Button>
                  </div>
                  {createForm.acquisitionFunctions.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      {t('validation.form.noFunctions')}
                    </p>
                  )}
                  {createForm.acquisitionFunctions.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-3 gap-2 items-end border rounded-md p-3"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs">{t('validation.form.functionName')}</Label>
                        <Input
                          value={item.functionName}
                          onChange={(e) => {
                            const updated = [...createForm.acquisitionFunctions];
                            updated[idx] = { ...item, functionName: e.target.value };
                            setCreateForm({ ...createForm, acquisitionFunctions: updated });
                          }}
                          placeholder={t('validation.form.functionNamePlaceholder')}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('validation.form.independentMethod')}</Label>
                        <Input
                          value={item.independentMethod}
                          onChange={(e) => {
                            const updated = [...createForm.acquisitionFunctions];
                            updated[idx] = { ...item, independentMethod: e.target.value };
                            setCreateForm({ ...createForm, acquisitionFunctions: updated });
                          }}
                          placeholder={t('validation.form.independentMethodPlaceholder')}
                        />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="space-y-1 flex-1">
                          <Label className="text-xs">
                            {t('validation.form.acceptanceCriteria')}
                          </Label>
                          <Input
                            value={item.acceptanceCriteria}
                            onChange={(e) => {
                              const updated = [...createForm.acquisitionFunctions];
                              updated[idx] = { ...item, acceptanceCriteria: e.target.value };
                              setCreateForm({ ...createForm, acquisitionFunctions: updated });
                            }}
                            placeholder={t('validation.form.acceptanceCriteriaPlaceholder')}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = createForm.acquisitionFunctions.filter(
                              (_, i) => i !== idx
                            );
                            setCreateForm({ ...createForm, acquisitionFunctions: updated });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 프로세싱 기능 */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">
                        {t('validation.form.processingTitle')}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {t('validation.form.processingDesc')}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCreateForm({
                          ...createForm,
                          processingFunctions: [
                            ...createForm.processingFunctions,
                            { functionName: '', independentMethod: '', acceptanceCriteria: '' },
                          ],
                        })
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {t('validation.form.addFunction')}
                    </Button>
                  </div>
                  {createForm.processingFunctions.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      {t('validation.form.noFunctions')}
                    </p>
                  )}
                  {createForm.processingFunctions.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-3 gap-2 items-end border rounded-md p-3"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs">{t('validation.form.functionName')}</Label>
                        <Input
                          value={item.functionName}
                          onChange={(e) => {
                            const updated = [...createForm.processingFunctions];
                            updated[idx] = { ...item, functionName: e.target.value };
                            setCreateForm({ ...createForm, processingFunctions: updated });
                          }}
                          placeholder={t('validation.form.functionNamePlaceholder')}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('validation.form.independentMethod')}</Label>
                        <Input
                          value={item.independentMethod}
                          onChange={(e) => {
                            const updated = [...createForm.processingFunctions];
                            updated[idx] = { ...item, independentMethod: e.target.value };
                            setCreateForm({ ...createForm, processingFunctions: updated });
                          }}
                          placeholder={t('validation.form.independentMethodPlaceholder')}
                        />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="space-y-1 flex-1">
                          <Label className="text-xs">
                            {t('validation.form.acceptanceCriteria')}
                          </Label>
                          <Input
                            value={item.acceptanceCriteria}
                            onChange={(e) => {
                              const updated = [...createForm.processingFunctions];
                              updated[idx] = { ...item, acceptanceCriteria: e.target.value };
                              setCreateForm({ ...createForm, processingFunctions: updated });
                            }}
                            placeholder={t('validation.form.acceptanceCriteriaPlaceholder')}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = createForm.processingFunctions.filter(
                              (_, i) => i !== idx
                            );
                            setCreateForm({ ...createForm, processingFunctions: updated });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 제어 기능 (5개 필드) */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">{t('validation.form.controlTitle')}</h4>
                      <p className="text-xs text-muted-foreground">
                        {t('validation.form.controlDesc')}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCreateForm({
                          ...createForm,
                          controlFunctions: [
                            ...createForm.controlFunctions,
                            {
                              controlEquipmentFunction: '',
                              expectedFunction: '',
                              verificationFunction: '',
                              independentMethod: '',
                              acceptanceCriteria: '',
                            },
                          ],
                        })
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {t('validation.form.addFunction')}
                    </Button>
                  </div>
                  {createForm.controlFunctions.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      {t('validation.form.noFunctions')}
                    </p>
                  )}
                  {createForm.controlFunctions.map((item, idx) => (
                    <div key={idx} className="space-y-2 border rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = createForm.controlFunctions.filter((_, i) => i !== idx);
                            setCreateForm({ ...createForm, controlFunctions: updated });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">
                            {t('validation.form.controlEquipmentFunction')}
                          </Label>
                          <Input
                            value={item.controlEquipmentFunction}
                            onChange={(e) => {
                              const updated = [...createForm.controlFunctions];
                              updated[idx] = {
                                ...item,
                                controlEquipmentFunction: e.target.value,
                              };
                              setCreateForm({ ...createForm, controlFunctions: updated });
                            }}
                            placeholder={t('validation.form.controlEquipmentFunctionPlaceholder')}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('validation.form.expectedFunction')}</Label>
                          <Input
                            value={item.expectedFunction}
                            onChange={(e) => {
                              const updated = [...createForm.controlFunctions];
                              updated[idx] = { ...item, expectedFunction: e.target.value };
                              setCreateForm({ ...createForm, controlFunctions: updated });
                            }}
                            placeholder={t('validation.form.expectedFunctionPlaceholder')}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            {t('validation.form.verificationFunction')}
                          </Label>
                          <Input
                            value={item.verificationFunction}
                            onChange={(e) => {
                              const updated = [...createForm.controlFunctions];
                              updated[idx] = {
                                ...item,
                                verificationFunction: e.target.value,
                              };
                              setCreateForm({ ...createForm, controlFunctions: updated });
                            }}
                            placeholder={t('validation.form.verificationFunctionPlaceholder')}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            {t('validation.form.independentMethod')}
                          </Label>
                          <Input
                            value={item.independentMethod}
                            onChange={(e) => {
                              const updated = [...createForm.controlFunctions];
                              updated[idx] = { ...item, independentMethod: e.target.value };
                              setCreateForm({ ...createForm, controlFunctions: updated });
                            }}
                            placeholder={t('validation.form.independentMethodPlaceholder')}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('validation.form.acceptanceCriteria')}</Label>
                        <Input
                          value={item.acceptanceCriteria}
                          onChange={(e) => {
                            const updated = [...createForm.controlFunctions];
                            updated[idx] = { ...item, acceptanceCriteria: e.target.value };
                            setCreateForm({ ...createForm, controlFunctions: updated });
                          }}
                          placeholder={t('validation.form.acceptanceCriteriaPlaceholder')}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t('validation.form.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createForm.validationType || createMutation.isPending}
            >
              {createMutation.isPending
                ? t('validation.form.submitting')
                : t('validation.form.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
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
