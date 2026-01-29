'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, FileOutput, Calendar, ArrowRight, User } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import checkoutApi, { type CreateCheckoutDto, type Checkout } from '@/lib/api/checkout-api';
import dayjs from 'dayjs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';

// 반출 신청 스키마
const checkoutSchema = z.object({
  destination: z.string().min(1, '반출 장소를 입력하세요').max(200),
  purpose: z.enum(['calibration', 'repair', 'rental']),
  reason: z.string().min(1, '반출 사유를 입력하세요').max(500),
  expectedReturnDate: z.string().min(1, '반입 예정일을 입력하세요'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutHistoryTabProps {
  equipment: Equipment;
}

const PURPOSE_LABELS: Record<string, string> = {
  calibration: '교정',
  repair: '수리',
  rental: '외부 대여',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
  checked_out: '반출 중',
  returned: '반입 검사 중',
  return_approved: '반입 완료',
  overdue: '연체',
  canceled: '취소됨',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
  checked_out: 'secondary',
  returned: 'secondary',
  return_approved: 'default',
  overdue: 'destructive',
  canceled: 'outline',
};

/**
 * 반출 이력 탭 - 테이블 + 타임라인 UI
 *
 * 기능:
 * - 해당 장비의 반출 이력 조회
 * - 반출 신청 (교정/수리/외부대여)
 */
export function CheckoutHistoryTab({ equipment }: CheckoutHistoryTabProps) {
  const { hasRole, user: _user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // 폼 설정
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      destination: '',
      purpose: undefined,
      reason: '',
      expectedReturnDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
      phoneNumber: '',
      address: '',
      notes: '',
    },
  });

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(equipment.id);

  // 반출 이력 조회
  const { data: checkoutsResponse, isLoading } = useQuery({
    queryKey: ['checkouts', 'equipment', equipmentId],
    queryFn: () => checkoutApi.getEquipmentCheckouts(equipmentId),
    enabled: !!equipmentId,
  });

  // 반출 신청
  const createMutation = useMutation({
    mutationFn: (data: CreateCheckoutDto) => checkoutApi.createCheckout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkouts', 'equipment', equipmentId] });
      setIsDialogOpen(false);
      form.reset({
        destination: '',
        purpose: undefined,
        reason: '',
        expectedReturnDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
        phoneNumber: '',
        address: '',
        notes: '',
      });
      toast({
        title: '반출 신청 완료',
        description: '반출 신청이 성공적으로 등록되었습니다. 승인을 기다리고 있습니다.',
      });
    },
    onError: (error: unknown) => {
      console.error('반출 신청 실패:', error);
      toast({
        title: '신청 실패',
        description: getErrorMessage(error, '반출 신청 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: CheckoutFormData) => {
    // 부적합/교정기한초과 장비의 외부 대여 방지
    const STATUS_ONLY_CALIBRATION_REPAIR = ['non_conforming', 'calibration_overdue'];
    const equipmentStatus = equipment.status || 'available';
    if (STATUS_ONLY_CALIBRATION_REPAIR.includes(equipmentStatus) && data.purpose === 'rental') {
      toast({
        title: '반출 불가',
        description:
          '부적합 또는 교정기한 초과 장비는 외부 대여가 불가능합니다. 교정 또는 수리 목적으로만 반출할 수 있습니다.',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({
      equipmentIds: [equipmentId],
      destination: data.destination,
      purpose: data.purpose,
      reason: data.reason,
      expectedReturnDate: data.expectedReturnDate,
      phoneNumber: data.phoneNumber || undefined,
      address: data.address || undefined,
      notes: data.notes || undefined,
    });
  };

  // 등록 권한 확인 (시험실무자 이상)
  const canCreate = hasRole(['test_engineer', 'technical_manager', 'lab_manager', 'system_admin']);

  /**
   * 반출 가능 상태 확인
   *
   * UL-QP-18 기준:
   * - 이미 반출 중(checked_out), 폐기(retired), 사용 중(in_use)인 장비는 반출 불가
   * - 부적합(non_conforming), 교정기한초과(calibration_overdue)인 장비도
   *   교정/수리 목적으로는 반출 가능
   * - 외부 대여(rental)는 available 상태에서만 가능
   */
  const STATUS_NOT_ALLOWED_FOR_CHECKOUT = ['checked_out', 'retired', 'in_use'];
  const STATUS_ONLY_CALIBRATION_REPAIR = ['non_conforming', 'calibration_overdue'];
  const currentStatus = equipment.status || 'available';

  const canCheckoutAnyPurpose = !STATUS_NOT_ALLOWED_FOR_CHECKOUT.includes(currentStatus);
  const canCheckoutOnlyForCalibrationRepair =
    STATUS_ONLY_CALIBRATION_REPAIR.includes(currentStatus);
  const isEquipmentAvailable = currentStatus === 'available';

  // 반출 목록 데이터 (PaginatedResponse<Checkout>는 data 필드 사용)
  const checkouts = checkoutsResponse?.data || [];

  // 버튼 비활성화 사유 메시지
  const getDisabledReason = (): string | null => {
    if (!canCheckoutAnyPurpose) {
      if (currentStatus === 'checked_out') return '이미 반출 중인 장비입니다';
      if (currentStatus === 'retired') return '폐기된 장비입니다';
      if (currentStatus === 'in_use') return '사용 중인 장비입니다';
    }
    return null;
  };

  const disabledReason = getDisabledReason();

  // 등록 Dialog
  const RegisterDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={!canCheckoutAnyPurpose} title={disabledReason || undefined}>
          <Plus className="h-4 w-4 mr-2" />
          반출 신청
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>반출 신청</DialogTitle>
          <DialogDescription>
            장비 반출 정보를 입력하세요. 승인 후 반출이 가능합니다.
            {canCheckoutOnlyForCalibrationRepair && (
              <span className="block mt-2 text-amber-600 dark:text-amber-400">
                ⚠️ 현재 장비 상태({currentStatus === 'non_conforming' ? '부적합' : '교정기한 초과'}
                )로 인해 교정/수리 목적으로만 반출 가능합니다.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>반출 목적 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="목적 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="calibration">교정</SelectItem>
                      <SelectItem value="repair">수리</SelectItem>
                      <SelectItem value="rental" disabled={canCheckoutOnlyForCalibrationRepair}>
                        외부 대여 {canCheckoutOnlyForCalibrationRepair && '(현재 상태에서 불가)'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>반출 장소 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 한국표준과학연구원" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>반출 사유 *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="반출 사유를 상세히 입력하세요" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expectedReturnDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>반입 예정일 *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처</FormLabel>
                    <FormControl>
                      <Input placeholder="010-1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주소</FormLabel>
                    <FormControl>
                      <Input placeholder="반출지 주소" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비고</FormLabel>
                  <FormControl>
                    <Textarea placeholder="추가 참고사항" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '신청 중...' : '반출 신청'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileOutput className="h-5 w-5" />
            반출 이력
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  // 빈 상태
  if (!checkouts || checkouts.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileOutput className="h-5 w-5 text-ul-midnight" />
            반출 이력
          </CardTitle>
          {canCreate && (
            <div className="flex items-center gap-2">
              {!isEquipmentAvailable && (
                <span className="text-sm text-muted-foreground">
                  장비가 사용 가능 상태가 아닙니다
                </span>
              )}
              {RegisterDialog}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <FileOutput className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>등록된 반출 이력이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileOutput className="h-5 w-5 text-ul-midnight" />
          반출 이력
        </CardTitle>
        {canCreate && (
          <div className="flex items-center gap-2">
            {!isEquipmentAvailable && (
              <span className="text-sm text-muted-foreground">
                장비가 사용 가능 상태가 아닙니다
              </span>
            )}
            {RegisterDialog}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* 타임라인 세로선 */}
          <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-800" />

          {checkouts.map((checkout: Checkout, index: number) => (
            <div key={checkout.id} className="relative flex gap-4">
              {/* 타임라인 점 */}
              <div className="relative flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ul-midnight text-white shadow-lg">
                  <FileOutput className="h-6 w-6" />
                </div>
                {index === 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-ul-red text-white px-1.5 py-0.5 text-xs">
                    최신
                  </Badge>
                )}
              </div>

              {/* 컨텐츠 */}
              <div className="flex-1 pb-8">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 헤더: 목적 및 상태 */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {PURPOSE_LABELS[checkout.purpose] || checkout.purpose}
                            </Badge>
                            <Badge variant={STATUS_VARIANTS[checkout.status] || 'outline'}>
                              {STATUS_LABELS[checkout.status] || checkout.status}
                            </Badge>
                          </div>
                          <h4 className="text-lg font-semibold text-ul-midnight dark:text-white">
                            {checkout.destination || checkout.location}
                          </h4>
                        </div>
                      </div>

                      {/* 사유 */}
                      {checkout.reason && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {checkout.reason}
                        </p>
                      )}

                      {/* 날짜 정보 */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {checkout.checkoutDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>반출: {dayjs(checkout.checkoutDate).format('YYYY-MM-DD')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <ArrowRight className="h-4 w-4" />
                          <span>
                            반입 예정: {dayjs(checkout.expectedReturnDate).format('YYYY-MM-DD')}
                          </span>
                        </div>
                        {checkout.actualReturnDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              실제 반입: {dayjs(checkout.actualReturnDate).format('YYYY-MM-DD')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 신청자 정보 */}
                      {checkout.user && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>신청자: {checkout.user.name}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
