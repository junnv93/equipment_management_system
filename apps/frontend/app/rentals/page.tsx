"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarClock, ClipboardList, Clock, Search, Plus, Filter } from "lucide-react";
import rentalApi, { Rental, RentalSummary } from "@/lib/api/rental-api";

export default function RentalsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // 대여 요약 정보 가져오기
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["rental-summary"],
    queryFn: () => rentalApi.getRentalSummary(),
  });

  // 대여 목록 가져오기
  const { data: rentalsData, isLoading: rentalsLoading } = useQuery({
    queryKey: ["rentals", currentTab, statusFilter, searchTerm],
    queryFn: async () => {
      const query: any = {
        pageSize: 100,
        search: searchTerm || undefined,
      };

      if (statusFilter !== "all") {
        query.status = statusFilter;
      }

      switch (currentTab) {
        case "overdue":
          return rentalApi.getOverdueRentals(query);
        case "today":
          return rentalApi.getTodayReturns(query);
        default:
          return rentalApi.getRentals(query);
      }
    },
  });

  // 오늘 날짜 포맷
  const today = format(new Date(), "yyyy-MM-dd", { locale: ko });

  // 대여 상태에 따른 배지 스타일
  const getRentalStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">승인 대기중</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-50">승인됨</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-800 hover:bg-red-50">거부됨</Badge>;
      case "returned":
        return <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-50">반납됨</Badge>;
      case "overdue":
        return <Badge variant="outline" className="bg-red-100 text-red-900 hover:bg-red-100">기한 초과</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 상태 필터 변경 핸들러
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  // 검색 결과가 없는 경우 표시할 UI
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900">대여 정보가 없습니다</h3>
      <p className="text-sm text-gray-500 mt-2 mb-4">검색 조건에 맞는 대여 정보가 없습니다.</p>
      <Button variant="outline" onClick={() => {
        setSearchTerm("");
        setStatusFilter("all");
      }}>
        필터 초기화
      </Button>
    </div>
  );

  // 로딩 중 표시할 UI
  const renderLoadingState = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
          <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
          <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
          <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
          <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
          <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대여 관리</h1>
          <p className="text-muted-foreground">장비 대여 요청 및 현황을 관리합니다.</p>
        </div>
        <Button onClick={() => router.push("/rentals/create")}>
          <Plus className="mr-2 h-4 w-4" /> 대여 신청
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">전체 대여</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.total || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">승인 대기중</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.pending || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">반납 기한 초과</CardTitle>
            <CalendarClock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.overdue || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">오늘 반납 예정</CardTitle>
            <CalendarClock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.returnedToday || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 탭과 필터 */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">전체 대여</TabsTrigger>
            <TabsTrigger value="overdue">기한 초과</TabsTrigger>
            <TabsTrigger value="today">오늘 반납</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="장비 또는 사용자 검색"
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[130px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>상태</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">승인 대기중</SelectItem>
              <SelectItem value="approved">승인됨</SelectItem>
              <SelectItem value="rejected">거부됨</SelectItem>
              <SelectItem value="returned">반납됨</SelectItem>
              <SelectItem value="overdue">기한 초과</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 대여 목록 테이블 */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>장비명</TableHead>
              <TableHead>신청자</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>대여일</TableHead>
              <TableHead>반납 예정일</TableHead>
              <TableHead>신청일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentalsLoading ? (
              renderLoadingState()
            ) : rentalsData?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {renderEmptyState()}
                </TableCell>
              </TableRow>
            ) : (
              rentalsData?.data?.map((rental: Rental) => (
                <TableRow key={rental.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/rentals/${rental.id}`)}>
                  <TableCell className="font-medium">
                    {rental.equipment?.name || '알 수 없는 장비'}
                  </TableCell>
                  <TableCell>
                    {rental.user?.name || '알 수 없는 사용자'}
                  </TableCell>
                  <TableCell>
                    {getRentalStatusBadge(rental.status)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(rental.startDate), 'yyyy-MM-dd', { locale: ko })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(rental.expectedReturnDate), 'yyyy-MM-dd', { locale: ko })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(rental.requestDate || rental.createdAt), 'yyyy-MM-dd', { locale: ko })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 