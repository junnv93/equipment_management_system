# 2026-05-06 SSOT Recovery — 3 Finding Closure (Mode 2)

> Slug: `ssot-recovery-3finding` · Mode: 2 (multi-phase, harness Generator → Evaluator loop)
> Senior-grade SSOT recovery sprint — 3 findings × system-wide architecture closure.
> "누락된 부분없이 타협한 부분없이 업계표준의 방식" — Generator 단계에서 단편 임시방편 금지.

---

## Goal

다음 세 SSOT 위반을 시스템 전반·아키텍처 수준에서 closure 한다:

1. **(Phase 1) GitHub Actions setup-node v6 SHA-pinning 회귀 3 워크플로** — 2026-05-05 supply-chain hardening sprint 종결 후 신규/누락 파일 3개가 `actions/setup-node@v4` unpinned로 남아 있음. main/codeql/supply-chain-gate/e2e-nightly/copilot-setup-steps와 동일한 `@53b83947a5a98c8d113130e565377fae1a50d02f # v6` 패턴으로 통일.
2. **(Phase 2) Backend bare `throw new Error` → ErrorCode SSOT 5-layer 격상** — `packages/schemas/src/errors.ts` ErrorCode enum SSOT를 우회하는 도메인 service/strategy bare Error throw 격상. memory: backend-errorcode-full-closure (2026-05-03)에서 inline `code:'X'` literal 0건 달성 후 잔존한 "Error 객체 자체" 우회 잔여물.
3. **(Phase 3) Frontend client `session?.user?.role` → `useEffectiveRole` SSOT 마이그레이션** — verify-ssot Step 37 baseline 격상. 시뮬레이션 모드(SimulationModeProvider via `?simulateRole=`)를 silent-miss하는 14 client component/hook 일괄 정정.

---

## Discovery Findings (Phase A)

### A.1 ErrorCode 인프라 (충분히 성숙)

`packages/schemas/src/errors.ts` 1122 lines · ErrorCode enum 200+개. `errorCodeToStatusCode: Record<ErrorCode, number>` 컴파일타임 completeness 강제. `AppError` factory + `ErrorResponseSchema` 표준화. GlobalExceptionFilter가 `BadRequestException({ code, message })` 패턴을 자동 라우팅 (HttpException → custom code 보존).

### A.2 env.validation.ts 이미 strict (수정 최소화)

```ts
JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
HANDOVER_TOKEN_SECRET: z.string().min(32, 'HANDOVER_TOKEN_SECRET must be at least 32 characters'),
```

→ ConfigModule.forRoot({ validate: validateEnv }) 시점에 throw. **`jwt.strategy.ts`/`handover-token.service.ts` constructor의 secret 검증은 이미 redundant safety net.** 시니어 결정 = **옵션 A (DRY)**: constructor throw를 `InternalServerErrorException(ErrorCode.InternalServerError)`로 격상 + comment `// defense-in-depth: env.validation.ts가 startup-fail 보장 (line 34/40)`. 환경변수 누락에 신규 ErrorCode 신설하지 않음 (env validation이 이미 SSOT).

### A.3 Phase 2 throw new Error 분류 (7건 → 2 격상 + 4 trivially fix + 1 startup invariant 보존)

| # | File:line | 분류 | 결정 |
|---|-----------|------|------|
| 1 | `approvals.service.ts:194` (delegator==delegatee) | 도메인 검증 | **격상 → ErrorCode 신설** |
| 2 | `approvals.service.ts:197` (startsAt>=endsAt) | 도메인 검증 | **격상 → ErrorCode 신설** |
| 3 | `audit.service.ts:196` ('malformed cursor fields') | local try/catch sentinel (line 206 `catch{}` 직후 fallback) | **non-Error sentinel로 대체** (Error 객체 비용 회피) |
| 4 | `calibration.controller.ts:182` ('not array') | local try/catch sentinel (line 184 fallback) | **non-Error sentinel로 대체** |
| 5 | `notification-events.ts:121` (SSOT 불일치 startup invariant) | module-load assertion | **보존** (startup fail-fast가 의도, ErrorCode 부적합) — 단, 명시 주석 추가 |
| 6 | `jwt.strategy.ts:62` (env JWT_SECRET 누락) | constructor env-guard | **`InternalServerErrorException(ErrorCode.InternalServerError)`로 격상** + redundant 주석 |
| 7 | `handover-token.service.ts:41` (env HANDOVER_TOKEN_SECRET 누락) | constructor env-guard | **`InternalServerErrorException(ErrorCode.InternalServerError)`로 격상** + redundant 주석 |
| 8 | `certificate-extractor.service.ts:30` (verify) | (실제는 30 line이 `@Injectable` 데코레이터, error throw 없음) | **확인 결과 false-positive — skip** |

### A.4 ErrorCode 신설 (Phase 2A)

```ts
// approvals 도메인 — 위임 (Approval Delegation)
ApprovalDelegationSelfDelegationForbidden = 'APPROVAL_DELEGATION_SELF_DELEGATION_FORBIDDEN',
ApprovalDelegationInvalidPeriod = 'APPROVAL_DELEGATION_INVALID_PERIOD',
```

| ErrorCode | HTTP | 의미 |
|-----------|------|------|
| ApprovalDelegationSelfDelegationForbidden | 400 | delegatorId === delegateeId (위임자=피위임자 금지) |
| ApprovalDelegationInvalidPeriod | 400 | startsAt >= endsAt (기간 역순) |

### A.5 Phase 3 분류 — server vs client (8 server 제외 / 14 client 마이그레이션 / 1 SSOT 본체 제외)

**SERVER-side (legitimate, NOT migrating — verify-ssot Step 37 예외 명시):**
- `lib/auth.ts:517-518` (NextAuth callback)
- `lib/auth/server-session.ts:171` (server function)
- `app/(dashboard)/page.tsx:43` (sync server page)
- `app/(dashboard)/calibration/register/page.tsx:16`
- `app/(dashboard)/admin/data-migration/page.tsx:16`
- `app/(dashboard)/admin/monitoring/page.tsx:16`
- `app/(dashboard)/software/layout.tsx:13`
- `app/(dashboard)/admin/approvals/page.tsx:119`

**CLIENT-side (마이그레이션 대상, 14건):**
1. `components/dashboard/PendingApprovalCard.tsx:139`
2. `components/dashboard/DashboardClient.tsx:82` (이미 useEffectiveRole 사용 중 — `sessionRole` fallback 라인 제거)
3. `components/dashboard/WelcomeHeader.tsx:65`
4. `components/dashboard/RecentActivities.tsx:42`
5. `components/checkouts/CheckoutGroupCard.tsx:128` (이미 effectiveRole + fallback chain — fallback 단순화)
6. `components/layout/DashboardShell.tsx:78`
7. `app/(dashboard)/admin/audit-logs/AuditLogsContent.tsx:80`
8. `app/(dashboard)/calibration-plans/CalibrationPlansContent.tsx:108`
9. `app/(dashboard)/calibration-plans/create/CreateCalibrationPlanContent.tsx:80`
10. `app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx:108`
11. `app/(dashboard)/settings/SettingsNavigationClient.tsx:85`
12. `hooks/use-checkout-next-step.ts:41`
13. `hooks/use-auth.ts:29` — **특수 케이스**: `can(Permission.X)` permission helper의 actualRole 전제. backend는 actualRole 기준 권한 체크하므로 **이 hook은 actualRole 유지 필수**. useEffectiveRole 미적용 (예외 명시 주석 추가).
14. `hooks/use-effective-role.ts:39` — **SSOT 본체** (제외)

→ 실제 마이그레이션 대상: **12 files** (use-auth.ts는 명시적 주석으로 예외 등록).

### A.6 Frontend approvals mapper 부재 → 신규 생성 필요

`lib/errors/`에 cable/checkout/notification/team/user 등 5+ 도메인 mapper 존재. **approvals 도메인 mapper 없음** → Phase 2C에서 `approval-errors.ts` 신설 + `approvals.json` errors namespace 추가 (ko/en 양쪽).

### A.7 Phase 1 workflow 현재 상태 (3 + 1 워크플로)

```yaml
# bundle-size.yml:36, accessibility-audit.yml:37, performance-audit.yml:37
- uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'pnpm'

# copilot-setup-steps.yml:22 — v6 태그 사용 (SHA-pin 미적용)
- uses: actions/setup-node@v6
```

→ `actions/setup-node@53b83947a5a98c8d113130e565377fae1a50d02f # v6` 으로 일괄 통일 (cache: pnpm 보존).
→ copilot-setup-steps.yml은 supply-chain-hardening 정책상 SHA-pin 권장 (현재 tag-only).

---

## Phase Execution Plan

### Phase 1: setup-node v6 SHA-pinning closure (3 + 1 workflows · trivial)

**파일 수정 (4):**
- `.github/workflows/bundle-size.yml` (`@v4` → SHA)
- `.github/workflows/accessibility-audit.yml` (`@v4` → SHA)
- `.github/workflows/performance-audit.yml` (`@v4` → SHA)
- `.github/workflows/copilot-setup-steps.yml` (`@v6` tag → SHA — supply-chain hardening 정책 일관성)

**Contract per file:**
- `actions/setup-node@v4` → `actions/setup-node@53b83947a5a98c8d113130e565377fae1a50d02f # v6`
- `cache: 'pnpm'` 보존
- `with: node-version: ${{ env.NODE_VERSION }}` 보존
- 라인 추가/제거 없음 (1라인 in-place 교체)

**검증 명령:**
```bash
# 0 hits 보장
grep -rn "actions/setup-node@v[1-5]" .github/workflows/

# 모든 setup-node가 v6 SHA로 통일
grep -rn "actions/setup-node@" .github/workflows/ | grep -v "53b83947a5a98c8d113130e565377fae1a50d02f # v6"
# 기대: 0건
```

---

### Phase 2A: ErrorCode enum 신설 (`packages/schemas/src/errors.ts`)

**파일 수정 (1):** `packages/schemas/src/errors.ts`

**Contract:**
- `ErrorCode` enum 신규 등재 2건:
  ```ts
  // ============================================================================
  // 승인 위임(Approval Delegation) 도메인
  // ============================================================================
  ApprovalDelegationSelfDelegationForbidden = 'APPROVAL_DELEGATION_SELF_DELEGATION_FORBIDDEN',
  ApprovalDelegationInvalidPeriod = 'APPROVAL_DELEGATION_INVALID_PERIOD',
  ```
- `errorCodeToStatusCode: Record<ErrorCode, number>` 매핑 2건:
  ```ts
  [ErrorCode.ApprovalDelegationSelfDelegationForbidden]: 400,
  [ErrorCode.ApprovalDelegationInvalidPeriod]: 400,
  ```
- `Record<ErrorCode, number>` 컴파일타임 completeness가 누락 자동 차단 (의도된 안전망).

**검증:** `pnpm --filter @equipment-management/schemas tsc --noEmit` 통과 (Record completeness).

---

### Phase 2B: Backend service/strategy throw 마이그레이션 (5 files · 7 throws)

**B-1: `apps/backend/src/modules/approvals/approvals.service.ts` (line 193-198)**

```ts
// BEFORE
if (input.delegatorId === input.delegateeId) {
  throw new Error('delegatorId and delegateeId must be different.');
}
if (input.startsAt >= input.endsAt) {
  throw new Error('startsAt must be before endsAt.');
}

// AFTER
import { BadRequestException } from '@nestjs/common';
// ... (ErrorCode 이미 import되어 있는지 grep 확인 후 추가)

if (input.delegatorId === input.delegateeId) {
  throw new BadRequestException({
    code: ErrorCode.ApprovalDelegationSelfDelegationForbidden,
    message: '위임자와 피위임자는 동일할 수 없습니다.',
  });
}
if (input.startsAt >= input.endsAt) {
  throw new BadRequestException({
    code: ErrorCode.ApprovalDelegationInvalidPeriod,
    message: '위임 시작일은 종료일보다 이전이어야 합니다.',
  });
}
```

**B-2: `apps/backend/src/modules/audit/audit.service.ts` (line 196)** — non-Error sentinel

local try/catch sentinel 패턴. Error 객체 비용 회피 + 의미 명료화:

```ts
// BEFORE
if (isNaN(cursorTimestamp.getTime()) || typeof decoded.i !== 'string') {
  throw new Error('malformed cursor fields');
}

// AFTER — local SyntaxError로 의미 표시 (catch 블록은 동일하게 흡수)
if (isNaN(cursorTimestamp.getTime()) || typeof decoded.i !== 'string') {
  throw new SyntaxError('malformed cursor fields');
}
```

이유: 외부에 노출되지 않는 local control-flow. ErrorCode SSOT 비대상. Lint rule (Phase 4) `throw new Error` 차단 시에도 SyntaxError는 표준 globals 허용 (no-restricted-syntax 정책 명시).

**B-3: `apps/backend/src/modules/calibration/calibration.controller.ts` (line 182)** — 동일 패턴

```ts
// BEFORE
if (!Array.isArray(parsed)) throw new Error('not array');

// AFTER
if (!Array.isArray(parsed)) throw new SyntaxError('documentTypes payload is not an array');
```

**B-4: `apps/backend/src/modules/notifications/events/notification-events.ts` (line 121)** — startup invariant 보존

```ts
// BEFORE (보존)
throw new Error(
  `SSOT 불일치: 이벤트 '${event}' → 타입 '${type}'이 NOTIFICATION_TYPE_VALUES에 없음. ` +
    `packages/schemas/src/enums/notification.ts에 '${type}'을 추가하세요.`
);

// AFTER — 명시 주석만 추가 (코드 변경 없음, 의도 표시)
// NOTE: module-load 시점 SSOT 정합성 startup-fail invariant.
// HTTP 응답 경로 아님 (process startup 시점) → ErrorCode 적용 부적합.
// verify-ssot Step 37 + new lint rule no-restricted-syntax 예외 등록 필요.
throw new Error(...)
```

**B-5: `apps/backend/src/modules/auth/strategies/jwt.strategy.ts` (line 62)** — env-guard 격상

```ts
// BEFORE
const jwtSecret = configService.get<string>('JWT_SECRET');
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}

// AFTER
import { InternalServerErrorException } from '@nestjs/common';
import { ErrorCode } from '@equipment-management/schemas'; // 이미 import

const jwtSecret = configService.get<string>('JWT_SECRET');
if (!jwtSecret) {
  // defense-in-depth: env.validation.ts (line 34) Zod min(16) 가 startup-fail 보장.
  // 본 가드는 ConfigModule 우회 / mock 시나리오 방어 fallback.
  throw new InternalServerErrorException({
    code: ErrorCode.InternalServerError,
    message: 'JWT_SECRET environment variable is required.',
  });
}
```

**B-6: `apps/backend/src/modules/checkouts/services/handover-token.service.ts` (line 40-42)** — env-guard 격상

```ts
// BEFORE
const secret = configService.get<string>('HANDOVER_TOKEN_SECRET');
if (!secret || secret.length < 32) {
  throw new Error('[HandoverTokenService] HANDOVER_TOKEN_SECRET env must be set (>= 32 chars)');
}

// AFTER
import { InternalServerErrorException } from '@nestjs/common';
// ErrorCode 이미 import

const secret = configService.get<string>('HANDOVER_TOKEN_SECRET');
if (!secret || secret.length < 32) {
  // defense-in-depth: env.validation.ts (line 38-40) Zod min(32) 가 startup-fail 보장.
  throw new InternalServerErrorException({
    code: ErrorCode.InternalServerError,
    message: 'HANDOVER_TOKEN_SECRET environment variable must be set (>= 32 chars).',
  });
}
```

**검증 명령:**
```bash
# 1. bare Error throw가 backend service/controller 도메인에서 0건 (예외: notification-events.ts startup invariant)
grep -rn "throw new Error\b" apps/backend/src/modules \
  --include="*.ts" \
  | grep -v ".spec.ts" | grep -v "__tests__" \
  | grep -v "events/notification-events.ts"
# 기대: 0 hits

# 2. ErrorCode enum 사용 카운트 회귀 차단
grep -c "ErrorCode\." apps/backend/src/modules/approvals/approvals.service.ts
# 기대: ≥ 2 (ApprovalDelegation* 2개 추가)

# 3. tsc 통과 (Record<ErrorCode, number> completeness 자동 검증)
pnpm tsc --noEmit
```

---

### Phase 2C: Frontend approvals mapper 신설 + i18n

**파일 신규 (1):** `apps/frontend/lib/errors/approval-errors.ts`

```ts
/**
 * Approval 도메인 에러 매핑 SSOT
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/approvals.json (errors namespace)
 *   — 호출자 useTranslations('approvals') 사용
 */
import { ErrorCode } from '@equipment-management/schemas';
import { extractErrorCode, type ErrorToast } from './disposal-errors';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const APPROVAL_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.ApprovalDelegationSelfDelegationForbidden]: 'errors.delegationSelfForbidden',
  [ErrorCode.ApprovalDelegationInvalidPeriod]: 'errors.delegationInvalidPeriod',
};

export function mapApprovalErrorToToast(error: unknown, t: TranslationFunction): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && APPROVAL_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(APPROVAL_ERROR_I18N_KEYS[errorCode]!),
    };
  }

  return {
    title: t('errors.title'),
    description: error instanceof Error ? error.message : String(error),
  };
}

export function mapBackendErrorCode(code?: string): string {
  return code ?? 'UNKNOWN_ERROR';
}
```

**파일 수정 (2):** `apps/frontend/messages/{ko,en}/approvals.json`

ko 추가:
```json
"errors": {
  "title": "오류가 발생했습니다",
  "delegationSelfForbidden": "위임자와 피위임자는 동일할 수 없습니다.",
  "delegationInvalidPeriod": "위임 시작일은 종료일보다 이전이어야 합니다."
}
```

en 추가:
```json
"errors": {
  "title": "An error occurred",
  "delegationSelfForbidden": "Delegator and delegatee must be different.",
  "delegationInvalidPeriod": "Delegation start date must be before end date."
}
```

**검증:**
```bash
# 1. mapper export 존재
test -f apps/frontend/lib/errors/approval-errors.ts && grep -c "mapApprovalErrorToToast" apps/frontend/lib/errors/approval-errors.ts
# 기대: ≥ 1

# 2. i18n parity (verify-i18n로 자동 보장)
grep -c "delegationSelfForbidden" apps/frontend/messages/ko/approvals.json apps/frontend/messages/en/approvals.json
grep -c "delegationInvalidPeriod" apps/frontend/messages/ko/approvals.json apps/frontend/messages/en/approvals.json
# 기대: 각 파일에서 1 hit
```

**SHOULD (non-blocking):** 호출처 wiring — approvals 위임 dialog가 존재한다면 onError에서 `mapApprovalErrorToToast` 사용. Generator가 호출처 미발견 시 mapper만 등재 (회귀 발생 시 즉시 가용).

---

### Phase 2D: env.validation.ts 강화 (선택 — A.2에 따라 변경 없음)

**결정:** env.validation.ts는 이미 strict (`JWT_SECRET min(16)`, `HANDOVER_TOKEN_SECRET min(32)`). 별도 수정 불필요. Phase 2B에서 constructor throw가 InternalServerErrorException + redundant 주석으로 격상되며 본 단계는 **no-op**.

---

### Phase 3A: useEffectiveRole 호출 마이그레이션 (12 client files)

각 client component/hook에 동일 변환 패턴 적용:

**Pattern A (단순 치환, no fallback chain):**
```tsx
// BEFORE
const userRole = session?.user?.role as UserRole | undefined;

// AFTER
import { useEffectiveRole } from '@/hooks/use-effective-role';
const { effectiveRole: userRole } = useEffectiveRole();
```

**Pattern B (fallback이 있는 경우 — DashboardClient.tsx, CheckoutGroupCard.tsx):**
이미 useEffectiveRole 병행 사용 → `session?.user?.role` 직접 참조 라인 제거 + effectiveRole 단일 경로화. 기존 fallback 시맨틱 (`'test_engineer'` default 등) 보존.

**Pattern C (lowercase 변형 — RecentActivities.tsx):**
```tsx
// BEFORE
const userRole = session?.user?.role?.toLowerCase() || URVal.TEST_ENGINEER;

// AFTER
const { effectiveRole } = useEffectiveRole();
const userRole = effectiveRole?.toLowerCase() ?? URVal.TEST_ENGINEER;
```

**예외 명시 (use-auth.ts):**
```tsx
// hooks/use-auth.ts:29
// NOTE: useAuth().can(Permission.X) 는 backend @RequirePermissions 와 actualRole 동일 기준 사용.
// useEffectiveRole 의 effectiveRole (시뮬레이션 가짜 역할)을 적용하면 권한 결정이 시뮬에 영향받음 → 보안 결함.
// 본 hook은 actualRole 전용 — verify-ssot Step 37 명시 예외.
const userRole = session?.user?.role; // allow: actualRole-only by design
```

**파일 수정 (13):**
1. `apps/frontend/components/dashboard/PendingApprovalCard.tsx` (Pattern A + 'user' fallback)
2. `apps/frontend/components/dashboard/DashboardClient.tsx` (Pattern B — line 82 sessionRole 제거)
3. `apps/frontend/components/dashboard/WelcomeHeader.tsx` (Pattern A + URVal.TEST_ENGINEER fallback)
4. `apps/frontend/components/dashboard/RecentActivities.tsx` (Pattern C)
5. `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` (Pattern B — line 128 단순화)
6. `apps/frontend/components/layout/DashboardShell.tsx` (Pattern A)
7. `apps/frontend/app/(dashboard)/admin/audit-logs/AuditLogsContent.tsx` (Pattern A)
8. `apps/frontend/app/(dashboard)/calibration-plans/CalibrationPlansContent.tsx` (Pattern A)
9. `apps/frontend/app/(dashboard)/calibration-plans/create/CreateCalibrationPlanContent.tsx` (Pattern A)
10. `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` (Pattern A + 'test_engineer' fallback)
11. `apps/frontend/app/(dashboard)/settings/SettingsNavigationClient.tsx` (Pattern A)
12. `apps/frontend/hooks/use-checkout-next-step.ts` (Pattern A + 'test_engineer' fallback)
13. `apps/frontend/hooks/use-auth.ts` (예외 주석 추가만)

**검증 명령:**
```bash
# 1. 클라이언트 영역에서 session.user.role 직접 참조 0건 (allow 주석 + SSOT 본체 제외)
grep -rn "session?\?\.user?\?\.role" \
  apps/frontend/components apps/frontend/hooks apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "/use-effective-role.ts:" \
  | grep -v "// allow:" \
  | grep -v "/lib/auth.ts:" \
  | grep -v "/lib/auth/server-session.ts:" \
  | grep -v "(dashboard)/page.tsx:" \
  | grep -v "(dashboard)/calibration/register/page.tsx:" \
  | grep -v "(dashboard)/admin/data-migration/page.tsx:" \
  | grep -v "(dashboard)/admin/monitoring/page.tsx:" \
  | grep -v "(dashboard)/software/layout.tsx:" \
  | grep -v "(dashboard)/admin/approvals/page.tsx:"
# 기대: 0 hits

# 2. useEffectiveRole 사용 카운트 ≥ 14 (기존 + 12 신규 = 14 lower bound)
grep -rln "useEffectiveRole" apps/frontend/components apps/frontend/hooks apps/frontend/app | wc -l
# 기대: ≥ 14
```

---

### Phase 3B: verify-ssot Step 37 baseline 회귀 탐지 전환

**파일 수정 (1):** `.claude/skills/verify-ssot/references/permissions-roles.md`

**Contract:**
- Step 37 grep 명령에 7개 server-side 예외 path 명시 추가:
  - `lib/auth.ts`, `lib/auth/server-session.ts`
  - `app/(dashboard)/page.tsx`, `app/(dashboard)/calibration/register/page.tsx`
  - `app/(dashboard)/admin/data-migration/page.tsx`, `app/(dashboard)/admin/monitoring/page.tsx`
  - `app/(dashboard)/software/layout.tsx`, `app/(dashboard)/admin/approvals/page.tsx`
- `// allow: actualRole-only by design` 주석 패턴 등록 (use-auth.ts 예외)
- 검증 명령은 Phase 3A의 기대값 0건과 동일.
- baseline metric 등록 (회귀 차단): "2026-05-06 ssot-recovery-3finding 이후 client session.user.role 0건. 신규 발견 시 즉시 FAIL."

**파일 수정 (1):** `.claude/skills/verify-zod/SKILL.md` Step 16
- 신규 ErrorCode (ApprovalDelegation*) frontend mapper 검증 라인 추가:
  ```bash
  test -f apps/frontend/lib/errors/approval-errors.ts && grep -c "mapApprovalErrorToToast" apps/frontend/lib/errors/approval-errors.ts
  # expected: ≥1
  ```
- baseline metric: "backend bare `throw new Error` in modules/ ⇒ 0 hits (notification-events.ts startup invariant 제외)."

---

### Phase 4: 최종 검증 (build/tsc/lint/test/grep invariants)

**의존 검증 명령 (6 layer):**

```bash
# L1: build (errors.ts Record completeness)
pnpm --filter @equipment-management/schemas build

# L2: tsc (전체 type-check)
pnpm tsc --noEmit

# L3: lint
pnpm lint

# L4: backend unit tests (122+ suites — 회귀 0)
pnpm --filter backend run test

# L5: frontend tests (RTL — 회귀 0)
pnpm --filter frontend run test

# L6: grep invariants (Phase 1 + 2 + 3)
# 6a. Phase 1 — setup-node v6 SHA 통일
grep -rn "actions/setup-node@v[1-5]" .github/workflows/ | wc -l   # 기대: 0
# 6b. Phase 2 — backend bare Error 0건 (예외 1건 명시)
grep -rn "throw new Error\b" apps/backend/src/modules --include="*.ts" \
  | grep -v ".spec.ts\|__tests__\|notification-events.ts" | wc -l   # 기대: 0
# 6c. Phase 3 — client session.user.role 0건
# (위 Phase 3A 검증 명령 재사용)
```

---

## Senior Self-Audit (7대 영역)

### 1. L0 Inferred (Phase A에서 검증된 가정)

| 가정 | 검증 |
|------|------|
| `errorCodeToStatusCode: Record<ErrorCode, number>` 컴파일타임 강제 | errors.ts:677 확인 |
| `BadRequestException({ code, message })`이 GlobalExceptionFilter를 통해 자동 라우팅 | error.filter.ts:82-94 (`customCode \|\| this.mapHttpStatusToErrorCode`) |
| env.validation.ts가 JWT_SECRET / HANDOVER_TOKEN_SECRET를 startup에서 검증 | env.validation.ts:34, 38-40 (z.string().min(16) / .min(32)) 확인 |
| useEffectiveRole 이미 actualRole + simulating 분리 | use-effective-role.ts:39-79 확인 |
| 8 server-side files가 async server / NextAuth callback / sync server page | 각 파일 첫 5라인 grep으로 'use client' 부재 확인 |
| `lib/errors/`에 approval mapper 부재 | `ls lib/errors/ | grep approval` → 0 결과 |
| approvals.json에 errors namespace 부재 | `jq '.errors' approvals.json` → null |

### 2. L4ext (Cross-domain ripple)

- **packages/schemas → backend services/controllers**: ErrorCode enum 2건 추가 → Record completeness가 자동 강제 (tsc 통과 = ripple closed).
- **packages/schemas → frontend lib/errors**: 신규 ErrorCode 도입 시 frontend mapper Partial<Record<ErrorCode,...>>는 명시 등재만 영향. Silent miss 차단은 verify-zod Step 16 #5b dead local enum + #5 mapper coverage가 담당.
- **backend → frontend i18n**: approvals.json에 errors namespace 신설 → verify-i18n parity 자동 검증으로 ko/en drift 차단.
- **client component → useEffectiveRole**: 시뮬레이션 모드 audit log (`/api/audit-logs/simulate-role`)는 useEffectiveRole 내부 useEffect에서 자동 발행 — 본 마이그레이션이 audit observability 회귀 0.

### 3. 관측성 (Observability)

- **env.validation.ts startup fail**: ConfigModule.forRoot validate 에러는 NestJS bootstrap에서 process.exit(1) 유발 + stderr 메시지 ("환경 변수 검증 실패: ..."). 운영 alert는 컨테이너 restart 카운트로 감지 가능 (별도 metric 추가 불필요).
- **InternalServerErrorException 격상**: ErrorCode.InternalServerError → 500 응답 → GlobalExceptionFilter가 SystemErrorEventProvider로 자동 기록 (error.filter.ts:64). 기존 관측 경로 활용.
- **simulate-role audit**: 변경 없음. useEffectiveRole의 audit emit이 마이그레이션 후 추가 호출처에서도 동일 동작.

### 4. 테스트 매트릭스 (per-Phase boundary cases)

| Phase | 기존 spec | 신규 spec | 회귀 확인 |
|-------|-----------|-----------|-----------|
| 1 | (workflow는 unit test 없음, CI 실측 의존) | — | manual: PR 후 3 workflow 모두 green check |
| 2A | `packages/schemas/src/__tests__/errors.test.ts` (existence?) | (해당시) ApprovalDelegation* 2건 status code 단언 | tsc Record completeness |
| 2B | `apps/backend/src/modules/approvals/__tests__/approvals.service.spec.ts` | 신규 spec — createDelegation throw branch 2건 (self-delegation, invalid period) | backend unit test green |
| 2C | (mapper unit test 없음 — 기타 mapper도 미존재) | (선택, SHOULD) approval-errors.ts unit test | i18n parity script |
| 3A | RTL 컴포넌트 spec (DashboardClient, WelcomeHeader 등) | 변경 없음 (effectiveRole 동일 시 동일 렌더 expected) | frontend test green |
| 3B | verify-ssot Step 37 grep | grep 0 hits | pre-push hook 통과 |

**boundary case 추가 (SHOULD):**
- ApprovalDelegationInvalidPeriod: `startsAt === endsAt` (`>=` 경계) → throw 발생
- ApprovalDelegationSelfDelegationForbidden: `delegatorId === delegateeId` 정확 매칭 (UUID 대소문자 normalize 미적용 = 의도된 strict)

### 5. CAS 영향

본 sprint는 **읽기/에러 경로만** 수정 — CAS / 낙관적 잠금 / version field 무관. updateWithVersion 흐름 회귀 0.

### 6. 의존성 검증 명령 (6개)

```bash
pnpm --filter @equipment-management/schemas build   # L1
pnpm tsc --noEmit                                    # L2
pnpm lint                                            # L3
pnpm --filter backend run test                       # L4
pnpm --filter frontend run test                      # L5
# L6: grep invariants (Phase 4 #6a/6b/6c)
```

### 7. WCAG SC

본 sprint는 a11y 영향 없음 (ErrorCode 라우팅 + role hook 마이그레이션). 기존 DashboardClient/WelcomeHeader의 role-based aria-label 등은 effectiveRole로 분기되며 시뮬 모드에서도 정확한 라벨 노출 (개선).

---

## Pre-commit Audit Checklist (CLAUDE.md 7항목)

| 항목 | 검증 |
|------|------|
| 하드코딩 URL 0 | 본 sprint 미관련 |
| eslint-disable 0 | 신규 추가 0건 (use-auth.ts 예외 주석은 `// allow:` 패턴, eslint-disable 아님) |
| `any` 0 | 신규 코드 strict typing (ErrorCode enum, useEffectiveRole 반환 타입) |
| SSOT 우회 0 | 본 sprint 핵심 목표 — ErrorCode SSOT + useEffectiveRole SSOT 정착 |
| role 리터럴 분기 0 | useEffectiveRole 마이그레이션이 role 리터럴 우회를 단일 hook으로 통합 |
| setQueryData 0 | 본 sprint 미관련 |
| a11y 회귀 0 | 본 sprint 미관련 |

---

## 결정 요약 (Generator 제약)

1. **Phase 1**: 3 워크플로 line in-place 교체 (1 라인/파일).
2. **Phase 2A**: ErrorCode 2건만 신설 (env-guard 신설 안 함, env.validation.ts에 위임).
3. **Phase 2B**: 5 file × 7 throw 변환. notification-events.ts는 보존 (startup invariant) + 명시 주석 추가.
4. **Phase 2C**: approval-errors.ts 신설 + approvals.json ko/en errors namespace 추가. 호출처 wiring은 SHOULD.
5. **Phase 2D**: env.validation.ts 변경 없음 (이미 strict).
6. **Phase 3A**: 12 client file 마이그레이션 (use-auth.ts 예외 주석만, use-effective-role.ts 본체 제외).
7. **Phase 3B**: verify-ssot Step 37 + verify-zod Step 16 baseline 강화. 신규 lint rule (no-restricted-syntax `throw new Error`)는 SHOULD (Phase 4 후속).

---

## Out-of-Scope (명시 제외)

- 신규 lint rule 추가 (no-restricted-syntax `throw new Error`) — SHOULD, 본 sprint 후속 sprint에서 검토.
- approval-errors.ts 호출처 wiring (실제 dialog onError 연결) — 호출처 미식별 시 SHOULD로 이연.
- e2e 시뮬레이션 모드 spec 보강 — SHOULD.
- 중간점검 / NC / disposal 등 다른 도메인 잔존 throw new Error 점검 — 본 sprint 범위 외 (memory: backend-errorcode-full-closure가 inline `code:'X'`만 0건 처리, bare Error는 점검 안 됨. 발견 시 별도 sprint).
