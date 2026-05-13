---
slug: z-sticky-ssot-extension
title: --z-sticky CSS Variable SSOT Extension (sticky-header-css-var-ssot S-4)
mode: 1
date: 2026-05-13
---

## Context

`bulk-action-bar.ts`가 이미 `z-[var(--z-sticky,20)]`을 사용하지만,
`globals.css :root`에 `--z-sticky` 정의가 없고 `CSS_VAR_NAMES`에 `zSticky` entry가 없어
fallback `20`에만 의존하는 불완전한 SSOT 상태.

## Scope

변경 대상:
1. `apps/frontend/lib/design-tokens/css-variables.ts` — `zSticky` entry 추가
2. `apps/frontend/styles/globals.css` — `--z-sticky: 20` :root 정의 추가
3. `apps/frontend/lib/design-tokens/components/bulk-action-bar.ts` — SSOT 주석 갱신
4. `apps/frontend/lib/design-tokens/components/equipment.ts` — `z-20` → `z-[var(--z-sticky,20)]` 마이그레이션

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| M-1 | `CSS_VAR_NAMES.zSticky: '--z-sticky'` entry 추가 | `grep "zSticky.*--z-sticky" apps/frontend/lib/design-tokens/css-variables.ts` |
| M-2 | `globals.css :root`에 `--z-sticky: 20` 정의 존재 | `grep "\-\-z-sticky: 20" apps/frontend/styles/globals.css` |
| M-3 | `bulk-action-bar.ts` SSOT 주석이 `CSS_VAR_NAMES.zSticky` 참조 | `grep "CSS_VAR_NAMES.zSticky" apps/frontend/lib/design-tokens/components/bulk-action-bar.ts` |
| M-4 | `equipment.ts:782` `z-20` → `z-[var(--z-sticky,20)]` 마이그레이션 | `grep "z-\[var(--z-sticky" apps/frontend/lib/design-tokens/components/equipment.ts` |
| M-5 | `pnpm --filter frontend tsc --noEmit` EXIT 0 | tsc 실행 |
| M-6 | `pnpm --filter frontend build` EXIT 0 | build 실행 |
| M-7 | `--z-sticky` fallback 값 `20`이 `ELEVATION_PRIMITIVES.zIndex.dropdown`과 일치 | primitives.ts 확인 (dropdown: 20) |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S-1 | `css-variables.ts` JSDoc에 Producer/Consumer 목록 포함 |
| S-2 | `globals.css` 주석이 SSOT 참조 설명 포함 |
| S-3 | `equipment.ts` SSOT 주석 추가 |
