'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FileCheck, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { UserCombobox } from '@/components/ui/user-combobox';
import { softwareValidationApi } from '@/lib/api/software-api';
import type { UpdateSoftwareValidationDto } from '@/lib/api/software-api';
import { queryKeys } from '@/lib/api/query-config';
import { isConflictError } from '@/lib/api/error';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import type { ValidationStatus } from '@equipment-management/schemas';

interface ValidationDetailContentProps {
  softwareId: string;
  validationId: string;
}

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

export default function ValidationDetailContent({
  softwareId,
  validationId,
}: ValidationDetailContentProps) {
  const t = useTranslations('software');
  const { fmtDate, fmtDateTime } = useDateFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(searchParams.get('edit') === 'true');
  const [editForm, setEditForm] = useState<{
    vendorName: string;
    vendorSummary: string;
    receivedBy: string;
    receivedDate: string;
    attachmentNote: string;
    softwareVersion: string;
    testDate: string;
  } | null>(null);

  const { data: validation, isLoading } = useQuery({
    queryKey: queryKeys.softwareValidations.detail(validationId),
    queryFn: () => softwareValidationApi.get(validationId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSoftwareValidationDto) =>
      softwareValidationApi.update(validationId, data),
    onSuccess: () => {
      toast({ title: t('toast.updateSuccess') });
      setIsEditOpen(false);
      queryClient.invalidateQueries({
        queryKey: queryKeys.softwareValidations.detail(validationId),
      });
    },
    onError: (error) => {
      if (isConflictError(error)) {
        toast({ title: t('toast.versionConflict'), variant: 'destructive' });
        queryClient.invalidateQueries({
          queryKey: queryKeys.softwareValidations.detail(validationId),
        });
      } else {
        toast({ title: t('toast.error'), variant: 'destructive' });
      }
    },
  });

  const openEditDialog = () => {
    if (!validation) return;
    setEditForm({
      vendorName: validation.vendorName ?? '',
      vendorSummary: validation.vendorSummary ?? '',
      receivedBy: validation.receivedBy ?? '',
      receivedDate: validation.receivedDate?.split('T')[0] ?? '',
      attachmentNote: validation.attachmentNote ?? '',
      softwareVersion: validation.softwareVersion ?? '',
      testDate: validation.testDate?.split('T')[0] ?? '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!validation || !editForm) return;
    const data: UpdateSoftwareValidationDto = {
      version: validation.version,
      ...(editForm.softwareVersion ? { softwareVersion: editForm.softwareVersion } : {}),
      ...(editForm.testDate ? { testDate: editForm.testDate } : {}),
      ...(editForm.vendorName ? { vendorName: editForm.vendorName } : {}),
      ...(editForm.vendorSummary ? { vendorSummary: editForm.vendorSummary } : {}),
      ...(editForm.receivedBy ? { receivedBy: editForm.receivedBy } : {}),
      ...(editForm.receivedDate ? { receivedDate: editForm.receivedDate } : {}),
      ...(editForm.attachmentNote ? { attachmentNote: editForm.attachmentNote } : {}),
    };
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!validation) {
    return (
      <div className={getPageContainerClasses('detail')}>
        <p className="text-muted-foreground">Not found</p>
      </div>
    );
  }

  const isVendor = validation.validationType === 'vendor';
  const isSelf = validation.validationType === 'self';

  return (
    <div className={getPageContainerClasses('detail')}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(FRONTEND_ROUTES.SOFTWARE.VALIDATION(softwareId))}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t('validation.detail.backToList')}
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className={PAGE_HEADER_TOKENS.title}>{t('validation.detail.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {validation.status === 'draft' && (
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              {t('validation.actions.edit')}
            </Button>
          )}
          <Badge variant={STATUS_VARIANT[validation.status]} className="text-sm">
            {t(`validationStatus.${validation.status}`)}
          </Badge>
        </div>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-5 w-5 text-brand-info" aria-hidden="true" />
            {t('validation.detail.basicInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('validation.detail.validationType')}
              </dt>
              <dd className="text-sm font-medium">
                {t(`validationType.${validation.validationType}`)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('validation.detail.softwareVersion')}
              </dt>
              <dd className="text-sm font-mono">{validation.softwareVersion || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('validation.detail.testDate')}</dt>
              <dd className="text-sm">
                {validation.testDate ? fmtDate(validation.testDate) : '-'}
              </dd>
            </div>
            {validation.infoDate && (
              <div>
                <dt className="text-sm text-muted-foreground">{t('validation.detail.infoDate')}</dt>
                <dd className="text-sm">{fmtDate(validation.infoDate)}</dd>
              </div>
            )}
            {validation.softwareAuthor && (
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.softwareAuthor')}
                </dt>
                <dd className="text-sm">{validation.softwareAuthor}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* 방법 1: 공급자 정보 */}
      {isVendor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('validation.detail.vendorInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.vendorName')}
                </dt>
                <dd className="text-sm font-medium">{validation.vendorName || '-'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.vendorSummary')}
                </dt>
                <dd className="text-sm whitespace-pre-wrap">{validation.vendorSummary || '-'}</dd>
              </div>
              {validation.receivedBy && (
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('validation.detail.receivedBy')}
                  </dt>
                  <dd className="text-sm">{validation.receivedBy}</dd>
                </div>
              )}
              {validation.receivedDate && (
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('validation.detail.receivedDate')}
                  </dt>
                  <dd className="text-sm">{fmtDate(validation.receivedDate)}</dd>
                </div>
              )}
              {validation.attachmentNote && (
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground">
                    {t('validation.detail.attachmentNote')}
                  </dt>
                  <dd className="text-sm whitespace-pre-wrap">{validation.attachmentNote}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* 방법 2: 자체 시험 */}
      {isSelf && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('validation.detail.selfTestInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.referenceDocuments')}
                </dt>
                <dd className="text-sm whitespace-pre-wrap">
                  {validation.referenceDocuments || '-'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.operatingUnitDescription')}
                </dt>
                <dd className="text-sm whitespace-pre-wrap">
                  {validation.operatingUnitDescription || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.softwareComponents')}
                </dt>
                <dd className="text-sm whitespace-pre-wrap">
                  {validation.softwareComponents || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.hardwareComponents')}
                </dt>
                <dd className="text-sm whitespace-pre-wrap">
                  {validation.hardwareComponents || '-'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* 승인 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('validation.detail.approvalInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {validation.submittedAt && (
              <>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('validation.detail.submittedAt')}
                  </dt>
                  <dd className="text-sm">{fmtDateTime(validation.submittedAt)}</dd>
                </div>
              </>
            )}
            {validation.technicalApprovedAt && (
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.technicalApprovedAt')}
                </dt>
                <dd className="text-sm">{fmtDateTime(validation.technicalApprovedAt)}</dd>
              </div>
            )}
            {validation.qualityApprovedAt && (
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.qualityApprovedAt')}
                </dt>
                <dd className="text-sm">{fmtDateTime(validation.qualityApprovedAt)}</dd>
              </div>
            )}
            {validation.rejectionReason && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.rejectionReason')}
                </dt>
                <dd className="text-sm text-destructive whitespace-pre-wrap">
                  {validation.rejectionReason}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-muted-foreground">{t('validation.detail.createdAt')}</dt>
              <dd className="text-sm">{fmtDateTime(validation.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('validation.editDialog.title')}</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('validation.form.versionLabel')}</Label>
                <Input
                  value={editForm.softwareVersion}
                  onChange={(e) => setEditForm({ ...editForm, softwareVersion: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('validation.form.testDateLabel')}</Label>
                <Input
                  type="date"
                  value={editForm.testDate}
                  onChange={(e) => setEditForm({ ...editForm, testDate: e.target.value })}
                />
              </div>
              {isVendor && (
                <>
                  <div className="space-y-2">
                    <Label>{t('validation.form.vendorNameLabel')}</Label>
                    <Input
                      value={editForm.vendorName}
                      onChange={(e) => setEditForm({ ...editForm, vendorName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('validation.form.vendorSummaryLabel')}</Label>
                    <Textarea
                      value={editForm.vendorSummary}
                      onChange={(e) => setEditForm({ ...editForm, vendorSummary: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('validation.form.receivedByLabel')}</Label>
                      <UserCombobox
                        value={editForm.receivedBy || undefined}
                        onChange={(id) => setEditForm({ ...editForm, receivedBy: id ?? '' })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('validation.form.receivedDateLabel')}</Label>
                      <Input
                        type="date"
                        value={editForm.receivedDate}
                        onChange={(e) => setEditForm({ ...editForm, receivedDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('validation.form.attachmentNoteLabel')}</Label>
                    <Textarea
                      value={editForm.attachmentNote}
                      onChange={(e) => setEditForm({ ...editForm, attachmentNote: e.target.value })}
                      placeholder={t('validation.form.attachmentNotePlaceholder')}
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  {t('validation.form.cancel')}
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending
                    ? t('validation.editDialog.saving')
                    : t('validation.editDialog.save')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
