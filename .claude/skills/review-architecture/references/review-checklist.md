# Architecture Review Checklist

이 문서는 리뷰 스킬이 각 도메인별로 참조하는 상세 체크리스트입니다.

## Table of Contents

1. [계층 관통 추적](#1-계층-관통-추적)
2. [CAS 계층 일관성](#2-cas-계층-일관성)
3. [캐시 코히어런스](#3-캐시-코히어런스)
4. [보안 계층](#4-보안-계층)
5. [성능 안티패턴](#5-성능-안티패턴)
6. [모듈 간 패턴 일관성](#6-모듈-간-패턴-일관성)
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

- 새 DB 컬럼 추가 시: DTO에 반영? → API 응답에 포함? → 프론트엔드 타입에 반영?
- 새 상태 추가 시: DB enum? → Backend validation? → Frontend display mapping?
- 새 엔드포인트 추가 시: 권한 설정? → 감사 로그? → 프론트엔드 호출?

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

- body/query에서 userId 수신 (위조 가능)
- `@Public()` 남용 (인증 우회)
- Permission 없는 상태 변경 엔드포인트
- `@AuditLog()` 누락된 mutation 엔드포인트

---

## 5. 성능 안티패턴

### 백엔드

| 안티패턴 | 올바른 패턴 |
|---|---|
| Correlated subquery | JOIN + GROUP BY |
| N+1 쿼리 (루프 내 쿼리) | 배치 조회 후 매핑 |
| 불필요한 트랜잭션 (CAS 단일 테이블) | WHERE절 원자성 활용 |
| 전체 캐시 플러시 | 타겟 무효화 |
| 동기 이벤트 방출 | 비동기 or 에러 바운더리 |

### 프론트엔드

| 안티패턴 | 올바른 패턴 |
|---|---|
| useState로 서버 상태 관리 | TanStack Query |
| onSuccess에서 setQueryData | invalidateQueries |
| useEffect로 필터 리다이렉트 | page.tsx 서버 사이드 리다이렉트 |
| 무한 re-render (객체 의존성) | useMemo/useCallback, 원시값 의존성 |
| Client Component에서 데이터 fetch | Server Component → props 전달 |

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

- 새 에러 코드 추가 시: `ErrorCode` enum → `mapBackendErrorCode` 매핑 → `ERROR_MESSAGES` 한국어 메시지
- CAS 에러와 일반 에러 구분 처리
- 재시도 가능 에러(`isRetryableError`) 적절 분류
