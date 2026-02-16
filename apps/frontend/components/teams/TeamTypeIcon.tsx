'use client';

import { Radio, Zap, Smartphone, Car, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Classification } from '@/lib/api/teams-api';
import { CLASSIFICATION_CONFIG } from '@/lib/api/teams-api';

interface TeamTypeIconProps {
  classification?: string; // ✅ type → classification
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * 팀 분류별 아이콘 컴포넌트
 *
 * UL 색상 팔레트 기반 (팀-분류코드 매핑):
 * - fcc_emc_rf: UL Midnight Blue (#122C49) + Radio 아이콘 → E (FCC EMC/RF)
 * - general_emc: UL Fog (#577E9E) + Zap 아이콘 → R (General EMC)
 * - general_rf: UL Blue (#4A90D9) + Radio 아이콘 → W (General RF)
 * - sar: UL Warning (#FF9D55) + Smartphone 아이콘 → S (SAR)
 * - automotive_emc: UL Green (#00A451) + Car 아이콘 → A (Automotive EMC)
 * - software: Purple (#8B5CF6) + Code 아이콘 → P (Software Program)
 *
 * 접근성: 색상뿐 아니라 아이콘으로도 구분 (WCAG 1.4.1)
 */
export function TeamTypeIcon({
  classification,
  size = 'md',
  showLabel = false,
  className,
}: TeamTypeIconProps) {
  const normalizedClassification = (classification?.toLowerCase() ||
    'fcc_emc_rf') as Classification;
  const config =
    CLASSIFICATION_CONFIG[normalizedClassification] || CLASSIFICATION_CONFIG.fcc_emc_rf;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const containerSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const IconComponent =
    {
      Radio,
      Zap,
      Smartphone,
      Car,
      Code,
    }[config.icon] || Radio;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full',
          config.bgColor,
          containerSizeClasses[size]
        )}
        style={{ borderColor: config.color }}
        data-testid="team-type-icon"
        aria-label={`${config.label} 팀 유형`}
      >
        <IconComponent
          className={cn(sizeClasses[size])}
          style={{ color: config.color }}
          aria-hidden="true"
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium" style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * 팀 분류 배지 컴포넌트
 */
export function TeamTypeBadge({
  classification,
  className,
}: {
  classification?: string; // ✅ type → classification
  className?: string;
}) {
  const normalizedClassification = (classification?.toLowerCase() ||
    'fcc_emc_rf') as Classification;
  const config =
    CLASSIFICATION_CONFIG[normalizedClassification] || CLASSIFICATION_CONFIG.fcc_emc_rf;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bgColor,
        className
      )}
      style={{ color: config.color }}
    >
      <TeamTypeIcon classification={classification} size="sm" />
      {config.label}
    </span>
  );
}
