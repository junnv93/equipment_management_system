# Evaluation Report: Inbound Overview Query SSOT

## 반복 #1 (2026-05-03T00:00:00+09:00)

## 계약 기준 대조
| 기준 | 판정 | 상세 |
|------|------|------|
| `checkout-filter-utils.ts`가 반입 overview API/queryKey에 사용할 쿼리 객체를 생성하는 SSOT 순수 함수를 제공 | PASS | `buildInboundOverviewQuery()`가 `statusFilter`, `searchTerm`, `limitPerSection`을 반환하는 순수 함수로 추가됨. 근거: `apps/frontend/lib/utils/checkout-filter-utils.ts:280` |
| `InboundCheckoutsTab.tsx`는 `statusFilter`/`searchTerm`/`limitPerSection` 조립을 직접 반복하지 않고 SSOT 함수를 사용 | PASS | 컴포넌트가 `useMemo(() => buildInboundOverviewQuery(filters), [filters])` 결과를 queryKey와 queryFn에 동일하게 전달함. 근거: `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx:95`, `:103`, `:104` |
| 명시 status 필터는 subTab 기본 상태 그룹보다 우선 | PASS | helper가 `filters.status !== 'all' ? filters.status : ...`로 명시 status를 우선함. 테스트도 `borrower_approved` 우선순위를 검증함. 근거: `apps/frontend/lib/utils/checkout-filter-utils.ts:284`, `apps/frontend/lib/utils/__tests__/checkout-filter-utils.test.ts:26` |
| `status='all'`이면 기존처럼 `SUBTAB_STATUS_GROUPS[subTab].join(',')`이 API statusFilter로 전달 | PASS | helper fallback이 `SUBTAB_STATUS_GROUPS[filters.subTab].join(',')`를 사용함. 기본 및 completed subTab 테스트가 검증함. 근거: `apps/frontend/lib/utils/checkout-filter-utils.ts:285`, `apps/frontend/lib/utils/__tests__/checkout-filter-utils.test.ts:9`, `:17` |
| 빈 검색어는 API query에서 `undefined`로 정규화되지만 queryKey 객체는 같은 SSOT 결과를 사용 | PASS | helper가 `searchTerm: filters.search || undefined`를 반환하고, 탭은 같은 `inboundOverviewQuery` 객체를 queryKey/queryFn에 사용함. 근거: `apps/frontend/lib/utils/checkout-filter-utils.ts:289`, `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx:103`, `:104` |
| `limitPerSection`은 `DEFAULT_PAGE_SIZE` 기본값을 하드코딩하지 않고 shared constants 기반으로 유지 | PASS | helper 기본 인자가 shared constants의 `DEFAULT_PAGE_SIZE`를 사용하고 테스트도 같은 constant를 기대함. 근거: `apps/frontend/lib/utils/checkout-filter-utils.ts:34`, `:282`, `apps/frontend/lib/utils/__tests__/checkout-filter-utils.test.ts:6` |
| focused frontend Jest가 새 helper의 기본/subTab/status/search/limit 동작을 검증 | PASS | `checkout-filter-utils.test.ts`가 기본 상태 그룹, completed subTab, 명시 status 우선, 빈 검색어, 검색어와 limit override를 검증함. 실행 결과: `pnpm --filter frontend test -- checkout-filter-utils.test.ts` PASS, 5 tests passed. |
| `pnpm --filter frontend run type-check` 에러 0 | PASS | 실행 결과 `tsc --noEmit` 종료 코드 0. |
| `pnpm --filter frontend run lint` 에러 0 | PASS | 실행 결과 `eslint .` 종료 코드 0. |

## SHOULD 기준 대조 (루프 차단 없음)
| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| 변경 범위는 checkout filter/query 조립에 한정하고 `apps/frontend/lib/errors/*` 계열은 수정하지 않는다 | WARN | 현재 worktree에는 `apps/frontend/lib/errors/*` 변경이 존재함: `equipment-errors.test.ts`, `calibration-errors.ts`, `equipment-errors.ts`, `user-errors.ts` 및 신규 error test 파일들. 다만 사용자 지시에 따라 이 slug의 평가 대상 파일에서 제외했고, 이 slug diff는 checkout filter/query 조립과 contract/registry에 한정됨. 별도 tech-debt 등록 없음. |
| review-architecture Critical 이슈 0개 | PASS | 변경은 SSOT helper 추출 및 동일 객체 재사용으로 제한됨. queryKey/queryFn 입력 불일치나 shared constant 우회 등 Critical architecture issue 없음. |
| `/checkouts?view=inbound` 런타임 렌더링은 별도 E2E 의존성이 없으면 focused unit/type/lint로 대체 가능 | PASS | 계약이 허용한 대체 경로로 focused Jest, type-check, lint를 실행했고 모두 PASS. |

## 전체 판정: PASS

필수 기준 9개 중 9개 PASS. 루프 재진입 필요 없음.

## 이전 반복 대비 변화
첫 평가라 해당 없음.

