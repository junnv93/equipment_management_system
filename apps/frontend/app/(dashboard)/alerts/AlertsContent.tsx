'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  MoreHorizontal,
  Search,
  Settings,
  Trash,
  ArchiveX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

// 임시 알림 데이터
const mockAlerts = [
  {
    id: '1',
    type: 'calibration_due',
    title: '교정 예정 알림: 오실로스코프 DSO-X 1102G',
    message: '해당 장비의 교정 기한이 7일 후에 만료됩니다. 교정 일정을 예약해주세요.',
    equipmentId: '1',
    equipmentName: '오실로스코프 DSO-X 1102G',
    date: '2023-07-25T09:30:00Z',
    status: 'unread',
    priority: 'high',
  },
  {
    id: '2',
    type: 'maintenance_scheduled',
    title: '유지보수 예정 알림: 스펙트럼 분석기 N9000B',
    message: '07월 28일에 예정된 정기 유지보수가 있습니다.',
    equipmentId: '2',
    equipmentName: '스펙트럼 분석기 N9000B',
    date: '2023-07-20T15:45:00Z',
    status: 'read',
    priority: 'medium',
  },
  {
    id: '3',
    type: 'rental_request',
    title: '장비 대여 요청: 파워 서플라이 E36313A',
    message: '김철수님이 파워 서플라이 E36313A 장비 대여를 요청했습니다.',
    equipmentId: '3',
    equipmentName: '파워 서플라이 E36313A',
    userId: 'user2',
    userName: '김철수',
    date: '2023-07-18T11:15:00Z',
    status: 'unread',
    priority: 'medium',
  },
  {
    id: '4',
    type: 'rental_overdue',
    title: '대여 기한 초과: 로직 애널라이저 16862A',
    message: '박지민님이 대여한 로직 애널라이저 16862A의 반납 기한이 2일 지났습니다.',
    equipmentId: '4',
    equipmentName: '로직 애널라이저 16862A',
    userId: 'user3',
    userName: '박지민',
    date: '2023-07-15T14:20:00Z',
    status: 'read',
    priority: 'high',
  },
  {
    id: '5',
    type: 'calibration_completed',
    title: '교정 완료: 디지털 멀티미터 34465A',
    message: '디지털 멀티미터 34465A의 교정이 완료되었습니다. 장비를 사용할 수 있습니다.',
    equipmentId: '5',
    equipmentName: '디지털 멀티미터 34465A',
    date: '2023-07-12T16:40:00Z',
    status: 'read',
    priority: 'low',
  },
];

// 알림 타입별 아이콘 및 색상
const alertTypeConfig: Record<
  string,
  { icon: React.ReactNode; bgColor: string; textColor: string }
> = {
  calibration_due: {
    icon: <Calendar className="h-5 w-5" />,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  calibration_overdue: {
    icon: <Calendar className="h-5 w-5" />,
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
  calibration_completed: {
    icon: <CheckCircle className="h-5 w-5" />,
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  maintenance_scheduled: {
    icon: <Settings className="h-5 w-5" />,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  rental_request: {
    icon: <Clock className="h-5 w-5" />,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
  },
  rental_overdue: {
    icon: <Clock className="h-5 w-5" />,
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
};

// 우선순위별 뱃지 컴포넌트
const PriorityBadge = ({ priority }: { priority: string }) => {
  const config: Record<string, { class: string; label: string }> = {
    high: { class: 'bg-red-100 text-red-800', label: '높음' },
    medium: { class: 'bg-yellow-100 text-yellow-800', label: '중간' },
    low: { class: 'bg-green-100 text-green-800', label: '낮음' },
  };

  const style = config[priority] || { class: 'bg-gray-100 text-gray-800', label: '알 수 없음' };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.class}`}>
      {style.label}
    </span>
  );
};

export default function AlertsContent() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 및 필터링된 알림 목록
  const filteredAlerts = mockAlerts.filter((alert) => {
    // 검색어 필터링
    if (
      searchQuery &&
      !alert.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !alert.message.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // 탭 필터링
    if (activeTab === 'unread' && alert.status !== 'unread') {
      return false;
    }
    if (activeTab === 'read' && alert.status !== 'read') {
      return false;
    }

    return true;
  });

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd HH:mm');
  };

  // 알림 전체 읽음 처리
  const markAllAsRead = () => {
    // TODO: 실제 API 연동 시 구현
    console.log('모든 알림 읽음 처리');
  };

  // 알림 삭제 처리
  const deleteAlert = (alertId: string) => {
    // TODO: 실제 API 연동 시 구현
    console.log(`알림 삭제: ${alertId}`);
  };

  // 특정 알림 읽음 처리
  const markAsRead = (alertId: string) => {
    // TODO: 실제 API 연동 시 구현
    console.log(`알림 읽음 처리: ${alertId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">알림 센터</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            모두 읽음 표시
          </Button>
        </div>
      </div>

      {/* 검색 및 필터 영역 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="알림 검색..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 탭 내비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">전체 알림</TabsTrigger>
          <TabsTrigger value="unread">읽지 않음</TabsTrigger>
          <TabsTrigger value="read">읽음</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {renderAlertList(filteredAlerts)}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {renderAlertList(filteredAlerts)}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {renderAlertList(filteredAlerts)}
        </TabsContent>
      </Tabs>
    </div>
  );

  // 알림 목록 렌더링 함수
  function renderAlertList(alerts: typeof mockAlerts) {
    if (alerts.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <ArchiveX className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p>표시할 알림이 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="divide-y">
          {alerts.map((alert) => {
            const typeConfig = alertTypeConfig[alert.type] || {
              icon: <Bell className="h-5 w-5" />,
              bgColor: 'bg-gray-100',
              textColor: 'text-gray-800',
            };

            return (
              <div
                key={alert.id}
                className={`p-4 flex items-start gap-4 ${
                  alert.status === 'unread' ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                {/* 알림 아이콘 */}
                <div className={`p-2 rounded-full ${typeConfig.bgColor} ${typeConfig.textColor}`}>
                  {typeConfig.icon}
                </div>

                {/* 알림 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate">{alert.title}</h3>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <PriorityBadge priority={alert.priority} />
                      <span className="text-xs text-gray-500">{formatDate(alert.date)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{alert.message}</p>

                  {/* 관련 장비 링크 */}
                  {alert.equipmentId && (
                    <div className="mt-2">
                      <Link
                        href={`/equipment/${alert.equipmentId}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        장비 상세 보기: {alert.equipmentName}
                      </Link>
                    </div>
                  )}
                </div>

                {/* 액션 메뉴 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {alert.status === 'unread' && (
                      <DropdownMenuItem onClick={() => markAsRead(alert.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        읽음 표시
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => deleteAlert(alert.id)}>
                      <Trash className="h-4 w-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
