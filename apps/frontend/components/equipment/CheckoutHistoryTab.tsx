'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-config';
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
import { addDays } from 'date-fns';
import { useTranslations } from 'next-intl';
import { formatDate } from '@/lib/utils/date';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import {
  EquipmentStatusValues as ESVal,
  UserRoleValues as URVal,
} from '@equipment-management/schemas';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';
import {
  TIMELINE_TOKENS,
  getTimelineCardClasses,
  getSemanticSolidBgClasses,
} from '@/lib/design-tokens';
import { STATUS_NOT_ALLOWED_FOR_CHECKOUT } from '@/lib/constants/equipment-status-styles';

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

// PURPOSE_LABELS are now provided via useTranslations('equipment').checkoutHistoryTab.purpose

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
  const t = useTranslations('equipment');

  // 폼 설정
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      destination: '',
      purpose: undefined,
      reason: '',
      expectedReturnDate: formatDate(addDays(new Date(), 7), 'yyyy-MM-dd'),
      phoneNumber: '',
      address: '',
      notes: '',
    },
  });

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(equipment.id);

  // 반출 이력 조회
  const { data: checkoutsResponse, isLoading } = useQuery({
    queryKey: queryKeys.checkouts.byEquipment(equipmentId),
    queryFn: () => checkoutApi.getEquipmentCheckouts(equipmentId),
    enabled: !!equipmentId,
  });

  // 반출 신청
  const createMutation = useMutation({
    mutationFn: (data: CreateCheckoutDto) => checkoutApi.createCheckout(data),
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset({
        destination: '',
        purpose: undefined,
        reason: '',
        expectedReturnDate: formatDate(addDays(new Date(), 7), 'yyyy-MM-dd'),
        phoneNumber: '',
        address: '',
        notes: '',
      });
      toast({
        title: t('checkoutHistoryTab.toasts.success'),
        description: t('checkoutHistoryTab.toasts.successDesc'),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.byEquipment(equipmentId) });
    },
    onError: (error: unknown) => {
      console.error('반출 신청 실패:', error);
      toast({
        title: t('checkoutHistoryTab.toasts.error'),
        description: getErrorMessage(error, t('checkoutHistoryTab.toasts.errorDesc')),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: CheckoutFormData) => {
    // 부적합/교정기한초과 장비의 외부 대여 방지
    const STATUS_ONLY_CALIBRATION_REPAIR: string[] = [
      ESVal.NON_CONFORMING,
      ESVal.CALIBRATION_OVERDUE,
    ];
    const equipmentStatus = equipment.status || ESVal.AVAILABLE;
    if (STATUS_ONLY_CALIBRATION_REPAIR.includes(equipmentStatus) && data.purpose === 'rental') {
      toast({
        title: t('checkoutHistoryTab.toasts.rentalNotAllowed'),
        description: t('checkoutHistoryTab.toasts.rentalNotAllowedDesc'),
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
  const canCreate = hasRole([
    URVal.TEST_ENGINEER,
    URVal.TECHNICAL_MANAGER,
    URVal.LAB_MANAGER,
    URVal.SYSTEM_ADMIN,
  ]);

  /**
   * 반출 가능 상태 확인
   *
   * UL-QP-18 기준:
   * - 이미 반출 중(checked_out), 폐기(retired), 사용 중(in_use)인 장비는 반출 불가
   * - 부적합(non_conforming), 교정기한초과(calibration_overdue)인 장비도
   *   교정/수리 목적으로는 반출 가능
   * - 외부 대여(rental)는 available 상태에서만 가능
   */
  // SSOT: STATUS_NOT_ALLOWED_FOR_CHECKOUT (lib/constants/equipment-status-styles.ts)
  const STATUS_ONLY_CALIBRATION_REPAIR: string[] = [
    ESVal.NON_CONFORMING,
    ESVal.CALIBRATION_OVERDUE,
  ];
  const currentStatus = equipment.status || ESVal.AVAILABLE;

  const canCheckoutAnyPurpose = !STATUS_NOT_ALLOWED_FOR_CHECKOUT.includes(
    currentStatus as (typeof STATUS_NOT_ALLOWED_FOR_CHECKOUT)[number]
  );
  const canCheckoutOnlyForCalibrationRepair =
    STATUS_ONLY_CALIBRATION_REPAIR.includes(currentStatus);
  const isEquipmentAvailable = currentStatus === ESVal.AVAILABLE;

  // 반출 목록 데이터 (PaginatedResponse<Checkout>는 data 필드 사용)
  const checkouts = checkoutsResponse?.data || [];

  // 버튼 비활성화 사유 메시지
  const getDisabledReason = (): string | null => {
    if (!canCheckoutAnyPurpose) {
      if (currentStatus === ESVal.CHECKED_OUT)
        return t('checkoutHistoryTab.disabledReasons.checked_out');
      if (currentStatus === ESVal.RETIRED) return t('checkoutHistoryTab.disabledReasons.retired');
      if (currentStatus === ESVal.IN_USE) return t('checkoutHistoryTab.disabledReasons.in_use');
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
          {t('checkoutHistoryTab.register')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('checkoutHistoryTab.dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('checkoutHistoryTab.dialog.description')}
            {canCheckoutOnlyForCalibrationRepair && (
              <span className="block mt-2 text-brand-warning">
                {t('checkoutHistoryTab.dialog.restrictedWarning', {
                  status: t(`status.${currentStatus}`),
                })}
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
                  <FormLabel>{t('checkoutHistoryTab.dialog.purpose')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('checkoutHistoryTab.dialog.purposePlaceholder')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="calibration">
                        {t('checkoutHistoryTab.purpose.calibration')}
                      </SelectItem>
                      <SelectItem value="repair">
                        {t('checkoutHistoryTab.purpose.repair')}
                      </SelectItem>
                      <SelectItem value="rental" disabled={canCheckoutOnlyForCalibrationRepair}>
                        {canCheckoutOnlyForCalibrationRepair
                          ? t('checkoutHistoryTab.dialog.rentalDisabled')
                          : t('checkoutHistoryTab.purpose.rental')}
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
                  <FormLabel>{t('checkoutHistoryTab.dialog.destination')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('checkoutHistoryTab.dialog.destinationPlaceholder')}
                      {...field}
                      value={field.value || ''}
                    />
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
                  <FormLabel>{t('checkoutHistoryTab.dialog.reason')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('checkoutHistoryTab.dialog.reasonPlaceholder')}
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
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
                  <FormLabel>{t('checkoutHistoryTab.dialog.expectedReturnDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
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
                    <FormLabel>{t('checkoutHistoryTab.dialog.phoneNumber')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('checkoutHistoryTab.dialog.phonePlaceholder')}
                        {...field}
                        value={field.value || ''}
                      />
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
                    <FormLabel>{t('checkoutHistoryTab.dialog.address')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('checkoutHistoryTab.dialog.addressPlaceholder')}
                        {...field}
                        value={field.value || ''}
                      />
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
                  <FormLabel>{t('checkoutHistoryTab.dialog.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('checkoutHistoryTab.dialog.notesPlaceholder')}
                      rows={2}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('checkoutHistoryTab.dialog.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? t('checkoutHistoryTab.dialog.submitting')
                  : t('checkoutHistoryTab.dialog.submit')}
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
            {t('checkoutHistoryTab.title')}
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
            <FileOutput className="h-5 w-5 text-brand-info" />
            {t('checkoutHistoryTab.title')}
          </CardTitle>
          {canCreate && (
            <div className="flex items-center gap-2">
              {!isEquipmentAvailable && (
                <span className="text-sm text-muted-foreground">
                  {t('checkoutHistoryTab.notAvailable')}
                </span>
              )}
              {RegisterDialog}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className={TIMELINE_TOKENS.empty.container}>
            <FileOutput className={TIMELINE_TOKENS.empty.icon} />
            <p className={TIMELINE_TOKENS.empty.text}>{t('checkoutHistoryTab.empty')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileOutput className="h-5 w-5 text-brand-info" />
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
        <div className={`relative ${TIMELINE_TOKENS.spacing.itemGap}`}>
          {/* 타임라인 세로선 */}
          <div className={`${TIMELINE_TOKENS.line.container} ${TIMELINE_TOKENS.line.color}`} />

          {checkouts.map((checkout: Checkout, index: number) => (
            <div key={checkout.id} className="relative flex gap-4">
              {/* 타임라인 점 */}
              <div className="relative flex-shrink-0">
                <div
                  className={`${TIMELINE_TOKENS.node.container} ${getSemanticSolidBgClasses('info')} shadow-lg`}
                >
                  <FileOutput className={TIMELINE_TOKENS.node.icon} />
                </div>
                {index === 0 && (
                  <Badge
                    className={`absolute -top-2 -right-2 ${TIMELINE_TOKENS.latestBadge.classes}`}
                  >
                    {t('checkoutHistoryTab.latest')}
                  </Badge>
                )}
              </div>

              {/* 컨텐츠 */}
              <div className="flex-1 pb-8">
                <Card className={getTimelineCardClasses()}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 헤더: 목적 및 상태 */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {t(`checkoutHistoryTab.purpose.${checkout.purpose}` as const)}
                            </Badge>
                            <CheckoutStatusBadge status={checkout.status} />
                          </div>
                          <h4 className="text-lg font-semibold text-foreground">
                            {checkout.destination || checkout.location}
                          </h4>
                        </div>
                      </div>

                      {/* 사유 */}
                      {checkout.reason && (
                        <p className="text-sm text-muted-foreground">{checkout.reason}</p>
                      )}

                      {/* 날짜 정보 */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {checkout.checkoutDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {t('checkoutHistoryTab.dates.checkout', {
                                date: formatDate(checkout.checkoutDate, 'yyyy-MM-dd'),
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <ArrowRight className="h-4 w-4" />
                          <span>
                            {t('checkoutHistoryTab.dates.expectedReturn', {
                              date: formatDate(checkout.expectedReturnDate, 'yyyy-MM-dd'),
                            })}
                          </span>
                        </div>
                        {checkout.actualReturnDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {t('checkoutHistoryTab.dates.actualReturn', {
                                date: formatDate(checkout.actualReturnDate, 'yyyy-MM-dd'),
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 신청자 정보 */}
                      {checkout.user && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            {t('checkoutHistoryTab.applicant', { name: checkout.user.name })}
                          </span>
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
