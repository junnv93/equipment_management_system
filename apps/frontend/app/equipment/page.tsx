"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import equipmentApi, { Equipment, EquipmentQuery } from "@/lib/api/equipment-api";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { PageHeader } from "@/components/shared/PageHeader";

export default function EquipmentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // API 쿼리 파라미터 구성
  const queryParams: EquipmentQuery = {
    page,
    pageSize,
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(categoryFilter !== "all" && { category: categoryFilter }),
  };

  // 장비 데이터 불러오기
  const { data, isLoading, isError } = useQuery({
    queryKey: ['equipment', queryParams],
    queryFn: () => equipmentApi.getEquipmentList(queryParams),
  });

  // 상태에 따른 뱃지 컴포넌트
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string, darkClass: string, label: string }> = {
      AVAILABLE: { 
        class: "bg-green-100 text-green-800", 
        darkClass: "dark:bg-green-950 dark:text-green-300", 
        label: "사용 가능" 
      },
      IN_USE: { 
        class: "bg-blue-100 text-blue-800", 
        darkClass: "dark:bg-blue-950 dark:text-blue-300", 
        label: "사용 중" 
      },
      MAINTENANCE: { 
        class: "bg-yellow-100 text-yellow-800", 
        darkClass: "dark:bg-yellow-950 dark:text-yellow-300", 
        label: "유지보수 중" 
      },
      CALIBRATION: { 
        class: "bg-purple-100 text-purple-800", 
        darkClass: "dark:bg-purple-950 dark:text-purple-300", 
        label: "교정 중" 
      },
      DISPOSAL: { 
        class: "bg-red-100 text-red-800", 
        darkClass: "dark:bg-red-950 dark:text-red-300", 
        label: "폐기" 
      }
    };

    const config = statusConfig[status] || { 
      class: "bg-gray-100 text-gray-800", 
      darkClass: "dark:bg-gray-800 dark:text-gray-300", 
      label: "알 수 없음" 
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class} ${config.darkClass}`}>
        {config.label}
      </span>
    );
  };

  // 날짜 포맷 함수
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "yyyy-MM-dd", { locale: ko });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-white dark:bg-gray-900">
      <PageHeader 
        title="장비 관리" 
        actionButton={
          <Link href="/equipment/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              신규 장비 등록
            </Button>
          </Link>
        }
      />
      
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="장비명, 관리번호 검색..."
            className="pl-8"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="AVAILABLE">사용 가능</SelectItem>
              <SelectItem value="IN_USE">사용 중</SelectItem>
              <SelectItem value="MAINTENANCE">유지보수 중</SelectItem>
              <SelectItem value="CALIBRATION">교정 중</SelectItem>
              <SelectItem value="DISPOSAL">폐기</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="분류 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 분류</SelectItem>
              <SelectItem value="테스트 장비">테스트 장비</SelectItem>
              <SelectItem value="컴퓨터">컴퓨터</SelectItem>
              <SelectItem value="통신 장비">통신 장비</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden overflow-x-auto dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-gray-700">
              <TableHead className="w-[100px] md:w-auto">관리번호</TableHead>
              <TableHead>장비명</TableHead>
              <TableHead className="hidden sm:table-cell">분류</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="hidden md:table-cell">마지막 교정일</TableHead>
              <TableHead className="hidden md:table-cell">위치</TableHead>
              <TableHead className="text-right">상세</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="dark:border-gray-700">
                <TableCell colSpan={7} className="h-24 text-center">
                  데이터를 불러오는 중...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow className="dark:border-gray-700">
                <TableCell colSpan={7} className="h-24 text-center text-red-500 dark:text-red-400">
                  데이터를 불러오는 중 오류가 발생했습니다.
                </TableCell>
              </TableRow>
            ) : !data?.items || data.items.length === 0 ? (
              <TableRow className="dark:border-gray-700">
                <TableCell colSpan={7} className="h-24 text-center">
                  검색 결과가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((equipment: Equipment) => (
                <TableRow key={equipment.id} className="dark:border-gray-700">
                  <TableCell className="font-medium">
                    {equipment.managementNumber}
                  </TableCell>
                  <TableCell className="max-w-[150px] sm:max-w-none truncate">
                    {equipment.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {equipment.category}
                  </TableCell>
                  <TableCell>{getStatusBadge(equipment.status)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(equipment.lastCalibrationDate)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {equipment.location}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/equipment/${equipment.id}`}>
                      <Button variant="outline" size="sm">
                        상세
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* 페이지네이션 */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            >
              이전
            </Button>
            <span className="px-4 py-2 dark:text-gray-300">
              {page} / {data.totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              disabled={page === data.totalPages}
              onClick={() => setPage(prev => Math.min(prev + 1, data.totalPages))}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 