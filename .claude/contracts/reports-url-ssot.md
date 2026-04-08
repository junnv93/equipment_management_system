---
slug: reports-url-ssot
mode: 1
created: 2026-04-08
target: Reports 페이지 7개 useState 필터 → URL searchParams SSOT 전환
---

# Contract — Reports URL Filter SSOT

## 배경

`apps/frontend/app/(dashboard)/reports/ReportsContent.tsx:65-71` 에서 reportType, dateRange,
customDateRange, reportFormat, site, teamId, status 7개 필터가 모두 `useState` 로 관리되고 있어
CLAUDE.md "Filter SSOT (URL 파라미터가 유일한 진실의 소스)" 원칙을 위반. 사용자가 보고서 조합을
북마크/공유 불가능. 다른 list 페이지(equipment, calibration, checkouts 등)는 모두 URL SSOT 패턴으로
구현되어 있어 크로스 페이지 일관성도 깨짐.

기존 패턴 (재사용 SSOT):
- `lib/utils/calibration-filter-utils.ts` (parse / convert / count / default)
- `hooks/use-calibration-filters.ts` (URL ↔ state, router.replace, scroll:false)
- 서버 컴포넌트는 page.tsx 에서 searchParams 파싱 후 initial filter 전달

## MUST 기준 (모두 PASS여야 통과)

| # | 기준 | 검증 명령 |
|---|------|-----------|
| M1 | `pnpm tsc --noEmit` 통과 (전 패키지) | `pnpm tsc --noEmit` |
| M2 | `pnpm --filter frontend run build` 통과 | (Next 16 build) |
| M3 | `pnpm --filter frontend run test` 통과 | (jest) |
| M4 | `ReportsContent.tsx` 에서 필터 관련 `useState` 호출 0건 (lastGeneratedReport 제외) | `grep -n useState ReportsContent.tsx` → reportType/dateRange/customDateRange/reportFormat/site/teamId/status 부재 |
| M5 | 신규 파일 `lib/utils/reports-filter-utils.ts` 생성, parse/convert/count/default export 패턴이 calibration-filter-utils.ts 와 동일 구조 | 파일 존재 + export 시그니처 |
| M6 | 신규 hook `hooks/use-reports-filters.ts` 생성, useRouter + useSearchParams + router.replace(scroll:false) 패턴 | 파일 존재 |
| M7 | `app/(dashboard)/reports/page.tsx` 가 Server Component 로 searchParams Promise 를 await 하여 ReportsContent 에 initialFilters 전달 (Next.js 16 PageProps 패턴) | page.tsx 시그니처 |
| M8 | URL 진입 시 7개 필터 전부가 URL 에서 복원됨 (ReportsContent 의 ALL_SENTINEL 처리 유지) | code review |
| M9 | `/verify-implementation` PASS (특히 verify-filters, verify-frontend-state, verify-nextjs, verify-ssot) | skill 실행 |
| M10 | 하드코딩된 query key/URL path 없음 — 페이지 경로는 `/reports` 상수 또는 `usePathname()` 사용 | grep |

## SHOULD 기준 (실패해도 루프 차단 안 함, tech-debt-tracker 기록)

| # | 기준 |
|---|------|
| S1 | filter-utils 단위 테스트 추가 (calibration-filter-utils.test.ts 패턴 참조) |
| S2 | `review-architecture` 신규 위반 0건 |
| S3 | 활성 필터 개수 표시 UI 추가 (다른 페이지 패턴) |
| S4 | DateRange custom 의 from/to 가 ISO 문자열로 URL 직렬화/역직렬화 round-trip 안전 |

## 비기능 제약 (Behavioral Guidelines)

- **수술적 변경**: ReportsContent 의 JSX/스타일/i18n key/디자인 토큰 변경 금지. 상태 관리 라인만 교체.
- **최소 코드**: 다른 페이지가 안 쓰는 추상화 만들지 말 것. calibration-filter-utils 의 구조를 그대로 미러링.
- **lastGeneratedReport 는 useState 유지** — 일회성 mutation 결과이지 필터가 아님.
- **브랜치 금지** — main 직접 작업 (사용자 명시).

## 변경 영향 범위 (예상)

| 파일 | 종류 |
|------|------|
| `apps/frontend/lib/utils/reports-filter-utils.ts` | 신규 |
| `apps/frontend/hooks/use-reports-filters.ts` | 신규 |
| `apps/frontend/app/(dashboard)/reports/page.tsx` | 수정 (Server Component 로 searchParams 처리) |
| `apps/frontend/app/(dashboard)/reports/ReportsContent.tsx` | 수정 (useState 7개 → hook) |

총 4 파일. Mode 1 적정 범위.

## 회귀 시나리오

1. `/reports` 진입 → 기본 상태 (reportType 비어 있음, dateRange=last_month, format=excel)
2. reportType 선택 → URL 에 `?reportType=equipment_inventory` 반영
3. site 선택 → URL 갱신, 동시에 teamId 초기화 (handleSiteChange 동작 보존)
4. 페이지 새로고침 → 모든 필터 복원
5. URL 직접 입력 (`?reportType=team_equipment&site=SUWON&teamId=...`) → 진입 즉시 해당 상태
6. 보고서 생성 버튼 동작 회귀 (lastGeneratedReport 표시)
