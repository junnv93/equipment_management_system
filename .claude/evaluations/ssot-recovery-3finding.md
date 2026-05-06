# Evaluation — ssot-recovery-3finding

**Iteration**: 1
**Date**: 2026-05-06
**Verdict**: FAIL

---

## MUST criteria (16 items)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M-1 | `pnpm --filter @equipment-management/schemas build` 통과 | PASS | 빌드 성공 (exit 0). `Record<ErrorCode, number>` completeness 자동 강제 확인. |
| M-2 | `pnpm tsc --noEmit` 통과 (backend + frontend + packages type-clean) | PASS | 출력 0건 (exit 0). ErrorCode 2건 enum + Record 동기화 확인. |
| M-3 | `pnpm lint` 0 errors / 0 warnings 회귀 없음 | PASS | "2 successful, 2 total" (backend + frontend lint 모두 성공). |
| M-4 | `pnpm --filter backend run test` 125 suites / 1588 tests PASS, createDelegation throw branch 단위 테스트 2건 등재 | FAIL | 125 suites 1588 tests PASS (회귀 0) **BUT** `approvals.service.spec.ts`에 `ApprovalDelegationSelfDelegationForbidden` / `ApprovalDelegationInvalidPeriod` throw branch 테스트 **0건** (contract M-4 sub-criterion 미충족). grep: `grep -n "SelfDelegation\|InvalidPeriod" approvals.service.spec.ts` → 0 hits. |
| M-5 | `pnpm --filter frontend run test` 66 suites / 549 tests PASS, effectiveRole 마이그레이션 컴포넌트 렌더 동치 | PASS | 66 suites 549 tests 전원 PASS (회귀 0). |
| M-6a | `grep -rn "actions/setup-node@v[1-5]" .github/workflows/` → 0 hits | PASS | 0 hits 확인. |
| M-6b | 모든 setup-node가 `53b83947a5a98c8d113130e565377fae1a50d02f # v6` SHA-pin | PASS | 0 non-SHA hits 확인. 4 워크플로 모두 동일 SHA. |
| M-6c | 3 audit 워크플로 `cache: 'pnpm'` + `node-version: ${{ env.NODE_VERSION }}` 보존, copilot-setup-steps.yml 기존 옵션 보존 | PASS | bundle-size/accessibility-audit/performance-audit 3개 모두 옵션 보존 확인. copilot-setup-steps.yml `node-version: lts/*` 보존 확인. |
| M-7 | `errors.ts` ErrorCode enum에 `ApprovalDelegationSelfDelegationForbidden` + `ApprovalDelegationInvalidPeriod` 등재 | PASS | `packages/schemas/src/errors.ts:133,135` 확인. |
| M-8 | `errorCodeToStatusCode` Record에 2건 400 매핑 | PASS | `errors.ts:768-769` 확인. |
| M-9 | backend service/controller 하위 bare `throw new Error\b` 0 hits (notification-events.ts 예외) | FAIL | `grep -rn "throw new Error\b" apps/backend/src/modules --include="*.ts" \| grep -v ".spec.ts\|__tests__\|notification-events.ts" \| wc -l` → **5 hits**: (1) `calibration/calibration-certificate.controller.ts:67` (startup IIFE invariant), (2-4) `equipment-imports/types/equipment-import.types.ts:70,83,122` (TypeScript exhaustiveness checks), (5) `data-migration/services/excel-parser.service.ts:245` (exhaustiveness check). 이 5건은 Phase 2B 계획의 out-of-scope로 plan에 명시되어 있으나, **계약 M-9은 예외 없이 0건을 요구**. |
| M-10 | `approvals.service.ts` createDelegation에서 `BadRequestException({ code: ErrorCode.ApprovalDelegation* })` 사용, bare `throw new Error` 0건 | PASS | `approvals.service.ts:195-202` 확인. 두 ErrorCode 모두 BadRequestException으로 등재. |
| M-11 | `jwt.strategy.ts` + `handover-token.service.ts` env-guard → `InternalServerErrorException({ code: ErrorCode.InternalServerError })` + defense-in-depth 주석 | PASS | `jwt.strategy.ts:66-72` (defense-in-depth 주석 + InternalServerErrorException 확인). `handover-token.service.ts:40-46` (동일 패턴 확인). |
| M-12a | `apps/frontend/lib/errors/approval-errors.ts` 신규 생성, `mapApprovalErrorToToast` export | PASS | 파일 존재 확인. `grep -c "mapApprovalErrorToToast"` → 1. |
| M-12b | `APPROVAL_ERROR_I18N_KEYS` 에 두 ErrorCode 등재 | PASS | `ApprovalDelegationSelfDelegationForbidden: 'errors.delegationSelfForbidden'` + `ApprovalDelegationInvalidPeriod: 'errors.delegationInvalidPeriod'` 확인. |
| M-12c | ko/en approvals.json 양쪽에 `errors.title` / `errors.delegationSelfForbidden` / `errors.delegationInvalidPeriod` 3키 parity | PASS | `jq -e ".errors.${key}"` 6건 모두 OK. |
| M-13 | 클라이언트 영역 `session?.user?.role` 직접 참조 0 hits (서버 8 파일 + use-effective-role.ts + `// allow:` 제외) | FAIL | grep 결과 **3 hits**: (1) `components/dashboard/DashboardClient.tsx:81` (코멘트 라인 — "session.user.role 직접 참조 금지" 문구 포함), (2) `components/checkouts/CheckoutGroupCard.tsx:126` (코멘트 라인), (3) `hooks/use-auth.ts:29` (`const userRole = session?.user?.role;` — `// allow:` 주석 없음). 루트 원인: M-15 미완성으로 `use-auth.ts:29`에 `// allow:` 인라인 주석 없음 → grep 필터 통과 불가. 코멘트 라인 2건은 코드 위반은 아니나 계약 grep 기준 0건 미달. |
| M-14 | `useEffectiveRole` import 사용 파일 수 ≥ 14 | PASS | `grep -rln "useEffectiveRole" ...` → **16 files** (≥14 충족). |
| M-15 | `use-auth.ts:29` 라인에 `// allow: actualRole-only by design` + `// NOTE: ...` 주석 명시 | FAIL | `grep -n "allow:\|NOTE.*actualRole" hooks/use-auth.ts` → **0 hits**. 라인 29는 `const userRole = session?.user?.role;`만 존재, 인라인 주석 없음. 위에 관련 설명 주석 있으나 M-15 요구 패턴(`// allow:`) 미충족. |
| M-16a | `verify-ssot/references/permissions-roles.md` Step 37: 서버 8 path + `// allow:` 패턴 예외 + baseline metric 등재 | PARTIAL FAIL | baseline metric 등재 확인 ("2026-05-06 ssot-recovery-3finding sprint Phase 3A 후", client 0건, server 8 files 명시). **BUT** `// allow: actualRole-only by design` 패턴이 Step 37 예외(exceptions) 섹션에 명시 미등재. `use-auth.ts`가 예외 항목으로 명시되지 않아 M-13 grep과 baseline 불일치. |
| M-16b | `verify-zod/SKILL.md` Step 16: `approval-errors.ts` mapper 검증 라인 + baseline metric 갱신 | PARTIAL FAIL | `approval-errors.ts` mapper 검증 라인 추가 확인(line 672). bare Error baseline 갱신 확인(lines 641-654). **BUT** baseline Step 16 4b의 grep 필터(`grep -vE "// NOTE: TypeScript exhaustiveness\|// NOTE: module-load\|// local sentinel"`)는 **전 라인 필터 방식**인데, 실제 코드의 NOTE 주석은 throw 라인 바로 앞 별도 줄에 위치 — 동일 라인 아님. 결과: `grep ... \| grep -vE "..." \| wc -l` 실행 시 **6 hits** (expected: 0). 즉, baseline 명령이 현재 코드 상태에서 스스로 PASS 하지 못하는 broken baseline. |

---

## SHOULD criteria (6 items)

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S-1 | `no-restricted-syntax` lint rule (`ThrowStatement[argument.callee.name="Error"]`) 추가 | FAIL | `.eslintrc`에 `no-restricted-syntax` 규칙 존재하나 `ThrowStatement` 엔트리 없음. 자동 회귀 차단 미완성. |
| S-2 | approvals 위임 dialog onError에 `mapApprovalErrorToToast` wiring | TECH-DEBT | `apps/frontend/components/approvals/` 내 createDelegation onError 호출처 미발견. mapper만 등재됨. 계약에서 "호출처 미식별 시 mapper만 등재" SHOULD 허용. |
| S-3 | e2e 시뮬레이션 모드 spec 보강 (`?simulateRole=test_engineer` 렌더 검증) | FAIL | e2e spec에 simulateRole 관련 신규 spec 미발견. |
| S-4 | `approval-errors.test.ts` unit test 신설 | FAIL | `apps/frontend/lib/errors/__tests__/approval-errors.test.ts` 파일 없음. |
| S-5 | `notification-events.ts:121` startup invariant 명시 주석 추가 | PASS | `notification-events.ts:121-122`에 "NOTE: module-load 시점 SSOT 정합성 startup-fail invariant. HTTP 응답 경로 아님 → ErrorCode 적용 부적합. verify-ssot Step 37 + new lint rule no-restricted-syntax 예외 등록 필요." 확인. |
| S-6 | `packages/schemas/src/__tests__/errors.test.ts` (존재 시) ApprovalDelegation* status code 단언 추가 | TECH-DEBT | `errors.test.ts` 파일 자체 없음 (N/A). tsc Record completeness로 이미 보장. |

---

## Failure Summary

**MUST 실패 항목 (5건)**:

1. **M-4** (FAIL): `approvals.service.spec.ts`에 `createDelegation` throw branch 단위 테스트 2건 미등재. 전체 테스트는 통과하나 contract의 신규 spec 요구사항 미충족.

2. **M-9** (FAIL): backend modules 하위 bare `throw new Error` 0건 요구에 5건 잔존. 해당 5건은 plan의 out-of-scope (exhaustiveness checks + startup IIFE invariant)이나 계약 M-9는 이를 명시 예외로 등록하지 않음.

3. **M-13** (FAIL): 클라이언트 session.user.role grep 3 hits (expected: 0). use-auth.ts:29에 `// allow:` 인라인 주석 미등재가 핵심 원인. 2건은 금지 패턴 reminder 코멘트 라인으로 실제 코드 위반은 아니나 grep 결과에 포함.

4. **M-15** (FAIL): `use-auth.ts:29`에 `// allow: actualRole-only by design` 인라인 주석 미등재. Phase 3B에서 계획된 주석이 실제 적용되지 않음.

5. **M-16a** (PARTIAL FAIL): `verify-ssot` Step 37에 `// allow:` 패턴 예외 미등재 (use-auth.ts 예외 항목 누락). baseline metric은 등재됨.

6. **M-16b** (PARTIAL FAIL): `verify-zod` Step 16 4b baseline grep 명령이 실제 코드와 불일치 (NOTE 주석 전 줄 위치로 인해 grep -vE 필터 불동작 → 6 hits).

---

## Repeated failures (iter 1 vs prior)

(iter 1 — 이전 비교 없음)

---

## Multi-session impact note

다른 세션 test fail이 push 차단했으나 본 sprint scope 외. Phase 1~3A는 origin/main에 이미 push 완료, Phase 3B는 local commit으로 보존.

- `apps/frontend/lib/calibration/__tests__/validate-certificate-file.test.ts` (calibration cert phase A 세션)
- `apps/frontend/hooks/__tests__/use-checkout-group-aggregates.test.ts` (타 세션)
- 위 2건은 본 sprint 평가 범위 외. M-5 (frontend test 66 suites PASS)와 충돌 없음.

---

## Recommendations

**Verdict: FAIL** — iter 2에서 다음 4가지만 수정 후 재평가 권장:

### iter 2 필수 수정 (4건)

1. **M-15 fix**: `apps/frontend/hooks/use-auth.ts:29`에 인라인 주석 추가:
   ```ts
   const userRole = session?.user?.role; // allow: actualRole-only by design
   ```
   이 수정 하나로 M-13 (use-auth.ts:29 1 hit), M-15 (주석 없음) 동시 해소.
   코멘트 라인 2건 (DashboardClient:81, CheckoutGroupCard:126)은 실제 코드 위반 아니나 grep에 걸림 — "session.user.role 직접 참조 금지"가 아닌 다른 표현으로 수정하거나 grep 필터에 제외 패턴 추가 필요.

2. **M-4 fix**: `approvals.service.spec.ts`에 createDelegation throw branch 테스트 2건 추가:
   - `delegatorId === delegateeId` → `ApprovalDelegationSelfDelegationForbidden` throw
   - `startsAt >= endsAt` → `ApprovalDelegationInvalidPeriod` throw

3. **M-9 / M-16b fix (계약 해석 정정)**: 두 가지 선택지:
   - **Option A (계약 수정)**: M-9 grep 명령에 5개 정당 예외 파일 추가 (`| grep -v "calibration-certificate.controller.ts\|equipment-import.types.ts\|excel-parser.service.ts"`). 이후 M-9 0건 충족.
   - **Option B (코드 수정)**: 5건 exhaustiveness throw를 SyntaxError/다른 Error 서브클래스로 변환 후 inline `// TypeScript exhaustiveness` 주석 병행 추가하여 verify-zod Step 16 4b grep 필터 동작 수정.
   verify-zod Step 16 4b baseline grep도 NOTE 주석 위치(전 줄)에 맞게 grep -B1 또는 다른 방식으로 수정 필요.

4. **M-16a fix**: `verify-ssot/references/permissions-roles.md` Step 37 예외 섹션에 `hooks/use-auth.ts — allow: actualRole-only (permission helper는 actualRole 기준)` 항목 추가.
