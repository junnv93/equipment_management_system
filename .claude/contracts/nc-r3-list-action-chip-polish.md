---
slug: nc-r3-list-action-chip-polish
created: 2026-04-26
mode: 1
follows: [nc-r1b-hygiene]
round: 2
---

# Contract: NC-R3 리스트 액션 칩 Polish — 컬럼 폭 · 색상 · 화살표 · rename

## Context

NC 코드 리뷰 Round-2 비주얼 항목 V1(🔴), V3(🟡), V4(🟡) + 코드 항목 a11y 3.3 대응.

**실행 전제**: `nc-r1b-hygiene` 머지 완료 후 실행.

1. **"선행 필요" 칩 2줄 래핑 (V1, 🔴)** — `NC_LIST_GRID_COLS` 마지막 컬럼이 `50px`로 너무 좁아 "선행 필요" 칩이 2줄로 래핑. 다른 행의 "승인", "완료"는 한 줄인데 이 행만 높이가 달라 세로 리듬 파괴. 80~90px로 확장 + `whitespace-nowrap`.
2. **blocked 칩 색상 중복 (V3)** — `openBlockedRepair_*` / `openBlockedRecalibration_*`의 guidance variant가 `critical`이라 칩도 빨강. 같은 행 status 배지도 이미 빨강 → 시각 노이즈. blocked 상태의 칩은 `warning(amber)` 계열로 분리 (상태 = critical, 차단 사유 = warning).
3. **"→" 화살표 하드코딩 (V4)** — NonConformancesContent L537 `{chip.label} →`. `done` 칩에도 `→`가 붙어 "클릭하면 이동" 암시. `roleChip === 'done'` 이거나 액션 없는 경우 화살표 제거. 화살표를 i18n 키로 이동하거나 조건부 렌더.
4. **actionButton → actionIndicator rename (a11y 3.3)** — `NC_LIST_TOKENS.actionButton` 토큰명이 "button"이지만 실제로는 Link 내부 장식적 span — 클릭 동작이 없음. 의미 오도(misleading name) 수정.

## Scope

- MOD: `apps/frontend/lib/design-tokens/components/non-conformance.ts`
  - `NC_LIST_GRID_COLS`: 마지막 컬럼 `50px` → `90px` (또는 `88px`)
  - `NC_LIST_TOKENS.actionButton` key → `actionIndicator` rename
  - `getActionChipClasses` (또는 `NC_WORKFLOW_GUIDANCE_TOKENS`의 variant 매핑): blocked guidance에 `warning` 색상 클래스 신규 경로 추가
- MOD: `apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx`
  - L537 `{chip.label} →` → `roleChip !== 'done'` 조건 추가 (또는 i18n 키화)
  - `NC_LIST_TOKENS.actionButton` 참조 → `actionIndicator`
  - blocked chip에 `whitespace-nowrap` 적용
  - blocked guidance variant 색상 → warning 계열

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | NC_LIST_GRID_COLS 마지막 컬럼 80~90px | `grep -nE "_(8[0-9]\|90)px\]" apps/frontend/lib/design-tokens/components/non-conformance.ts \| grep "NC_LIST_GRID_COLS"` → ≥ 1 |
| M2 | 구 50px 컬럼 제거 | `! grep -n "_50px\]" apps/frontend/lib/design-tokens/components/non-conformance.ts` |
| M3 | actionButton 토큰 제거 | `! grep -rn "actionButton" apps/frontend/lib/design-tokens/components/non-conformance.ts apps/frontend/components/non-conformances/ apps/frontend/app/(dashboard)/non-conformances/` |
| M4 | actionIndicator 토큰 추가 | `grep -rn "actionIndicator" apps/frontend/lib/design-tokens/components/non-conformance.ts` → ≥ 1 |
| M5 | actionIndicator 사용처 확인 | `grep -rn "actionIndicator" apps/frontend/components/non-conformances/ apps/frontend/app/(dashboard)/non-conformances/` → ≥ 1 |
| M6 | done 칩 화살표 제거 (조건부 또는 i18n 처리) | `grep -n "chip\.label.*→\|→.*chip\.label" apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx` → 0 (raw `→` 없음) |
| M7 | blocked 칩 warning 색상 경로 존재 | `grep -n "actionChip\|chipClasses\|blockedChip\|chip.*warning\|warning.*chip" apps/frontend/lib/design-tokens/components/non-conformance.ts \| grep -iE "warning\|amber"` → ≥ 1 |
| M8 | tsc 통과 | `pnpm tsc --noEmit -p apps/frontend/tsconfig.json --skipLibCheck 2>&1 \| grep -v ".next/" \| grep -c "error"` → 0 |
| M9 | frontend test 통과 | `pnpm --filter frontend test --silent 2>&1 \| tail -5` → PASS |
| M10 | verify-design-tokens PASS | `/verify-design-tokens` 스킬 실행 — PASS |

## SHOULD Criteria (non-blocking)

| # | Criterion |
|---|-----------|
| S1 | 화살표 → `→` i18n 키로 분리 (`nonConformances.list.chip.arrow`) |
| S2 | whitespace-nowrap을 `NC_LIST_TOKENS.actionIndicator` 토큰 값에 포함 |
| S3 | `NCListRow` storybook 또는 스냅샷 업데이트 (시각 검증) |

## Domain Rules

- `NC_LIST_GRID_COLS`의 컬럼 구조: `[130px_100px_1fr_1.2fr_90px_70px_Xpx]` — 7번째가 액션 컬럼. 변경은 마지막 컬럼 수치만.
- blocked variant 색상 분리 원칙: 배지(status badge)가 이미 `critical` 색을 전달하므로, 칩(role chip)은 `warning(amber)` 계열로 차별화. `NC_WORKFLOW_GUIDANCE_TOKENS[key].variant`가 `critical`이더라도 칩 렌더 시에는 별도 매핑 테이블 경유.
- `→` 조건: `chip.roleChip === 'done'` 또는 `chip.roleChip === 'none'`일 때 화살표 미노출. 화살표 문자는 raw 하드코딩 금지 — i18n 키 또는 `aria-hidden` span으로.
- `dark:` prefix 금지 — CSS 변수 자동 전환 체계.

## Non-Goals

- NC_WORKFLOW_GUIDANCE_TOKENS 내 variant 값 변경 (critical 유지 — 긴급도 표현) — 칩 렌더 레이어만 분리
- 리스트 그리드 전체 레이아웃 리팩토링
- NCListRow를 별도 파일로 추출
