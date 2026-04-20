---
name: verify-auth
description: Verifies server-side authentication/authorization pattern compliance — req.user.userId extraction (no body userId), @RequirePermissions decorator, @AuditLog decorator, JwtAuthGuard coverage. Run after adding/modifying controller endpoints.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 모듈명]'
---

# 서버 사이드 인증/인가 패턴 검증

## Purpose

백엔드 컨트롤러가 인증/인가 규칙을 올바르게 준수하는지 검증합니다:

1. **서버 사이드 userId 추출** — `req.user.userId`로 사용자 식별, Body에서 userId 수신 금지
2. **Permission Guard** — 변경 엔드포인트에 `@RequirePermissions()` 데코레이터 적용
3. **@AuditLog 데코레이터** — 상태 변경 엔드포인트에 감사 로그 데코레이터 적용
4. **@Public 데코레이터** — 인증 불필요 엔드포인트에만 사용

## When to Run

- 새로운 컨트롤러 엔드포인트를 추가한 후
- 승인/반려 로직을 수정한 후
- 권한 체계를 변경한 후

## Related Files

| File | Purpose |
|---|---|
| `apps/backend/src/modules/auth/guards/permissions.guard.ts` | Permission Guard |
| `apps/backend/src/modules/auth/decorators/permissions.decorator.ts` | @RequirePermissions() |
| `apps/backend/src/common/decorators/audit-log.decorator.ts` | AuditLog 데코레이터 |
| `apps/backend/src/types/auth.ts` | SSOT: JwtUser, AuthenticatedRequest 타입 |
| `apps/backend/src/database/utils/uuid-constants.ts` | SYSTEM_USER_UUID |
| `apps/backend/src/common/utils/enforce-site-access.ts` | 크로스 사이트 접근 제어 |
| `packages/shared-constants/src/permissions.ts` | Permission enum |

## Workflow

### Step 1: Body에서 userId/approverId 수신 금지

상태 변경 DTO에 approverId/userId 필드가 정의되어 있지 않은지 확인합니다.
**PASS:** DTO에 approverId/userId 없음. **FAIL:** Zod schema에 정의되어 있으면 위반.

상세: [references/auth-checks.md](references/auth-checks.md) Step 1

### Step 2: req.user.userId 서버 사이드 추출

approve/reject 메서드에서 `@Request() req: AuthenticatedRequest`를 통해 userId를 추출하는지 확인.
**PASS:** 모든 approve/reject에 req 파라미터 존재. **FAIL:** 누락 메서드.

상세: [references/auth-checks.md](references/auth-checks.md) Step 2

### Step 3: @RequirePermissions 적용 확인

POST/PATCH/DELETE 엔드포인트에 Permission Guard가 적용되어 있는지 확인합니다.
**PASS:** 모든 변경 엔드포인트에 데코레이터 존재. **FAIL:** 누락.

상세: [references/auth-checks.md](references/auth-checks.md) Step 3

### Step 4: @AuditLog 데코레이터 확인

상태 변경 엔드포인트에 감사 로그가 기록되는지 확인합니다.
**PASS:** 상태 변경 메서드에 @AuditLog 존재. **FAIL:** 누락.

상세: [references/auth-checks.md](references/auth-checks.md) Step 4

### Step 5~10: 추가 인증/인가 검증

| Step | 검증 대상 |
|---|---|
| 5 | JwtUser 필드 접근 패턴 (레거시 user.id/user.role 사용 금지) |
| 6 | Permission import 소스 (shared-constants에서만) |
| 7 | @SkipAudit() 올바른 사용 (POST/PATCH/DELETE에 사용 금지) |
| 8 | SYSTEM_USER_UUID 사용 (비-UUID 문자열 하드코딩 금지) |
| 9 | AuthenticatedRequest 옵셔널 파라미터 탐지 |
| 10 | enforceSiteAccess() 뮤테이션 엔드포인트 적용 |

상세: [references/auth-checks.md](references/auth-checks.md) Step 5~10

## Output Format

```markdown
| #   | 검사                        | 상태      | 상세                            |
| --- | --------------------------- | --------- | ------------------------------- |
| 1   | Body userId 금지            | PASS/FAIL | 위반 DTO 목록                   |
| 2   | req.user.userId 추출        | PASS/FAIL | 누락 메서드 목록                |
| 3   | @RequirePermissions         | PASS/FAIL | 누락 엔드포인트 목록            |
| 4   | @AuditLog                   | PASS/FAIL | 누락 메서드 목록                |
| 5   | JwtUser 필드 접근           | PASS/FAIL | 레거시 필드 사용 위치           |
| 6   | Permission import           | PASS/FAIL | 잘못된 import 위치              |
| 7   | @SkipAudit() 오용           | PASS/FAIL | POST/PATCH/DELETE에 사용된 위치 |
| 8   | SYSTEM_USER_UUID 사용       | PASS/FAIL | UUID 컬럼에 비-UUID 하드코딩    |
| 9   | AuthenticatedRequest 옵셔널 | PASS/FAIL | req?: 또는 req!. 사용 위치      |
| 10  | enforceSiteAccess 적용      | PASS/FAIL | 누락 mutation 컨트롤러          |
| 11  | 라우트 선언 순서            | PASS/FAIL | 정적 sub-path 가 /:param 뒤에 선언된 위치 |
| 12  | assertIndependentApprover   | PASS/FAIL | 승인 워크플로우 모듈 approve() 미적용 목록 |
| 13  | FE role 리터럴 직접 비교   | PASS/WARN | URVal.* 직접 비교로 Permission 우회하는 액션 게이트 위치 |
```

### Step 11: 라우트 선언 순서 검증

동일 prefix 아래에 정적 sub-path (`/reorder`, `/upload-csv`, `/bulk`, `/search`, `/counts`)와
파라미터 path (`/:sectionId`, `/:id`)가 공존할 때, **정적 경로가 파라미터 경로보다 먼저 선언**되어야 한다.
NestJS Express 어댑터는 데코레이터 선언 순서대로 라우트를 등록하므로, 역순이면 `"reorder"` 같은
리터럴이 `ParseUUIDPipe` 에 UUID 로 파싱되어 즉시 400 Bad Request 를 반환한다.

**탐지 방법:**
```bash
# 컨트롤러 파일에서 같은 prefix 의 정적/파라미터 라우트 쌍 탐지
grep -n "@(Get|Post|Patch|Delete|Put)(" apps/backend/src/modules/**/*.controller.ts \
  | grep -E "/:.*/" \
  | # 같은 prefix 의 정적 경로가 파라미터 경로 뒤(더 큰 라인 번호)에 나오면 WARN
```

**PASS:** 정적 라우트가 파라미터 라우트 앞에 선언되어 있음.
**FAIL:** `@Patch(':uuid/result-sections/:sectionId')` 뒤에 `@Patch(':uuid/result-sections/reorder')` 가 선언됨.

**배경:** 2026-04-12 harness evaluator 1차 FAIL 사유. `feedback_nest_route_order.md` 영구화.

### Step 13: 프론트엔드 Permission 우회 — role 리터럴 직접 비교 탐지 (2026-04-20 추가)

프론트엔드 컴포넌트에서 `useAuth().can(Permission.*)` 대신 `userRole === URVal.*` 형태로 role을 직접 비교하면,
Permission 체계가 변경되거나 역할이 추가될 때 해당 가드가 자동으로 반영되지 않아 권한 누락 위험이 있다.

**탐지 명령어:**
```bash
# userRole === URVal.* 또는 role === 'ROLE_NAME' 리터럴 비교 탐지
grep -rn "userRole\s*===\s*URVal\.\|role\s*===\s*['\"]QUALITY_MANAGER\|role\s*===\s*['\"]LAB_MANAGER\|role\s*===\s*['\"]SYSTEM_ADMIN\|role\s*===\s*['\"]TECHNICAL_MANAGER" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "// \|spec\."
```

**PASS:** 0건이거나, 표시 전용 UI 분기(Permission 게이트가 아닌 레이블/아이콘 변경)에 한정.
**WARN:** `canReview`, `canApprove` 같은 액션 게이트가 role 리터럴 비교로 결정되면 Permission SSOT 우회.

**올바른 패턴:**
```typescript
// ❌ 경계선 — role 리터럴이 액션 게이트를 결정
const canReview = isPendingReview && (userRole === URVal.QUALITY_MANAGER || userRole === URVal.LAB_MANAGER);

// ✅ 권장 — Permission SSOT 경유
const canReview = isPendingReview && can(Permission.REVIEW_CALIBRATION_PLAN);
```

**예외:** URVal 상수를 통한 비교(`URVal.QUALITY_MANAGER`)는 문자열 리터럴 직접 사용보다 낫지만,
Permission 게이트용이라면 `can()` 패턴으로 교체를 권장. WARN 수준으로 처리하고 즉각 FAIL은 아님.

**배경:** `ApprovalTimeline.tsx:63` `canReview = isPendingReview && (isQualityManager || isLabManager || isSystemAdmin)` — URVal 상수 경유이나 Permission SSOT 우회 (2026-04-20 review-architecture 발견).
참고 파일: `apps/frontend/components/calibration-plans/ApprovalTimeline.tsx`

### Step 12: assertIndependentApprover 적용 확인 (ISO 17025 §6.2.2)

승인 워크플로우가 있는 모듈의 `approve()` 서비스 메서드에서 `assertIndependentApprover` (또는 인라인 동등 검사)가 적용되어 있는지 확인합니다.

```bash
# 승인 워크플로우 모듈 서비스에서 approve 메서드 파악
grep -rn "async approve(" \
  apps/backend/src/modules/calibration-plans \
  apps/backend/src/modules/intermediate-inspections \
  apps/backend/src/modules/equipment-imports \
  apps/backend/src/modules/self-inspections \
  apps/backend/src/modules/software-validations \
  --include="*.service.ts"

# 위 파일들에 assertIndependentApprover 임포트 존재 확인
grep -rn "assertIndependentApprover" \
  apps/backend/src/modules/calibration-plans \
  apps/backend/src/modules/intermediate-inspections \
  apps/backend/src/modules/equipment-imports \
  apps/backend/src/modules/self-inspections \
  apps/backend/src/modules/software-validations \
  --include="*.service.ts"
```

**PASS:** approve()가 있는 각 서비스 파일에 `assertIndependentApprover` 임포트가 존재하거나 인라인 동등 검사(`if (submittedBy === approverId) throw ForbiddenException`)가 있어야 함.
**FAIL:** approve()가 있으나 독립성 검사가 전혀 없는 서비스 파일.

**배경:** ISO/IEC 17025 §6.2.2 인원 독립성 요구. 공통 헬퍼: `apps/backend/src/common/guards/assert-independent-approver.ts`

## Exceptions

다음은 **위반이 아닙니다**:

1. **AuthController의 login/test-login** — 인증 전이므로 `@Public()` 정상
2. **MonitoringController의 health check** — `@Public()` 정상
3. **MetricsController (`src/common/metrics/`)** — Prometheus 스크래핑용 `@Public()` + `@Get()` 정상
4. **GET 엔드포인트** — 읽기 전용이므로 `@RequirePermissions` 필수 아님
5. **DTO의 주석 내 userId 언급** — 문서화 목적
6. **DashboardController** — 통계 조회용 GET
7. **NotificationSseController** — `SseJwtAuthGuard` 별도 가드 사용 정상
8. **SettingsController의 GET** — 읽기 전용, AuditLog 불필요
9. **AuditController** — 읽기 전용 (GET만 존재)
10. **UsersController의 `@SkipPermissions()` PATCH** — 본인 설정만 변경하므로 정상
11. **TestAuthController** — 개발/테스트 전용, 프로덕션 미등록
12. **UsersController의 `POST/DELETE me/signature`** — `@SkipPermissions()` + `@AuditLog` + `req.user.userId` 추출, 본인 서명만 변경하므로 정상
13. **UsersController의 `POST sync`** — `@InternalServiceOnly()` 가드 전용 엔드포인트. JWT 인증 불필요, `@RequirePermissions` 불필요. `@AuditLog` 적용됨 (행위자는 `Anonymous User`/시스템으로 기록 — 의도된 설계)
