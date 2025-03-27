"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ReservationStatus } from "@equipment-management/schemas";
import { reservationApi } from "@/lib/api";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Calendar, ChevronLeft, ChevronRight, Filter, Plus, Search } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function ReservationsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // 예약 목록 조회
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reservations", status, searchTerm, page],
    queryFn: async () => {
      return reservationApi.getReservations({
        status: status ? (status as ReservationStatus) : undefined,
        page,
        limit: 10,
      });
    },
  });

  // 상태별 뱃지 스타일
  const getStatusBadge = (status: string) => {
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

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy년 MM월 dd일 HH:mm", { locale: ko });
    } catch (error) {
      return dateString;
    }
  };

  // 예약 상세 페이지로 이동
  const handleViewReservation = (id: string) => {
    router.push(`/reservations/${id}`);
  };

  // 새 예약 생성 페이지로 이동
  const handleCreateReservation = () => {
    router.push("/reservations/create");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">장비 예약 관리</h1>
        <Button onClick={handleCreateReservation}>
          <Plus className="mr-2 h-4 w-4" />
          새 예약
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>장비 예약 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="장비 이름 또는 사용자 검색..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[180px]">
              <Select
                value={status}
                onValueChange={setStatus}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="모든 상태" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">모든 상태</SelectItem>
                  <SelectItem value="PENDING">승인 대기</SelectItem>
                  <SelectItem value="APPROVED">승인됨</SelectItem>
                  <SelectItem value="REJECTED">거절됨</SelectItem>
                  <SelectItem value="CANCELED">취소됨</SelectItem>
                  <SelectItem value="COMPLETED">완료됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : isError ? (
            <div className="text-center py-10 text-red-500">
              예약 데이터를 불러오는 중 오류가 발생했습니다.
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>장비명</TableHead>
                      <TableHead>예약자</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          예약 일시
                        </div>
                      </TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-medium">
                          {reservation.equipment?.name || "알 수 없음"}
                        </TableCell>
                        <TableCell>
                          {reservation.user?.name || "알 수 없음"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {formatDate(reservation.startDate.toString())}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ~ {formatDate(reservation.endDate.toString())}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(reservation.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReservation(reservation.id)}
                          >
                            상세보기
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data.meta && data.meta.pagination && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        />
                      </PaginationItem>
                      
                      {Array.from(
                        { length: Math.min(5, data.meta.pagination.totalPages) },
                        (_, i) => {
                          const pageNumber = page <= 3 
                            ? i + 1 
                            : page - 2 + i;
                          
                          if (pageNumber > data.meta.pagination.totalPages) return null;
                          
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                isActive={page === pageNumber}
                                onClick={() => setPage(pageNumber)}
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => p + 1)}
                          disabled={page >= data.meta.pagination.totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              예약 정보가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 