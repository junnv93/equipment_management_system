/**
 * Team 컴포넌트 Design Token
 *
 * Layer 3 (Component): 즉시 사용 가능한 클래스 조합
 * Layer 2 (Semantic) 참조: INTERACTIVE_TOKENS, MOTION_TOKENS
 *
 * SSOT 역할:
 * - TEAM_SHARED: 팀 모듈 전역 공유 프리미티브 (accent line, stagger 등)
 * - ROLE_BADGE_TOKENS: TeamMemberList / LeaderCombobox / MemberProfileDialog 3곳 공유
 * - TEAM_SEARCH_TOKENS: 팀 관련 검색 인풋 통일 스타일
 * - TEAM_CARD_TOKENS: TeamCard 스타일
 * - TEAM_FILTER_PANEL_TOKENS: TeamListContent 좌측 필터 패널
 * - TEAM_SECTION_TOKENS: TeamListContent 분류별 섹션 헤더
 * - SITE_PANEL_TOKENS: TeamListContent 사이트 패널
 * - TEAM_ROW_TOKENS: TeamListContent compact row
 * - CLS_PILL_TOKENS: TeamListContent 분류 필터 pill
 * - TEAM_MEMBER_GROUP_TOKENS: TeamMemberList 역할 그룹
 */

import { TRANSITION_PRESETS } from '../motion';
import { MICRO_TYPO } from '../semantic';

// ─────────────────────────────────────────────────────────────────────────────
// 팀 모듈 공유 프리미티브 — DRY 원칙
// 여러 토큰 객체에서 참조되는 공통 값을 한 곳에 정의
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 분류 accent line — 팀 모듈 시각 identity
 *
 * 참조: TEAM_CARD_TOKENS, SITE_PANEL_TOKENS, TeamDetail
 * 사이트/분류별 data-driven color를 style prop으로 받아 사용
 */
const ACCENT_LINE = 'absolute top-0 left-0 right-0 h-[3px]';

/**
 * Stagger 애니메이션 프리미티브 — motion-safe 준수
 *
 * compact row (fade + 4px slide): TeamListContent, TeamMemberList
 * fade only (slide 없음): TeamEquipmentList 테이블 행
 */
const STAGGER = {
  /** fade + subtle slide (4px) — compact row 등장용 */
  slideUp:
    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:fill-mode-forwards',
  /** fade only — 테이블 행 등장용 (수직 이동 부적합) */
  fade: 'motion-safe:animate-in motion-safe:fade-in motion-safe:fill-mode-forwards',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 역할 배지 — SSOT (3개 컴포넌트 공유)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 역할별 배지 클래스 매핑
 * 참조: TeamMemberList, LeaderCombobox, MemberProfileDialog
 */
export const ROLE_BADGE_TOKENS: Record<string, string> = {
  test_engineer: 'bg-brand-info/10 text-brand-info',
  technical_manager: 'bg-brand-ok/10 text-brand-ok',
  quality_manager: 'bg-brand-purple/10 text-brand-purple',
  lab_manager: 'bg-brand-warning/10 text-brand-warning',
  system_admin: 'bg-brand-critical/10 text-brand-critical',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 팀 검색 인풋 — 통일 스타일 (SSOT)
// TeamListContent / TeamMemberList / TeamEquipmentList 3곳 공유
// ─────────────────────────────────────────────────────────────────────────────

export const TEAM_SEARCH_TOKENS = {
  /** 검색 인풋 높이 + 텍스트 크기 (h-9 = 36px, 컴팩트 폼 표준) */
  input: 'h-9 text-sm',
  /** 검색 아이콘 — 위치 + 크기 사전 계산 (cn() 런타임 비용 제거) */
  iconPositioned: 'absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 팀 카드
// ─────────────────────────────────────────────────────────────────────────────

export const TEAM_CARD_TOKENS = {
  /** hover / focus 인터랙션 — getTransitionClasses SSOT */
  interactive: [
    'cursor-pointer',
    TRANSITION_PRESETS.fastShadowTransformBorder,
    'hover:shadow-md',
    'hover:-translate-y-0.5',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-primary',
    'focus-visible:ring-offset-2',
    'active:scale-[0.99]',
  ].join(' '),

  /** 분류 accent line — ACCENT_LINE SSOT 참조 */
  accentLine: ACCENT_LINE,

  /** KPI 3열 그리드 */
  kpiGrid: 'grid grid-cols-3 gap-2 bg-muted/50 rounded-lg p-2.5',
  kpiItem: 'text-center',
  kpiValue: 'text-lg font-bold tabular-nums leading-none text-foreground',
  kpiLabel: `${MICRO_TYPO.label} text-muted-foreground mt-0.5`,

  /** 팀장 없음 경고 배지 */
  noLeaderBadge: [
    `inline-flex items-center gap-1 ${MICRO_TYPO.meta} font-medium`,
    'text-brand-warning',
    'bg-brand-warning/10',
    'border border-brand-warning/20',
    'px-2 py-0.5 rounded-full',
  ].join(' '),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 사이트 패널 (TeamListContent — 3-column site-first layout)
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_PANEL_TOKENS = {
  panel: 'bg-card border border-border rounded-lg overflow-hidden',

  /** 사이트 헤더 (3px top accent bar 포함) */
  header: 'px-4 py-3.5 border-b border-border relative overflow-hidden',
  /** 분류 accent line — ACCENT_LINE SSOT 참조 */
  accentBar: ACCENT_LINE,

  nameRow: 'flex items-center justify-between',
  /** MICRO_TYPO.siteTitle(text-sm-wide = 15px): text-sm(14)과 text-base(16) 사이 — 사이트명 시각 계층 의도적 튜닝 */
  name: `${MICRO_TYPO.siteTitle} font-bold text-foreground tracking-tight`,
  codeBadge: `font-mono ${MICRO_TYPO.badge} font-semibold px-1.5 py-0.5 rounded border`,

  metaRow: 'flex items-center gap-3 mt-2',
  /** MICRO_TYPO.meta(text-xs-tight = 11px): text-xs(12)보다 살짝 작게 — compact 패널 메타데이터 밀도 최적화 */
  metaItem: `flex items-center gap-1 ${MICRO_TYPO.meta} text-muted-foreground`,
  metaNum: 'font-mono font-semibold text-foreground tabular-nums',
  metaNumWarn: 'font-mono font-semibold text-brand-warning tabular-nums',

  teamList: 'py-1.5',

  footer: 'px-3.5 py-2 border-t border-border',
  addBtn: [
    'flex items-center gap-1.5 w-full px-2 py-1.5 rounded',
    'border border-dashed border-border',
    'text-xs text-muted-foreground font-medium',
    'hover:bg-muted/50 hover:border-muted-foreground hover:text-foreground',
    TRANSITION_PRESETS.fastColor,
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
  ].join(' '),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 팀 행 (TeamListContent — compact row within site panel)
// ─────────────────────────────────────────────────────────────────────────────

export const TEAM_ROW_TOKENS = {
  /** 행 컨테이너 — group 클래스로 accent bar hover 연동 */
  row: [
    'group relative flex items-center px-3.5 py-2.5 gap-2.5',
    'cursor-pointer',
    'hover:bg-muted/50',
    TRANSITION_PRESETS.fastColor,
    'focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-1 focus-visible:ring-primary',
  ].join(' '),

  /** 분류 색상 accent bar — group-hover에서 opacity 1 */
  accentBar: [
    'absolute left-0 top-0 bottom-0 w-[3px]',
    'opacity-0 group-hover:opacity-100',
    TRANSITION_PRESETS.fastOpacity,
  ].join(' '),

  /** 분류 코드 아이콘 — h-[30px]: h-7(28)과 h-8(32) 사이, 아이콘 원형에 최적화된 크기 */
  clsIcon: [
    'h-[30px] w-[30px] rounded-full flex items-center justify-center',
    `flex-shrink-0 font-mono font-bold ${MICRO_TYPO.meta}`,
  ].join(' '),

  info: 'flex-1 min-w-0',
  /** text-xs(12px): compact row 팀명 가독성 확보 */
  clsName: 'text-xs font-semibold text-foreground truncate leading-tight',

  leaderRow: 'flex items-center gap-1 mt-0.5',
  leaderName: `${MICRO_TYPO.meta} text-muted-foreground truncate`,

  /** 팀장 미지정 배지 — TEAM_CARD_TOKENS.noLeaderBadge의 compact 버전 */
  noLeaderBadge: [
    `inline-flex items-center gap-1 ${MICRO_TYPO.badge} font-medium`,
    'text-brand-warning',
    'bg-brand-warning/10',
    'border border-brand-warning/20',
    'px-1.5 py-0.5 rounded-full',
  ].join(' '),

  kpiGroup: 'flex items-center gap-2.5 flex-shrink-0',
  kpiChip: `flex items-center gap-1 ${MICRO_TYPO.meta} text-muted-foreground`,
  kpiNum: 'font-mono font-semibold text-foreground tabular-nums',

  divider: 'h-px bg-border mx-3.5',

  /** compact row stagger — STAGGER SSOT 참조 */
  staggerSlideUp: STAGGER.slideUp,

  /** 테이블 행 stagger — STAGGER SSOT 참조 */
  staggerFade: STAGGER.fade,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 분류 필터 pill (TeamListContent — 상단 필터바)
// ─────────────────────────────────────────────────────────────────────────────

export const CLS_PILL_TOKENS = {
  pill: [
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
    /** MICRO_TYPO.meta(text-xs-tight = 11px): pill은 본문보다 작지만 text-2xs(10px)보다 큼 — 터치 가독성 확보 */
    `${MICRO_TYPO.meta} font-medium cursor-pointer border`,
    'bg-muted/70 border-transparent text-muted-foreground',
    'hover:bg-muted hover:text-foreground',
    TRANSITION_PRESETS.fastColor,
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
  ].join(' '),

  pillActive: 'bg-foreground border-foreground text-background hover:bg-foreground/90',

  dot: 'w-[6px] h-[6px] rounded-full flex-shrink-0',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 팀원 역할 그룹 (TeamMemberList)
// ─────────────────────────────────────────────────────────────────────────────

export const TEAM_MEMBER_GROUP_TOKENS = {
  groupHeader: ['flex items-center gap-2', 'py-2 px-1', 'border-b border-border/50', 'mb-1'].join(
    ' '
  ),

  groupBadge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',

  groupCount: 'text-xs text-muted-foreground font-mono tabular-nums ml-auto',

  memberRow: [
    'flex items-center gap-3 px-2 py-2.5 rounded-lg',
    'hover:bg-muted/50',
    TRANSITION_PRESETS.fastColor,
    'cursor-pointer',
  ].join(' '),

  /** member row stagger — STAGGER SSOT 참조 (fade only, 원본 동작 보존) */
  staggerFade: STAGGER.fade,

  avatar: [
    'h-9 w-9 rounded-full flex items-center justify-center',
    `flex-shrink-0 font-semibold ${MICRO_TYPO.detail}`,
  ].join(' '),

  memberInfo: 'flex-1 min-w-0',
  memberName: 'text-sm font-medium truncate leading-tight',
  memberSub: `${MICRO_TYPO.meta} text-muted-foreground truncate mt-0.5`,
} as const;
