# Evaluation Report: sticky-header CSS 변수명 SSOT (+ callout-hero-shadow 흡수)

## 반복 #1 (2026-05-10T09:10:00+09:00)

---

## 계약 기준 대조 (MUST 12)

| 기준 | 판정 | 상세 |
|------|------|------|
| M-1: `tsc --noEmit` 에러 0 | **FAIL** | `hooks/use-keyboard-shortcuts.ts:19,51` — 외부 세션(checkouts-sprint4-ux-u02-u08) 의 미추적(untracked) 파일. `TS2339: Property 'modifiers'` / `'allowInInput'` does not exist. 본 sprint 변경 파일에는 tsc 에러 0건. |
| M-2: `pnpm --filter frontend run build` 성공 | **FAIL** | M-1 tsc 에러로 인해 Next.js TypeScript 검사 단계에서 `Failed to type check` → build worker exit code 1. 컴파일 자체는 24.4s 내 `✓ Compiled successfully` — TypeScript 체크만 실패. 외부 세션 원인. |
| M-3: SSOT 신설 (`css-variables.ts`) | **PASS** | `stickyHeaderHeight` ≥ 1, `calloutHeroShadow` ≥ 1, `as const satisfies Record<string, ` ≥ 2. `cssVar()` helper 정의 확인. `--${string}` template literal 타입 제약 확인. |
| M-4: barrel export (`index.ts`) | **PASS** | `CSS_VAR_NAMES` count=1, `cssVar` count=1, `type CssVarName` count=1. `export { CSS_VAR_NAMES, cssVar, type CssVarName } from './css-variables'` 라인 46 확인. |
| M-5: 하드코딩 0건 | **PASS** | `grep -rEn "['\"](--sticky-header-height\|--callout-hero-shadow)['\"]"` → `css-variables.ts:62,72` 만 hit (SSOT 정의 자체 — 화이트리스트). 화이트리스트 외 0건. design-token 파일은 `var(...)` 형식이므로 패턴 미매칭 (정상). |
| M-6: producer 마이그레이션 (`EquipmentDetailClient.tsx`) | **PASS** | `CSS_VAR_NAMES.stickyHeaderHeight` count=3 (≥2). `setProperty` 인자 line 99, `removeProperty` 인자 line 106, SSOT 주석 line 92. |
| M-7: runtime consumer 마이그레이션 | **PASS** | `NCDetailClient.tsx` `CSS_VAR_NAMES.stickyHeaderHeight` count=1 (line 138). `sticky-helpers.ts` `CSS_VAR_NAMES.stickyHeaderHeight` count=1 (line 42 `page.evaluate` 인자). |
| M-8: callout-hero-shadow 마이그레이션 | **PASS** | `GuidanceCallout.tsx` `CSS_VAR_NAMES.calloutHeroShadow` count=2 (≥1). `as string` count=0 (cast 제거 확인). |
| M-9: design-token consumer 마이그레이션 (해법 B) | **PASS** | 3 파일 모두 string literal 유지 + `// SSOT: CSS_VAR_NAMES.*` 주석 확인. `equipment.ts:775,782`, `bulk-action-bar.ts:13,19`, `semantic.ts:522,525` (stickyHeaderHeight) + `semantic.ts:695,710` (calloutHeroShadow). |
| M-10: Tailwind JIT 빌드 검증 | **PASS*** | **실질 PASS, 계약 grep 패턴 결함.** 컴파일된 CSS 파일 `.next/static/chunks/11glcee99y2qo.css` 에 `.top-\[var\(--sticky-header-height\,0px\)\]{top:var(--sticky-header-height,0px)}` 존재 확인 (직접 검사). 단, 계약 명시 grep 패턴 `grep -l "top-\[var(--sticky-header-height,0px)\]"` 는 CSS의 backslash escape 를 고려하지 않아 0건 반환. |
| M-11: verify-hardcoding skill 갱신 | **PASS** | `grep -c "css-variables.ts\|CSS_VAR_NAMES\|--sticky-header-height" SKILL.md` = 22 (≥2). Step 36 섹션 확인. Rule A/B/C/D 모두 정의됨. Step 36 셀프 실행: Rule A=0건, Rule B=0건, Rule C=9+2, Rule D=1+1. |
| M-12: 기존 frontend test suite 회귀 0 | **PASS** | `pnpm --filter frontend run test` → 80 suites PASS, 700 tests PASS. 회귀 0건. |

---

## SHOULD 기준 대조 (루프 차단 없음)

| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| S-1: design-tokens README.md 갱신 | **PASS** | `README.md:142` "### CSS Variable Names SSOT (`css-variables.ts`)" 섹션 존재. producer/consumer 패턴, 해법 B 설명, 신규 추가 절차 포함. |
| S-2: review-architecture Critical 이슈 0건 | **SKIP** | review-architecture 미실행 (M-1/M-2 FAIL로 루프 재진입 우선). |
| S-3: 자기검토 라운드 #2 발견 사항 | **SKIP** | 동일 이유. |
| S-4: 추가 CSS variable tech-debt 등록 | **미확인** | `--z-sticky` bulk-action-bar.ts:13 에 존재 확인 (`z-[var(--z-sticky,20)]`). tech-debt-tracker.md 등록 여부는 별도 확인 필요. |

---

## 외부 세션 충돌 사항

**충돌 출처**: `checkouts-sprint4-ux-u02-u08` 스프린트 (병렬 세션)

**충돌 파일** (모두 untracked / git status `??`):
- `apps/frontend/hooks/use-keyboard-shortcuts.ts` — tsc 에러 2건 원인
- `apps/frontend/components/checkouts/KeyboardShortcutsProvider.tsx`
- `apps/frontend/components/checkouts/KeyboardShortcutsCheatsheet.tsx`
- `apps/frontend/contexts/KeyboardShortcutsContext.tsx`
- `apps/frontend/hooks/use-keyboard-shortcuts-scope.ts`
- `apps/frontend/lib/constants/keyboard-shortcuts.ts`

**tsc 에러 내용**:
```
hooks/use-keyboard-shortcuts.ts(19,20): error TS2339: Property 'modifiers' does not exist ...
hooks/use-keyboard-shortcuts.ts(51,36): error TS2339: Property 'allowInInput' does not exist ...
```

**본 sprint 파일의 tsc 에러**: 0건 — 모든 에러는 외부 세션 파일에서만 발생.

**task 지시문 범위**: task 지시문은 `apps/frontend/components/non-conformances/sections/*.tsx` 를 out-of-scope 예시로 명시했으나, 실제 에러는 `hooks/` 디렉토리의 외부 세션 파일. 동일 원칙(병렬 세션 충돌) 적용.

---

## 전체 판정: **FAIL** (MUST 2건 미달 — M-1, M-2)

**원인**: 외부 병렬 세션(`checkouts-sprint4-ux-u02-u08`) 의 untracked 파일이 tsc 에러를 유발.
**본 sprint 코드 품질**: M-1/M-2 제외 10개 기준 모두 PASS. sprint 자체 변경 파일의 tsc 에러 0건.

---

## 수정 지시 (FAIL 항목)

### 이슈 1: 외부 세션 tsc 에러로 M-1 / M-2 FAIL

- **파일**: `apps/frontend/hooks/use-keyboard-shortcuts.ts` (untracked, 외부 세션)
- **문제**: `KEYBOARD_SHORTCUTS` 상수 타입에 `modifiers`, `allowInInput` 프로퍼티가 없음. `apps/frontend/lib/constants/keyboard-shortcuts.ts` 의 타입 정의와 `use-keyboard-shortcuts.ts` 의 사용 코드가 불일치.
- **수정**: 본 sprint 책임 범위 아님. **외부 세션(`checkouts-sprint4-ux-u02-u08`)이 tsc 에러를 해소해야 함.** 조치 옵션:
  - (A) 외부 세션이 `KEYBOARD_SHORTCUTS` 타입에 `modifiers?: string[]` / `allowInInput?: boolean` 추가하거나
  - (B) 외부 세션이 `use-keyboard-shortcuts.ts` 에서 optional chaining 으로 수정
  - (C) 외부 세션 파일이 tsc 에러 없이 완성될 때까지 `use-keyboard-shortcuts.ts` 를 working tree 에서 제거
- **검증**: `pnpm --filter frontend exec tsc --noEmit` 에러 0건 → M-1 PASS → M-2 (`pnpm --filter frontend run build`) 재실행.

### 이슈 2: M-10 계약 grep 패턴 결함 (참고 — sprint 재작업 불필요)

- **파일**: `.claude/contracts/sticky-header-css-var-ssot.md` (계약 문서)
- **문제**: M-10 grep 패턴 `grep -l "top-\[var(--sticky-header-height,0px)\]"` 는 CSS backslash escape (`\[`, `\(`, `\,`) 를 고려하지 않아 실제 컴파일된 CSS에서 0건 반환. 실제 CSS 파일에는 클래스가 존재함 (직접 확인).
- **수정**: 계약 갱신 시 다음 패턴으로 교체 권장:
  ```bash
  # 방법 1: CSS value 기반 검사 (escape 문제 없음)
  find apps/frontend/.next -name "*.css" 2>/dev/null | xargs grep -l "var(--sticky-header-height,0px)" 2>/dev/null | wc -l
  # 방법 2: Python 등 literal search 도구
  ```
- **검증**: `grep -l "var(--sticky-header-height,0px)"` → 1건 이상. 현재 이미 만족.

---

## 상세 grep 실행 결과 (Step 36 셀프 테스트)

```
Rule A (화이트리스트 외 '--name' literal): 0 hit ✓
Rule B (design-token 외부 var(--foo) 사용): 0 hit ✓  
  SSOT_VARS = --sticky-header-height|--callout-hero-shadow
Rule C (SSOT 정의 존재): CSS_VAR_NAMES count=9 ✓, as const satisfies count=2 ✓
Rule D (barrel export): CSS_VAR_NAMES count=1 ✓, cssVar count=1 ✓
```

## 건강 지표

| 항목 | 값 |
|------|---|
| 변경 파일 (sprint scope) | 11개 (css-variables.ts 신설 + index.ts + README.md + 3 design-token + 4 component + SKILL.md) |
| 신규 tsc 에러 (sprint 파일) | 0건 |
| 기존 tsc 에러 (외부 세션) | 2건 (`hooks/use-keyboard-shortcuts.ts`) |
| 테스트 결과 | 80 suites / 700 tests PASS |
| 하드코딩 잔존 (production) | 0건 |
| CSS JIT 컴파일 확인 | 1 CSS 파일에 클래스 존재 |

---

## 반복 #2 (2026-05-10T10:30:00+09:00)

### 격리 정책 적용 결과

| 기준 | 이전 (iter 1) | 현재 (iter 2) | 동일 이슈 연속? |
|------|---------------|---------------|----------------|
| M-1 | FAIL (전체 tsc 2건 에러 — 외부 세션) | **PASS** (격리 필터 0 hit + 전체 tsc도 0건으로 자가 해소) | - |
| M-2 | FAIL (tsc 에러로 build 차단) | **PASS** (`✓ Compiled successfully in 17.3s`) | - |
| M-10 | PASS* (grep 패턴 결함) | **PASS** (CSS value grep `wc -l=1` — `11glcee99y2qo.css`) | - |

**M-1 추가 발견**: iter 1 당시 외부 세션 원인이던 tsc 에러 2건이 `checkouts-sprint4-ux-u02-u08` 세션에 의해 자체 해소됨. `lib/constants/keyboard-shortcuts.ts`에 `modifiers?: string[]` / `allowInInput?: boolean` 필드가 추가되어 전체 tsc `EXIT=0`. 격리 필터를 적용하지 않더라도 M-1 PASS.

### MUST 12개 전체 재확인

| 기준 | 판정 | 실측 근거 |
|------|------|----------|
| M-1: tsc 에러 0 (격리) | **PASS** | 격리 grep = 0 hit; 전체 tsc EXIT=0 |
| M-2: build Webpack ✓ | **PASS** | `✓ Compiled successfully in 17.3s` |
| M-3: SSOT 신설 | **PASS** | `stickyHeaderHeight` count=1, `calloutHeroShadow` count=1, `as const satisfies Record<string, ` count=2 |
| M-4: barrel export | **PASS** | `CSS_VAR_NAMES` count=1, `cssVar` count=1, `type CssVarName` count=1 in `index.ts:46` |
| M-5: 하드코딩 0건 | **PASS** | `css-variables.ts:62,72` 만 hit (SSOT 정의 화이트리스트). 화이트리스트 외 0건 |
| M-6: producer 마이그레이션 | **PASS** | `EquipmentDetailClient.tsx` `CSS_VAR_NAMES.stickyHeaderHeight` count=3 (≥2) |
| M-7: runtime consumer 마이그레이션 | **PASS** | `NCDetailClient.tsx` count=1, `sticky-helpers.ts` count=3 (주석 2 + 실사용 1 — ≥1) |
| M-8: callout-hero-shadow 마이그레이션 | **PASS** | `GuidanceCallout.tsx` `CSS_VAR_NAMES.calloutHeroShadow` count=2, `as string` count=0 |
| M-9: design-token consumer (해법 B) | **PASS** | `equipment.ts:775,782`, `bulk-action-bar.ts:13,19`, `semantic.ts:522,525,695,710` — 모두 string literal + `// SSOT: CSS_VAR_NAMES.*` 주석 |
| M-10: Tailwind JIT 빌드 검증 | **PASS** | `find .next -name "*.css" \| xargs grep -l "var(--sticky-header-height,0px)"` = 1 (`11glcee99y2qo.css`) |
| M-11: verify-hardcoding skill 갱신 | **PASS** | `grep -c "css-variables.ts\|CSS_VAR_NAMES\|--sticky-header-height" SKILL.md` = 22 (≥2) |
| M-12: frontend test suite 회귀 0 | **PASS** | 80 suites / 700 tests PASS |

### SHOULD 기준 재확인

| 기준 | 판정 | 비고 |
|------|------|------|
| S-1: design-tokens README.md 갱신 | **PASS** | iter 1 에서 이미 확인. `README.md:142` "### CSS Variable Names SSOT" 섹션 존재 |
| S-2: review-architecture Critical 이슈 0건 | **SKIP** | review-architecture 미실행 (범위: 단순 string literal → typed const 마이그레이션, Critical 이슈 risk 낮음) |
| S-3: 자기검토 라운드 #2 | **PASS** (아래 상세) | 아래 시니어 자기검토 섹션 참조 |
| S-4: 추가 CSS variable tech-debt 등록 | **부분 PASS** | `--z-sticky` 관련 코멘트(`bulk-action-bar.ts:16`)는 있음. tech-debt-tracker.md 공식 항목 미등록 — 아래 tech-debt 등록 권고 참조 |

### 시니어 자기검토 (S-3)

**검토 항목 1: design-token 파일의 `var(--css-name)` 직접 참조 — 해법 B 정당성 재확인**
- `equipment.ts:782`, `bulk-action-bar.ts:19`, `semantic.ts:525` 가 여전히 string literal `var(--sticky-header-height,0px)` 직접 사용.
- 판단: 해법 B 채택 근거인 Tailwind JIT 정적 분석 제약은 css-variables.ts JSDoc에 명시 (`Tailwind v4.2 의 정적 분석은 … template literal interpolation 은 추출하지 못한다`). 설계 의도이며 `// SSOT: CSS_VAR_NAMES.*` 주석으로 역추적 가능. **PASS — by-design**.

**검토 항목 2: `as string` SSOT 우회 cast — 전체 파일 스캔**
- sprint 변경 파일 (`css-variables.ts`, `EquipmentDetailClient.tsx`, `NCDetailClient.tsx`, `GuidanceCallout.tsx`, `sticky-helpers.ts`, design-token 파일 3개, `index.ts`) 모두 `as string` 0건.
- `GuidanceCallout.tsx` 에서 이전 `['--callout-hero-shadow' as string]: ...` cast가 `[CSS_VAR_NAMES.calloutHeroShadow]: ...` 로 정확히 교체됨 (M-8 확인).
- **PASS — 우회 없음**.

**검토 항목 3: mirror 상수 — 다른 파일에서 동일 CSS var name 재정의**
- `grep -rEn "(--sticky-header-height|--callout-hero-shadow)" apps/frontend --include='*.ts' --include='*.tsx'` 결과: `css-variables.ts:62,72` (SSOT 정의), `bulk-action-bar.ts:19`, `equipment.ts:782`, `semantic.ts:525` (해법 B Tailwind literal), `semantic.ts:710` (calloutHeroShadow Tailwind), `sticky-helpers.ts` 주석 1건.
- 어떤 파일도 별도 상수로 재정의하지 않음. **mirror 0건 — PASS**.

**검토 항목 4: contract 명시적 제외 항목 — `--z-sticky` / `--bulk-bar-offset` 처리**
- `--z-sticky`: `bulk-action-bar.ts:19,21` 에 `z-[var(--z-sticky,20)]` 존재. `bulk-action-bar.ts:16` 주석에 "별도 sprint scope (CSS_VAR_NAMES 확장 후보)"로 명시됨. 단, tech-debt-tracker.md 공식 항목 없음.
- `--bulk-bar-offset`: `approval.ts:210` 에 `bottom-[var(--bulk-bar-offset,0px)]` 존재. `globals.css:435` 에 `--bulk-bar-offset: var(--safe-area-inset-bottom, 0px)` CSS 정의 (Pure CSS var, JS runtime 참조 없음). `setProperty`/`getPropertyValue` 코드 참조 0건. → CSS-only var 이므로 CSS_VAR_NAMES SSOT 범위 밖 (JS/TS 코드에서 문자열로 직접 참조 안 함).
- **판단**: `--z-sticky`는 tech-debt SHOULD 항목, `--bulk-bar-offset`은 CSS-only로 현재 SSOT 범위 외 (by-design).

**검토 항목 5: barrel export 범위 — `css-variables.ts` 외 신규 export가 다른 파일과 충돌하는지**
- `index.ts:46`에 단일 re-export 라인 확인. 기존 primitives.ts, semantic.ts, components/* export와 이름 충돌 없음 (`CSS_VAR_NAMES`, `cssVar`, `CssVarName` — 고유 이름).
- **PASS — 충돌 없음**.

**검토 항목 6: cssVar() helper — 반환값 타입 안정성**
- `cssVar()` 반환값은 `string`. Tailwind arbitrary value에서 사용 시 타입 추론이 `string`으로 끊기는 것은 의도적 (JIT 정적 분석 요건으로 design-token에서 사용 안 함). runtime 코드 (`setProperty`, `getPropertyValue`, inline style) 에서만 사용 — 타입 안정성 충분.
- **PASS**.

**검토 항목 7: S-4 tech-debt 미등록 위험 — --z-sticky**
- `--z-sticky`가 CSS_VAR_NAMES 없이 `z-[var(--z-sticky,20)]` 형태로 `bulk-action-bar.ts:19,21` 2곳에 존재. `globals.css`에 `--z-sticky` CSS 정의 없음 (fallback `20`에만 의존). 설정 코드 (`setProperty`) 도 없어 현재 기본값 20만 사용 중. 향후 z-index 조정 시 하드코딩 위험.
- **권고**: tech-debt-tracker.md LOW 항목 등록 (아래 참조).

### S-4 후속 tech-debt 등록 권고

다음 항목을 tech-debt-tracker.md에 등록하는 것을 권고한다 (코드 수정 없음 — report only):

```
- [ ] **[2026-05-10 sticky-header-css-var-ssot S-4] 🟢 LOW css-var-ssot-z-sticky-bulk-bar-offset**
  — `--z-sticky` (bulk-action-bar.ts:19,21 `z-[var(--z-sticky,20)]`) 와
  `--bulk-bar-offset` (approval.ts:210 `bottom-[var(--bulk-bar-offset,0px)]`) 이
  CSS_VAR_NAMES SSOT 미등록 상태.
  `--z-sticky`: globals.css 정의 없음 (fallback 20만 의존). JS setProperty 참조 없으나
  향후 동적 z-index 제어 필요 시 SSOT 필요.
  `--bulk-bar-offset`: globals.css:435 CSS-only 정의 존재, JS 참조 0건 — CSS-only 패턴이면
  CSS_VAR_NAMES 불필요하나 향후 JS 참조 추가 시 등록 필요.
  트리거: (1) --z-sticky JS setProperty 추가 시 즉시, (2) --bulk-bar-offset JS 참조 추가 시 즉시.
```

### 전체 판정: **PASS**

- MUST 12개 전체 PASS
- SHOULD: S-1 PASS, S-2 SKIP (낮은 risk), S-3 PASS (본 섹션), S-4 부분 (주석 존재, 공식 등록 권고)
- 본 sprint 코드 품질 이슈 없음

### Iter 1 → Iter 2 변경 요약

- contract 격리 정책 추가 (M-1/M-2 외부 세션 에러 격리)
- M-10 grep 패턴 교체 (CSS value 기반 `var(--sticky-header-height,0px)` — escape 무관)
- 본 sprint 변경 파일 자체는 변경 없음 (iter 1 PASS 상태 유지)
- **추가 발견**: 외부 세션 (`checkouts-sprint4-ux-u02-u08`)이 iter 1 FAIL 원인이던 tsc 에러를 자체 해소 (`keyboard-shortcuts.ts`에 `modifiers`/`allowInInput` 필드 추가) → 전체 tsc도 EXIT=0으로 M-1 격리 정책 불필요한 수준까지 개선됨

### 건강 지표 (iter 2)

| 항목 | 값 |
|------|---|
| 전체 tsc 에러 | 0건 (외부 세션 자체 해소) |
| sprint 파일 tsc 에러 | 0건 |
| Webpack 컴파일 | ✓ 17.3s |
| 테스트 결과 | 80 suites / 700 tests PASS |
| 하드코딩 잔존 | 0건 |
| CSS JIT 컴파일 확인 | 1건 (`11glcee99y2qo.css`) |
| mirror 상수 | 0건 |
| SSOT 우회 cast | 0건 |
