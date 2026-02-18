/**
 * Equipment Timeline (공유 컴포넌트)
 *
 * SSOT: 4개 타임라인 탭의 공통 렌더링 로직 통합
 * - LocationHistoryTab
 * - MaintenanceHistoryTab
 * - CheckoutHistoryTab
 * - IncidentHistoryTab
 *
 * 각 탭은 고유한 content를 전달하고, 이 컴포넌트는 타임라인 UI만 담당
 */

'use client';

import { type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  TIMELINE_TOKENS,
  TIMELINE_SKELETON_TOKENS,
  getTimelineNodeClasses,
} from '@/lib/design-tokens';

/**
 * 타임라인 아이템 인터페이스
 */
export interface TimelineItem {
  /** 고유 ID */
  id: string;
  /** 아이콘 컴포넌트 */
  icon: LucideIcon;
  /** 아이콘 배경 색상 (예: 'bg-ul-midnight', 'bg-ul-green') */
  iconBg: string;
  /** 최신 항목 여부 */
  isLatest: boolean;
  /** 날짜 (표시용) */
  date: string | Date;
  /** 고유 콘텐츠 (각 탭의 상세 정보) */
  content: React.ReactNode;
}

/**
 * EquipmentTimeline Props
 */
export interface EquipmentTimelineProps {
  /** 타임라인 아이템 목록 */
  items: TimelineItem[];
  /** 빈 상태 메시지 (기본: "등록된 이력이 없습니다.") */
  emptyMessage?: string;
  /** 빈 상태 아이콘 (기본: 없음) */
  emptyIcon?: LucideIcon;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 로딩 스켈레톤 개수 (기본: 3) */
  skeletonCount?: number;
}

/**
 * 타임라인 스켈레톤
 */
function TimelineSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={TIMELINE_TOKENS.spacing.itemGap}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className={cn(TIMELINE_SKELETON_TOKENS.node, 'flex-shrink-0')} />
          <div className="flex-1 space-y-2">
            <Skeleton className={cn(TIMELINE_SKELETON_TOKENS.line, 'w-3/4')} />
            <Skeleton className={cn(TIMELINE_SKELETON_TOKENS.card, 'w-full')} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 빈 상태
 */
function TimelineEmpty({ message, icon: Icon }: { message?: string; icon?: LucideIcon }) {
  return (
    <div className={TIMELINE_TOKENS.empty.container}>
      {Icon && <Icon className={TIMELINE_TOKENS.empty.icon} />}
      <p className={TIMELINE_TOKENS.empty.text}>{message}</p>
    </div>
  );
}

/**
 * Equipment Timeline
 *
 * @example
 * ```tsx
 * <EquipmentTimeline
 *   items={history.map((item) => ({
 *     id: item.id,
 *     icon: MapPin,
 *     iconBg: 'bg-ul-midnight',
 *     isLatest: index === 0,
 *     date: item.changedAt,
 *     content: (
 *       <Card>
 *         <CardContent>
 *           <p>{item.newLocation}</p>
 *         </CardContent>
 *       </Card>
 *     ),
 *   }))}
 *   emptyMessage="등록된 위치 변동 이력이 없습니다."
 *   emptyIcon={MapPin}
 * />
 * ```
 */
export function EquipmentTimeline({
  items,
  emptyMessage,
  emptyIcon,
  isLoading = false,
  skeletonCount = 3,
}: EquipmentTimelineProps) {
  // 로딩 상태
  if (isLoading) {
    return <TimelineSkeleton count={skeletonCount} />;
  }

  // 빈 상태
  if (items.length === 0) {
    return <TimelineEmpty message={emptyMessage} icon={emptyIcon} />;
  }

  // 타임라인 렌더링
  return (
    <div className="relative">
      {/* 타임라인 세로선 */}
      <div className={cn(TIMELINE_TOKENS.line.container, TIMELINE_TOKENS.line.color)} />

      {/* 타임라인 아이템 */}
      <div className={TIMELINE_TOKENS.spacing.itemGap}>
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.id} className="relative flex gap-4">
              {/* 타임라인 노드 */}
              <div className="relative flex-shrink-0">
                <div className={getTimelineNodeClasses(item.iconBg)}>
                  <Icon className={TIMELINE_TOKENS.node.icon} />
                </div>
                {item.isLatest && (
                  <div className={TIMELINE_TOKENS.latestBadge.container}>
                    <Badge className={TIMELINE_TOKENS.latestBadge.classes}>최신</Badge>
                  </div>
                )}
              </div>

              {/* 콘텐츠 영역 */}
              <div className="flex-1 pt-2">{item.content}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
