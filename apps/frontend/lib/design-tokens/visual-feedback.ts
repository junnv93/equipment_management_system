/**
 * Visual Feedback System - Design Token v3
 *
 * SSOT: 긴급도 기반 시각적 피드백 아키텍처
 *
 * Architecture:
 * - Urgency Level: 비즈니스 로직 계층 (info/warning/critical/emergency)
 * - Feedback Mode: 시각적 표현 계층 (static/subtle/attention/urgent)
 * - Animation Strategy: 접근성 고려 (motion-safe, prefers-reduced-motion)
 *
 * Design Philosophy:
 * - "긴급함"은 사용자 피로도를 유발 → 신중하게 사용
 * - Pulse는 emergency만 → 남용 금지
 * - Ring/Scale은 attention부터 → 계층적 강조
 * - 모든 animation은 motion-safe 조건부 적용
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions
 */

import { APPROVAL_KPI } from '@equipment-management/shared-constants';
import { ANIMATION_PRESETS, TRANSITION_PRESETS } from './motion';

/**
 * Urgency Level (비즈니스 로직 계층)
 *
 * 시스템 상태의 긴급도를 표현하는 추상화
 */
export type UrgencyLevel = 'info' | 'warning' | 'critical' | 'emergency';

/**
 * Feedback Mode (시각적 표현 계층)
 *
 * 각 Urgency Level이 UI로 어떻게 표현될지 정의
 */
export type FeedbackMode = 'static' | 'subtle' | 'attention' | 'urgent';

/**
 * Urgency → Feedback 매핑 전략
 *
 * 비즈니스 긴급도를 시각적 강도로 변환
 */
export const URGENCY_FEEDBACK_MAP: Record<UrgencyLevel, FeedbackMode> = {
  info: 'static', // 정보성 → 기본 스타일
  warning: 'subtle', // 주의 → 미묘한 강조 (scale)
  critical: 'attention', // 위험 → 명확한 강조 (scale + ring)
  emergency: 'urgent', // 긴급 → 최대 강조 (scale + ring + pulse)
};

/**
 * Visual Feedback Tokens
 *
 * 각 Feedback Mode의 구체적인 시각적 표현
 *
 * 원칙:
 * - static: 변화 없음 (기본 상태)
 * - subtle: scale만 (부드러운 강조)
 * - attention: scale + ring (명확한 강조)
 * - urgent: scale + ring + pulse (최대 강조, 신중하게 사용)
 */
export const VISUAL_FEEDBACK_TOKENS = {
  /** 기본 (변화 없음) */
  static: {
    scale: 'scale-100',
    ring: '',
    animation: '',
    bgOpacity: '',
  },

  /** 미묘한 강조 (scale만) */
  subtle: {
    scale: 'scale-105',
    ring: '',
    animation: '',
    bgOpacity: '',
  },

  /** 명확한 강조 (scale + ring) */
  attention: {
    scale: 'scale-105',
    ring: 'ring-1 ring-destructive/30 ring-offset-1',
    animation: '',
    bgOpacity: '',
  },

  /** 최대 강조 (scale + ring + pulse) - 신중하게 사용 */
  urgent: {
    scale: 'scale-110',
    ring: 'ring-2 ring-destructive/50 ring-offset-2',
    animation: ANIMATION_PRESETS.pulse, // motion-safe 조건부 적용
    bgOpacity: '',
  },
} as const;

/**
 * Urgency Level에 대한 시각적 피드백 클래스 조합
 *
 * @param urgency - 비즈니스 긴급도 레벨
 * @param includeAnimation - 애니메이션 포함 여부 (기본: true)
 * @returns Tailwind 클래스 문자열
 *
 * @example
 * ```tsx
 * // 긴급한 알림 (pulse 애니메이션 포함)
 * <Badge className={getUrgencyFeedbackClasses('emergency')}>
 *   10건 대기
 * </Badge>
 *
 * // 중요한 알림 (애니메이션 없이 ring만)
 * <Badge className={getUrgencyFeedbackClasses('critical', false)}>
 *   5건 대기
 * </Badge>
 * ```
 */
export function getUrgencyFeedbackClasses(urgency: UrgencyLevel, includeAnimation = true): string {
  const mode = URGENCY_FEEDBACK_MAP[urgency];
  const feedback = VISUAL_FEEDBACK_TOKENS[mode];

  return [
    feedback.scale,
    feedback.ring,
    includeAnimation ? feedback.animation : '',
    feedback.bgOpacity,
    TRANSITION_PRESETS.fastTransform, // 부드러운 scale 전환
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Count-based Urgency 계산 (레거시 호환)
 *
 * 알림/승인 개수 → Urgency Level 매핑
 * 기존 count 기반 로직을 Urgency Level로 추상화
 *
 * @param count - 알림/승인 개수
 * @returns Urgency Level
 */
export function getCountBasedUrgency(count: number): UrgencyLevel {
  if (count >= 20) return 'emergency'; // 20+ → 긴급 (pulse)
  if (count >= 10) return 'critical'; // 10-19 → 위험 (ring)
  if (count >= 5) return 'warning'; // 5-9 → 주의 (scale)
  return 'info'; // 1-4 → 정보 (기본)
}

/**
 * Time-based Urgency 계산
 *
 * 시간 압박 → Urgency Level 매핑
 * 교정 기한, 반출 기한 등에 사용
 *
 * @param daysUntilDue - 기한까지 남은 일수 (음수 = 지연)
 * @returns Urgency Level
 */
export function getTimeBasedUrgency(daysUntilDue: number): UrgencyLevel {
  if (daysUntilDue < 0) return 'emergency'; // 지연 → 긴급
  if (daysUntilDue <= 3) return 'critical'; // D-3 이내 → 위험
  if (daysUntilDue <= 7) return 'warning'; // D-7 이내 → 주의
  return 'info'; // 여유 있음 → 정보
}

/**
 * Elapsed Days-based Urgency 계산
 *
 * 경과 일수 → Urgency Level 매핑
 * 승인 대기 항목의 "오래된 건일수록 눈에 띈다" 시각화에 사용
 *
 * SSOT: 임계값은 @equipment-management/shared-constants의 APPROVAL_KPI에서 참조
 *
 * @param elapsedDays - 요청일로부터 경과한 일수
 * @returns Urgency Level
 */
export function getElapsedDaysUrgency(elapsedDays: number): UrgencyLevel {
  if (elapsedDays >= APPROVAL_KPI.URGENT_THRESHOLD_DAYS) return 'critical';
  if (elapsedDays >= APPROVAL_KPI.WARNING_THRESHOLD_DAYS) return 'warning';
  return 'info';
}

/**
 * Status-based Urgency 계산
 *
 * 시스템 상태 → Urgency Level 매핑
 * 장비 상태, 승인 상태 등에 사용
 *
 * @param status - 시스템 상태 코드
 * @returns Urgency Level
 */
export function getStatusBasedUrgency(
  status: 'normal' | 'warning' | 'error' | 'critical'
): UrgencyLevel {
  const map: Record<typeof status, UrgencyLevel> = {
    normal: 'info',
    warning: 'warning',
    error: 'critical',
    critical: 'emergency',
  };
  return map[status];
}
