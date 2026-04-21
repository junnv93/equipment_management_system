/**
 * Design Token Primitives (Layer 1: Foundation)
 *
 * 디자인 시스템의 가장 낮은 레벨 - 절대값만 정의합니다.
 * 이 값들은 직접 사용하지 않고, semantic tokens에서 참조합니다.
 *
 * SSOT: 모든 크기, 색상, 간격의 원시값은 여기서만 정의
 * 변경 시: 전체 시스템이 자동으로 업데이트됨
 */

/**
 * Size Primitives (픽셀 기반)
 *
 * 반응형 전략:
 * - mobile: < 768px (Tailwind 'md' breakpoint)
 * - desktop: ≥ 768px
 */
export const SIZE_PRIMITIVES = {
  /** 터치 타겟 크기 (WCAG AAA: 최소 44x44px) */
  touch: {
    minimal: { mobile: 44, desktop: 40 }, // 최소 기준
    comfortable: { mobile: 48, desktop: 44 }, // 여유 있는
    generous: { mobile: 56, desktop: 48 }, // 넉넉한
  },

  /** 아이콘 크기 */
  icon: {
    xs: { mobile: 14, desktop: 12 },
    sm: { mobile: 16, desktop: 14 },
    md: { mobile: 20, desktop: 18 },
    lg: { mobile: 24, desktop: 20 },
    xl: { mobile: 28, desktop: 24 },
  },

  /** 아바타/프로필 이미지 */
  avatar: {
    xs: { mobile: 24, desktop: 20 },
    sm: { mobile: 32, desktop: 28 },
    md: { mobile: 40, desktop: 36 },
    lg: { mobile: 48, desktop: 44 },
    xl: { mobile: 64, desktop: 56 },
  },

  /** 배지/인디케이터 */
  badge: {
    sm: { mobile: 16, desktop: 14 },
    md: { mobile: 20, desktop: 18 },
    lg: { mobile: 24, desktop: 20 },
  },

  /** 페이지네이션 버튼 (정사각) */
  pagination: 30,
} as const;

/**
 * Width Primitives (고정 폭 특수 값)
 */
export const WIDTH_PRIMITIVES = {
  /** 접근성 안전 최소 강조 바 (3px — WCAG 권고 시각 구분선 최소값) */
  hairline: 3,
  /** 상태 흐름 도트 원 크기 (18px — CheckoutMiniProgress 스텝 원) */
  stepDot: 18,
} as const;

/**
 * Spacing Primitives (간격 체계)
 *
 * 8px 기반 스케일 (디자인 시스템 표준)
 */
export const SPACING_PRIMITIVES = {
  /** 요소 간 간격 */
  gap: {
    tight: { mobile: 8, desktop: 6 }, // 좁은
    comfortable: { mobile: 12, desktop: 8 }, // 편안한
    relaxed: { mobile: 16, desktop: 12 }, // 여유로운
    spacious: { mobile: 24, desktop: 16 }, // 넓은
  },

  /** 내부 여백 */
  padding: {
    compact: { mobile: 8, desktop: 6 },
    comfortable: { mobile: 12, desktop: 10 },
    relaxed: { mobile: 16, desktop: 14 },
  },
} as const;

/**
 * Motion Primitives (애니메이션 체계)
 *
 * Duration: Material Design 기반
 * Easing: 자연스러운 움직임 곡선
 */
export const MOTION_PRIMITIVES = {
  /** 지속 시간 (ms) */
  duration: {
    instant: 100, // 즉각적인 피드백
    fast: 200, // 빠른 전환
    moderate: 300, // 표준 전환
    slow: 500, // 강조된 전환
    deliberate: 700, // 의도적으로 느린
  },

  /** Easing 곡선 */
  easing: {
    /** 표준 전환 - 대부분의 애니메이션 */
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',

    /** 가속 - 요소가 화면 밖으로 나갈 때 */
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',

    /** 감속 - 요소가 화면 안으로 들어올 때 */
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',

    /** 스프링 - 주목을 끄는 애니메이션 */
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

    /** 샤프 - 빠르고 날카로운 전환 */
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',

    /** 스프링 팝 - 다이얼로그 진입, 성공 체크마크 등 오버슈트 */
    springPop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

    /** 스프링 부드러운 - 스태거 페이드, 서브틀 스케일 인 */
    springSmooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },

  /** Stagger delay (연속 애니메이션 간격) */
  stagger: {
    tight: 40, // 빠른 연속 (알림 목록)
    comfortable: 60, // 표준 연속 (카드 그리드)
    relaxed: 100, // 여유로운 연속 (섹션 등장)
  },
} as const;

/**
 * Elevation Primitives (Z-index & Shadow 체계)
 *
 * Z-index: 10 단위로 증가 (중간값 삽입 가능)
 * Shadow: 깊이 5단계
 */
export const ELEVATION_PRIMITIVES = {
  /** Z-index 레이어 */
  zIndex: {
    base: 0, // 기본 레이어
    raised: 10, // 약간 떠 있는 (카드)
    dropdown: 20, // 드롭다운 메뉴
    sticky: 30, // 고정 헤더/푸터
    overlay: 40, // 오버레이 배경
    modal: 50, // 모달 다이얼로그
    popover: 60, // 팝오버/툴팁
    toast: 70, // 토스트 알림
  },

  /** Shadow 깊이 */
  shadow: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
} as const;

/**
 * Border Radius Primitives
 *
 * 일관된 모서리 둥글기
 */
export const RADIUS_PRIMITIVES = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999, // 완전한 원형
} as const;

/**
 * Typography Primitives
 *
 * 폰트 크기 및 행간
 */
export const TYPOGRAPHY_PRIMITIVES = {
  fontSize: {
    '2xs': { mobile: 10, desktop: 10 }, // WCAG SC 1.4.4 권고 하한 — 배지/레이블 최소 크기
    xs: { mobile: 12, desktop: 11 },
    sm: { mobile: 14, desktop: 13 },
    base: { mobile: 16, desktop: 15 },
    lg: { mobile: 18, desktop: 17 },
    xl: { mobile: 20, desktop: 19 },
    '2xl': { mobile: 24, desktop: 22 },
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/**
 * Type Helpers - 타입 추론을 위한 유틸리티
 */
export type ResponsiveValue = { mobile: number; desktop: number };
export type PrimitiveKey<T> = keyof T;

/**
 * Utility: 반응형 값을 Tailwind 클래스로 변환
 *
 * @example
 * toTailwindSize({ mobile: 44, desktop: 40 }, 'h')
 * → 'h-11 md:h-10'
 */
export function toTailwindSize(
  value: ResponsiveValue,
  property: 'h' | 'w' | 'min-h' | 'min-w' | 'max-h' | 'max-w'
): string {
  const mobileTailwind = pxToTailwind(value.mobile);
  const desktopTailwind = pxToTailwind(value.desktop);

  return `${property}-${mobileTailwind} md:${property}-${desktopTailwind}`;
}

/**
 * Utility: px를 Tailwind 숫자로 변환
 *
 * Tailwind: 1 unit = 0.25rem = 4px
 * 44px → 11 (44 / 4)
 */
function pxToTailwind(px: number): number | string {
  const rem = px / 4;
  // Tailwind가 지원하는 값인지 확인 (0.5, 1, 1.5, 2, ... 100)
  if (Number.isInteger(rem) || rem % 0.5 === 0) {
    return rem;
  }
  // 지원하지 않는 값은 px 직접 사용
  return `[${px}px]`;
}

/**
 * Utility: 간격을 Tailwind gap 클래스로 변환
 */
export function toTailwindGap(value: ResponsiveValue): string {
  const mobileTailwind = pxToTailwind(value.mobile);
  const desktopTailwind = pxToTailwind(value.desktop);

  return `gap-${mobileTailwind} md:gap-${desktopTailwind}`;
}

/**
 * Utility: duration을 Tailwind duration 클래스로 변환
 */
export function toTailwindDuration(ms: number): string {
  return `duration-${ms}`;
}
