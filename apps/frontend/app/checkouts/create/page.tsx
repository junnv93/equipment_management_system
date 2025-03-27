"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Building, Calendar, Phone, ClipboardList, MapPin } from "lucide-react";
import { format, addDays } from "date-fns";
import { ko } from "date-fns/locale";
import equipmentApi, { Equipment } from "@/lib/api/equipment-api";
import checkoutApi, { CreateCheckoutDto } from "@/lib/api/checkout-api";

export default function CreateCheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 폼 상태 관리
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date>(addDays(new Date(), 7));
  const [notes, setNotes] = useState("");

  // 장비 목록 조회
  const { data: equipmentsData, isLoading: equipmentsLoading } = useQuery({
    queryKey: ["equipments", "available", searchTerm],
    queryFn: async () => {
      const response = await equipmentApi.getEquipments({
        status: "available",
        search: searchTerm || undefined,
        pageSize: 100,
      });
      return response;
    },
  });

  // 반출 요청 제출 mutation
  const createCheckoutMutation = useMutation({
    mutationFn: (data: CreateCheckoutDto) => checkoutApi.createCheckout(data),
    onSuccess: () => {
      toast({
        title: "반출 신청 완료",
        description: "반출 신청이 성공적으로 접수되었습니다.",
        variant: "default",
      } as any);
      queryClient.invalidateQueries({ queryKey: ["checkouts"] });
      router.push("/checkouts");
    },
    onError: (error: any) => {
      toast({
        title: "반출 신청 실패",
        description: error?.message || "반출 신청 중 오류가 발생했습니다.",
        variant: "destructive",
      } as any);
      console.error(error);
    },
  });

  // 장비 선택 처리
  const handleAddEquipment = (equipment: Equipment) => {
    if (!selectedEquipments.some(e => e.id === equipment.id)) {
      setSelectedEquipments([...selectedEquipments, equipment]);
    }
  };

  // 장비 제거 처리
  const handleRemoveEquipment = (equipmentId: string) => {
    setSelectedEquipments(selectedEquipments.filter(e => e.id !== equipmentId));
  };

  // 반출 신청 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedEquipments.length === 0) {
      toast({
        title: "장비를 선택해주세요",
        description: "최소 1개 이상의 장비를 선택해야 합니다.",
        variant: "destructive",
      } as any);
      return;
    }

    if (!location) {
      toast({
        title: "반출지를 선택해주세요",
        description: "장비가 반출될 장소를 선택해주세요.",
        variant: "destructive",
      } as any);
      return;
    }

    if (!contactNumber) {
      toast({
        title: "연락처를 입력해주세요",
        description: "반출 기간 동안 연락 가능한 번호를 입력해주세요.",
        variant: "destructive",
      } as any);
      return;
    }

    if (!purpose) {
      toast({
        title: "용도를 입력해주세요",
        description: "장비 반출 용도를 간략히 입력해주세요.",
        variant: "destructive",
      } as any);
      return;
    }

    // 반출 신청 데이터 생성
    const checkoutData: CreateCheckoutDto = {
      equipmentIds: selectedEquipments.map(e => e.id),
      location: location === "other" ? customLocation : location,
      contactNumber,
      purpose,
      startDate: startDate.toISOString(),
      expectedReturnDate: expectedReturnDate.toISOString(),
      notes,
    };

    // 반출 신청 제출
    createCheckoutMutation.mutate(checkoutData);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">장비 반출 신청</h1>
          <p className="text-muted-foreground">사용할 장비를 선택하고 반출 정보를 입력하세요.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/checkouts")}>
          반출 목록으로 돌아가기
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 장비 선택 영역 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">장비 선택</CardTitle>
            <CardDescription>반출할 장비를 검색하여 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="장비명 또는 관리번호로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>장비명</TableHead>
                      <TableHead>관리번호</TableHead>
                      <TableHead className="w-16">선택</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentsLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          장비 목록을 불러오는 중...
                        </TableCell>
                      </TableRow>
                    ) : equipmentsData?.data?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          사용 가능한 장비가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      equipmentsData?.data?.map((equipment: Equipment) => (
                        <TableRow key={equipment.id}>
                          <TableCell className="font-medium">{equipment.name}</TableCell>
                          <TableCell>{equipment.managementNumber}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddEquipment(equipment)}
                              disabled={selectedEquipments.some(e => e.id === equipment.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="font-medium mb-2">선택된 장비 ({selectedEquipments.length})</h3>
                {selectedEquipments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">선택된 장비가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEquipments.map(equipment => (
                      <div key={equipment.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div>
                          <p className="font-medium">{equipment.name}</p>
                          <p className="text-xs text-muted-foreground">{equipment.managementNumber}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveEquipment(equipment.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 반출 정보 입력 영역 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">반출 정보 입력</CardTitle>
            <CardDescription>반출에 필요한 정보를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">반출지</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger id="location">
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="반출 장소 선택" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">고객사</SelectItem>
                      <SelectItem value="partner">협력사</SelectItem>
                      <SelectItem value="branch">지사</SelectItem>
                      <SelectItem value="exhibition">전시회</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {location === "other" && (
                  <div className="space-y-2">
                    <Label htmlFor="customLocation">기타 반출지 상세</Label>
                    <Input
                      id="customLocation"
                      placeholder="반출지 상세 정보 입력"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">연락처</Label>
                  <Input
                    id="contactNumber"
                    placeholder="반출 기간 동안 연락 가능한 번호"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">반출 용도</Label>
                <Input
                  id="purpose"
                  placeholder="장비 반출 용도를 간략히 입력하세요"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>반출일</Label>
                  <DatePicker
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    disabled={(date) => date < new Date()}
                  />
                </div>

                <div className="space-y-2">
                  <Label>반입 예정일</Label>
                  <DatePicker
                    selected={expectedReturnDate}
                    onSelect={(date) => date && setExpectedReturnDate(date)}
                    disabled={(date) => date <= startDate}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">비고</Label>
                <Textarea
                  id="notes"
                  placeholder="추가 참고사항이 있으면 입력하세요"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/checkouts")}>
              취소
            </Button>
            <Button 
              type="submit" 
              form="checkout-form" 
              disabled={createCheckoutMutation.isPending || selectedEquipments.length === 0}
            >
              {createCheckoutMutation.isPending ? "처리 중..." : "반출 신청"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 