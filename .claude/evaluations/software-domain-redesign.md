# Evaluation Report: 소프트웨어 도메인 재설계

## 반복 #3 (2026-04-04T18:15:00+09:00)

## 계약 기준 대조

| # | 기준 | 판정 | 상세 |
|---|------|------|------|
| 1 | `pnpm --filter backend run tsc --noEmit` 에러 0 | **PASS** | 출력 없음 (에러 0) |
| 2 | `pnpm --filter frontend run tsc --noEmit` 에러 0 | **PASS** | 출력 없음 (에러 0) |
| 3 | `pnpm --filter backend run build` 성공 | **PASS** | nest build 성공 |
| 4 | `pnpm --filter frontend run build` 성공 | **PASS** | Next.js 16.1.6 빌드 완료, /software 라우트 포함 |
| 5 | `pnpm --filter backend run test` 기존 테스트 통과 | **PASS** | 36 suites, 441 tests, 0 failures |
| 6 | equipment 테이블: softwareName/Type/Version 제거 | **PASS** | equipment.ts에 해당 컬럼 없음, firmwareVersion 유지 |
| 7 | equipment_test_software 중간 테이블 존재 | **PASS** | equipmentId+testSoftwareId FK, unique constraint, cascade 확인 |
| 8 | test_software → softwareValidations 역방향 relation | **PASS** | validations: many(softwareValidations) line 83 |
| 9 | /software FRONTEND_ROUTES 등록 | **PASS** | LIST/CREATE/DETAIL/VALIDATION 모두 등록 |
| 10 | nav-config.ts 사이드바 /software 항목 | **PASS** | Permission.VIEW_TEST_SOFTWARE, Monitor 아이콘 |
| 11 | grep softwareName/Type/Version = 0건 (test-software 제외) | **PASS** | 스키마/DTO/컴포넌트에서 0건 확인 |
| 12 | /software/create 페이지 존재 | **PASS** | CreateTestSoftwareContent + Suspense |

## SHOULD 기준 대조

| # | 기준 | 판정 | 비고 |
|---|------|------|------|
| S1 | review-architecture Critical 0 | DEFERRED | PR 리뷰 시 처리 |
| S2 | verify-ssot PASS | DEFERRED | PR 리뷰 시 처리 |
| S3 | verify-hardcoding PASS | DEFERRED | PR 리뷰 시 처리 |
| S4 | i18n 키 정리 완료 | **PASS** | fields.softwareVersion, softwareTab.softwareVersion 제거 완료 |

## Tech Debt (후속 PR)

1. equipment.json의 `softwareHistory.*` 블록 (lines ~1385-1434) — 구 소프트웨어 변경 다이얼로그 키, 코드에서 미참조이나 잔존
2. E2E 테스트 payload의 stale softwareVersion: `equipment.e2e-spec.ts:162`, `equipment-approval.e2e-spec.ts:222,606`

## 이전 반복 대비 변화

| 이슈 | 반복 #2 | 반복 #3 |
|------|---------|---------|
| i18n fields.softwareVersion | FAIL | **PASS** (제거됨) |
| i18n softwareTab.softwareVersion | FAIL | **PASS** (제거됨) |

## 전체 판정: **PASS**

필수(MUST) 12/12 PASS. SHOULD S4 PASS, S1-S3 DEFERRED.
