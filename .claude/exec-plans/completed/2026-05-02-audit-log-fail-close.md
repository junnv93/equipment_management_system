# Audit Log Fail-Close — Guard/AppError 보안 이벤트 audit_logs 자동 기록

## 메타
- 생성: 2026-05-02
- Slug: `audit-log-fail-close`
- 모드: Mode 2 (Full Harness)
- 예상 변경: 신규 4 + 수정 5 = 9 파일
- 선행 sprint: `error-codes-ssot-system-wide` (완료, 2026-05-02)

---

## 설계 철학

현재 `AuditInterceptor.tap.error`는 Handler-level ForbiddenException(403)만 `access_denied`로 audit_logs에 기록한다. 다음 두 시나리오는 **미감사**:

1. **Guard-level 403** — `PermissionsGuard.canActivate()` throw → NestJS 실행 순서상 Interceptor 우회 → ExceptionFilter 직행 → `tap.error` 미실행
2. **Handler-level fail-close AppError(400)** — `AppError` 인스턴스는 `HttpException`이 아니므로 `isForbiddenError()` false → 미감사 (e.g. `DisposalRejectCommentRequired`, `CalibrationPlanInvalidStatusForReject`)

본 sprint는:
- `GlobalExceptionFilter`에 `APP_FILTER` provider DI 패턴 적용 + `AuditService` 주입
- `SECURITY_AUDITABLE_CODES` ErrorCode SSOT 상수로 보안 감사 대상 선별
- `request.__auditLogged` 플래그로 Handler-level double-audit 방지
- `extractEntityIdFromParams` private → 공유 유틸로 추출

---

## 아키텍처 결정

| ID | 결정 | 근거 |
|----|------|------|
| D1 | dedup: `request.__auditLogged` 플래그 (Option A) | Guard/Handler 양쪽 구분 없이 interceptor가 먼저 마킹 → filter는 플래그 있으면 skip. 동일 request 객체 공유 보장 |
| D2 | `GlobalExceptionFilter` DI 전환 — `APP_FILTER` provider 등록 | `app.useGlobalFilters(new ...)` → DI 불가. `APP_FILTER` + `@Injectable()` 로 AuditService 주입 가능 |
| D3 | `SECURITY_AUDITABLE_CODES: ReadonlySet<ErrorCode>` SSOT 상수 분리 | `security-auditable-codes.ts` — filter + interceptor 양쪽 import. 단일 지점 갱신 |
| D4 | `extractEntityIdFromParams` → `audit-entity-id.util.ts` 유틸 추출 | interceptor private → export 재사용. UUID v4 검증 + SYSTEM_USER_UUID sentinel 동일 패턴 |
| D5 | AuditAction 신규 도입 안 함 — `'access_denied'` SSOT 재사용 | enum에 이미 등록, frontend 라벨/필터 회귀 방지. `details.additionalInfo.errorCode`로 세분 식별 |
| D6 | filter audit → fire-and-forget (`.catch(logger.error)`) | audit 실패가 응답 차단 금지. 기존 interceptor 패턴 일치 |
| D7 | AppError.code 접근 — `exception.code` (not `exception.errorCode`) | AppError 생성자: `this.code = code`. filter에서 `(exception as AppError).code`로 접근 |
| D8 | UnauthorizedException(401) audit — 본 sprint scope OUT | login 경로는 AuditService.handleAuthFailed 이벤트 리스너가 cover. 글로벌 401은 운영 데이터 수집 후 별도 sprint |

---

## NestJS 실행 순서 (검증 완료)

```
Middleware
→ Guards (JwtAuthGuard → PermissionsGuard → InternalApiThrottlerGuard)
    → throw → ExceptionFilter (Interceptor 우회 ← 이게 현재 갭)
→ Interceptors.intercept() 진입
→ Pipes
→ Handler
→ Interceptors.tap.next/error (← Handler-level 에러 여기서 감사)
→ ExceptionFilter (← 모든 에러 도달, dedup 플래그로 중복 방지)
```

---

## SECURITY_AUDITABLE_CODES 분류

### 포함 (보안 감사 필요)
권한 우회/scope 침해 (403):
- `Forbidden`, `PermissionDenied`, `ScopeAccessDenied`, `CannotSelfApprove`
- `FormHistoryDownloadForbidden`, `RevocationWindowExpired`
- `DisposalTeamScopeOnly`, `DisposalOnlyRequesterCanCancel`

인증/토큰 이상 (401):
- `InvalidCredentials`, `SessionExpired`
- `HandoverTokenInvalid`, `HandoverTokenExpired`, `HandoverTokenConsumed`

fail-close FSM 위반 (400 — defense-in-depth bypass 차단):
- `DisposalRejectCommentRequired`
- `CalibrationPlanRejectionReasonRequired`, `CalibrationPlanInvalidStatusForReject`
- `CalibrationPlanInvalidStatusForSubmit`, `CalibrationPlanOnlyApprovedCanConfirm`
- `CalibrationPlanOnlyApprovedCanCreateVersion`, `CalibrationPlanOnlyDraftCanDelete`
- `CalibrationPlanOnlyDraftCanUpdate`, `CalibrationPlanOnlyDraftCanUpdateItem`
- `CalibrationPlanOnlyPendingReviewCanReview`, `CalibrationPlanOnlyPendingApprovalCanApprove`
- `CalibrationPlanItemNotExecuted`, `CalibrationPlanNonExportableStatus`
- 7 도메인 RejectionReasonRequired (`EquipmentImport`, `Calibration`, `CalibrationFactor`, `SoftwareValidation`, `IntermediateInspection`, `SelfInspection`, `NonConformance`)

### 제외 (운영 노이즈)
- 유효성: `BadRequest`, `ValidationError`, `RequiredFieldMissing`, `InvalidData`, `InvalidFormat`, `InvalidDate`
- 리소스 없음: `*NotFound`, `*AlreadyExists`, `Duplicate*`
- 낙관적 잠금: `VersionConflict`, `Conflict`, `CheckoutAlreadyApproved`, `CheckoutNotPending`
- 파일: `FileTooLarge`, `InvalidFileType`, 기타 파일 에러
- 장비 비즈니스: `EquipmentNotAvailable`, `EquipmentAlreadyAssigned`, `EquipmentMaintenance`
- 시스템: `InternalServerError`, `NetworkError`, `TimeoutError`, `ServiceUnavailable`
- 요금 제한: `TooManyRequests` (별도 telemetry)
- 비즈니스 충돌: `DisposalAlreadyInProgress`, `CalibrationOverdue`, `NonConformanceNotOpen`, `CalibrationPlanAlreadyExists`

---

## Phase 1: SSOT 상수 + 유틸 분리 (~30분)

### F1-1. `apps/backend/src/common/constants/security-auditable-codes.ts` (신규)

**WHAT**:
- `ErrorCode` import (`@equipment-management/schemas`)
- `SECURITY_AUDITABLE_CODES: ReadonlySet<ErrorCode>` export — 위 분류 기준 코드만 포함
- 주석에 분류 기준 (권한/FSM/scope/인증/fail-close) 명시
- 운영 노이즈 제외 근거 주석

### F1-2. `apps/backend/src/common/utils/audit-entity-id.util.ts` (신규)

**WHAT**:
- `extractAuditEntityId(request)` — params(uuid > id > entityId) UUID v4 검증, 실패 시 `undefined`
- `resolveAuditEntityIdWithSentinel(request)` — 반환: `{ entityId: string, entityName?: string, useSentinel: boolean }`
  - uuid 있으면 `{ entityId: uuid, useSentinel: false }`
  - 없으면 `{ entityId: SYSTEM_USER_UUID, entityName: '${method} ${path}', useSentinel: true }`
- `inferEntityTypeFromPath(request)` — path segment 기반 entityType 추론 (`'/api/equipment/:uuid'` → `'equipment'`)
- 의존: `SYSTEM_USER_UUID` (`../../database/utils/uuid-constants`)
- UUID_REGEX는 파일 내 로컬 상수로 정의 (interceptor에서 복사)
- `AuthenticatedRequest` 타입 사용 (`../../types/auth`)

### F1-3. `apps/backend/src/common/interceptors/audit.interceptor.ts` (수정)

**WHAT** (수술적 변경 — 최소):
1. `extractEntityIdFromParams()` private 메서드 제거 → `extractAuditEntityId()` 유틸 호출로 교체
2. `logAccessDeniedAsync()` 첫 줄에 `(request as Record<string, unknown>).__auditLogged = true` 마킹
3. `createDefaultMetadata()` 의 entityType 추론 → `inferEntityTypeFromPath()` 유틸 호출
4. UUID_REGEX local 상수 제거 (유틸로 이동)

**기존 동작 invariant 유지** — 회귀 0.

**검증**: `tsc --noEmit` + `audit.interceptor.spec.ts` PASS

---

## Phase 2: GlobalExceptionFilter DI + audit 통합 (~1h)

### F2-1. `apps/backend/src/common/filters/error.filter.ts` (수정)

**WHAT**:
1. `@Injectable()` 데코레이터 추가
2. 생성자: `constructor(private readonly auditService: AuditService)` 추가
3. `catch()` 메서드 내 각 분기의 `return response.status(...).json(...)` 직전에
   `this.maybeAuditSecurityEvent(exception, request, errorResponse)` 호출 (fire-and-forget)
4. `private maybeAuditSecurityEvent(exception, request, errorResponse)` private 메서드:
   - `(request as Record<string, unknown>).__auditLogged === true` 면 즉시 return (dedup)
   - `errorResponse.code` 가 `SECURITY_AUDITABLE_CODES` 미포함이면 return
   - `void this.logFilterAuditAsync(exception, request, errorResponse).catch(this.logger.error.bind(this.logger))`
5. `private async logFilterAuditAsync(...)`:
   - `resolveAuditEntityIdWithSentinel(request)` 로 entityId 결정
   - `inferEntityTypeFromPath(request)` 로 entityType 결정
   - `details.additionalInfo`: `{ errorCode: errorResponse.code, httpStatus, path, triggeredBy: 'global-filter', ...(sentinel 시 entityIdSentinel: true) }`
   - `auditService.create({ action: 'access_denied', ... })` await

**응답 본문 변경 0** — 기존 4-way 분기 (AppError / ZodError / HttpException / unknown) invariant 유지.

### F2-2. `apps/backend/src/main.ts` (수정)

**WHAT**:
- `app.useGlobalFilters(new GlobalExceptionFilter())` 한 줄 **제거**
- `GlobalExceptionFilter` import 제거 (더 이상 직접 사용 안 함)

### F2-3. `apps/backend/src/app.module.ts` (수정)

**WHAT**:
- `import { APP_FILTER } from '@nestjs/core'` 추가 (기존 `APP_GUARD, APP_INTERCEPTOR`와 합산)
- `import { GlobalExceptionFilter } from './common/filters/error.filter'` 추가
- `providers: [...]` 에 추가:
  ```typescript
  {
    provide: APP_FILTER,
    useClass: GlobalExceptionFilter,
  }
  ```
- `AuditModule`이 `@Global()` 이므로 별도 imports 추가 불필요 (검증 완료)

**검증**: 부팅 로그에서 `GlobalExceptionFilter` 정상 등록 확인.

---

## Phase 3: 테스트 (~1.5h)

### F3-1. `apps/backend/src/common/utils/__tests__/audit-entity-id.util.spec.ts` (신규)

**WHAT** (케이스):
1. `extractAuditEntityId`: valid uuid v4 params.uuid → 추출
2. `extractAuditEntityId`: formNumber 등 non-UUID → undefined
3. `extractAuditEntityId`: params 없음 → undefined
4. `extractAuditEntityId`: uuid 우선 (uuid > id > entityId 순서)
5. `resolveAuditEntityIdWithSentinel`: extracted 있으면 `{ useSentinel: false }` + 원본 uuid
6. `resolveAuditEntityIdWithSentinel`: 없으면 `{ useSentinel: true, entityId: SYSTEM_USER_UUID, entityName }`
7. `inferEntityTypeFromPath`: `/api/equipment/:uuid` → `'equipment'`
8. `inferEntityTypeFromPath`: `/api/calibration-plans/:uuid/items` → 마지막 비변수 segment

### F3-2. `apps/backend/src/common/interceptors/audit.interceptor.spec.ts` (수정 — 케이스 추가)

**WHAT** (신규 케이스만):
1. Handler-level ForbiddenException 후 `request.__auditLogged === true` 마킹 확인
2. AppError(code: DisposalRejectCommentRequired, 400) — interceptor는 audit 안 함 (403 외)
   → filter 책임임을 주석으로 명시

**기존 케이스 회귀 없음**.

### F3-3. `apps/backend/src/common/filters/__tests__/error.filter.spec.ts` (신규)

**WHAT** (케이스):
1. Guard-level ForbiddenException + valid UUID params + `__auditLogged` 없음 → `auditService.create` 1회, action: `access_denied`, entityId: VALID_UUID, triggeredBy: `global-filter`
2. dedup: `__auditLogged === true` + ForbiddenException → `auditService.create` 0회, 응답 정상 반환
3. fail-close AppError (DisposalRejectCommentRequired, 400) + `__auditLogged` 없음 → `auditService.create` 1회, `details.additionalInfo.errorCode: 'DISPOSAL_REJECT_COMMENT_REQUIRED'`
4. 운영 노이즈 NotFoundException → `auditService.create` 0회
5. VersionConflict (409) AppError → `auditService.create` 0회 (명시적 SECURITY_AUDITABLE_CODES 미포함)
6. `auditService.create()` rejects → 응답 정상 반환, `Logger.error` 1회 호출
7. non-UUID params (formNumber) → SYSTEM_USER_UUID sentinel + path entityName, `details.additionalInfo.entityIdSentinel: true`

---

## 검증 명령어 (Generator 체크리스트)

```bash
# Phase 1 완료 후
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- audit-entity-id.util.spec
pnpm --filter backend run test -- audit.interceptor.spec

# Phase 2 완료 후
pnpm --filter backend run tsc --noEmit

# Phase 3 완료 후
pnpm --filter backend run test -- error.filter.spec
pnpm --filter backend run test -- audit-entity-id.util.spec
pnpm --filter backend run test

# 전체 백엔드 회귀
pnpm --filter backend run test
```

---

## 변경 파일 목록

### 신규 (4)
1. `apps/backend/src/common/constants/security-auditable-codes.ts`
2. `apps/backend/src/common/utils/audit-entity-id.util.ts`
3. `apps/backend/src/common/utils/__tests__/audit-entity-id.util.spec.ts`
4. `apps/backend/src/common/filters/__tests__/error.filter.spec.ts`

### 수정 (5)
1. `apps/backend/src/common/filters/error.filter.ts` — DI + audit 통합
2. `apps/backend/src/common/interceptors/audit.interceptor.ts` — `__auditLogged` 플래그 + 유틸 위임
3. `apps/backend/src/common/interceptors/audit.interceptor.spec.ts` — 신규 케이스 보강
4. `apps/backend/src/main.ts` — `useGlobalFilters` 라인 제거
5. `apps/backend/src/app.module.ts` — `APP_FILTER` provider 등록

---

## Out of Scope

- UnauthorizedException(401) 글로벌 audit — 별도 sprint
- AuditAction enum 신규 추가 — `'access_denied'` SSOT 재사용
- Throttler 429 audit — 운영 데이터 수집 후 결정
- ZodError audit — `ValidationError` 운영 노이즈
- 도메인 서비스 코드 수정 — 인프라 레이어 sprint
- frontend 코드 변경

---

## 다른 세션 침범 금지

```
apps/frontend/lib/utils/calibration-status.ts   ← READ 금지
apps/frontend/next-env.d.ts                     ← READ 금지
.claude/settings.local.json                     ← READ 금지
apps/frontend/components/inspections/*          ← READ 금지
```

도메인 서비스 파일 (`*.service.ts`, `*.controller.ts`) 전부 수정 금지.

---

## 리스크 완화

| 리스크 | 완화 |
|--------|------|
| filter DI 전환 시 부팅 순서 → AuditService 미초기화 | `AuditModule.@Global()` 검증 완료. 부팅 단계 예외는 NestFactory가 cover |
| `request.__auditLogged` 플래그 충돌 | grep으로 사전 검증. 충돌 시 Symbol로 격상 |
| SECURITY_AUDITABLE_CODES 누락 코드 | error.filter.spec에서 명시적 케이스로 검증 |
| audit_logs INSERT 폭증 (probing) | 의도된 동작. 정상 사용자는 guard throw 없음 |
