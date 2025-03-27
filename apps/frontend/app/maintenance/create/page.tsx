"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast, type Toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { format, addMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Calendar, Wrench, Clock, User, DollarSign, ClipboardCheck } from "lucide-react";
import equipmentApi, { Equipment } from "@/lib/api/equipment-api";
import maintenanceApi, { 
  CreateMaintenanceDto,
  MaintenanceType,
  MaintenanceStatus,
  MaintenanceResult
} from "@/lib/api/maintenance-api";
import { ToastAction } from "@/components/ui/toast";

export default function CreateMaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // URL에서 장비 ID 파라미터 가져오기
  const equipmentIdParam = searchParams.get('equipmentId');
  
  // 폼 상태 관리
  const [equipmentId, setEquipmentId] = useState<string>(equipmentIdParam || "");
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>("regular");
  const [maintenanceDate, setMaintenanceDate] = useState<Date>(new Date());
  const [performedBy, setPerformedBy] = useState("");
  const [performedByContact, setPerformedByContact] = useState("");
  const [cost, setCost] = useState<string>("");
  const [status, setStatus] = useState<MaintenanceStatus>("scheduled");
  const [result, setResult] = useState<MaintenanceResult>("pending");
  const [notes, setNotes] = useState("");
  const [parts, setParts] = useState<string[]>([]);
  const [newPart, setNewPart] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [maintenancePeriod, setMaintenancePeriod] = useState<string>("0");
  const [useRegularPeriod, setUseRegularPeriod] = useState(true);
  const [calculatedNextDate, setCalculatedNextDate] = useState<Date | null>(null);

  // 장비 목록 조회
  const { data: equipmentData, isLoading: equipmentLoading } = useQuery({
    queryKey: ["equipment-list", searchTerm],
    queryFn: async () => {
      if (equipmentIdParam) {
        // 특정 장비 정보만 가져오기
        const equipment = await equipmentApi.getEquipment(equipmentIdParam);
        return [equipment];
      } else {
        // 목록 가져오기
        const response = await equipmentApi.getEquipmentList({
          search: searchTerm || undefined,
          pageSize: 100,
        });
        return response.data;
      }
    },
  });

  // 선택된 장비 정보 조회
  const { data: selectedEquipment, isLoading: selectedEquipmentLoading } = useQuery({
    queryKey: ["equipment", equipmentId],
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    enabled: !!equipmentId && equipmentId !== "",
  });

  // 다음 점검일 계산
  useEffect(() => {
    if (maintenanceDate && parseInt(maintenancePeriod) > 0) {
      setCalculatedNextDate(addMonths(maintenanceDate, parseInt(maintenancePeriod)));
    } else {
      setCalculatedNextDate(null);
    }
  }, [maintenanceDate, maintenancePeriod]);

  // 선택된 장비의 정기 점검 주기 가져오기
  useEffect(() => {
    if (selectedEquipment && useRegularPeriod && maintenanceType === "regular") {
      const period = selectedEquipment.maintenancePeriod || 0;
      setMaintenancePeriod(period.toString());
    }
  }, [selectedEquipment, useRegularPeriod, maintenanceType]);

  // 점검 등록 mutation
  const createMaintenanceMutation = useMutation({
    mutationFn: (data: CreateMaintenanceDto) => maintenanceApi.createMaintenance(data),
    onSuccess: () => {
      toast({
        title: "점검 정보 등록 완료",
        description: "장비 점검 정보가 성공적으로 등록되었습니다.",
        variant: "default",
      } as Toast);
      queryClient.invalidateQueries({ queryKey: ["maintenance-history"] });
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      router.push("/maintenance");
    },
    onError: (error: any) => {
      toast({
        title: "점검 정보 등록 실패",
        description: error?.message || "점검 정보 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      } as Toast);
      console.error(error);
    },
  });

  // 부품 항목 추가
  const handleAddPart = () => {
    if (newPart.trim()) {
      setParts([...parts, newPart.trim()]);
      setNewPart("");
    }
  };

  // 부품 항목 제거
  const handleRemovePart = (index: number) => {
    const newParts = [...parts];
    newParts.splice(index, 1);
    setParts(newParts);
  };

  // 점검 등록 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!equipmentId) {
      toast({
        title: "장비를 선택해주세요",
        description: "점검할 장비를 선택해야 합니다.",
        variant: "destructive",
      } as Toast);
      return;
    }

    if (!performedBy) {
      toast({
        title: "담당자를 입력해주세요",
        description: "점검 담당자 정보를 입력해야 합니다.",
        variant: "destructive",
      } as Toast);
      return;
    }

    // 점검 데이터 생성
    const costValue = cost ? parseFloat(cost) : undefined;
    const periodValue = maintenancePeriod ? parseInt(maintenancePeriod) : undefined;
    
    const maintenanceData: CreateMaintenanceDto = {
      equipmentId,
      maintenanceType,
      maintenanceDate: maintenanceDate.toISOString(),
      nextMaintenanceDate: calculatedNextDate ? calculatedNextDate.toISOString() : undefined,
      maintenancePeriod: periodValue,
      performedBy,
      performedByContact,
      cost: costValue,
      result,
      status,
      parts: parts.length > 0 ? parts : undefined,
      notes,
    };

    // 점검 등록 제출
    createMaintenanceMutation.mutate(maintenanceData);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">점검 등록</h1>
          <p className="text-muted-foreground">장비 점검 정보를 등록합니다.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/maintenance")}>
          점검 목록으로 돌아가기
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>장비 선택</CardTitle>
            <CardDescription>
              점검할 장비를 선택하세요. {equipmentIdParam ? "URL에서 장비가 자동으로 선택되었습니다." : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!equipmentIdParam && (
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {equipmentLoading ? (
                    <p>장비 목록을 불러오는 중...</p>
                  ) : equipmentData?.length === 0 ? (
                    <p>검색 결과가 없습니다.</p>
                  ) : (
                    equipmentData?.map((equipment: Equipment) => (
                      <Card key={equipment.id} className={`cursor-pointer transition-colors ${equipmentId === equipment.id ? 'border-primary' : ''}`} onClick={() => setEquipmentId(equipment.id)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{equipment.name}</h3>
                              <p className="text-sm text-muted-foreground">{equipment.managementNumber}</p>
                              <p className="text-sm mt-1">{equipment.model} ({equipment.manufacturer})</p>
                            </div>
                            <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center mt-1">
                              {equipmentId === equipment.id && (
                                <div className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {equipmentId && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h3 className="font-medium mb-2">선택된 장비</h3>
                {selectedEquipmentLoading ? (
                  <p>장비 정보를 불러오는 중...</p>
                ) : selectedEquipment ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">장비명</p>
                      <p className="font-medium">{selectedEquipment.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">관리번호</p>
                      <p className="font-medium">{selectedEquipment.managementNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">모델</p>
                      <p className="font-medium">{selectedEquipment.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">제조사</p>
                      <p className="font-medium">{selectedEquipment.manufacturer}</p>
                    </div>
                    {selectedEquipment.maintenancePeriod && maintenanceType === "regular" && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">정기 점검 주기</p>
                        <p className="font-medium">{selectedEquipment.maintenancePeriod}개월</p>
                        <div className="flex items-center mt-2">
                          <Checkbox
                            id="useRegularPeriod"
                            checked={useRegularPeriod}
                            onCheckedChange={(checked) => setUseRegularPeriod(checked as boolean)}
                          />
                          <label htmlFor="useRegularPeriod" className="ml-2 text-sm">
                            장비의 정기 점검 주기 사용
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>선택된 장비 정보가 없습니다.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>점검 정보</CardTitle>
            <CardDescription>점검 유형, 일정, 담당자 등의 정보를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maintenanceType">점검 유형</Label>
                <Select 
                  value={maintenanceType} 
                  onValueChange={(value: string) => setMaintenanceType(value as MaintenanceType)}
                >
                  <SelectTrigger id="maintenanceType">
                    <div className="flex items-center">
                      <Wrench className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="점검 유형 선택" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">정기 점검</SelectItem>
                    <SelectItem value="repair">수리</SelectItem>
                    <SelectItem value="inspection">검사</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                <Select 
                  value={status} 
                  onValueChange={(value: string) => setStatus(value as MaintenanceStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">예정됨</SelectItem>
                    <SelectItem value="in_progress">진행 중</SelectItem>
                    <SelectItem value="completed">완료됨</SelectItem>
                    <SelectItem value="canceled">취소됨</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>점검 일자</Label>
                <DatePicker
                  selected={maintenanceDate}
                  onSelect={(date) => date && setMaintenanceDate(date)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="maintenancePeriod">점검 주기 (개월)</Label>
                  {maintenanceType === "regular" && selectedEquipment?.maintenancePeriod && !useRegularPeriod && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMaintenancePeriod(selectedEquipment.maintenancePeriod?.toString() || "0");
                      }}
                      className="text-xs"
                    >
                      기본값 적용
                    </Button>
                  )}
                </div>
                <Input
                  id="maintenancePeriod"
                  type="number"
                  min="0"
                  step="1"
                  value={maintenancePeriod}
                  onChange={(e) => setMaintenancePeriod(e.target.value)}
                  disabled={maintenanceType === "regular" && useRegularPeriod && !!selectedEquipment?.maintenancePeriod}
                />
                {calculatedNextDate && (
                  <div className="text-sm text-muted-foreground mt-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>다음 점검일: {format(calculatedNextDate, 'yyyy-MM-dd', { locale: ko })}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="performedBy">담당자</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="performedBy"
                    placeholder="점검 담당자 이름"
                    value={performedBy}
                    onChange={(e) => setPerformedBy(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="performedByContact">담당자 연락처</Label>
                <Input
                  id="performedByContact"
                  placeholder="연락처 (선택 사항)"
                  value={performedByContact}
                  onChange={(e) => setPerformedByContact(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">비용 (원)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="점검 비용 (선택 사항)"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="result">점검 결과</Label>
                <Select 
                  value={result} 
                  onValueChange={(value: string) => setResult(value as MaintenanceResult)}
                >
                  <SelectTrigger id="result">
                    <div className="flex items-center">
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="결과 선택" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">보류</SelectItem>
                    <SelectItem value="completed">통과</SelectItem>
                    <SelectItem value="failed">불합격</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="parts">사용 부품</Label>
                <div className="flex space-x-2">
                  <Input
                    id="parts"
                    placeholder="사용한 부품 또는 자재"
                    value={newPart}
                    onChange={(e) => setNewPart(e.target.value)}
                  />
                  <Button type="button" onClick={handleAddPart} disabled={!newPart.trim()}>
                    추가
                  </Button>
                </div>
                {parts.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {parts.map((part, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <span>{part}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePart(index)}
                          className="h-6 w-6 p-0 text-red-500"
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">비고</Label>
                <Textarea
                  id="notes"
                  placeholder="추가 참고사항이 있으면 입력하세요"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/maintenance")}>
              취소
            </Button>
            <Button 
              type="submit" 
              disabled={createMaintenanceMutation.isPending || !equipmentId || !performedBy}
            >
              {createMaintenanceMutation.isPending ? "등록 중..." : "점검 등록"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 