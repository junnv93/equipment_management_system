'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Building2, ExternalLink, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';
import equipmentApi from '@/lib/api/equipment-api';
import { type CalibrationMethod } from '@equipment-management/schemas';

// 공용장비 등록 스키마
const sharedEquipmentSchema = z.object({
  name: z.string().min(1, '장비명은 필수입니다'),
  managementNumber: z.string().min(1, '관리번호는 필수입니다'),
  sharedSource: z.enum(['safety_lab', 'external'], {
    message: '공용장비 출처를 선택하세요',
  }),
  site: z.enum(['suwon', 'uiwang'], {
    message: '사이트를 선택하세요',
  }),
  sharedSites: z.array(z.enum(['suwon', 'uiwang'])).optional(),
  modelName: z.string().optional(),
  manufacturer: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  calibrationCycle: z.number().optional(),
  lastCalibrationDate: z.string().optional(),
  calibrationAgency: z.string().optional(),
  calibrationMethod: z.enum(['external_calibration', 'self_inspection', 'not_applicable']).optional(),
});

type SharedEquipmentFormData = z.infer<typeof sharedEquipmentSchema>;

/**
 * 공용장비 출처 옵션
 */
const SHARED_SOURCE_OPTIONS = [
  {
    value: 'safety_lab',
    label: 'Safety Lab (사내 공용)',
    description: 'Safety Lab 등 사내 공용장비',
    icon: Building2,
  },
  {
    value: 'external',
    label: '외부 기관',
    description: '외부 기관에서 보유한 장비',
    icon: ExternalLink,
  },
];

/**
 * 교정 방법 라벨
 */
const CALIBRATION_METHOD_LABELS: Record<CalibrationMethod, string> = {
  external_calibration: '외부 교정',
  self_inspection: '자체 점검',
  not_applicable: '비대상',
};

export default function CreateSharedEquipmentPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [files, setFiles] = useState<UploadedFile[]>([]);

  const form = useForm<SharedEquipmentFormData>({
    resolver: zodResolver(sharedEquipmentSchema),
    defaultValues: {
      name: '',
      managementNumber: '',
      sharedSource: 'safety_lab',
      site: 'suwon',
      sharedSites: [],
    },
  });

  // 공용장비 등록 mutation
  const createMutation = useMutation({
    mutationFn: (data: { formData: SharedEquipmentFormData; files: File[] }) =>
      equipmentApi.createSharedEquipment(
        {
          ...data.formData,
          lastCalibrationDate: data.formData.lastCalibrationDate
            ? new Date(data.formData.lastCalibrationDate)
            : undefined,
          calibrationCycle: data.formData.calibrationCycle
            ? Number(data.formData.calibrationCycle)
            : undefined,
        },
        data.files.length > 0 ? data.files : undefined
      ),
    onSuccess: (equipment) => {
      toast({
        title: '공용장비 등록 완료',
        description: `${form.getValues('name')} 장비가 등록되었습니다.`,
      });
      router.push(`/equipment/${equipment.uuid || equipment.id}`);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: '등록 실패',
        description: error?.response?.data?.message || '공용장비 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SharedEquipmentFormData) => {
    const fileList = files.map((f) => f.file);
    createMutation.mutate({ formData: data, files: fileList });
  };

  const selectedSite = form.watch('site');
  const _sharedSites = form.watch('sharedSites') || []; // UI에서 사용 예정

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="h-6 w-6 text-primary" />
            공용장비 등록
          </h1>
          <p className="text-sm text-muted-foreground">
            Safety Lab 등 공용장비를 간소화된 폼으로 등록합니다.
          </p>
        </div>
      </div>

      {/* 공용장비 안내 */}
      <Alert>
        <Share2 className="h-4 w-4" />
        <AlertTitle>공용장비란?</AlertTitle>
        <AlertDescription>
          여러 팀 또는 시험소에서 공동으로 사용하는 장비입니다. 공용장비는 배지로 표시되며, 대여 시 특별한 승인 절차가 적용될 수 있습니다.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 필수 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </span>
                필수 정보
              </CardTitle>
              <CardDescription>공용장비 등록에 필요한 최소 정보입니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        장비명 <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="예: 공용 스펙트럼 분석기" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="managementNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        관리번호 <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="예: SHARED-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sharedSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        공용장비 출처 <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="출처 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SHARED_SOURCE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {SHARED_SOURCE_OPTIONS.find((o) => o.value === field.value)?.description}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="site"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        주 사이트 <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="사이트 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="suwon">수원</SelectItem>
                          <SelectItem value="uiwang">의왕</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>장비가 주로 보관되는 사이트</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 공유 사이트 선택 */}
              <FormField
                control={form.control}
                name="sharedSites"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>공유 사이트 (다중 선택)</FormLabel>
                    <FormDescription>
                      이 장비를 사용할 수 있는 추가 사이트를 선택하세요.
                    </FormDescription>
                    <div className="flex gap-4 mt-2">
                      {(['suwon', 'uiwang'] as const).map((site) => {
                        const isSelected = field.value?.includes(site);
                        const isMainSite = site === selectedSite;

                        return (
                          <div
                            key={site}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`shared-${site}`}
                              checked={isSelected || isMainSite}
                              disabled={isMainSite}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...(field.value || []), site]
                                  : (field.value || []).filter((s) => s !== site);
                                field.onChange(newValue);
                              }}
                            />
                            <label
                              htmlFor={`shared-${site}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                            >
                              {site === 'suwon' ? '수원' : '의왕'}
                              {isMainSite && (
                                <Badge variant="secondary" className="text-xs">
                                  주 사이트
                                </Badge>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 추가 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
                  2
                </span>
                추가 정보 (선택)
              </CardTitle>
              <CardDescription>필요한 경우 추가 정보를 입력할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="modelName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>모델명</FormLabel>
                      <FormControl>
                        <Input placeholder="모델명" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>제조사</FormLabel>
                      <FormControl>
                        <Input placeholder="제조사" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>시리얼넘버</FormLabel>
                      <FormControl>
                        <Input placeholder="시리얼넘버" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>위치</FormLabel>
                      <FormControl>
                        <Input placeholder="장비 위치" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="장비에 대한 추가 설명"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 교정 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
                  3
                </span>
                교정 정보 (선택)
              </CardTitle>
              <CardDescription>교정 관련 정보를 입력할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="calibrationCycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>교정 주기 (개월)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="12"
                          min={1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastCalibrationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>최종 교정일</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="calibrationAgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>교정 기관</FormLabel>
                      <FormControl>
                        <Input placeholder="교정 기관명" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="calibrationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>교정 방법</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="교정 방법 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CALIBRATION_METHOD_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 파일 첨부 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
                  4
                </span>
                파일 첨부 (선택)
              </CardTitle>
              <CardDescription>교정성적서 파일을 첨부할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                files={files}
                onChange={setFiles}
                attachmentType="other"
                label="교정성적서/관련 문서"
                description="PDF, Word, Excel, 이미지 파일 지원 (최대 10개)"
              />
            </CardContent>
          </Card>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              취소
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? '등록 중...' : '공용장비 등록'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
