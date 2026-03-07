/**
 * Motion System (애니메이션 유틸리티)
 *
 * Semantic tokens를 Tailwind/CSS로 변환하는 헬퍼 함수들
 */

import { MOTION_TOKENS } from './semantic';
import type { MotionSpeed } from './semantic';

/**
 * Transition 클래스 생성
 *
 * @param speed - 속도 레벨
 * @param properties - 애니메이션할 CSS 속성들
 * @returns Tailwind 클래스 문자열
 *
 * @example
 * getTransitionClasses('fast', ['background-color', 'transform'])
 * → 'motion-safe:transition-[background-color,transform] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(...)] motion-reduce:transition-none'
 */
export function getTransitionClasses(
  speed: MotionSpeed = 'fast',
  properties: string[] = ['background-color', 'transform', 'opacity', 'box-shadow']
): string {
  const motion = MOTION_TOKENS.transition[speed];

  // prefers-reduced-motion 지원
  return [
    `motion-safe:transition-[${properties.join(',')}]`,
    `motion-safe:duration-${motion.duration}`,
    `motion-safe:ease-[${motion.easing}]`,
    'motion-reduce:transition-none',
  ].join(' ');
}

/**
 * Stagger 애니메이션 delay 계산
 *
 * @param index - 아이템 인덱스
 * @param type - stagger 타입
 * @returns CSS animation-delay 값
 *
 * @example
 * style={{ animationDelay: getStaggerDelay(2, 'list') }}
 * → '80ms'
 */
export function getStaggerDelay(
  index: number,
  type: keyof typeof MOTION_TOKENS.stagger = 'list'
): string {
  const delay = MOTION_TOKENS.stagger[type];
  return `${index * delay}ms`;
}

/**
 * Keyframe 애니메이션 클래스
 *
 * 자주 사용하는 애니메이션 패턴
 */
export const ANIMATION_PRESETS = {
  /** 페이드 인 */
  fadeIn: 'motion-safe:animate-in motion-safe:fade-in',

  /** 페이드 아웃 */
  fadeOut: 'motion-safe:animate-out motion-safe:fade-out',

  /** 슬라이드 업 */
  slideUp: 'motion-safe:animate-in motion-safe:slide-in-from-bottom-4',

  /** 슬라이드 다운 */
  slideDown: 'motion-safe:animate-in motion-safe:slide-in-from-top-4',

  /**
   * 슬라이드 업 + 페이드 인 복합 (SSOT)
   *
   * 탭 콘텐츠 전환, 타임라인 아이템 입장 등 방향성 있는 등장에 사용.
   * 단일 animate-in 선언으로 fade + slide를 동시 적용.
   * duration은 사용처에서 `motion-safe:duration-*`으로 별도 지정.
   *
   * @example
   * className={cn(ANIMATION_PRESETS.slideUpFade, 'motion-safe:duration-200')}
   */
  slideUpFade: 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3',

  /** 스케일 업 (팝) */
  scaleUp: 'motion-safe:animate-in motion-safe:zoom-in-95',

  /** 펄스 (주목) */
  pulse: 'motion-safe:animate-pulse',

  /** 스핀 (로딩) */
  spin: 'motion-safe:animate-spin',
} as const;

/**
 * Duration 유틸리티
 *
 * inline style용 duration 값
 */
export function getAnimationDuration(speed: MotionSpeed = 'fast'): string {
  return `${MOTION_TOKENS.transition[speed].duration}ms`;
}

/**
 * Easing 유틸리티
 *
 * inline style용 easing 값
 */
export function getAnimationEasing(speed: MotionSpeed = 'fast'): string {
  return MOTION_TOKENS.transition[speed].easing;
}
