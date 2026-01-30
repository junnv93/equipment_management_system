'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationItem } from '@/components/notifications/notification-item';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

// 더미 알림 데이터
const dummyNotifications: Notification[] = [
  {
    id: '1',
    title: '장비 반납 요청',
    content: 'Oscilloscope(EQ-002) 장비에 대한 반납 요청이 접수되었습니다.',
    type: 'return_requested',
    priority: 'medium',
    isRead: false,
    linkUrl: '/admin/return-approvals',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: '장비 반납 승인',
    content: 'Multimeter(SUW-E0001) 장비 반납 요청이 승인되었습니다.',
    type: 'return_approved',
    priority: 'medium',
    isRead: false,
    linkUrl: '/checkouts/123',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: '장비 대여 요청 승인',
    content: 'RF-Analyzer(EQ-003) 장비 대여 요청이 승인되었습니다.',
    type: 'rental_approved',
    priority: 'medium',
    isRead: true,
    linkUrl: '/checkouts/456',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: '장비 교정 일정 알림',
    content: 'Oscilloscope(EQ-002) 장비의 교정 일정이 2주 후로 예정되어 있습니다.',
    type: 'calibration_due',
    priority: 'high',
    isRead: true,
    linkUrl: '/equipments/789/calibrations',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 알림 데이터 가져오기
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // 실제 구현에서는 API 호출이 필요
        // const response = await fetch('/api/notifications');
        // const data = await response.json();

        // 임시로 더미 데이터 사용
        setNotifications(dummyNotifications);
        setUnreadCount(dummyNotifications.filter((n) => !n.isRead).length);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // 알림을 읽음으로 표시하는 함수
  const handleMarkAsRead = async (id: string) => {
    try {
      // 실제 구현에서는 API 호출이 필요
      // await fetch(`/api/notifications/${id}/read`, { method: 'POST' });

      // 임시로 로컬 상태 업데이트
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // 모든 알림을 읽음으로 표시하는 함수
  const handleMarkAllAsRead = async () => {
    try {
      // 실제 구현에서는 API 호출이 필요
      // await fetch('/api/notifications/read-all', { method: 'POST' });

      // 임시로 로컬 상태 업데이트
      setNotifications(notifications.map((notification) => ({ ...notification, isRead: true })));

      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>알림</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleMarkAllAsRead}>
              모두 읽음으로 표시
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="overflow-y-auto max-h-[60vh] min-h-[100px]">
          {isLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              알림을 불러오는 중...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              새로운 알림이 없습니다.
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center text-xs text-muted-foreground">
            모든 알림 보기
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
