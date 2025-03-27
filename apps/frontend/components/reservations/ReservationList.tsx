'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { format, parseISO } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useReservations } from '@/hooks/use-reservations';
import { ReservationStatus } from '@/lib/types/reservation';
import { SearchIcon } from 'lucide-react';

interface ReservationListProps {
  locale: string;
}

export function ReservationList({ locale }: ReservationListProps) {
  const t = useTranslations('reservations');
  const router = useRouter();
  const dateLocale = locale === 'ko' ? ko : enUS;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // 예약 목록 가져오기
  const { data: reservations = [], isLoading, error } = useReservations();
  
  // 필터링된 예약 목록
  const filteredReservations = reservations.filter((reservation) => {
    // 검색어 필터링
    const searchMatch = searchTerm === '' || 
      reservation.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 상태 필터링
    const statusMatch = statusFilter === '' || reservation.status === statusFilter;
    
    return searchMatch && statusMatch;
  });
  
  // 상태에 따른 배지 렌더링
  const renderStatusBadge = (status: ReservationStatus) => {
    const statusConfig = {
      [ReservationStatus.PENDING]: { variant: 'outline', label: t('status.pending') },
      [ReservationStatus.APPROVED]: { variant: 'success', label: t('status.approved') },
      [ReservationStatus.REJECTED]: { variant: 'destructive', label: t('status.rejected') },
      [ReservationStatus.CANCELLED]: { variant: 'secondary', label: t('status.cancelled') },
      [ReservationStatus.COMPLETED]: { variant: 'default', label: t('status.completed') },
    };
    
    const config = statusConfig[status] || statusConfig[ReservationStatus.PENDING];
    
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };
  
  // 날짜 형식화
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'PPP', { locale: dateLocale });
  };
  
  // 예약 상세 페이지로 이동
  const handleRowClick = (id: string) => {
    router.push(`/reservations/${id}`);
  };
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  if (error) {
    return <div className="p-8 text-center text-red-500">{t('error.loading')}</div>;
  }
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center w-1/3 relative">
          <Input
            placeholder={t('list.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <SearchIcon className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('list.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('list.allStatuses')}</SelectItem>
            <SelectItem value={ReservationStatus.PENDING}>{t('status.pending')}</SelectItem>
            <SelectItem value={ReservationStatus.APPROVED}>{t('status.approved')}</SelectItem>
            <SelectItem value={ReservationStatus.REJECTED}>{t('status.rejected')}</SelectItem>
            <SelectItem value={ReservationStatus.CANCELLED}>{t('status.cancelled')}</SelectItem>
            <SelectItem value={ReservationStatus.COMPLETED}>{t('status.completed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredReservations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('list.noReservations')}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('list.columns.equipment')}</TableHead>
                <TableHead>{t('list.columns.user')}</TableHead>
                <TableHead>{t('list.columns.period')}</TableHead>
                <TableHead>{t('list.columns.status')}</TableHead>
                <TableHead>{t('list.columns.createdAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => (
                <TableRow 
                  key={reservation.id}
                  onClick={() => handleRowClick(reservation.id)}
                  className="cursor-pointer hover:bg-muted"
                >
                  <TableCell className="font-medium">{reservation.equipment.name}</TableCell>
                  <TableCell>{reservation.user.name}</TableCell>
                  <TableCell>
                    {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                  </TableCell>
                  <TableCell>{renderStatusBadge(reservation.status as ReservationStatus)}</TableCell>
                  <TableCell>{formatDate(reservation.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
} 