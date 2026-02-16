'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ApprovalItem } from '@/lib/api/approvals-api';
import { ApprovalItemCard } from './ApprovalItem';

interface ApprovalListProps {
  items: ApprovalItem[];
  isLoading: boolean;
  selectedItems: string[];
  onToggleSelect: (id: string) => void;
  onApprove: (item: ApprovalItem) => void;
  onReject: (item: ApprovalItem) => void;
  onViewDetail: (item: ApprovalItem) => void;
  actionLabel: string;
}

export function ApprovalList({
  items,
  isLoading,
  selectedItems,
  onToggleSelect,
  onApprove,
  onReject,
  onViewDetail,
  actionLabel,
}: ApprovalListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-l-4 border-l-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-48" />
                    </div>
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>승인 대기 목록</CardTitle>
        <CardDescription>총 {items.length}개의 승인 대기 요청이 있습니다</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground" role="status" aria-live="polite">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p>승인 대기 중인 요청이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="approval-list">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ApprovalItemCard
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onToggleSelect={() => onToggleSelect(item.id)}
                  onApprove={() => onApprove(item)}
                  onReject={() => onReject(item)}
                  onViewDetail={() => onViewDetail(item)}
                  actionLabel={actionLabel}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
