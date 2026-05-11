/**
 * CSS Custom Property Names — SSOT
 *
 * 코드베이스 전체에서 참조되는 CSS custom property (`--foo`) 이름의 단일 진입점.
 * Producer(`element.style.setProperty(name, value)`) / Consumer(`var(name)`,
 * `getComputedStyle().getPropertyValue(name)`) 양쪽이 같은 식별자를 참조하도록 강제하여,
 * 1글자 오타가 silent 0px / undefined 값을 유발하는 회귀를 차단한다.
 *
 * **scope**:
 * - 본 파일: TypeScript/runtime 에서 참조되는 CSS variable name (string identifier)
 * - `primitives.ts`: 디자인 토큰 원시값 (px / ms / hex / weight)
 * - `globals.css`: 동일 이름의 `:root` 정의 (토큰 SSOT는 본 파일, CSS 정의는 styles)
 *
 * **회귀 차단**:
 * - `as const satisfies Record<string, '--${string}'>` — `--` prefix 누락 시 컴파일 에러
 * - `cssVar()` helper 는 `CssVarName` 만 받음 — 임의 string 차단
 * - `verify-hardcoding` skill — `.ts`/`.tsx` 에서 `'--foo'` 리터럴 사용을 화이트리스트 외 차단
 *
 * **Tailwind v4 JIT 제약 (해법 B 채택)**:
 * Tailwind v4.2 의 정적 분석은 `top-[var(--name,0)]` string literal 은 추출하지만,
 * `` `top-[${cssVar(name)}]` `` template literal interpolation 은 추출하지 못한다 (값이 런타임 결정).
 * 따라서 design-token 파일 (`components/equipment.ts`, `components/bulk-action-bar.ts`,
 * `semantic.ts`) 의 Tailwind class 문자열은 본 SSOT 를 import 하지 않고 string literal 을 유지하며,
 * 위치마다 `// SSOT: CSS_VAR_NAMES.{key}` 주석으로 참조를 명시한다 (verify-hardcoding 화이트리스트).
 * runtime 코드 (setProperty / getPropertyValue / inline style key) 는 본 SSOT 를 직접 사용한다.
 *
 * @see lib/design-tokens/primitives.ts (px / ms 원시값 토큰)
 * @see styles/globals.css (`:root` CSS variable 실제 정의)
 * @see .claude/skills/verify-hardcoding/SKILL.md (회귀 차단 룰)
 */

/**
 * Code-level identifiers for CSS custom properties.
 *
 * 새 CSS variable 을 코드에서 참조해야 할 때:
 * 1. 본 객체에 `camelCaseKey: '--kebab-name'` entry 추가
 * 2. `globals.css` `:root` 또는 `:root.dark` 에 동일 이름 정의 (없으면 fallback 동작)
 * 3. Producer / Consumer 가 `CSS_VAR_NAMES.camelCaseKey` 로 참조
 *
 * 위치 패턴:
 * - **Producer** (값 설정): `EquipmentDetailClient` 가 ResizeObserver 로 sticky header 높이 측정 →
 *   `document.documentElement.style.setProperty(CSS_VAR_NAMES.stickyHeaderHeight, ...)`
 * - **Consumer (Tailwind utility)**: design-token 파일이 `top-[var(--sticky-header-height,0px)]`
 *   string literal 을 노출 (JIT 정적 분석 요구 — 해법 B)
 * - **Consumer (runtime)**: `getComputedStyle(...).getPropertyValue(CSS_VAR_NAMES.stickyHeaderHeight)`
 * - **Consumer (inline style)**: `style={{ [CSS_VAR_NAMES.calloutHeroShadow]: '...' }}`
 */
export const CSS_VAR_NAMES = {
  /**
   * Sticky tab/filter header offset.
   *
   * Producer: `EquipmentDetailClient` ResizeObserver — 장비 상세 헤더 실제 높이 측정 후 `:root` 에 설정
   * Consumers (utility):
   *   - `EQUIPMENT_TAB_UNDERLINE_TOKENS.container` (탭 바 sticky)
   *   - `BULK_ACTION_BAR_TOKENS.container` (대량 액션 바 sticky)
   *   - `LAYOUT_TOKENS.stickyHeaderOffset` (필터 sticky)
   * Consumers (runtime):
   *   - `NCDetailClient` 부적합 상세 collapsible 스크롤 보정
   *   - `tests/e2e/shared/helpers/sticky-helpers.ts` E2E 헬퍼
   * Fallback: `0px` (헤더 미장착 시점 / 다른 라우트에서는 0)
   */
  stickyHeaderHeight: '--sticky-header-height',

  /**
   * Callout hero variant shadow color.
   *
   * Producer: `GuidanceCallout` (variant 별 brand color → color-mix 30% transparent)
   * Consumer (Tailwind utility): `CALLOUT_TOKENS.heroShadow` 또는 box-shadow 직접 적용
   *   (현재 `semantic.ts:691` JSDoc 안내 — 호출부 inline style)
   * Fallback: 미설정 시 box-shadow 적용 안 됨 (visually no-op)
   */
  calloutHeroShadow: '--callout-hero-shadow',

  // ============================================================================
  // 4-tier status color SSOT (qr-visual-redesign TASK 8 / 2026-05-11)
  //
  // brand-ok / brand-warning / brand-critical 외 2 톤 신설:
  //  - brand-urgent: confirm_handover_* (P=115/110), non_conforming, out_of_service
  //  - brand-mute:   spare / inactive / disposed (운영 외 장비)
  // 각 톤은 base + weak (soft tint 배경) 2 변형.
  // ============================================================================

  brandUrgent: '--brand-urgent',
  brandUrgentWeak: '--brand-urgent-weak',
  brandMute: '--brand-mute',
  brandMuteWeak: '--brand-mute-weak',

  // ============================================================================
  // Touch target + mobile typography ramp (qr-visual-redesign TASK 8)
  // ============================================================================

  /** 최소 터치 타깃 (Material baseline = 48px). 2026-05-11 raised 44→48px. */
  touchTargetMin: '--touch-target-min',
  /** 장갑 시나리오 터치 타깃 (opt-in, 56px). */
  touchTargetGlove: '--touch-target-glove',
  /** 모바일 1차 정보 size (18px) — 장비명/CTA 라벨/현황 핵심. */
  text1Mobile: '--text-1-mobile',
  /** 모바일 2차 정보 size (14px) — KV 값, 설명. */
  text2Mobile: '--text-2-mobile',
  /** Mono 텍스트 size (13px) — `.text-mono` 클래스 진입점. */
  textMono: '--text-mono',
} as const satisfies Record<string, `--${string}`>;

/**
 * Union of all registered CSS variable names ('--foo' 형식).
 *
 * 임의 string 을 `cssVar()` 에 전달하지 못하도록 좁혀진 타입.
 * 신규 entry 추가 시 자동으로 union 확장.
 */
export type CssVarName = (typeof CSS_VAR_NAMES)[keyof typeof CSS_VAR_NAMES];

/**
 * Render `var(--name, fallback)` literal — Tailwind arbitrary value 또는 inline style 안전.
 *
 * 사용 예 (runtime 만 — design-token 파일은 JIT 정적 분석 요구로 string literal 유지):
 * ```ts
 * element.style.boxShadow = `0 0 24px ${cssVar(CSS_VAR_NAMES.calloutHeroShadow)}`;
 * ```
 *
 * @param name - CSS variable name (must be registered in `CSS_VAR_NAMES`)
 * @param fallback - 미설정 시 fallback 값 (CSS valid value, 예: `'0px'`, `'transparent'`)
 * @returns `var(--name, fallback)` 또는 `var(--name)` literal
 */
export function cssVar(name: CssVarName, fallback?: string): string {
  return fallback === undefined ? `var(${name})` : `var(${name},${fallback})`;
}
