---
slug: nc-r4-detail-callout-timeline-merge
created: 2026-04-26
mode: 1
follows: [nc-r3-list-action-chip-polish]
round: 2
decision: "option-c-callout-hero-mini-progress"
---

# Contract: NC-R4 상세 페이지 Polish — Callout Timeline 통합 · 카드 비율 · Empty State · a11y

## Context

NC 코드 리뷰 Round-2 비주얼 항목 V2(🔴), V5, V6 + a11y 항목 3.1, 3.2, 5.2 대응.

**실행 전제**: `nc-r3-list-action-chip-polish` 머지 완료 후 실행.

**D1 결정 = 옵션 C**: Callout hero header에 mini progress dot strip + 등록일을 통합. `WorkflowTimeline`의 compact 분기(`if (compact) ...`)와 `CompactStepDate` 헬퍼를 제거. Callout이 stepBadgeKey + dot strip + 등록일을 모두 표시.

1. **compact Timeline 통합 (V2, 🔴, 옵션 C)** — `NCDetailClient`에서 `isClosed` 아닐 때 Callout hero + compact Timeline이 나란히 렌더. Callout이 이미 STEP N/3 + variant 색 + CTA를 전달 → compact Timeline의 dot strip이 redundant stripe로 읽힘. mini progress를 GuidanceCallout 내부 header 우측 코너에 통합. WorkflowTimeline의 compact 모드 코드 제거.

2. **카드 비율 (V5)** — `NC_INFO_CARD_TOKENS.gridRepairLinked: 'md:grid-cols-[1fr_1.2fr]'`. 현재 오른쪽(수리/교정 카드)이 더 넓지만 내용이 짧아 비어 보임. 비율을 `[1.2fr_1fr]`로 뒤집어 왼쪽(기본정보)을 넓히거나 오른쪽 카드에 안내 스텝 리스트 추가.

3. **Empty State 패딩 (V6)** — `NC_EMPTY_STATE_TOKENS.container: 'text-center py-16'`. collapsible 섹션 안 empty state가 과도한 공백 생성. collapsible 내부 용도의 compact variant 추가 (`py-6` 또는 `py-8`).

4. **GuidanceCallout role/focus 중복 (a11y 3.1)** — 현재 `role="alert"` + `aria-live="polite"` + 상태 전환 후 `h2.focus()` 호출. `role="alert"`은 포커스 이동 없이 자동 읽기 → 포커스까지 이동하면 스크린리더가 두 번 읽힘. `role="status"` + 포커스 이동 하나만 유지.

5. **MiniWorkflow aria-hidden (a11y 3.2)** — `aria-hidden="true"` 처리된 mini dot strip에서 진행률 정보가 스크린리더에 미전달. Callout 내부 통합 후에도 sr-only로 현재 단계 안내 추가.

## Scope

- MOD: `apps/frontend/components/non-conformances/GuidanceCallout.tsx`
  - header 영역에 mini progress dot strip 통합 (신규 prop: `workflowSteps?: { label: string; isCurrent: boolean; date?: string }[]`)
  - `role="alert"` → `role="status"` 변경 (aria-live="polite" 유지) + NCDetailClient의 h2.focus() 제거
  - dot strip에 `aria-hidden="true"` + `sr-only` 현재 단계 텍스트 추가
- MOD: `apps/frontend/lib/design-tokens/components/non-conformance.ts`
  - `NC_INFO_CARD_TOKENS.gridRepairLinked`: `[1fr_1.2fr]` → `[1.2fr_1fr]`
  - `NC_EMPTY_STATE_TOKENS`: `collapsible` variant 키 추가 (`py-6`)
  - `NC_CALLOUT_TOKENS`(또는 `GuidanceCallout` 관련 토큰): mini progress dot strip 토큰 추가
- MOD: `apps/frontend/components/non-conformances/NCDetailClient.tsx`
  - compact Timeline 렌더링 조건 제거 — Callout에 workflowSteps props 전달
  - h2.focus() 호출 제거 (role="status"로 스크린리더가 자동 읽음)
- MOD: `apps/frontend/components/workflow/WorkflowTimeline.tsx`
  - compact prop 분기(`if (compact) ...`) 및 compact 관련 JSX 제거
  - `CompactStepDate` 내부 헬퍼 제거

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | WorkflowTimeline compact 분기 제거 | `! grep -n '"compact"\|compact.*prop\|isCompact\|compact:' apps/frontend/components/workflow/WorkflowTimeline.tsx` |
| M2 | GuidanceCallout mini progress 통합 | `grep -n "workflowStep\|miniProgress\|dotStrip" apps/frontend/components/non-conformances/GuidanceCallout.tsx` → ≥ 1 |
| M3 | gridRepairLinked 비율 뒤집힘 | `grep -n "1\.2fr_1fr\]" apps/frontend/lib/design-tokens/components/non-conformance.ts` → ≥ 1 |
| M4 | 구 비율 제거 | `! grep -n "1fr_1\.2fr\]" apps/frontend/lib/design-tokens/components/non-conformance.ts` |
| M5 | NC_EMPTY_STATE_TOKENS collapsible variant | `grep -nA5 "NC_EMPTY_STATE_TOKENS" apps/frontend/lib/design-tokens/components/non-conformance.ts \| grep "py-6\|collapsible"` → ≥ 1 |
| M6 | role="alert" 제거 | `! grep -n 'role="alert"' apps/frontend/components/non-conformances/GuidanceCallout.tsx` |
| M7 | role="status" 적용 | `grep -n 'role="status"' apps/frontend/components/non-conformances/GuidanceCallout.tsx` → ≥ 1 |
| M8 | h2.focus() 제거 (NCDetailClient) | `! grep -n "\.focus()" apps/frontend/components/non-conformances/NCDetailClient.tsx` |
| M9 | dot strip sr-only 안내 | `grep -n "sr-only" apps/frontend/components/non-conformances/GuidanceCallout.tsx` → ≥ 1 |
| M10 | tsc 통과 | `pnpm tsc --noEmit -p apps/frontend/tsconfig.json --skipLibCheck 2>&1 \| grep -v ".next/" \| grep -c "error"` → 0 |
| M11 | lint 통과 | `pnpm --filter frontend lint 2>&1 \| tail -3` → 0 errors |
| M12 | verify-design-tokens PASS | `/verify-design-tokens` 스킬 실행 — PASS |

## SHOULD Criteria (non-blocking)

| # | Criterion |
|---|-----------|
| S1 | Playwright snapshot — mini progress dot strip 시각 검증 (operator open+needsRecalibration 상태) |
| S2 | MiniWorkflow 전체(NCListRow 쪽)도 aria-hidden 대신 sr-only 진행률 텍스트 추가 |
| S3 | Empty State collapsible variant가 기존 전체 페이지 Empty State에 영향 없음 확인 |
| S4 | GuidanceCallout workflowSteps prop이 undefined일 때 dot strip 렌더 안 함 (옵션 백워드 호환) |

## Domain Rules

- **D1 결정 (옵션 C)**: compact Timeline 완전 제거. GuidanceCallout이 mini dot strip을 owning. dot strip은 `NC_WORKFLOW_STEPS` 배열 기반 (3 dots).
- dot strip 토큰 — `compactDot.base`, `compactDot.current`, `compactDot.done`, `compactDot.pending`, `compactConnector` 등. 색은 `border-brand-critical/40` → solid로 강화 (배경 묻힘 방지).
- `gridRepairLinked` 비율 변경은 시각적 무게 재분배. 기본정보 카드(5개 필드)가 더 넓어야 함.
- `role="status"` + `aria-live="polite"` 조합: 상태 변경 시 자동 읽기 but 포커스 이동 없음. 사용자가 현재 포커스를 잃지 않음.
- WorkflowTimeline 변경 시 compact를 사용하는 **다른 모듈**(calibration 등) 없는지 사전 grep 확인 필수.

## Non-Goals

- WorkflowTimeline의 전체 리팩터링 (compact 분기 제거만)
- GuidanceCallout의 신규 variant 추가 (기존 variant 유지)
- CalibrationCard/RepairCard 통합 (tech-debt 항목으로 별도 처리)
- B.4 CTA 소유권 UI 개선 — R1a의 i18n 키 추가로 처리됨
