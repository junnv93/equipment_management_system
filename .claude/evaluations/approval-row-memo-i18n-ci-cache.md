# Evaluation: approval-row-memo-i18n-ci-cache

**Iteration**: 1
**Date**: 2026-05-10

## MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M-1 | ApprovalRow가 `memo()`로 wrap됨 | PASS | `export const ApprovalRow = memo(function ApprovalRow({` — 1건 hit |
| M-2 | `import.*memo.*from 'react'` in ApprovalRow.tsx | PASS | `import { memo } from 'react';` — memo 포함 확인 |
| M-3 | ApprovalList.tsx에 `useCallback` + `memo` import | PASS | `import { memo, useCallback } from 'react';` — 각 1건 |
| M-4 | map() 블록 인라인 람다 `() => on*` 제거됨 | PASS | `items.map()` JSX 블록(lines 150-163)에 인라인 람다 없음. `() =>` 는 모두 `useCallback(...)` 내부(lines 56-62)이며 `ApprovalRowItem` wrapper 컴포넌트 본체 — 위반 아님 |
| M-5 | dep-audit job에 `cache: pnpm` 추가 | PASS | `cache: pnpm` — actions/setup-node with 블록 내 확인 |
| M-6 | dep-audit job의 `actions/cache` (node_modules) 제거 | PASS | `awk '/dep-audit:/,/backup-restore-rehearsal:/'` 범위에서 `actions/cache` 0건 |
| M-7 | HeroKPI.tsx 한국어 하드코딩 0건 | PASS | `grep "증가 추세\|감소 추세\|변동 없음"` → 0건 (exit 1). `sr-only` span은 `t('trendUp')` 등 i18n 키 경유 |
| M-8 | HeroKPI.tsx에 `useTranslations` 추가 | PASS | `import { useTranslations } from 'next-intl';` + `const t = useTranslations('checkouts.heroKpi');` — 1건 |
| M-9 | ko/checkouts.json `heroKpi.trendUp/Down/Flat` 추가 | PASS | `grep -c "trendUp\|trendDown\|trendFlat"` → 3건 |
| M-10 | en/checkouts.json parity | PASS | `grep -c "trendUp\|trendDown\|trendFlat"` → 3건 |
| M-11 | tsc --noEmit exit 0 (6 수정 파일 기준) | PASS | tsc 에러 전체가 pre-existing `lib/api/__tests__/approvals-invalidation.test.ts` 8건만 — 6개 수정 파일에 신규 에러 0건 |
| M-12 | `error.heroKpi` 기존 키 유지 | PASS* | 구조적으로 `data['error']['heroKpi'] = "통계를 불러오지 못했습니다"` 존재 확인 (Python json.load 검증). 단, 계약 grep `grep "heroKpi" ... \| grep "error"` 는 Prettier 멀티라인 포맷으로 0건 반환 — grep 명세 버그, 실제 키는 보존됨 |

\* M-12 계약 grep 명세 결함: `"heroKpi": "..."` 와 `"error": {` 가 별개 행에 있어 파이프 grep이 0건 반환. 실제 키 보존 여부는 `python3 -c "import json; data=json.load(open(...)); print('heroKpi' in data['error'])"` → `True` 로 확인. 이는 구현 결함이 아닌 계약 검증 명세 결함.

## SHOULD Criteria

| ID | Criterion | Verdict | Note |
|----|-----------|---------|------|
| S-1 | `ApprovalRowItem` wrapper 컴포넌트로 per-item 콜백 안정화 | PASS | `const ApprovalRowItem = memo(function ApprovalRowItem({...})` 존재. handleToggleSelect/handleApprove/handleReject/handleViewDetail 4개 useCallback 안정화 완료 |
| S-2 | dep-audit job comments 정합성 유지 | PASS | `--prod`, `--audit-level=critical` 주석 3줄 및 SHA-pinned action 주석 모두 보존 확인 |

## Overall Verdict

**PASS**

## Notes

- M-12 계약 grep 명세 결함: Prettier가 JSON 객체 키를 멀티라인으로 포맷하여 `"heroKpi"` 와 `"error"` 가 동일 행에 공존하지 않음. 실제 `error.heroKpi` 키는 Python json.load로 존재 확인. 구현은 올바름 — 계약 검증 커맨드만 수정 필요.
- M-4 주의: `ApprovalRowItem` wrapper 내 `useCallback(() => on...)` 패턴은 인라인 람다가 아닌 안정화된 콜백 — 계약 의도에 부합. `items.map()` JSX 블록에는 인라인 람다 없음.
- tsc: pre-existing 에러 8건(`approvals-invalidation.test.ts`) 은 계약 명시대로 제외.
