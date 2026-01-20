'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Upload, Building2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import equipmentApi from '@/lib/api/equipment-api';

interface SharedEquipmentFormData {
  name: string;
  managementNumber: string;
  sharedSource: 'safety_lab' | 'external';
  site: 'suwon' | 'uiwang';
  modelName?: string;
  manufacturer?: string;
  serialNumber?: string;
  location?: string;
  description?: string;
  calibrationCycle?: number;
  lastCalibrationDate?: string;
  calibrationAgency?: string;
  calibrationMethod?: string;
}

export default function CreateSharedEquipmentPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<SharedEquipmentFormData>({
    name: '',
    managementNumber: '',
    sharedSource: 'safety_lab',
    site: 'suwon',
  });

  const [files, setFiles] = useState<File[]>([]);

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
        description: `${formData.name} 장비가 등록되었습니다.`,
      });
      router.push(`/equipment/${equipment.uuid || equipment.id}`);
    },
    onError: (error: any) => {
      toast({
        title: '등록 실패',
        description: error?.response?.data?.message || '공용장비 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.managementNumber) {
      toast({
        title: '입력 오류',
        description: '장비명과 관리번호는 필수 입력 항목입니다.',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({ formData, files });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-3xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">공용장비 등록</h1>
          <p className="text-sm text-muted-foreground">
            Safety Lab 등 공용장비를 간소화된 폼으로 등록합니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 필수 정보 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>필수 정보</CardTitle>
            <CardDescription>공용장비 등록에 필요한 최소 정보입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  장비명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="예: 공용 스펙트럼 분석기"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="managementNumber">
                  관리번호 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="managementNumber"
                  name="managementNumber"
                  value={formData.managementNumber}
                  onChange={handleInputChange}
                  placeholder="예: SHARED-2024-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sharedSource">
                  공용장비 출처 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sharedSource}
                  onValueChange={(value: 'safety_lab' | 'external') =>
                    setFormData((prev) => ({ ...prev, sharedSource: value }))
                  }
                >
                  <SelectTrigger id="sharedSource">
                    <SelectValue placeholder="출처 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safety_lab">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Safety Lab (사내 공용)
                      </div>
                    </SelectItem>
                    <SelectItem value="external">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        외부 기관
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site">
                  사이트 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.site}
                  onValueChange={(value: 'suwon' | 'uiwang') =>
                    setFormData((prev) => ({ ...prev, site: value }))
                  }
                >
                  <SelectTrigger id="site">
                    <SelectValue placeholder="사이트 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suwon">수원</SelectItem>
                    <SelectItem value="uiwang">의왕</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 선택 정보 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>추가 정보 (선택)</CardTitle>
            <CardDescription>필요한 경우 추가 정보를 입력할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelName">모델명</Label>
                <Input
                  id="modelName"
                  name="modelName"
                  value={formData.modelName || ''}
                  onChange={handleInputChange}
                  placeholder="모델명"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturer">제조사</Label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  value={formData.manufacturer || ''}
                  onChange={handleInputChange}
                  placeholder="제조사"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">일련번호</Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber || ''}
                  onChange={handleInputChange}
                  placeholder="일련번호"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">위치</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                  placeholder="장비 위치"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="장비에 대한 추가 설명"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 교정 정보 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>교정 정보 (선택)</CardTitle>
            <CardDescription>교정 관련 정보를 입력할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calibrationCycle">교정 주기 (개월)</Label>
                <Input
                  id="calibrationCycle"
                  name="calibrationCycle"
                  type="number"
                  value={formData.calibrationCycle || ''}
                  onChange={handleInputChange}
                  placeholder="12"
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastCalibrationDate">최종 교정일</Label>
                <Input
                  id="lastCalibrationDate"
                  name="lastCalibrationDate"
                  type="date"
                  value={formData.lastCalibrationDate || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calibrationAgency">교정 기관</Label>
                <Input
                  id="calibrationAgency"
                  name="calibrationAgency"
                  value={formData.calibrationAgency || ''}
                  onChange={handleInputChange}
                  placeholder="교정 기관명"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calibrationMethod">교정 방법</Label>
                <Select
                  value={formData.calibrationMethod || ''}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, calibrationMethod: value }))
                  }
                >
                  <SelectTrigger id="calibrationMethod">
                    <SelectValue placeholder="교정 방법 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external_calibration">외부 교정</SelectItem>
                    <SelectItem value="self_inspection">자체 점검</SelectItem>
                    <SelectItem value="not_applicable">비대상</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 파일 첨부 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>교정성적서 첨부 (선택)</CardTitle>
            <CardDescription>교정성적서 파일을 첨부할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <Label
                htmlFor="files"
                className="cursor-pointer text-sm text-blue-600 hover:text-blue-700"
              >
                파일 선택
              </Label>
              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
              <p className="text-xs text-gray-500 mt-2">
                PDF, Word, Excel, 이미지 파일 지원 (최대 10개)
              </p>
              {files.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-sm font-medium mb-2">선택된 파일:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {files.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? '등록 중...' : '공용장비 등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}
