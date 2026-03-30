'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPageContainerClasses } from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';
import equipmentImportApi, {
  type CreateEquipmentImportDto,
  type CreateRentalImportDto,
  type CreateInternalSharedImportDto,
} from '@/lib/api/equipment-import-api';
import {
  type EquipmentImportSource,
  EquipmentImportSourceValues as EISrcVal,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { queryKeys } from '@/lib/api/query-config';
import { useClassificationLabels } from '@/lib/i18n/use-enum-labels';

interface CreateEquipmentImportFormProps {
  /**
   * Import source type - determines which fields are shown
   * - 'rental': Shows vendor fields (vendorName, vendorContact, externalIdentifier)
   * - 'internal_shared': Shows department fields (ownerDepartment, internalContact, borrowingJustification)
   */
  sourceType: EquipmentImportSource;
}

/**
 * Equipment Import Creation Form - Unified for rental and internal shared
 *
 * This form adapts its fields based on the sourceType prop:
 * - Rental: Vendor information fields (업체명, 업체 연락처, 업체 장비번호)
 * - Internal Shared: Department information fields (소유 부서, 담당자 연락처, 상세 반입 사유)
 *
 * Common fields are always shown regardless of source type.
 */
export default function CreateEquipmentImportForm({ sourceType }: CreateEquipmentImportFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations('equipment');
  const classificationLabels = useClassificationLabels();

  const [form, setForm] = useState({
    equipmentName: '',
    modelName: '',
    manufacturer: '',
    serialNumber: '',
    description: '',
    classification: '' as string,
    // Rental-specific fields
    vendorName: '',
    vendorContact: '',
    externalIdentifier: '',
    // Internal shared-specific fields
    ownerDepartment: '',
    internalContact: '',
    borrowingJustification: '',
    // Common fields
    usagePeriodStart: null as Date | null,
    usagePeriodEnd: null as Date | null,
    reason: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEquipmentImportDto) => equipmentImportApi.create(data),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.lists() }),
        // 반입 신청 생성 시 승인 대기 카운트 증가 → 네비게이션 배지 즉시 갱신
        queryClient.invalidateQueries({ queryKey: queryKeys.approvals.countsAll }),
      ]);
      toast({
        title: t('equipmentImport.toasts.createSuccess'),
        description: t('equipmentImport.toasts.createSuccessDesc'),
      });
      router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(data.id));
    },
    onError: (error) => {
      toast({
        title: t('equipmentImport.toasts.createError'),
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.classification) {
      toast({
        title: t('equipmentImport.toasts.classificationRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (!form.usagePeriodStart || !form.usagePeriodEnd) {
      toast({
        title: t('equipmentImport.toasts.dateRequired'),
        variant: 'destructive',
      });
      return;
    }

    // Build discriminated union DTO based on sourceType
    const baseDto = {
      equipmentName: form.equipmentName,
      modelName: form.modelName || undefined,
      manufacturer: form.manufacturer || undefined,
      serialNumber: form.serialNumber || undefined,
      description: form.description || undefined,
      classification: form.classification,
      usagePeriodStart: form.usagePeriodStart.toISOString(),
      usagePeriodEnd: form.usagePeriodEnd.toISOString(),
      reason: form.reason,
    };

    let dto: CreateEquipmentImportDto;

    if (sourceType === EISrcVal.RENTAL) {
      if (!form.vendorName) {
        toast({
          title: t('equipmentImport.toasts.vendorRequired'),
          variant: 'destructive',
        });
        return;
      }

      dto = {
        ...baseDto,
        sourceType: EISrcVal.RENTAL,
        vendorName: form.vendorName,
        vendorContact: form.vendorContact || undefined,
        externalIdentifier: form.externalIdentifier || undefined,
      } as CreateRentalImportDto;
    } else {
      // internal_shared
      if (!form.ownerDepartment) {
        toast({
          title: t('equipmentImport.toasts.departmentRequired'),
          variant: 'destructive',
        });
        return;
      }

      dto = {
        ...baseDto,
        sourceType: EISrcVal.INTERNAL_SHARED,
        ownerDepartment: form.ownerDepartment,
        internalContact: form.internalContact || undefined,
        borrowingJustification: form.borrowingJustification || undefined,
        externalIdentifier: form.externalIdentifier || undefined,
      } as CreateInternalSharedImportDto;
    }

    createMutation.mutate(dto);
  };

  const handleBack = () => {
    router.push('/checkouts?view=inbound');
  };

  const isRental = sourceType === EISrcVal.RENTAL;
  const isInternalShared = sourceType === EISrcVal.INTERNAL_SHARED;

  return (
    <form onSubmit={handleSubmit} className={getPageContainerClasses('detail')}>
      <PageHeader
        title={
          isRental
            ? t('equipmentImport.createForm.rentalTitle')
            : t('equipmentImport.createForm.internalTitle')
        }
        subtitle={
          isRental
            ? t('equipmentImport.createForm.rentalSubtitle')
            : t('equipmentImport.createForm.internalSubtitle')
        }
        onBack={handleBack}
      />

      {/* 장비 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('equipmentImport.equipmentInfo')}</CardTitle>
          <CardDescription>{t('equipmentImport.equipmentInfoDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="equipmentName">
                {t('equipmentImport.equipmentName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="equipmentName"
                value={form.equipmentName}
                onChange={(e) => setForm({ ...form, equipmentName: e.target.value })}
                required
                placeholder={t('equipmentImport.equipmentNamePlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="classification">
                {t('equipmentImport.classificationLabel')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.classification}
                onValueChange={(value) => setForm({ ...form, classification: value })}
                required
              >
                <SelectTrigger id="classification">
                  <SelectValue placeholder={t('equipmentImport.classificationPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(classificationLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="modelName">{t('equipmentImport.modelName')}</Label>
              <Input
                id="modelName"
                value={form.modelName}
                onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                placeholder={t('equipmentImport.modelNamePlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="manufacturer">{t('equipmentImport.manufacturer')}</Label>
              <Input
                id="manufacturer"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                placeholder={t('equipmentImport.manufacturerPlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="serialNumber">{t('equipmentImport.serialNumber')}</Label>
              <Input
                id="serialNumber"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                placeholder={t('equipmentImport.serialNumberPlaceholder')}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description">{t('equipmentImport.description')}</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder={t('equipmentImport.descriptionPlaceholder')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional Source Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isRental
              ? t('equipmentImport.rentalVendorInfo')
              : t('equipmentImport.ownerDepartmentInfo')}
          </CardTitle>
          <CardDescription>
            {isRental
              ? t('equipmentImport.rentalVendorInfoDesc')
              : t('equipmentImport.ownerDepartmentInfoDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {isRental && (
              <>
                <div className="sm:col-span-2">
                  <Label htmlFor="vendorName">
                    {t('equipmentImport.vendorName')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="vendorName"
                    value={form.vendorName}
                    onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                    required
                    placeholder={t('equipmentImport.vendorNamePlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="vendorContact">{t('equipmentImport.vendorContact')}</Label>
                  <Input
                    id="vendorContact"
                    value={form.vendorContact}
                    onChange={(e) => setForm({ ...form, vendorContact: e.target.value })}
                    placeholder={t('equipmentImport.vendorContactPlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="externalIdentifier">
                    {t('equipmentImport.vendorEquipmentNumber')}
                  </Label>
                  <Input
                    id="externalIdentifier"
                    value={form.externalIdentifier}
                    onChange={(e) => setForm({ ...form, externalIdentifier: e.target.value })}
                    placeholder={t('equipmentImport.vendorEquipmentNumberPlaceholder')}
                  />
                </div>
              </>
            )}

            {isInternalShared && (
              <>
                <div className="sm:col-span-2">
                  <Label htmlFor="ownerDepartment">
                    {t('equipmentImport.ownerDepartment')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ownerDepartment"
                    value={form.ownerDepartment}
                    onChange={(e) => setForm({ ...form, ownerDepartment: e.target.value })}
                    required
                    placeholder={t('equipmentImport.ownerDepartmentPlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="internalContact">{t('equipmentImport.internalContact')}</Label>
                  <Input
                    id="internalContact"
                    value={form.internalContact}
                    onChange={(e) => setForm({ ...form, internalContact: e.target.value })}
                    placeholder={t('equipmentImport.internalContactPlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="externalIdentifier">
                    {t('equipmentImport.sourceIdentifier')}
                  </Label>
                  <Input
                    id="externalIdentifier"
                    value={form.externalIdentifier}
                    onChange={(e) => setForm({ ...form, externalIdentifier: e.target.value })}
                    placeholder={t('equipmentImport.sourceIdentifierPlaceholder')}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Period & Reason */}
      <Card>
        <CardHeader>
          <CardTitle>{t('equipmentImport.usagePeriodAndReason')}</CardTitle>
          <CardDescription>{t('equipmentImport.usagePeriodAndReasonDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="usagePeriodStart">
                {t('equipmentImport.usagePeriodStart')} <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                selected={form.usagePeriodStart ?? undefined}
                onSelect={(date) => setForm({ ...form, usagePeriodStart: date ?? null })}
                placeholder={t('equipmentImport.startDatePlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="usagePeriodEnd">
                {t('equipmentImport.usagePeriodEnd')} <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                selected={form.usagePeriodEnd ?? undefined}
                onSelect={(date) => setForm({ ...form, usagePeriodEnd: date ?? null })}
                placeholder={t('equipmentImport.endDatePlaceholder')}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="reason">
                {isInternalShared
                  ? t('equipmentImport.importReasonBrief')
                  : t('equipmentImport.importReason')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
                required
                placeholder={
                  isRental
                    ? t('equipmentImport.rentalReasonPlaceholder')
                    : t('equipmentImport.internalReasonPlaceholder')
                }
              />
            </div>

            {isInternalShared && (
              <div className="sm:col-span-2">
                <Label htmlFor="borrowingJustification">
                  {t('equipmentImport.detailedReasonLabel')}
                </Label>
                <Textarea
                  id="borrowingJustification"
                  value={form.borrowingJustification}
                  onChange={(e) => setForm({ ...form, borrowingJustification: e.target.value })}
                  rows={4}
                  placeholder={t('equipmentImport.detailedReasonPlaceholder')}
                />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleBack}>
            {t('equipmentImport.createForm.cancelButton')}
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending
              ? t('equipmentImport.createForm.submitting')
              : t('equipmentImport.createForm.submitButton')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
