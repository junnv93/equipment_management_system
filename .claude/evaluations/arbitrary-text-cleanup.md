---
slug: arbitrary-text-cleanup
date: 2026-04-22
evaluator: QA Agent (skeptical)
verdict: PASS
---

# Evaluation: arbitrary text-[Npx] 제거

## MUST Criteria 결과

| # | 기준 | 결과 | 근거 |
|---|------|------|------|
| 1 | `pnpm tsc --noEmit` 오류 0건 | **PASS** | 출력 없음(exit 0) |
| 2 | 처리 대상 파일에 `text-[10px]`, `text-[11px]`, `text-[11.5px]`, `text-[12.5px]`, `text-[13px]`, `text-[15px]` 잔여 0건 | **PASS** | `lib/design-tokens/components/` 전체 grep 결과 없음 |
| 3 | `--text-sm-wide: 0.9375rem` globals.css에 존재 | **PASS** | `globals.css:116` 확인 |
| 4 | `MICRO_TYPO.siteTitle = 'text-sm-wide'` semantic.ts에 존재 | **PASS** | `semantic.ts:355` 확인 |
| 5 | 모든 대체에 `${MICRO_TYPO.*}` 또는 `text-xs` 사용 | **PASS** | 8개 대상 파일 모두 MICRO_TYPO import 및 template literal 사용 확인 |
| 6 | display 예외(`5rem`, `56px`) dashboard.ts에 보존 | **PASS** | `dashboard.ts:278` text-[5rem], `dashboard.ts:319` text-[56px] 유지 |

## SHOULD Criteria 결과

| 기준 | 결과 | 근거 |
|------|------|------|
| display 예외(5rem/56px) 유지 | **PASS** | 위 MUST #6과 동일 |
| 기존 import에 MICRO_TYPO 추가 (별도 import 라인 최소화) | **PASS** | 모든 파일에서 기존 import 라인에 MICRO_TYPO 추가 형태 확인 (별도 import 라인 없음) |

## 잔여 arbitrary 사이즈 전수 확인

`lib/design-tokens/components/` 내 `text-[N px]` 패턴 전체 grep 결과:

```
dashboard.ts:278: counterSize: 'text-[5rem] md:text-[8rem] lg:text-[10rem]'  ← 정상 예외
dashboard.ts:319: heroCount: '... text-[56px] ...'                           ← 정상 예외
```

대상 6개 크기(`10px`, `11px`, `11.5px`, `12.5px`, `13px`, `15px`) 잔여 없음.

## primitives.ts 3-layer 체인 확인

- `globals.css:116`: `--text-sm-wide: 0.9375rem; /* 15px */` — CSS 변수 정의
- `primitives.ts:190`: `'sm-wide': { mobile: 15, desktop: 15 }` — primitive 토큰
- `semantic.ts:355`: `siteTitle: 'text-sm-wide'` — MICRO_TYPO 시맨틱 토큰

체인 완전함.

## 파일별 MICRO_TYPO 적용 현황

| 파일 | import | 사용 건수(최소) |
|------|--------|----------------|
| team.ts | 있음 | 15 |
| settings.ts | 있음 | 8 |
| approval.ts | 있음 | 5 |
| equipment.ts | 있음 | 4 |
| sidebar.ts | 있음 | 2 |
| calibration-plans.ts | 있음 | 1 |
| mobile-nav.ts | 있음 | 1 |
| software.ts | 있음 | 1 |

## 총평

모든 MUST 기준 통과. 잔여 arbitrary 크기 없음. 3-layer chain 완전히 구축됨. tsc 0 에러. display 예외 보존. 계약 조건 전부 충족.
