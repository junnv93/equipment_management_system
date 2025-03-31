'use client';

import { useState, useEffect } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useReservations } from '@/hooks/use-reservations';
import { ReservationStatus } from '@/lib/types/reservation';
import { Equipment } from '@/lib/types/equipment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// 로컬라이저 설정
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    reservation: any;
    equipment: Equipment;
  };
  status: ReservationStatus;
}

export function ReservationCalendar() {
  const t = useTranslations('reservations');
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // 예약 목록 가져오기
  const { data: reservations = [], isLoading, error } = useReservations();

  useEffect(() => {
    if (error) {
      toast.error('Failed to load reservations');
    }
  }, [error]);

  // 예약 데이터를 캘린더 이벤트로 변환
  useEffect(() => {
    if (reservations) {
      const calendarEvents = reservations.map((reservation) => ({
        id: reservation.id,
        title: `${reservation.equipment.name} - ${reservation.user.name}`,
        start: new Date(reservation.startDate),
        end: new Date(reservation.endDate),
        resource: {
          reservation,
          equipment: reservation.equipment,
        },
        status: reservation.status as ReservationStatus,
      }));
      setEvents(calendarEvents);
    }
  }, [reservations]);

  // 이벤트 스타일 커스터마이징
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3B82F6'; // 기본 파란색 (대기 중)
    
    switch (event.status) {
      case ReservationStatus.APPROVED:
        backgroundColor = '#10B981'; // 초록색
        break;
      case ReservationStatus.REJECTED:
        backgroundColor = '#EF4444'; // 빨간색
        break;
      case ReservationStatus.CANCELLED:
        backgroundColor = '#6B7280'; // 회색
        break;
      case ReservationStatus.COMPLETED:
        backgroundColor = '#8B5CF6'; // 보라색
        break;
      default:
        backgroundColor = '#3B82F6'; // 파란색 (대기 중)
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  // 이벤트 클릭 핸들러
  const handleEventSelect = (event: CalendarEvent) => {
    router.push(`/reservations/${event.id}`);
  };

  // 날짜 범위 변경 핸들러
  const handleRangeChange = (range: any) => {
    if (range.start && range.end) {
      // 날짜 범위 변경 시 필요한 로직 추가 가능
    }
  };

  // 뷰 변경 핸들러
  const handleViewChange = (newView: string) => {
    setView(newView);
  };

  // 캘린더 날짜 변경 핸들러
  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  return (
    <Card className="shadow-md">
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <p>Loading...</p>
          </div>
        ) : (
          <div className="h-[700px]">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t('title')}</h2>
              <div className="space-x-2">
                <Button
                  variant={view === Views.MONTH ? 'default' : 'outline'}
                  onClick={() => setView(Views.MONTH)}
                >
                  Month
                </Button>
                <Button
                  variant={view === Views.WEEK ? 'default' : 'outline'}
                  onClick={() => setView(Views.WEEK)}
                >
                  Week
                </Button>
                <Button
                  variant={view === Views.DAY ? 'default' : 'outline'}
                  onClick={() => setView(Views.DAY)}
                >
                  Day
                </Button>
                <Button
                  variant={view === Views.AGENDA ? 'default' : 'outline'}
                  onClick={() => setView(Views.AGENDA)}
                >
                  Agenda
                </Button>
              </div>
            </div>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              view={view as any}
              date={date}
              onView={handleViewChange}
              onNavigate={handleNavigate}
              onRangeChange={handleRangeChange}
              onSelectEvent={handleEventSelect}
              eventPropGetter={eventStyleGetter}
              popup
              selectable
              formats={{
                dayFormat: 'DD',
                dayHeaderFormat: 'MM/DD ddd',
                monthHeaderFormat: 'YYYY MMMM',
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${moment(start).format('MMMM DD')} - ${moment(end).format(
                    'MMMM DD, YYYY'
                  )}`,
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 