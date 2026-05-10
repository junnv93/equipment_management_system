# 스프린트 계약: sticky-header CSS 변수명 SSOT (+ callout-hero-shadow 흡수)

## 생성 시점
2026-05-10

## 배경

`.claude/skills/harness/references/example-prompts.md:328-364` "34차 후속 — wf20-infra-debt harness 결과 review-architecture tech debt" LOW 항목.

**tech-debt 문서 stale**: 추정 "3 곳"이지만 실측 결과 production 5 + e2e 1 + 주석 4. NCDetailClient.tsx:258이 4번째 production consumer → 트리거 조건 충족.

추가 발견: `--callout-hero-shadow`(GuidanceCallout 1곳)도 같은 SSOT에 흡수하면 시스템 전반 일관성 확보. 비용 미미 → 이번 sprint MUST 흡수.

## 설계 SSOT

### 위치
`apps/frontend/lib/design-tokens/css-variables.ts` (신설)

**근거**:
- frontend-only (e2e 포함, backend 미사용) → `packages/shared-constants` 부적절
- design-tokens 3-Layer 시스템 안에서 새 카테고리 — primitives.ts(px/ms 값)와 응집도 분리 (CSS var name은 키 식별자)
- index.ts barrel re-export로 단일 진입점

### API
```typescript
export const CSS_VAR_NAMES = {
  /** Sticky header offset (Producer: EquipmentDetailClient ResizeObserver). */
  stickyHeaderHeight: '--sticky-header-height',
  /** Callout hero shadow (Producer: GuidanceCallout inline style → semantic.ts callout-hero box-shadow). */
  calloutHeroShadow: '--callout-hero-shadow',
} as const satisfies Record<string, `--${string}`>;

export type CssVarName = (typeof CSS_VAR_NAMES)[keyof typeof CSS_VAR_NAMES];

/** `var(--name,fallback)` literal — Tailwind arbitrary value 안전 */
export function cssVar(name: CssVarName, fallback?: string): string;
```

**컴파일타임 강제**:
- `as const satisfies Record<string, '--${string}'>` → `--`-prefix 누락 시 컴파일 에러
- `cssVar()` accepts only `CssVarName` (타입 좁힘) → 임의 string 차단

### 마이그레이션 매트릭스

| 파일 | Before | After | 비고 |
|---|---|---|---|
| `EquipmentDetailClient.tsx:97,104` | `setProperty('--sticky-header-height', ...)` / `removeProperty('--sticky-header-height')` | `CSS_VAR_NAMES.stickyHeaderHeight` | producer (Web API 직접 호출) |
| `equipment.ts:779` (design-token) | `'top-[var(--sticky-header-height,0px)] ...'` | Step 4b 결정 따름 | JIT 정합 사전 실측 필요 |
| `bulk-action-bar.ts:13` | 동일 패턴 | 동일 | |
| `semantic.ts:521` (`stickyHeaderOffset`) | 동일 패턴 | 동일 | |
| `NCDetailClient.tsx:258` | `getPropertyValue('--sticky-header-height')` | `CSS_VAR_NAMES.stickyHeaderHeight` | runtime 동적 호출 (JIT 미관여) |
| `sticky-helpers.ts:35` (e2e) | 동일 | 동일 | runtime |
| `GuidanceCallout.tsx:72` | `['--callout-hero-shadow' as string]: ...` | `[CSS_VAR_NAMES.calloutHeroShadow]: ...` | inline style key |

### Tailwind JIT 정합 사전 실측 (Step 4b)

**리스크**: Tailwind v3 JIT은 정적 분석 기반. design-token 파일에서 `` `top-[${cssVar(...)}]` `` template literal 사용 시 JIT가 클래스를 인식 못 할 수 있음.

**검증 방법**: 마이그레이션 전 mini test
1. `equipment.ts`에 `cssVar(CSS_VAR_NAMES.stickyHeaderHeight)` template literal 적용
2. `pnpm --filter frontend build`
3. `.next/static/css/*.css`에서 `top-[var(--sticky-header-height,0px)]` 클래스 grep

**해법 분기**:
- **A) JIT 인식 OK**: 모든 design-token 파일도 `cssVar()` helper로 통일 (선호)
- **B) JIT 인식 NOK**: design-token 파일은 string literal 유지 (var name은 SSOT 일관성 깨지나 빌드 결정), runtime 코드(EquipmentDetailClient/NCDetailClient/sticky-helpers/GuidanceCallout)만 `CSS_VAR_NAMES` 마이그레이션 + design-token 파일에 `// SSOT: CSS_VAR_NAMES.stickyHeaderHeight (JIT static analysis)` 주석 + 동일 string 회귀 차단은 verify-hardcoding 화이트리스트로 처리

## 성공 기준

> **격리 정책 (iter 2 반영)**: 본 sprint 와 무관한 외부 병렬 세션 작업 (`hooks/use-keyboard-shortcuts.ts` 등 untracked 파일에서 발생한 tsc 에러)은 본 sprint MUST 평가에 영향 주지 않는다. 사용자 명시 정책: "다른 세션 작업 revert 하면안돼 우리 세션작업만 집중해". M-1/M-2 는 본 sprint 변경 파일 한정 회귀 0 으로 평가한다.

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] **M-1**: 본 sprint 변경 파일의 tsc 에러 0건. 검증 패턴:
  ```bash
  pnpm --filter frontend exec tsc --noEmit 2>&1 | \
    grep -E "(css-variables|EquipmentDetailClient|NCDetailClient|GuidanceCallout|sticky-helpers|design-tokens/(index|semantic|components/(equipment|bulk-action-bar))|verify-hardcoding)" \
    | head -20
  # 기대: 0 hit
  ```
  외부 세션 (`checkouts-sprint4-ux-u02-u08`, `large-component-refactor`) untracked 파일의 tsc 에러는 격리 — 본 sprint scope 외.
- [ ] **M-2**: `pnpm --filter frontend exec next build` Webpack 컴파일 단계 (`✓ Compiled successfully`) 성공. TypeScript type check 단계는 외부 세션 broken file 으로 차단될 수 있음 — type check 차단이 본 sprint 변경 파일 때문이 아니면 격리 PASS.
- [ ] **M-3**: SSOT 신설 — `apps/frontend/lib/design-tokens/css-variables.ts`에 `CSS_VAR_NAMES` + `cssVar()` 정의 + `as const satisfies Record<string, '--${string}'>` 적용
- [ ] **M-4**: barrel export — `apps/frontend/lib/design-tokens/index.ts`에서 `CSS_VAR_NAMES`, `cssVar`, `type CssVarName` re-export
- [ ] **M-5**: 하드코딩 0건 (production + e2e) —
  ```
  grep -rEn "['\"](--sticky-header-height|--callout-hero-shadow)['\"]" \
    apps/frontend --include='*.ts' --include='*.tsx' \
    --exclude-dir=.next --exclude-dir=node_modules
  ```
  결과: `apps/frontend/lib/design-tokens/css-variables.ts` 만 hit. design-token 파일 (`equipment.ts`/`bulk-action-bar.ts`/`semantic.ts`)이 해법 B 채택 시 추가 화이트리스트 — Step 4b 결정 후 contract 갱신
- [ ] **M-6**: producer 마이그레이션 — `EquipmentDetailClient.tsx:97,104` `setProperty/removeProperty` 인자가 `CSS_VAR_NAMES.stickyHeaderHeight` 참조
- [ ] **M-7**: runtime consumer 마이그레이션 — `NCDetailClient.tsx:258` + `sticky-helpers.ts:35` 가 `CSS_VAR_NAMES.stickyHeaderHeight` 참조
- [ ] **M-8**: callout-hero-shadow 마이그레이션 — `GuidanceCallout.tsx:72` 가 `CSS_VAR_NAMES.calloutHeroShadow` 참조 (`as string` cast 제거)
- [ ] **M-9**: design-token consumer 마이그레이션 (Step 4b 결정 따름) — 해법 A: 3 파일이 `cssVar(CSS_VAR_NAMES.stickyHeaderHeight)` template literal 사용 / 해법 B: 동일 string literal 유지하되 SSOT 참조 주석 추가
- [ ] **M-10**: Tailwind JIT 빌드 검증 — `.next/static/css/*.css` 또는 `apps/frontend/.next/server/app/**/*.css` 에서 `top-\[var\(--sticky-header-height,0px\)\]` 클래스 존재 grep 1+ hit (해법 무관 기존 동작 회귀 0)
- [ ] **M-11**: verify-hardcoding skill 갱신 — `.claude/skills/verify-hardcoding/SKILL.md` 에 CSS custom property literal 회귀 차단 Step 추가 + 화이트리스트 명시
- [ ] **M-12**: 기존 frontend test suite 회귀 0 — `pnpm --filter frontend run test` (있는 경우)

### 권장 (SHOULD) — 실패 시 tech-debt 기록, 루프 차단 없음

- [ ] **S-1**: design-tokens README.md 갱신 — `apps/frontend/lib/design-tokens/README.md` 에 CSS_VAR_NAMES 사용 안내 (producer/consumer 패턴 + helper)
- [ ] **S-2**: review-architecture Critical 이슈 0건
- [ ] **S-3**: 자기검토 라운드 #2 발견 사항 — contract 명시적 제외 항목 누락 / 추가 mirror / SSOT 우회 cast (예: `as string` 인라인) 검토 완료
- [ ] **S-4**: 다른 CSS custom property가 추가로 발견되면 (예: `--z-sticky` bulk-action-bar.ts:13) tech-debt-tracker.md 분리 등록 (이번 sprint scope 외)

### 적용 verify 스킬

- `verify-hardcoding` (Step 추가 후 셀프 검증)
- `verify-design-tokens` (design-token 파일 변경 — index.ts barrel + 신규 export 등록)
- `verify-implementation` (전체 워크플로 — 변경 파일 자동 매핑)

---

### contract grep 패턴 작성 규칙

본 sprint는 **단일 토큰 카운트 + AND 조합** 적용:

| 검증 | 패턴 |
|---|---|
| 하드코딩 0건 (M-5) | `grep -rEn "['\"](--sticky-header-height\|--callout-hero-shadow)['\"]" apps/frontend --include='*.ts' --include='*.tsx' --exclude-dir=.next --exclude-dir=node_modules` 결과 화이트리스트 외 0 |
| SSOT 정의 (M-3) | `grep -c "stickyHeaderHeight: '--sticky-header-height'" apps/frontend/lib/design-tokens/css-variables.ts ≥ 1` AND `grep -c "calloutHeroShadow: '--callout-hero-shadow'" apps/frontend/lib/design-tokens/css-variables.ts ≥ 1` AND `grep -c "as const satisfies Record<string, " apps/frontend/lib/design-tokens/css-variables.ts ≥ 1` |
| barrel export (M-4) | `grep -c "CSS_VAR_NAMES" apps/frontend/lib/design-tokens/index.ts ≥ 1` AND `grep -c "cssVar" apps/frontend/lib/design-tokens/index.ts ≥ 1` AND `grep -c "type CssVarName" apps/frontend/lib/design-tokens/index.ts ≥ 1` |
| producer 마이그레이션 (M-6) | `grep -c "CSS_VAR_NAMES.stickyHeaderHeight" apps/frontend/components/equipment/EquipmentDetailClient.tsx ≥ 2` (setProperty + removeProperty) |
| runtime consumer (M-7) | `grep -c "CSS_VAR_NAMES.stickyHeaderHeight" apps/frontend/components/non-conformances/NCDetailClient.tsx ≥ 1` AND `grep -c "CSS_VAR_NAMES.stickyHeaderHeight" apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts ≥ 1` |
| callout-hero-shadow (M-8) | `grep -c "CSS_VAR_NAMES.calloutHeroShadow" apps/frontend/components/non-conformances/GuidanceCallout.tsx ≥ 1` AND `grep -c "as string" apps/frontend/components/non-conformances/GuidanceCallout.tsx == 0` (cast 제거 확인 — 해당 파일 한정) |
| Tailwind JIT (M-10) | `find apps/frontend/.next -name "*.css" 2>/dev/null \| xargs grep -l "var(--sticky-header-height,0px)" 2>/dev/null \| wc -l ≥ 1` (CSS value 기반 — Tailwind v4 escape 무관) |
| verify-hardcoding 갱신 (M-11) | `grep -c "css-variables.ts\|CSS_VAR_NAMES\|--sticky-header-height" .claude/skills/verify-hardcoding/SKILL.md ≥ 2` |

---

## 옛날 API 우려 점검 (사용자 명시)

| API | 상태 | 근거 |
|---|---|---|
| `style.setProperty/removeProperty/getPropertyValue` | ✅ 표준 | CSSOM standard, deprecation 0 |
| Tailwind v3 `top-[<expr>]` arbitrary value | ✅ 표준 | v3 정식 기능, v4도 호환 |
| `useEffect` + ResizeObserver | ✅ 표준 | React 19 변경 0 |
| Next.js 16 CSS 처리 | ✅ 표준 | App Router CSS 변경 0 |
| `as const satisfies` (TS 4.9+) | ✅ 표준 | TS 5.x 정식 |

## 종료 조건
- MUST 12개 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입)
- 3회 반복 초과 → 수동 개입
- SHOULD 실패는 종료 조건 영향 없음 — tech-debt-tracker.md 등록

## 브랜치 정책
사용자 메모리 [Main 직접 작업, 브랜치 금지 — 35차 결정] 적용. main 직접 commit. SessionStart hook NOTE는 default 가이드라인이며 사용자 결정 우선.
