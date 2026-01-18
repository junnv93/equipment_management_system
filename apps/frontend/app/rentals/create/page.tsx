'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Info } from 'lucide-react';
import { addDays } from 'date-fns';
import { EquipmentSelector } from '@/components/shared/EquipmentSelector';
import { useEquipment } from '@/hooks/use-equipment';
import { useFormSubmission } from '@/hooks/use-form-submission';
import rentalApi, { CreateRentalDto } from '@/lib/api/rental-api';

export default function CreateRentalPage() {
  const router = useRouter();
  const { toast } = useToast();

  // 상태 관리
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 7));
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // 선택된 장비 정보 조회 (공통 훅 사용)
  const { data: selectedEquipment, isLoading: selectedEquipmentLoading } = useEquipment(
    selectedEquipmentId || ''
  );

  // 대여 신청 뮤테이션 (공통 훅 사용)
  const createRentalMutation = useFormSubmission({
    mutationFn: (data: CreateRentalDto) => rentalApi.createRental(data),
    invalidateQueries: [['rentals']],
    redirectPath: '/rentals',
    successMessage: {
      title: '대여 신청 완료',
      description: '대여 신청이 성공적으로 접수되었습니다.',
    },
    errorMessage: {
      title: '대여 신청 실패',
      description: '대여 신청 중 오류가 발생했습니다.',
    },
  });

  // 대여 신청 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!selectedEquipmentId) {
      toast({
        title: '장비 선택 필요',
        description: '대여할 장비를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!purpose.trim()) {
      toast({
        title: '대여 목적 필요',
        description: '대여 목적을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    // ✅ API_STANDARDS 준수: ISO 형식, 필드명 일치
    const rentalData: CreateRentalDto = {
      equipmentId: selectedEquipmentId,
      startDate: startDate.toISOString(),
      expectedEndDate: endDate.toISOString(),
      purpose: purpose.trim(),
      notes: notes.trim() || undefined,
      // userId는 서버에서 JWT에서 자동으로 가져오므로 보내지 않음
    };

    createRentalMutation.mutate(rentalData);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로 가기
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">장비 대여 신청</h1>
          <p className="text-muted-foreground">필요한 장비를 검색하고 대여 신청서를 작성하세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 장비 검색 및 선택 (공통 컴포넌트 사용) */}
        <div className="md:col-span-1">
          <EquipmentSelector
            selectedEquipmentId={selectedEquipmentId}
            onSelect={setSelectedEquipmentId}
            statusFilter="available"
            maxHeight="400px"
          />
        </div>

        {/* 대여 신청 폼 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>대여 신청서</CardTitle>
            <CardDescription>대여 정보를 입력해주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 선택된 장비 정보 */}
              {selectedEquipmentId ? (
                <div className="p-4 bg-muted rounded-md mb-6">
                  <div className="flex items-start gap-2 mb-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium">선택된 장비</div>
                      <div className="text-muted-foreground">
                        {selectedEquipmentLoading
                          ? '정보를 불러오는 중...'
                          : `${selectedEquipment?.name} (관리번호: ${selectedEquipment?.managementNumber})`}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-md mb-6">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <div className="font-medium">장비 선택 필요</div>
                      <div className="text-muted-foreground">
                        왼쪽 패널에서 대여할 장비를 선택해주세요.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 대여 기간 설정 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">대여 시작일</Label>
                  <DatePicker
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    disabled={(date) => date < new Date()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">반납 예정일</Label>
                  <DatePicker
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    disabled={(date) => date < startDate}
                  />
                </div>
              </div>

              {/* 대여 목적 */}
              <div className="space-y-2">
                <Label htmlFor="purpose">대여 목적</Label>
                <Input
                  id="purpose"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="장비를 대여하는 목적을 입력하세요"
                />
              </div>

              {/* 추가 메모 */}
              <div className="space-y-2">
                <Label htmlFor="notes">추가 메모</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="필요한 추가 정보를 입력하세요 (선택사항)"
                  rows={3}
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              취소
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!selectedEquipmentId || !purpose.trim() || createRentalMutation.isPending}
            >
              {createRentalMutation.isPending ? '처리 중...' : '대여 신청'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
