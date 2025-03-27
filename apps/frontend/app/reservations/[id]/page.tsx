"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import reservationApi from "@/lib/api/reservation-api";
import type { ReservationStatus } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Calendar, Clock, User, Package, FileText, AlertCircle, CheckCircle2, XCircle, Edit, ArrowLeft } from "lucide-react";

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const reservationId = params.id as string;
  
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  
  // 예약 상세 정보 조회
  const { data: reservation, isLoading, isError } = useQuery({
    queryKey: ["reservation", reservationId],
    queryFn: () => reservationApi.getReservation(reservationId),
    enabled: !!reservationId,
  });

  // 예약 승인 뮤테이션
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await reservationApi.approveReservation(id, notes);
      return response;
    },
    onSuccess: () => {
      toast({
        id: `approve-reservation-${reservationId}`,
        title: "예약이 승인되었습니다",
        description: "예약이 성공적으로 승인되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["reservation", reservationId] });
      setIsApproveDialogOpen(false);
      setApproveNotes("");
    },
    onError: (error) => {
      toast({
        id: `approve-reservation-error-${reservationId}`,
        title: "예약 승인 실패",
        description: "예약 승인 중 오류가 발생했습니다. 다시 시도해 주세요.",
        variant: "destructive",
      });
      console.error("예약 승인 오류:", error);
    },
  });

  // 예약 거부 뮤테이션
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await reservationApi.rejectReservation(id, reason);
      return response;
    },
    onSuccess: () => {
      toast({
        id: `reject-reservation-${reservationId}`,
        title: "예약이 거부되었습니다",
        description: "예약이 성공적으로 거부되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["reservation", reservationId] });
      setRejectReason("");
      setIsRejectDialogOpen(false);
    },
    onError: (error) => {
      toast({
        id: `reject-reservation-error-${reservationId}`,
        title: "예약 거부 실패",
        description: "예약 거부 중 오류가 발생했습니다. 다시 시도해 주세요.",
        variant: "destructive",
      });
      console.error("예약 거부 오류:", error);
    },
  });

  // 예약 취소(삭제) 뮤테이션
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await reservationApi.deleteReservation(id);
      return response;
    },
    onSuccess: () => {
      toast({
        id: `cancel-reservation-${reservationId}`,
        title: "예약이 취소되었습니다",
        description: "예약이 성공적으로 취소되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      router.push("/reservations");
    },
    onError: (error) => {
      toast({
        id: `cancel-reservation-error-${reservationId}`,
        title: "예약 취소 실패",
        description: "예약 취소 중 오류가 발생했습니다. 다시 시도해 주세요.",
        variant: "destructive",
      });
      console.error("예약 취소 오류:", error);
    },
  });

  // 장비 반납(예약 완료) 뮤테이션
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await reservationApi.completeReservation(id);
      return response;
    },
    onSuccess: () => {
      toast({
        id: `complete-reservation-${reservationId}`,
        title: "장비가 반납되었습니다",
        description: "예약이 성공적으로 완료되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["reservation", reservationId] });
    },
    onError: (error) => {
      toast({
        id: `complete-reservation-error-${reservationId}`,
        title: "장비 반납 실패",
        description: "장비 반납 중 오류가 발생했습니다. 다시 시도해 주세요.",
        variant: "destructive",
      });
      console.error("장비 반납 오류:", error);
    },
  });

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy년 MM월 dd일 HH:mm", { locale: ko });
    } catch (error) {
      return dateString;
    }
  };

  // 상태별 뱃지 렌더링
  const renderStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="ml-2">승인 대기</Badge>;
      case "APPROVED":
        return <Badge variant="success" className="ml-2">승인됨</Badge>;
      case "REJECTED":
        return <Badge variant="destructive" className="ml-2">거절됨</Badge>;
      case "CANCELED":
        return <Badge variant="secondary" className="ml-2">취소됨</Badge>;
      case "COMPLETED":
        return <Badge variant="default" className="ml-2">완료됨</Badge>;
      default:
        return <Badge className="ml-2">{status}</Badge>;
    }
  };

  // 예약 수정 페이지로 이동
  const handleEdit = () => {
    router.push(`/reservations/${reservationId}/edit`);
  };

  // 예약 목록 페이지로 이동
  const handleGoBack = () => {
    router.push("/reservations");
  };

  // 예약 승인 처리
  const handleApprove = () => {
    setIsApproveDialogOpen(true);
  };

  // 예약 거부 처리
  const handleReject = () => {
    setIsRejectDialogOpen(true);
  };

  // 예약 취소 처리
  const handleCancel = () => {
    if (window.confirm("정말로 이 예약을 취소하시겠습니까?")) {
      cancelMutation.mutate(reservationId);
    }
  };

  // 승인 다이얼로그
  const handleApproveDialogConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    approveMutation.mutate({ id: reservationId, notes: approveNotes });
  };

  // 거부 다이얼로그
  const handleRejectDialogConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rejectReason.trim()) {
      toast({
        id: "reject-reason-required",
        title: "거부 사유 필요",
        description: "거부 사유를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ id: reservationId, reason: rejectReason });
  };

  // 기기 반납 함수
  const handleReturn = () => {
    if (window.confirm("장비를 반납하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      completeMutation.mutate(reservationId);
    }
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
        <Button variant="ghost" onClick={handleGoBack} className="mb-6">
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button onClick={() => router.back()} variant="ghost" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> 뒤로 가기
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 예약 정보 카드 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  예약 상세 정보
                  {renderStatusBadge(reservation.status as ReservationStatus)}
                </CardTitle>
                <CardDescription>예약 ID: {reservation.id}</CardDescription>
              </div>
              
              {reservation.status === "PENDING" && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  수정
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-muted-foreground" />
                <h3 className="text-lg font-medium">장비 정보</h3>
              </div>
              <div className="ml-7">
                <p className="text-lg font-semibold">
                  {reservation.equipment?.name || "정보 없음"}
                </p>
                <p className="text-sm text-muted-foreground">
                  관리번호: {reservation.equipment?.managementNumber || "정보 없음"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-muted-foreground" />
                <h3 className="text-lg font-medium">예약자 정보</h3>
              </div>
              <div className="ml-7">
                <p className="font-semibold">{reservation.user?.name || "정보 없음"}</p>
                <p className="text-sm text-muted-foreground">
                  {reservation.user?.email || "정보 없음"}
                </p>
                {reservation.user?.department && (
                  <p className="text-sm text-muted-foreground">
                    부서: {reservation.user.department}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                <h3 className="text-lg font-medium">예약 일시</h3>
              </div>
              <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">시작 일시</p>
                  <p className="font-semibold">
                    {formatDate(reservation.startDate.toString())}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">종료 일시</p>
                  <p className="font-semibold">
                    {formatDate(reservation.endDate.toString())}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                <h3 className="text-lg font-medium">예약 목적</h3>
              </div>
              <div className="ml-7">
                <p className="text-gray-800">{reservation.purpose}</p>
              </div>
            </div>

            {reservation.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                    <h3 className="text-lg font-medium">추가 메모</h3>
                  </div>
                  <div className="ml-7">
                    <p className="text-gray-800">{reservation.notes}</p>
                  </div>
                </div>
              </>
            )}

            {reservation.rejectionReason && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                    <h3 className="text-lg font-medium text-destructive">거부 사유</h3>
                  </div>
                  <div className="ml-7">
                    <p className="text-destructive">{reservation.rejectionReason}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 작업 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>작업</CardTitle>
            <CardDescription>예약에 대한 작업을 수행합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reservation.status === "PENDING" && (
              <>
                <Button
                  className="w-full"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  예약 승인
                </Button>
                
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      variant="destructive"
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      예약 거부
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>예약 거부</DialogTitle>
                      <DialogDescription>
                        예약을 거부하는 이유를 입력해주세요.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRejectDialogConfirm}>
                      <div className="space-y-4 py-2">
                        <Textarea
                          placeholder="거부 사유를 입력하세요"
                          className="resize-none"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          required
                        />
                      </div>
                      <DialogFooter className="mt-4">
                        <Button variant="outline" type="button" onClick={() => setIsRejectDialogOpen(false)}>
                          취소
                        </Button>
                        <Button variant="destructive" type="submit" disabled={rejectMutation.isPending || !rejectReason.trim()}>
                          거부
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleEdit}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  예약 수정
                </Button>
                
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                >
                  예약 취소
                </Button>
              </>
            )}

            {reservation.status === "APPROVED" && (
              <>
                <Button
                  className="w-full"
                  variant="default"
                  onClick={handleReturn}
                  disabled={completeMutation.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  장비 반납
                </Button>
                
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                >
                  예약 취소
                </Button>
              </>
            )}

            <Button
              className="w-full"
              variant="secondary"
              onClick={() => router.push(`/equipment/${reservation.equipmentId}`)}
            >
              장비 정보 보기
            </Button>
          </CardContent>
          
          <CardFooter className="text-xs text-muted-foreground">
            <div className="w-full">
              <p>생성 일시: {formatDate(reservation.createdAt.toString())}</p>
              <p>최종 업데이트: {formatDate(reservation.updatedAt.toString())}</p>
              {reservation.approvedById && reservation.approvedBy && (
                <p className="mt-2">
                  승인자: {reservation.approvedBy.name || "정보 없음"}
                </p>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* 승인 다이얼로그 */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예약 승인</DialogTitle>
            <DialogDescription>
              이 예약을 승인하시겠습니까? 필요한 경우 승인 메모를 작성해주세요.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApproveDialogConfirm}>
            <div className="space-y-4 py-2">
              <Textarea
                placeholder="승인 메모 (선택사항)"
                className="resize-none"
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
              />
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setIsApproveDialogOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={approveMutation.isPending}>
                승인
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 