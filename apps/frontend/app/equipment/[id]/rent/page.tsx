'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import equipmentApi from '@/lib/api/equipment-api';
import rentalApi, { CreateRentalDto } from '@/lib/api/rental-api';

export default function EquipmentRentPage() {
  const router = useRouter();
  const params = useParams();
  const equipmentId = params.id as string;
  const { toast } = useToast();

  // 장비 정보 가져오기
  const {
    data: equipment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    enabled: !!equipmentId,
  });

  // 폼 상태 관리
  const [formData, setFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    purpose: '',
    location: '',
    type: 'RENTAL',
    notes: '',
  });

  // 대여 신청 mutation
  const createRentalMutation = useMutation({
    mutationFn: (rentalData: CreateRentalDto) => rentalApi.createRental(rentalData),
    onSuccess: () => {
      toast({
        title: '신청 완료',
        description: '장비 대여 신청이 완료되었습니다.',
      });
      router.push(`/equipment/${equipmentId}`);
    },
    onError: (error: any) => {
      toast({
        title: '신청 실패',
        description: error?.message || '장비 대여 신청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 입력값 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 폼 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ 백엔드 API에 맞게 수정
    // userId는 서버에서 JWT에서 자동으로 가져오므로 프론트엔드에서 보내지 않음
    const rentalData: CreateRentalDto = {
      equipmentId,
      startDate: formData.startDate,
      expectedEndDate: formData.dueDate, // ✅ 필드명 변경 (dueDate → expectedEndDate)
      purpose: formData.purpose,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    };

    createRentalMutation.mutate(rentalData);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p>장비 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError || !equipment) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center text-red-500">
          <p className="text-lg font-bold mb-2">오류 발생</p>
          <p>장비 정보를 불러오는 데 실패했습니다.</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            뒤로 가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 상단 헤더 */}
      <div className="flex items-center">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">장비 대여 신청</h1>
      </div>

      {/* 장비 정보 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>장비 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">장비명</p>
              <p className="font-medium">{equipment.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">관리번호</p>
              <p className="font-medium">{equipment.managementNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">분류</p>
              <p className="font-medium">{(equipment as any).category || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">상태</p>
              <p className="font-medium">
                {equipment.status === 'available' ? '대여 가능' : '대여 불가'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 대여 신청 폼 */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>대여 정보 입력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 대여 시작일 */}
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-sm font-medium">
                  대여 시작일
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                    <Calendar className="h-4 w-4 text-gray-500" />
                  </span>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="rounded-l-none"
                    required
                  />
                </div>
              </div>

              {/* 대여 종료일 */}
              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium">
                  반납 예정일
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                    <Calendar className="h-4 w-4 text-gray-500" />
                  </span>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="rounded-l-none"
                    required
                  />
                </div>
              </div>

              {/* 대여 목적 */}
              <div className="space-y-2">
                <label htmlFor="purpose" className="text-sm font-medium">
                  대여 목적
                </label>
                <Input
                  id="purpose"
                  name="purpose"
                  placeholder="대여 목적을 입력하세요"
                  value={formData.purpose}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* 대여 유형 */}
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">
                  대여 유형
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="대여 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RENTAL">사내 사용</SelectItem>
                    <SelectItem value="CHECKOUT">사외 반출</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 사용 위치 */}
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  사용 위치
                </label>
                <Input
                  id="location"
                  name="location"
                  placeholder="장비를 사용할 위치를 입력하세요"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* 비고 */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  비고
                </label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="추가 요청사항이 있으면 입력하세요"
                  value={formData.notes}
                  onChange={handleChange}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                취소
              </Button>
              <Button type="submit" disabled={createRentalMutation.isPending}>
                {createRentalMutation.isPending ? '처리 중...' : '대여 신청'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
