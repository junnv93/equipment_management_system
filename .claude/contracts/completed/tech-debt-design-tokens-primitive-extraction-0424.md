# Contract: tech-debt-design-tokens-primitive-extraction-0424

## Scope

NC 디자인 리뷰 rev-2 Phase 1 검증(`/verify-implementation` 2026-04-24) 중 탐지된 design-token primitive 추출 및 SSOT 경유 빈틈. Phase 1 "선언만 추가" 범위를 넘어서므로 별도 세션에서 통합 처리.

## 본 세션 Phase 1 코드의 잔존 이슈 (4건, 전부 WARN)

| # | 위치 | 위반 원칙 | 수정 방향 |
|---|------|---------|---------|
| P1-1 | `semantic.ts:551` (CALLOUT hero size) | 매직넘버 `0 4px 14px -6px` 직접 사용 | `ELEVATION_PRIMITIVES`에 `--shadow-callout-hero` primitive 신설, `shadow-[var(--shadow-callout-hero)]`로 교체. 색상은 기존 `--callout-hero-shadow` CSS 변수 주입 유지 |
| P1-2 | `semantic.ts:682/688/694` (CONFIRM_PREVIEW_CARD_CLASSES) | `grid-cols-[90px_1fr]` 3중 복제 매직넘버 | `DIMENSION_TOKENS.confirmPreviewLabelWidth` 추가 + primitives에 `--spacing-confirm-label` (90px). 사용처 `grid-cols-[var(--spacing-confirm-label)_1fr]` |
| P1-3 | `non-conformance.ts` `NC_BANNER_TOKENS.alertCompact` | `py-2.5 px-3.5`가 `SPACING_RHYTHM_TOKENS` 밖 step | 옵션 A: `SPACING_RHYTHM_TOKENS.tightPlus` 등록. 옵션 B: `CALLOUT_TOKENS.size.compact`(동일 px-3 py-2.5) alias 재사용 |
| P1-4 | `form-field-tokens.ts:44` | `border-l-[3px]`가 `--spacing-hairline`(=3px)과 drift | `border-l-[length:var(--spacing-hairline)]`로 교체 → primitives SSOT 체인 복구 |

## 기존 코드 이슈 (Phase 1 범위 밖)

### 🔴 Critical — `non-conformance.ts` brand CSS 변수 우회 (rgba 리터럴 5곳)

```ts
// L374-375, L453-455 (기존 NC_MINI_WORKFLOW_TOKENS / NC_WORKFLOW_TOKENS)
shadow-[0_0_0_3px_rgba(245,158,11,0.15)]  // brand-warning hex
shadow-[0_0_0_3px_rgba(239,68,68,0.15)]   // brand-critical hex
shadow-[0_0_0_3px_rgba(59,130,246,0.1)]   // brand-info hex
// ...
```

**문제**: brand CSS 변수 체계 우회 — 다크모드 brand 색상 변경 시 hex 고정값 미대응.

**수정 제안**: `color-mix(in oklch, var(--brand-warning) 15%, transparent)` 패턴 또는 `--nc-node-ring-<variant>` CSS 변수 주입.

### 🟡 `non-conformance.ts:1086` NC_REPAIR_RESULT_LABELS 한국어 리터럴
```ts
export const NC_REPAIR_RESULT_LABELS: Record<string, string> = {
  completed: '완료',
  partial: '부분 수리',
  failed: '실패',
};
```
i18n `labelKey`로 교체 (`repairResult.completed` 등).

### 🟡 verify-ssot 11개 이슈 (NC + Checkout 도메인 토큰)

brand 리터럴 직접 사용(헬퍼 미경유) 60+개 — 주요 그룹:

| 토큰 그룹 | 위치 | 리터럴 수 |
|---------|------|---------|
| NC_BANNER_TOKENS (기존) | non-conformance.ts:94-113 | 12 |
| NC_REPAIR_LINKED_TOKENS | non-conformance.ts:124-139 | 6 |
| NC_KPI_TOKENS | non-conformance.ts:189-207 | 9 |
| mini-workflow + workflow node/label | non-conformance.ts:307-467 | ~15 |
| NC_GUIDANCE_STEP_BADGE_TOKENS.variant | non-conformance.ts:1016-1020 | 5 (`CALLOUT_VARIANT_TO_SEMANTIC` 재정의) |
| CHECKOUT_STATUS_BADGE_TOKENS | checkout.ts:55-109 | 60+ |
| CHECKOUT_STATS_VARIANTS | checkout.ts:430-514 | 28+ |
| (기타 checkout 토큰) | checkout.ts:243-820 | 여러곳 |

**통합 수정 전략**:
1. NC: `NC_STATUS_SEMANTIC_MAP`(기존 존재) 같은 `Record<VariantKey, SemanticColorKey>` 매핑 테이블 확산. `getSemanticStatusClasses(map[variant])` 파생.
2. Checkout: `CHECKOUT_STATUS_SEMANTIC_MAP` 신설, `BRAND_CLASS_MATRIX.borderOpacity30`(Phase 1 신규) 재사용.
3. `CALLOUT_VARIANT_TO_SEMANTIC`을 `semantic.ts`에서 export하여 NC guidance에서 재사용.

### 🟡 [`tech-debt-nc-banner-dark-prefix-0424.md`](./tech-debt-nc-banner-dark-prefix-0424.md)
별도 파일로 이미 분리됨 — `NC_BANNER.statusAlert`의 `dark:` prefix.

## MUST Criteria (미래 세션)

| # | Criterion | Verify Command |
|---|-----------|----------------|
| M1 | Phase 1 코드 4건 primitive 추출 완료 | P1-1~P1-4 각각 grep 확인 |
| M2 | rgba hex 리터럴 0건 | `grep -rn "rgba([0-9]" apps/frontend/lib/design-tokens/` → 0 |
| M3 | brand 리터럴 직접 사용 감축 | `grep -rn "bg-brand-\|text-brand-\|border-brand-" apps/frontend/lib/design-tokens/components/` 기준선 대비 50% 이상 감축 |
| M4 | `NC_REPAIR_RESULT_LABELS` 한국어 값 0 | `grep -n "한국어 패턴" non-conformance.ts` → 0 |
| M5 | tsc --noEmit PASS | `pnpm --filter frontend run tsc --noEmit` |
| M6 | Visual regression 없음 | Playwright E2E 기존 스펙 통과 |

## 처리 전략 제안

**단일 세션으로 전부 처리** vs **단계 분할**:

- **옵션 A (권장)**: NC 리뷰 Phase 2~4 완료 후 별도 리팩토링 세션. 이유 — Phase 2~4가 컴포넌트 파일을 건드리는데, 그 과정에서 토큰 사용처가 함께 바뀌므로 리팩토링이 자연스럽게 섞임.
- 옵션 B: 독립 리팩토링 세션 먼저. Phase 2~4는 그 뒤. 이유 — SSOT 기반이 단단해진 후 Phase 2~4가 진행되면 더 깔끔. 단, 기다리는 동안 NC 리뷰 UI 개선이 지연됨.

사용자 결정 사항.

## 배경

2026-04-24 세션 95차 — `/verify-implementation` 3개 스킬(design-tokens, ssot, hardcoding) 병렬 실행 결과. 본 세션 commit `7a851f78` / `9748349d` / `d129c5f1` 직후 검증.

본 세션의 Phase 1 + 1.1은 "UI 무영향 선언만" 원칙을 지켜 merged됐고 tsc + 182 frontend test 통과. 본 tech-debt는 **리뷰 완료 플랜을 넘어서는 추가 개선 영역**으로 분리됨.

## 관련 memory

- `Design Token 3-Layer` — Primitives → Semantic → Components
- `design-token 헬퍼에서 text-brand-${key} 동적 보간 금지` — `getSemanticContainerTextClasses()` 경유
- `brand token 파일 내 dark:bg-brand-* 금지`
- `feedback_plan_precommit_architectural_audit.md` — 감사 결과는 tech-debt로 기록

## 관련 contract

- `./nc-design-review-phases.md` — NC 디자인 리뷰 rev-2 Phase 1~4 전체
- `./tech-debt-nc-banner-dark-prefix-0424.md` — statusAlert `dark:` prefix (부분 중복, 통합 처리 가능)

## Bonus — verify-design-tokens Step 25/26 신규 탐지 건 (2026-04-24 manage-skills 드라이런)

Step 25 (CSS 변수 fallback 필수) / Step 26 (Record satisfies 가드) 신규 추가 직후 드라이런에서 **기존 코드 debt 10건 추가 탐지**. 본 플랜 처리 시 함께 해소 권장:

### Step 25 (fallback 없는 `hsl(var(--brand-color-*))`) — 5건
| 파일 | 라인 |
|------|------|
| `lib/design-tokens/components/approval.ts` | 250 |
| `lib/design-tokens/components/equipment.ts` | 474 |
| `lib/design-tokens/components/document.ts` | 45, 153 |
| `lib/design-tokens/components/form-templates.ts` | 104 |

공통: `shadow-[inset_Npx_0_0_hsl(var(--brand-color-<color>))]` 패턴 — fallback 없음.

### Step 26 (`Record<K, V>` satisfies 가드 누락) — 5건
| 파일 | 라인 | 상수 |
|------|------|------|
| `lib/design-tokens/components/equipment-timeline.ts` | 94 | `INCIDENT_TYPE_COLOR_MAP` |
| `lib/design-tokens/components/equipment-timeline.ts` | 113 | `INCIDENT_TYPE_BADGE_MAP` |
| `lib/design-tokens/semantic.ts` | 519 | `CALLOUT_VARIANT_TO_SEMANTIC` (이번 세션이 접근한 파일) |
| `lib/design-tokens/components/team.ts` | 58 | `ROLE_BADGE_TOKENS: Record<string, string>` (string key → enum key 좁힘 필요) |
| `lib/design-tokens/visual-feedback.ts` | 42 | `URGENCY_FEEDBACK_MAP` |

전부 `as const satisfies Record<Key, Value>` 추가로 해소 가능.
