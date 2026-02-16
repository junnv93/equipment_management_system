'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TeamMemberAvatarsProps {
  teamId: string;
  memberCount: number;
  maxDisplay?: number;
  members?: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
  }>;
  className?: string;
}

/**
 * 팀원 아바타 그리드 컴포넌트
 *
 * 접근성 요구사항:
 * - 각 아바타에 aria-label="팀원명" 제공
 * - "+N명 더보기" 버튼: aria-label="나머지 N명 보기"
 * - role="group" aria-label="팀원 목록"
 *
 * 디자인 요구사항:
 * - 최대 5명 표시, 초과 시 "+N" 뱃지
 * - 아바타 hover 시 tooltip 표시
 */
export function TeamMemberAvatars({
  teamId,
  memberCount,
  maxDisplay = 5,
  members = [],
  className,
}: TeamMemberAvatarsProps) {
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);

  // 멤버 데이터가 없는 경우 플레이스홀더 생성
  const displayMembers =
    members.length > 0
      ? members.slice(0, maxDisplay)
      : Array.from({ length: Math.min(memberCount, maxDisplay) }, (_, i) => ({
          id: `placeholder-${teamId}-${i}`,
          name: `팀원 ${i + 1}`,
          avatarUrl: undefined,
        }));

  const remainingCount = memberCount - maxDisplay;

  return (
    <TooltipProvider delayDuration={200}>
      <div role="group" aria-label="팀원 목록" className={cn('flex items-center', className)}>
        {/* 아바타 목록 */}
        <div className="flex -space-x-2">
          {displayMembers.map((member, index) => (
            <Tooltip key={member.id}>
              <TooltipTrigger asChild>
                <div
                  data-testid="member-avatar"
                  aria-label={member.name}
                  className={cn(
                    'relative h-8 w-8 rounded-full border-2 border-background',
                    'bg-muted flex items-center justify-center',
                    'transition-transform duration-200',
                    hoveredMember === member.id && 'z-10 scale-110'
                  )}
                  style={{
                    zIndex: displayMembers.length - index,
                  }}
                  onMouseEnter={() => setHoveredMember(member.id)}
                  onMouseLeave={() => setHoveredMember(null)}
                >
                  {member.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {member.name}
              </TooltipContent>
            </Tooltip>
          ))}

          {/* +N 더보기 버튼 */}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  data-testid="more-members-button"
                  aria-label={`나머지 ${remainingCount}명 보기`}
                  className={cn(
                    'relative h-8 w-8 rounded-full border-2 border-background',
                    'bg-primary/10 flex items-center justify-center',
                    'text-xs font-medium text-primary',
                    'hover:bg-primary/20 transition-colors duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                  )}
                  style={{ zIndex: 0 }}
                >
                  +{remainingCount}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                나머지 {remainingCount}명 보기
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* 총 인원 텍스트 (스크린 리더용) */}
        <span className="sr-only">총 {memberCount}명의 팀원</span>
      </div>
    </TooltipProvider>
  );
}
