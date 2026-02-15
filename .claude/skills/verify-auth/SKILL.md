---
name: verify-auth
description: 서버 사이드 인증/인가 패턴 준수 여부를 검증합니다. 컨트롤러 엔드포인트 추가/수정 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 모듈명]'
---

# 서버 사이드 인증/인가 패턴 검증

## Purpose

백엔드 컨트롤러가 인증/인가 규칙을 올바르게 준수하는지 검증합니다:

1. **서버 사이드 userId 추출** — `req.user.userId`로 사용자 식별, Body에서 userId/approverId 수신 금지
2. **Permission Guard** — 변경(POST/PATCH/DELETE) 엔드포인트에 `@RequirePermissions()` 데코레이터 적용
3. **@AuditLog 데코레이터** — 상태 변경 엔드포인트에 감사 로그 데코레이터 적용
4. **@Public 데코레이터** — 인증 불필요 엔드포인트에만 사용

## When to Run

- 새로운 컨트롤러 엔드포인트를 추가한 후
- 승인/반려 로직을 수정한 후
- 권한 체계를 변경한 후
- 보안 관련 코드 리뷰 시

## Related Files

| File                                                                        | Purpose                                    |
| --------------------------------------------------------------------------- | ------------------------------------------ |
| `apps/backend/src/modules/auth/auth.controller.ts`                          | Auth 컨트롤러                              |
| `apps/backend/src/modules/auth/strategies/jwt.strategy.ts`                  | JWT 전략                                   |
| `apps/backend/src/common/guards/permissions.guard.ts`                       | Permission Guard                           |
| `apps/backend/src/common/decorators/audit-log.decorator.ts`                 | AuditLog 데코레이터                        |
| `apps/backend/src/modules/checkouts/checkouts.controller.ts`                | 참조 구현 (올바른 패턴)                    |
| `apps/backend/src/modules/calibration/calibration.controller.ts`            | 참조 구현                                  |
| `apps/backend/src/modules/non-conformances/non-conformances.controller.ts`  | 참조 구현                                  |
| `apps/backend/src/modules/settings/settings.controller.ts`                  | 설정 컨트롤러 (AuditLog entityIdPath 포함) |
| `apps/backend/src/modules/notifications/sse/notification-sse.controller.ts` | SSE 컨트롤러 (SseJwtAuthGuard 사용)        |
| `packages/shared-constants/src/permissions.ts`                              | Permission enum 정의                       |

## Workflow

### Step 1: Body에서 userId/approverId 수신 금지

클라이언트 요청 Body에서 userId나 approverId를 받는 패턴을 탐지합니다.

```bash
# Body에서 userId/approverId 수신 패턴 탐지
grep -rn "approverId\|reviewerId\|userId" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep -v "//\|Rule 2\|서버에서\|제외\|미포함"
```

**PASS 기준:** 상태 변경 DTO(approve-_, reject-_)에 approverId/userId 필드가 없어야 함.

**FAIL 기준:** DTO에 approverId/userId가 Zod schema 필드로 정의되어 있으면 위반.

```bash
# DTO의 Zod schema에서 approverId/userId 필드 정의 탐지
grep -rn "approverId:\|userId:" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep "z\.\|schema"
```

**위반:** Zod schema에 `approverId: z.string()` 등이 있으면 서버에서 추출하도록 변경 필요.

### Step 2: req.user.userId 서버 사이드 추출

승인/반려 컨트롤러 메서드에서 `@Request() req`를 통해 userId를 추출하는지 확인합니다.

```bash
# approve/reject 메서드에 @Request() req 사용 확인
grep -rn "approve\|reject" apps/backend/src/modules --include="*.controller.ts" -A 3 | grep -E "@Request|req\.user"
```

**PASS 기준:** 모든 approve/reject 메서드에 `@Request() req: AuthenticatedRequest` 파라미터가 있어야 함.

### Step 3: @RequirePermissions 적용 확인

변경(POST/PATCH/DELETE) 엔드포인트에 Permission Guard가 적용되어 있는지 확인합니다.

```bash
# POST/PATCH/DELETE 엔드포인트 중 @RequirePermissions가 없는 것 탐지
grep -rn "@Post\|@Patch\|@Delete" apps/backend/src/modules --include="*.controller.ts" -B 5 | grep -v "@RequirePermissions\|@Public\|test-login\|monitoring\|health"
```

**PASS 기준:** 모든 변경 엔드포인트에 `@RequirePermissions()` 또는 `@Public()` 데코레이터가 있어야 함.

**FAIL 기준:** 변경 엔드포인트에 두 데코레이터 모두 없으면 위반.

### Step 4: @AuditLog 데코레이터 확인

상태 변경 엔드포인트에 감사 로그가 기록되는지 확인합니다.

```bash
# approve/reject/delete 메서드에 @AuditLog 확인
grep -rn "approve\|reject\|delete\|dispose" apps/backend/src/modules --include="*.controller.ts" -B 5 | grep -E "@AuditLog|async (approve|reject|delete|dispose)"
```

**PASS 기준:** 상태 변경 메서드에 `@AuditLog()` 데코레이터가 있어야 함.

### Step 5: Permission import 소스 확인

Permission 값이 `@equipment-management/shared-constants`에서 import되는지 확인합니다.

```bash
# Permission import 소스 확인
grep -rn "import.*Permission" apps/backend/src/modules --include="*.controller.ts" | grep -v "@equipment-management/shared-constants"
```

**PASS 기준:** 0개 결과 (모든 Permission은 shared-constants에서 import).

**FAIL 기준:** 로컬 정의 또는 다른 패키지에서 import하면 위반.

## Output Format

```markdown
| #   | 검사                 | 상태      | 상세                 |
| --- | -------------------- | --------- | -------------------- |
| 1   | Body userId 금지     | PASS/FAIL | 위반 DTO 목록        |
| 2   | req.user.userId 추출 | PASS/FAIL | 누락 메서드 목록     |
| 3   | @RequirePermissions  | PASS/FAIL | 누락 엔드포인트 목록 |
| 4   | @AuditLog            | PASS/FAIL | 누락 메서드 목록     |
| 5   | Permission import    | PASS/FAIL | 잘못된 import 위치   |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **AuthController의 login/test-login** — 인증 전이므로 `@Public()` 사용이 정상
2. **MonitoringController의 health check** — `@Public()` 사용이 정상 (인증 불필요)
3. **GET 엔드포인트** — 읽기 전용이므로 `@RequirePermissions` 필수 아님 (단, JwtAuthGuard는 글로벌 적용)
4. **DTO의 주석 내 userId 언급** — 코드가 아닌 문서화 목적의 주석은 위반 아님
5. **DashboardController** — 통계 조회용 GET 엔드포인트는 Permission Guard 필수 아님
6. **NotificationSseController** — SSE 연결은 `SseJwtAuthGuard`로 query param token 인증 사용 (표준 Bearer 토큰과 다름)
7. **SettingsController의 GET 엔드포인트** — 설정 조회는 읽기 전용이므로 AuditLog 불필요
