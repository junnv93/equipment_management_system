---
slug: verify-route-metadata
sprint: verify-i18n-step8-automation-promotion
mode: 1
date: 2026-05-10
---

# Contract — verify-route-metadata

## Context

verify-i18n Step 8a/8b를 Phase 3 정적 분석 스크립트로 승격.
`apps/frontend/scripts/verify-route-metadata.mjs` 신설 + pre-push gate 통합.
i18n-checks.md Step 8 문서를 신규 스크립트 참조로 현행화.

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| M-1 | `node apps/frontend/scripts/verify-route-metadata.mjs` exits 0 | `echo $?` |
| M-2 | spec 9케이스 모두 PASS | `node --test scripts/__tests__/verify-route-metadata.spec.mjs` |
| M-3 | pre-push hook에 `route-map` step + `verify-route-metadata.spec.mjs` 포함 | `grep -c "route-map\|verify-route-metadata" .husky/pre-push` ≥ 2 |
| M-4 | `pnpm tsc --noEmit` exits 0 | `echo $?` |
| M-5 | i18n-checks.md Step 8 섹션이 `verify-route-metadata.mjs` 또는 `verify:route-metadata` 명령을 참조 | `grep -c "verify-route-metadata\|verify:route-metadata" .claude/skills/verify-i18n/references/i18n-checks.md` ≥ 1 |
| M-6 | Step 8c(orphan 탐지)가 SKILL/doc에 문서화됨 | `grep -c "step-8c\|orphan\|8c" .claude/skills/verify-i18n/references/i18n-checks.md` ≥ 1 |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S-1 | verify-i18n SKILL.md Step 8 설명이 Phase 3 자동화를 명시 |
