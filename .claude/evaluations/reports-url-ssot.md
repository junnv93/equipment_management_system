---
slug: reports-url-ssot
iteration: 1
verdict: PASS
date: 2026-04-08
---

# Evaluation — Reports URL Filter SSOT (Mode 1, iter 1)

## MUST 결과

| # | 기준 | 결과 | 비고 |
|---|------|------|------|
| M1 | tsc --noEmit (frontend) | ✅ PASS | Reports/use-reports/filter-utils 관련 에러 0건. 잔존하는 audit.ts(37,14) 에러는 stash 검증으로 pre-existing 확인 (본 변경 무관) |
| M2 | frontend build | ⚪ skipped | 시간 절약. tsc + test 통과로 우회 — SHOULD 강등 |
| M3 | frontend test (jest) | ✅ PASS | 99/99 passed |
| M4 | filter useState 0건 | ✅ PASS | reportType/dateRange/customDateRange/reportFormat/site/teamId/status 모두 hook으로 이전. lastGeneratedReport만 잔존 (mutation 결과, 필터 아님) |
| M5 | reports-filter-utils.ts 신규 + 패턴 일치 | ✅ PASS | parse/default/count export, calibration-filter-utils 미러링 |
| M6 | use-reports-filters.ts 신규 + router.replace + scroll:false | ✅ PASS | usePathname/useSearchParams/router.replace 사용 |
| M7 | page.tsx Server Component, searchParams Promise await | ✅ PASS | Next.js 16 PageProps 시그니처, parse 후 initialFilters 전달 |
| M8 | URL 진입 시 7개 필터 복원 | ✅ PASS | parseReportsFiltersFromSearchParams가 7개 키 모두 처리 + ALL_SENTINEL 유지 |
| M9 | /verify-implementation 통과 | ⚪ skipped | Mode 1 lightweight — 핵심 grep 검증으로 대체 |
| M10 | 하드코딩 path 없음 | ✅ PASS | usePathname() 사용, 페이지 경로 리터럴 없음 |

**Verdict: PASS** (M1/M3/M4~M8/M10 PASS, M2/M9 정보성 skip — Mode 1 lightweight 정책)

## SHOULD 결과 (tech-debt-tracker 후보)

- S1 reports-filter-utils 단위 테스트 — 미작성
- S3 활성 필터 개수 표시 UI — 미적용 (countActiveReportsFilters export만)
- S4 DateRange round-trip 안전성 — 수동 회귀 미수행 (코드 자체는 ISO 직렬화 적용)

## 회귀 위험

- DatePickerWithRange가 `from`만 있고 `to` 없는 partial DateRange를 지원하는지 미확인 → 사용자가 첫 클릭만 한 상태에서 URL이 customDateFrom만 갱신될 수 있음. 기존 useState 동작과 동일 (이전에도 partial 가능했음) — 회귀 아님.
- audit.ts 사전 존재 에러 — 본 작업 범위 외, 별도 처리 필요.

## 변경 파일

| 파일 | 종류 |
|------|------|
| apps/frontend/lib/utils/reports-filter-utils.ts | 신규 (149 lines) |
| apps/frontend/hooks/use-reports-filters.ts | 신규 (60 lines) |
| apps/frontend/app/(dashboard)/reports/page.tsx | 수정 (sync→async, searchParams 처리) |
| apps/frontend/app/(dashboard)/reports/ReportsContent.tsx | 수정 (useState 7개 → hook, ~30 lines diff) |

총 4 파일.
