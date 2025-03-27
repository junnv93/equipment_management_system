'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n/client';
import { Reservation, ReservationStatus } from '@/lib/types/reservation';
import { useUpdateReservation, useCompleteReservation } from '@/hooks/use-reservations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface ReservationDetailsProps {
  reservation: Reservation;
  locale: string;
}

export function ReservationDetails({ 
  reservation,
  locale
}: ReservationDetailsProps) {
  const { t } = useTranslation('reservations');
  const router = useRouter();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const [approverNotes, setApproverNotes] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  
  const dateLocale = locale === 'ko' ? ko : enUS;
  const isManager = hasRole(['MANAGER', 'ADMIN']);
  const isPending = reservation.status === ReservationStatus.PENDING;
  const isApproved = reservation.status === ReservationStatus.APPROVED;
  
  // 예약 상태 업데이트 뮤테이션
  const updateReservation = useUpdateReservation();
  
  // 예약 완료 뮤테이션
  const completeReservation = useCompleteReservation();
  
  // 승인 핸들러
  const handleApprove = async () => {
    try {
      await updateReservation.mutateAsync({
        id: reservation.id,
        data: {
          status: ReservationStatus.APPROVED,
          approverNotes: approverNotes || undefined
        }
      });
      
      toast({
        title: t('detail.approveSuccess'),
        description: t('detail.statusUpdated'),
      });
      
      router.refresh();
    } catch (error) {
      console.error('Failed to approve reservation:', error);
      toast({
        title: t('detail.approveError'),
        description: t('detail.tryAgain'),
        variant: 'destructive',
      });
    }
  };
  
  // 거부 핸들러
  const handleReject = async () => {
    if (!approverNotes) {
      toast({
        title: t('detail.notesRequired'),
        description: t('detail.provideRejectionReason'),
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await updateReservation.mutateAsync({
        id: reservation.id,
        data: {
          status: ReservationStatus.REJECTED,
          approverNotes
        }
      });
      
      toast({
        title: t('detail.rejectSuccess'),
        description: t('detail.statusUpdated'),
      });
      
      router.refresh();
    } catch (error) {
      console.error('Failed to reject reservation:', error);
      toast({
        title: t('detail.rejectError'),
        description: t('detail.tryAgain'),
        variant: 'destructive',
      });
    }
  };
  
  // 취소 핸들러
  const handleCancel = async () => {
    try {
      await updateReservation.mutateAsync({
        id: reservation.id,
        data: {
          status: ReservationStatus.CANCELLED
        }
      });
      
      toast({
        title: t('detail.cancelSuccess'),
        description: t('detail.statusUpdated'),
      });
      
      router.refresh();
    } catch (error) {
      console.error('Failed to cancel reservation:', error);
      toast({
        title: t('detail.cancelError'),
        description: t('detail.tryAgain'),
        variant: 'destructive',
      });
    }
  };
  
  // 완료 핸들러 (장비 반납)
  const handleComplete = async () => {
    if (!window.confirm(t('detail.confirmReturn'))) {
      return;
    }
    
    try {
      await completeReservation.mutateAsync(reservation.id);
      
      toast({
        title: t('detail.returnSuccess'),
        description: t('detail.equipmentReturned'),
      });
      
      router.refresh();
    } catch (error) {
      console.error('Failed to return equipment:', error);
      toast({
        title: t('detail.returnError'),
        description: t('detail.tryAgain'),
        variant: 'destructive',
      });
    }
  };
  
  // 날짜 형식화
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: dateLocale });
  };
  
  // 상태에 따른 배지 색상
  const getStatusBadge = (status: ReservationStatus) => {
    const statusConfig = {
      [ReservationStatus.PENDING]: { variant: 'outline', label: t('status.pending') },
      [ReservationStatus.APPROVED]: { variant: 'success', label: t('status.approved') },
      [ReservationStatus.REJECTED]: { variant: 'destructive', label: t('status.rejected') },
      [ReservationStatus.CANCELLED]: { variant: 'secondary', label: t('status.cancelled') },
      [ReservationStatus.COMPLETED]: { variant: 'default', label: t('status.completed') },
    };
    
    const config = statusConfig[status] || statusConfig[ReservationStatus.PENDING];
    
    return (
      <Badge variant={config.variant as any}>{config.label}</Badge>
    );
  };
  
  // 예약 상세 정보 렌더링
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              {t('detail.reservationFor')} {reservation.equipment.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('detail.requestedBy')} {reservation.user.name} • {formatDate(reservation.createdAt)}
            </p>
          </div>
          <div>{getStatusBadge(reservation.status as ReservationStatus)}</div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList>
            <TabsTrigger value="details">{t('detail.tabs.details')}</TabsTrigger>
            <TabsTrigger value="equipment">{t('detail.tabs.equipment')}</TabsTrigger>
            {isManager && <TabsTrigger value="manage">{t('detail.tabs.manage')}</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <h3 className="font-medium mb-1">{t('detail.period')}</h3>
              <p>{formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">{t('detail.purpose')}</h3>
              <p>{reservation.purpose}</p>
            </div>
            
            {reservation.notes && (
              <div>
                <h3 className="font-medium mb-1">{t('detail.notes')}</h3>
                <p>{reservation.notes}</p>
              </div>
            )}
            
            {reservation.approverNotes && (
              <div>
                <h3 className="font-medium mb-1">{t('detail.approverNotes')}</h3>
                <p>{reservation.approverNotes}</p>
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="flex flex-wrap gap-2">
              {isPending && (
                <Button onClick={() => router.push(`/reservations/${reservation.id}/edit`)}>
                  {t('detail.edit')}
                </Button>
              )}
              
              {isApproved && (
                <Button 
                  variant="default" 
                  onClick={handleComplete}
                  disabled={completeReservation.isPending}
                >
                  {t('detail.returnEquipment')}
                </Button>
              )}
              
              {isPending && (
                <Button variant="outline" onClick={handleCancel}>
                  {t('detail.cancel')}
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="equipment" className="space-y-4 mt-4">
            <div>
              <h3 className="font-medium mb-1">{t('detail.equipmentName')}</h3>
              <p>{reservation.equipment.name}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">{t('detail.managementNumber')}</h3>
              <p>{reservation.equipment.managementNumber}</p>
            </div>
            
            {reservation.equipment.category && (
              <div>
                <h3 className="font-medium mb-1">{t('detail.category')}</h3>
                <p>{reservation.equipment.category}</p>
              </div>
            )}
            
            <div>
              <h3 className="font-medium mb-1">{t('detail.status')}</h3>
              <p>{reservation.equipment.status}</p>
            </div>
            
            <Separator className="my-4" />
            
            <Button onClick={() => router.push(`/equipment/${reservation.equipment.id}`)}>
              {t('detail.viewEquipment')}
            </Button>
          </TabsContent>
          
          {isManager && (
            <TabsContent value="manage" className="space-y-4 mt-4">
              {isPending ? (
                <>
                  <div>
                    <h3 className="font-medium mb-1">{t('detail.approverNotes')}</h3>
                    <Textarea
                      value={approverNotes}
                      onChange={(e) => setApproverNotes(e.target.value)}
                      placeholder={t('detail.approverNotesPlaceholder')}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleApprove}>
                      {t('detail.approve')}
                    </Button>
                    <Button variant="destructive" onClick={handleReject}>
                      {t('detail.reject')}
                    </Button>
                  </div>
                </>
              ) : (
                <p>{t('detail.alreadyProcessed')}</p>
              )}
            </TabsContent>
          )}
        </Tabs>
      </Card>
    </div>
  );
} 