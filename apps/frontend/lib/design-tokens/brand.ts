/**
 * Brand Design Tokens - UL-QP-18 Equipment Management System
 *
 * 글로벌 디자인 언어 정의. 11개 페이지가 공유하는 SSOT.
 * 정밀 계측 산업 / 엄격한 규정 준수 / 데이터 신뢰성 최우선.
 *
 * 아키텍처:
 * - CSS 변수: globals.css의 :root / .dark 블록에 선언 (HSL 채널값)
 * - Tailwind: tailwind.config.js에 brand.* 토큰으로 등록
 * - 이 파일: Tailwind 클래스 조합 헬퍼 + 레이아웃 상수
 *
 * SSOT 경계:
 * - 색상 → globals.css (CSS 변수) + tailwind.config.js (theme 등록)
 * - 장비 상태 스타일 → components/equipment.ts (EQUIPMENT_STATUS_TOKENS)
 * - 모션 → semantic.ts (MOTION_TOKENS) + motion.ts (헬퍼)
 * - 긴급도 피드백 → visual-feedback.ts (URGENCY_FEEDBACK_MAP)
 * - 이 파일은 위 SSOT를 중복 정의하지 않음
 */

// ============================================================================
// 1. Color Reference (프로그래밍 참조용 — 런타임 사용은 Tailwind 클래스)
// ============================================================================

/**
 * 시멘틱 색상 hex 참조값
 *
 * 차트 라이브러리, Canvas API 등 CSS 변수가 불가능한 곳에서 사용.
 * 일반 컴포넌트는 반드시 Tailwind 클래스(bg-brand-ok 등)를 사용할 것.
 *
 * CSS 변수 SSOT: globals.css --brand-color-*
 * Tailwind SSOT: tailwind.config.js brand.*
 */
export const BRAND_COLORS_HEX = {
  ok: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
  info: '#3B82F6',
  neutral: '#6B7280',
  purple: '#8B5CF6',
  repair: '#F97316',
} as const;

export type SemanticColorKey = keyof typeof BRAND_COLORS_HEX;

// ============================================================================
// 2. Font Usage (Tailwind 유틸리티 클래스)
// ============================================================================

/**
 * 폰트 용도별 Tailwind 클래스
 *
 * CSS 변수 체인:
 *   layout.tsx (next/font) → --font-display / --font-body / --font-mono
 *   tailwind.config.js → fontFamily.display / .body / .mono
 *   → font-display / font-body / font-mono 클래스 사용 가능
 *
 * 규칙:
 * - 관리번호(SUW-E0001) → 항상 FONT.mono
 * - 타임스탬프 → 항상 FONT.mono
 * - KPI 숫자(대시보드 카운터) → FONT.kpi
 * - 헤딩, 네비게이션 → FONT.heading
 * - 본문, 설명 → FONT.body (또는 기본 font-sans)
 */
export const FONT = {
  /** 헤딩, 페이지 타이틀, 네비게이션 아이템 */
  heading: 'font-display',
  /** 본문 텍스트, 폼 라벨, 설명 */
  body: 'font-body',
  /** 관리번호, 타임스탬프, 코드 — tabular-nums 포함 */
  mono: 'font-mono tabular-nums',
  /** KPI 대형 카운터 (대시보드) */
  kpi: 'font-mono tabular-nums font-semibold',
} as const;

// ============================================================================
// 3. Layout Principles
// ============================================================================

/**
 * 레이아웃 원칙 — 데스크탑 우선, 정보 밀도 최우선
 */
export const BRAND_LAYOUT = {
  /** 최소 설계 기준 너비 (px) */
  minDesignWidth: 1280,

  /** 카드 간격 */
  cardGap: 'gap-4',

  /** 섹션 내 여백: 정보 밀도 우선 → 최소화 */
  sectionPadding: {
    compact: 'p-3',
    default: 'p-4',
    relaxed: 'p-6',
  },

  /** 페이지 컨텐츠 최대 너비 */
  maxContentWidth: 'max-w-7xl',

  /** 그리드 컬럼 (반응형) */
  grid: {
    /** 통계 카드 (대시보드) */
    stats: 'grid-cols-2 md:grid-cols-4',
    /** 장비 카드 (목록) */
    equipment: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    /** 설정/폼 (2컬럼) */
    form: 'grid-cols-1 md:grid-cols-2',
  },
} as const;

// ============================================================================
// 4. Composite Helpers (Tailwind theme 토큰 기반)
// ============================================================================

/**
 * 브랜드 카드 스타일 — surface 배경 + subtle 테두리
 */
export function getBrandCardClasses(): string {
  return 'bg-brand-bg-surface border border-brand-border-subtle rounded-lg';
}

/**
 * 섹션 헤더 스타일
 */
export function getBrandSectionHeaderClasses(): string {
  return 'text-brand-text-primary font-display font-semibold';
}

/**
 * 관리번호 표시 스타일 (SUW-E0001 형식)
 *
 * font-mono + tabular-nums + tracking-wider로
 * 고정 너비 숫자 + 넉넉한 자간 적용
 */
export function getManagementNumberClasses(): string {
  return 'font-mono tabular-nums text-brand-text-primary tracking-wider';
}

/**
 * 타임스탬프 표시 스타일
 */
export function getTimestampClasses(): string {
  return 'font-mono tabular-nums text-brand-text-muted text-sm';
}

/**
 * KPI 카운터 스타일 (대시보드 통계 수치)
 */
export function getKpiCounterClasses(): string {
  return 'font-mono tabular-nums font-semibold text-brand-text-primary';
}

/**
 * 시멘틱 색상 배지 스타일
 *
 * Tailwind theme 토큰 사용 → opacity modifier 지원
 *
 * @example
 * getSemanticBadgeClasses('ok')       // 정상 → 초록
 * getSemanticBadgeClasses('critical') // 부적합 → 빨강
 */
export function getSemanticBadgeClasses(color: SemanticColorKey): string {
  const colorMap: Record<SemanticColorKey, string> = {
    ok: 'text-brand-ok bg-brand-ok/10 border-brand-ok/20',
    warning: 'text-brand-warning bg-brand-warning/10 border-brand-warning/20',
    critical: 'text-brand-critical bg-brand-critical/10 border-brand-critical/20',
    info: 'text-brand-info bg-brand-info/10 border-brand-info/20',
    neutral: 'text-brand-neutral bg-brand-neutral/10 border-brand-neutral/20',
    purple: 'text-brand-purple bg-brand-purple/10 border-brand-purple/20',
    repair: 'text-brand-repair bg-brand-repair/10 border-brand-repair/20',
  };
  return `${colorMap[color]} border rounded-md px-2 py-0.5 text-xs font-medium`;
}

/**
 * Elevated 패널 스타일 (드롭다운, 모달 내부 등)
 */
export function getBrandElevatedClasses(): string {
  return 'bg-brand-bg-elevated border border-brand-border-default rounded-lg shadow-md';
}

/**
 * Muted 텍스트 스타일 (보조 설명, 힌트)
 */
export function getBrandMutedTextClasses(): string {
  return 'text-brand-text-muted text-sm';
}

/**
 * 시멘틱 색상 컨테이너 — 색상 클래스만 반환 (구조는 호출부가 결정)
 *
 * 의도적으로 p-*, rounded-* 없음.
 * 호출부에서 레이아웃 구조(padding, radius, border-variant)를 결정하고,
 * 이 함수는 색상 토큰만 담당합니다.
 *
 * @example
 * // 기본 info 박스
 * <div className={`rounded-md border p-4 ${getSemanticContainerColorClasses('info')}`}>
 *
 * // 좌측 강조 notice 박스 (border-l-4 패턴)
 * <div className={`border-l-4 p-4 ${getSemanticContainerColorClasses('info')}`}>
 *
 * // Compact 힌트
 * <div className={`rounded border p-2 text-xs ${getSemanticContainerColorClasses('warning')}`}>
 */
export function getSemanticContainerColorClasses(color: SemanticColorKey): string {
  const colorMap: Record<SemanticColorKey, string> = {
    ok: 'bg-brand-ok/10 border-brand-ok/20',
    warning: 'bg-brand-warning/10 border-brand-warning/20',
    critical: 'bg-brand-critical/10 border-brand-critical/20',
    info: 'bg-brand-info/10 border-brand-info/20',
    neutral: 'bg-brand-neutral/10 border-brand-neutral/20',
    purple: 'bg-brand-purple/10 border-brand-purple/20',
    repair: 'bg-brand-repair/10 border-brand-repair/20',
  };
  return colorMap[color];
}

/**
 * 시멘틱 색상 컨테이너 스타일 — 기본 프리셋 (rounded-md border p-4)
 *
 * 가장 일반적인 info box / warning banner 용도의 프리셋.
 * 좌측 강조(border-l-4), compact, banner 등 변형이 필요하면
 * getSemanticContainerColorClasses()를 직접 사용하세요.
 *
 * @example
 * getSemanticContainerClasses('info')     // 안내 박스 (파란색)
 * getSemanticContainerClasses('warning')  // 경고 박스 (주황색)
 * getSemanticContainerClasses('critical') // 위험 박스 (빨간색)
 */
export function getSemanticContainerClasses(color: SemanticColorKey): string {
  return `rounded-md border p-4 ${getSemanticContainerColorClasses(color)}`;
}

/**
 * 시멘틱 컨테이너 내부 강조 텍스트 색상 (제목·아이콘용)
 *
 * brand-color-* 변수는 라이트/다크 동일값이므로,
 * 본문 텍스트에는 text-muted-foreground 사용 권장.
 * 이 함수는 아이콘, 제목 등 강조 요소에만 사용하세요.
 */
export function getSemanticContainerTextClasses(color: SemanticColorKey): string {
  const colorMap: Record<SemanticColorKey, string> = {
    ok: 'text-brand-ok',
    warning: 'text-brand-warning',
    critical: 'text-brand-critical',
    info: 'text-brand-info',
    neutral: 'text-brand-neutral',
    purple: 'text-brand-purple',
    repair: 'text-brand-repair',
  };
  return colorMap[color];
}
