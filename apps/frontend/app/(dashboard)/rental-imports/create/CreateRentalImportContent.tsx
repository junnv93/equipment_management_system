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
import rentalImportApi, { CreateRentalImportDtoLegacy } from '@/lib/api/rental-import-api';
type CreateRentalImportDto = CreateRentalImportDtoLegacy;
import { CLASSIFICATION_LABELS, type Classification } from '@equipment-management/schemas';
const classificationOptions = Object.entries(CLASSIFICATION_LABELS) as [Classification, string][];

export default function CreateRentalImportContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    equipmentName: '',
    modelName: '',
    manufacturer: '',
    serialNumber: '',
    description: '',
    classification: '' as string,
    vendorName: '',
    vendorContact: '',
    externalIdentifier: '',
    reason: '',
  });
  const [usagePeriodStart, setUsagePeriodStart] = useState<Date | undefined>();
  const [usagePeriodEnd, setUsagePeriodEnd] = useState<Date | undefined>();

  const createMutation = useMutation({
    mutationFn: (dto: CreateRentalImportDto) => rentalImportApi.create(dto),
    onSuccess: () => {
      toast({ title: '반입 신청이 완료되었습니다.' });
      router.push('/checkouts?view=inbound');
    },
    onError: (error) => {
      toast({
        title: '반입 신청 실패',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!form.equipmentName || !form.classification || !form.vendorName || !form.reason) {
      toast({
        title: '필수 항목을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    if (!usagePeriodStart || !usagePeriodEnd) {
      toast({
        title: '사용 기간을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({
      equipmentName: form.equipmentName,
      modelName: form.modelName || undefined,
      manufacturer: form.manufacturer || undefined,
      serialNumber: form.serialNumber || undefined,
      description: form.description || undefined,
      classification: form.classification,
      vendorName: form.vendorName,
      vendorContact: form.vendorContact || undefined,
      externalIdentifier: form.externalIdentifier || undefined,
      usagePeriodStart: usagePeriodStart.toISOString(),
      usagePeriodEnd: usagePeriodEnd.toISOString(),
      reason: form.reason,
    });
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/checkouts?view=inbound')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">렌탈 반입 신청</h1>
          <p className="text-muted-foreground">외부 렌탈 장비 반입을 신청합니다.</p>
        </div>
      </div>

      {/* 섹션 1: 장비 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>장비 정보</CardTitle>
          <CardDescription>반입할 렌탈 장비의 기본 정보를 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="equipmentName">
                장비명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="equipmentName"
                value={form.equipmentName}
                onChange={(e) => updateField('equipmentName', e.target.value)}
                placeholder="예: EMC 수신기"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classification">
                분류 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.classification}
                onValueChange={(value) => updateField('classification', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="분류 선택" />
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
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modelName">모델명</Label>
              <Input
                id="modelName"
                value={form.modelName}
                onChange={(e) => updateField('modelName', e.target.value)}
                placeholder="예: ESR26"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">제조사</Label>
              <Input
                id="manufacturer"
                value={form.manufacturer}
                onChange={(e) => updateField('manufacturer', e.target.value)}
                placeholder="예: R&S"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serialNumber">일련번호</Label>
            <Input
              id="serialNumber"
              value={form.serialNumber}
              onChange={(e) => updateField('serialNumber', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">장비 설명</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 섹션 2: 렌탈 업체 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>렌탈 업체 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vendorName">
                업체명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vendorName"
                value={form.vendorName}
                onChange={(e) => updateField('vendorName', e.target.value)}
                placeholder="예: ABC 장비렌탈"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorContact">연락처</Label>
              <Input
                id="vendorContact"
                value={form.vendorContact}
                onChange={(e) => updateField('vendorContact', e.target.value)}
                placeholder="예: 02-1234-5678"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="externalIdentifier">업체 장비번호</Label>
            <Input
              id="externalIdentifier"
              value={form.externalIdentifier}
              onChange={(e) => updateField('externalIdentifier', e.target.value)}
              placeholder="예: RNT-2026-001"
            />
          </div>
        </CardContent>
      </Card>

      {/* 섹션 3: 사용 기간 */}
      <Card>
        <CardHeader>
          <CardTitle>사용 기간</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                시작일 <span className="text-red-500">*</span>
              </Label>
              <DatePicker selected={usagePeriodStart} onSelect={setUsagePeriodStart} />
            </div>
            <div className="space-y-2">
              <Label>
                종료일 <span className="text-red-500">*</span>
              </Label>
              <DatePicker selected={usagePeriodEnd} onSelect={setUsagePeriodEnd} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 섹션 4: 반입 사유 */}
      <Card>
        <CardHeader>
          <CardTitle>반입 사유</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="reason">
              사유 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={form.reason}
              onChange={(e) => updateField('reason', e.target.value)}
              rows={3}
              placeholder="렌탈 장비가 필요한 사유를 입력하세요."
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push('/checkouts?view=inbound')}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? '신청 중...' : '반입 신청'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
