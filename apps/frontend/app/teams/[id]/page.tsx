"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Plus,
  Search,
  Trash,
  UserCircle,
  Users,
  Workflow,
  Settings,
  MoreHorizontal,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 임시 팀 상세 데이터
const mockTeamDetail = {
  id: "1",
  name: "RF 개발팀",
  description: "RF 회로 설계 및 개발 담당팀. 회로 설계, 테스트, 검증 및 양산 지원을 담당합니다.",
  leadName: "김팀장",
  leadId: "user1",
  leadEmail: "kim@example.com",
  leadPhone: "010-1234-5678",
  createdAt: "2022-01-15",
  updatedAt: "2023-05-20",
  departmentName: "연구개발본부",
  location: "대전 연구소 3층",
  equipmentCount: 15
};

// 임시 팀원 데이터
const mockTeamMembers = [
  {
    id: "user1",
    name: "김팀장",
    role: "팀장",
    position: "수석연구원",
    email: "kim@example.com",
    phone: "010-1234-5678",
    joinDate: "2020-01-15",
    imageUrl: null
  },
  {
    id: "user6",
    name: "이연구",
    role: "팀원",
    position: "책임연구원",
    email: "lee@example.com",
    phone: "010-2345-6789",
    joinDate: "2020-03-10",
    imageUrl: null
  },
  {
    id: "user7",
    name: "박엔지니어",
    role: "팀원",
    position: "선임연구원",
    email: "park@example.com",
    phone: "010-3456-7890",
    joinDate: "2021-05-20",
    imageUrl: null
  },
  {
    id: "user8",
    name: "최개발",
    role: "팀원",
    position: "연구원",
    email: "choi@example.com",
    phone: "010-4567-8901",
    joinDate: "2022-02-15",
    imageUrl: null
  },
  {
    id: "user9",
    name: "정시험",
    role: "팀원",
    position: "연구원",
    email: "jung@example.com",
    phone: "010-5678-9012",
    joinDate: "2022-08-10",
    imageUrl: null
  },
  {
    id: "user10",
    name: "강테스트",
    role: "팀원",
    position: "연구원",
    email: "kang@example.com",
    phone: "010-6789-0123",
    joinDate: "2023-01-05",
    imageUrl: null
  },
  {
    id: "user11",
    name: "조인턴",
    role: "인턴",
    position: "인턴연구원",
    email: "jo@example.com",
    phone: "010-7890-1234",
    joinDate: "2023-06-01",
    imageUrl: null
  },
  {
    id: "user12",
    name: "윤신입",
    role: "팀원",
    position: "연구원",
    email: "yoon@example.com",
    phone: "010-8901-2345",
    joinDate: "2023-07-15",
    imageUrl: null
  }
];

// 임시 장비 데이터
const mockTeamEquipment = [
  {
    id: "eq1",
    name: "오실로스코프 DSO-X 1102G",
    managementNumber: "RF-OSC-001",
    category: "테스트 장비",
    status: "available",
    lastCalibrationDate: "2023-06-15"
  },
  {
    id: "eq2",
    name: "스펙트럼 분석기 N9000B",
    managementNumber: "RF-SA-001",
    category: "테스트 장비",
    status: "in_use",
    lastCalibrationDate: "2023-05-20"
  },
  {
    id: "eq3",
    name: "파워 서플라이 E36313A",
    managementNumber: "RF-PS-001",
    category: "전원 장비",
    status: "available",
    lastCalibrationDate: "2023-04-10"
  },
  {
    id: "eq4",
    name: "네트워크 애널라이저 N5234B",
    managementNumber: "RF-NA-001",
    category: "테스트 장비",
    status: "calibration_scheduled",
    lastCalibrationDate: "2022-08-15"
  },
  {
    id: "eq5",
    name: "멀티미터 34465A",
    managementNumber: "RF-MM-001",
    category: "측정 장비",
    status: "available",
    lastCalibrationDate: "2023-02-22"
  }
];

export default function TeamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;
  const [activeTab, setActiveTab] = useState("members");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState("");
  
  // 팀 데이터 가져오기 (실제로는 API 호출)
  const team = mockTeamDetail;
  
  // 팀원 검색 필터링
  const filteredMembers = mockTeamMembers.filter(member => {
    if (memberSearchQuery === "") return true;
    
    return (
      member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      member.position.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
    );
  });
  
  // 장비 검색 필터링
  const filteredEquipment = mockTeamEquipment.filter(equipment => {
    if (equipmentSearchQuery === "") return true;
    
    return (
      equipment.name.toLowerCase().includes(equipmentSearchQuery.toLowerCase()) ||
      equipment.managementNumber.toLowerCase().includes(equipmentSearchQuery.toLowerCase()) ||
      equipment.category.toLowerCase().includes(equipmentSearchQuery.toLowerCase())
    );
  });
  
  // 장비 상태 배지 컴포넌트
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string, label: string }> = {
      available: { class: "bg-green-100 text-green-800", label: "사용 가능" },
      in_use: { class: "bg-blue-100 text-blue-800", label: "사용 중" },
      maintenance: { class: "bg-yellow-100 text-yellow-800", label: "유지보수 중" },
      calibration_scheduled: { class: "bg-purple-100 text-purple-800", label: "교정 예정" },
      calibration_overdue: { class: "bg-red-100 text-red-800", label: "교정 기한 초과" }
    };

    const config = statusConfig[status] || { class: "bg-gray-100 text-gray-800", label: "알 수 없음" };
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{team.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            팀 정보 수정
          </Button>
          <Button>
            <UserCircle className="h-4 w-4 mr-2" />
            멤버 추가
          </Button>
        </div>
      </div>
      
      {/* 팀 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>팀 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">팀 설명</h3>
              <p>{team.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">소속 부서</h3>
                <p>{team.departmentName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">위치</h3>
                <p>{team.location}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">생성일</h3>
                <p>{team.createdAt}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">최종 수정일</h3>
                <p>{team.updatedAt}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">팀장 정보</h3>
              <div className="flex items-center mt-2">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  <UserCircle className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{team.leadName}</p>
                  <p className="text-sm text-gray-500">{team.leadEmail}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">팀원 수</h3>
                <p className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-gray-500" />
                  {mockTeamMembers.length}명
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">보유 장비 수</h3>
                <p className="flex items-center">
                  <Settings className="h-4 w-4 mr-1 text-gray-500" />
                  {team.equipmentCount}개
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 탭 내비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            팀원 관리
          </TabsTrigger>
          <TabsTrigger value="equipment">
            <Settings className="h-4 w-4 mr-2" />
            장비 관리
          </TabsTrigger>
        </TabsList>
        
        {/* 팀원 관리 탭 */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="팀원 검색..."
                className="pl-8"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              팀원 추가
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">이름</th>
                      <th className="text-left p-4 font-medium">직책</th>
                      <th className="text-left p-4 font-medium">이메일</th>
                      <th className="text-left p-4 font-medium">연락처</th>
                      <th className="text-left p-4 font-medium">입사일</th>
                      <th className="text-right p-4 font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map(member => (
                      <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                              <UserCircle className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.position}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{member.role}</td>
                        <td className="p-4">{member.email}</td>
                        <td className="p-4">{member.phone}</td>
                        <td className="p-4">{member.joinDate}</td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-lg font-medium">검색 결과가 없습니다</p>
              <p className="text-sm">다른 검색어를 시도하세요</p>
            </div>
          )}
        </TabsContent>
        
        {/* 장비 관리 탭 */}
        <TabsContent value="equipment" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="장비 검색..."
                className="pl-8"
                value={equipmentSearchQuery}
                onChange={(e) => setEquipmentSearchQuery(e.target.value)}
              />
            </div>
            <Link href="/equipment">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                장비 추가
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">장비명</th>
                      <th className="text-left p-4 font-medium">관리번호</th>
                      <th className="text-left p-4 font-medium">분류</th>
                      <th className="text-left p-4 font-medium">상태</th>
                      <th className="text-left p-4 font-medium">최근 교정일</th>
                      <th className="text-right p-4 font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipment.map(equipment => (
                      <tr key={equipment.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-4 font-medium">{equipment.name}</td>
                        <td className="p-4">{equipment.managementNumber}</td>
                        <td className="p-4">{equipment.category}</td>
                        <td className="p-4">{getStatusBadge(equipment.status)}</td>
                        <td className="p-4 flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                          {equipment.lastCalibrationDate}
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/equipment/${equipment.id}`}>
                            <Button variant="outline" size="sm">상세 보기</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {filteredEquipment.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-lg font-medium">검색 결과가 없습니다</p>
              <p className="text-sm">다른 검색어를 시도하세요</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 