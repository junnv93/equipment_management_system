"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Filter, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import equipmentApi, { Equipment } from "@/lib/api/equipment-api";
import calibrationApi from "@/lib/api/calibration-api";
import { format, addDays, differenceInDays, isBefore } from "date-fns";

export default function CalibrationPage() {
  const router = useRouter();
  
  // 상태 관리
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [currentTab, setCurrentTab] = useState("all");
  
  // 교정 요약 통계 조회
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['calibration-summary'],
    queryFn: () => calibrationApi.getCalibrationSummary(),
  });
  
  // 교정 기한 초과 장비 조회
  const { data: overdueData, isLoading: isOverdueLoading } = useQuery({
    queryKey: ['calibration-overdue'],
    queryFn: () => calibrationApi.getOverdueCalibrations(),
  });
  
  // 30일 이내 교정 예정 장비 조회
  const { data: upcomingData, isLoading: isUpcomingLoading } = useQuery({
    queryKey: ['calibration-upcoming'],
    queryFn: () => calibrationApi.getUpcomingCalibrations(30),
  });
  
  // 장비 목록 조회
  const { data: equipmentData, isLoading: isEquipmentLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => equipmentApi.getEquipmentList({
      pageSize: 1000,
    }),
  });

  // 모든 교정 이력 조회
  const { data: calibrationHistoryData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['calibration-history'],
    queryFn: () => calibrationApi.getCalibrationHistory({
      pageSize: 1000,
    }),
  });
  
  // 로딩 상태 통합
  const isLoading = isSummaryLoading || isOverdueLoading || isUpcomingLoading || isEquipmentLoading || isHistoryLoading;
  
  // 데이터 연결 상태 확인
  const isError = !summaryData && !overdueData && !upcomingData && !equipmentData && !calibrationHistoryData;
  
  // 교정 데이터 준비
  const getFilteredCalibrationData = () => {
    if (currentTab === "overdue" && overdueData) {
      return overdueData.filter(item => 
        (!searchTerm || 
          item.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.managementNumber.toLowerCase().includes(searchTerm.toLowerCase())
        ) &&
        (teamFilter === "all" || item.team === teamFilter)
      );
    }
    
    if (currentTab === "upcoming" && upcomingData) {
      return upcomingData.filter(item => 
        (!searchTerm || 
          item.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.managementNumber.toLowerCase().includes(searchTerm.toLowerCase())
        ) &&
        (teamFilter === "all" || item.team === teamFilter)
      );
    }
    
    // 전체 탭인 경우 모든 교정 이력
    if (calibrationHistoryData?.items) {
      return calibrationHistoryData.items.filter(item => 
        (!searchTerm || 
          item.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.managementNumber.toLowerCase().includes(searchTerm.toLowerCase())
        ) &&
        (teamFilter === "all" || item.team === teamFilter)
      );
    }
    
    return [];
  };
  
  const calibrationData = getFilteredCalibrationData();
  
  // 요약 통계
  const stats = {
    total: summaryData?.total || 0,
    compliant: (summaryData?.total || 0) - (summaryData?.overdueCount || 0),
    overdue: summaryData?.overdueCount || 0,
    upcoming: summaryData?.dueInMonthCount || 0,
  };

  // 날짜 형식 변환
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "yyyy-MM-dd");
  };
  
  // 교정 상태 계산
  const getCalibrationStatus = (nextCalibrationDate: string | null | undefined) => {
    if (!nextCalibrationDate) return { status: "none", text: "미등록" };
    
    const today = new Date();
    const nextDate = new Date(nextCalibrationDate);
    
    if (isBefore(nextDate, today)) {
      return { status: "overdue", text: "기한 초과" };
    }
    
    const daysRemaining = differenceInDays(nextDate, today);
    if (daysRemaining <= 30) {
      return { status: "upcoming", text: `${daysRemaining}일 남음` };
    }
    
    return { status: "ok", text: "정상" };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">교정 관리</h1>
        <Button onClick={() => router.push("/calibration/register")}>
          <Plus className="w-4 h-4 mr-2" />
          교정 정보 등록
        </Button>
      </div>
      
      {/* 교정 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">전체 교정 장비</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}대</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">정상 장비</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.compliant}대</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">교정 기한 초과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}대</div>
          </CardContent>
          {stats.overdue > 0 && (
            <CardFooter className="pt-0">
              <Link 
                href="#" 
                className="text-xs text-red-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentTab("overdue");
                }}
              >
                확인하기
              </Link>
            </CardFooter>
          )}
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">30일 이내 교정 필요</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.upcoming}대</div>
          </CardContent>
          {stats.upcoming > 0 && (
            <CardFooter className="pt-0">
              <Link 
                href="#" 
                className="text-xs text-yellow-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentTab("upcoming");
                }}
              >
                확인하기
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
      
      {/* 필터링 및 검색 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="장비명, 관리번호 검색..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center w-full md:w-64 space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={teamFilter}
            onValueChange={setTeamFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="팀 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 팀</SelectItem>
              <SelectItem value="lab1">Lab 1</SelectItem>
              <SelectItem value="lab2">Lab 2</SelectItem>
              <SelectItem value="research">연구팀</SelectItem>
              <SelectItem value="development">개발팀</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* 탭 및 장비 목록 */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-500">기한 초과</TabsTrigger>
          <TabsTrigger value="upcoming" className="text-yellow-500">30일 이내 예정</TabsTrigger>
        </TabsList>
        
        <TabsContent value={currentTab} className="mt-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : isError ? (
            <div className="flex justify-center py-8 text-red-500">
              <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
            </div>
          ) : calibrationData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarDays className="h-12 w-12 text-gray-300 mb-2" />
              <h3 className="text-lg font-medium">교정 정보가 없습니다</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                {currentTab === "all" 
                  ? "등록된 교정 정보가 없습니다." 
                  : currentTab === "overdue" 
                    ? "기한이 초과된 장비가 없습니다." 
                    : "30일 이내 교정 예정 장비가 없습니다."}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push("/calibration/register")}
              >
                교정 정보 등록하기
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>장비명</TableHead>
                    <TableHead>관리번호</TableHead>
                    <TableHead>팀</TableHead>
                    <TableHead>교정일</TableHead>
                    <TableHead>다음 교정일</TableHead>
                    <TableHead>교정 기관</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calibrationData.map((item) => {
                    const calibrationStatus = getCalibrationStatus(item.nextCalibrationDate);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <Link href={`/equipment/${item.equipmentId}`} className="hover:underline">
                            {item.equipmentName}
                          </Link>
                        </TableCell>
                        <TableCell>{item.managementNumber}</TableCell>
                        <TableCell>{item.team || "-"}</TableCell>
                        <TableCell>{formatDate(item.calibrationDate)}</TableCell>
                        <TableCell>{formatDate(item.nextCalibrationDate)}</TableCell>
                        <TableCell>{item.calibrationAgency}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              calibrationStatus.status === "overdue" ? "bg-red-500" :
                              calibrationStatus.status === "upcoming" ? "bg-yellow-500" :
                              calibrationStatus.status === "ok" ? "bg-green-500" :
                              "bg-gray-300"
                            }`} />
                            <span className={
                              calibrationStatus.status === "overdue" ? "text-red-500" :
                              calibrationStatus.status === "upcoming" ? "text-yellow-500" :
                              calibrationStatus.status === "ok" ? "text-green-500" :
                              "text-gray-500"
                            }>
                              {calibrationStatus.text}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/calibration/register?equipmentId=${item.equipmentId}`)}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            교정 등록
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 