---
name: verify-checkout-fsm
description: Checkout FSM SSOT 아키텍처 검증 — Dependency Inversion(UserRole import 금지), assertFsmInvariants, CheckoutPermissionKey 동기화, assertFsmAction 헬퍼, calculateAvailableActions sync, FSM_TO_AUDIT_ACTION 커버리지, lenderTeam identity-rule 강제 패턴, NO_EQUIPMENT 가드 배치, rental reject_return 전이+장비상태 복구(Step 20a), findCheckoutEntity 분리(Step 28), findOne userPermissions 필수(Step 29), FSM drift safeParse(Step 30), findOne CheckoutWithMeta 단일 반환(Step 31), EXPECTED_ENTRY_COUNT 동적 table test(Step 32), rental-phase.ts SSOT exhaustiveness guard(Step 33), resolveActorVariant 순수 함수 SSOT + data-variant/data-actor-variant 속성(Step 34), roleToActorVariant+ActorVariant schemas SSOT+isMyTurn UserRoleValues.SYSTEM_ADMIN(Step 35), reachedStepIndex 3분기+computeReachedStepIndex terminatedFromStatus 위임(Step 36), terminatedFromStatus terminal 저장 패턴(Step 37). packages/schemas/src/fsm/** 또는 checkouts.service.ts 또는 NextStepPanel.tsx 변경 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 검사 항목]'
---

# Checkout FSM SSOT 검증

## Purpose

`packages/schemas/src/fsm/checkout-fsm.ts`에 정의된 Checkout FSM(유한 상태 기계)의 아키텍처 규칙을 검증합니다:

1. **Dependency Inversion 패턴** — `canPerformAction` / `getNextStep` 함수가 `UserRole` 타입을 직접 import하지 않고 `readonly string[]`으로 권한을 받음
2. **`assertFsmInvariants` 호출** — 모듈 로드 시점에 FSM 불변식이 자동 검증되는지 확인
3. **`CheckoutPermissionKey` 로컬 string union** — Permission enum을 직접 import하지 않고 로컬에서 미러링하는 패턴이 `shared-constants`와 동기화되어 있는지 확인
4. **FSM 소비자의 브릿지 패턴** — 컨트롤러/서비스에서 `getPermissions(role)` 결과를 `string[]`으로 전달하는 패턴 준수

## 배경: Dependency Inversion 설계 결정

`packages/schemas`는 `@equipment-management/shared-constants`에 의존하면 순환 의존성이 발생합니다:

```
schemas ← shared-constants ← schemas  (순환!)
```

따라서 FSM 함수는 `Permission` enum을 직접 받지 않고 `readonly string[]`으로 받습니다.
소비자(컨트롤러/서비스)가 `getPermissions(role)` 브릿지를 통해 string[]으로 변환하여 전달합니다.

## When to Run

- `packages/schemas/src/fsm/**` 변경 후
- `CHECKOUT_TRANSITIONS` 테이블 수정 후
- 새 Permission이 `@equipment-management/shared-constants`에 추가된 후 (`CheckoutPermissionKey` 동기화 필요)
- checkout 관련 컨트롤러/서비스에서 FSM 함수 호출 패턴 변경 후
- `checkouts.service.ts` guard/helper 패턴 변경 후 (PR-2 이후)

## Related Files

| File | Purpose |
|---|---|
| `packages/schemas/src/fsm/checkout-fsm.ts` | FSM SSOT — TransitionRule, 상태 전이 테이블, 공개 API |
| `packages/schemas/src/fsm/rental-phase.ts` | RentalPhase SSOT — RENTAL_STATUS_TO_PHASE, getRentalPhase, getPhaseIndex, @ts-expect-error negative test (Sprint 1.2 신규) |
| `packages/schemas/src/fsm/index.ts` | barrel 재내보내기 |
| `packages/schemas/src/checkout.ts` | `nextStep` 필드 포함 Checkout 응답 스키마 |
| `packages/schemas/src/__tests__/checkout-fsm.test.ts` | FSM 불변식 + 상태 전이 단위 테스트 (55건) |
| `packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts` | 280 조합 exhaustive table test (Sprint 1.1 신규) |
| `packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts` | DESCRIPTOR_TABLE baseline fixture — `getNextStep()` 런타임 동적 계산 |
| `packages/shared-constants/src/permissions.ts` | Permission enum SSOT — `CheckoutPermissionKey` 동기화 기준 |
| `apps/backend/src/modules/checkouts/checkouts.service.ts` | FSM 소비자 — assertFsmAction, calculateAvailableActions, buildNextStep, FSM_TO_AUDIT_ACTION |
| `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` | 프론트엔드 FSM 소비자 — handleNextStepAction dispatcher, CheckoutAction 전체 매핑 |

## Workflow

### Step 1: Dependency Inversion — UserRole 직접 import 금지

FSM 파일이 `UserRole` 또는 `Permission`을 직접 import하면 순환 의존성 발생.

**PASS:** `shared-constants` import 0건 + `UserRole`/`Permission` import 0건.
**FAIL:** shared-constants import 또는 UserRole/Permission import 발견.

상세: [references/fsm-core.md](references/fsm-core.md#step-1-dependency-inversion--userrole-직접-import-금지)

### Step 2: 함수 시그니처 — readonly string[] 패턴

`canPerformAction`, `getNextStep`이 `userPermissions: readonly string[]`을 받는지 확인.

**PASS:** `readonly string[]` 타입 사용.
**FAIL:** `UserRole[]` 또는 `Permission[]` 타입 사용.

상세: [references/fsm-core.md](references/fsm-core.md#step-2-함수-시그니처--readonly-string-패턴)

### Step 3: assertFsmInvariants 모듈 로드 시 실행

모듈 최상위 레벨에서 `assertFsmInvariants(CHECKOUT_TRANSITIONS)` 호출 확인.

**PASS:** 1건 이상 + 함수 정의 외부(모듈 레벨) 위치.
**FAIL:** 0건 또는 함수 내부에 위치.

상세: [references/fsm-core.md](references/fsm-core.md#step-3-assertfsminvariants-모듈-로드-시-실행)

### Step 4: CheckoutPermissionKey와 Permission enum 동기화

`CheckoutPermissionKey` 로컬 string union 값이 `shared-constants`의 `Permission` enum과 일치하는지 확인.

**PASS:** `CheckoutPermissionKey`의 모든 값이 `Permission` enum에 대응.
**FAIL:** Permission enum에 없는 값이 CheckoutPermissionKey에 있거나, checkout 권한 추가 후 CheckoutPermissionKey에 없음.

상세: [references/fsm-core.md](references/fsm-core.md#step-4-checkoutpermissionkey와-permission-enum-동기화)

### Step 5: FSM 소비자 브릿지 패턴 — req.user.permissions 경유 (PR-2 이후)

서비스에서 `getPermissions(role)` 직접 호출 금지. `req.user?.permissions` 경유 필수.

**PASS:** 서비스에서 `getPermissions(` 0건 + `req.user?.permissions` 경유.
**FAIL:** 서비스에서 `getPermissions(role)` 직접 호출하거나 `role` 값을 직접 전달.

상세: [references/fsm-core.md](references/fsm-core.md#step-5-fsm-소비자-브릿지-패턴--requserpermissions-경유-pr-2-이후)

### Step 6: CHECKOUT_TRANSITIONS 테이블 완전성 — 단위 테스트 커버리지 확인

테스트 파일 존재 + 불변식 테스트 30건 이상.

**PASS:** 테스트 파일 EXISTS + 테스트 30건 이상.
**FAIL:** 파일 없거나 테스트 수 부족.

상세: [references/fsm-core.md](references/fsm-core.md#step-6-checkout_transitions-테이블-완전성--단위-테스트-커버리지-확인)

### Step 7: nextStep 필드 — 응답 스키마 + 프론트엔드 API 타입 동기화

`checkout.ts` backend + `checkout-api.ts` frontend 양쪽에 `nextStep` 필드 존재.

**PASS:** backend `NextStepDescriptorSchema` + frontend `Checkout.meta.nextStep?: NextStepDescriptor | null` 선언.
**FAIL:** 둘 중 하나라도 누락 → useCheckoutNextStep이 항상 client fallback으로 동작.

상세: [references/fsm-core.md](references/fsm-core.md#step-7-nextstep-필드--응답-스키마--프론트엔드-api-타입-동기화-확인)

### Step 8: assertFsmAction 헬퍼 존재 및 패턴 (PR-2 이후)

private `assertFsmAction` 정의 1건 + 호출 ≥ 8건 + 레거시 에러 코드 0건.

**PASS:** 정의 1건 + 호출 ≥ 8건 + 레거시 에러 코드 0건.
**FAIL:** 정의 없음, 호출 부족, 레거시 에러 코드 잔존.

상세: [references/fsm-core.md](references/fsm-core.md#step-8-assertfsmaction-헬퍼-존재-및-패턴-pr-2-이후)

### Step 9: calculateAvailableActions sync 패턴 (PR-2 이후)

`private async calculateAvailableActions` 0건 + `private calculateAvailableActions` 1건 + Permission 하드코딩 0건.

**PASS:** sync 메서드 1건 + Permission 하드코딩 0건.
**FAIL:** async 잔존 또는 Permission 하드코딩 발견.

상세: [references/fsm-core.md](references/fsm-core.md#step-9-calculateavailableactions-sync-패턴-pr-2-이후)

### Step 10: buildNextStep + findOne 메타 포함 (PR-2 이후)

`private buildNextStep` 1건 + `meta: { availableActions, nextStep }` 조합 존재.

**PASS:** buildNextStep 정의 1건 + meta.nextStep 조합 존재.
**FAIL:** 둘 중 하나 없음.

상세: [references/fsm-core.md](references/fsm-core.md#step-10-buildnextstep--findone-메타-포함-pr-2-이후)

### Step 11: FSM_TO_AUDIT_ACTION 모든 CheckoutAction 커버 (PR-2 이후)

`FSM_TO_AUDIT_ACTION`이 `Record<CheckoutAction, AuditAction>` 타입으로 선언되어 tsc 완전성 보장.

**PASS:** `Record<CheckoutAction, AuditAction>` 타입 선언 + tsc 통과.
**FAIL:** Record 타입 없음 → 부분 커버 시 컴파일 에러로 탐지 불가.

상세: [references/fsm-core.md](references/fsm-core.md#step-11-fsm_to_audit_action-모든-checkoutaction-커버-pr-2-이후)

### Step 12: assertFsmAction HTTP 의미론 — 403/400 분리 (세션 이후)

`invalid_transition`→400(BadRequestException), permission denied→403(ForbiddenException) 분리.

**PASS:** `invalid_transition`→400, `CHECKOUT_FORBIDDEN`→403 분리.
**FAIL:** `CHECKOUT_FORBIDDEN`이 `BadRequestException`에 포함.

상세: [references/fsm-core.md](references/fsm-core.md#step-12-assertfsmaction-http-의미론--403400-분리-세션-이후)

### Step 13: Controller guard ↔ FSM permission 정렬 (세션 이후)

approve→APPROVE_CHECKOUT, approve-return→APPROVE_CHECKOUT, reject-return→REJECT_CHECKOUT.

**PASS:** 세 엔드포인트 guard가 FSM 요구 Permission과 일치.
**FAIL:** VIEW_CHECKOUTS가 세 엔드포인트 중 하나에 사용됨.

상세: [references/fsm-core.md](references/fsm-core.md#step-13-controller-guard--fsm-permission-정렬-세션-이후)

### Step 14: writeTransitionAudit best-effort 캡슐화 (세션 이후)

메서드 내부 try/catch 1건 + 콜사이트 try/catch 0건.

**PASS:** 메서드 내부 try/catch 1건 + 콜사이트 0건.
**FAIL:** 콜사이트에 try/catch 잔존.

상세: [references/fsm-core.md](references/fsm-core.md#step-14-writetransitionaudit-best-effort-캡슐화-세션-이후)

### Step 15: 예외 계층 일관화 — 7개 FSM 메서드 catch 블록 (세션 이후)

ForbiddenException ≥ 7건 + ConflictException ≥ 7건 + lenderTeam ForbiddenException 2건/BadRequestException 0건.

**PASS:** 모든 카운트 충족.
**FAIL:** 어느 하나라도 카운트 미달이거나 BadRequestException으로 잘못 분류.

상세: [references/fsm-core.md](references/fsm-core.md#step-15-예외-계층-일관화--7개-fsm-메서드-catch-블록-세션-이후)

### Step 16: CheckoutErrorCode SSOT — 인라인 에러 코드 문자열 금지 (2026-04-22 이후)

service.ts + controller.ts 모두 인라인 `'CHECKOUT_*'` 문자열 0건, `CheckoutErrorCode` import 존재.

**PASS:** 인라인 문자열 0건 + CheckoutErrorCode import 존재.
**FAIL:** 인라인 문자열 1건 이상 → checkout-error-codes.ts에 키 추가 후 참조 전환.

상세: [references/scope-identity.md](references/scope-identity.md#step-16-checkouterrorcode-ssot--인라인-에러-코드-문자열-금지-2026-04-22-이후)

### Step 17: Controller 레이어 경계 — 서비스 중복 검증 금지 (2026-04-22 이후)

controller에 `reason.*trim` 패턴 0건. 서비스가 비즈니스 검증 단일 경로.

**PASS:** controller reason.trim 패턴 0건.
**FAIL:** controller에서 서비스와 동일한 코드/메시지로 BadRequestException throw.

상세: [references/scope-identity.md](references/scope-identity.md#step-17-controller-레이어-경계--서비스-중복-검증-금지-2026-04-22-이후)

### Step 18: lenderTeam identity-rule 강제 패턴 — approverTeamId 바이패스 금지 (2026-04-22 이후)

외부 if 조건에 `&& approverTeamId` 없어야 함. `!approverTeamId` 분기 ≥ 1건.

**PASS:** 외부 조건에 `&& approverTeamId` 0건 + `!approverTeamId` 분기 ≥ 1건 (approve만).
**FAIL:** `if (... && lenderTeamId && approverTeamId)` 형태 잔존.

상세: [references/scope-identity.md](references/scope-identity.md#step-18-lenderteam-identity-rule-강제-패턴--approverteamid-바이패스-금지-2026-04-22-이후)

### Step 19: NO_EQUIPMENT 가드 배치 — enforceScopeFromData 이전 위치 확인 (2026-04-22 이후)

`NO_EQUIPMENT` 가드 ≥ 4건 + `if (firstEquip)` 패턴 0건.

**PASS:** NO_EQUIPMENT ≥ 4건 + if (firstEquip) 0건.
**FAIL:** `if (firstEquip) { enforceScopeFromData }` 잔존.

상세: [references/scope-identity.md](references/scope-identity.md#step-19-no_equipment-가드-배치--enforicescopefromdata-이전-위치-확인-2026-04-22-이후)

### Step 20: rejectReturn checkTeamPermission unconditional 패턴 (checkout-lender-guard-p1p3 세션 이후)

`rejectReturnDto.approverTeamId` 참조 0건 + `req.user?.teamId` 직접 참조 + for 루프가 if(approverTeamId) 외부에 위치.

**PASS:** DTO 참조 0건 + req.user?.teamId 직접 참조 + unconditional for 루프.
**FAIL:** rejectReturnDto.approverTeamId 잔존(Rule 2 위반) 또는 checkTeamPermission이 if(approverTeamId) 내부에 위치.

상세: [references/scope-identity.md](references/scope-identity.md#step-20-rejectreturn-checkteampermission-unconditional-패턴-checkout-lender-guard-p1p3-세션-이후)

### Step 20a: RENTAL reject_return 전이 + lender-team fail-close + 장비상태 복구

RENTAL 반납 반려는 FSM SSOT에 `lender_received -> in_use`로 명시되어야 하며,
서비스는 lender team 기술책임자만 허용하고 같은 트랜잭션에서 장비 상태를
`available -> checked_out`으로 되돌려야 한다.

```bash
# FSM 전이: lender_received + reject_return -> in_use
grep -n "from: 'lender_received'" packages/schemas/src/fsm/checkout-fsm.ts
grep -n "action: 'reject_return'" packages/schemas/src/fsm/checkout-fsm.ts
grep -n "to: 'in_use'" packages/schemas/src/fsm/checkout-fsm.ts

# 서비스 정책: LENDER_TEAM_ONLY + rental 장비 상태 복구
grep -n "LENDER_TEAM_ONLY" apps/backend/src/modules/checkouts/checkouts.service.ts
grep -n "ESVal.CHECKED_OUT" apps/backend/src/modules/checkouts/checkouts.service.ts
grep -n "ESVal.AVAILABLE" apps/backend/src/modules/checkouts/checkouts.service.ts

# 회귀 테스트
grep -n "reject RENTAL return from lender_received" apps/backend/src/modules/checkouts/__tests__/checkouts.service.spec.ts
grep -n "non-lender team rejects RENTAL return" apps/backend/src/modules/checkouts/__tests__/checkouts.service.spec.ts
grep -n "reject_return from rental lender_received" packages/schemas/src/__tests__/checkout-fsm.test.ts
```

**PASS:** FSM 전이 존재 + `CHECKOUT_LENDER_TEAM_ONLY` 경로 존재 +
`updateStatusBatch(equipmentIds, ESVal.CHECKED_OUT, ESVal.AVAILABLE, tx)` 패턴 존재 +
정상/권한 차단 테스트 존재.
**FAIL:** rental `reject_return`이 `INVALID_TRANSITION`으로 남아 있거나, 권한 체크가
site fallback에만 의존하거나, checkout 상태만 되돌리고 장비 상태를 복구하지 않음.

### Step 21: checkTeamPermission ClassificationEnum SSOT — 하드코딩 금지 (2026-04-22 이후)

`ClassificationEnum.enum.general_emc/general_rf` SSOT 참조 + 하드코딩 0건.

**PASS:** ClassificationEnum import + SSOT 참조 + 하드코딩 문자열 0건.
**FAIL:** `'general_emc'` / `'general_rf'` 문자열 리터럴 잔존.

상세: [references/scope-identity.md](references/scope-identity.md#step-21-checkteampermission-classificationenum-ssot--하드코딩-금지-2026-04-22-이후)

### Step 22: firstEquip 취득 패턴 — items 배열 순서 기준 (2026-04-24 이후)

`values().next().value` 0건 + `get(items[0].equipmentId)` ≥ 3건.

**PASS:** values().next().value 0건 + items[0] 기준 취득 ≥ 3건.
**FAIL:** values().next().value 잔존 → 캐시 혼합 시 Map 삽입 순서 비결정성.

상세: [references/scope-identity.md](references/scope-identity.md#step-22-firstequip-취득-패턴--items-배열-순서-기준-2026-04-24-이후)

### Step 23: rejectReturn reason 검증 순서 — scope/FSM 이후 위치 (2026-04-24 이후)

`REJECTION_REASON_REQUIRED` 라인 번호 > `enforceScopeFromData` 라인 번호.

**PASS:** reason check 라인 > scope check 라인 (rejectReturn 메서드 내).
**FAIL:** reason 검증이 scope 검증보다 앞 → 스코프 외 사용자 상태 역추론 가능.

상세: [references/scope-identity.md](references/scope-identity.md#step-23-rejectreturn-reason-검증-순서--scopefsm-이후-위치-2026-04-24-이후)

### Step 24: checkout-api.ts Checkout.meta.nextStep 타입 동기화 (2026-04-24 이후)

`meta.nextStep?: NextStepDescriptor | null` 선언 존재.

**PASS:** meta.nextStep 선언 존재.
**FAIL:** meta 객체에 nextStep 누락 → useCheckoutNextStep이 항상 client fallback.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-24-checkout-apits-checkoutmetanextstep-타입-동기화-2026-04-24-이후)

### Step 25: borrower 액터 identity-rule 강제 (2026-04-24 구현 완료, 상시 검사)

borrowerApprove 구현 + scope-먼저 순서 + lenderTeamId emitAsync payload.

**PASS:** borrowerApprove ≥ 1건 + scope 검증 < assertFsmAction 라인 + lenderTeamId payload.
**FAIL:** borrowerApprove 미구현 또는 scope 순서 역전 또는 lenderTeamId 누락.

상세: [references/scope-identity.md](references/scope-identity.md#step-25-borrower-액터-identity-rule-강제-2026-04-24-구현-완료-상시-검사)

### Step 26: 프론트엔드 handleNextStepAction — CheckoutAction 완전 매핑 (2026-04-24 추가)

모든 `router.push` / `href`가 `FRONTEND_ROUTES` 상수 경유.

**PASS:** router.push/href 인라인 URL 0건.
**FAIL:** 하드코딩된 URL 리터럴 잔존.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-26-프론트엔드-handlenextstepaction--checkoutaction-완전-매핑-2026-04-24-추가)

### Step 27: useCheckoutGroupDescriptors N+1 방지 + feature flag 완전 제거 (2026-04-26 수정)

getNextStep 단일 useMemo + isNextStepPanelEnabled 0곳.

**PASS:** getNextStep useMemo 단독 + isNextStepPanelEnabled 0건.
**FAIL:** getNextStep 루프 내 직접 호출 또는 feature flag 잔존.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-27-프론트엔드-usecheckoutgroupdescriptors--n1-방지--feature-flag-완전-제거-2026-04-26-수정)

### Step 28: findCheckoutEntity 분리 — 순수 엔티티 취득 패턴 (Sprint 1.1)

`findCheckoutEntity` 1건 + `this.findCheckoutEntity` 호출 ≥ 11건 + 내부 `findOne` 재호출 0건.

**PASS:** findCheckoutEntity 1건 + this.findCheckoutEntity ≥ 11건 + 내부 findOne 재호출 0건.
**FAIL:** findCheckoutEntity 미존재 또는 내부 메서드가 findOne 직접 호출.

상세: [references/fsm-core.md](references/fsm-core.md#step-28-findcheckoutentity-분리--순수-엔티티-취득-패턴-sprint-11)

### Step 29: findOne userPermissions 필수 파라미터 (Sprint 1.1)

`userPermissions?` 0건 + `if (userPermissions)` 조건 0건.

**PASS:** 선택적 파라미터 0건 + 조건부 분기 0건.
**FAIL:** userPermissions? 선택적 잔존 → 일부 경로 meta 누락.

상세: [references/fsm-core.md](references/fsm-core.md#step-29-findone-userpermissions-필수-파라미터-sprint-11)

### Step 30: FSM drift safeParse 가드 — buildNextStep 내부 (Sprint 1.1)

`NextStepDescriptorSchema.safeParse` 호출 ≥ 1건 + `[FSM drift]` Logger.warn ≥ 1건.

**PASS:** safeParse ≥ 1건 + FSM drift warn ≥ 1건.
**FAIL:** safeParse 없음 → 드리프트가 런타임에서 무증상으로 클라이언트 전달.

상세: [references/fsm-core.md](references/fsm-core.md#step-30-fsm-drift-safeparse-가드--buildnextstep-내부-sprint-11)

### Step 31: findOne 반환 타입 — CheckoutWithMeta 단일 타입 (Sprint 1.1)

`Promise<CheckoutWithMeta>` 단일 반환 + 유니온 0건 + controller type cast 0건.

**PASS:** 단일 반환 + 유니온 0건 + cast 0건.
**FAIL:** 유니온 타입 잔존 → meta 누락 경로 묵시적 허용.

상세: [references/fsm-core.md](references/fsm-core.md#step-31-findone-반환-타입--checkoutwithmeta-단일-타입-sprint-11)

### Step 32: EXPECTED_ENTRY_COUNT 동적 table test 검증 (Sprint 1.1 신규, 2026-04-26 동적화)

두 파일 모두 EXISTS + EXPECTED_ENTRY_COUNT 동적 상수 + buildDescriptorTable() + satisfies Record 가드.

**PASS:** 파일 EXISTS + 동적 상수 + buildDescriptorTable + satisfies 컴파일 가드.
**FAIL:** 파일 없음 또는 satisfies 없음 또는 하드코딩 숫자.

상세: [references/fsm-core.md](references/fsm-core.md#step-32-expected_entry_count-동적-table-test-검증-sprint-11-신규-2026-04-26-동적화)

### Step 33: rental-phase.ts SSOT exhaustiveness guard (Sprint 1.2 신규)

rental-phase.ts 존재 + satisfies 가드 1건 + @ts-expect-error 1건 이상 + shared-constants import 0건 + checkout-fsm.ts re-export.

**PASS:** 모든 조건 충족.
**FAIL:** 파일 없음 또는 satisfies/ts-expect-error 없음 또는 circular dep.

상세: [references/fsm-core.md](references/fsm-core.md#step-33-rental-phasets-ssot-exhaustiveness-guard-sprint-12-신규)

### Step 34: `resolveActorVariant` 순수 함수 SSOT + `data-variant`/`data-actor-variant` 속성 (Sprint 4.1)

resolveActorVariant 정의 1건 + NextActor exhaustive + data-variant/data-actor-variant ≥ 3건.

**PASS:** 함수 정의 1건 + 모든 NextActor 케이스 + 속성 hero/compact 양쪽 존재.
**FAIL:** resolveActorVariant 미존재 또는 data-variant 누락.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-34-resolveactorvariant-순수-함수-ssot--data-variantdata-actor-variant-테스트-선택자-sprint-41-신규-2026-04-27-추가)

### Step 35: `roleToActorVariant` + `ActorVariant` schemas SSOT + `isMyTurn` `UserRoleValues.SYSTEM_ADMIN` (Sprint fsm-terminal-actor-variant)

ActorVariant frontend 재정의 0건 + roleToActorVariant schemas import + UserRoleValues.SYSTEM_ADMIN 사용.

**PASS:** frontend 재정의 0건 + schemas import만 사용 + UserRoleValues.SYSTEM_ADMIN.
**FAIL:** frontend 재정의 또는 'system_admin' 리터럴 잔존.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-35-roletoactorvariant--actorvariant-schemas-ssot--ismyturn-userrolevaluessystem_admin-sprint-fsm-terminal-actor-variant-2026-04-27)

### Step 36: `reachedStepIndex` — `NextStepDescriptor` 3분기 + `computeReachedStepIndex` `terminatedFromStatus` 위임 (Sprint fsm-terminal-actor-variant)

getNextStep 3개 return 분기 모두 reachedStepIndex 포함 + computeReachedStepIndex terminatedFromStatus 파라미터 존재.

**PASS:** reachedStepIndex 인터페이스+Zod 양쪽 + 3분기 포함 + terminatedFromStatus 파라미터.
**FAIL:** reachedStepIndex 누락 분기 또는 terminatedFromStatus 없음.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-36-reachedstepindex--nextstepdescritor-3분기-필수--computereachedstepindex-terminatedfromstatus-위임-sprint-fsm-terminal-actor-variant-2026-04-27)

### Step 37: `terminatedFromStatus` 저장 패턴 — terminal 전환 시 직전 status 기록 (Sprint fsm-terminal-actor-variant)

reject/borrowerReject/cancel에 terminatedFromStatus 설정 + 비-terminal 메서드에 미설정.

**PASS:** terminatedFromStatus 총 4건 이상 + approve/returnCheckout 등 비-terminal에 0건.
**FAIL:** terminal 메서드 중 누락 또는 비-terminal에 설정.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-37-terminatedfromstatus-저장-패턴--terminal-전환-시-직전-status-기록-sprint-fsm-terminal-actor-variant-2026-04-27)

### Step 38: `revokeApproval` `writeTransitionAudit` `isRevocation` 마커 (2026-04-27 추가)

revokeApproval writeTransitionAudit 호출에 `isRevocation: true` + `revokeReason` + `previousApprovedAt`.

**PASS:** 3개 extraInfo 키 존재.
**FAIL:** isRevocation 없음 → 감사 이력에서 취소 승인과 일반 반려 구분 불가.

상세: [references/fsm-core.md](references/fsm-core.md#step-38-revokeapproval-writetransitionaudit-isrevocation-마커-2026-04-27-추가)

### Step 39: `useCheckoutNextStep` hook `terminatedFromStatus` 입력 passthrough (2026-04-27 추가)

UseCheckoutNextStepInput 인터페이스 + getNextStep 전달 + useMemo deps 포함.

**PASS:** 인터페이스 선언 + getNextStep 호출 전달 + useMemo deps 포함.
**FAIL:** 인터페이스 미포함 또는 useMemo deps 누락 → stale closure.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-39-usecheckoutnextstep-hook-terminatedfromstatus-입력-passthrough-2026-04-27-추가)

### Step 40: compact `canAct` 분기 — span/button 이중 렌더 금지 (2026-04-27 추가, 2026-04-28 atom 갱신)

`!canAct && <span>` 1건 + `canAct && <InlineActionButton>` 1건 + 동시 렌더 0건.

**PASS:** 상호 배타적 분기 + InlineActionButton atom + stopPropagation 보존.
**FAIL:** span 무조건 렌더 또는 raw button 잔존.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-40-compact-variant-canact-분기--spanbutton-이중-렌더-금지-2026-04-27-추가-2026-04-28-atom-갱신)

### Step 41: `ProgressStepDescriptor` SSOT + `deriveProgressStepState` 5-state exhaustive (2026-04-28 추가)

PROGRESS_STEP_STATES 5-tuple + deriveProgressStepState termination 인자 + 클램프 보장.

**PASS:** 5-state + 4-arg 시그니처 + hook 클램프.
**FAIL:** 4-state(terminated 누락) 또는 클램프 없음.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-41-progressstepdescriptor-ssot--deriveprogressstepstate-5-state-exhaustive-2026-04-28-추가-review_resultmd-p0-1)

### Step 42: `CheckoutActorContext` SSOT + `TRANSITION_ACTOR_SIDE` 매핑 (rental-approval-workflow-fix, 2026-04-29)

CheckoutActorContext interface + TRANSITION_ACTOR_SIDE Record + 'actor_team' blockingReason + BE/FE 동기.

**PASS:** SSOT 정의 + canPerformAction actorCtx + BE/FE 동기 + ko/en parity.
**FAIL:** actor identity 미반영 → 평택랩 TM이 borrower_approve 버튼 노출.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-42-checkoutactorcontext-ssot--transition_actor_side-매핑-rental-approval-workflow-fix-2026-04-29)

### Step 43: `findAll` server-driven meta 항상 주입 (rental-approval-workflow-fix, 2026-04-29)

findAll 시그니처 userPermissions?/userTeamId? + cache key에 user 정보 미포함 + post-cache meta 합성.

**PASS:** user-specific meta post-cache 합성 + user 간 cache leak 없음.
**FAIL:** meta가 cache에 포함 → user 간 leak 또는 warnMetaDrift 경고.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-43-findall-server-driven-meta-항상-주입-rental-approval-workflow-fix-2026-04-29)

### Step 44: `getPendingChecks` borrower team EXISTS subquery 패턴 (rental-approval-workflow-fix, 2026-04-29)

borrowerTeamPendingCondition EXISTS subquery + lender/borrowerAction/borrowerTeamPending 3-way OR.

**PASS:** EXISTS subquery + 3-way OR 조합 일관성.
**FAIL:** borrowerStatuses에 PENDING 단순 추가 → borrower TM nav 배지 누락.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-44-getpendingchecks-borrower-team-exists-subquery-패턴-rental-approval-workflow-fix-2026-04-29)

### Step 45: `findAll` + `findOne` `user.team` 양측 완전성 (2026-04-29 추가)

findAll/findOne 양측 `team: { id, name, site }` 포함 + checkout-api.ts 타입 포함.

**PASS:** findAll + findOne 양측 site 포함 + frontend 타입 포함.
**FAIL:** findAll만 team 포함하고 findOne 누락 → 단건 조회 소속 "-" 회귀.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-45-findall--findone-userteam-양측-완전성-2026-04-29-추가)

### Step 46: ESCAPE_ACTIONS 집합 불변성 + getNextStep 4단계 우선순위 (2026-04-29 추가)

ESCAPE_ACTIONS 4개 멤버 + fullyAvailableMain/permittedOnlyMain/firstMain/fullyAvailableEscape 4변수 + Main에 !ESCAPE_ACTIONS.has 필터.

**PASS:** 4개 멤버 + 4단계 체인 + ESCAPE 필터.
**FAIL:** ESCAPE_ACTIONS 멤버 변경 또는 4단계 체인 누락.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-46-escape_actions-집합-불변성--getnextstep-4단계-우선순위-2026-04-29-추가)

### Step 47: checkout-scope.util.ts outbound predicate 불변성 — case 1+3만 (2026-04-29 추가)

outbound 분기에 requesterIn 미참조 + isPending 0건 + SSOT 주석 3-case.

**PASS:** requesterIn 미참조 + isPending 0건 + 3-case 주석.
**FAIL:** requesterIn 재등장 또는 isPending 재선언 → case 4 회귀.

상세: [references/scope-identity.md](references/scope-identity.md#step-47-checkout-scopeutilts-outbound-predicate-불변성--case-13만-2026-04-29-추가)

### Step 48: CheckoutDetailClient availableToCurrentUser guard + canCancel 독립 버튼 (2026-04-29 추가)

handleNextStepAction availableToCurrentUser early-return + canCancel 독립 버튼 + nextStep wiring.

**PASS:** availableToCurrentUser guard + canCancel 독립 렌더링 + nextStep wiring.
**FAIL:** guard 없음 → 403 페이지 새로고침 회귀 또는 canCancel 독립 버튼 없음.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-48-checkoutdetailclient-availabletocurrentuser-guard--cancancel-독립-버튼-2026-04-29-추가)

### Step 49: `useCheckoutProgressSteps` fallback — `steps.indexOf` 금지, `computeStepIndex` SSOT 경유 필수 (2026-04-29 추가)

steps.indexOf(status) 0건 + computeStepIndex SSOT 경유.

**PASS:** steps.indexOf 0건 + computeStepIndex import + fallback 사용.
**FAIL:** steps.indexOf 발견 → 비-display status에서 항상 1단계 활성화 버그.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-49-usecheckoutprogresssteps-fallback--stepsindexof-금지-computestepindex-ssot-경유-필수-2026-04-29-추가)

### Step 50: rental `returnCheckout` purpose-aware validation — `workingStatusChecked` 서버 도출 (2026-04-29 추가)

rental 분기에서 WORKING_STATUS_REQUIRED 예외 없음 + priorChecks.length > 0 도출 + resolvedWorkingStatusChecked 전달.

**PASS:** rental 분기 검증 면제 + priorChecks.length > 0 (not every(normal)) + resolved 전달.
**FAIL:** every(normal) 패턴 → 이상 장비 반입 차단 버그.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-50-rental-returncheckout-purpose-aware-validation--workingstatuschecked-서버-도출-dto-검증-면제-2026-04-29-추가)

### Step 51: KPI 카드 value-filterStatus 상태 집합 정합성 — `CHECKOUT_STATUS_GROUPS` SSOT 경유 필수 (2026-04-30 추가)

getSummary() inProgress/returnedToday가 CHECKOUT_STATUS_GROUPS 경유 + useStatCards value/filterStatus 동일 그룹.

**PASS:** getSummary SSOT 경유 + value/filterStatus 동일 집합.
**FAIL:** value: summary.approved + filterStatus: in_progress 집합 불일치.

상세: [references/nextstep-progress-ui.md](references/nextstep-progress-ui.md#step-51-kpi-카드-value-filterstatus-상태-집합-정합성--checkout_status_groups-ssot-경유-필수-2026-04-30-추가)

### Step 52: `revokeApproval` 5단계 fail-close 순서 검증 (2026-05-03 추가)

scope → FSM(APPROVED) → reason → time-window → domain 5단계 순서.

**PASS:** revokeApproval 내 5단계가 순서대로 존재.
**FAIL:** reason 검증이 FSM 체크보다 앞 → 스코프 외 사용자 상태 역추론 취약점.

상세: [references/scope-identity.md](references/scope-identity.md#step-52-revokeapproval-5단계-fail-close-순서-검증-2026-05-03-추가)

### Step 53: `StepperHeader` — `CONDITION_CHECK_STEP_VALUES` SSOT 소비 + 인라인 4-step 배열 금지 (2026-05-12 qr-visual-redesign TASK 5)

**배경**: `StepperHeader` 가 Rental 4-step 진행 상태를 `CONDITION_CHECK_STEP_VALUES` 배열 기준으로 렌더.
인라인 `['lender_checkout', 'borrower_receive', 'borrower_return', 'lender_return']` 배열을 직접 정의하면
FSM step 추가/변경 시 UI-와 FSM 간 drift 발생.

**PASS:** `StepperHeader` 가 `CONDITION_CHECK_STEP_VALUES` import + `.map()` / `.indexOf()` 소비.
**FAIL:** 인라인 4-step 배열 또는 하드코딩 step 문자열 비교.

```bash
# (1) StepperHeader 가 CONDITION_CHECK_STEP_VALUES SSOT 소비
grep -n "CONDITION_CHECK_STEP_VALUES" \
  apps/frontend/components/checkouts/StepperHeader.tsx
# 기대: ≥ 2건 (import + indexOf/map 사용)

# (2) 인라인 4-step 배열 회귀 탐지
grep -rn "\['lender_checkout'.*'borrower_receive'\|'lender_checkout'.*'lender_return'\]" \
  apps/frontend/components/checkouts --include="*.tsx" | grep -v ".spec."
# 기대: 0건

# (3) StepperHeader 소비처가 step prop 에 올바른 ConditionCheckStep 값 전달 (schema 타입 일치)
grep -rn "step={" \
  apps/frontend/components/checkouts/EquipmentConditionForm.tsx \
  apps/frontend/components/checkouts/ReturnInspectionForm.tsx
# 기대: step prop 값이 ConditionCheckStep union 내 literal 또는 변수
```

**관련 파일**: `apps/frontend/components/checkouts/StepperHeader.tsx`, `packages/schemas/src/enums/return-condition.ts` (`CONDITION_CHECK_STEP_VALUES` SSOT)

## Output Format

```markdown
| #  | 검사                              | 상태      | 상세                                   |
|----|-----------------------------------|-----------|----------------------------------------|
| 1  | Dependency Inversion — import 금지 | PASS/FAIL | shared-constants import 위치           |
| 2  | 함수 시그니처 readonly string[]    | PASS/FAIL | 잘못된 타입 사용 위치                  |
| 3  | assertFsmInvariants 모듈 레벨 호출 | PASS/FAIL | 호출 위치 (없거나 함수 내부면 FAIL)   |
| 4  | CheckoutPermissionKey 동기화       | PASS/FAIL | Permission enum 미대응 값 목록         |
| 5  | 소비자 브릿지 패턴                 | PASS/FAIL | role 직접 전달 위치                    |
| 6  | 단위 테스트 커버리지               | PASS/FAIL | 테스트 파일 존재 + 30건 이상           |
| 7  | nextStep 필드 응답 스키마 포함     | PASS/FAIL | checkout.ts 내 누락 여부               |
| 8  | assertFsmAction 헬퍼 + 호출 ≥ 8  | PASS/FAIL | 정의/호출 수 + 레거시 에러 코드 0건   |
| 9  | calculateAvailableActions sync    | PASS/FAIL | async 제거 + Permission 하드코딩 0건   |
| 10 | buildNextStep + findOne 메타       | PASS/FAIL | 정의 + meta.nextStep 조합              |
| 11 | FSM_TO_AUDIT_ACTION 커버리지       | PASS/FAIL | Record<CheckoutAction, AuditAction> 타입 |
| 12 | assertFsmAction HTTP 의미론        | PASS/FAIL | invalid_transition→400, forbidden→403 분리 |
| 13 | Controller guard ↔ FSM 정렬        | PASS/FAIL | approve/approve-return/reject-return guard |
| 14 | writeTransitionAudit 캡슐화        | PASS/FAIL | 메서드 내부 try/catch, 콜사이트 0건    |
| 15 | 예외 계층 일관화 (7개 메서드)       | PASS/FAIL | ForbiddenException+ConflictException ≥7건 |
| 16 | CheckoutErrorCode SSOT 인라인 금지  | PASS/FAIL | service+controller 인라인 'CHECKOUT_*' 0건 |
| 17 | Controller 레이어 경계 준수         | PASS/FAIL | controller reason.trim 중복 검증 0건 |
| 18 | lenderTeam identity-rule 강제       | PASS/FAIL | 외부 && approverTeamId 0건 + !approverTeamId ≥ 1건 (approve만) |
| 19 | NO_EQUIPMENT 가드 배치              | PASS/FAIL | ≥ 4건 + if (firstEquip) 0건 |
| 20 | rejectReturn checkTeamPermission unconditional | PASS/FAIL | rejectReturnDto.approverTeamId 0건 + req.user?.teamId 직접 참조 |
| 21 | checkTeamPermission ClassificationEnum SSOT | PASS/FAIL | 하드코딩 'general_emc'/'general_rf' 0건 + ClassificationEnum.enum.* 참조 |
| 22 | firstEquip 취득 패턴 — items[0] 기준        | PASS/FAIL | values().next().value 0건 + get(items[0].equipmentId) ≥ 3건 |
| 23 | rejectReturn reason 검증 순서 — scope/FSM 이후 | PASS/FAIL | REJECTION_REASON_REQUIRED 라인 > enforceScopeFromData 라인 |
| 24 | checkout-api.ts Checkout.meta.nextStep 타입 동기화 | PASS/FAIL | meta.nextStep?: NextStepDescriptor \| null 선언 존재 |
| 25 | borrower 액터 identity-rule 강제 (2026-04-24 상시) | PASS/FAIL | scope-먼저 순서 + lenderTeamId payload |
| 26 | handleNextStepAction FRONTEND_ROUTES 완전 매핑 | PASS/FAIL | router.push/href 인라인 URL 0건 |
| 27 | useCheckoutGroupDescriptors N+1 방지 (feature flag 완전 제거) | PASS/FAIL | getNextStep useMemo 단독 + isNextStepPanelEnabled 0곳 |
| 28 | findCheckoutEntity 분리 — 순수 엔티티 취득 | PASS/FAIL | private findCheckoutEntity 1건 + this.findCheckoutEntity ≥ 11건 |
| 29 | findOne userPermissions 필수 파라미터 (no ?) | PASS/FAIL | userPermissions? 0건 |
| 30 | FSM drift safeParse 가드 — buildNextStep 내 | PASS/FAIL | NextStepDescriptorSchema.safeParse + [FSM drift] Logger.warn |
| 31 | findOne 반환 타입 — CheckoutWithMeta 단일 | PASS/FAIL | Promise<CheckoutWithMeta> 선언 + 유니온 타입 0건 |
| 32 | EXPECTED_ENTRY_COUNT 동적 table test | PASS/FAIL | checkout-fsm.table.test.ts + fixtures/descriptor-table.ts — 하드코딩 숫자 금지 |
| 33 | rental-phase.ts SSOT exhaustiveness guard | PASS/FAIL | satisfies Record<CheckoutStatus, RentalPhase \| null> + @ts-expect-error |
| 34 | resolveActorVariant SSOT + data-variant/data-actor-variant | PASS/FAIL | 함수 정의 1건 + NextActor exhaustive + 속성 ≥ 3건 |
| 35 | roleToActorVariant + ActorVariant schemas SSOT + UserRoleValues.SYSTEM_ADMIN | PASS/FAIL | frontend 재정의 0건 + schemas import + UserRoleValues 사용 |
| 36 | reachedStepIndex 3분기 + computeReachedStepIndex terminatedFromStatus | PASS/FAIL | 3개 return 분기 + terminatedFromStatus 파라미터 |
| 37 | terminatedFromStatus 저장 패턴 | PASS/FAIL | reject/borrowerReject/cancel 설정 + 비-terminal 미설정 |
| 38 | revokeApproval isRevocation 마커 | PASS/FAIL | isRevocation: true + revokeReason + previousApprovedAt |
| 39 | useCheckoutNextStep terminatedFromStatus passthrough | PASS/FAIL | 인터페이스 + getNextStep 전달 + useMemo deps |
| 40 | compact canAct 분기 이중 렌더 금지 | PASS/FAIL | !canAct span 1건 + canAct button 1건 + 동시 렌더 0건 |
| 41 | ProgressStepDescriptor SSOT 5-state | PASS/FAIL | 5-tuple + deriveProgressStepState termination + 클램프 |
| 42 | CheckoutActorContext SSOT + TRANSITION_ACTOR_SIDE | PASS/FAIL | interface + Record + actor_team blockingReason |
| 43 | findAll server-driven meta 항상 주입 | PASS/FAIL | post-cache meta + user 정보 미캐시 |
| 44 | getPendingChecks borrower team EXISTS | PASS/FAIL | EXISTS subquery + 3-way OR |
| 45 | findAll + findOne user.team 양측 완전성 | PASS/FAIL | 양측 site 포함 + checkout-api.ts 타입 |
| 46 | ESCAPE_ACTIONS + getNextStep 4단계 우선순위 | PASS/FAIL | 4개 멤버 + 4단계 체인 + ESCAPE 필터 |
| 47 | outbound predicate case 1+3만 | PASS/FAIL | requesterIn 미참조 + isPending 0건 |
| 48 | availableToCurrentUser guard + canCancel 독립 버튼 | PASS/FAIL | early-return guard + 독립 렌더링 |
| 49 | steps.indexOf 금지 + computeStepIndex SSOT | PASS/FAIL | indexOf 0건 + SSOT fallback |
| 50 | returnCheckout purpose-aware workingStatusChecked | PASS/FAIL | rental 면제 + priorChecks.length > 0 |
| 51 | KPI value-filterStatus CHECKOUT_STATUS_GROUPS SSOT | PASS/FAIL | SSOT 경유 + 동일 집합 |
| 52 | revokeApproval 5단계 fail-close 순서 | PASS/FAIL | scope → FSM → reason → window → domain |
| 53 | StepperHeader CONDITION_CHECK_STEP_VALUES SSOT | PASS/FAIL | 인라인 4-step 배열 0건 |
```

## Exceptions

1. **`checkout-fsm.ts` 자체의 상수 정의** — `TERMINAL_STATES`, `CAL_REPAIR`, `RENTAL`, `ALL` 등 모듈 내부 상수는 로컬 정의 허용
2. **`assertFsmInvariants` 함수 정의 자체** — 함수 정의 내부 로직은 검사 대상 아님, 모듈 레벨 *호출*만 검사
3. **테스트 파일의 mock 데이터** — `checkout-fsm.test.ts` 내 임시 CheckoutStatus/Purpose 값은 면제
4. **`NextStepDescriptorSchema`의 `z.enum` 인라인 값** — CheckoutAction/NextActor enum 값이 인라인으로 나열되어 있는 것은 Zod 스키마 특성상 허용 (SSOT는 TypeScript type `CheckoutAction`)
5. **RENTAL purpose의 `reject_return` FSM 미지원** — FSM `reject_return` 전이는 `purposes: CAL_REPAIR`만 허용. RENTAL 반출의 `rejectReturn` 호출 시 `assertFsmAction`에서 INVALID_TRANSITION으로 차단되므로, `rejectReturn` 내부의 `LENDER_TEAM_ONLY` 체크는 RENTAL에 대해 dead code. Step 20은 CAL_REPAIR 목적 흐름만 검증 대상.
6. **`mockChain.then` 테스트 패턴** — `chain.where.then` 오버라이드가 불가한 jest mock 제약으로 `mockChain.then`을 직접 오버라이드하는 패턴은 테스트 전용 관용구. 서비스 코드 검증 대상 아님.
