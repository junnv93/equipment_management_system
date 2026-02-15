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
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded bg-muted animate-pulse" />
        <div>
          <div className="h-7 w-24 rounded bg-muted animate-pulse" />
          <div className="h-4 w-40 rounded bg-muted animate-pulse mt-1" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}
