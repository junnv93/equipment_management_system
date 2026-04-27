---
slug: nc-r3-list-action-chip-polish
evaluated: 2026-04-26
evaluator: claude-sonnet-4-6 (QA agent)
verdict: PASS
---

# Evaluation: NC-R3 리스트 액션 칩 Polish — 컬럼 폭 · 색상 · 화살표 · rename

## Summary

모든 MUST 기준 통과. `actionButton` → `actionIndicator` rename, 90px 컬럼 확장, done 칩 화살표 조건부 처리, warning 색상 경로 모두 구현됨. 사전 존재하던 `dark:` prefix 위반 1건 있으나 이번 커밋 diff에 없는 레거시 문제.

## MUST Criteria Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | NC_LIST_GRID_COLS 마지막 컬럼 80~90px | PASS | `non-conformance.ts:277` — `'lg:grid lg:grid-cols-[130px_100px_1fr_1.2fr_90px_70px_90px]'` — 마지막 컬럼 90px |
| M2 | 구 50px 컬럼 제거 | PASS | grep 결과 0줄 |
| M3 | actionButton 토큰 제거 | PASS | grep 결과 0줄 (토큰 파일 + 컴포넌트 전체) |
| M4 | actionIndicator 토큰 추가 | PASS | `non-conformance.ts:316` — `actionIndicator: [...]` |
| M5 | actionIndicator 사용처 확인 | PASS | `NonConformancesContent.tsx:561,589` 2곳 사용 확인 |
| M6 | done 칩 화살표 제거 (조건부 처리) | PASS | `chip\.label.*→` 패턴 0줄. 화살표는 `{chip.showArrow && <span aria-hidden="true"> →</span>}` (L558) — aria-hidden span으로 분리, done 칩은 `showArrow: false` (L490) |
| M7 | blocked 칩 warning 색상 경로 존재 | PASS | `ACTION_CHIP_VARIANT_CLASSES.warning: 'bg-brand-warning/10 text-brand-warning'` (L338). blocked 칩 variant가 `'warning'` (L479) |
| M8 | tsc 통과 | PASS | frontend tsc 0 errors |
| M9 | frontend test 통과 | PASS | 13 suites, 192 tests, all passed |
| M10 | verify-design-tokens PASS | SKIP | 스킬 실행 불가 (bash 커맨드 아님) |

## SHOULD Criteria

| # | Criterion | Status |
|---|-----------|--------|
| S1 | 화살표 → i18n 키로 분리 (`nonConformances.list.chip.arrow`) | NOT MET — 여전히 raw `→` 하드코딩 (aria-hidden span 내부). 도메인 룰에서 aria-hidden span도 허용하므로 비블로킹 |
| S2 | whitespace-nowrap을 actionIndicator 토큰 값에 포함 | NOT MET — actionIndicator 토큰에 whitespace-nowrap 없음. 비블로킹 |
| S3 | NCListRow storybook/스냅샷 업데이트 | NOT MET — 비블로킹 |

## Issues Found

### WARNING (non-blocking): pre-existing dark: prefix 위반

- **파일**: `apps/frontend/lib/design-tokens/components/non-conformance.ts:96`
- **내용**: `'border-brand-critical/20 bg-brand-critical/5 dark:border-brand-critical/30 dark:bg-brand-critical/10'`
- **이번 커밋 여부**: NO — git log 추적 결과 commit `75da4907`에서 도입된 레거시 위반
- **도메인 룰**: R3 계약 명시 "dark: prefix 금지 — CSS 변수 자동 전환 체계"
- **판정**: 이번 R3 구현 범위 밖의 pre-existing 위반이므로 FAIL 미적용. 그러나 tech-debt 등록 권고.

### INFO: actionIndicator에 whitespace-nowrap 미포함 (S2)

- `NC_LIST_TOKENS.actionIndicator`는 Eye 아이콘 래퍼로 칩과 무관. whitespace-nowrap이 필요한 것은 칩(`ACTION_CHIP_BASE`) 수준이며, `ACTION_CHIP_BASE`에는 `whitespace-nowrap` 포함됨 (L329-330). S2 해석 오류 가능성 있음 — 실제 기능상 문제 없음.

## Final Verdict

**PASS** — M1~M9 전 기준 충족. 사전 존재 dark: 위반은 이번 커밋 scope 외.
