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
import {
  getHeaderButtonClasses,
  getHeaderSizeClasses,
  getNotificationBadgePositionClass,
  getNotificationBadgeClasses,
  getNotificationItemAnimation,
  NOTIFICATION_EMPTY_STATE,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

/**
 * 알림 드롭다운 (Enhanced with Design System v2)
 *
 * 더미 데이터 → TanStack Query 마이그레이션 완료
 * - useUnreadCount: 30초 폴링 + SSE 실시간 무효화
 * - useNotificationList: 최근 5개 알림 조회
 * - useMarkAsRead / useMarkAllAsRead: 뮤테이션 → onSettled에서 자동 무효화
 *
 * Design System v2 (3-Layer Token Architecture):
 * - SSOT: lib/design-tokens (primitives → semantic → components)
 * - 반응형: 모바일 44px, 데스크톱 40px (WCAG AAA)
 * - Visual Hierarchy: 알림 개수 기반 badge variant (기본/주의/긴급)
 * - Motion: Stagger animation, badge pulse
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
          className={cn('relative', getHeaderButtonClasses())}
          aria-label="알림"
        >
          <Bell className={getHeaderSizeClasses('icon')} aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                'absolute px-1 text-xs tabular-nums',
                getHeaderSizeClasses('badge'),
                getNotificationBadgePositionClass(),
                getNotificationBadgeClasses(unreadCount)
              )}
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
                  className="h-16 rounded bg-muted/50 motion-safe:animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <div className="relative inline-block mb-3 motion-safe:animate-gentle-bounce">
                <Bell
                  className={cn(
                    'mx-auto',
                    NOTIFICATION_EMPTY_STATE.icon.size,
                    NOTIFICATION_EMPTY_STATE.icon.color
                  )}
                  aria-hidden="true"
                />
                <div
                  className={cn(
                    NOTIFICATION_EMPTY_STATE.checkmark.size,
                    NOTIFICATION_EMPTY_STATE.checkmark.position,
                    NOTIFICATION_EMPTY_STATE.checkmark.background,
                    NOTIFICATION_EMPTY_STATE.checkmark.shape,
                    'flex items-center justify-center motion-safe:animate-checkmark-pop shadow-lg'
                  )}
                >
                  <span className="text-xs text-success-foreground font-bold">✓</span>
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
                  style={getNotificationItemAnimation(index)}
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
