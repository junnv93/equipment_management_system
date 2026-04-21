/**
 * Semantic Design Tokens (Layer 2: Purpose-Based)
 *
 * Primitives를 의미있는 이름으로 매핑합니다.
 * "어떻게 보이는가"보다 "무엇을 위한 것인가"에 집중합니다.
 *
 * SSOT: 용도 기반 토큰 - 컴포넌트는 이 레이어를 참조
 * 변경 시: primitive 참조를 바꾸면 모든 사용처가 자동 업데이트
 */

import {
  SIZE_PRIMITIVES,
  SPACING_PRIMITIVES,
  MOTION_PRIMITIVES,
  ELEVATION_PRIMITIVES,
  RADIUS_PRIMITIVES,
  TYPOGRAPHY_PRIMITIVES,
} from './primitives';
import {
  getSemanticContainerColorClasses,
  getSemanticLeftBorderClasses,
  getSemanticSolidBgClasses,
  type SemanticColorKey,
} from './brand';

/**
 * Interactive Elements (상호작용 요소)
 *
 * 버튼, 링크, 입력 필드 등 사용자가 직접 조작하는 요소들
 */
export const INTERACTIVE_TOKENS = {
  /** 터치 타겟 크기 */
  size: {
    /** 기본 - 대부분의 버튼/아이콘 (WCAG AAA) */
    standard: SIZE_PRIMITIVES.touch.minimal,

    /** 컴팩트 - 공간이 제한된 영역 (툴바, 인라인 액션) */
    compact: SIZE_PRIMITIVES.touch.minimal, // 44px은 최소값

    /** 편안함 - 주요 액션 버튼 */
    comfortable: SIZE_PRIMITIVES.touch.comfortable,

    /** 강조 - Hero CTA, 중요한 액션 */
    prominent: SIZE_PRIMITIVES.touch.generous,
  },

  /** 아이콘 크기 */
  icon: {
    /** 장식용 작은 아이콘 */
    decorative: SIZE_PRIMITIVES.icon.sm,

    /** 기본 interactive 아이콘 */
    standard: SIZE_PRIMITIVES.icon.lg,

    /** 강조된 아이콘 */
    prominent: SIZE_PRIMITIVES.icon.xl,
  },

  /** 간격 */
  spacing: {
    /** 요소 간 간격 */
    gap: SPACING_PRIMITIVES.gap.comfortable,

    /** 내부 여백 */
    padding: SPACING_PRIMITIVES.padding.comfortable,
  },

  /** 모서리 */
  radius: {
    /** 일반 버튼 */
    default: RADIUS_PRIMITIVES.md,

    /** 원형 버튼 (아이콘 전용) */
    circular: RADIUS_PRIMITIVES.full,
  },
} as const;

/**
 * Content Elements (콘텐츠 요소)
 *
 * 텍스트, 이미지, 미디어 등 정보 전달 요소들
 */
export const CONTENT_TOKENS = {
  /** 아바타/프로필 */
  avatar: {
    small: SIZE_PRIMITIVES.avatar.sm,
    medium: SIZE_PRIMITIVES.avatar.md,
    large: SIZE_PRIMITIVES.avatar.lg,
  },

  /** 배지/카운트 인디케이터 */
  badge: {
    small: SIZE_PRIMITIVES.badge.sm,
    medium: SIZE_PRIMITIVES.badge.md,
    large: SIZE_PRIMITIVES.badge.lg,
  },

  /** 타이포그래피 */
  text: {
    size: {
      caption: TYPOGRAPHY_PRIMITIVES.fontSize.xs,
      body: TYPOGRAPHY_PRIMITIVES.fontSize.base,
      emphasis: TYPOGRAPHY_PRIMITIVES.fontSize.lg,
    },
    weight: {
      regular: TYPOGRAPHY_PRIMITIVES.fontWeight.regular,
      medium: TYPOGRAPHY_PRIMITIVES.fontWeight.medium,
      bold: TYPOGRAPHY_PRIMITIVES.fontWeight.bold,
    },
  },

  /**
   * 숫자 표시 (font-variant-numeric)
   *
   * Web Interface Guidelines: "Apply tabular-nums for number columns"
   * 등폭 숫자로 값 변경 시 레이아웃 시프트 방지
   */
  numeric: {
    /** 등폭 숫자 — 통계 카드, 배지 카운트, 테이블 컬럼 */
    tabular: 'tabular-nums',
  },
} as const;

/**
 * Motion Tokens (애니메이션)
 *
 * 일관된 모션 언어
 */
export const MOTION_TOKENS = {
  /** 전환 애니메이션 */
  transition: {
    /** 즉각 피드백 (hover, focus) */
    instant: {
      duration: MOTION_PRIMITIVES.duration.instant,
      easing: MOTION_PRIMITIVES.easing.sharp,
    },

    /** 빠른 전환 (드롭다운 열기/닫기) */
    fast: {
      duration: MOTION_PRIMITIVES.duration.fast,
      easing: MOTION_PRIMITIVES.easing.standard,
    },

    /** 표준 전환 (모달, 페이지 전환) */
    moderate: {
      duration: MOTION_PRIMITIVES.duration.moderate,
      easing: MOTION_PRIMITIVES.easing.standard,
    },

    /** 강조 전환 (중요한 상태 변화) */
    emphasized: {
      duration: MOTION_PRIMITIVES.duration.slow,
      easing: MOTION_PRIMITIVES.easing.decelerate,
    },
  },

  /** 등장 애니메이션 */
  entrance: {
    /** 페이드 인 */
    fade: {
      duration: MOTION_PRIMITIVES.duration.moderate,
      easing: MOTION_PRIMITIVES.easing.decelerate,
    },

    /** 슬라이드 인 */
    slide: {
      duration: MOTION_PRIMITIVES.duration.fast,
      easing: MOTION_PRIMITIVES.easing.decelerate,
    },

    /** 스프링 (주목) */
    spring: {
      duration: MOTION_PRIMITIVES.duration.moderate,
      easing: MOTION_PRIMITIVES.easing.spring,
    },
  },

  /** 퇴장 애니메이션 */
  exit: {
    fade: {
      duration: MOTION_PRIMITIVES.duration.fast,
      easing: MOTION_PRIMITIVES.easing.accelerate,
    },
    slide: {
      duration: MOTION_PRIMITIVES.duration.fast,
      easing: MOTION_PRIMITIVES.easing.accelerate,
    },
  },

  /** 연속 애니메이션 */
  stagger: {
    /** 리스트 아이템 (알림, 검색 결과) */
    list: MOTION_PRIMITIVES.stagger.tight,

    /** 카드 그리드 */
    grid: MOTION_PRIMITIVES.stagger.comfortable,

    /** 섹션 */
    section: MOTION_PRIMITIVES.stagger.relaxed,
  },
} as const;

/**
 * Elevation Tokens (깊이/레이어)
 *
 * Z-index와 그림자로 시각적 계층 구조 표현
 */
export const ELEVATION_TOKENS = {
  /** Z-index 레이어 */
  layer: {
    base: ELEVATION_PRIMITIVES.zIndex.base,
    raised: ELEVATION_PRIMITIVES.zIndex.raised,
    floating: ELEVATION_PRIMITIVES.zIndex.dropdown,
    sticky: ELEVATION_PRIMITIVES.zIndex.sticky,
    overlay: ELEVATION_PRIMITIVES.zIndex.overlay,
    modal: ELEVATION_PRIMITIVES.zIndex.modal,
    notification: ELEVATION_PRIMITIVES.zIndex.toast,
  },

  /** 그림자 */
  shadow: {
    none: ELEVATION_PRIMITIVES.shadow.none,
    subtle: ELEVATION_PRIMITIVES.shadow.sm,
    medium: ELEVATION_PRIMITIVES.shadow.md,
    prominent: ELEVATION_PRIMITIVES.shadow.lg,
    dramatic: ELEVATION_PRIMITIVES.shadow.xl,
  },
} as const;

/**
 * Layout Tokens (레이아웃)
 *
 * 페이지 구조, 간격, 여백
 */
export const LAYOUT_TOKENS = {
  /** 섹션 간 간격 */
  section: {
    gap: SPACING_PRIMITIVES.gap.spacious,
  },

  /** 컨테이너 패딩 */
  container: {
    padding: SPACING_PRIMITIVES.padding.relaxed,
  },
} as const;

/**
 * Section Rhythm Tokens (섹션 리듬)
 *
 * 페이지 내 섹션 간 수직 간격을 density 기반으로 표준화.
 * space-y-* 하드코딩 대신 이 토큰을 참조하여 전역 간격 일관성 유지.
 */
export const SECTION_RHYTHM_TOKENS = {
  tight: 'space-y-3', // 12px — 밀접 관련 (헤더+서브타이틀)
  comfortable: 'space-y-5', // 20px — 기본 섹션 간
  spacious: 'space-y-6 md:space-y-7', // 24/28px — 그룹 경계
  dramatic: 'space-y-8 md:space-y-10', // 32/40px — 액션 직전 강조
} as const;

export type SectionRhythm = keyof typeof SECTION_RHYTHM_TOKENS;

export function getSectionRhythm(density: SectionRhythm = 'comfortable'): string {
  return SECTION_RHYTHM_TOKENS[density];
}

/**
 * Focus Tokens (포커스 상태)
 *
 * 키보드 네비게이션 및 접근성
 */
export const FOCUS_TOKENS = {
  /** 포커스 링 수치 */
  ring: {
    width: 2,
    offset: 2,
  },

  /**
   * Ready-to-use Tailwind 포커스 클래스
   *
   * Web Interface Guidelines: "Use :focus-visible over :focus"
   * focus-visible: 키보드 네비게이션에서만 포커스 링 표시
   */
  classes: {
    /** 기본: 밝은 배경 (primary 색상) */
    default:
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    /** 브랜드: UL 색상 (헤더 영역) */
    brand:
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-info focus-visible:ring-offset-2',
    /** 어두운 배경 (사이드바, 모바일 네비) */
    onDark:
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-info focus-visible:ring-offset-2 focus-visible:ring-offset-ul-midnight',
  },
} as const;

/**
 * Refetch Overlay Tokens (데이터 갱신 피드백)
 *
 * TanStack Query의 isRefetching 상태에서 콘텐츠 영역에
 * 반투명 오버레이 + 스피너를 표시하는 공통 패턴.
 *
 * 사용처: 필터 전환, 페이지네이션 등 서버 재요청 시 시각적 피드백.
 * Layer 2에 위치하여 모든 리스트 페이지에서 재사용 가능.
 *
 * @example
 * ```tsx
 * <div className={REFETCH_OVERLAY_TOKENS.wrapper}>
 *   {isRefetching && (
 *     <div className={REFETCH_OVERLAY_TOKENS.spinnerOverlay}>
 *       <Loader2 className={REFETCH_OVERLAY_TOKENS.spinner} />
 *     </div>
 *   )}
 *   <div className={cn(contentClass, isRefetching && REFETCH_OVERLAY_TOKENS.contentRefetching)}>
 *     ...
 *   </div>
 * </div>
 * ```
 */
export const REFETCH_OVERLAY_TOKENS = {
  /** 상대 위치 래퍼 (스피너 절대 위치의 기준점) */
  wrapper: 'relative',

  /** 콘텐츠 영역 — refetch 시 반투명 + 포인터 차단 */
  contentRefetching: 'opacity-40 pointer-events-none',

  /** 스피너 오버레이 (absolute center) */
  spinnerOverlay: 'absolute inset-0 flex items-center justify-center z-10',

  /** 스피너 아이콘 */
  spinner: 'h-5 w-5 text-brand-text-muted motion-safe:animate-spin',
} as const;

/**
 * Micro Typography Tokens (마이크로 타이포그래피)
 *
 * 배지/레이블/캡션 등 소형 UI 요소 전용 텍스트 크기.
 * TYPOGRAPHY_PRIMITIVES['2xs'] = 10px (WCAG SC 1.4.4 권고 하한)
 *
 * 금지: 7px·8px·9px arbitrary 클래스 — 접근성 하한 미달 (WCAG SC 1.4.4)
 */
/**
 * Micro Typography Tokens (마이크로 타이포그래피)
 *
 * 배지/레이블/캡션 등 소형 UI 요소 전용 텍스트 크기.
 * globals.css @theme: --text-2xs: 0.625rem (10px) → text-2xs 유틸리티 자동 생성.
 * TYPOGRAPHY_PRIMITIVES['2xs'] = 10px 와 CSS 변수 레벨에서 연동됨.
 *
 * 금지: text-[7px]·[8px]·[9px]·[10px] arbitrary — 접근성 하한 미달 (WCAG SC 1.4.4)
 */
export const MICRO_TYPO = {
  /** 상태 배지 / 카운트 배지 (--text-2xs = 10px) */
  badge: 'text-2xs',
  /** 범례·부속 레이블 (--text-2xs = 10px) */
  label: 'text-2xs',
  /** 일반 부연 설명 (text-xs = 12/11px) */
  caption: 'text-xs',
  /** 메타/타임스탬프/관리번호 (--text-xs-tight = 11px) */
  meta: 'text-xs-tight',
  /** 정보 레이블/섹션 내 값 (--text-sm-tight = 13px) */
  detail: 'text-sm-tight',
} as const;

/**
 * UI Dimension Tokens (UI 치수 토큰)
 *
 * globals.css @theme 등록 변수 기반 named Tailwind 유틸리티.
 *   --spacing-hairline: 3px   → w-hairline / h-hairline
 *   --spacing-pagination: 30px → w-pagination / h-pagination
 * WIDTH_PRIMITIVES.hairline / SIZE_PRIMITIVES.pagination 와 CSS 변수 레벨 연동.
 */
export const DIMENSION_TOKENS = {
  /** 목적 강조 세로 바 (--spacing-hairline = 3px) */
  purposeBar: 'w-hairline',
  /** 페이지네이션 버튼 정사각 (--spacing-pagination = 30px) */
  paginationBtn: 'w-pagination h-pagination',
  /** 상태 흐름 도트 원 정사각 (--spacing-step-dot = 18px) */
  stepDot: 'w-step-dot h-step-dot',
} as const;

// ============================================================================
// Empty State Tokens (도메인 중립 — 전체 앱 공용)
// ============================================================================

/**
 * 빈 상태 UI 토큰 — 3-variant 공용 EmptyState 컴포넌트가 소비하는 semantic 레이어 토큰.
 *
 * variant별 아이콘 색상:
 *   no-data        → brand-info (초기 진입, 워크플로우 CTA 강조)
 *   filtered       → muted (검색/필터 결과 없음, 조용한 피드백)
 *   status-filtered → brand-warning (특정 상태 필터 결과 없음)
 *
 * equipment.ts의 EQUIPMENT_EMPTY_STATE_TOKENS는 이 토큰을 re-export (@deprecated).
 */
export const EMPTY_STATE_TOKENS = {
  /** 전체 컨테이너 — 중앙 정렬 + 수직 여백 */
  container: 'text-center py-12',
  /** 아이콘 래퍼 — 크기 고정 */
  iconContainer: 'mx-auto h-12 w-12',
  /** 아이콘 크기 */
  icon: 'h-12 w-12',
  /** 제목 */
  title: 'mt-4 text-lg font-semibold text-balance',
  /** 설명 */
  description: 'mt-2 text-sm text-muted-foreground text-balance max-w-md mx-auto',
  /** 액션 버튼 영역 */
  actions: 'mt-5 flex flex-col sm:flex-row gap-3 justify-center',
  /** variant별 아이콘 색상 */
  variantIconColor: {
    'no-data': 'text-brand-info',
    filtered: 'text-muted-foreground',
    'status-filtered': 'text-brand-warning',
  } as const,
  /** variant별 아이콘 배경 (iconContainer 결합용) */
  variantIconBg: {
    'no-data': 'bg-brand-info/5 rounded-full p-3',
    filtered: '',
    'status-filtered': 'bg-brand-warning/5 rounded-full p-3',
  } as const,
} as const;

export type CalloutVariant = 'info' | 'warning' | 'critical' | 'ok' | 'neutral';
export type CalloutEmphasis = 'leftBorder' | 'filled' | 'outlined';
export type CalloutSize = 'compact' | 'default' | 'spacious';

const CALLOUT_VARIANT_TO_SEMANTIC: Record<CalloutVariant, SemanticColorKey> = {
  info: 'info',
  warning: 'warning',
  critical: 'critical',
  ok: 'ok',
  neutral: 'neutral',
};

/**
 * Callout Tokens (콜아웃 블록)
 *
 * leftBorder / filled / outlined 3가지 emphasis × 5 variant × 3 size.
 * emphasis 함수는 brand.ts 헬퍼를 통해 CSS 변수 기반 색상 클래스를 생성.
 * EMPTY_STATE_TOKENS와 함께 알림/안내 블록의 시각 언어 SSOT.
 */
export const CALLOUT_TOKENS = {
  base: 'flex items-start gap-3 rounded-md',
  size: {
    compact: 'px-3 py-2.5 min-h-[3rem]',
    default: 'px-4 py-3.5 min-h-[3.5rem]',
    spacious: 'px-5 py-4 min-h-[4rem]',
  },
  emphasis: {
    leftBorder: (v: CalloutVariant) =>
      `border-l-4 ${getSemanticLeftBorderClasses(CALLOUT_VARIANT_TO_SEMANTIC[v])} ${getSemanticContainerColorClasses(CALLOUT_VARIANT_TO_SEMANTIC[v])}`,
    outlined: (v: CalloutVariant) =>
      `border ${getSemanticContainerColorClasses(CALLOUT_VARIANT_TO_SEMANTIC[v])}`,
    filled: (v: CalloutVariant) =>
      `${getSemanticSolidBgClasses(CALLOUT_VARIANT_TO_SEMANTIC[v])} text-white`,
  },
  icon: {
    wrap: 'flex-shrink-0 mt-0.5',
    size: 'h-5 w-5',
    color: (v: CalloutVariant) => `text-brand-${CALLOUT_VARIANT_TO_SEMANTIC[v]}`,
  },
  body: 'flex-1 min-w-0 space-y-1',
  title: (v: CalloutVariant) =>
    `text-sm font-semibold text-brand-${CALLOUT_VARIANT_TO_SEMANTIC[v]}`,
  description: 'text-sm text-muted-foreground leading-relaxed',
  action: 'mt-2 flex items-center gap-2',
} as const;

export function getCalloutClasses(
  variant: CalloutVariant,
  emphasis: CalloutEmphasis = 'leftBorder',
  size: CalloutSize = 'default'
): string {
  return [
    CALLOUT_TOKENS.base,
    CALLOUT_TOKENS.size[size],
    CALLOUT_TOKENS.emphasis[emphasis](variant),
  ].join(' ');
}

/**
 * Type Exports - 컴포넌트에서 타입 안전하게 사용
 */
export type InteractiveSize = keyof typeof INTERACTIVE_TOKENS.size;
export type MotionSpeed = keyof typeof MOTION_TOKENS.transition;
export type ElevationLayer = keyof typeof ELEVATION_TOKENS.layer;
export type EmptyStateVariant = keyof typeof EMPTY_STATE_TOKENS.variantIconColor;
