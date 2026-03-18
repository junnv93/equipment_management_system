'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
  Loader2,
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
import {
  useNotificationList,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/use-notifications';
import type { NotificationItem } from '@/lib/api/notifications-api';
import {
  getPageContainerClasses,
  type SemanticColorKey,
  getSemanticStatusClasses,
  getSemanticBgLightClasses,
  getSemanticContainerTextClasses,
} from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';

// 알림 타입별 아이콘 및 색상 — SemanticColorKey로 SSOT
const alertTypeConfig: Record<string, { icon: React.ReactNode; semanticColor: SemanticColorKey }> =
  {
    calibration_due: {
      icon: <Calendar className="h-5 w-5" />,
      semanticColor: 'warning',
    },
    calibration_overdue: {
      icon: <Calendar className="h-5 w-5" />,
      semanticColor: 'critical',
    },
    calibration_completed: {
      icon: <CheckCircle className="h-5 w-5" />,
      semanticColor: 'ok',
    },
    maintenance_scheduled: {
      icon: <Settings className="h-5 w-5" />,
      semanticColor: 'info',
    },
    checkout_request: {
      icon: <Clock className="h-5 w-5" />,
      semanticColor: 'purple',
    },
    checkout_overdue: {
      icon: <Clock className="h-5 w-5" />,
      semanticColor: 'critical',
    },
  };

const PRIORITY_SEMANTIC_COLOR: Record<string, SemanticColorKey> = {
  high: 'critical',
  medium: 'warning',
  low: 'ok',
};

function PriorityBadge({ priority, label }: { priority: string; label: string }) {
  const semanticKey = PRIORITY_SEMANTIC_COLOR[priority];
  const colorClass = semanticKey
    ? getSemanticStatusClasses(semanticKey)
    : 'bg-muted text-muted-foreground';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{label}</span>
  );
}

function getPriorityLabel(
  priority: string,
  t: ReturnType<typeof useTranslations<'notifications.alerts'>>
): string {
  if (priority === 'high' || priority === 'medium' || priority === 'low') {
    return t(`priorityLabels.${priority}`);
  }
  return t('priorityLabels.unknown');
}

export default function AlertsContent() {
  const t = useTranslations('notifications.alerts');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isReadParam = activeTab === 'unread' ? false : activeTab === 'read' ? true : undefined;

  const { data, isLoading } = useNotificationList({
    isRead: isReadParam,
    search: searchQuery || undefined,
    pageSize: 50,
  });

  const { mutate: markAsReadMutate } = useMarkAsRead();
  const { mutate: markAllAsReadMutate } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const notifications = data?.items ?? [];

  const formatDate = (dateString: string) => format(new Date(dateString), 'yyyy-MM-dd HH:mm');

  function renderAlertList(items: NotificationItem[]) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 motion-safe:animate-spin mr-2" />
          <span>{t('loading')}</span>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <ArchiveX className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
          <p>{t('emptyState')}</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="divide-y">
          {items.map((notification) => {
            const typeConfig = alertTypeConfig[notification.type] ?? {
              icon: <Bell className="h-5 w-5" />,
              semanticColor: 'neutral' as SemanticColorKey,
            };

            return (
              <div
                key={notification.id}
                className={`p-4 flex items-start gap-4 ${
                  !notification.isRead ? 'bg-brand-info/10' : 'bg-background'
                }`}
              >
                <div
                  className={`p-2 rounded-full ${getSemanticBgLightClasses(typeConfig.semanticColor)} ${getSemanticContainerTextClasses(typeConfig.semanticColor)}`}
                >
                  {typeConfig.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate">{notification.title}</h3>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <PriorityBadge
                        priority={notification.priority}
                        label={getPriorityLabel(notification.priority, t)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.content}</p>

                  {notification.linkUrl && (
                    <div className="mt-2">
                      <Link
                        href={notification.linkUrl}
                        className="text-sm text-brand-info hover:text-brand-info/80"
                      >
                        {notification.entityType === 'equipment'
                          ? t('viewEquipment', { name: notification.title })
                          : t('viewDetail')}
                      </Link>
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!notification.isRead && (
                      <DropdownMenuItem onClick={() => markAsReadMutate(notification.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('markRead')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => deleteNotification(notification.id)}>
                      <Trash className="h-4 w-4 mr-2" />
                      {t('delete')}
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

  return (
    <div className={getPageContainerClasses()}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button variant="outline" size="sm" onClick={() => markAllAsReadMutate()}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {t('markAllRead')}
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href="/settings/notifications">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
          <TabsTrigger value="unread">{t('tabs.unread')}</TabsTrigger>
          <TabsTrigger value="read">{t('tabs.read')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {renderAlertList(notifications)}
        </TabsContent>
        <TabsContent value="unread" className="space-y-4">
          {renderAlertList(notifications)}
        </TabsContent>
        <TabsContent value="read" className="space-y-4">
          {renderAlertList(notifications)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
