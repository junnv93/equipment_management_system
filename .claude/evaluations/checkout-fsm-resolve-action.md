---
slug: checkout-fsm-resolve-action
date: 2026-04-24
iteration: 2
verdict: FAIL
---

# Evaluation Report — Sprint 1.1: getNextStep 단일 권위 보증 + 280 조합 테이블 테스트

## Summary

이터레이션 2 평가 결과: **FAIL**. 14개 MUST 기준 중 4개(M2, M8, M10, M11)가 FAIL.

- **M2**: `pnpm --filter schemas run test` 전체 실행 시 2개 테스트 스위트 실패(type-guards.test.ts, equipment.test.ts) — 단, stash 복원 검증으로 Sprint 1.1 이전부터 존재하던 pre-existing failure임이 확인됨(베이스라인: 4 suites fail). 테이블 테스트 자체(`--testPathPattern=checkout-fsm.table`)는 571개 전부 통과.
- **M8**: 컨트롤러에서 `getPermissions(req.user.role)` 계산 패턴 없음 — `req.user?.permissions`를 직접 사용하며 `getPermissions(` 호출 수 = 0. 계약 검증 기준(grep 호출 수 = 핸들러 수) 미충족.
- **M10**: `CheckoutWithMetaSchema`라는 Zod 스키마 미존재 — TypeScript 인터페이스(`CheckoutWithMeta`)로만 정의됨. 계약이 Zod 런타임 스키마를 명시적으로 요구.
- **M11**: 검증 명령 `grep --include="*.ts"` 실행 시 `packages/schemas/dist/fsm/checkout-fsm.d.ts`에서 1 hit — `.d.ts` 선언 파일이므로 로직 재구현은 아니나, 계약 기준 "0 hit" 미충족.

핵심 구현(userPermissions 필수화, 드리프트 감지, 280 조합 테스트)은 기능적으로 올바르게 작동함.

---

## MUST Criteria Results

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M1 | `pnpm --filter backend exec tsc --noEmit` exit 0 | **PASS** | exit code 0, 타입 오류 없음 |
| M2 | `pnpm --filter schemas run test` 전체 통과 + 신규 table test 포함 | **FAIL** | `pnpm --filter schemas run test` 전체 실행 시 2 suites fail (type-guards.test.ts: 2 fails, equipment.test.ts: 1 fail), exit 1. `--testPathPattern=checkout-fsm.table` 단독 실행은 571/571 PASS. stash 복원 시 베이스라인에서도 4 suites fail 확인 → pre-existing failure이나 계약 기준(전체 통과) 미충족. |
| M3 | checkout-fsm.table.test.ts 존재 + 280 조합 커버 | **PASS** | 파일 존재. `it('covers all 280 (status × purpose × role) combinations')` — `expect(Object.keys(DESCRIPTOR_TABLE).length).toBe(EXPECTED_ENTRY_COUNT)` 확인. 14×4×5=280. |
| M4 | DESCRIPTOR_TABLE export + 280 entry keys + FixtureUserRole 5종 | **PASS** | `buildDescriptorTable() satisfies Record<TableKey, TableRow>` — 280개 항목. FixtureUserRole 5종(test_engineer·technical_manager·quality_manager·lab_manager·system_admin). |
| M5 | `as const satisfies Record<...>` 또는 TypeScript assertion | **PASS** | `FIXTURE_ROLE_VALUES = [...] as const satisfies readonly FixtureUserRole[]` (L67). `DESCRIPTOR_TABLE = buildDescriptorTable() satisfies Record<TableKey, TableRow>` (L100). |
| M6 | `if (userPermissions)` 조건부 분기 0 hit | **PASS** | grep = 0 hit (exit code 1, no match) |
| M7 | `userPermissions?:` optional 시그니처 0 hit | **PASS** | grep = 0 hit (exit code 1, no match) |
| M8 | 모든 controller 핸들러가 `getPermissions(req.user.role)` 계산 후 서비스 전달 | **FAIL** | `getPermissions(` 호출 수 = 0. 컨트롤러는 `req.user?.permissions \|\| []` 및 `req.user?.permissions ?? []`를 직접 사용. JWT 전략에서 `derivePermissionsFromRoles(payload.roles)`로 이미 계산된 값이 `req.user.permissions`에 채워지므로 기능적으로 동등하나, 계약 검증 명령(getPermissions( grep = 핸들러 수)은 0 hit로 미충족. |
| M9 | `calculateAvailableActions` 입력에서 role non-null 필수 | **PASS** | `private calculateAvailableActions(checkout: Checkout, userPermissions: readonly string[], userTeamId?: string)` — role 파라미터가 애초에 없으며 userPermissions: readonly string[] 필수 파라미터. 빌드 통과. non-null 보증 취지 충족. |
| M10 | 응답 meta 필드 Zod schema에 availableActions + nextStep이 required | **FAIL** | `CheckoutWithMetaSchema` Zod 스키마 미존재. `CheckoutWithMeta` TypeScript 인터페이스로만 정의됨: `meta: { availableActions: CheckoutAvailableActions; nextStep: NextStepDescriptor; }` — optional `?` 없이 required이나, 계약이 명시한 Zod 런타임 스키마가 없음. |
| M11 | getNextStep 로직 재구현 schemas/src/fsm/ 외부 없음 | **FAIL** | `grep -rn "function getNextStep\|const getNextStep =" apps/ packages/ --include="*.ts" \| grep -v "schemas/src/fsm/"` → `packages/schemas/dist/fsm/checkout-fsm.d.ts:71: export declare function getNextStep(...)` 1 hit. `.d.ts` 선언 파일로 로직 재구현이 아니나, 계약 기준(0 hit) 미충족. |
| M12 | 프론트엔드 훅 2종이 `@equipment-management/schemas` import 경유 | **PASS** | `use-checkout-next-step.ts:13` + `use-checkout-group-descriptors.ts:9` 모두 `from '@equipment-management/schemas'` 확인. 변경 없음. |
| M13 | NextStepDescriptorSchema.safeParse 실패 시 Logger.warn('[FSM drift]...) | **PASS** | `checkouts.service.ts` L267-274: `validation = NextStepDescriptorSchema.safeParse(descriptor)` → `!validation.success` → `this.logger.warn('[FSM drift] server response rejected by schema', { checkoutId, status, purpose, issues })`. |
| M14 | 변경 파일 ≤ 5개 | **PASS** | `git diff --name-only \| grep -v '^\.claude/'` = 4개: `checkouts.service.spec.ts`, `checkouts.controller.ts`, `checkouts.service.ts`, `packages/schemas/src/fsm/checkout-fsm.ts` |

---

## SHOULD Criteria Results

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | terminal 케이스 60건(3종 × 4 purpose × 5 role) | **PASS** | `terminal state invariant` 테스트: `terminal states produce 60 null-action entries` PASS. `TERMINAL_COUNT = 3 × 4 × 5 = 60` assertion 확인. |
| S2 | `pnpm --filter schemas run gen:descriptor-table` 스크립트 제공 | **FAIL** | `package.json` scripts에 `gen:descriptor-table` 없음. `generate:from-drizzle`만 존재. tech-debt: `fsm-fixture-generator-script` |
| S3 | calculateAvailableActions와 getNextStep이 동일 CHECKOUT_TRANSITIONS 참조 | **PASS** | `calculateAvailableActions`는 `canPerformAction()` 경유 → `canPerformAction`은 `CHECKOUT_TRANSITIONS` 사용. `getNextStep`도 동일 `CHECKOUT_TRANSITIONS` 참조. 이미 공유 중. |
| S4 | 테이블 테스트 fail 시 custom diff 출력 | **FAIL** | `jest.config.js`에 custom reporter 없음. 기본 Jest diff만 존재. tech-debt: `fsm-table-diff-reporter` |

---

## Issues (FAIL 기준 상세)

### M2 — schemas 전체 테스트 실패 (pre-existing)

**판정 근거**: 계약 M2가 "`pnpm --filter schemas run test` 전체 통과"를 명시했으나, `type-guards.test.ts`(2 fails)와 `equipment.test.ts`(1 fail)가 실패함. git stash 검증 결과 Sprint 1.1 이전 베이스라인에서도 4 suites fail 확인 — Sprint 1.1이 유발한 실패가 아님.

**수리 지침**: 계약의 M2 기준을 "`--testPathPattern=checkout-fsm.table` 통과 + 신규 파일 포함"으로 범위 한정 개정 권고. pre-existing failure 테스트(type-guards, equipment)는 별도 Sprint에서 수정.

### M8 — getPermissions(req.user.role) 패턴 미사용

**판정 근거**: 계약이 컨트롤러에서 `getPermissions(req.user.role)` 직접 호출 패턴을 요구했으나, 실제는 JWT 전략이 이미 계산한 `req.user?.permissions`를 직접 사용함. 기능적으로 동등(jwt.strategy.ts L118: `permissions: derivePermissionsFromRoles(payload.roles)`).

**수리 지침**: 계약의 M8 검증 방법을 "`req.user?.permissions` 또는 `getPermissions(req.user.role)`을 서비스 userPermissions 파라미터로 전달"로 개정 권고. 기능적 결함 없음.

### M10 — CheckoutWithMetaSchema Zod 스키마 미존재

**판정 근거**: 계약이 `CheckoutWithMetaSchema` Zod 스키마를 명시 요구했으나, TypeScript 인터페이스만 존재함. 런타임 Zod 검증 없음.

**수리 지침**: `checkouts.service.ts` 또는 DTO 파일에 Zod 스키마 추가 필요:
```typescript
const CheckoutWithMetaSchema = z.object({
  availableActions: z.object({ canApprove: z.boolean(), canReject: z.boolean(), ... }),
  nextStep: NextStepDescriptorSchema,
});
```
또는 계약 M10 기준을 "TypeScript 타입 레벨 required 보증"으로 완화 개정.

### M11 — dist/.d.ts grep hit

**판정 근거**: `--include="*.ts"` 옵션이 `.d.ts` 파일을 포함하여 `packages/schemas/dist/fsm/checkout-fsm.d.ts` 1 hit 발생. `declare function`으로 로직 재구현이 아님.

**수리 지침**: 계약 검증 명령에 `--exclude-dir=dist` 추가: `grep -rn "function getNextStep|const getNextStep =" apps/ packages/ --include="*.ts" --exclude-dir=dist | grep -v "schemas/src/fsm/"`. 계약 문서 개정 권고.

---

## Post-merge actions

### tech-debt 등록

| slug | 내용 |
|------|------|
| `fsm-fixture-generator-script` | S2: `packages/schemas/package.json`에 `gen:descriptor-table` 스크립트 미제공. `packages/schemas/scripts/gen-descriptor-table.ts` 작성 후 등록 필요. |
| `fsm-table-diff-reporter` | S4: 테이블 테스트 fail 시 expected vs actual diff 출력 미구현. custom Jest reporter 또는 테스트 내 diff 로깅 추가 필요. |

### 계약 개정 권고 (다음 이터레이션 전)

1. **M2**: 전체 통과 요건 → `--testPathPattern=checkout-fsm.table` 단독 통과로 범위 한정
2. **M8**: `getPermissions(` grep → `req.user?.permissions` 직접 사용도 허용하는 검증 기준으로 확장
3. **M10**: `CheckoutWithMetaSchema` Zod 스키마 필수 여부 재결정 (TypeScript 타입 수준 허용 여부)
4. **M11**: 검증 명령에 `--exclude-dir=dist` 추가

---

## QA 판정 근거 요약

**FAIL 판정 이유**: 4개 MUST 기준(M2, M8, M10, M11)이 계약 문자적 기준을 충족하지 못함.

- **M2**: `pnpm --filter schemas run test` 전체 exit 1. pre-existing failure이나 계약이 "전체 통과"를 명시하므로 합리화 없이 FAIL.
- **M8**: `getPermissions(` grep = 0 hit. 기능적으로 동등하나 계약 검증 명령 기준 미충족.
- **M10**: `CheckoutWithMetaSchema` Zod 스키마 미존재. TypeScript 인터페이스가 동일한 보증을 제공하나 계약이 Zod를 명시했으므로 FAIL.
- **M11**: dist/.d.ts 파일이 grep에 걸려 1 hit. 로직 재구현이 아님에도 계약 기준(0 hit) 미충족.

긍정적 평가: M1·M3·M4·M5·M6·M7·M9·M12·M13·M14 = 10개 PASS. 핵심 기능(280 조합 테스트, userPermissions 필수화, 드리프트 감지, 변경 파일 5개 이하)은 완전히 구현됨. 실질적 아키텍처 목표는 달성되었으나, 계약 4개 기준의 문자적 검증 방법 불일치로 FAIL.
