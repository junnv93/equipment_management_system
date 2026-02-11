'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { useUpdateEquipment } from '@/hooks/use-equipment';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { ApiError, EquipmentErrorCode } from '@/lib/errors/equipment-errors';
import type { UpdateEquipmentInput } from '@equipment-management/schemas';
import type { Equipment } from '@/lib/api/equipment-api';

interface EditEquipmentClientProps {
  /**
   * Server Component에서 fetch한 장비 데이터
   */
  equipment: Equipment;
}

/**
 * 장비 수정 Client Component
 *
 * Next.js 16 패턴:
 * - Server Component(page.tsx)에서 장비 데이터를 fetch하여 전달
 * - 폼 제출, 에러 처리 등 클라이언트 로직 담당
 */
export function EditEquipmentClient({ equipment }: EditEquipmentClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const updateEquipment = useUpdateEquipment();

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(equipment.id);

  // 에러 상태 관리
  const [submitError, setSubmitError] = useState<ApiError | Error | null>(null);

  const handleSubmit = async (data: UpdateEquipmentInput, files?: Array<{ file: File }>) => {
    // 에러 상태 초기화
    setSubmitError(null);

    try {
      const fileList = files?.map((f) => f.file);
      const result = await updateEquipment.mutateAsync({
        id: equipmentId,
        data: { ...data, version: equipment.version ?? 1 },
        files: fileList,
      });

      // 승인 요청이 생성된 경우
      if ((result as { requestUuid?: string }).requestUuid) {
        toast({
          title: '수정 요청 완료',
          description: '장비 수정 요청이 제출되었습니다. 기술책임자의 승인을 기다려주세요.',
        });
      } else {
        toast({
          title: '수정 완료',
          description: '장비 정보가 성공적으로 수정되었습니다.',
        });
      }

      router.push(`/equipment/${equipmentId}`);
    } catch (error) {
      console.error('Failed to update equipment:', error);

      // ApiError인 경우 상세 정보 유지
      if (error instanceof ApiError) {
        setSubmitError(error);
      } else if (error instanceof Error) {
        setSubmitError(error);
      } else {
        setSubmitError(
          new ApiError(
            '장비 수정 중 알 수 없는 오류가 발생했습니다.',
            EquipmentErrorCode.UNKNOWN_ERROR
          )
        );
      }

      // 간단한 toast도 표시
      toast({
        title: '수정 실패',
        description:
          error instanceof ApiError ? error.getUserMessage() : '장비 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 장비 데이터를 폼에 맞게 변환
  const initialData = {
    uuid: equipmentId,
    name: equipment.name || undefined,
    managementNumber: equipment.managementNumber || undefined,
    assetNumber: equipment.assetNumber || undefined,
    modelName: equipment.modelName || undefined,
    manufacturer: equipment.manufacturer || undefined,
    manufacturerContact: (equipment as Record<string, unknown>).manufacturerContact as
      | string
      | undefined,
    serialNumber: equipment.serialNumber || undefined,
    location: equipment.location || undefined,
    description: equipment.description || undefined,
    calibrationCycle: equipment.calibrationCycle || undefined,
    lastCalibrationDate: equipment.lastCalibrationDate
      ? new Date(equipment.lastCalibrationDate).toISOString().split('T')[0]
      : undefined,
    nextCalibrationDate: equipment.nextCalibrationDate
      ? new Date(equipment.nextCalibrationDate).toISOString().split('T')[0]
      : undefined,
    calibrationAgency: equipment.calibrationAgency || undefined,
    needsIntermediateCheck: equipment.needsIntermediateCheck || false,
    calibrationMethod: equipment.calibrationMethod || undefined,
    lastIntermediateCheckDate: (equipment as Record<string, unknown>).lastIntermediateCheckDate
      ? new Date((equipment as Record<string, unknown>).lastIntermediateCheckDate as string)
          .toISOString()
          .split('T')[0]
      : undefined,
    intermediateCheckCycle: (equipment as Record<string, unknown>).intermediateCheckCycle as
      | number
      | undefined,
    nextIntermediateCheckDate: (equipment as Record<string, unknown>).nextIntermediateCheckDate
      ? new Date((equipment as Record<string, unknown>).nextIntermediateCheckDate as string)
          .toISOString()
          .split('T')[0]
      : undefined,
    purchaseYear: equipment.purchaseYear || undefined,
    teamId: typeof equipment.teamId === 'number' ? equipment.teamId : equipment.teamId || undefined,
    site: equipment.site || undefined,
    supplier: equipment.supplier || undefined,
    contactInfo: equipment.contactInfo || undefined,
    softwareVersion: equipment.softwareVersion || undefined,
    firmwareVersion: equipment.firmwareVersion || undefined,
    manualLocation: equipment.manualLocation || undefined,
    accessories: equipment.accessories || undefined,
    technicalManager: equipment.technicalManager || undefined,
    initialLocation: (equipment as Record<string, unknown>).initialLocation as string | undefined,
    installationDate: (equipment as Record<string, unknown>).installationDate
      ? new Date((equipment as Record<string, unknown>).installationDate as string)
          .toISOString()
          .split('T')[0]
      : undefined,
    status: equipment.status || undefined,
    calibrationResult: equipment.calibrationResult || undefined,
    correctionFactor: equipment.correctionFactor || undefined,
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/equipment/${equipmentId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Edit3 className="h-6 w-6 text-primary" />
            장비 수정
          </h1>
          <p className="text-muted-foreground text-sm">{equipment.name}의 정보를 수정합니다</p>
        </div>
      </div>

      {/* 에러 알림 */}
      {submitError && (
        <ErrorAlert
          error={submitError}
          onRetry={() => setSubmitError(null)}
          onDismiss={() => setSubmitError(null)}
          showDetails={true}
          showSolutions={true}
        />
      )}

      {/* 폼 */}
      <EquipmentForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/equipment/${equipmentId}`)}
        isEdit={true}
        isLoading={updateEquipment.isPending}
      />
    </div>
  );
}
