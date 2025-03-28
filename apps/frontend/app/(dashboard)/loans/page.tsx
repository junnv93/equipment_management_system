"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, ArrowLeftRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, isAfter } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import rentalApi, { Rental } from "@/lib/api/rental-api";
import { ko } from "date-fns/locale";

export default function MyLoansPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [returnNotes, setReturnNotes] = useState("");
  const [returnCondition, setReturnCondition] = useState("good");

  // 임시 사용자 ID (실제로는 인증 상태에서 가져와야 함)
  const userId = "current-user-id";

  // 사용자의 대여 목록 조회
  const { data: rentals, isLoading } = useQuery({
    queryKey: ["my-rentals", activeTab, userId],
    queryFn: async () => {
      const status = activeTab === "active" 
        ? "approved" 
        : activeTab === "pending" 
          ? "pending" 
          : activeTab === "history" 
            ? "returned" 
            : undefined;
            
      return rentalApi.getUserRentals(userId, {
        status,
        search: searchTerm || undefined,
      });
    },
  });

  // 대여 반납 요청 mutation
  const returnRentalMutation = useMutation({
    mutationFn: (data: { rentalId: string, returnCondition: string, returnNotes: string }) => 
      rentalApi.requestReturn(data.rentalId, {
        returnCondition: data.returnCondition,
        returnNotes: data.returnNotes
      }),
    onSuccess: () => {
      toast({
        title: "반납 요청 완료",
        description: "장비 반납 요청이 성공적으로 처리되었습니다.",
      });
      setIsReturnDialogOpen(false);
      setReturnNotes("");
      setReturnCondition("good");
      queryClient.invalidateQueries({ queryKey: ["my-rentals"] });
    },
    onError: (error) => {
      toast({
        title: "반납 요청 실패",
        description: "장비 반납 요청 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // 반납 다이얼로그 열기
  const openReturnDialog = (rental: Rental) => {
    setSelectedRental(rental);
    setIsReturnDialogOpen(true);
  };

  // 반납 요청 처리
  const handleReturnRequest = () => {
    if (!selectedRental) return;
    
    returnRentalMutation.mutate({
      rentalId: selectedRental.id,
      returnCondition,
      returnNotes
    });
  };

  // 대여 상태에 따른 배지 색상 및 텍스트
  const getRentalStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">승인 대기</span>;
      case "approved":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">대여 중</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">거절됨</span>;
      case "returned":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">반납 완료</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">알 수 없음</span>;
    }
  };

  // 대여 만료 상태 체크
  const getOverdueStatus = (rental: Rental) => {
    if (rental.status !== "approved") return null;
    
    const today = new Date();
    const returnDate = parseISO(rental.expectedReturnDate);
    
    if (isAfter(today, returnDate)) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 ml-2">반납 기한 초과</span>;
    }
    
    return null;
  };

  // 필터링된 대여 목록
  const getFilteredRentals = () => {
    if (!rentals || !rentals.data) return [];
    
    return rentals.data.filter(rental => {
      // 검색어 필터링
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (rental.equipment?.name?.toLowerCase().includes(searchLower) || false) ||
          (rental.equipment?.managementNumber?.toLowerCase().includes(searchLower) || false) ||
          (rental.purpose?.toLowerCase().includes(searchLower) || false)
        );
      }
      return true;
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">내 대여 현황</h1>
        <p className="text-muted-foreground">
          장비 대여 현황 및 반납 요청을 관리할 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>장비 대여 목록</CardTitle>
          <CardDescription>현재 대여 중인 장비와 대여 이력을 확인할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="장비명, 관리번호 검색..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">대여 중</TabsTrigger>
              <TabsTrigger value="pending">승인 대기</TabsTrigger>
              <TabsTrigger value="history">대여 이력</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="text-center py-8">대여 목록을 불러오는 중...</div>
              ) : getFilteredRentals().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "검색 결과가 없습니다." : "대여 내역이 없습니다."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>장비명</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>대여일</TableHead>
                      <TableHead>반납 예정일</TableHead>
                      <TableHead>목적</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredRentals().map((rental) => (
                      <TableRow key={rental.id}>
                        <TableCell className="font-medium">
                          {rental.equipment?.name || "알 수 없음"}
                          <div className="text-sm text-muted-foreground">
                            관리번호: {rental.equipment?.managementNumber || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getRentalStatusBadge(rental.status)}
                            {getOverdueStatus(rental)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {rental.startDate
                            ? format(parseISO(rental.startDate), "yyyy-MM-dd", { locale: ko })
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {rental.expectedReturnDate
                            ? format(parseISO(rental.expectedReturnDate), "yyyy-MM-dd", { locale: ko })
                            : "N/A"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {rental.purpose || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          {rental.status === "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReturnDialog(rental)}
                              className="h-8 px-2"
                            >
                              <ArrowLeftRight className="h-4 w-4 mr-1" /> 반납 요청
                            </Button>
                          )}
                          {rental.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                /* 요청 취소 기능 */
                              }}
                              className="h-8 px-2 text-red-600"
                            >
                              취소
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 반납 요청 다이얼로그 */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>장비 반납 요청</DialogTitle>
            <DialogDescription>
              다음 장비의 반납을 요청합니다:
              <div className="mt-2 p-3 bg-muted rounded">
                <div><strong>장비:</strong> {selectedRental?.equipment?.name}</div>
                <div><strong>대여일:</strong> {selectedRental?.startDate && format(parseISO(selectedRental.startDate), "yyyy-MM-dd", { locale: ko })}</div>
                <div><strong>반납 예정일:</strong> {selectedRental?.expectedReturnDate && format(parseISO(selectedRental.expectedReturnDate), "yyyy-MM-dd", { locale: ko })}</div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="condition" className="text-sm font-medium">장비 상태</label>
              <select
                id="condition"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
              >
                <option value="good">양호함</option>
                <option value="damaged">손상됨</option>
                <option value="lost">분실</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">비고</label>
              <Textarea
                id="notes"
                placeholder="특이사항이 있다면 입력해주세요"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleReturnRequest}
              disabled={returnRentalMutation.isPending}
            >
              {returnRentalMutation.isPending ? "처리 중..." : "반납 요청"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 