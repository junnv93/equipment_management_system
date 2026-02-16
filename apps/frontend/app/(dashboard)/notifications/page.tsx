import { Suspense } from 'react';
import type { Metadata } from 'next';
import NotificationsListContent from './NotificationsListContent';

export const metadata: Metadata = {
  title: '알림 - 장비 관리 시스템',
  description: '알림 목록을 확인하고 관리합니다.',
};

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsPageSkeleton />}>
      <NotificationsListContent />
    </Suspense>
  );
}

function NotificationsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
          <div>
            <div className="h-7 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-40 rounded bg-muted animate-pulse mt-1" />
          </div>
        </div>
        <div className="h-9 w-40 rounded bg-muted animate-pulse" />
      </div>

      {/* 탭 및 필터 스켈레톤 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="h-10 w-48 rounded bg-muted animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-32 rounded bg-muted animate-pulse" />
          <div className="h-10 w-48 rounded bg-muted animate-pulse" />
        </div>
      </div>

      {/* 알림 목록 스켈레톤 */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-muted/50 border-l-4 border-muted animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="h-4 w-4 rounded bg-muted-foreground/20 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                <div className="h-3 bg-muted-foreground/10 rounded w-full" />
                <div className="h-3 bg-muted-foreground/10 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
