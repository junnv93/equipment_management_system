"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import rentalApi, { Rental } from "@/lib/api/rental-api";
import { ko } from "date-fns/locale";

export default function ReturnApprovalsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  // 반납 요청 목록 조회
  const { data: rentals, isLoading } = useQuery({
    queryKey: ["return-requests", activeTab],
    queryFn: async () => {
      const status = activeTab === "pending" 
        ? "return_requested" 
        : activeTab === "approved" 
          ? "returned" 
          : "all";
            
      // 실제 API 호출은 구현되어야 함
      return rentalApi.getRentals({
        statuses: status,
        search: searchTerm || undefined,
        pageSize: 50,
      });
    },
  });

  // 반납 승인 mutation
  const approveReturnMutation = useMutation({
    mutationFn: (data: { rentalId: string, notes: string }) => 
      rentalApi.approveReturn(data.rentalId, {
        status: 'approved',
        approverId: 'current-admin-id', // 실제로는 로그인한 관리자 ID
        notes: data.notes
      }),
    onSuccess: () => {
      toast({
        title: "반납 승인 완료",
        description: "장비 반납이 승인되었습니다.",
      });
      setIsApproveDialogOpen(false);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["return-requests"] });
    },
    onError: (error) => {
      toast({
        title: "반납 승인 실패",
        description: "장비 반납 승인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // 반납 거절 mutation
  const rejectReturnMutation = useMutation({
    mutationFn: (data: { rentalId: string, notes: string }) => 
      rentalApi.approveReturn(data.rentalId, {
        status: 'rejected',
        approverId: 'current-admin-id', // 실제로는 로그인한 관리자 ID
        notes: data.notes
      }),
    onSuccess: () => {
      toast({
        title: "반납 거절 완료",
        description: "장비 반납 요청이 거절되었습니다.",
      });
      setIsRejectDialogOpen(false);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["return-requests"] });
    },
    onError: (error) => {
      toast({
        title: "반납 거절 실패",
        description: "장비 반납 거절 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleApprove = () => {
    if (!selectedRental) return;
    approveReturnMutation.mutate({
      rentalId: selectedRental.id,
      notes
    });
  };

  const handleReject = () => {
    if (!selectedRental) return;
    rejectReturnMutation.mutate({
      rentalId: selectedRental.id,
      notes
    });
  };

  const openApproveDialog = (rental: Rental) => {
    setSelectedRental(rental);
    setNotes("");
    setIsApproveDialogOpen(true);
  };

  const openRejectDialog = (rental: Rental) => {
    setSelectedRental(rental);
    setNotes("");
    setIsRejectDialogOpen(true);
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
          (rental.user?.name?.toLowerCase().includes(searchLower) || false) ||
          (rental.purpose?.toLowerCase().includes(searchLower) || false)
        );
      }
      return true;
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">반납 승인 관리</h1>
        <p className="text-muted-foreground">
          장비 반납 요청을 관리하고 승인할 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>반납 요청 목록</CardTitle>
          <CardDescription>사용자가 요청한 장비 반납을 승인하거나 거절할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="장비명, 관리번호, 사용자명 검색..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">승인 대기</TabsTrigger>
              <TabsTrigger value="approved">승인 완료</TabsTrigger>
              <TabsTrigger value="all">전체</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="text-center py-8">데이터를 불러오는 중...</div>
              ) : getFilteredRentals().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "검색 결과가 없습니다." : "반납 요청이 없습니다."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>장비 정보</TableHead>
                      <TableHead>사용자</TableHead>
                      <TableHead>대여일</TableHead>
                      <TableHead>반납 예정일</TableHead>
                      <TableHead>반납 요청일</TableHead>
                      <TableHead>반납 상태</TableHead>
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
                          {rental.user?.name || "알 수 없음"}
                          <div className="text-sm text-muted-foreground">
                            {rental.user?.department || ""}
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
                        <TableCell>
                          {rental.updatedAt && rental.status === 'return_requested'
                            ? format(parseISO(rental.updatedAt), "yyyy-MM-dd", { locale: ko })
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {rental.status === 'return_requested' && (
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">승인 대기</span>
                          )}
                          {rental.status === 'returned' && (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">반납 완료</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {rental.status === 'return_requested' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openApproveDialog(rental)}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRejectDialog(rental)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
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

      {/* 승인 다이얼로그 */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반납 승인</DialogTitle>
            <DialogDescription>
              다음 장비의 반납을 승인합니다:
              <div className="mt-2 p-3 bg-muted rounded">
                <div><strong>장비:</strong> {selectedRental?.equipment?.name}</div>
                <div><strong>사용자:</strong> {selectedRental?.user?.name}</div>
                <div><strong>대여일:</strong> {selectedRental?.startDate && format(parseISO(selectedRental.startDate), "yyyy-MM-dd", { locale: ko })}</div>
                <div><strong>반납 예정일:</strong> {selectedRental?.expectedReturnDate && format(parseISO(selectedRental.expectedReturnDate), "yyyy-MM-dd", { locale: ko })}</div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">메모</label>
            <Textarea
              id="notes"
              placeholder="승인 관련 메모를 입력해주세요"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={approveReturnMutation.isPending}
            >
              {approveReturnMutation.isPending ? "처리 중..." : "승인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 거절 다이얼로그 */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반납 거절</DialogTitle>
            <DialogDescription>
              다음 장비의 반납을 거절합니다:
              <div className="mt-2 p-3 bg-muted rounded">
                <div><strong>장비:</strong> {selectedRental?.equipment?.name}</div>
                <div><strong>사용자:</strong> {selectedRental?.user?.name}</div>
                <div><strong>대여일:</strong> {selectedRental?.startDate && format(parseISO(selectedRental.startDate), "yyyy-MM-dd", { locale: ko })}</div>
                <div><strong>반납 예정일:</strong> {selectedRental?.expectedReturnDate && format(parseISO(selectedRental.expectedReturnDate), "yyyy-MM-dd", { locale: ko })}</div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="reject-reason" className="text-sm font-medium">거절 사유</label>
            <Textarea
              id="reject-reason"
              placeholder="거절 사유를 입력해주세요"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              취소
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={rejectReturnMutation.isPending}
            >
              {rejectReturnMutation.isPending ? "처리 중..." : "거절"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 