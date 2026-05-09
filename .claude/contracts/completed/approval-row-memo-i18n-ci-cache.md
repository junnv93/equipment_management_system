# Contract: approval-row-memo-i18n-ci-cache

**Mode**: 1 (Lightweight)
**Date**: 2026-05-10
**Slug**: approval-row-memo-i18n-ci-cache

## Scope

3개 이슈 통합 closure:
1. ApprovalRow React.memo 누락 (HIGH)
2. main.yml dep-audit pnpm cache 누락 (HIGH)
3. HeroKPI sr-only 한국어 하드코딩 (MEDIUM)

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| M-1 | ApprovalRow가 `memo()`로 wrap됨 | `grep "memo(" apps/frontend/components/approvals/ApprovalRow.tsx` → 1건 hit |
| M-2 | `import.*memo.*from 'react'` in ApprovalRow.tsx | `grep "from 'react'" apps/frontend/components/approvals/ApprovalRow.tsx` → memo 포함 |
| M-3 | ApprovalList.tsx에 `useCallback` + `memo` import | `grep "useCallback\|memo" apps/frontend/components/approvals/ApprovalList.tsx` → 각 1건 |
| M-4 | ApprovalList.tsx 인라인 람다(`() => onToggleSelect`)가 map에서 제거됨 | `grep "() => on" apps/frontend/components/approvals/ApprovalList.tsx` → 0건 |
| M-5 | dep-audit job에 `cache: pnpm` 추가 | `grep -A5 "dep-audit" .github/workflows/main.yml \| grep "cache: pnpm"` → 1건 |
| M-6 | dep-audit job의 `actions/cache` (node_modules) 제거 | `awk '/dep-audit:/,/backup-restore/' .github/workflows/main.yml \| grep "actions/cache"` → 0건 |
| M-7 | HeroKPI.tsx 한국어 하드코딩 0건 | `grep "증가 추세\|감소 추세\|변동 없음" apps/frontend/components/checkouts/HeroKPI.tsx` → 0건 |
| M-8 | HeroKPI.tsx에 `useTranslations` 추가 | `grep "useTranslations" apps/frontend/components/checkouts/HeroKPI.tsx` → 1건 |
| M-9 | ko/checkouts.json `heroKpi.trendUp/Down/Flat` 추가 | `grep -c "trendUp\|trendDown\|trendFlat" apps/frontend/messages/ko/checkouts.json` → 3 |
| M-10 | en/checkouts.json parity | `grep -c "trendUp\|trendDown\|trendFlat" apps/frontend/messages/en/checkouts.json` → 3 |
| M-11 | `pnpm --filter frontend run tsc --noEmit` exit 0 | tsc pass |
| M-12 | `error.heroKpi` 기존 키 유지 (HeroKPIError 미수정) | `grep "heroKpi" apps/frontend/messages/ko/checkouts.json \| grep "error"` → 1건 유지 |

## SHOULD Criteria

| ID | Criterion | Note |
|----|-----------|------|
| S-1 | ApprovalList.tsx에 파일-로컬 wrapper 컴포넌트(`ApprovalRowItem`)로 per-item 콜백 안정화 | React.memo 실효를 위한 완전 최적화 |
| S-2 | dep-audit job comments 정합성 유지 | 기존 주석 보존 |

## Files In Scope

```
apps/frontend/components/approvals/ApprovalRow.tsx
apps/frontend/components/approvals/ApprovalList.tsx
.github/workflows/main.yml
apps/frontend/components/checkouts/HeroKPI.tsx
apps/frontend/messages/ko/checkouts.json
apps/frontend/messages/en/checkouts.json
```

## Out of Scope

- HeroKPIError.tsx — `checkouts.error.heroKpi` 키와 분리된 네임스페이스이므로 미수정
- 다른 CI job의 cache 패턴 변경
- ApprovalList 부모 컴포넌트의 useCallback 적용
