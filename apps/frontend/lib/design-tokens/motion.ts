/**
 * Motion System (애니메이션 유틸리티)
 *
 * Semantic tokens를 Tailwind/CSS로 변환하는 헬퍼 함수들
 */

import { MOTION_PRIMITIVES } from './primitives';
import { MOTION_TOKENS } from './semantic';
import type { MotionSpeed } from './semantic';

/**
 * Easing CSS Custom Property 참조 (Tailwind arbitrary value용)
 *
 * getTransitionClasses()에서 ease-[cubic-bezier(...)] 대신
 * ease-[var(--ease-*)]를 생성하여 Tailwind ambiguity 경고를 방지.
 *
 * SSOT 체인: globals.css (:root --ease-*) ← 이 매핑 → getTransitionClasses()
 * 키: MOTION_PRIMITIVES.easing의 raw cubic-bezier 값 (computed property)
 * 값: 대응하는 CSS Custom Property var() 참조
 */
export const EASING_CSS_VARS: Record<string, string> = {
  [MOTION_PRIMITIVES.easing.standard]: 'var(--ease-standard)',
  [MOTION_PRIMITIVES.easing.accelerate]: 'var(--ease-accelerate)',
  [MOTION_PRIMITIVES.easing.decelerate]: 'var(--ease-decelerate)',
  [MOTION_PRIMITIVES.easing.spring]: 'var(--ease-spring)',
  [MOTION_PRIMITIVES.easing.sharp]: 'var(--ease-sharp)',
  [MOTION_PRIMITIVES.easing.springPop]: 'var(--ease-spring-pop)',
  [MOTION_PRIMITIVES.easing.springSmooth]: 'var(--ease-spring-smooth)',
};

/**
 * Transition 클래스 생성
 *
 * @param speed - 속도 레벨
 * @param properties - 애니메이션할 CSS 속성들
 * @returns Tailwind 클래스 문자열
 *
 * @example
 * getTransitionClasses('fast', ['background-color', 'transform'])
 * → 'motion-safe:transition-[background-color,transform] motion-safe:duration-200 motion-safe:ease-[var(--ease-standard)] motion-reduce:transition-none'
 */
export function getTransitionClasses(
  speed: MotionSpeed = 'fast',
  properties: string[] = ['background-color', 'transform', 'opacity', 'box-shadow']
): string {
  const motion = MOTION_TOKENS.transition[speed];
  const easingRef = EASING_CSS_VARS[motion.easing] ?? motion.easing;

  return [
    `motion-safe:transition-[${properties.join(',')}]`,
    `motion-safe:duration-${motion.duration}`,
    `motion-safe:ease-[${easingRef}]`,
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

// ============================================================================
// Pre-computed Transition Presets (Performance Optimization)
// ============================================================================

/**
 * TRANSITION_PRESETS — 사전 계산된 트랜지션 클래스
 *
 * 129개 getTransitionClasses() 런타임 호출 → 모듈 초기화 시 1회 계산.
 * Layer 3 파일에서 getTransitionClasses('fast', [...]) 대신 이 상수를 참조하세요.
 *
 * 네이밍 규칙: {speed}{Properties}
 * - speed: fast / instant / moderate
 * - Properties: Bg, Color, Shadow, Transform, Opacity, Border 조합
 */
export const TRANSITION_PRESETS = {
  // ── Fast (200ms) ──────────────────────────────
  /** background-color */
  fastBg: getTransitionClasses('fast', ['background-color']),
  /** color */
  fastColor: getTransitionClasses('fast', ['color']),
  /** opacity */
  fastOpacity: getTransitionClasses('fast', ['opacity']),
  /** transform */
  fastTransform: getTransitionClasses('fast', ['transform']),
  /** background-color, color */
  fastBgColor: getTransitionClasses('fast', ['background-color', 'color']),
  /** background-color, transform */
  fastBgTransform: getTransitionClasses('fast', ['background-color', 'transform']),
  /** background-color, border-color */
  fastBgBorder: getTransitionClasses('fast', ['background-color', 'border-color']),
  /** background-color, box-shadow */
  fastBgShadow: getTransitionClasses('fast', ['background-color', 'box-shadow']),
  /** background-color, color, border-color */
  fastBgColorBorder: getTransitionClasses('fast', ['background-color', 'color', 'border-color']),
  /** background-color, color, transform */
  fastBgColorTransform: getTransitionClasses('fast', ['background-color', 'color', 'transform']),
  /** background-color, transform, box-shadow */
  fastBgTransformShadow: getTransitionClasses('fast', [
    'background-color',
    'transform',
    'box-shadow',
  ]),
  /** background-color, opacity, border-color */
  fastBgOpacityBorder: getTransitionClasses('fast', [
    'background-color',
    'opacity',
    'border-color',
  ]),
  /** box-shadow */
  fastShadow: getTransitionClasses('fast', ['box-shadow']),
  /** box-shadow, transform */
  fastShadowTransform: getTransitionClasses('fast', ['box-shadow', 'transform']),
  /** box-shadow, border-color */
  fastShadowBorder: getTransitionClasses('fast', ['box-shadow', 'border-color']),
  /** box-shadow, transform, border-color */
  fastShadowTransformBorder: getTransitionClasses('fast', [
    'box-shadow',
    'transform',
    'border-color',
  ]),
  /** border-color, background-color (= fastBgBorder, alias for readability) */
  fastBorderBg: getTransitionClasses('fast', ['border-color', 'background-color']),
  /** border-color, box-shadow */
  fastBorderShadow: getTransitionClasses('fast', ['border-color', 'box-shadow']),
  /** color, border-color */
  fastColorBorder: getTransitionClasses('fast', ['color', 'border-color']),
  /** transform, opacity */
  fastTransformOpacity: getTransitionClasses('fast', ['transform', 'opacity']),
  /** transform, background-color, opacity */
  fastTransformBgOpacity: getTransitionClasses('fast', [
    'transform',
    'background-color',
    'opacity',
  ]),
  /** background-color, transform, opacity, box-shadow (기본 4속성) */
  fastAll: getTransitionClasses('fast', ['background-color', 'transform', 'opacity', 'box-shadow']),

  // ── Fast (200ms) — 추가 조합 ─────────────────
  /** background-color, color, box-shadow */
  fastBgColorShadow: getTransitionClasses('fast', ['background-color', 'color', 'box-shadow']),
  /** background-color, color, box-shadow, transform */
  fastBgColorShadowTransform: getTransitionClasses('fast', [
    'background-color',
    'color',
    'box-shadow',
    'transform',
  ]),
  /** border-color, background-color, transform */
  fastBorderBgTransform: getTransitionClasses('fast', [
    'border-color',
    'background-color',
    'transform',
  ]),

  // ── Instant (100ms) ───────────────────────────
  /** background-color */
  instantBg: getTransitionClasses('instant', ['background-color']),
  /** color */
  instantColor: getTransitionClasses('instant', ['color']),
  /** opacity */
  instantOpacity: getTransitionClasses('instant', ['opacity']),
  /** transform */
  instantTransform: getTransitionClasses('instant', ['transform']),
  /** background-color, border-color */
  instantBgBorder: getTransitionClasses('instant', ['background-color', 'border-color']),
  /** background-color, color */
  instantBgColor: getTransitionClasses('instant', ['background-color', 'color']),
  /** background-color, border-color, color */
  instantBgBorderColor: getTransitionClasses('instant', [
    'background-color',
    'border-color',
    'color',
  ]),
  /** border-color, box-shadow */
  instantBorderShadow: getTransitionClasses('instant', ['border-color', 'box-shadow']),
  /** background-color, box-shadow, transform */
  instantBgShadowTransform: getTransitionClasses('instant', [
    'background-color',
    'box-shadow',
    'transform',
  ]),

  // ── Moderate (300ms) ──────────────────────────
  /** opacity */
  moderateOpacity: getTransitionClasses('moderate', ['opacity']),
  /** transform */
  moderateTransform: getTransitionClasses('moderate', ['transform']),
  /** box-shadow */
  moderateShadow: getTransitionClasses('moderate', ['box-shadow']),
  /** box-shadow, transform */
  moderateShadowTransform: getTransitionClasses('moderate', ['box-shadow', 'transform']),
} as const;

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

  /** 다이얼로그 진입 (zoom + fade) */
  dialogEnter:
    'motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in motion-safe:duration-200',
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
