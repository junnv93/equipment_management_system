'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n/client';
import { 
  Reservation, 
  ReservationStatus,
  UpdateReservationSchema, 
  UpdateReservationData 
} from '@/lib/types/reservation';
import { useUpdateReservation } from '@/hooks/use-reservations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon } from 'lucide-react';

interface ReservationEditFormProps {
  reservation: Reservation;
  locale: string;
}

export function ReservationEditForm({ 
  reservation,
  locale
}: ReservationEditFormProps) {
  const { t } = useTranslation('reservations');
  const router = useRouter();
  const { toast } = useToast();
  const dateLocale = locale === 'ko' ? ko : enUS;
  const dateFormat = locale === 'ko' ? 'PPP' : 'PP';
  
  // 이미 처리된 예약인지 확인
  const isProcessed = reservation.status !== ReservationStatus.PENDING;
  
  // React Hook Form + Zod 설정
  const form = useForm<UpdateReservationData>({
    resolver: zodResolver(UpdateReservationSchema),
    defaultValues: {
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      purpose: reservation.purpose,
      notes: reservation.notes || '',
    },
  });
  
  // 예약 상태 업데이트 뮤테이션
  const updateReservation = useUpdateReservation();
  
  // 폼 제출 처리
  const onSubmit = async (data: UpdateReservationData) => {
    try {
      await updateReservation.mutateAsync({
        id: reservation.id,
        data
      });
      
      toast({
        title: t('edit.updateSuccess'),
        description: t('edit.reservationUpdated'),
      });
      
      router.push(`/reservations/${reservation.id}`);
    } catch (error) {
      console.error('Failed to update reservation:', error);
      toast({
        title: t('edit.updateError'),
        description: t('edit.tryAgain'),
        variant: 'destructive',
      });
    }
  };
  
  // 취소 버튼 핸들러
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 시작 날짜 */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('form.startDate')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !field.value ? "text-muted-foreground" : ""
                        }`}
                        disabled={isProcessed}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(parseISO(field.value), dateFormat, { locale: dateLocale })
                        ) : (
                          <span>{t('form.pickDate')}</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const formattedDate = format(date, 'yyyy-MM-dd');
                          field.onChange(formattedDate);
                          
                          // 종료일이 시작일보다 앞서있는 경우, 종료일을 시작일로 설정
                          const endDate = form.getValues('endDate');
                          if (endDate && isBefore(parseISO(endDate), date)) {
                            form.setValue('endDate', formattedDate);
                          }
                        }
                      }}
                      disabled={(date) => {
                        // 오늘 이전 날짜 비활성화
                        return isBefore(date, new Date()) && !isAfter(date, new Date());
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  {t('form.startDateDescription')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* 종료 날짜 */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('form.endDate')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !field.value ? "text-muted-foreground" : ""
                        }`}
                        disabled={isProcessed}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(parseISO(field.value), dateFormat, { locale: dateLocale })
                        ) : (
                          <span>{t('form.pickDate')}</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, 'yyyy-MM-dd'));
                        }
                      }}
                      disabled={(date) => {
                        // 시작일 이전 날짜 비활성화
                        const startDate = form.getValues('startDate');
                        if (startDate) {
                          return isBefore(date, parseISO(startDate));
                        }
                        // 시작일이 없으면 오늘 이전 날짜 비활성화
                        return isBefore(date, new Date()) && !isAfter(date, new Date());
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  {t('form.endDateDescription')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* 목적 */}
          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.purpose')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t('form.purposePlaceholder')}
                    rows={3}
                    disabled={isProcessed}
                  />
                </FormControl>
                <FormDescription>
                  {t('form.purposeDescription')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* 추가 메모 */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.notes')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t('form.notesPlaceholder')}
                    rows={2}
                    disabled={isProcessed}
                  />
                </FormControl>
                <FormDescription>
                  {t('form.notesDescription')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* 안내 메시지 */}
          {isProcessed && (
            <div className="rounded-md bg-yellow-50 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    {t('edit.processedReservation')}
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      {t('edit.cannotModify')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit"
              disabled={isProcessed || updateReservation.isPending}
            >
              {updateReservation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
} 