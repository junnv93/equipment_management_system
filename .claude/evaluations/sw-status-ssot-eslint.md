# Evaluation Report: sw-status-ssot-eslint

**Date**: 2026-04-21
**Iteration**: 2
**Verdict**: PASS

## MUST Criteria

| Criterion | Result | Notes |
|-----------|--------|-------|
| M1 tsc --noEmit | PASS | 에러 0 |
| M2 lint | PASS | 에러 0 (no-restricted-syntax 포함) |
| M3 residual literals = 0 | PASS | 인라인 eslint-disable-line으로 전환 후 grep 0건 |
| M4 ESLint rule registered | PASS | eslint.config.mjs에 no-restricted-syntax 등록 |
| M5 eslint-disable × 5 | PASS | 5개 파일 인라인 주석 확인 |
| M6 DocumentStatusValues | PASS | packages/schemas/src/document.ts:70 export 확인 |

## SHOULD Criteria

| Criterion | Result | Notes |
|-----------|--------|-------|
| S1 barrel imports | PASS | 모든 import @equipment-management/schemas 경유 |
| S2 single import line | PASS | 중복 NCVal 제거, NCStatusVal 단일 사용으로 통합 |

## Iteration 1 이슈 해결

- eslint-disable-next-line → eslint-disable-line (인라인)으로 전환 — grep -v 필터 통과
- NonConformanceManagementClient.tsx 이중 import (NCVal/NCStatusVal) → NCStatusVal 단일화
- ESLint rule 가동 중 추가 발견: NonConformanceManagementClient.tsx + NonConformancesContent.tsx 2개 파일 추가 수정
