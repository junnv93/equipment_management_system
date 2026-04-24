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
  temporary: '#22B8CF',
  /** checked_out 이후 "진행 중" 상태 (in_use, lender_checked 등) */
  progress: '#1d6fb8',
  /** completed/canceled 아카이브 상태 */
  archive: '#919aaa',
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
// 4. BRAND_CLASS_MATRIX — 시멘틱 색상 클래스 단일 진실의 소스
// ============================================================================

/**
 * 모든 시멘틱 색상의 Tailwind 클래스 변형을 한 곳에서 정의합니다.
 *
 * 왜 동적 보간(`bg-brand-${key}/10`)이 아닌 리터럴 문자열인가?
 * → Tailwind JIT는 소스 파일의 정적 문자열만 스캔합니다.
 *   동적 보간은 빌드 시 CSS에 포함되지 않습니다.
 *
 * 새 색상 추가 시:
 * 1. BRAND_COLORS_HEX에 키 추가 → SemanticColorKey 자동 확장
 * 2. 이 매트릭스에 1행 추가 → 모든 헬퍼 함수 자동 확장
 * 3. TypeScript가 누락된 키를 컴파일 에러로 감지
 */
interface BrandClassSet {
  /** 텍스트만 — text-brand-{key} */
  text: string;
  /** 배경만 (10% 투명) — bg-brand-{key}/10 */
  bgLight: string;
  /** 배경(10%) + 텍스트 — 상태 표시기, 카드 배경 */
  status: string;
  /** 배경(10%) + 텍스트 + 보더(20%) — 배지, 컨테이너 */
  badge: string;
  /** 배경(10%) + 보더(20%) — 컨테이너 색상만 (텍스트 없음) */
  container: string;
  /** 좌측 보더 — border-l-brand-{key} */
  leftBorder: string;
  /** 솔리드 배경 + 흰 텍스트 — CTA, 스테퍼 노드 */
  solid: string;
  /** 도트 — bg-brand-{key} rounded-full */
  dot: string;
  /** 보더 30% — border-brand-{key}/30 (role chip 등 중간 강도 테두리) */
  borderOpacity30: string;
}

const BRAND_CLASS_MATRIX: Record<SemanticColorKey, BrandClassSet> = {
  ok: {
    text: 'text-brand-ok',
    bgLight: 'bg-brand-ok/10',
    status: 'bg-brand-ok/10 text-brand-ok',
    badge: 'text-brand-ok bg-brand-ok/10 border-brand-ok/20',
    container: 'bg-brand-ok/10 border-brand-ok/20',
    leftBorder: 'border-l-brand-ok',
    solid: 'bg-brand-ok text-white',
    dot: 'bg-brand-ok rounded-full',
    borderOpacity30: 'border-brand-ok/30',
  },
  warning: {
    text: 'text-brand-warning',
    bgLight: 'bg-brand-warning/10',
    status: 'bg-brand-warning/10 text-brand-warning',
    badge: 'text-brand-warning bg-brand-warning/10 border-brand-warning/20',
    container: 'bg-brand-warning/10 border-brand-warning/20',
    leftBorder: 'border-l-brand-warning',
    solid: 'bg-brand-warning text-white',
    dot: 'bg-brand-warning rounded-full',
    borderOpacity30: 'border-brand-warning/30',
  },
  critical: {
    text: 'text-brand-critical',
    bgLight: 'bg-brand-critical/10',
    status: 'bg-brand-critical/10 text-brand-critical',
    badge: 'text-brand-critical bg-brand-critical/10 border-brand-critical/20',
    container: 'bg-brand-critical/10 border-brand-critical/20',
    leftBorder: 'border-l-brand-critical',
    solid: 'bg-brand-critical text-white',
    dot: 'bg-brand-critical rounded-full',
    borderOpacity30: 'border-brand-critical/30',
  },
  info: {
    text: 'text-brand-info',
    bgLight: 'bg-brand-info/10',
    status: 'bg-brand-info/10 text-brand-info',
    badge: 'text-brand-info bg-brand-info/10 border-brand-info/20',
    container: 'bg-brand-info/10 border-brand-info/20',
    leftBorder: 'border-l-brand-info',
    solid: 'bg-brand-info text-white',
    dot: 'bg-brand-info rounded-full',
    borderOpacity30: 'border-brand-info/30',
  },
  neutral: {
    text: 'text-brand-neutral',
    bgLight: 'bg-brand-neutral/10',
    status: 'bg-brand-neutral/10 text-brand-neutral',
    badge: 'text-brand-neutral bg-brand-neutral/10 border-brand-neutral/20',
    container: 'bg-brand-neutral/10 border-brand-neutral/20',
    leftBorder: 'border-l-brand-neutral',
    solid: 'bg-brand-neutral text-white',
    dot: 'bg-brand-neutral rounded-full',
    borderOpacity30: 'border-brand-neutral/30',
  },
  purple: {
    text: 'text-brand-purple',
    bgLight: 'bg-brand-purple/10',
    status: 'bg-brand-purple/10 text-brand-purple',
    badge: 'text-brand-purple bg-brand-purple/10 border-brand-purple/20',
    container: 'bg-brand-purple/10 border-brand-purple/20',
    leftBorder: 'border-l-brand-purple',
    solid: 'bg-brand-purple text-white',
    dot: 'bg-brand-purple rounded-full',
    borderOpacity30: 'border-brand-purple/30',
  },
  repair: {
    text: 'text-brand-repair',
    bgLight: 'bg-brand-repair/10',
    status: 'bg-brand-repair/10 text-brand-repair',
    badge: 'text-brand-repair bg-brand-repair/10 border-brand-repair/20',
    container: 'bg-brand-repair/10 border-brand-repair/20',
    leftBorder: 'border-l-brand-repair',
    solid: 'bg-brand-repair text-white',
    dot: 'bg-brand-repair rounded-full',
    borderOpacity30: 'border-brand-repair/30',
  },
  temporary: {
    text: 'text-brand-temporary',
    bgLight: 'bg-brand-temporary/10',
    status: 'bg-brand-temporary/10 text-brand-temporary',
    badge: 'text-brand-temporary bg-brand-temporary/10 border-brand-temporary/20',
    container: 'bg-brand-temporary/10 border-brand-temporary/20',
    leftBorder: 'border-l-brand-temporary',
    solid: 'bg-brand-temporary text-white',
    dot: 'bg-brand-temporary rounded-full',
    borderOpacity30: 'border-brand-temporary/30',
  },
  progress: {
    text: 'text-brand-progress',
    bgLight: 'bg-brand-progress/10',
    status: 'bg-brand-progress/10 text-brand-progress',
    badge: 'text-brand-progress bg-brand-progress/10 border-brand-progress/20',
    container: 'bg-brand-progress/10 border-brand-progress/20',
    leftBorder: 'border-l-brand-progress',
    solid: 'bg-brand-progress text-white',
    dot: 'bg-brand-progress rounded-full',
    borderOpacity30: 'border-brand-progress/30',
  },
  archive: {
    text: 'text-brand-archive',
    bgLight: 'bg-brand-archive/10',
    status: 'bg-brand-archive/10 text-brand-archive',
    badge: 'text-brand-archive bg-brand-archive/10 border-brand-archive/20',
    container: 'bg-brand-archive/10 border-brand-archive/20',
    leftBorder: 'border-l-brand-archive',
    solid: 'bg-brand-archive text-white',
    dot: 'bg-brand-archive rounded-full',
    borderOpacity30: 'border-brand-archive/30',
  },
} as const satisfies Record<SemanticColorKey, BrandClassSet>;

// ============================================================================
// 4.2 Composite Helpers (Tailwind theme 토큰 기반)
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
 * @example
 * getSemanticBadgeClasses('ok')       // 정상 → 초록
 * getSemanticBadgeClasses('critical') // 부적합 → 빨강
 */
export function getSemanticBadgeClasses(color: SemanticColorKey): string {
  return `${BRAND_CLASS_MATRIX[color].badge} border rounded-md px-2 py-0.5 text-xs font-medium`;
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
  return BRAND_CLASS_MATRIX[color].container;
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
  return `rounded-md border p-4 ${BRAND_CLASS_MATRIX[color].container}`;
}

/**
 * 시멘틱 컨테이너 내부 강조 텍스트 색상 (제목·아이콘용)
 *
 * brand-color-* 변수는 라이트/다크 동일값이므로,
 * 본문 텍스트에는 text-muted-foreground 사용 권장.
 * 이 함수는 아이콘, 제목 등 강조 요소에만 사용하세요.
 */
export function getSemanticContainerTextClasses(color: SemanticColorKey): string {
  return BRAND_CLASS_MATRIX[color].text;
}

// ============================================================================
// 5. Status / Border / Solid / Dot / BgLight Helpers (BRAND_CLASS_MATRIX 파생)
// ============================================================================

/**
 * 시멘틱 상태 클래스 — 배경(10%) + 텍스트 (border 없음)
 *
 * getSemanticBadgeClasses와 달리 border를 포함하지 않습니다.
 * 카드 className, 상태 표시기, 테이블 셀 배경 등에 사용.
 *
 * @example
 * getSemanticStatusClasses('ok')       // 'bg-brand-ok/10 text-brand-ok'
 * getSemanticStatusClasses('critical') // 'bg-brand-critical/10 text-brand-critical'
 */
export function getSemanticStatusClasses(color: SemanticColorKey): string {
  return BRAND_CLASS_MATRIX[color].status;
}

/**
 * 시멘틱 좌측 보더 클래스 — border-l-brand-{color}
 *
 * 카드 좌측 색상 바, 타임라인 보더, 승인 상태 보더 등에 사용.
 * border-l-4 등 너비 클래스는 호출부에서 추가하세요.
 *
 * @example
 * getSemanticLeftBorderClasses('ok')     // 'border-l-brand-ok'
 * getSemanticLeftBorderClasses('info')   // 'border-l-brand-info'
 */
export function getSemanticLeftBorderClasses(color: SemanticColorKey): string {
  return BRAND_CLASS_MATRIX[color].leftBorder;
}

/**
 * 시멘틱 솔리드 배경 클래스 — bg-brand-{color} text-white
 *
 * 배지(solid), CTA 버튼, 스테퍼 노드, 타임라인 도트 등 불투명 배경에 사용.
 *
 * @example
 * getSemanticSolidBgClasses('ok')       // 'bg-brand-ok text-white'
 * getSemanticSolidBgClasses('critical') // 'bg-brand-critical text-white'
 */
export function getSemanticSolidBgClasses(color: SemanticColorKey): string {
  return BRAND_CLASS_MATRIX[color].solid;
}

/**
 * 시멘틱 상태 도트 클래스 — bg-brand-{color} rounded-full
 *
 * 상태 인디케이터 도트, 미니 프로그레스 완료 표시 등에 사용.
 * 크기(h-2 w-2 등)는 호출부에서 추가하세요.
 *
 * @example
 * getSemanticDotClasses('ok')       // 'bg-brand-ok rounded-full'
 * getSemanticDotClasses('critical') // 'bg-brand-critical rounded-full'
 */
export function getSemanticDotClasses(color: SemanticColorKey): string {
  return BRAND_CLASS_MATRIX[color].dot;
}

/**
 * 시멘틱 배경만 클래스 — bg-brand-{color}/10 (텍스트·보더 없음)
 *
 * 아이콘 배경 원, 인디케이터 배경 등 순수 배경만 필요한 곳에 사용.
 * 텍스트 색상은 호출부에서 별도 적용하세요.
 *
 * @example
 * getSemanticBgLightClasses('ok')       // 'bg-brand-ok/10'
 * getSemanticBgLightClasses('critical') // 'bg-brand-critical/10'
 */
export function getSemanticBgLightClasses(color: SemanticColorKey): string {
  return BRAND_CLASS_MATRIX[color].bgLight;
}

/**
 * 시멘틱 보더 30% 클래스 — border-brand-{color}/30
 *
 * role chip, 중간 강도 테두리 등 `container`(20%)보다 조금 더 진한 테두리가 필요한 곳에 사용.
 * `border-*` 너비 유틸리티(border, border-2 등)는 호출부에서 추가하세요.
 *
 * @example
 * getSemanticBorderOpacity30Classes('warning') // 'border-brand-warning/30'
 */
export function getSemanticBorderOpacity30Classes(color: SemanticColorKey): string {
  return BRAND_CLASS_MATRIX[color].borderOpacity30;
}

// ============================================================================
// 6. Site Identity Helpers (크로스 사이트 색상 체계)
// ============================================================================

export type SiteCode = 'suw' | 'uiw' | 'pyt';

/**
 * 사이트 배지 클래스 — bg-brand-site-{code}/10 + text + border
 *
 * @example
 * getSiteBadgeClasses('suw') // 수원 배지
 * getSiteBadgeClasses('pyt') // 평택 배지
 */
export function getSiteBadgeClasses(site: SiteCode): string {
  const colorMap: Record<SiteCode, string> = {
    suw: 'text-brand-site-suw bg-brand-site-suw/10 border-brand-site-suw/20',
    uiw: 'text-brand-site-uiw bg-brand-site-uiw/10 border-brand-site-uiw/20',
    pyt: 'text-brand-site-pyt bg-brand-site-pyt/10 border-brand-site-pyt/20',
  };
  return `${colorMap[site]} border rounded-md px-2 py-0.5 text-xs font-medium`;
}

/**
 * 사이트 도트 클래스 — bg-brand-site-{code} rounded-full
 *
 * 크기(h-2 w-2 등)는 호출부에서 추가하세요.
 */
export function getSiteDotClasses(site: SiteCode): string {
  const colorMap: Record<SiteCode, string> = {
    suw: 'bg-brand-site-suw rounded-full',
    uiw: 'bg-brand-site-uiw rounded-full',
    pyt: 'bg-brand-site-pyt rounded-full',
  };
  return colorMap[site];
}
