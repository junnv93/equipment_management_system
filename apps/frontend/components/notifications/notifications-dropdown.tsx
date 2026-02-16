'use client';

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
import {
  useUnreadCount,
  useNotificationList,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/use-notifications';
import Link from 'next/link';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

/**
 * 알림 드롭다운
 *
 * 더미 데이터 → TanStack Query 마이그레이션 완료
 * - useUnreadCount: 30초 폴링 + SSE 실시간 무효화
 * - useNotificationList: 최근 5개 알림 조회
 * - useMarkAsRead / useMarkAllAsRead: 뮤테이션 → onSettled에서 자동 무효화
 */
export function NotificationsDropdown() {
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notificationData, isLoading } = useNotificationList({
    pageSize: 5,
  });
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notifications = notificationData?.items ?? [];

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 rounded-full"
          aria-label="알림"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-xs tabular-nums"
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
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              모두 읽음으로 표시
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="overflow-y-auto max-h-[60vh] min-h-[100px]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded bg-muted/50 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <div className="relative inline-block mb-3">
                <Bell className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden="true" />
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-success flex items-center justify-center">
                  <span className="text-xs text-success-foreground">✓</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">새로운 알림이 없습니다</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className="motion-safe:animate-[staggerFadeIn_0.2s_ease-out_forwards]"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <NotificationItem notification={notification} onMarkAsRead={handleMarkAsRead} />
                </div>
              ))}
            </div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={FRONTEND_ROUTES.NOTIFICATIONS.LIST}
            className="justify-center text-xs text-muted-foreground"
          >
            모든 알림 보기
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
