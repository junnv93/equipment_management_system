"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

import reservationApi from "@/lib/api/reservation-api";
import type { ExpandedReservation, ReservationStatus } from "@/lib/types";
import type { PaginatedResponse } from "@/lib/api/reservation-api";

interface DayReservations {
  date: Date;
  reservations: ExpandedReservation[];
}

export default function ReservationCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [monthReservations, setMonthReservations] = useState<DayReservations[]>([]);
  const { toast } = useToast();

  // 선택된 월의 예약 목록 조회
  const { data: reservationsResponse, isLoading } = useQuery<PaginatedResponse<ExpandedReservation>>({
    queryKey: ["reservations", format(selectedDate, "yyyy-MM")],
    queryFn: async () => {
      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);
      return reservationApi.getReservations({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      });
    },
  });

  // 예약 상태별 뱃지 스타일
  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">승인 대기</Badge>;
      case "APPROVED":
        return <Badge variant="success">승인됨</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">거절됨</Badge>;
      case "CANCELED":
        return <Badge variant="secondary">취소됨</Badge>;
      case "COMPLETED":
        return <Badge variant="default">완료됨</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // 월별 예약 데이터 정리
  useEffect(() => {
    if (!reservationsResponse?.data) return;

    const days = eachDayOfInterval({
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate),
    });

    const reservationsByDay = days.map((date) => ({
      date,
      reservations: reservationsResponse.data.filter((reservation: ExpandedReservation) => {
        const reservationDate = new Date(reservation.startDate);
        return format(reservationDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
      }),
    }));

    setMonthReservations(reservationsByDay);
  }, [reservationsResponse, selectedDate]);

  // 날짜 선택 핸들러
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // 선택된 날짜의 예약 목록
  const selectedDateReservations = monthReservations.find(
    (day) => format(day.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
  )?.reservations || [];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">예약 캘린더</h1>
        <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          오늘
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 캘린더 */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>날짜 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={ko}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* 선택된 날짜의 예약 목록 */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>
              {format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })}의 예약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] overflow-auto pr-4">
              {isLoading ? (
                // 로딩 상태
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : selectedDateReservations.length > 0 ? (
                // 예약 목록
                <div className="space-y-4">
                  {selectedDateReservations.map((reservation) => (
                    <Card key={reservation.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">
                            {reservation.equipment?.name || "장비명 없음"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(reservation.startDate), "HH:mm")} -{" "}
                            {format(new Date(reservation.endDate), "HH:mm")}
                          </p>
                          <p className="text-sm">{reservation.purpose}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(reservation.status)}
                          <span className="text-sm text-muted-foreground">
                            {reservation.user?.name || "사용자 없음"}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                // 예약 없음
                <div className="text-center py-8 text-muted-foreground">
                  <p>이 날짜에 예약된 장비가 없습니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 