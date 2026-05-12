/**
 * StatusBadge — 장비 상태 시각 표시 (qr-visual-redesign TASK 2 / 2026-05-11).
 *
 * `<Badge variant="outline">{status}</Badge>` 직접 사용 금지. 본 컴포넌트가 SSOT —
 * EQUIPMENT_STATUS_TONE (shared-constants) + BRAND_CLASS_MATRIX (design-tokens) 매트릭스
 * 단일 wire 로 4-tier 색을 자동 부여한다.
 *
 * 1초 인지 원칙: 색 + dot + 라벨 3 단서로 "지금 이 장비를 써도 되는가" 즉답.
 * 1차 텍스트 ≥16px (text-sm 14→16px override) — 현장 a11y 기준.
 *
 * @see packages/shared-constants/src/equipment-status-tone.ts (EQUIPMENT_STATUS_TONE SSOT)
 * @see apps/frontend/lib/design-tokens/brand.ts (BRAND_CLASS_MATRIX badge variants)
 */
import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  EQUIPMENT_STATUS_TONE,
  EQUIPMENT_STATUS_I18N_KEYS,
  type EquipmentStatusTone,
} from '@equipment-management/shared-constants';
import type { EquipmentStatus } from '@equipment-management/schemas';
import { cn } from '@/lib/utils';
import {
  getSemanticBadgeClasses,
  getSemanticDotClasses,
  type SemanticColorKey,
} from '@/lib/design-tokens/brand';

/**
 * EquipmentStatusTone → SemanticColorKey 매핑.
 * `warn` 약식 → `warning` 정식 (BRAND_CLASS_MATRIX 키).
 */
const TONE_TO_SEMANTIC: Record<EquipmentStatusTone, SemanticColorKey> = {
  ok: 'ok',
  warn: 'warning',
  urgent: 'urgent',
  mute: 'mute',
};

export interface StatusBadgeProps {
  status: EquipmentStatus;
  /** label 텍스트 override — 미지정 시 i18n `qr.statusBadge.status.{key}` 사용 */
  label?: string;
  /** Tailwind 추가 클래스 */
  className?: string;
  /** 1초 인지용 dot 노출 (기본 true) — `false` 시 라벨만 */
  showDot?: boolean;
  /**
   * Inline 표시용 size — `'sm'` (xs, mobile-second-tier) / `'base'` (mobile-first-tier ≥16px).
   * 1차 정보 (장비 카드 헤더 등) 는 `'base'`, KV/메타 라인은 `'sm'`.
   */
  size?: 'sm' | 'base';
}

function StatusBadgeImpl({
  status,
  label,
  className,
  showDot = true,
  size = 'sm',
}: StatusBadgeProps) {
  const t = useTranslations('qr.statusBadge');
  const tone = EQUIPMENT_STATUS_TONE[status];
  const semanticTone = TONE_TO_SEMANTIC[tone];
  const i18nKey = EQUIPMENT_STATUS_I18N_KEYS[status];
  const displayLabel = label ?? t(`status.${i18nKey}`);
  // aria-label 에 tone 의미 결합 — 스크린리더가 "정상" / "긴급" 등을 함께 announce.
  // displayLabel 이 이미 tone 의미와 동의어인 경우(예: '비활성' status·'비활성' mute)도 중복 없이 자연.
  const toneLabel = t(`tone.${tone}`);
  const ariaLabel = `${displayLabel} · ${toneLabel}`;

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5',
        getSemanticBadgeClasses(semanticTone),
        size === 'base' ? 'text-sm md:text-base' : 'text-xs',
        className
      )}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cn(getSemanticDotClasses(semanticTone), 'h-1.5 w-1.5 shrink-0')}
        />
      )}
      <span className="font-medium label-ko">{displayLabel}</span>
    </span>
  );
}

/**
 * StatusBadge — React.memo 적용 (G-9). props shallow equality 충분 (i18n lookup 내부).
 */
export const StatusBadge = React.memo(StatusBadgeImpl);
StatusBadge.displayName = 'StatusBadge';
