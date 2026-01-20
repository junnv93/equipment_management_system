'use client';

import { Badge } from '@/components/ui/badge';
import { Share2, Building2 } from 'lucide-react';

interface SharedEquipmentBadgeProps {
  sharedSource?: 'safety_lab' | 'external' | string | null;
  size?: 'default' | 'sm';
  showIcon?: boolean;
}

/**
 * 공용장비 배지 컴포넌트
 *
 * 공용장비 출처에 따라 다른 스타일의 배지를 표시합니다.
 * - safety_lab: Safety Lab 등 사내 공용장비 (파란색)
 * - external: 외부 기관 보유 장비 (보라색)
 */
export function SharedEquipmentBadge({
  sharedSource,
  size = 'default',
  showIcon = true,
}: SharedEquipmentBadgeProps) {
  if (!sharedSource) return null;

  const config = {
    safety_lab: {
      label: '공용장비',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      icon: Building2,
    },
    external: {
      label: '외부장비',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      icon: Share2,
    },
  };

  const sourceConfig = config[sharedSource as keyof typeof config] || {
    label: '공용',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    icon: Share2,
  };

  const Icon = sourceConfig.icon;
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <Badge variant="outline" className={`${sourceConfig.className} ${sizeClass} font-medium`}>
      {showIcon && <Icon className={`${iconSize} mr-1`} />}
      {sourceConfig.label}
    </Badge>
  );
}

export default SharedEquipmentBadge;
