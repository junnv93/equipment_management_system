---
slug: tech-debt-batch-0430e
iteration: 2
verdict: PASS
date: 2026-04-30
---

## Summary

tech-debt-batch-0430e 3개 항목 모두 MUST 기준 통과. Iteration 1에서 계약 과명세(M4 approvals list 5건 mock) + 경로 오타(M6) 수정 후 Iteration 2에서 7/7 MUST PASS 판정.

## MUST Criteria Results

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| M1 tsc | PASS | `pnpm --filter frontend tsc --noEmit` 0 errors |
| M2 SSOT .map() 교체 | PASS | 4개 배열 모두 schemas import + .map() 사용. hardcoded value 문자열 0건 |
| M3 dateFormat 렌더링 정확성 | PASS | `DATE_FORMAT_EXAMPLE`/`DATE_FORMAT_I18N_KEY` 로컬 상수 존재. ko/en i18n 키 정상 |
| M4 Step 8 bulk-reject mock | PASS | `page.route('**/api/checkouts/bulk-reject')`, rejected 배열, `/건이 반려되었습니다/` toast, `finally page.unroute()` |
| M5 Step 9 부분 실패 | PASS | partial mock `{ rejected: slice(0,1), failed: slice(1) }`, `/건 반려 완료.*건 실패/` toast |
| M6 legacy-sw spec 신설 | PASS | 파일 존재, auth fixture `../../shared/fixtures/auth.fixture` 경로 정확, TC-01/02/03 모두 구현 |
| M7 import paths | PASS | `toast-helpers` + `auth.fixture` 경로 모두 실제 파일 존재 확인 |

## SHOULD Notes

- **S1 build**: 정적 분석 PASS. `t()` 호출 4개 모두 `as Parameters<typeof t>[0]` 캐스트 일관성 확보 (dateFormat 캐스트 추가 완료).
- **S4 verify-implementation**: 새 verify 스텝 추가 없음 — tech-debt-tracker SHOULD로 등록하지 않음 (SSOT 교체 패턴은 기존 verify-ssot Step에서 커버).

## Issues Found

없음 — Iteration 1 FAIL 2건은 계약 오타/과명세로 계약 수정으로 해소.

## Post-merge Actions

- 완료 3건 → `tech-debt-tracker-archive.md`로 이동 완료
- contract → `.claude/contracts/completed/` 이동 완료
- git commit + push
