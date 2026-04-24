---
slug: checkout-fsm-resolve-action
date: 2026-04-24
iteration: 1
verdict: FAIL
---

# Evaluation Report

## Summary

Sprint 1.1 구현은 핵심 로직(M1·M6·M7·M10·M11·M12·M13)을 올바르게 완성했으나, **M2(backend filter로 schemas 테스트 실행 불가)**와 **M14(변경 파일 수 초과: 4개 아닌 5개)**가 하드 실패다. M3·M4는 계약 수치(208, UserRole)와 구현 수치(280, FixtureUserRole)가 다르지만, 계약 본문 자체가 "실제 enum count로 조정"을 명시하고 FixtureUserRole이 UserRole과 동일 5개 값을 가지므로 실질 통과로 판단한다. M8은 `getPermissions(req.user.role)` 명시 호출 대신 JWT에 pre-compute된 `req.user.permissions`를 사용해 계약 문구와 차이가 있으나 결과가 동등하고 보안상 더 안전한 패턴이므로 조건부 PASS로 분류한다.

---

## MUST Criteria Results

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M1 | `pnpm tsc --noEmit` exit 0 | PASS | `pnpm --filter backend exec tsc --noEmit` exit code 0. 타입 오류 없음. |
| M2 | `pnpm --filter backend run test` 전체 통과 + 신규 table test 포함 | FAIL | Backend: 72 suites/938 tests 전부 PASS. 그러나 계약 verification 커맨드 `pnpm --filter backend run test -- checkout-fsm.table`는 "No tests found" (exit 1). 테스트 파일이 `packages/schemas/`에 있어서 `--filter backend` 범위 밖. Schemas 자체 테스트로는 checkout-fsm.table PASS (566 tests). |
| M3 | `checkout-fsm.table.test.ts` 존재 + 208 조합 커버 | PASS | 파일 존재 확인. `it('covers all 280 (status × purpose × role) combinations')` — 수치는 280(계약 208 아님)이나 계약 본문이 "실제 enum count로 조정"을 명시. 실제 enum: 14 status × 4 purpose × 5 role = 280. `expect(Object.keys(DESCRIPTOR_TABLE).length).toBe(EXPECTED_ENTRY_COUNT)` assertion 존재. |
| M4 | `DESCRIPTOR_TABLE` export = `Record<status:purpose:UserRole, Pick<NextStepDescriptor, ...>>` | PASS (실질) | 계약은 `UserRole` (4 roles, 'admin' 포함)을 명시했으나 실제 `UserRole` enum은 5종 ('system_admin', 'admin' 없음). `FixtureUserRole`은 실제 `UserRole`과 동일 5개 값. `satisfies Record<TableKey, TableRow>` 적용. `TableKey = ${CheckoutStatus}:${CheckoutPurpose}:${FixtureUserRole}`, `TableRow = Pick<NextStepDescriptor, 'nextAction' \| 'nextActor' \| 'availableToCurrentUser'>`. |
| M5 | `satisfies`로 컴파일 타임 누락 검증 | PASS | L67: `as const satisfies readonly FixtureUserRole[]`, L97: `buildDescriptorTable() satisfies Record<TableKey, TableRow>`. 두 군데 모두 적용. |
| M6 | `if (userPermissions)` 조건부 분기 제거 | PASS | `grep -n "if (userPermissions)"` = 0 hit. |
| M7 | `userPermissions?:` optional → required 전환 | PASS | `grep -nE "userPermissions\?:"` = 0 hit. `findOne(uuid: string, userPermissions: readonly string[], userTeamId?: string)` — required. |
| M8 | 모든 controller 핸들러가 `getPermissions(req.user.role)` 계산 후 서비스 전달 | PASS (조건부) | `getPermissions()` 함수를 controller에서 직접 호출하지 않음. 대신 JWT strategy에서 `derivePermissionsFromRoles(payload.roles)`로 pre-compute한 `req.user.permissions`를 사용. 의미론적으로 동등하고 단일-역할 사용자에서 결과 동일. L147: `req.user?.permissions ?? []`, L317: `req.user?.permissions || []`. **계약 문구(`getPermissions(req.user.role)` 명시 호출)와는 다르지만 결과가 동등하고 보안상 더 적절하다.** |
| M9 | `calculateAvailableActions` 입력 `role: UserRole \| undefined` → required | PASS | `private calculateAvailableActions(checkout: Checkout, userPermissions: readonly string[], userTeamId?: string)` — role 파라미터 제거 후 userPermissions으로 대체, non-null required. 빌드 통과. |
| M10 | 응답 `meta` 필드에 `availableActions`+`nextStep` required 정의 | PASS | `CheckoutWithMeta` interface: `meta: { availableActions: CheckoutAvailableActions; nextStep: NextStepDescriptor; }` — `?` 없음. `findOne()` 리턴 타입 `Promise<CheckoutWithMeta>`, 항상 populate. |
| M11 | `getNextStep` 로직 재구현 없음 | PASS | `grep -rn "function getNextStep\|const getNextStep =" apps/ packages/ --include="*.ts" \| grep -v schemas/src/fsm/` = 0 hit (dist 제외). |
| M12 | 프론트엔드 훅 2종이 schemas import 경유 | PASS | `use-checkout-next-step.ts:13` + `use-checkout-group-descriptors.ts:9` 모두 `from '@equipment-management/schemas'` 확인. 변경 없음. |
| M13 | 드리프트 감지: `Logger.warn('[FSM drift] ...')` 1곳 이상 | PASS | `checkouts.service.ts:269` — `this.logger.warn('[FSM drift] server response rejected by schema', { checkoutId, status, purpose, issues })`. `NextStepDescriptorSchema.safeParse()` 실패 시 발동. |
| M14 | 변경 파일 = backend 2 + schemas 2 = 총 4개 | FAIL | `git diff --name-only`: 3개(service.ts + controller.ts + **spec.ts**) + untracked 1개(schemas `__tests__/` 디렉토리). 계약은 "backend 2개 + schemas 2개"를 지정했으나, `checkouts.service.spec.ts`가 추가 수정돼 backend 3개로 초과. |

---

## SHOULD Criteria Results

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | terminal 케이스가 3종 × 4 purpose × 4 role = 48건과 일치 | FAIL | 계약은 48 (4 roles)을 명시했으나, 실제 구현은 5 roles로 60건. 테스트 통과: `terminal states produce 60 null-action entries ✓`. 계약 수치가 잘못된 enum count 기반이므로 구현이 올바르다. tech-debt 등록 대상. |
| S2 | `pnpm --filter schemas run gen:descriptor-table` 스크립트 제공 | FAIL | `packages/schemas/package.json`에 `gen:descriptor-table` 스크립트 없음. 파일 주석에 "재생성: `pnpm --filter schemas run gen:descriptor-table`" 언급만 있고 실제 스크립트 미구현. |
| S3 | `calculateAvailableActions`와 `getNextStep`이 동일 transition table 참조 | PASS | 양쪽 모두 `canPerformAction` (CHECKOUT_TRANSITIONS 기반) 경유. `calculateAvailableActions`는 `canPerformAction(fsmInput, action, userPermissions).ok` 패턴 사용. 단, 완전한 리팩토링은 아니고 `canPerformAction`만 공유. |
| S4 | table test fail 시 diff 출력 | FAIL | 커스텀 reporter 없음. 기본 jest diff (toMatchSnapshot의 inline diff). 전용 diff reporter 미구현. |

---

## Issues (FAIL criteria repair instructions)

### M2 FAIL — 수정 필요

**문제**: 계약 verification 커맨드 `pnpm --filter backend run test -- checkout-fsm.table`가 "No tests found"로 실패. 테스트는 `packages/schemas/`에 있어 `--filter backend`로 실행 불가.

**근본 원인**: 계약 작성 시 `pnpm --filter backend run test -- checkout-fsm.table` 커맨드가 잘못 명시됨. 테스트 파일을 backend로 이동하거나, 계약 verification 커맨드를 수정해야 함.

**수정 옵션**:
1. 계약을 수정해 verification command를 `pnpm --filter schemas run test` (또는 `npx --prefix packages/schemas jest checkout-fsm.table`)로 교체 — 구현은 맞고 계약이 틀림
2. 또는 root `pnpm test` 실행으로 통합 검증 방식으로 문서 업데이트

**긴급도**: 실제 테스트는 통과하므로 다음 루프 전 계약 문서 수정으로 해소 가능.

---

### M14 FAIL — 수정 필요

**문제**: `checkouts.service.spec.ts`가 계약 scope 밖에서 수정됨. 계약은 "backend 2개 + schemas 2개 = 4개"를 지정했으나 실제는 backend 3개 + schemas 1 dir = 4 items이나 backend 내 파일 수가 초과.

**수정**: `checkouts.service.spec.ts` 수정이 필요한지 검토. 만약 `findOne` 시그니처가 변경되어 spec 수정이 불가피했다면, 계약의 M14 수치가 애초에 잘못 계산된 것이므로 **계약 업데이트**가 해결책.

**실질 영향**: spec 수정은 새 필수 파라미터 `[]` 추가로 테스트를 올바르게 유지하는 필수 변경. M14 기계적 위반이지만 실질 문제는 없음. 계약을 "backend 3개 + schemas 2개 = 5개"로 업데이트 권고.

---

## Post-merge actions

- **tech-debt** 등록 필요:
  - `fsm-fixture-generator-script` (S2): `packages/schemas/package.json`에 `gen:descriptor-table` 스크립트 추가 (스크립트 파일도 같이)
  - `fsm-table-diff-reporter` (S4): 테이블 테스트 fail 시 expected vs actual diff 출력 커스텀 reporter 구현
  - `fsm-table-terminal-count` (S1): 계약 수치 48 → 60으로 정정 (이미 구현은 올바름, 문서 정합성)

- **계약 문서 수정** (다음 PR 전):
  - `checkout-fsm-resolve-action.md` M2 verification command: `--filter backend`→`--filter schemas`
  - M14 수치: 4 → 5
  - M3 208 → 280
  - S1 48 → 60
  - 208 산출 근거 섹션: `UserRole 4종` → `UserRole 5종`

---

## QA 판정 근거 요약

**FAIL 판정 이유**: M2와 M14가 하드 실패 기준을 충족.
- M2: 계약에 명시된 verification 커맨드(`--filter backend run test -- checkout-fsm.table`)가 실제로 실행하면 exit 1. 루프 차단 요건.
- M14: 변경 파일 수 4개 기준 위반 (backend 3개 수정).

단, 두 실패 모두 **계약 문서가 잘못 작성된 결과**이며 실제 구현의 기능적 오류는 없다. 루프 차단 기준에 따라 FAIL이나, 계약 수정 후 재평가 시 전체 통과 예상.
