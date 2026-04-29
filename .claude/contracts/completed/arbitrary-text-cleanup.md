---
slug: arbitrary-text-cleanup
created: 2026-04-22
mode: 1
---

# Contract: arbitrary text-[Npx] 제거

## Scope
design-tokens/components/ 내 ~37건 arbitrary text-[Npx] 제거.
MICRO_TYPO 3-layer 체인(globals.css → primitives.ts → semantic.ts) 준수.

## MUST Criteria

1. `pnpm --filter frontend run tsc --noEmit` 오류 0건
2. `pnpm --filter frontend run build` 성공
3. 처리 대상 파일에 `text-[10px]`, `text-[11px]`, `text-[11.5px]`, `text-[12.5px]`, `text-[13px]`, `text-[15px]` 잔여 0건
4. 신규 CSS 변수 `--text-sm-wide` globals.css에 존재
5. MICRO_TYPO.siteTitle = `'text-sm-wide'` semantic.ts에 존재
6. 모든 대체에 `${MICRO_TYPO.*}` template literal 또는 직접 `text-xs` 사용

## SHOULD Criteria

- display 예외(5rem/56px) 유지
- 기존 import에 MICRO_TYPO 추가 (별도 import 라인 최소화)

## Size Mapping

| arbitrary | → token | 근거 |
|-----------|---------|------|
| text-[10px] badge/code context | `${MICRO_TYPO.badge}` | 10px = text-2xs |
| text-[10px] label/section context | `${MICRO_TYPO.label}` | 10px = text-2xs |
| text-[11px] | `${MICRO_TYPO.meta}` | 11px = text-xs-tight |
| text-[11.5px] | `${MICRO_TYPO.meta}` | round 0.5px, imperceptible |
| text-[12.5px] | `text-xs` | round 0.5px, imperceptible |
| text-[13px] | `${MICRO_TYPO.detail}` | 13px = text-sm-tight |
| text-[15px] | `${MICRO_TYPO.siteTitle}` | 신규 text-sm-wide 토큰 |
