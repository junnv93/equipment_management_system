"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, CalendarIcon, Info, Search } from "lucide-react";
import { format, addDays } from "date-fns";
import { ko } from "date-fns/locale";
import equipmentApi from "@/lib/api/equipment-api";
import rentalApi, { CreateRentalDto } from "@/lib/api/rental-api";

export default function CreateRentalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // 상태 관리
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 7));
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  
  // 장비 목록 가져오기
  const { data: equipmentData, isLoading: equipmentLoading } = useQuery({
    queryKey: ["equipment", searchTerm],
    queryFn: async () => {
      return equipmentApi.getEquipmentList({
        status: "available", // 사용 가능한 장비만 조회
        search: searchTerm || undefined,
        pageSize: 100
      });
    },
  });
  
  // 선택된 장비 정보 가져오기
  const { data: selectedEquipment, isLoading: selectedEquipmentLoading } = useQuery({
    queryKey: ["equipment", selectedEquipmentId],
    queryFn: () => equipmentApi.getEquipment(selectedEquipmentId!),
    enabled: !!selectedEquipmentId,
  });
  
  // 대여 신청 뮤테이션
  const createRentalMutation = useMutation({
    mutationFn: (data: CreateRentalDto) => rentalApi.createRental(data),
    onSuccess: () => {
      toast({
        title: "대여 신청 완료",
        description: "대여 신청이 성공적으로 접수되었습니다.",
      } as any);
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      router.push("/rentals");
    },
    onError: (error: any) => {
      toast({
        title: "대여 신청 실패",
        description: error?.message || "대여 신청 중 오류가 발생했습니다.",
        variant: "destructive",
      } as any);
      console.error(error);
    },
  });
  
  // 대여 신청 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEquipmentId) {
      toast({
        title: "장비 선택 필요",
        description: "대여할 장비를 선택해주세요.",
        variant: "destructive",
      } as any);
      return;
    }
    
    if (!purpose.trim()) {
      toast({
        title: "대여 목적 필요",
        description: "대여 목적을 입력해주세요.",
        variant: "destructive",
      } as any);
      return;
    }
    
    const rentalData: CreateRentalDto = {
      equipmentId: selectedEquipmentId,
      startDate: format(startDate, "yyyy-MM-dd"),
      expectedReturnDate: format(endDate, "yyyy-MM-dd"),
      purpose,
      notes: notes.trim() || undefined,
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
        {/* 장비 검색 및 선택 */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>장비 선택</CardTitle>
            <CardDescription>대여할 장비를 검색하고 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="장비명, 관리번호 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 mb-4"
              />
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {equipmentLoading ? (
                <div className="text-center py-8">로딩 중...</div>
              ) : equipmentData?.data?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  검색 결과가 없습니다.
                </div>
              ) : (
                equipmentData?.data?.map((equipment) => (
                  <div
                    key={equipment.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedEquipmentId === equipment.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedEquipmentId(equipment.id)}
                  >
                    <div className="font-medium">{equipment.name}</div>
                    <div className="text-sm text-muted-foreground">
                      관리번호: {equipment.managementNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      위치: {equipment.location || "정보 없음"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
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
                          ? "정보를 불러오는 중..."
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
              {createRentalMutation.isPending ? "처리 중..." : "대여 신청"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 