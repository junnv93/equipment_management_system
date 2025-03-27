"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { equipmentApi, reservationApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { UpdateReservationDto } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ChevronLeft, Calendar, Info } from "lucide-react";

export default function EditReservationPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const reservationId = params.id as string;
  
  // 상태 관리
  const [startDate, setStartDate] = useState<Date>(addDays(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 2));
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  
  // 예약 정보 조회
  const { data: reservation, isLoading, isError } = useQuery({
    queryKey: ["reservation", reservationId],
    queryFn: () => reservationApi.getReservation(reservationId),
    enabled: !!reservationId,
  });
  
  // 예약 정보 로드 시 폼 상태 업데이트
  useEffect(() => {
    if (reservation) {
      setPurpose(reservation.purpose || "");
      setNotes(reservation.notes || "");
      
      if (reservation.startDate) {
        setStartDate(new Date(reservation.startDate));
      }
      
      if (reservation.endDate) {
        setEndDate(new Date(reservation.endDate));
      }
    }
  }, [reservation]);
  
  // 예약 수정 뮤테이션
  const updateReservationMutation = useMutation({
    mutationFn: (data: UpdateReservationDto) => reservationApi.updateReservation(reservationId, data),
    onSuccess: () => {
      toast({
        id: `update-reservation-${reservationId}-success`,
        title: "예약 정보 수정 완료",
        description: "예약 정보가 성공적으로 수정되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["reservation", reservationId] });
      router.push(`/reservations/${reservationId}`);
    },
    onError: (error: any) => {
      toast({
        id: `update-reservation-${reservationId}-error`,
        title: "예약 정보 수정 실패",
        description: error?.message || "예약 정보를 수정하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      console.error(error);
    },
  });
  
  // 예약 수정 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!purpose.trim()) {
      toast({
        id: "purpose-required",
        title: "예약 목적 필요",
        description: "예약 목적을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    const reservationData: UpdateReservationDto = {
      purpose,
      startDate: format(startDate, "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: format(endDate, "yyyy-MM-dd'T'HH:mm:ss"),
      notes: notes.trim() || undefined,
    };
    
    updateReservationMutation.mutate(reservationData);
  };
  
  const handleCancel = () => {
    router.push(`/reservations/${reservationId}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (isError || !reservation) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" onClick={() => router.push("/reservations")} className="mb-6">
          <ChevronLeft className="mr-2 h-4 w-4" />
          예약 목록으로 돌아가기
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10 text-red-500">
              <AlertCircle className="mx-auto h-10 w-10 mb-2" />
              <p>예약 정보를 불러오는 중 오류가 발생했습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // 예약이 대기 상태가 아니면 수정 불가
  if (reservation.status !== "PENDING") {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" onClick={() => router.push(`/reservations/${reservationId}`)} className="mb-6">
          <ChevronLeft className="mr-2 h-4 w-4" />
          예약 상세로 돌아가기
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10 text-amber-500">
              <AlertCircle className="mx-auto h-10 w-10 mb-2" />
              <p>승인 대기 중인 예약만 수정할 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">예약 정보 수정</h1>
        <Button variant="outline" onClick={() => router.push(`/reservations/${reservationId}`)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          예약 상세로 돌아가기
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>예약 정보 수정</CardTitle>
          <CardDescription>변경하실 예약 정보를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 장비 정보 표시 */}
            <div className="p-4 bg-blue-50 rounded-md mb-6">
              <div className="flex items-start gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-medium">예약 장비</div>
                  <div className="text-gray-600">
                    {reservation.equipment?.name} (관리번호: {reservation.equipment?.managementNumber})
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    장비는 변경할 수 없습니다. 다른 장비를 사용하려면 새 예약을 생성해주세요.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="purpose">예약 목적</Label>
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="장비를 사용하는 목적을 입력하세요"
                required
              />
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    시작 일시
                  </div>
                </Label>
                <DatePicker
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  disabled={false}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    종료 일시
                  </div>
                </Label>
                <DatePicker
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  disabled={false}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">추가 메모 (선택사항)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="추가적인 정보나 요청 사항을 입력하세요"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" type="button" onClick={handleCancel}>
                취소
              </Button>
              <Button type="submit" disabled={updateReservationMutation.isPending}>
                {updateReservationMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 