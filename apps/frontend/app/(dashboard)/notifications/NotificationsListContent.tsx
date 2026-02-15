'use client';

import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { NotificationItem } from '@/components/notifications/notification-item';
import type { NotificationItem as NotificationItemType } from '@/lib/api/notifications-api';
import {
  useNotificationList,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useUnreadCount,
} from '@/hooks/use-notifications';
import { useNotificationFilters } from '@/hooks/use-notification-filters';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABELS,
} from '@equipment-management/shared-constants';
import type { UINotificationFilters } from '@/lib/utils/notification-filter-utils';

/** "전체" + SSOT 카테고리로 필터 옵션 생성 */
const CATEGORY_OPTIONS = [
  { value: '_all', label: '전체' },
  ...NOTIFICATION_CATEGORIES.map((cat) => ({
    value: cat,
    label: NOTIFICATION_CATEGORY_LABELS[cat],
  })),
];

/**
 * 알림 목록 페이지 (클라이언트 컴포넌트)
 *
 * URL-driven filter SSOT 패턴 적용
 * - URL 파라미터: ?tab=unread&category=checkout&search=교정&page=2
 * - "전체" 선택 = 파라미터 생략 (프로젝트 통일 규칙)
 */
export default function NotificationsListContent() {
  const { filters, apiFilters, updateFilters } = useNotificationFilters();

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notificationData, isLoading } = useNotificationList(apiFilters);

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = notificationData?.items ?? [];
  const total = notificationData?.total ?? 0;
  const totalPages = notificationData?.totalPages ?? 1;

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold">알림</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}건` : '새로운 알림이 없습니다'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" aria-hidden="true" />
            모두 읽음으로 표시
          </Button>
        )}
      </div>

      {/* 탭 + 필터 */}
      <Tabs
        value={filters.tab}
        onValueChange={(v) => updateFilters({ tab: v as 'all' | 'unread' })}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="unread">
              안읽음
              {unreadCount > 0 && (
                <span className="ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Select
              value={filters.category || '_all'}
              onValueChange={(v) =>
                updateFilters({
                  category: v === '_all' ? '' : (v as UINotificationFilters['category']),
                })
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              name="search"
              aria-label="알림 검색"
              placeholder="알림 검색..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="w-[200px]"
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <NotificationsList
            notifications={notifications}
            isLoading={isLoading}
            onMarkAsRead={handleMarkAsRead}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>
        <TabsContent value="unread" className="mt-4">
          <NotificationsList
            notifications={notifications}
            isLoading={isLoading}
            onMarkAsRead={handleMarkAsRead}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>
      </Tabs>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {total}건 중 {(filters.page - 1) * 20 + 1}-{Math.min(filters.page * 20, total)}건
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => updateFilters({ page: filters.page - 1 })}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= totalPages}
              onClick={() => updateFilters({ page: filters.page + 1 })}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsList({
  notifications,
  isLoading,
  onMarkAsRead,
  onDelete,
}: {
  notifications: NotificationItemType[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" aria-hidden="true" />
        <p>표시할 알림이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <div key={notification.id} className="relative group">
          <NotificationItem notification={notification} onMarkAsRead={onMarkAsRead} />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            aria-label="알림 삭제"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  );
}
