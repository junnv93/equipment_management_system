# 스프린트 계약: audit-log-fail-close

## 생성 시점
2026-05-02

## Slug
`audit-log-fail-close`

## Mode
2 (Full Harness)

## Plan
`.claude/exec-plans/active/2026-05-02-audit-log-fail-close.md`

---

## Goal

Guard-level 403 (`PermissionsGuard.canActivate()` throw) 와 fail-close AppError (e.g. `DisposalRejectCommentRequired`, `CalibrationPlanInvalidStatusForReject`) 를 `audit_logs` DB에 자동 기록한다. 현재 두 시나리오는 GlobalExceptionFilter의 `logger.error()` 만 남기고 audit_logs 미기록이라 cross-site probing / fail-close defense-in-depth 시도의 SQL 분석 불가. AuditInterceptor의 기존 Handler-level 403 audit 동작은 보존하면서 double-audit 없이 통합한다.

---

## Scope

### IN
- `apps/backend/src/common/filters/error.filter.ts`
- `apps/backend/src/common/interceptors/audit.interceptor.ts`
- `apps/backend/src/main.ts`
- `apps/backend/src/app.module.ts`
- `apps/backend/src/common/constants/security-auditable-codes.ts` (신규)
- `apps/backend/src/common/utils/audit-entity-id.util.ts` (신규)
- `apps/backend/src/common/utils/__tests__/audit-entity-id.util.spec.ts` (신규)
- `apps/backend/src/common/filters/__tests__/error.filter.spec.ts` (신규)
- `apps/backend/src/common/interceptors/audit.interceptor.spec.ts` (보강)

### OUT
- UnauthorizedException(401) 글로벌 audit
- AuditAction enum 신규 추가
- 도메인 서비스/컨트롤러 코드
- frontend 코드

---

## MUST 기준

### M-1. tsc 0 errors

```bash
pnpm --filter backend run tsc --noEmit
```
**Expected**: exit 0

---

### M-2. backend test 전체 PASS (기존 + 신규)

```bash
pnpm --filter backend run test
```
**Expected**: exit 0, 신규 테스트 파일 모두 PASS

---

### M-3. Guard-level 403 audit_logs 기록 (error.filter.spec)

```bash
pnpm --filter backend run test -- --testPathPattern="error.filter.spec"
```
**Expected**: "Guard-level ForbiddenException → access_denied 기록" 케이스 PASS.
- `auditService.create` 정확히 1회 호출
- DTO: `action: 'access_denied'`, `entityId: VALID_UUID`, `details.additionalInfo.triggeredBy: 'global-filter'`

---

### M-4. dedup — double-audit 없음 (error.filter.spec)

```bash
pnpm --filter backend run test -- --testPathPattern="error.filter.spec"
```
**Expected**: "request.__auditLogged === true → filter skip" 케이스 PASS.
- `auditService.create` 0회 호출
- 응답은 정상 ErrorResponse 반환

---

### M-5. fail-close AppError audit_logs 기록 (error.filter.spec)

```bash
pnpm --filter backend run test -- --testPathPattern="error.filter.spec"
```
**Expected**: "fail-close AppError (DisposalRejectCommentRequired, 400) → audit 기록" 케이스 PASS.
- `auditService.create` 1회 호출
- `details.additionalInfo.errorCode: 'DISPOSAL_REJECT_COMMENT_REQUIRED'`

추가: VersionConflict AppError → `auditService.create` 0회 (운영 노이즈 제외 검증).

---

### M-6. auditService.create() 실패 → 응답 영향 없음 (error.filter.spec)

```bash
pnpm --filter backend run test -- --testPathPattern="error.filter.spec"
```
**Expected**: mock create가 `Promise.reject(new Error('db fail'))` 반환해도 filter는 정상 ErrorResponse JSON 반환. `Logger.error` 1회 호출.

---

### M-7. SECURITY_AUDITABLE_CODES SSOT 파일 + 다중 참조

```bash
grep -c "SECURITY_AUDITABLE_CODES" apps/backend/src/common/constants/security-auditable-codes.ts
```
**Expected**: ≥ 1

```bash
grep -rln "SECURITY_AUDITABLE_CODES" apps/backend/src/common/
```
**Expected**: 최소 2개 파일 출력 (`security-auditable-codes.ts` + `error.filter.ts`)

---

### M-8. APP_FILTER provider 등록 + main.ts 정리

```bash
grep -c "useGlobalFilters" apps/backend/src/main.ts
```
**Expected**: 0

```bash
grep -c "APP_FILTER" apps/backend/src/app.module.ts
```
**Expected**: ≥ 2 (import + provider 등록)

```bash
grep -c "GlobalExceptionFilter" apps/backend/src/app.module.ts
```
**Expected**: ≥ 2 (import + useClass)

---

## SHOULD 기준

### S-1. fail-close ErrorCode 망라 (SECURITY_AUDITABLE_CODES)

```bash
grep -E "RejectionReasonRequired|RejectCommentRequired|InvalidStatusFor|OnlyApprovedCan|OnlyDraftCan|OnlyPending.*Can|TeamScopeOnly|OnlyRequesterCanCancel|ScopeAccessDenied|HandoverToken|RevocationWindowExpired|FormHistoryDownloadForbidden|CannotSelfApprove|NonExportableStatus|ItemNotExecuted" \
  apps/backend/src/common/constants/security-auditable-codes.ts | wc -l
```
**Expected**: ≥ 25

---

### S-2. Guard-level entityId fallback — SYSTEM_USER_UUID sentinel 재사용

```bash
grep -c "extractAuditEntityId\|resolveAuditEntityIdWithSentinel" apps/backend/src/common/interceptors/audit.interceptor.ts
```
**Expected**: ≥ 1

```bash
grep -c "SYSTEM_USER_UUID" apps/backend/src/common/utils/audit-entity-id.util.ts
```
**Expected**: ≥ 1

---

### S-3. AuditAction enum 변경 없음

```bash
git diff packages/schemas/src/enums/audit.ts 2>/dev/null || echo "no-change"
```
**Expected**: `no-change` 또는 빈 diff

---

### S-4. 인프라 레이어만 수정 — 도메인 서비스/frontend 미수정

```bash
git diff --name-only | grep -E "\.service\.ts$" | grep -v "audit\.service\.ts" | grep -v "spec\.ts$"
```
**Expected**: 빈 출력

```bash
git diff --name-only | grep "^apps/frontend"
```
**Expected**: 빈 출력

---

### S-5. 다른 세션 dirty 파일 침범 없음

```bash
git diff --name-only | grep -E "(calibration-status\.ts|next-env\.d\.ts|settings\.local\.json)"
```
**Expected**: 빈 출력

---

## 검증 게이트 (Generator → Evaluator 이관 전 필수)

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- --testPathPattern="audit-entity-id.util.spec"
pnpm --filter backend run test -- --testPathPattern="audit.interceptor.spec"
pnpm --filter backend run test -- --testPathPattern="error.filter.spec"
pnpm --filter backend run test
```

모두 exit 0 확인 후 Evaluator에 이관.

---

## CLAUDE.md 규칙 준수

- Rule 0 (SSOT): `@equipment-management/schemas`에서 `ErrorCode` import. 로컬 재정의 금지
- Rule 1 (Single DB): 기존 `audit_logs` 테이블 재사용. 별도 DB 신설 금지
- Rule 2 (Server-side user): `request.user` (JWT sub → userId)에서만 추출
- Rule 3 (no any): `unknown` + 타입 가드 사용. `any` 0건
