/**
 * Feedback Pending Tokens — SSOT
 *
 * Navigation pending / Action pending / Skeleton placeholder / Spinner / Progress bar
 * 진행 신호 전용 design token.
 *
 * **scope 분리**:
 * - 본 파일: navigation/action 진행 신호 (시간 축에서의 "현재 처리 중" 표현)
 * - `visual-feedback.ts`: 비즈니스 긴급도 신호 (count/time/status → urgency level → scale/ring/pulse)
 *
 * 두 시스템은 **명명/역할 모두 분리**됨. 호출자는 상황에 맞는 한쪽만 선택.
 *
 * 기존 토큰 재사용:
 * - 색상: `var(--color-brand-progress)` (globals.css `@theme inline` 이미 정의)
 * - keyframe: `@keyframes progress-indeterminate` (globals.css 이미 정의, line ~285)
 * - Tailwind 유틸: `motion-safe:animate-pulse` (Skeleton 기본 애니메이션, 이미 사용됨)
 *
 * 신규 추가:
 * - `progress-pulse` keyframe (reduced-motion fallback) — globals.css에 추가
 * - z-index 토큰 (`--z-progress` 등) — globals.css에 추가
 *
 * @see lib/design-tokens/visual-feedback.ts (urgency 시스템 — 다른 책임)
 * @see styles/globals.css (CSS vars + keyframes)
 */

/**
 * Pending indicator dimensions
 *
 * Tailwind primitive 직접 사용 (raw px 금지)
 */
export const PENDING_DIMENSIONS = {
  /** L1 NavLink dot — 사이드바 우측 4px dot */
  dotSm: 'size-1', // 0.25rem = 4px
  /** L1 NavLink dot — 좀 더 큰 변형 (모바일) */
  dotMd: 'size-1.5', // 0.375rem = 6px
  /** L1 NavLink border — 모바일 좌측 강조 */
  borderL: 'border-l-2',
  /** L3 GlobalProgressBar 높이 */
  progressBarH: 'h-0.5', // 0.125rem = 2px
  /** L4ext Progress (Radix) 높이 — Upload/Export/Bulk */
  progressMd: 'h-2', // 0.5rem = 8px
} as const;

/**
 * Spinner sizes — sr-only 텍스트는 호출자가 i18n 키로 주입
 *
 * SVG는 Spinner 컴포넌트 내부에 inline (외부 lib 금지 — Loader2 from lucide 사용 안 함)
 */
export const SPINNER_SIZES = {
  sm: 'size-3.5', // 0.875rem = 14px
  md: 'size-4', // 1rem = 16px
  lg: 'size-5', // 1.25rem = 20px
} as const;

export type SpinnerSize = keyof typeof SPINNER_SIZES;

/**
 * Pending color tokens — 모두 brand semantic 재사용
 *
 * dark mode 자동 전환은 `--brand-color-progress` HSL var가 :root/.dark 양쪽 정의되어 처리됨.
 * `dark:` prefix 사용 금지 (CSS var 자동 전환 체계 준수).
 */
export const PENDING_COLORS = {
  /** L1 dot, L3 progress bar — brand-progress semantic 재사용 */
  indicator: 'bg-brand-progress',
  /** L1 NavLink active border 강조 */
  border: 'border-brand-progress',
  /** L4 Spinner — currentColor (텍스트 색 자동 follow) */
  spinnerFg: 'text-current',
  /** L5 Skeleton 배경 — 기존 `bg-primary/10` 패턴 보존 (semantic) */
  skeletonBg: 'bg-primary/10',
} as const;

/**
 * Pending z-index — globals.css `:root`에 신규 CSS var로 추가됨
 */
export const PENDING_Z_INDEX = {
  /** L3 GlobalProgressBar — 헤더보다 위, toast 아래 */
  progressBar: 'z-[60]',
  /** L0 Connection banner — progress bar와 같은 레이어 */
  connectionBanner: 'z-[60]',
  /** sonner toast 기본 z-index (참고용, sonner 기본값 100000) */
  toastReference: 'z-[100000]',
} as const;

/**
 * Animation utilities
 *
 * - indeterminate: 기존 globals.css `@keyframes progress-indeterminate` 재사용
 *   → Tailwind v4 `@theme inline`에 정의된 utility class 사용 가능 여부는 globals.css 확인 후 결정.
 *   → 미정의 시 호출자에서 `style={{ animation: '...' }}` 또는 globals.css에 utility 추가
 * - pulse (reduce-motion fallback): 신규 `@keyframes progress-pulse` (globals.css 추가)
 */
export const PENDING_ANIMATIONS = {
  /** L3 GlobalProgressBar — motion-safe 환경 */
  progressIndeterminate: 'motion-safe:animate-[progress-indeterminate_1.2s_ease-in-out_infinite]',
  /** L3 GlobalProgressBar — reduced-motion 환경 (opacity pulse) */
  progressPulse: 'motion-reduce:animate-[progress-pulse_1.5s_ease-in-out_infinite]',
  /** L1 dot opacity fade (motion-reduce friendly) */
  dotPulse: 'motion-safe:animate-pulse motion-reduce:opacity-100',
  /** L4 Spinner SVG rotation */
  spin: 'motion-safe:animate-spin motion-reduce:opacity-70',
  /** L5 Skeleton 기본 (이미 Skeleton 컴포넌트에서 사용 중) */
  skeleton: 'motion-safe:animate-pulse motion-reduce:opacity-60',
} as const;

/**
 * Reduced motion 정책
 *
 * `prefers-reduced-motion: reduce` 시 spin/translate → opacity 변화로 대체.
 * Tailwind `motion-safe:` / `motion-reduce:` prefix로 자동 처리.
 *
 * 단, *정적 색 변화*는 항상 유지 — pending 신호가 사라지면 안 됨.
 */
export const REDUCED_MOTION_POLICY = {
  description:
    'spin/translateX/scale → opacity fade로 대체. 색·아이콘은 유지. NavLink dot은 항상 visible.',
} as const;
