# Evaluation: approval-row-memo-i18n-ci-cache
Date: 2026-05-10
Iteration: 2 (iter 1 FAIL → iter 2 PASS)

## MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M-1 | ApprovalRow가 `memo()`로 wrap됨 | PASS | `export const ApprovalRow = memo(function ApprovalRow({` (line 55) |
| M-2 | `import.*memo.*from 'react'` in ApprovalRow.tsx | PASS | `import { memo } from 'react';` (line 3) |
| M-3 | ApprovalList.tsx에 `useCallback` + `memo` import | PASS | `import { memo, useCallback } from 'react';` (line 3) |
| M-4 | map()에서 인라인 람다 `() => on*` 제거됨 | PASS | `items.map()` JSX(lines 150–163)에 인라인 람다 0건. grep 4건은 전부 `useCallback(...)` 내부 (ApprovalRowItem) — 올바른 패턴 |
| M-5 | dep-audit job에 `cache: pnpm` 추가 | PASS | `awk '/dep-audit:/,/backup-restore-rehearsal:/' \| grep "cache: pnpm"` → 1건 확인 |
| M-6 | dep-audit job의 `actions/cache` 제거 | PASS | dep-audit 섹션 내 `actions/cache` 0건 |
| M-7 | HeroKPI.tsx 한국어 하드코딩 0건 | PASS | `grep "증가 추세\|감소 추세\|변동 없음" HeroKPI.tsx` → 0건 |
| M-8 | HeroKPI.tsx에 `useTranslations` 추가 | PASS | `import { useTranslations }` + `const t = useTranslations('checkouts.heroKpi')` 확인 |
| M-9 | ko/checkouts.json `heroKpi.trendUp/Down/Flat` 추가 | PASS | `grep -c` → 3건. trendUp/trendDown/trendFlat 각 1건씩 |
| M-10 | en/checkouts.json parity | PASS | `grep -c` → 3건. Trending Up / Trending Down / No Change |
| M-11 | `pnpm --filter frontend run tsc --noEmit` exit 0 | PASS | iter 1 FAIL 원인: untracked NC 섹션 3파일 (`NCActionBar/NCInfoCards/NCWorkflowTimeline.tsx`)의 `type NonConformance` import가 `@equipment-management/schemas`를 잘못 참조. 수정: 해당 타입을 `@/lib/api/non-conformances-api`로 분리. tsc exit 0 확인 |
| M-12 | `error.heroKpi` 기존 키 유지 | PASS | `python3 json.load` 대안 검증 → `error.heroKpi` 보존 확인 |

## SHOULD Criteria

| ID | Criterion | Verdict | Note |
|----|-----------|---------|------|
| S-1 | `ApprovalRowItem` wrapper + useCallback per-item 콜백 안정화 | PASS | `const ApprovalRowItem = memo(...)` + 4개 handleXxx useCallback 안정화 완료 |
| S-2 | dep-audit job comments 정합성 유지 | PASS | --prod / --audit-level=critical 설명 주석 보존 확인 |

## Overall: PASS

Issues requiring fix: none

## 추가 수정 사항 (iter 1 → 2)

1. `apps/frontend/lib/api/__tests__/approvals-invalidation.test.ts`: stale enum literal `checkout_approval` → `outgoing`, `calibration_plan_approval` → `plan_review` (SSOT ApprovalCategory 준수)
2. `apps/frontend/components/non-conformances/sections/NCActionBar.tsx`: `type NonConformance` import를 `@/lib/api/non-conformances-api`로 분리 (레이어 정합)
3. `apps/frontend/components/non-conformances/sections/NCInfoCards.tsx`: 동일
4. `apps/frontend/components/non-conformances/sections/NCWorkflowTimeline.tsx`: 동일
