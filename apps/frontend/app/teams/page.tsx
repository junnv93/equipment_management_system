"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  UserPlus,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 임시 팀 데이터
const mockTeams = [
  {
    id: "1",
    name: "RF 개발팀",
    description: "RF 회로 설계 및 개발 담당",
    memberCount: 8,
    equipmentCount: 15,
    leadName: "김팀장",
    leadId: "user1",
    createdAt: "2022-01-15"
  },
  {
    id: "2",
    name: "SW 개발팀",
    description: "펌웨어 및 소프트웨어 개발",
    memberCount: 12,
    equipmentCount: 8,
    leadName: "박개발",
    leadId: "user2",
    createdAt: "2022-01-20"
  },
  {
    id: "3",
    name: "품질관리팀",
    description: "제품 테스트 및 품질 검증",
    memberCount: 6,
    equipmentCount: 20,
    leadName: "이품질",
    leadId: "user3",
    createdAt: "2022-02-05"
  },
  {
    id: "4",
    name: "전자회로 설계팀",
    description: "디지털/아날로그 회로 설계",
    memberCount: 7,
    equipmentCount: 12,
    leadName: "최설계",
    leadId: "user4",
    createdAt: "2022-03-10"
  },
  {
    id: "5",
    name: "장비관리팀",
    description: "장비 유지보수 및 교정 관리",
    memberCount: 4,
    equipmentCount: 5,
    leadName: "정관리",
    leadId: "user5",
    createdAt: "2022-05-20"
  }
];

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // 검색 기능
  const filteredTeams = mockTeams.filter(team => {
    if (searchQuery === "") return true;
    
    return (
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.leadName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  return (
    <div className="p-6 space-y-6">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">팀 관리</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          팀 생성
        </Button>
      </div>
      
      {/* 검색 영역 */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="팀 검색..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      
      {/* 팀 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map(team => (
          <Link key={team.id} href={`/teams/${team.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{team.name}</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">{team.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span>멤버 {team.memberCount}명</span>
                  </div>
                  <div>
                    <span>장비 {team.equipmentCount}개</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">팀장: </span>
                    <span>{team.leadName}</span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    <UserPlus className="h-3 w-3 mr-1" />
                    멤버 관리
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3 mr-1" />
                    수정
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {filteredTeams.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-lg font-medium">검색 결과가 없습니다</p>
          <p className="text-sm">다른 검색어를 시도하거나 새 팀을 생성하세요</p>
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            팀 생성
          </Button>
        </div>
      )}
    </div>
  );
} 