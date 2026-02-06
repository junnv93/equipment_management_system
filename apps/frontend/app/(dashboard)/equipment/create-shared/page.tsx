'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { EquipmentForm, PendingHistoryData } from '@/components/equipment/EquipmentForm';
import { type UploadedFile } from '@/components/shared/FileUpload';
import equipmentApi, { type CreateEquipmentDto } from '@/lib/api/equipment-api';

/**
 * 공용/렌탈 장비 임시등록 페이지
 *
 * EquipmentForm을 mode='temporary'로 사용하여 임시등록 필드를 표시합니다.
 * 일반 장비 등록(/equipment/create)과 동일한 폼을 공유하되,
 * 임시등록 전용 필드(장비 유형, 소유처, 사용 기간, 교정성적서)를 추가로 표시합니다.
 *
 * 비즈니스 로직:
 * - status='temporary' 자동 설정
 * - isShared=true 자동 설정
 * - 교정 유효성 자동 검증 (차기교정일 > 사용종료일)
 * - 사용 기간 표시 (D-day)
 */
export default function CreateSharedEquipmentPage() {
  const router = useRouter();
  const { toast } = useToast();

  // 공용/렌탈 장비 등록 mutation
  const createMutation = useMutation({
    mutationFn: async ({
      data,
      files,
      pendingHistory,
    }: {
      data: Record<string, unknown>;
      files?: UploadedFile[];
      pendingHistory?: PendingHistoryData;
    }) => {
      // pendingHistory를 data에 포함
      // ✅ Type Safety: CreateEquipmentDto로 명시적 타입 단언
      // pendingHistory는 런타임에 추가되는 임시 필드로, 백엔드에서 처리됨
      const dataWithHistory = {
        ...data,
        ...(pendingHistory && { pendingHistory }),
      } as CreateEquipmentDto;
      const fileList = files?.map((f) => f.file) || [];
      return equipmentApi.createEquipment(dataWithHistory, fileList);
    },
    onSuccess: (equipment) => {
      toast({
        title: '임시등록 완료',
        description: `${equipment.name} 장비가 임시등록되었습니다.`,
      });
      router.push(`/equipment/${equipment.uuid || equipment.id}`);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: '등록 실패',
        description: error?.response?.data?.message || '장비 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (
    data: Record<string, unknown>,
    files?: UploadedFile[],
    pendingHistory?: PendingHistoryData
  ) => {
    await createMutation.mutateAsync({ data, files, pendingHistory });
  };

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
            공용/렌탈 장비 임시등록
          </h1>
          <p className="text-sm text-muted-foreground">
            타 팀 공용장비 또는 외부 렌탈장비를 임시로 등록합니다.
          </p>
        </div>
      </div>

      {/* 공용/렌탈 장비 안내 */}
      <Alert>
        <Share2 className="h-4 w-4" />
        <AlertTitle>임시등록이란?</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <strong>공용장비</strong>: 타 팀(Safety, Battery 등)에서 일시적으로 빌려오는 장비
            </li>
            <li>
              <strong>렌탈장비</strong>: 외부 업체에서 대여하는 장비
            </li>
            <li>
              <strong>교정성적서 필수</strong>: 사용 기간 동안 교정이 유효해야 합니다.
            </li>
            <li>
              <strong>사용 기간 만료 시</strong>: status='inactive'로 전환되어 비활성화됩니다.
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* EquipmentForm (mode='temporary') */}
      <EquipmentForm
        mode="temporary"
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
