'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
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
import { ArrowLeft } from 'lucide-react';
import equipmentImportApi, {
  type CreateEquipmentImportDto,
  type CreateRentalImportDto,
  type CreateInternalSharedImportDto,
} from '@/lib/api/equipment-import-api';
import {
  CLASSIFICATION_LABELS,
  type Classification,
  type EquipmentImportSource,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

const classificationOptions = Object.entries(CLASSIFICATION_LABELS) as [Classification, string][];

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
  const { toast } = useToast();

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
    onSuccess: (data) => {
      toast({
        title: '반입 신청이 완료되었습니다.',
        description: '승인 대기 중입니다.',
      });
      router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(data.id));
    },
    onError: (error) => {
      toast({
        title: '반입 신청 실패',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.classification) {
      toast({
        title: '분류를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!form.usagePeriodStart || !form.usagePeriodEnd) {
      toast({
        title: '사용 기간을 입력해주세요.',
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

    if (sourceType === 'rental') {
      if (!form.vendorName) {
        toast({
          title: '렌탈 업체명을 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }

      dto = {
        ...baseDto,
        sourceType: 'rental',
        vendorName: form.vendorName,
        vendorContact: form.vendorContact || undefined,
        externalIdentifier: form.externalIdentifier || undefined,
      } as CreateRentalImportDto;
    } else {
      // internal_shared
      if (!form.ownerDepartment) {
        toast({
          title: '소유 부서를 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }

      dto = {
        ...baseDto,
        sourceType: 'internal_shared',
        ownerDepartment: form.ownerDepartment,
        internalContact: form.internalContact || undefined,
        borrowingJustification: form.borrowingJustification || undefined,
      } as CreateInternalSharedImportDto;
    }

    createMutation.mutate(dto);
  };

  const handleBack = () => {
    if (sourceType === 'rental') {
      router.push('/checkouts?view=inbound');
    } else {
      router.push('/checkouts?view=inbound');
    }
  };

  const isRental = sourceType === 'rental';
  const isInternalShared = sourceType === 'internal_shared';

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isRental ? '외부 렌탈 반입 신청' : '내부 공용장비 반입 신청'}
          </h1>
          <p className="text-muted-foreground">
            {isRental
              ? '외부 업체로부터 렌탈 장비를 반입합니다.'
              : '타 부서의 공용장비를 임시로 반입합니다.'}
          </p>
        </div>
      </div>

      {/* 장비 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>장비 정보</CardTitle>
          <CardDescription>반입할 장비의 기본 정보를 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="equipmentName">
                장비명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="equipmentName"
                value={form.equipmentName}
                onChange={(e) => setForm({ ...form, equipmentName: e.target.value })}
                required
                placeholder="예: Spectrum Analyzer"
              />
            </div>

            <div>
              <Label htmlFor="classification">
                분류 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.classification}
                onValueChange={(value) => setForm({ ...form, classification: value })}
                required
              >
                <SelectTrigger id="classification">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {classificationOptions.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="modelName">모델명</Label>
              <Input
                id="modelName"
                value={form.modelName}
                onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                placeholder="예: RSA5000B"
              />
            </div>

            <div>
              <Label htmlFor="manufacturer">제조사</Label>
              <Input
                id="manufacturer"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                placeholder="예: Tektronix"
              />
            </div>

            <div>
              <Label htmlFor="serialNumber">일련번호</Label>
              <Input
                id="serialNumber"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                placeholder="예: B012345"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="장비에 대한 추가 설명을 입력하세요."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional Source Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>{isRental ? '렌탈 업체 정보' : '소유 부서 정보'}</CardTitle>
          <CardDescription>
            {isRental
              ? '렌탈 업체의 정보를 입력하세요.'
              : '장비를 소유한 부서의 정보를 입력하세요.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {isRental && (
              <>
                <div className="sm:col-span-2">
                  <Label htmlFor="vendorName">
                    렌탈 업체명 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vendorName"
                    value={form.vendorName}
                    onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                    required
                    placeholder="예: ABC 렌탈"
                  />
                </div>

                <div>
                  <Label htmlFor="vendorContact">업체 연락처</Label>
                  <Input
                    id="vendorContact"
                    value={form.vendorContact}
                    onChange={(e) => setForm({ ...form, vendorContact: e.target.value })}
                    placeholder="예: 02-1234-5678"
                  />
                </div>

                <div>
                  <Label htmlFor="externalIdentifier">업체 장비번호</Label>
                  <Input
                    id="externalIdentifier"
                    value={form.externalIdentifier}
                    onChange={(e) => setForm({ ...form, externalIdentifier: e.target.value })}
                    placeholder="업체에서 관리하는 장비번호"
                  />
                </div>
              </>
            )}

            {isInternalShared && (
              <>
                <div className="sm:col-span-2">
                  <Label htmlFor="ownerDepartment">
                    소유 부서 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ownerDepartment"
                    value={form.ownerDepartment}
                    onChange={(e) => setForm({ ...form, ownerDepartment: e.target.value })}
                    required
                    placeholder="예: Safety Lab, Battery Lab"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="internalContact">담당자 연락처</Label>
                  <Input
                    id="internalContact"
                    value={form.internalContact}
                    onChange={(e) => setForm({ ...form, internalContact: e.target.value })}
                    placeholder="예: 홍길동 (내선 1234)"
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
          <CardTitle>사용 기간 및 사유</CardTitle>
          <CardDescription>장비를 사용할 기간과 반입 사유를 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="usagePeriodStart">
                사용 시작일 <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={form.usagePeriodStart ?? undefined}
                onSelect={(date) => setForm({ ...form, usagePeriodStart: date ?? null })}
                placeholder="시작일 선택"
              />
            </div>

            <div>
              <Label htmlFor="usagePeriodEnd">
                사용 종료일 <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={form.usagePeriodEnd ?? undefined}
                onSelect={(date) => setForm({ ...form, usagePeriodEnd: date ?? null })}
                placeholder="종료일 선택"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="reason">
                {isInternalShared ? '반입 사유 (간략)' : '반입 사유'}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
                required
                placeholder={
                  isRental ? '렌탈 반입 사유를 입력하세요.' : '간략한 반입 사유를 입력하세요.'
                }
              />
            </div>

            {isInternalShared && (
              <div className="sm:col-span-2">
                <Label htmlFor="borrowingJustification">반입 사유 (상세)</Label>
                <Textarea
                  id="borrowingJustification"
                  value={form.borrowingJustification}
                  onChange={(e) => setForm({ ...form, borrowingJustification: e.target.value })}
                  rows={4}
                  placeholder="반입이 필요한 상세한 배경과 사유를 입력하세요."
                />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleBack}>
            취소
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? '신청 중...' : '반입 신청'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
