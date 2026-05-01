/**
 * Inspection Template Component Tokens (Layer 3: Component-Specific)
 *
 * UL-QP-18-03/05 Build-Once Workflow — Phase 1B-D/E/F 시각 SSOT.
 *
 * 영역:
 * - DialogHeader version badge (1B-D): "📋 v3 · 2026-05-01 · 김철수"
 * - SoftFork diff visualization (1B-E): added/removed/type-changed 색
 * - Gallery card grid (1B-F): blank-start + matched cards + match-reason chip
 *
 * SSOT 원칙:
 * - 모든 색상은 brand semantic token (`bg-brand-*`, `text-brand-*`)만 사용 — Tailwind 임의 색 금지
 * - 모든 typography는 MICRO_TYPO 또는 TYPOGRAPHY_TOKENS 경유
 * - cn() 합성은 호출자에서 처리 (이 파일은 *문자열 토큰* 제공)
 */

import { FOCUS_TOKENS, MICRO_TYPO } from '../semantic';
import { TRANSITION_PRESETS } from '../motion';

// ============================================================================
// 1. VERSION BADGE — DialogHeader (Phase 1B-D)
// ============================================================================

/**
 * DialogHeader version badge — "📋 v{N} · {createdAt} · {createdByName}".
 *
 * 시각:
 * - 작은 inline-flex chip — DialogTitle 우측 또는 직하단 위치
 * - 색상: brand info (양식 통제 = 정보성 메타) — critical/warning 톤 회피
 * - 클릭 시 향후 history 모달 (S-3.3) — 현재는 정적 표시
 *
 * 접근성:
 * - aria-label에 SR text 명시 — "v3 양식, 2026-05-01 작성, 김철수" (호출자에서 i18n 조립)
 * - role="status" 불필요 (정적 메타) — 단순 정보 표시
 */
export const INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS = {
  /** Container — inline-flex chip */
  container: [
    'inline-flex items-center gap-1.5',
    'rounded-md',
    'px-2 py-0.5',
    'border border-brand-info/30',
    'bg-brand-info/10',
    'text-brand-info',
    MICRO_TYPO.label,
    TRANSITION_PRESETS.fastBgColorBorder,
  ].join(' '),

  /** Icon (📋 또는 lucide ClipboardList) */
  icon: 'h-3.5 w-3.5 shrink-0',

  /** Version number "v3" — semibold 강조 */
  version: 'font-semibold tabular-nums',

  /** Separator dot */
  separator: 'text-brand-info/50',

  /** createdAt + createdByName — regular weight */
  meta: 'text-brand-info/80',

  /** "양식 부재" fallback — template이 없을 때 (Gallery 권유 케이스) */
  missing: [
    'inline-flex items-center gap-1.5',
    'rounded-md',
    'px-2 py-0.5',
    'border border-dashed border-muted-foreground/30',
    'text-muted-foreground',
    MICRO_TYPO.label,
  ].join(' '),
} as const;

// ============================================================================
// 2. DIFF VISUALIZATION — SoftForkDialog (Phase 1B-E)
// ============================================================================

/**
 * Structure diff 시각 — added / removed / type-changed.
 *
 * SoftForkDialog의 "변경 사항 요약" 섹션 + 자세히 보기.
 * 호출자: SoftForkDialog component (Phase 1B-E).
 */
export const INSPECTION_TEMPLATE_DIFF_TOKENS = {
  /** 추가됨 — green (positive change) */
  added: {
    badge: 'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 bg-brand-ok/10 text-brand-ok',
    text: 'text-brand-ok',
    icon: 'h-3 w-3',
  },
  /** 삭제됨 — red (destructive) */
  removed: {
    badge:
      'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 bg-brand-critical/10 text-brand-critical',
    text: 'text-brand-critical',
    icon: 'h-3 w-3',
  },
  /** 변경됨 — yellow (caution) */
  changed: {
    badge:
      'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 bg-brand-warning/15 text-brand-warning',
    text: 'text-brand-warning',
    icon: 'h-3 w-3',
  },
  /** Diff 요약 컨테이너 — 3 chip 가로 정렬 */
  summary: 'flex items-center gap-2 flex-wrap',
  /** Diff 자세히 보기 토글 컨테이너 — 접힘/펼침 */
  detailContainer: 'mt-3 rounded-md border bg-muted/30 p-3',
  /** Diff 항목 row */
  detailRow: 'flex items-start gap-2 py-1 text-sm',
} as const;

// ============================================================================
// 3. SOFTFORK RADIO GROUP — SoftForkDialog (Phase 1B-E)
// ============================================================================

/**
 * SoftForkDialog의 3-radio (this_only / apply_forward / cancel).
 *
 * a11y:
 * - role="radiogroup" + aria-labelledby (호출자가 dialog title id 전달)
 * - 키보드 화살표 네비게이션은 RadioGroup 컴포넌트가 자동 제공
 * - focus-visible은 FOCUS_TOKENS 사용
 */
export const INSPECTION_TEMPLATE_FORK_RADIO_TOKENS = {
  /** 라디오 옵션 카드 — 클릭 영역 */
  optionCard: [
    'relative flex items-start gap-3 rounded-md border p-3 cursor-pointer',
    'border-border bg-card',
    'hover:border-brand-info/50 hover:bg-brand-info/5',
    'data-[state=checked]:border-brand-info data-[state=checked]:bg-brand-info/10',
    TRANSITION_PRESETS.fastBgColorBorder,
    FOCUS_TOKENS.classes.default,
  ].join(' '),

  /** 옵션 헤더 (제목 + 라벨) */
  optionHeader: 'flex items-center gap-2',

  /** 옵션 제목 (라벨) */
  optionTitle: 'font-medium text-foreground',

  /** 옵션 설명 (caption) */
  optionDescription: 'mt-1 text-sm text-muted-foreground',

  /** 선택된 옵션 강조 (체크 아이콘 컨테이너) */
  optionCheckmark: 'absolute right-3 top-3 text-brand-info',
} as const;

// ============================================================================
// 4. GALLERY CARD — TemplateGallery (Phase 1B-F)
// ============================================================================

/**
 * Gallery 카드 grid — 4-column responsive.
 *
 * 첫 카드: "빈 양식으로 시작" (blank start)
 * 나머지: 매칭된 template + 매칭 이유 chip
 */
export const INSPECTION_TEMPLATE_GALLERY_CARD_TOKENS = {
  /** Grid container — 1col mobile, 2col tablet, 4col desktop */
  grid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4',

  /** Standard 카드 (매칭 template) */
  card: [
    'group relative flex flex-col gap-2 rounded-lg border bg-card p-4',
    'border-border',
    'hover:border-brand-info/50 hover:bg-brand-info/5',
    'cursor-pointer',
    TRANSITION_PRESETS.fastBgColorBorder,
    FOCUS_TOKENS.classes.default,
  ].join(' '),

  /** Blank start 카드 — dashed border + neutral 톤 */
  blankCard: [
    'group relative flex flex-col items-center justify-center gap-2 rounded-lg p-4',
    'border-2 border-dashed border-muted-foreground/30 bg-card',
    'hover:border-brand-info/50 hover:bg-brand-info/5',
    'cursor-pointer',
    TRANSITION_PRESETS.fastBgColorBorder,
    FOCUS_TOKENS.classes.default,
  ].join(' '),

  /** 카드 제목 (장비명 또는 "빈 양식으로 시작") */
  cardTitle: 'font-medium text-foreground line-clamp-2',

  /** 매칭 이유 chip ("같은 모델" / "같은 분류 코드") */
  matchReasonChip: [
    'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5',
    'bg-brand-info/10 text-brand-info',
    MICRO_TYPO.label,
  ].join(' '),

  /** 카드 메타 (v{N} · createdAt) */
  cardMeta: 'text-xs text-muted-foreground tabular-nums',

  /** "다시 묻지 않기" checkbox row */
  skipCheckboxRow: 'flex items-center gap-2 mt-3 text-sm text-muted-foreground',
} as const;
