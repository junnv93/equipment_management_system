/**
 * Motion System (애니메이션 유틸리티)
 *
 * Semantic tokens를 Tailwind/CSS로 변환하는 헬퍼 함수들
 */

import type React from 'react';

import { MOTION_PRIMITIVES } from './primitives';
import { MOTION_TOKENS } from './semantic';
import type { MotionSpeed } from './semantic';

/**
 * Easing → Tailwind named class 매핑
 *
 * tailwind.config.js의 transitionTimingFunction 확장에 등록된 named utility를 참조.
 * arbitrary value 문법 대신 named class (ease-standard)를 생성하여
 * Tailwind v4 content detection ambiguity 경고를 원천 차단.
 *
 * SSOT 체인: primitives.ts (raw값) → globals.css (CSS 변수) → tailwind.config.js (named utility) ← 이 매핑 → getTransitionClasses()
 *
 * 키: MOTION_PRIMITIVES.easing의 raw cubic-bezier 값
 * 값: tailwind.config.js에 등록된 Tailwind easing class명
 */
export const EASING_CLASSES: Record<string, string> = {
  [MOTION_PRIMITIVES.easing.standard]: 'ease-standard',
  [MOTION_PRIMITIVES.easing.accelerate]: 'ease-accelerate',
  [MOTION_PRIMITIVES.easing.decelerate]: 'ease-decelerate',
  [MOTION_PRIMITIVES.easing.spring]: 'ease-spring',
  [MOTION_PRIMITIVES.easing.sharp]: 'ease-sharp',
  [MOTION_PRIMITIVES.easing.springPop]: 'ease-spring-pop',
  [MOTION_PRIMITIVES.easing.springSmooth]: 'ease-spring-smooth',
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
 * → 'motion-safe:transition-[background-color,transform] motion-safe:duration-200 motion-safe:ease-standard motion-reduce:transition-none'
 */
export function getTransitionClasses(
  speed: MotionSpeed = 'fast',
  properties: string[] = ['background-color', 'transform', 'opacity', 'box-shadow']
): string {
  const motion = MOTION_TOKENS.transition[speed];
  const easingClass = EASING_CLASSES[motion.easing];
  if (!easingClass) {
    throw new Error(
      `Unmapped easing: "${motion.easing}". Register it in EASING_CLASSES and tailwind.config.js transitionTimingFunction.`
    );
  }

  return [
    `motion-safe:transition-[${properties.join(',')}]`,
    `motion-safe:duration-${motion.duration}`,
    `motion-safe:${easingClass}`,
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

export function getStaggerFadeInStyle(
  index: number,
  type: keyof typeof MOTION_TOKENS.stagger = 'list'
): React.CSSProperties {
  return { animationDelay: getStaggerDelay(index, type) };
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
  /** width, margin-left (사이드바 collapse 애니메이션) */
  fastWidthMargin: getTransitionClasses('fast', ['width', 'margin-left']),
  /** grid-template-rows (확장/축소 패널) */
  fastGridRows: getTransitionClasses('fast', ['grid-template-rows']),

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

  // ── Emphasized (500ms, decelerate) ────────────
  /** opacity */
  emphasizedOpacity: getTransitionClasses('emphasized', ['opacity']),
  /** transform */
  emphasizedTransform: getTransitionClasses('emphasized', ['transform']),
  /** transform, opacity */
  emphasizedTransformOpacity: getTransitionClasses('emphasized', ['transform', 'opacity']),
  /** background-color, transform, opacity, box-shadow (기본 4속성) */
  emphasizedAll: getTransitionClasses('emphasized', [
    'background-color',
    'transform',
    'opacity',
    'box-shadow',
  ]),
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

  /** 스태거 fade-in 아이템 (globals.css --animate-stagger-fade-in SSOT 노출)
   * motion-reduce:opacity-100 — prefers-reduced-motion 환경에서 opacity-0 시작으로 사라지는 버그 방어 */
  staggerFadeInItem:
    'motion-safe:animate-stagger-fade-in motion-safe:opacity-0 motion-reduce:opacity-100',

  // ── PR-15: 신규 애니메이션 프리셋 ─────────────────────────────────────────

  /** fade-in + translateY(8px→0) 등장 (globals.css --animate-fade-in-up SSOT) */
  fadeInUp: 'motion-safe:animate-fade-in-up motion-reduce:animate-none',

  /** 부드러운 pulse (2s ease-in-out, opacity 1→0.7, 로딩/대기 인디케이터) */
  pulseSoft: 'motion-safe:animate-pulse-soft motion-reduce:animate-none',

  /** 강한 pulse (1s linear, critical 상태 강조) */
  pulseHard: 'motion-safe:animate-pulse-hard motion-reduce:animate-none',

  /**
   * lift — 카드/버튼 hover 시 살짝 뜨는 효과
   * transition-all 금지 원칙에 따라 TRANSITION_PRESETS.fastShadowTransform 사용
   */
  lift: `hover:-translate-y-0.5 hover:shadow-md ${TRANSITION_PRESETS.fastShadowTransform}`,

  /** Radix UI accordion 펼침 (globals.css --animate-accordion-down SSOT) */
  accordionDown: 'motion-safe:animate-accordion-down motion-reduce:animate-none',

  /** 완료 micro-celebration — scale(1→1.08→1) 0.4s 1회 */
  confettiMicro: 'motion-safe:animate-confetti-micro motion-reduce:animate-none',
} as const;

// ============================================================================
// Reduced Motion Guard (prefers-reduced-motion 안전 래퍼)
// ============================================================================

/**
 * REDUCED_MOTION — prefers-reduced-motion 안전 래퍼
 *
 * motion-reduce:animate-none 짝을 자동 추가.
 * 이미 motion-reduce:animate-none이 포함된 클래스에는 중복 추가되지 않음.
 *
 * @example
 * REDUCED_MOTION.safe(ANIMATION_PRESETS.pulseHard)
 * // → 'motion-safe:animate-pulse-hard motion-reduce:animate-none'
 */
export const REDUCED_MOTION = {
  safe: (animClass: string): string => {
    if (animClass.includes('motion-reduce:animate-none')) return animClass;
    return `${animClass} motion-reduce:animate-none`;
  },
} as const;

// ============================================================================
// Stagger Item Utility (inline style 기반 딜레이)
// ============================================================================

/**
 * staggerItem — 리스트/그리드 아이템 순차 등장 딜레이 (60ms 간격)
 *
 * MOTION_TOKENS.stagger.comfortable(60ms) SSOT와 동일.
 * ANIMATION_PRESETS.staggerFadeInItem 클래스와 함께 사용.
 *
 * @example
 * <div
 *   className={ANIMATION_PRESETS.staggerFadeInItem}
 *   style={staggerItem(index)}
 * >
 */
export function staggerItem(index: number): React.CSSProperties {
  return { animationDelay: `${index * 60}ms` };
}

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
