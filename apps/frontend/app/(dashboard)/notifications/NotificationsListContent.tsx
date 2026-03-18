'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
import { NOTIFICATION_CATEGORIES } from '@equipment-management/shared-constants';
import type { UINotificationFilters } from '@/lib/utils/notification-filter-utils';
import {
  NOTIFICATION_LIST_HEADER_TOKENS,
  NOTIFICATION_LIST_FILTER_TOKENS,
  NOTIFICATION_LIST_SKELETON_TOKENS,
  NOTIFICATION_LIST_EMPTY_TOKENS,
  NOTIFICATION_LIST_PAGINATION_TOKENS,
  NOTIFICATION_LIST_ITEM_TOKENS,
  getStaggerDelay,
  getPageContainerClasses,
} from '@/lib/design-tokens';

/**
 * 알림 목록 페이지 (클라이언트 컴포넌트)
 *
 * URL-driven filter SSOT 패턴 적용
 * - URL 파라미터: ?tab=unread&category=checkout&search=교정&page=2
 * - "전체" 선택 = 파라미터 생략 (프로젝트 통일 규칙)
 */
export default function NotificationsListContent() {
  const t = useTranslations('notifications');
  const { filters, apiFilters, updateFilters } = useNotificationFilters();
  const [searchInput, setSearchInput] = useState(filters.search);

  /** "전체" + SSOT 카테고리로 필터 옵션 생성 */
  const categoryOptions = [
    { value: '_all', label: t('list.categoryAll') },
    ...NOTIFICATION_CATEGORIES.map((cat) => ({
      value: cat,
      label: t(`category.${cat}.label` as Parameters<typeof t>[0]),
    })),
  ];

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notificationData, isLoading } = useNotificationList(apiFilters);

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = notificationData?.items ?? [];
  const total = notificationData?.total ?? 0;
  const totalPages = notificationData?.totalPages ?? 1;

  // Debounced search (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search: searchInput });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, updateFilters]);

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  return (
    <div className={getPageContainerClasses()}>
      {/* 헤더 */}
      <div className={NOTIFICATION_LIST_HEADER_TOKENS.container}>
        <div className={NOTIFICATION_LIST_HEADER_TOKENS.titleGroup}>
          <div className={NOTIFICATION_LIST_HEADER_TOKENS.iconWrapper}>
            <Bell className={NOTIFICATION_LIST_HEADER_TOKENS.icon} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className={NOTIFICATION_LIST_HEADER_TOKENS.unreadBadge}>
                <span className={NOTIFICATION_LIST_HEADER_TOKENS.unreadBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </div>
          <div>
            <h1 className={NOTIFICATION_LIST_HEADER_TOKENS.title}>{t('title')}</h1>
            <p className={NOTIFICATION_LIST_HEADER_TOKENS.subtitle}>
              {unreadCount > 0 ? t('list.unreadCount', { count: unreadCount }) : t('list.noUnread')}
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
            {t('list.markAllRead')}
          </Button>
        )}
      </div>

      {/* 탭 + 필터 */}
      <Tabs
        value={filters.tab}
        onValueChange={(v) => updateFilters({ tab: v as 'all' | 'unread' })}
      >
        <div className={NOTIFICATION_LIST_FILTER_TOKENS.filterRow}>
          <TabsList>
            <TabsTrigger value="all">{t('list.tabs.all')}</TabsTrigger>
            <TabsTrigger value="unread">
              {t('list.tabs.unread')}
              {unreadCount > 0 && (
                <span className={NOTIFICATION_LIST_FILTER_TOKENS.tabBadge}>{unreadCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className={NOTIFICATION_LIST_FILTER_TOKENS.filterGroup}>
            <Select
              value={filters.category || '_all'}
              onValueChange={(v) =>
                updateFilters({
                  category: v === '_all' ? '' : (v as UINotificationFilters['category']),
                })
              }
            >
              <SelectTrigger
                className={NOTIFICATION_LIST_FILTER_TOKENS.categorySelect}
                aria-label={t('list.categoryAriaLabel')}
              >
                <SelectValue placeholder={t('list.categoryFilter')} />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              name="search"
              aria-label={t('list.searchAriaLabel')}
              placeholder={t('list.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={NOTIFICATION_LIST_FILTER_TOKENS.searchInput}
            />
          </div>
        </div>

        <TabsContent value="all" className={NOTIFICATION_LIST_FILTER_TOKENS.tabContent}>
          <NotificationsList
            notifications={notifications}
            isLoading={isLoading}
            onMarkAsRead={handleMarkAsRead}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>
        <TabsContent value="unread" className={NOTIFICATION_LIST_FILTER_TOKENS.tabContent}>
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
        <div className={NOTIFICATION_LIST_PAGINATION_TOKENS.container}>
          <p className={NOTIFICATION_LIST_PAGINATION_TOKENS.info}>
            {t('list.pagination.total', {
              total,
              start: (filters.page - 1) * 20 + 1,
              end: Math.min(filters.page * 20, total),
            })}
          </p>
          <div className={NOTIFICATION_LIST_PAGINATION_TOKENS.buttonGroup}>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => updateFilters({ page: filters.page - 1 })}
            >
              {t('list.pagination.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= totalPages}
              onClick={() => updateFilters({ page: filters.page + 1 })}
            >
              {t('list.pagination.next')}
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
  const t = useTranslations('notifications');
  if (isLoading) {
    return (
      <div className={NOTIFICATION_LIST_SKELETON_TOKENS.container}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={NOTIFICATION_LIST_SKELETON_TOKENS.card}
            style={{ animationDelay: getStaggerDelay(i, 'list') }}
          >
            <div className={NOTIFICATION_LIST_SKELETON_TOKENS.row}>
              <div className={NOTIFICATION_LIST_SKELETON_TOKENS.iconPlaceholder} />
              <div className={NOTIFICATION_LIST_SKELETON_TOKENS.contentGroup}>
                <div className={NOTIFICATION_LIST_SKELETON_TOKENS.titleLine} />
                <div className={NOTIFICATION_LIST_SKELETON_TOKENS.bodyLine} />
                <div className={NOTIFICATION_LIST_SKELETON_TOKENS.timeLine} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={NOTIFICATION_LIST_EMPTY_TOKENS.container}>
        <div className={NOTIFICATION_LIST_EMPTY_TOKENS.iconWrapper}>
          <Bell className={NOTIFICATION_LIST_EMPTY_TOKENS.icon} aria-hidden="true" />
          <div className={NOTIFICATION_LIST_EMPTY_TOKENS.checkmark}>
            <span className={NOTIFICATION_LIST_EMPTY_TOKENS.checkmarkText}>✓</span>
          </div>
        </div>
        <h3 className={NOTIFICATION_LIST_EMPTY_TOKENS.title}>{t('list.allRead.title')}</h3>
        <p className={NOTIFICATION_LIST_EMPTY_TOKENS.desc}>{t('list.allRead.description')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={NOTIFICATION_LIST_ITEM_TOKENS.wrapper}
          style={{ animationDelay: getStaggerDelay(index, 'list') }}
        >
          <NotificationItem notification={notification} onMarkAsRead={onMarkAsRead} />
          <Button
            variant="ghost"
            size="icon"
            className={NOTIFICATION_LIST_ITEM_TOKENS.deleteBtn}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            aria-label={t('list.deleteAriaLabel')}
          >
            <Trash2 className={NOTIFICATION_LIST_ITEM_TOKENS.deleteIcon} aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  );
}
