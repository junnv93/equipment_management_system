# Contract: SSOT Recovery — 3 Finding Closure

> Slug: `ssot-recovery-3finding` · Mode: 2 · Generated: 2026-05-06
> Plan: `.claude/exec-plans/active/2026-05-06-ssot-recovery-3finding.md`
> Senior-grade SSOT recovery — 단편 임시방편 0, 시스템 전반 closure.

---

## MUST (loop-blocking — Evaluator FAIL on any)

### M-1 ~ M-3: Build / Type / Lint Green

- **M-1** `pnpm --filter @equipment-management/schemas build` 통과 — `Record<ErrorCode, number>` completeness 강제 (errorCodeToStatusCode 신규 2건 등재 자동 검증).
- **M-2** `pnpm tsc --noEmit` 통과 — backend + frontend + packages 모두 type-clean. ErrorCode 신규 2건이 `ErrorCode` 유니언/Record 양쪽 동기화.
- **M-3** `pnpm lint` 통과 — backend + frontend lint 0 errors / 0 warnings 회귀 (기존 baseline 유지).

### M-4 ~ M-5: Test 회귀 0

- **M-4** `pnpm --filter backend run test` 통과 — 122+ test suites · 회귀 0건. `approvals.service.spec.ts`에 createDelegation throw branch 단위 테스트 2건(`ApprovalDelegationSelfDelegationForbidden`, `ApprovalDelegationInvalidPeriod`) 신규 등재 또는 기존 spec 보강.
- **M-5** `pnpm --filter frontend run test` 통과 — RTL 회귀 0건. effectiveRole 마이그레이션이 컴포넌트 렌더 결과 동치 (시뮬 비활성 시).

### M-6: Phase 1 setup-node v6 SHA-pinning 통일 (3 v4 + 1 tag-only v6 → SHA)

- **M-6a** `grep -rn "actions/setup-node@v[1-5]" .github/workflows/` → **0 hits** (3 unpinned `@v4` 모두 제거).
- **M-6b** `grep -rn "actions/setup-node@" .github/workflows/ | grep -v "53b83947a5a98c8d113130e565377fae1a50d02f # v6"` → **0 hits** (모든 setup-node가 v6 SHA-pinned, copilot-setup-steps.yml `@v6` tag-only도 포함).
- **M-6c** 3 audit/bundle 워크플로 모두 `cache: 'pnpm'` + `node-version: ${{ env.NODE_VERSION }}` 보존 (라인 추가/제거 없이 1라인 in-place 교체). copilot-setup-steps.yml은 기존 옵션 보존.

### M-7 ~ M-10: Phase 2 ErrorCode SSOT 5-layer

- **M-7** `packages/schemas/src/errors.ts` ErrorCode enum에 다음 2건 등재:
  - `ApprovalDelegationSelfDelegationForbidden = 'APPROVAL_DELEGATION_SELF_DELEGATION_FORBIDDEN'`
  - `ApprovalDelegationInvalidPeriod = 'APPROVAL_DELEGATION_INVALID_PERIOD'`
- **M-8** `errorCodeToStatusCode: Record<ErrorCode, number>`에 위 2건 모두 `400` 매핑 (Record completeness가 누락 시 tsc fail).
- **M-9** `apps/backend/src/modules` 하위 backend service/controller에서 bare `throw new Error\b` 검색 결과 **0 hits** (예외: `notifications/events/notification-events.ts:121` startup invariant 1건 — 명시 주석 추가됨). spec/test 파일 제외.
  ```bash
  grep -rn "throw new Error\b" apps/backend/src/modules --include="*.ts" \
    | grep -v ".spec.ts\|__tests__\|notification-events.ts" | wc -l
  # expected: 0
  ```
- **M-10** approvals.service.ts createDelegation 메서드:
  - line ~193: `BadRequestException({ code: ErrorCode.ApprovalDelegationSelfDelegationForbidden, message })` 사용
  - line ~196: `BadRequestException({ code: ErrorCode.ApprovalDelegationInvalidPeriod, message })` 사용
  - bare `throw new Error` 0건.

### M-11: Phase 2 env-guard 격상

- **M-11** `apps/backend/src/modules/auth/strategies/jwt.strategy.ts` line ~62 + `apps/backend/src/modules/checkouts/services/handover-token.service.ts` line ~41 의 env secret 가드는 `InternalServerErrorException({ code: ErrorCode.InternalServerError, message })` 사용. 두 파일 모두 defense-in-depth 주석 + env.validation.ts 라인 참조 명시.
  ```bash
  grep -A2 "JWT_SECRET environment variable is required" apps/backend/src/modules/auth/strategies/jwt.strategy.ts
  # expected: InternalServerErrorException + ErrorCode.InternalServerError 라인 인접
  grep -A2 "HANDOVER_TOKEN_SECRET environment variable" apps/backend/src/modules/checkouts/services/handover-token.service.ts
  # expected: InternalServerErrorException + ErrorCode.InternalServerError 라인 인접
  ```

### M-12: Phase 2C Frontend approval mapper + i18n

- **M-12a** `apps/frontend/lib/errors/approval-errors.ts` 파일 신규 생성. `mapApprovalErrorToToast` export 존재.
- **M-12b** `APPROVAL_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>>` 객체에 위 2 ErrorCode 등재.
- **M-12c** `apps/frontend/messages/ko/approvals.json` + `apps/frontend/messages/en/approvals.json` 양쪽에 `errors.title` / `errors.delegationSelfForbidden` / `errors.delegationInvalidPeriod` 3 키 모두 존재 (parity).
  ```bash
  for f in apps/frontend/messages/ko/approvals.json apps/frontend/messages/en/approvals.json; do
    for key in title delegationSelfForbidden delegationInvalidPeriod; do
      jq -e ".errors.${key}" "$f" > /dev/null || { echo "MISSING: $f .errors.${key}"; exit 1; }
    done
  done
  ```

### M-13 ~ M-15: Phase 3 useEffectiveRole 마이그레이션

- **M-13** Client component/hook에서 `session?.user?.role` 직접 참조 검색 결과: **server-side 8 파일 + use-effective-role.ts SSOT 본체 + use-auth.ts (allow: 명시 주석) 외 0 hits**.
  ```bash
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
    | grep -v "(dashboard)/admin/approvals/page.tsx:" \
    | wc -l
  # expected: 0
  ```
- **M-14** `useEffectiveRole` import 사용 카운트 **≥ 14 파일** (기존 + 신규 12).
  ```bash
  grep -rln "useEffectiveRole" apps/frontend/components apps/frontend/hooks apps/frontend/app | wc -l
  # expected: ≥ 14
  ```
- **M-15** `apps/frontend/hooks/use-auth.ts:29` 라인은 `// allow: actualRole-only by design` 주석 + `// NOTE: ...` 명시 (시뮬 보안 결함 회피 의도 documented).

### M-16: Verify Skill Baseline 강화

- **M-16a** `.claude/skills/verify-ssot/references/permissions-roles.md` Step 37 섹션:
  - server-side 8 path + `// allow:` 패턴 명시 예외 등재
  - baseline metric 추가: "2026-05-06 ssot-recovery-3finding 후 client session.user.role 0건. 신규 발견 시 즉시 FAIL"
- **M-16b** `.claude/skills/verify-zod/SKILL.md` Step 16:
  - approval-errors.ts mapper 검증 라인 추가 (`grep -c "mapApprovalErrorToToast"`)
  - baseline metric 갱신: "backend modules bare `throw new Error` 0건 (notification-events.ts startup invariant 제외)"

---

## SHOULD (non-blocking — Generator 권장, Evaluator는 미준수 시 WARN만)

### S-1: 신규 lint rule (no-restricted-syntax — `throw new Error` 차단)

`apps/backend/.eslintrc` 또는 root eslint config에 `no-restricted-syntax` 규칙으로 `ThrowStatement[argument.callee.name="Error"]` 차단. 예외: `notification-events.ts` (eslint-disable-next-line + comment) / SyntaxError 등 표준 globals 허용. 회귀 차단 자동화.

### S-2: approval-errors.ts 호출처 wiring

approvals 위임 dialog (`apps/frontend/components/approvals/`)에 createDelegation onError 핸들러가 있다면 `mapApprovalErrorToToast(error, t)` 사용. 호출처 미식별 시 mapper만 등재 (등재 자체로 mapper coverage SSOT 충족).

### S-3: e2e 시뮬레이션 모드 spec 보강

`?simulateRole=test_engineer` 활성 시 마이그레이션된 12 client component가 시뮬 역할로 렌더되는지 e2e 검증 spec 1~2건 추가. 핵심 노드: DashboardClient + WelcomeHeader (역할 라벨 변경 visible).

### S-4: approval-errors.ts unit test

`apps/frontend/lib/errors/__tests__/approval-errors.test.ts` 신설 — 2 ErrorCode → i18n key 매핑 + fallback 케이스 (unknown error). 패턴은 다른 mapper test (`disposal-errors.test.ts` 등) 참조.

### S-5: notification-events.ts startup invariant 명시 주석

line 121 throw 직전에 의도 주석 추가:
```ts
// NOTE: module-load 시점 SSOT 정합성 startup-fail invariant.
// HTTP 응답 경로 아님 → ErrorCode 적용 부적합. verify-ssot/verify-zod 명시 예외.
throw new Error(...);
```

### S-6: ApprovalDelegation* schemas test

`packages/schemas/src/__tests__/errors.test.ts`가 존재한다면 신규 ErrorCode 2건의 status code 단언 추가. tsc Record completeness가 이미 보장하지만 runtime 단언으로 이중화.

---

## 검증 명령 요약 (Evaluator 실행 절차)

```bash
# Phase 1 — workflow SHA 통일
grep -rn "actions/setup-node@v[1-5]" .github/workflows/         # 0
grep -rn "actions/setup-node@" .github/workflows/ \
  | grep -v "53b83947a5a98c8d113130e565377fae1a50d02f # v6"      # 0

# Phase 2 — backend bare Error 0건 (예외 1건)
grep -rn "throw new Error\b" apps/backend/src/modules \
  --include="*.ts" \
  | grep -v ".spec.ts\|__tests__\|notification-events.ts" \
  | wc -l                                                         # 0

# Phase 2 — ErrorCode 사용 카운트 (회귀 차단)
grep -c "ErrorCode\.ApprovalDelegation" apps/backend/src/modules/approvals/approvals.service.ts  # ≥ 2
grep -c "ErrorCode\.InternalServerError" apps/backend/src/modules/auth/strategies/jwt.strategy.ts  # ≥ 1
grep -c "ErrorCode\.InternalServerError" apps/backend/src/modules/checkouts/services/handover-token.service.ts  # ≥ 1

# Phase 2C — frontend mapper + i18n
test -f apps/frontend/lib/errors/approval-errors.ts \
  && grep -c "mapApprovalErrorToToast" apps/frontend/lib/errors/approval-errors.ts   # ≥ 1
jq -e '.errors.delegationSelfForbidden' apps/frontend/messages/ko/approvals.json
jq -e '.errors.delegationInvalidPeriod' apps/frontend/messages/ko/approvals.json
jq -e '.errors.delegationSelfForbidden' apps/frontend/messages/en/approvals.json
jq -e '.errors.delegationInvalidPeriod' apps/frontend/messages/en/approvals.json

# Phase 3 — client session.user.role 0건
grep -rn "session?\?\.user?\?\.role" \
  apps/frontend/components apps/frontend/hooks apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "/use-effective-role.ts:\|// allow:\|/lib/auth.ts:\|/lib/auth/server-session.ts:\|(dashboard)/page.tsx:\|(dashboard)/calibration/register/page.tsx:\|(dashboard)/admin/data-migration/page.tsx:\|(dashboard)/admin/monitoring/page.tsx:\|(dashboard)/software/layout.tsx:\|(dashboard)/admin/approvals/page.tsx:" \
  | wc -l                                                         # 0

grep -rln "useEffectiveRole" apps/frontend/components apps/frontend/hooks apps/frontend/app | wc -l   # ≥ 14

# 회귀 확인
pnpm --filter @equipment-management/schemas build
pnpm tsc --noEmit
pnpm lint
pnpm --filter backend run test
pnpm --filter frontend run test
```

---

## Out-of-Scope (명시 제외)

- 신규 lint rule (no-restricted-syntax) — S-1로 SHOULD 등재.
- approval mapper 호출처 wiring — S-2로 SHOULD.
- e2e 시뮬 모드 spec — S-3로 SHOULD.
- 다른 도메인 잔존 bare `throw new Error` (sprint scope 외 — 별도 sprint 권고).
- env.validation.ts 강화 — 이미 strict (수정 불필요, A.2).
