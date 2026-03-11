'use client';

import { Badge } from '@/components/ui/badge';
import { Share2, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('equipment.sharedBadge');

  if (!sharedSource) return null;

  const config = {
    safety_lab: {
      label: t('safetyLab'),
      className: 'bg-brand-info/10 text-brand-info',
      icon: Building2,
    },
    external: {
      label: t('external'),
      className: 'bg-brand-purple/10 text-brand-purple',
      icon: Share2,
    },
  };

  const sourceConfig = config[sharedSource as keyof typeof config] || {
    label: t('default'),
    className: 'bg-brand-neutral/10 text-brand-neutral',
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
