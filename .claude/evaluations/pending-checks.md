# Evaluation Report: Checkout Pending Checks

## 반복 #2 (2026-04-02T21:45:00+09:00)

**Branch:** `test/coverage-expand`
**Evaluator:** QA Agent (skeptical mode)
**Contract:** `.claude/contracts/pending-checks.md`
**이전 반복:** #1 — MUST FAIL 1건 (CheckoutQuery에 role 프로퍼티 누락 → 프론트엔드 빌드 실패)

---

## 계약 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| `pnpm --filter backend run tsc --noEmit` 에러 0 | **PASS** | 사전 확인 완료 (caller 제공) |
| `pnpm --filter frontend run tsc --noEmit` 에러 0 | **PASS** | 사전 확인 완료 (caller 제공) |
| `pnpm --filter backend run build` 성공 | **PASS** | 사전 확인 완료 (caller 제공) |
| `pnpm --filter frontend run build` 성공 | **PASS** | 사전 확인 완료 (caller 제공) |
| verify-implementation 전체 PASS | **PASS** | 아래 개별 verify 결과 참조. 모든 MUST 영역 통과 |
| `pnpm --filter backend run test` 기존 테스트 통과 | **PASS** | 37 suites, 454 tests 전체 통과. 실패 0건 |
| SSOT 준수: CheckoutStatus, CheckoutPurpose enum | **PASS** | 서비스: `CheckoutStatusValues as CSVal`, `CheckoutPurposeValues as CPVal` — `@equipment-management/schemas`에서 import. 프론트엔드: `FRONTEND_ROUTES`, `API_ENDPOINTS`, `Permission` — `@equipment-management/shared-constants`에서 import. 로컬 재정의 없음 |
| 하드코딩 없음: API 경로, queryKeys, 상수 | **PASS** | API 경로: `API_ENDPOINTS.CHECKOUTS.PENDING_CHECKS` 사용. 프론트엔드 경로: `FRONTEND_ROUTES.CHECKOUTS.CHECK(id)`, `FRONTEND_ROUTES.CHECKOUTS.PENDING_CHECKS` 사용. queryKeys: `queryKeys.checkouts.pending(role)` 팩토리 사용. 하드코딩된 경로/키 없음 |
| 서버 사이드 userId 추출 | **PASS** | Controller:121 `extractUserId(req)`, Controller:122 `req.user?.teamId`. Body에서 userId 수신 없음. `@RequirePermissions(Permission.VIEW_CHECKOUTS)` 적용됨 |
| URL searchParams가 필터 상태의 SSOT | **PASS** | `useSearchParams()` → `searchParams.get('role')` 읽기. `setRole()` → `router.push()` 로 URL 업데이트. `useState` 제거됨 (`useState` import 자체가 파일에서 사라짐, `useCallback` 으로 교체). 이중 관리 없음 |

---

## SHOULD 기준 대조

| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| review-architecture Critical 이슈 0개 | **PASS** | - 빌드/타입 에러 모두 해소됨 |
| 캐시 무효화 전략 검증 | **PASS** | - queryKey에 `role` 파라미터 포함하여 역할별 캐시 분리 정상. `CACHE_TIMES.SHORT` staleTime 적용 |
| Zod validation pipe 적용 (query DTO) | **FAIL** | 필요 — `getPendingChecks` 엔드포인트에 `@UsePipes` 없음. 컨트롤러의 다른 모든 GET/POST/PATCH 엔드포인트는 Zod ValidationPipe을 적용하지만 이 엔드포인트만 누락. `role` 쿼리 파라미터가 런타임에 검증되지 않아 `?role=admin` 같은 값이 else 브랜치로 진입 (보안상 안전하지만 API 계약 불일치). `page`/`pageSize`에 비숫자 문자열 전달 시 `NaN`이 Drizzle LIMIT/OFFSET으로 전달될 수 있음 |
| @AuditLog 데코레이터 적용 여부 | **PASS** | 조회 API이므로 선택적. 미적용 수용 가능 |
| i18n 키가 en/ko 양쪽에 등록 | **PASS** | `checkoutsPendingChecks` 키가 `en/navigation.json`, `ko/navigation.json` 양쪽 존재 |

---

## verify 스킬별 상세

### verify-ssot
- **PASS**: 모든 enum/상수가 SSOT 패키지에서 import. `CheckoutStatusValues`, `CheckoutPurposeValues` → `@equipment-management/schemas`. `Permission`, `API_ENDPOINTS`, `FRONTEND_ROUTES` → `@equipment-management/shared-constants`. `queryKeys` → `lib/api/query-config.ts`. 로컬 재정의 없음

### verify-hardcoding
- **PASS**: 변경된 모든 파일에서 하드코딩된 API 경로, queryKey, 상수 없음. `PendingChecksClient.tsx`에서 이전 하드코딩(`/checkouts/${checkout.id}/check`)이 `FRONTEND_ROUTES.CHECKOUTS.CHECK(checkout.id)`로 수정됨

### verify-auth
- **PASS**: `extractUserId(req)` 사용, `req.user?.teamId` 서버 사이드 추출. `@RequirePermissions(Permission.VIEW_CHECKOUTS)` 데코레이터 적용. Body에서 userId 수신 없음

### verify-frontend-state
- **PASS**: TanStack Query `useQuery` 사용. `useState` 완전 제거 (import 자체 없음). URL searchParams가 필터 SSOT. `queryKeys.checkouts.pending(apiRole)`로 역할별 캐시 키 분리

### verify-security
- **PASS** (minor concern): SQL injection 위험 없음 (Drizzle ORM 파라미터화). 접근 제어 `@RequirePermissions` 적용. `role` 파라미터 검증 미비는 보안 이슈가 아닌 입력 유효성 검증 이슈 (잘못된 값은 "all" 결과 반환, 권한 우회 불가)

### verify-sql-safety
- **PASS**: N+1 없음 — 2단계 쿼리 패턴 (ID + COUNT 먼저, relations 후속 조회). `COUNT(*) OVER()` window function 사용. JOIN + `with` 관계 로딩. 적절한 LIMIT/OFFSET 페이지네이션

### verify-i18n
- **PASS**: `en/navigation.json`에 `"checkoutsPendingChecks": "Pending Checks"`, `ko/navigation.json`에 `"checkoutsPendingChecks": "확인 필요"` 등록. 키 일치 확인 완료

### verify-nextjs
- 해당 변경에 `page.tsx` params/searchParams 변경 없음. `'use client'` 컴포넌트에서 `useSearchParams()` 정상 사용

---

## 전체 판정: PASS

MUST 기준 10건 전체 통과. SHOULD 기준 1건 실패 (Zod validation pipe 미적용) — tech-debt 등록 대상.

---

## 이전 반복 대비 변화

| 이슈 | 이전 판정 (반복 #1) | 현재 판정 (반복 #2) | 동일 이슈 연속? |
|------|---------------------|---------------------|-----------------|
| CheckoutQuery에 role 프로퍼티 누락 → 프론트엔드 빌드/타입 실패 | **FAIL** (MUST) | **PASS** — 전용 `PendingChecksQuery` 인터페이스 생성으로 해결 | 아니오 (수정됨) |
| Zod validation pipe 미적용 | **FAIL** (SHOULD) | **FAIL** (SHOULD) | 예 (2회 연속, SHOULD이므로 차단 없음) |
| generateMetadata 하드코딩 한국어 | INFO | 미확인 (변경 파일 범위 외) | - |

---

## 수정 지시 (SHOULD FAIL — tech-debt 등록)

### Tech-Debt 1: getPendingChecks query 파라미터 Zod 검증 누락

- **파일**: `apps/backend/src/modules/checkouts/checkouts.controller.ts:106-130`
- **문제**: `getPendingChecks` 엔드포인트에 `@UsePipes(ZodValidationPipe)` 없음. 동일 컨트롤러의 다른 14개 엔드포인트는 모두 Zod pipe 적용. 이 엔드포인트만 누락되어 패턴 불일치. `page`/`pageSize`에 비숫자 문자열 전달 시 `Number('abc')` = `NaN`이 Drizzle LIMIT/OFFSET으로 전달되는 잠재적 문제
- **영향**: 보안 위험 없음 (잘못된 role은 "all" 결과 반환, 권한 우회 불가). API 계약 일관성 이슈
- **권장 수정**: `PendingChecksQueryDto` Zod schema 생성 + `@UsePipes` 적용. `role`은 `z.enum(['lender', 'borrower']).optional()`, `page`/`pageSize`는 `z.coerce.number().int().positive().optional()`
- **우선순위**: Low — SHOULD 기준, 프로덕션 버그 가능성 낮음

---

## 추가 관찰 (코드 리뷰 레벨)

1. **CheckoutsContent.tsx의 pendingChecksCount 접근 경로**: `pendingChecksData?.meta?.pagination?.total ?? 0` — `transformPaginatedResponse`가 적용되므로 정상 작동. 올바른 접근 경로
2. **CheckoutsContent.tsx 구조 변경**: PageHeader actions 영역에서 `canCreateCheckout || canCreateImport` 조건부 렌더링이 제거되고 항상 `<div>` 렌더링으로 변경됨. pending checks 뱃지가 권한과 무관하게 표시되므로 합리적인 변경
3. **2단계 쿼리 패턴**: 서비스의 `getPendingChecks`는 ID 조회 → 관계 로딩 2단계 패턴을 사용. 기존 코드베이스 패턴과 일치하며 N+1 방지
