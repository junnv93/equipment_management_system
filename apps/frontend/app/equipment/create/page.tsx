'use client';

import { useRouter } from 'next/navigation';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { useCreateEquipment } from '@/hooks/use-equipment';
import { CreateEquipmentInput } from '@equipment-management/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreateEquipmentPage() {
  const router = useRouter();
  const createEquipment = useCreateEquipment();

  const handleSubmit = async (data: CreateEquipmentInput) => {
    try {
      await createEquipment.mutateAsync(data);
      router.push('/equipment');
    } catch (error) {
      // 에러는 훅에서 처리됨
      console.error('Failed to create equipment:', error);
    }
  };

  const handleCancel = () => {
    router.push('/equipment');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">장비 등록</h1>
          <p className="text-muted-foreground">새로운 장비를 시스템에 등록합니다</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>장비 정보 입력</CardTitle>
          <CardDescription>필수 항목(*)을 모두 입력한 후 등록 버튼을 클릭하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <EquipmentForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEdit={false}
            isLoading={createEquipment.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
