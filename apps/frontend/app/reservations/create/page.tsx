"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { equipmentApi, reservationApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { CreateReservationDto } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { Info, Search, Check, Calendar } from "lucide-react";

export default function CreateReservationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // 상태 관리
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(addDays(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 2));
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  
  // 장비 목록 조회
  const { data: equipmentData, isLoading: equipmentLoading } = useQuery({
    queryKey: ["equipment", "available", searchTerm],
    queryFn: async () => {
      return equipmentApi.getEquipmentList({
        status: "available",
        search: searchTerm || undefined,
        pageSize: 100
      });
    },
  });
  
  // 선택된 장비 정보 조회
  const { data: selectedEquipment, isLoading: selectedEquipmentLoading } = useQuery({
    queryKey: ["equipment", selectedEquipmentId],
    queryFn: () => equipmentApi.getEquipment(selectedEquipmentId!),
    enabled: !!selectedEquipmentId,
  });
  
  // 예약 생성 뮤테이션
  const createReservationMutation = useMutation({
    mutationFn: (data: CreateReservationDto) => {
      return reservationApi.createReservation(data);
    },
    onSuccess: () => {
      toast({
        id: "create-reservation-success",
        title: "예약 신청 완료",
        description: "예약이 성공적으로 신청되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      router.push("/reservations");
    },
    onError: (error: any) => {
      toast({
        id: "create-reservation-error",
        title: "예약 신청 실패",
        description: error?.message || "예약 신청 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      console.error(error);
    },
  });
  
  // 예약 신청 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEquipmentId) {
      toast({
        id: "equipment-required",
        title: "장비 선택 필요",
        description: "예약할 장비를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (!purpose.trim()) {
      toast({
        id: "purpose-required",
        title: "예약 목적 필요",
        description: "예약 목적을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    const reservationData: CreateReservationDto = {
      equipmentId: selectedEquipmentId,
      purpose,
      startDate: format(startDate, "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: format(endDate, "yyyy-MM-dd'T'HH:mm:ss"),
      notes: notes.trim() || undefined,
    };
    
    createReservationMutation.mutate(reservationData);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">장비 예약 신청</h1>
        <Button variant="outline" onClick={() => router.push("/reservations")}>
          예약 목록으로 돌아가기
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 장비 선택 패널 */}
        <Card>
          <CardHeader>
            <CardTitle>장비 선택</CardTitle>
            <CardDescription>예약할 장비를 선택해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="장비 검색..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="h-[400px] overflow-y-auto border rounded-md">
                {equipmentLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                ) : equipmentData?.data && equipmentData.data.length > 0 ? (
                  <ul className="divide-y">
                    {equipmentData.data.map((equipment) => (
                      <li 
                        key={equipment.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center ${
                          selectedEquipmentId === equipment.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedEquipmentId(equipment.id)}
                      >
                        <div>
                          <p className="font-medium">{equipment.name}</p>
                          <p className="text-sm text-gray-500">관리번호: {equipment.managementNumber}</p>
                        </div>
                        {selectedEquipmentId === equipment.id && (
                          <Check className="h-5 w-5 text-blue-500" />
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-500">
                    <Info className="h-10 w-10 text-gray-400 mb-2" />
                    <p>검색 결과가 없거나 사용 가능한 장비가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 예약 정보 입력 폼 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>예약 정보 입력</CardTitle>
            <CardDescription>예약 세부 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 선택된 장비 정보 */}
              {selectedEquipmentId ? (
                <div className="p-4 bg-blue-50 rounded-md mb-6">
                  <div className="flex items-start gap-2 mb-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium">선택된 장비</div>
                      <div className="text-gray-600">
                        {selectedEquipmentLoading
                          ? "정보를 불러오는 중..."
                          : `${selectedEquipment?.name} (관리번호: ${selectedEquipment?.managementNumber})`}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-100 rounded-md mb-6">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <div className="font-medium">장비 선택 필요</div>
                      <div className="text-gray-600">
                        왼쪽 패널에서 예약할 장비를 선택해주세요.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
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
                    disabled={(date) => date < new Date()}
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
                    disabled={(date) => date < startDate}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">추가 메모 (선택)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="필요한 추가 정보를 입력하세요"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={createReservationMutation.isPending}
                >
                  {createReservationMutation.isPending ? "처리 중..." : "예약 신청"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 