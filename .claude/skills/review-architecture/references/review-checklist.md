# Architecture Review Checklist

이 문서는 리뷰 스킬이 각 도메인별로 참조하는 상세 체크리스트입니다.

## Table of Contents

1. [계층 관통 추적](#1-계층-관통-추적)
2. [CAS 계층 일관성](#2-cas-계층-일관성)
3. [캐시 코히어런스](#3-캐시-코히어런스)
4. [보안 계층](#4-보안-계층)
5. [성능 안티패턴 + 확장성 판단](#5-성능-안티패턴--확장성-판단)
6. [모듈 간 패턴 일관성 + 로직 SSOT](#6-모듈-간-패턴-일관성)
7. [프론트엔드 상태 아키텍처](#7-프론트엔드-상태-아키텍처)
8. [에러 전파 체인](#8-에러-전파-체인)

---

## 1. 계층 관통 추적

변경된 파일이 속한 도메인(equipment, checkouts, calibration 등)을 식별하고, 해당 도메인의 전체 계층을 추적합니다.

### 추적 경로

```
DB Schema (packages/db)
  → Backend Service (modules/xxx/xxx.service.ts)
    → Backend Controller (modules/xxx/xxx.controller.ts)
      → Backend DTO (modules/xxx/dto/)
        → Frontend API Client (lib/api/*-api.ts)
          → Frontend Hook (hooks/use-*.ts)
            → Frontend Component (components/xxx/)
              → Frontend Cache (lib/api/cache-invalidation.ts)
```

### 확인 사항

- 새 DB 컬럼 추가 시: DTO에 반영? → API 응답에 포함? → 프론트엔드 타입에 반영? (한 계층이라도 누락되면 프론트엔드에서 undefined 접근 → 런타임 에러)
- 새 상태 추가 시: DB enum? → Backend validation? → Frontend display mapping? (display mapping 누락 시 새 상태가 "unknown"으로 표시)
- 새 엔드포인트 추가 시: 권한 설정? → 감사 로그? → 프론트엔드 호출? (프론트엔드 API 클라이언트 미연동 시 기능은 있지만 UI에서 접근 불가)

---

## 2. CAS 계층 일관성

CAS는 DB → Backend → Frontend → Error 전 계층을 관통하는 핵심 패턴입니다.

### CAS 적용 엔티티 (9개)

equipment, checkouts, calibrations, non_conformances, disposal_requests, equipment_imports, equipment_requests, software_history, calibration_plans

### 계층별 확인

**DB 계층:**
- `version` 컬럼이 integer, default 1로 정의?
- 인덱스 불필요 (WHERE절에서 PK와 함께 사용)

**Backend 계층:**
- Service가 `VersionedBaseService` 상속?
- `updateWithVersion()` 사용? (직접 UPDATE 금지)
- DTO에 `...versionedSchema` 포함?
- 409 응답에 `code: 'VERSION_CONFLICT'` + currentVersion/expectedVersion?
- CAS 실패 시 해당 엔티티 캐시 삭제?

**Frontend 계층:**
- mutation에서 version 필드 전송?
- `useOptimisticMutation` 사용?
- `onSuccess`에서 `setQueryData` 미사용? (TData ≠ TCachedData)
- VERSION_CONFLICT 에러 시 `invalidateQueries`로 서버 재검증?
- 승인/반려 등 상태 전이 액션에서 CAS version은 **항상 최신 detail을 조회**하여 사용? (리스트 캐시의 stale version 사용 금지 — 다단계 승인에서 VERSION_CONFLICT 유발)

### CalibrationPlans 특이사항

`version`이 아닌 `casVersion`을 사용 (version은 계획서 개정 이력 추적용). 이것은 의도적 설계이며 위반이 아님.

---

## 3. 캐시 코히어런스

### Backend 캐시

- `SimpleCacheService`: LRU 5000, TTL 기반
- `CacheInvalidationHelper`: 교차 엔티티 무효화
- `CACHE_KEY_PREFIXES`: 중앙 관리 상수

### 확인 포인트

1. **상태 변경 시 캐시 무효화 누락**: 장비 상태 변경 → 대시보드 캐시도 무효화?
2. **CAS 실패 시 캐시 삭제**: 409 catch에서 detail 캐시 삭제 필수 (stale cache → 무한 409)
3. **교차 엔티티 무효화**: 부적합 생성 → 장비 캐시 + 대시보드 캐시 무효화
4. **캐시 무효화 범위**: 전체 플러시 vs 타겟 무효화 (과도한 무효화는 성능 저하)

### Frontend 캐시

- `queryKeys` 팩토리: 중앙 관리
- `CACHE_TIMES`: SHORT(30s), MEDIUM(2min), LONG(5min), REFERENCE(30min)
- `EquipmentCacheInvalidation`, `DashboardCacheInvalidation`: 정적 메서드

### 확인 포인트

1. 새 query 추가 시 `queryKeys`에 등록?
2. mutation 성공 시 관련 query 무효화?
3. 적절한 staleTime 프리셋 사용?

---

## 4. 보안 계층

### 인증/인가 체인

```
JWT Token (HttpOnly Cookie)
  → JwtAuthGuard (Global)
    → @RequirePermissions(Permission.XXX)
      → PermissionsGuard
        → req.user.userId (서버 추출)
```

### 위반 패턴

- body/query에서 userId 수신 → 클라이언트가 다른 사용자의 ID를 전송하여 타인 명의로 작업 가능
- `@Public()` 남용 → 인증 없이 접근 가능한 엔드포인트가 늘어나면 공격 표면 확대
- Permission 없는 상태 변경 엔드포인트 → 인증만 되면 모든 역할이 관리자 기능에 접근 (시험실무자가 교정계획 승인 등)
- `@AuditLog()` 누락된 mutation 엔드포인트 → 데이터 변경 이력 미추적 → UL-QP-18 감사 요구사항 위반

---

## 5. 성능 안티패턴 + 확장성 판단

### 5a: 즉시 수정이 필요한 안티패턴

#### 백엔드

| 안티패턴 | 올바른 패턴 | Why |
|---|---|---|
| Correlated subquery | JOIN + GROUP BY | 메인 쿼리 행마다 서브쿼리 실행 — 장비 N대면 N번 서브쿼리. Drizzle에서 0 반환 버그도 있음 |
| N+1 쿼리 (루프 내 쿼리) | 배치 조회 후 Map 매핑 | 10건 조회 후 각각 관계 조회 → 11쿼리. 배치로 2쿼리로 축소 |
| 불필요한 트랜잭션 (CAS 단일 테이블) | WHERE절 원자성 활용 | UPDATE ... WHERE version=? 자체가 원자적. 트랜잭션은 커넥션 홀드 시간만 증가 |
| 전체 캐시 플러시 | 타겟 무효화 | 동시 사용자 전원의 다음 요청이 DB 직접 조회 → 순간 부하 급증 |
| 동기 이벤트 방출 | 비동기 or 에러 바운더리 | 핸들러 실패 → 요청 크래시. 핵심 로직 성공했는데 알림 실패로 500 반환 |
| COUNT without DISTINCT (fan-out JOIN) | COUNT(DISTINCT id) | 다:1 JOIN에서 count(id)하면 item 수만큼 카운트 뻥튀기 |
| RBAC scope에 LEFT JOIN | INNER JOIN (scope 컬럼 기준) | NULL 행이 scope 조건을 우회하여 다른 사이트 데이터 노출 가능 |

#### 프론트엔드

| 안티패턴 | 올바른 패턴 | Why |
|---|---|---|
| useState로 서버 상태 관리 | TanStack Query | 캐시 무효화, 백그라운드 리패치, 에러 재시도 모두 수동 구현 필요 |
| onSuccess에서 setQueryData | invalidateQueries | TData와 TCachedData 타입 불일치 75% — 서버 데이터를 클라이언트가 추측하면 stale 표시 |
| useEffect로 필터 리다이렉트 | page.tsx 서버 사이드 리다이렉트 | 클라이언트 리다이렉트는 깜빡임 + SEO 불이익 + 초기 렌더링 후 URL 변경 |
| 무한 re-render (객체 의존성) | useMemo/useCallback, 원시값 의존성 | useEffect 의존성에 객체 리터럴 → 매 렌더링마다 새 참조 → 무한 루프 |
| Client Component에서 데이터 fetch | Server Component → props 전달 | 불필요한 JS 번들 증가 + 클라이언트 워터폴 (컴포넌트 로드 → fetch 시작) |
| Navigate-Before-Invalidate | invalidation → navigation in onSuccess | 네비게이션 후 캐시 무효화하면 대상 페이지에서 stale 데이터 표시 |

### 5b: 확장성 판단 (아키텍처 수준)

현재 데이터 규모에서는 문제없지만, 증가 시 병목이 될 수 있는 패턴을 사전 식별합니다. 즉시 수정이 아닌 Info/Warning 수준으로 보고합니다.

| 확인 항목 | 판단 기준 | 위험 신호 |
|---|---|---|
| JOIN 체인 깊이 | 3개 이상 JOIN 체인 | 데이터 증가 시 실행 계획 급격 악화. 필요한 관계만 선택적 JOIN 고려 |
| SELECT 범위 | `SELECT *` 또는 모든 컬럼 조회 | 목록 페이지에서 불필요한 blob/text 컬럼까지 조회. projection 적용 필요 |
| 페이지네이션 | LIMIT/OFFSET 없는 전체 조회 | 데이터 1000→10000 증가 시 응답 시간 선형 증가 |
| 캐시 TTL 적절성 | staleTime과 데이터 변경 빈도 불일치 | 거의 변하지 않는 데이터에 SHORT(30s) → 불필요한 리패치. 자주 변하는 데이터에 REFERENCE(30min) → stale 표시 |
| 캐시 무효화 범위 | 한 건 수정에 10개 이상 캐시 무효화 | 동시 사용자 多 시 캐시 히트율 급락 → DB 부하 급증 |
| 배치 처리 | 루프 내 개별 API 호출 | 10건 승인에 10 API 호출. 배치 엔드포인트 제공 고려 |

---

## 6. 모듈 간 패턴 일관성

### 골드 스탠다드 모듈

각 패턴의 모범 구현:

| 패턴 | 참고 모듈 | 핵심 파일 |
|---|---|---|
| CAS + 캐시 무효화 | equipment | `equipment.service.ts` |
| 1-step 승인 | checkouts | `checkouts.service.ts` |
| 3-step 승인 | calibration-plans | `calibration-plans.service.ts` |
| 이벤트 방출 | checkouts | `checkouts.service.ts` |
| 복합 쿼리 빌더 | equipment | `equipment.service.ts` (QueryConditions) |
| 캐시 키 상수 | software | `software.service.ts` (CACHE_KEYS) |

### 일관성 확인

- 새 모듈이 기존 유사 모듈의 패턴을 따르는가?
- 동일 도메인 내에서 다른 패턴 사용 시 합리적 이유가 있는가?
- 컨트롤러 반환 타입 명시 여부

### 로직 수준 SSOT

verify-ssot이 "import 소스"를, verify-hardcoding이 "값 하드코딩"을 검사한다면, 이 섹션은 "이미 존재하는 로직을 다시 작성하지 않았는가"를 확인합니다. 같은 비즈니스 로직이 두 곳에 존재하면 한쪽만 수정될 때 시스템 전반에 불일치가 발생합니다.

| 확인 항목 | 왜 중요한가 | 확인 방법 |
|---|---|---|
| 캐시 무효화 인라인 작성 | 다른 모듈이 같은 엔티티 변경 시 이 인라인 무효화가 누락됨 | `CacheInvalidationHelper`에 해당 메서드 존재 여부 확인 |
| 에러 응답 직접 생성 | 에러 형식이 `GlobalExceptionFilter`의 표준과 불일치할 수 있음 | `AppError` 또는 기존 에러 팩토리 패턴 재사용 여부 |
| 상태 전이 검증 인라인 | 같은 상태 전이 규칙이 분산되면 한쪽 변경 시 다른 쪽이 stale | 기존 모듈의 상태 전이 패턴과 비교 |
| 새 enum 값 추가 시 기존 분기 미갱신 | 기존 switch/if-else가 새 값을 처리하지 않으면 default에 빠져 예상 외 동작 | 해당 enum을 사용하는 모든 분기 확인 |
| 프론트엔드 API 호출 직접 작성 | `*-api.ts` 클라이언트에 이미 존재하는 함수를 중복 작성하면 엔드포인트 변경 시 한쪽만 갱신 | 해당 도메인의 API 클라이언트 파일 확인 |

---

## 7. 프론트엔드 상태 아키텍처

### 상태 분류

| 상태 유형 | 관리 방식 | 예시 |
|---|---|---|
| 서버 상태 | TanStack Query | 장비 목록, 상세, 통계 |
| URL 상태 | searchParams | 필터, 페이지, 정렬 |
| 폼 상태 | React Hook Form | 입력값, 유효성 |
| UI 상태 | useState | 모달 열림, 탭 선택 |

### 위반 패턴

- `useState`로 서버 데이터 캐싱 → TanStack Query 사용
- `useState`로 필터 관리 → URL searchParams가 SSOT
- `useEffect`로 서버 리다이렉트 → page.tsx에서 서버 사이드 처리
- `queryKey` 인라인 배열 → `queryKeys` 팩토리 사용

---

## 8. 에러 전파 체인

### 정상 체인

```
Backend throw ConflictException({ code: 'VERSION_CONFLICT', ... })
  → GlobalExceptionFilter: code 필드 보존
    → Frontend ApiError: response.code 추출
      → mapBackendErrorCode('VERSION_CONFLICT')
        → EquipmentErrorCode.VERSION_CONFLICT
          → ERROR_MESSAGES[VERSION_CONFLICT] (한국어)
            → useOptimisticMutation.onError: toast + invalidateQueries
```

### 확인 포인트

- 새 에러 코드 추가 시: `ErrorCode` enum → `mapBackendErrorCode` 매핑 → `ERROR_MESSAGES` 한국어 메시지 (매핑 누락 시 사용자에게 "알 수 없는 오류" 표시 → 해결 방법 제시 불가)
- CAS 에러와 일반 에러 구분 처리 (VERSION_CONFLICT는 "다른 사용자가 수정했습니다. 새로고침하세요"라는 구체적 안내 필요 — 일반 에러와 동일 처리 시 사용자 혼란)
- 재시도 가능 에러(`isRetryableError`) 적절 분류 (네트워크 에러는 재시도 가능, 권한 에러는 재시도 불가 — 잘못 분류하면 불필요한 재시도 또는 복구 가능한 에러 방치)
