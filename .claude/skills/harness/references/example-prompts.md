# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-21 세션5 (6개 Gap 보완: PR-1 checkout.ts nextStep schema, PR-3 hero 레이아웃토큰+DIMENSION_TOKENS, PR-4 stories.tsx, PR-5 feature flag, PR-8 nextStep i18n 레이블)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.

---

## UltraReview 통합 — Layer 6 머지 관문 프롬프트 (3종)

> **배경 (2026-04-21)**: CAS stale 4차 재발, 트랜잭션 경계 3차 재발 등 verify-*/review-architecture 단일 패스로 못 잡는
> 의미론적·동시성·재현 버그 대응. ultrareview(원격 multi-agent fleet)를 머지 직전 관문으로 통합.
> 상세: `docs/references/ultrareview-usage.md`

### 🟠 HIGH — UR-1: 머지 직전 ultrareview Go/No-Go 판정 + 실행 준비 (Mode 0)

```
목적: 브랜치 머지 직전 ultrareview 실행 여부를 자동 판정하고 실행을 준비한다.
      판정 기준은 SSOT 파생 (review-learnings.md 고위험 패턴 + CLAUDE.md 예외 항목).

단계:
1. Advisor 실행
   node scripts/ultrareview-advisor.mjs --json
   결과를 읽고 decision / reasons / costEstimate 필드 확인

2. 판정에 따른 분기
   [Go] → 3단계로 진행
   [No-Go] → 이유 제시 + /review 또는 해당 verify-* 스킬 실행 권고로 종료

3. (Go인 경우) Pre-upload secret gate
   node scripts/ultrareview-preflight.mjs
   - exit 0: 4단계 진행
   - exit 1: 오류 메시지에 따라 파일 제거 또는 .gitleaks.toml allowlist 추가 후 재실행

4. (Preflight 통과 시) 사용자에게 실행 명령 제시
   - PR 번호 확인: gh pr list --state open --author @me
   - 제시 명령: /ultrareview <PR번호>
   - 예상 시간: 5~10분 (백그라운드, /tasks 로 추적)
   - 실행은 사용자가 직접 확인 후 입력 (자동 실행 금지)

검증:
- decision / category / costEstimate / 실행 명령 4개 필드 모두 출력됨
- Go 판정이면 preflight exit 0 확인됨
- 명령 제시 후 대기 (실제 /ultrareview 실행은 사용자 몫)
```

### 🔴 CRITICAL — UR-2: ultrareview Finding 후속 수정 (Mode 1)

```
입력: ultrareview 완료 후 /tasks에서 확인한 finding 리포트 (file:line + 설명)

finding 분류 → verify-* 2차 검증 매핑 테이블:
  CAS / VERSION_CONFLICT    → verify-cas 스킬 실행
  권한 / RBAC / SiteScope   → verify-auth 스킬 실행
  이벤트 / 캐시 무효화       → verify-cache-events 스킬 실행
  Zod / validation          → verify-zod 스킬 실행
  트랜잭션 경계 / this.db    → review-architecture 스킬 실행
  기타 설계 이슈             → review-architecture 스킬 실행

finding별 처리:
  [true positive]
  1. 해당 verify-* 스킬 Skill 호출로 패턴 준수 확인
  2. CLAUDE.md Behavioral Guidelines "수술적 변경" 원칙으로 최소 fix
  3. tsc + 관련 spec 실행 → green 확인
  4. 변경 파일 수 ≤ finding 수 × 3 (spread 제한)
  5. review-learnings.md 해당 섹션에 재발 기록 append:
     형식: [YYYY-MM-DD] {패턴명} — {file:line} ({n}차 재발)
     3회 도달 시: manage-skills 스킬로 신규 verify-* 스킬 생성 제안

  [false positive]
  1. 왜 false positive인지 근거 1문장 작성
  2. review-learnings.md "추가된 예외" 섹션에 기록:
     형식: [YYYY-MM-DD] ultrareview FP — {패턴명}: {근거}

검증:
- pnpm --filter backend exec tsc --noEmit
- pnpm --filter frontend exec tsc --noEmit
- 관련 모듈 spec 통과
- review-learnings.md에 결과 append 확인
- 변경 파일 수 ≤ finding 수 × 3
```

### 🟡 MEDIUM — UR-3: 무료 Quota 소진 시 로컬 Fleet Review 대체 (Mode 2)

```
사용 조건: ultrareview 무료 3회 소진 AND 비용 지출 불가 상황
          (또는 브랜치 모드 불가 환경)

구조: Explore subagent 3개 단일 메시지 병렬 실행

Agent A — Backend race/원자성/트랜잭션 경계
  조사 대상: review-learnings.md "트랜잭션 내 서비스 메서드" + "CAS 선점" 섹션의 파일 경로
  확인 항목:
  - 변경된 service.ts 파일에서 db.transaction() 내부 this.db 직접 사용 패턴
  - CAS 선점 순서 (상태 전이 → 작업 순서 위반)
  - 보상 코드 누락 (CAS 선점 후 후속 실패 시 미복원)
  보고: file:line + 재현 조건 1줄

Agent B — Frontend stale closure/CAS/SSOT 경로
  조사 대상: review-learnings.md "Stale CAS 버전" 4차 재발 섹션 패턴
  확인 항목:
  - mutation.mutationFn 내부 useQuery 캐시 스냅샷(version) 직접 참조
  - 상태 전이 액션에서 fresh fetch 없이 캐시 버전 사용
  - VERSION_CONFLICT 핸들러(onError) 누락
  보고: file:line + stale 경로 설명

Agent C — Cross-module 이벤트·캐시·권한 흐름
  조사 대상: review-learnings.md "이벤트" + "권한/RBAC" + "캐시 무효화" 섹션
  확인 항목:
  - emitAsync vs emit 사용 일관성 (verify-cache-events 스킬 기준)
  - 신규 엔드포인트 @SiteScoped/@Permissions 누락
  - 장비 상태 전이 후 캐시 무효화 이벤트 미발행
  보고: file:line + 이슈 설명

제약:
  - 세션당 1회 한도 (중복 실행 금지, /tasks로 이미 실행 중인지 확인)
  - 각 agent 보고 400단어 이내
  - 독립 재현 검증 없음 → ultrareview 대비 false positive 가능성 높음
  - finding은 반드시 해당 verify-* 스킬 2차 검증 후 수정

검증:
  - 세 agent 결과 합산 → 중복 제거 → priority 랭킹
  - ultrareview와 동일하게 UR-2 파이프라인으로 처리
```



> **완료된 항목은 [example-prompts-archive.md](./example-prompts-archive.md)로 분리 (2026-04-09 36차 정리).**
> 현재 파일은 활성(미해결) harness 프롬프트만 포함. 새 프롬프트는 활성 영역에 추가.

---

## 34차 후속 — wf20-infra-debt harness 결과 review-architecture tech debt (3건)

> **발견 배경 (2026-04-08, wf20-infra-debt harness PASS 직후 review-architecture)**:
> SelfInspectionTab.tsx 행 액션 aria-label SSOT 패턴 도입 후, 동일 도메인의 다른 컴포넌트에서
> divergence가 확인되었다. wf20-infra-debt harness contract의 SHOULD criteria로 분류되었던
> 항목 + producer/consumer scope 정합성 검증 중 발견된 항목을 등재.

### 🟢 LOW — sticky-header CSS 변수명 string literal 중복 (3 곳, 4번째 등장 시 상수화)

```
배경: wf20-infra-debt harness review-architecture 검증 결과:
'--sticky-header-height' CSS 변수가 producer 1곳 + consumer 2곳에 string literal 로 중복 박혀 있다:
1. Producer: apps/frontend/components/equipment/EquipmentDetailClient.tsx:96
   document.documentElement.style.setProperty('--sticky-header-height', ...)
2. Consumer (CSS): apps/frontend/lib/design-tokens/components/equipment.ts:809
   top-[var(--sticky-header-height,0px)]
3. Consumer (e2e): apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts:34
   getComputedStyle(documentElement).getPropertyValue('--sticky-header-height')

세 지점 모두 :root 스코프로 통일되어 silent 0 반환 리스크는 없으나, 4번째 consumer (예: 다른
sticky tab 컨테이너) 가 등장할 때 오타/스코프 불일치 가능성이 있다.

작업 (4번째 consumer 등장 시점에만 진행 — 현재는 over-engineering):
1. apps/frontend/lib/design-tokens/primitives/ 또는 shared-constants 에
   STICKY_HEADER_HEIGHT_VAR = '--sticky-header-height' 상수 추가
2. 3 곳 모두 import 로 교체
3. /verify-hardcoding 룰: CSS 변수명 string literal 2회+ 사용 시 상수화 권고 추가 (선택)

검증:
- pnpm tsc --noEmit exit 0
- grep "'--sticky-header-height'" apps/frontend → import 외 0 hit

⚠️ 현재는 트리거 조건 미달 (3 hit). 4번째 hit 발생 시 자동 승격.
```

---

## 반출입 관리 페이지 아키텍처 개선 — Phase 1~8 프롬프트 (11건)

> **발견 배경 (2026-04-21, /review-design 반출입 페이지 종합 68/100)**:
> AP-01~10 전 항목 개선 + FSM SSOT 도입 아키텍처 플랜 기반.
> 검증일: 2026-04-21. `packages/schemas/src/fsm/` 미존재, `NextStepPanel.tsx` 미존재,
> `ELEVATION_TOKENS.surface` 미존재, `TYPOGRAPHY_TOKENS` export 미존재,
> `CHECKOUT_STEPPER_TOKENS.status.next` 미존재, `checkouts.fsm` i18n 키 미존재 확인.
> AuditLogService는 `.log()` 아닌 `.create(dto: CreateAuditLogDto)` 사용.
> PR 순서: PR-1 → PR-2 → PR-3·PR-4 병렬 → PR-5 → PR-6 → PR-7 → PR-8·PR-9 병렬.

---

### 🔴 CRITICAL — PR-1: FSM SSOT 도입 — `checkout-fsm.ts` + unit tests (Mode 1)

```
문제:
반출 상태 전이 규칙이 2곳에 중복 정의되어 있고 "다음 단계" 개념이 타입 시스템에 없다.
- Backend guard 하드코딩:
  checkouts.service.ts:1302 — if (checkout.status !== CSVal.PENDING) (approve)
  checkouts.service.ts:1413 — if (checkout.status !== CSVal.PENDING) (reject)
  checkouts.service.ts:1495 — if (checkout.status !== CSVal.APPROVED) (start)
  checkouts.service.ts:1602 — if (checkout.status !== CSVal.CHECKED_OUT) (return)
  checkouts.service.ts:1738 — if (checkout.status !== CSVal.RETURNED) (approveReturn)
  checkouts.service.ts:1840 — if (checkout.status !== CSVal.RETURNED) (rejectReturn)
  (+ cancel, update 라인)
- Frontend hint 분산:
  CheckoutStatusStepper.tsx — 시각화
  CheckoutGroupCard.tsx:60-123 — RentalFlowInline 헬퍼
  CheckoutDetailClient.tsx:297-445 — renderActions() 함수
- packages/schemas/src/fsm/ 디렉토리 미존재

작업:
1. 신규 파일 생성: packages/schemas/src/fsm/checkout-fsm.ts (≈260 lines)

   타입 정의:
   export type CheckoutAction =
     | 'approve' | 'reject' | 'cancel' | 'start'
     | 'lender_check' | 'borrower_receive' | 'mark_in_use'
     | 'borrower_return' | 'lender_receive'
     | 'submit_return' | 'approve_return' | 'reject_return';

   export type NextActor =
     | 'requester' | 'approver' | 'logistics'
     | 'lender' | 'borrower' | 'system' | 'none';

   export type Urgency = 'normal' | 'warning' | 'critical';

   export interface TransitionRule {
     readonly from: CheckoutStatus;
     readonly action: CheckoutAction;
     readonly to: CheckoutStatus;
     readonly purposes: readonly CheckoutPurpose[];   // 빈 배열 = 모든 목적에 적용
     readonly requires: Permission;                   // SSOT: @equipment-management/shared-constants
     readonly nextActor: NextActor;
     readonly labelKey: string;                       // i18n: checkouts.fsm.action.{key}
     readonly hintKey: string;                        // i18n: checkouts.fsm.hint.{key}
     readonly auditEventSuffix: string;               // e.g. 'approved' → 'checkout.approved'
   }

   export interface NextStepDescriptor {
     readonly currentStatus: CheckoutStatus;
     readonly currentStepIndex: number;              // 1-based
     readonly totalSteps: number;
     readonly nextAction: CheckoutAction | null;     // null = terminal state
     readonly nextActor: NextActor;
     readonly nextStatus: CheckoutStatus | null;
     readonly availableToCurrentUser: boolean;
     readonly blockingReason: 'permission' | 'role_mismatch' | null;
     readonly labelKey: string;
     readonly hintKey: string;
     readonly urgency: Urgency;
   }

   // Zod 런타임 검증 스키마 (서버 응답 검증용)
   export const NextStepDescriptorSchema: z.ZodType<NextStepDescriptor> = z.object({...});

   CHECKOUT_TRANSITIONS 전이 테이블:
   - calibration/repair 경로: pending→approved→checked_out→returned→return_approved (5단계)
   - rental 경로: pending→approved→lender_checked→borrower_received→in_use→
                  borrower_returned→lender_received→returned→return_approved (9단계, 7 user steps)
   - overdue는 checked_out/in_use/borrower_returned에서 submit_return 전이 유지
   - terminal states (out-edge 0): rejected, canceled, return_approved
   - purposes 필드: rental 전용 전이는 ['rental'], 나머지는 모든 목적

   공개 API:
   export function getTransitionsFor(status: CheckoutStatus, purpose: CheckoutPurpose): readonly TransitionRule[]
   export function getNextStep(
     checkout: Pick<{status: CheckoutStatus; purpose: CheckoutPurpose; dueAt?: string | null}>,
     userPermissions: readonly string[]   // ← getPermissions(role) from shared-constants로 브리지
   ): NextStepDescriptor
   export function canPerformAction(
     checkout: Pick<{status: CheckoutStatus; purpose: CheckoutPurpose}>,
     action: CheckoutAction,
     userPermissions: readonly string[]   // ← getPermissions(role) from shared-constants로 브리지
   ): { ok: true } | { ok: false; reason: 'invalid_transition' | 'permission' }
   export function computeStepIndex(status: CheckoutStatus, purpose: CheckoutPurpose): number
   export function computeTotalSteps(purpose: CheckoutPurpose): number
   export function computeUrgency(checkout: Pick<{status: CheckoutStatus; dueAt?: string | null}>): Urgency

   설계 주의 (순환 의존성 회피):
   schemas → shared-constants 의존 불가 (shared-constants가 schemas에 의존).
   UserRole 대신 readonly string[] 수용. 호출자가 getPermissions(role) 변환 책임.

   불변식 검증 (module-level 실행):
   function assertFsmInvariants(transitions: readonly TransitionRule[]): void
   - 모든 CheckoutStatus(13개)가 from 또는 terminal로 등장
   - rejected/canceled/return_approved는 out-edge 0
   - rental 경로 순회 가능성 검증
   - calibration 경로 순회 가능성 검증
   - 의도적 사이클 허용: returned → checked_out (reject_return, 반입 반려 후 재검사)

2. 신규 파일 생성: packages/schemas/src/fsm/index.ts
   export * from './checkout-fsm';

3. packages/schemas/src/index.ts에 추가:
   export * from './fsm';

4. packages/schemas/src/checkout.ts — nextStep 필드 추가 (Gap 1 보완)
   CheckoutSummarySchema에 추가:
   nextStep: NextStepDescriptorSchema.nullable().optional()

   CheckoutDetailSchema에도 동일하게 추가.
   이 변경이 없으면 useCheckoutNextStep hook의 NextStepDescriptorSchema.safeParse()가
   실제 서버 응답을 검증하지 못하고 항상 client-side fallback으로만 동작함.
   packages/schemas/src/fsm/checkout-fsm.ts에서 NextStepDescriptorSchema import 경로 주의.

5. packages/schemas/src/__tests__/checkout-fsm.test.ts (≈180 lines)
   - assertFsmInvariants() 통과
   - computeStepIndex: calibration/repair pending→approved→checked_out→returned→return_approved (0→1→2→3→4)
   - computeTotalSteps: calibration=5, repair=5, rental=7
   - getNextStep 주요 케이스 (10개 snapshot):
     - pending, calibration, approver role → nextAction=approve, availableToCurrentUser=true
     - pending, calibration, test_engineer role → availableToCurrentUser=false, blockingReason='permission'
     - approved, calibration, logistics role → nextAction=start
     - checked_out + overdue → urgency=critical
     - return_approved → nextAction=null (terminal)
   - canPerformAction 권한 매트릭스: 검증 필요한 5 role × 12 action

SSOT 주의:
- CheckoutStatus는 packages/schemas/src/enums/checkout.ts CHECKOUT_STATUS_VALUES에서 import
- UserRole은 @equipment-management/schemas UserRole에서 import
- Permission은 @equipment-management/shared-constants Permission에서 import
  (APPROVE_CHECKOUT, START_CHECKOUT, COMPLETE_CHECKOUT, CANCEL_CHECKOUT 등 확인 필요)
- hasPermission()은 @equipment-management/shared-constants에서 import

검증:
- pnpm --filter @equipment-management/schemas test
- pnpm --filter @equipment-management/schemas exec tsc --noEmit
- assertFsmInvariants() 빌드 시 1회 실행 (예외 발생 없음)
- packages/schemas/src/index.ts에서 fsm 타입들이 정상 re-export됨 확인
```

---

### 🔴 CRITICAL — PR-2: Backend FSM 통합 — guard 교체 + audit + cache event (Mode 2)

```
문제:
checkouts.service.ts의 8개 guard site가 각자 status를 하드코딩 비교.
AuditLogService.create()가 상태 전이 시 호출되지 않아 감사 추적 불가.
emitAsync 페이로드에 nextActor 정보가 없어 다음 행위자 알림 불가.

조건: PR-1(FSM schemas) 머지 완료 후 진행.

작업:

1. checkouts.service.ts — 8 guard site 교체
   각 guard를 아래 패턴으로 교체:
   
   // Before (예: line 1302)
   if (checkout.status !== CSVal.PENDING) {
     throw new BadRequestException('승인 대기 상태가 아닙니다');
   }
   
   // After
   import { canPerformAction } from '@equipment-management/schemas';
   import { getPermissions } from '@equipment-management/shared-constants';
   const check = canPerformAction(checkout, 'approve', getPermissions(req.user.role));
   if (!check.ok) {
     throw new BadRequestException({
       code: 'FSM_INVALID_TRANSITION',
       reason: check.reason,
       currentStatus: checkout.status,
     });
   }

   교체 대상 action 매핑:
   line 1302: action='approve'
   line 1413: action='reject'
   line 1495: action='start'
   line 1602: action='submit_return'
   line 1738: action='approve_return'
   line 1840: action='reject_return'
   (cancel, update 라인도 동일 패턴으로 교체)

2. checkouts.service.ts — calculateAvailableActions 재구현 (line 998-1051)
   
   private calculateAvailableActions(
     checkout: Checkout,
     userPermissions: readonly string[]  // getPermissions(req.user.role) 호출자가 전달
   ): CheckoutAvailableActions {
     const rules = getTransitionsFor(checkout.status, checkout.purpose);
     const allowed = new Set(
       rules.filter(r => userPermissions.includes(r.requires)).map(r => r.action)
     );
     // 기존 boolean 구조 유지 (@deprecated 주석 추가)
     return {
       canApprove: allowed.has('approve'),
       canReject: allowed.has('reject'),
       canStart: allowed.has('start'),
       canReturn: allowed.has('submit_return'),
       canApproveReturn: allowed.has('approve_return'),
       canRejectReturn: allowed.has('reject_return'),
       canCancel: allowed.has('cancel'),
       canSubmitConditionCheck: allowed.has('submit_return'), // 기존 필드 호환
     };
   }

3. checkouts.service.ts — buildNextStep 메서드 추가 + 응답 DTO 확장
   
   private buildNextStep(checkout: Checkout, userPermissions: readonly string[]): NextStepDescriptor {
     return getNextStep(checkout, userPermissions);
   }
   
   CheckoutWithMeta 인터페이스에 nextStep: NextStepDescriptor 필드 추가.
   기존 availableActions는 @deprecated 주석 추가 (2 sprint 후 제거 예정).

4. checkouts.service.ts — AuditLog 연결
   각 성공적 전이 직후 (8개 site 모두):
   await this.auditService.create({
     userId: actorId,
     userName: actor.name,
     userRole: actor.role,
     action: `checkout.${rule.auditEventSuffix}`,    // e.g. 'checkout.approved'
     entityType: 'checkout',
     entityId: checkout.id,
     metadata: {
       fromStatus: checkout.status,
       toStatus: newStatus,
       purpose: checkout.purpose,
     },
   });
   AuditLogService는 apps/backend/src/modules/audit/audit.service.ts:72의 create() 사용.
   CreateAuditLogDto 구조는 해당 파일에서 import 확인 후 맞춤.

5. checkouts.service.ts — emitAsync 페이로드 확장
   기존 emitAsync 호출(line 1367, 1449, 1557, 1689, 1793, 1920)에 nextActor 필드 추가:
   await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.CHECKOUT_APPROVED, {
     ...기존 페이로드,
     nextActor: getNextStep(updatedCheckout, getPermissions(systemRole)).nextActor,  // 다음 행위자
   });

6. 신규 파일: apps/backend/test/checkouts.fsm.e2e-spec.ts (≈200 lines)
   - 각 valid 전이 호출 → 200 성공
   - 각 invalid 전이 호출 → 400 + code: FSM_INVALID_TRANSITION
   - 권한 부족 사용자가 approve 호출 → 403
   - 성공 전이 후 audit_logs 테이블에 레코드 존재 확인
   - nextStep 필드가 응답에 포함됨 확인
   기존 apps/backend/test/ 디렉토리의 checkouts.e2e-spec.ts 패턴 참조.

SSOT 주의:
- canPerformAction, getNextStep, getTransitionsFor는 @equipment-management/schemas/fsm에서 import
- getPermissions(role)는 @equipment-management/shared-constants에서 import — role → string[] 브리지
  (schemas가 shared-constants를 직접 import하면 순환 의존성 발생 — 호출자가 브리지 역할)
- userId는 항상 req.user.userId에서 추출 (body 신뢰 금지 — CLAUDE.md Rule 2)
- 기존 emitAsync는 emit으로 변경 금지 — verify-cache-events 스킬 기준 준수

검증:
- pnpm --filter backend run test -- checkouts
- pnpm --filter backend run test:e2e -- checkouts.fsm
- pnpm --filter backend run test:e2e -- checkouts.e2e  (기존 회귀 0)
- pnpm --filter backend exec tsc --noEmit
- DB: audit_logs 테이블에 checkout.approved 레코드 확인
```

---

### 🟠 HIGH — PR-3: Design Token Layer 2 확장 — surface/typography/spacing/workflow-panel (Mode 1)

```
문제:
apps/frontend/lib/design-tokens/semantic.ts에 3개 Layer 2 토큰 누락:
- ELEVATION_TOKENS.surface (flush/raised/floating 추상화 없음 — layer/shadow만 있음 line 202-222)
- TYPOGRAPHY_TOKENS export 없음 (TYPOGRAPHY_PRIMITIVES import만 있음)
- SPACING_RHYTHM_TOKENS export 없음

apps/frontend/lib/design-tokens/components/checkout.ts에 누락:
- CHECKOUT_STEPPER_TOKENS.status.next 없음 (line 335-351에 completed/current/pending만)
- CHECKOUT_STATS_VARIANTS에 hero 변형 없음 (line 400-444)
- CHECKOUT_ROW_TOKENS에 hover accent variant 없음 (line 142-154에 overdue만)

apps/frontend/lib/design-tokens/components/workflow-panel.ts 파일 미존재.

조건: PR-1 머지 후 독립적으로 진행 가능.

작업:

1. apps/frontend/lib/design-tokens/semantic.ts — 3개 토큰 추가

   // ELEVATION_TOKENS 하위에 surface 속성 추가 (line 222 직후)
   export const ELEVATION_TOKENS = {
     layer: { /* 기존 유지 */ },
     shadow: { /* 기존 유지 */ },
     surface: {
       flush:    'bg-muted/30',
       raised:   'bg-card border border-border/60 shadow-sm',
       floating: 'bg-card border border-border/80 shadow-md',
       emphasis: 'bg-card border-2 border-brand-info/40 shadow-md',
     },
   } as const;

   // 파일 하단에 신규 export 추가
   export const TYPOGRAPHY_TOKENS = {
     hero:       'text-3xl font-bold tracking-tight',
     heading:    'text-xl font-semibold',
     subheading: 'text-base font-medium',
     kpi:        'text-4xl font-bold tabular-nums leading-none',
     kpiLabel:   'text-xs font-medium uppercase tracking-wider text-muted-foreground',
     body:       'text-sm',
     caption:    'text-xs text-muted-foreground',
   } as const;

   export const SPACING_RHYTHM_TOKENS = {
     tight:       'space-y-1.5',
     comfortable: 'space-y-3',
     spacious:    'space-y-6',
     section:     'space-y-10',
   } as const;

   // 타입 export 추가
   export type TypographyVariant = keyof typeof TYPOGRAPHY_TOKENS;
   export type SpacingRhythm = keyof typeof SPACING_RHYTHM_TOKENS;

2. apps/frontend/lib/design-tokens/components/checkout.ts — 3개 항목 추가

   CHECKOUT_STEPPER_TOKENS.status에 next 추가 (line 351 이후, pending 바로 위):
   next: {
     node: 'bg-brand-info/5 ring-1 ring-dashed ring-brand-info/50',
     icon: 'text-brand-info/70',
     label: 'text-brand-info/90 font-medium',
   },

   CHECKOUT_STATS_VARIANTS에 hero 추가 (line 444 이후):
   hero: {
     // 레이아웃 토큰 (Gap 2 보완 — 플랜 Phase 3.4와 일치)
     container: 'col-span-2 sm:col-span-3 lg:col-span-2 row-span-1',
     surface: ELEVATION_TOKENS.surface.floating,   // floating → 나머지 카드(raised)보다 한 층 위
     kpi: TYPOGRAPHY_TOKENS.kpi + ' text-5xl',      // hero는 kpi보다 더 큰 5xl
     label: TYPOGRAPHY_TOKENS.kpiLabel,
     // Appearance 토큰 (기존 variant 구조와 일관성)
     hoverBorder: 'hover:border-brand-critical/30',
     activeBorder: 'border-brand-critical',
     activeBg: 'bg-brand-critical/10',
     iconColor: 'text-brand-critical',
     alertRing: 'ring-1 ring-brand-critical/20',
   },
   // 주의: hero의 container('col-span-2')는 PR-7에서 grid 레이아웃 적용 시 사용.
   // hero가 아닌 카드는 기존처럼 col-span-1 (grid-cols-6에서 4개가 1칸씩)

   CHECKOUT_ROW_TOKENS.hover 추가 (line 154 이후):
   hover: {
     normal:  'hover:bg-muted/30 transition-colors motion-safe:duration-150',
     pending: 'hover:bg-brand-warning/5 transition-colors motion-safe:duration-150',
   },
   참고: overdue 강조는 기존 overdue 속성(line 150-153) 유지.
   getCheckoutRowClasses 함수(line 163)에 pending hover 클래스 추가:
   if (status === 'pending') return [..., CHECKOUT_ROW_TOKENS.hover.pending].join(' ')

3. 신규 파일: apps/frontend/lib/design-tokens/components/workflow-panel.ts (≈80 lines)

   import { ELEVATION_TOKENS, TYPOGRAPHY_TOKENS } from '../semantic';
   import { TRANSITION_PRESETS } from '../motion';

   export const NEXT_STEP_PANEL_TOKENS = {
     container: {
       floating: `${ELEVATION_TOKENS.surface.emphasis} rounded-lg p-4`,
       inline:   `${ELEVATION_TOKENS.surface.raised} rounded-md p-3`,
       compact:  `${ELEVATION_TOKENS.surface.raised} rounded px-2 py-1.5`,
     },
     labels: {
       current: 'text-xs text-muted-foreground uppercase tracking-wide',
       next:    'text-xs text-brand-info uppercase tracking-wide font-medium',
       actor:   'text-xs text-muted-foreground italic',
       hint:    'text-xs text-muted-foreground',
     },
     values: {
       current: TYPOGRAPHY_TOKENS.subheading,
       next:    `${TYPOGRAPHY_TOKENS.heading} text-brand-info`,
     },
     urgency: {
       normal:   '',
       warning:  'border-l-4 border-l-brand-warning bg-brand-warning/5',
       critical: 'border-l-4 border-l-brand-critical bg-brand-critical/5 motion-safe:animate-pulse motion-reduce:animate-none',
     },
     actionButton: {
       primary: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ' +
                'bg-brand-info text-white hover:bg-brand-info/90 ' +
                TRANSITION_PRESETS.fastBg + ' ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-info focus-visible:ring-offset-2',
       secondary: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ' +
                  'border border-border hover:bg-muted ' +
                  TRANSITION_PRESETS.fastBg + ' ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
       ghost: 'inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground',
     },
     terminal: {
       badge: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-ok/10 text-brand-ok',
       icon:  'h-3 w-3',
     },
   } as const;

4. apps/frontend/lib/design-tokens/semantic.ts — DIMENSION_TOKENS 확장 (Gap 3 보완, line 354 이후)
   DIMENSION_TOKENS에 아래 2개 항목 추가:

   accentBar: 'w-1',
   // PR-5 CheckoutGroupCard row hover 좌측 강조 bar — w-hairline(3px)보다 얇은 1칸(4px)
   // globals.css에 --spacing-accent-bar: 4px → w-accent-bar 유틸리티 없으면 w-1(4px) 사용

   stickyHeaderOffset: 'top-[var(--sticky-header-height,0px)]',
   // PR-5 그룹 헤더 sticky 포지션 — --sticky-header-height CSS 변수 기반
   // consumer 3번째 사용처 등장으로 상수화 기준(4번째) 미달이지만 이번 플랜에서 추가로 쓰이므로 포함

5. apps/frontend/lib/design-tokens/index.ts에 workflow-panel.ts re-export 추가

SSOT 주의:
- bg-card/border-border/text-brand-* 등 CSS 변수 경유 — 하드코딩 hex 0건
- TRANSITION_PRESETS는 motion.ts에서 import (직접 Tailwind 클래스 hardcoding 금지)
- ring-dashed가 Tailwind 기본 유틸리티에 없다면 globals.css @layer utilities에
  .ring-dashed { outline: 2px dashed; outline-offset: 2px; } 추가

검증:
- pnpm --filter frontend exec tsc --noEmit
- grep 'ELEVATION_TOKENS\|TYPOGRAPHY_TOKENS\|SPACING_RHYTHM_TOKENS' apps/frontend/lib/design-tokens/index.ts → export 확인
- NEXT_STEP_PANEL_TOKENS import 가능 여부 타입 체크
```

---

### 🟠 HIGH — PR-4: NextStepPanel 컴포넌트 + useCheckoutNextStep 훅 (Mode 1)

```
문제:
"현재 단계 / 다음 단계 / 행위자" 표현 컴포넌트 미존재.
apps/frontend/components/shared/NextStepPanel.tsx 없음.
apps/frontend/hooks/use-checkout-next-step.ts 없음.

조건: PR-1(FSM schemas), PR-3(tokens) 완료 후 진행.

작업:

1. apps/frontend/hooks/use-checkout-next-step.ts (≈40 lines)

   import { getNextStep, NextStepDescriptorSchema, type NextStepDescriptor } from '@equipment-management/schemas';
   import { useAuth } from '@/hooks/use-auth';

   interface CheckoutForNextStep {
     status: string;
     purpose: string;
     dueAt?: string | null;
     nextStep?: NextStepDescriptor | null;  // 서버 응답에서 올 경우
   }

   export function useCheckoutNextStep(checkout: CheckoutForNextStep): NextStepDescriptor {
     const { user } = useAuth();
     return useMemo(() => {
       // 서버 응답이 있으면 Zod 검증 후 사용
       if (checkout.nextStep) {
         const parsed = NextStepDescriptorSchema.safeParse(checkout.nextStep);
         if (parsed.success) return parsed.data;
         // parse 실패 = 스키마 드리프트 → client-side fallback
       }
       return getNextStep(checkout as any, user.role);
     }, [checkout.status, checkout.purpose, checkout.dueAt, checkout.nextStep, user.role]);
   }
   참고: as any는 CheckoutPurpose/CheckoutStatus 타입 assertion용 — FSM 내부에서 검증

2. apps/frontend/components/shared/NextStepPanel.tsx (≈180 lines)
   
   interface NextStepPanelProps {
     descriptor: NextStepDescriptor;
     variant?: 'floating' | 'inline' | 'compact';
     onActionClick?: (action: CheckoutAction) => void | Promise<void>;
     isPending?: boolean;
     className?: string;
     'data-testid'?: string;
   }

   렌더링 결정 (FSM-driven, if-else 분기 최소화):
   - descriptor.nextAction === null → terminal 상태: "완료" 배지만 (NEXT_STEP_PANEL_TOKENS.terminal)
   - availableToCurrentUser === true → 3-line + primary action 버튼
   - availableToCurrentUser === false → 3-line + actor hint (버튼 없음)
   - urgency 기반 컨테이너 클래스 분기 (NEXT_STEP_PANEL_TOKENS.urgency)

   접근성:
   - 최상위 div: role="status" aria-live="polite" aria-atomic="true"
   - aria-describedby로 hint span 연결
   - 버튼: aria-label="{labelKey 번역} — {currentStep}/{total} 단계"
   - isPending 시 버튼 disabled + aria-disabled="true" + 스피너 icon

   모션:
   - key={descriptor.currentStatus} → 전이 시 re-mount → ANIMATION_PRESETS.fadeIn 트리거
   - urgency=critical: NEXT_STEP_PANEL_TOKENS.urgency.critical (pulse)

   3-line 레이아웃 (모든 variant 공통):
   [현재] {t(`checkouts.fsm.action.${currentStepLabelKey}`)} ({currentStepIndex}/{totalSteps})
   [다음] {t(`checkouts.fsm.hint.${descriptor.hintKey}`)}
   [행위자] {t(`checkouts.fsm.actor.${descriptor.nextActor}`)}

3. apps/frontend/components/shared/__tests__/NextStepPanel.test.tsx (≈130 lines)
   - terminal 상태 렌더: "완료" 배지만 표시
   - availableToCurrentUser=true: 버튼 렌더
   - availableToCurrentUser=false: 버튼 없음, actor hint 표시
   - isPending=true: 버튼 disabled + aria-disabled
   - urgency=critical: animate-pulse 클래스 확인
   - onActionClick 호출 확인
   - axe-core 접근성 위반 0 확인 (jest-axe 사용)

4. apps/frontend/components/shared/NextStepPanel.stories.tsx (≈150 lines, Gap 4 보완)
   Storybook 스토리 — Phase 7.5 visual regression + AP-08 dark mode contrast 검증 용도.

   주요 스토리 구성:
   - 10개 주요 status 케이스:
     pending (availableToCurrentUser=false / true 양방향)
     approved, checked_out, overdue (critical urgency), lender_checked
     in_use, borrower_returned, returned, return_approved (terminal)
     rejected/canceled (terminal)
   - 3개 variant: floating / inline / compact
   - urgency 3단계: normal / warning / critical (pulse 시각 확인)
   - isPending=true: 버튼 스피너 상태
   - dark mode decorator: withDarkMode (Storybook dark background + CSS .dark 클래스 적용)
     → WCAG contrast 4.5:1 시각 검증 (AP-08)

   스토리 네이밍:
   export const PendingWaitingApprover — availableToCurrentUser=false
   export const PendingApproverView — availableToCurrentUser=true
   export const ApprovedCanStart — approved + logistics role
   export const OverdueCritical — checked_out + overdue + urgency=critical
   export const TerminalReturnApproved — return_approved (nextAction=null)
   export const DarkModePending — pending + dark decorator (snapshot용)

   목적: 이 stories.tsx 없이는 Storybook dark snapshot을 통한 contrast 검증 불가.
   별도 Chromatic/Percy 연결 없이도 로컬 `pnpm storybook` 시각 QA 가능.

SSOT 주의:
- CheckoutAction 타입은 @equipment-management/schemas/fsm에서 import
- NEXT_STEP_PANEL_TOKENS은 @/lib/design-tokens에서 import
- i18n: t()로 호출, 직접 문자열 하드코딩 금지

검증:
- pnpm --filter frontend exec tsc --noEmit
- pnpm --filter frontend run test -- NextStepPanel
- jest-axe: axe violations 0
```

---

### 🟠 HIGH — PR-5: CheckoutGroupCard + CheckoutDetailClient FSM 통합 (Mode 2)

```
문제:
1. CheckoutGroupCard.tsx — APPROVED 상태 CTA 완전 누락 (line 475-512에 PENDING/CHECKED_OUT/OVERDUE만)
   RentalFlowInline 헬퍼(line 60-123)가 rental 단계를 별도로 하드코딩
   sticky group header 없음, hover accent 없음

2. CheckoutDetailClient.tsx — renderActions(line 297-445)와 Stepper(line 477-487)가 시각적으로 분리
   "다음에 뭐 해야 하지?" 파악을 위해 스크롤 탐색 필요

조건: PR-1(FSM schemas), PR-3(tokens), PR-4(NextStepPanel) 완료 후 진행.

작업:

1. CheckoutGroupCard.tsx — 인라인 NextStepPanel 통합

   변경:
   - RentalFlowInline 헬퍼(line 60-123) 전체 삭제
   - 각 checkout row의 우측 액션 영역:
     기존: PENDING → 승인/반려 버튼, CHECKED_OUT/OVERDUE → 반입 링크
     변경: 모든 상태 → <NextStepPanel variant="compact" descriptor={useCheckoutNextStep(checkout)} onActionClick={handleAction} />
   - row 컨테이너에 hover accent 적용:
     CHECKOUT_ROW_TOKENS.hover.normal 또는 hover.pending 동적 선택
     (getCheckoutRowClasses 함수에 hover 클래스 통합)
   - 그룹 헤더에 sticky 적용:
     className에 `sticky top-[var(--sticky-header-height,0px)] z-10 ${ELEVATION_TOKENS.surface.raised}` 추가
   - Badge 표시 조건 축소: urgency !== 'normal' OR status === 'pending'인 경우만 표시

   handleAction 함수:
   각 action별 기존 mutation 호출로 위임 (approve → approveMutation, reject → rejectMutation 등)
   action 매핑은 switch 또는 Record<CheckoutAction, () => void> 패턴

2. CheckoutDetailClient.tsx — renderActions 삭제 + floating NextStepPanel 삽입

   변경:
   - renderActions 함수(line 297-445) 전체 삭제
   - Stepper Card(line 477-487)의 CardContent 하단에 삽입:
     <NextStepPanel
       variant="floating"
       descriptor={useCheckoutNextStep(checkoutDetail)}
       onActionClick={handleDetailAction}
       isPending={approveMutation.isPending || rejectMutation.isPending || ...}
     />
   - Hero header에 TYPOGRAPHY_TOKENS.hero 적용 (checkout 제목)
   - 섹션 간 SPACING_RHYTHM_TOKENS.spacious 적용
   - 모바일(<sm) sticky footer: 기존 유지하되 variant="compact" 사용

   handleDetailAction 함수:
   switch (action) {
     case 'approve': approveMutation.mutate(...)
     case 'reject': setRejectDialogOpen(true)
     case 'start': startMutation.mutate(...)
     case 'submit_return': setReturnDialogOpen(true)
     case 'approve_return': approveReturnMutation.mutate(...)
     case 'reject_return': rejectReturnMutation.mutate(...)
   }

3. Feature Flag 구현 (Gap 6 보완 — Phase 8.2 롤백 안전망)

   환경변수 추가:
   apps/frontend/.env.local (기존 파일에 추가):
   NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true

   apps/frontend/.env.local.example에도 동일 추가 (기본값 false).

   CheckoutDetailClient.tsx에서:
   const showNextStepPanel = process.env.NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL === 'true';

   // renderActions를 완전 삭제 대신 LegacyActionsBlock으로 추출 후 유지:
   function LegacyActionsBlock({ checkout, ... }: LegacyActionsBlockProps) {
     // 기존 renderActions(line 297-445) 내용 이동 (변경 없이 그대로)
   }

   // Stepper Card 하단:
   {showNextStepPanel ? (
     <NextStepPanel variant="floating" descriptor={...} onActionClick={handleDetailAction} isPending={...} />
   ) : (
     <LegacyActionsBlock checkout={checkoutDetail} ... />
   )}

   CheckoutGroupCard.tsx에서도 동일 패턴:
   {showNextStepPanel ? (
     <NextStepPanel variant="compact" ... />
   ) : (
     <LegacyInlineActions checkout={checkout} canApprove={canApprove} />
     // 기존 PENDING/CHECKED_OUT/OVERDUE 분기 로직을 LegacyInlineActions로 추출
   )}

   rollback 시나리오 (Phase 8.2):
   1. .env.local에서 NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false로 변경
   2. pnpm --filter frontend run build → 즉시 기존 UI 복구
   3. FSM backend(PR-2)는 영향 없음 — availableActions boolean 하위 호환 유지
   
   2주 관찰 후 flag 제거 단계:
   - NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 환경변수 삭제
   - showNextStepPanel 분기 제거 → NextStepPanel만 남김
   - LegacyActionsBlock, LegacyInlineActions 완전 삭제

SSOT 주의:
- useCheckoutNextStep은 @/hooks/use-checkout-next-step에서 import
- CheckoutAction은 @equipment-management/schemas에서 import
- ELEVATION_TOKENS, TYPOGRAPHY_TOKENS, SPACING_RHYTHM_TOKENS은 @/lib/design-tokens에서 import
- status 직접 비교 if (checkout.status === 'approved') 패턴 추가 금지

검증:
- pnpm --filter frontend exec tsc --noEmit
- pnpm --filter frontend run test
- NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true: APPROVED 상태 row에 "반출 시작" 버튼 표시 확인
- NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false: 기존 UI 동일하게 동작 확인 (rollback 검증)
- 수동 확인: 그룹 헤더가 스크롤 시 sticky 유지
```

---

### 🟠 HIGH — PR-6: CheckoutStatusStepper next 상태 + CheckoutMiniProgress 확장 (Mode 1)

```
문제:
CheckoutStatusStepper.tsx — "다음 단계" 노드가 시각적으로 강조되지 않음
  (completed/current/pending 3상태만, next 없음 — CHECKOUT_STEPPER_TOKENS.status에 next 미존재)
  aria-current="step"이 잘못 사용될 가능성 있음

CheckoutMiniProgress.tsx — descriptor 기반 next 상태 시각화 미지원

조건: PR-1(FSM schemas), PR-3(tokens) 완료 후 진행. PR-5와 병렬 가능.

작업:

1. apps/frontend/components/checkouts/CheckoutStatusStepper.tsx (≈±40 lines)

   import { useCheckoutNextStep } from '@/hooks/use-checkout-next-step';
   import { computeStepIndex } from '@equipment-management/schemas';

   - checkout prop에서 useCheckoutNextStep() 호출 → nextDescriptor 획득
   - nextDescriptor.currentStepIndex + 1 = 다음 스텝 index
   - 해당 index 노드에 CHECKOUT_STEPPER_TOKENS.status.next 스타일 적용
   - aria-label="다음 단계: {t(`stepper.${stepLabel}`)}" 추가
   - aria-current="step"은 current 노드에만 유지 (next 노드에 중복 금지)
   - Stepper CardContent에 ELEVATION_TOKENS.surface.raised 적용

2. apps/frontend/components/checkouts/CheckoutMiniProgress.tsx (≈±30 lines)

   - 기존 currentStatus prop 기반 계산 로직 유지 (하위 호환)
   - 선택적 prop 추가: descriptor?: NextStepDescriptor
   - descriptor가 있을 때: descriptor.currentStepIndex 기반으로 next 스텝도 시각화
   - descriptor.urgency === 'critical' → current dot에 ring-brand-critical 적용
   - aria-label에 urgency 반영: "기한 초과 — {stepName} ({n}/{total})" 형태

SSOT 주의:
- CHECKOUT_STEPPER_TOKENS는 @/lib/design-tokens에서 import (PR-3에서 next 추가됨)
- computeStepIndex는 @equipment-management/schemas에서 import
- stepper label i18n은 기존 CHECKOUT_STEP_LABELS SSOT 유지

검증:
- pnpm --filter frontend exec tsc --noEmit
- 수동 확인: PENDING 상태 상세 페이지에서 2번째 스텝(approved)이 점선 링으로 강조됨
- 수동 확인: CHECKED_OUT 기한 초과 시 current dot이 빨간색으로 표시됨
```

---

### 🟡 MEDIUM — PR-7: Stat Card 계층화 + Typography·Spacing·Motion 적용 — AP-01·02·03·06·09 (Mode 1)

```
문제:
AP-01 Card Soup: OutboundCheckoutsTab.tsx의 5개 stat card가 모두 균등 크기 (hero 계층 없음)
AP-03 타이포: stat card KPI `text-2xl font-bold` (line 247, OutboundCheckoutsTab.tsx) — 3:1 비율 미달
AP-02 간격 리듬: CheckoutsContent.tsx 섹션 간 간격 토큰 미적용
AP-06 모션: skeleton loading에 stagger 미적용, 상태 카드 스위치 시 모션 cue 없음
AP-09 빈 상태: overdue === 0 시 celebration variant 없음 (EmptyState에 celebration 미존재)

조건: PR-3(tokens) 완료 후 진행.

작업:

1. apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx

   Stat card 그리드 계층화 (AP-01):
   grid 클래스: `grid gap-3 grid-cols-6 sm:grid-cols-6 mb-5`
   동적 hero 선택 로직:
   const heroVariant = summary.overdue > 0 ? 'overdue'
                     : summary.pending > 0 ? 'pending'
                     : 'total';
   hero card: col-span-2 + CHECKOUT_STATS_VARIANTS.hero 스타일 (PR-3에서 추가)
   나머지 4개: col-span-1

   KPI 숫자 토큰 교체 (AP-03):
   line 247: `text-2xl font-bold` → `${TYPOGRAPHY_TOKENS.kpi}` (text-4xl)

   Skeleton stagger (AP-06):
   기존 skeleton 3개 array.map에 style={{ animationDelay: getStaggerDelay(i, 'list') }} 추가
   (getStaggerDelay는 @/lib/design-tokens/motion에서 import)

   Empty state celebration (AP-09):
   filters.status === 'overdue' && summary.overdue === 0 → variant="celebration" 분기
   celebration variant: EMPTY_STATE_TOKENS.variantIconColor에 'celebration': 'text-brand-ok' 추가 필요
   apps/frontend/lib/design-tokens/semantic.ts EMPTY_STATE_TOKENS.variantIconColor에 celebration 추가:
   'celebration': 'text-brand-ok'
   apps/frontend/components/shared/EmptyState.tsx에 celebration 분기 추가 (기존 variant 확장)

2. apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx
   동일 패턴 적용 (OutboundCheckoutsTab과 동일)

3. apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx
   페이지 hero 제목: TYPOGRAPHY_TOKENS.hero 적용
   탭 컨테이너 섹션 간: SPACING_RHYTHM_TOKENS.section 적용

SSOT 주의:
- TYPOGRAPHY_TOKENS, SPACING_RHYTHM_TOKENS, EMPTY_STATE_TOKENS는 @/lib/design-tokens에서 import
- getStaggerDelay는 @/lib/design-tokens/motion에서 import
- text-4xl이 기존 KPI보다 너무 크다면 TYPOGRAPHY_TOKENS.kpi를 'text-3xl ...'로 조정

검증:
- pnpm --filter frontend exec tsc --noEmit
- 수동 확인: overdue > 0 시 overdue card가 col-span-2로 확대됨
- 수동 확인: overdue === 0 필터 적용 시 체크마크 + 긍정 메시지 표시
- 수동 확인: skeleton 로딩 시 3개가 stagger(순차) fade-in
```

---

### 🟡 MEDIUM — PR-8: i18n FSM 키 추가 + 검증 게이트 강화 (Mode 0)

```
문제:
apps/frontend/messages/ko.json, en.json에 checkouts.fsm.* 키 없음.
(검증일 기준 checkouts.stepper, checkouts.rentalFlow는 있지만 checkouts.fsm 없음)
scripts/check-i18n-keys.mjs가 FSM 신규 키를 감지하지 못함.

조건: PR-1(FSM schemas) 완료 후 진행. PR-4(NextStepPanel)와 병렬 가능.

작업:

1. apps/frontend/messages/ko.json — checkouts.fsm 섹션 추가:

   "checkouts": {
     ...기존 키 유지...,
     "fsm": {
       "action": {
         "approve": "승인",
         "reject": "반려",
         "cancel": "취소",
         "start": "반출 시작",
         "lender_check": "반출 확인",
         "borrower_receive": "인수 확인",
         "mark_in_use": "사용 시작",
         "borrower_return": "반납 확인",
         "lender_receive": "반입 확인",
         "submit_return": "반입 신청",
         "approve_return": "반입 승인",
         "reject_return": "반입 반려"
       },
       "hint": {
         "pendingApprove": "기술책임자의 승인을 기다리고 있습니다",
         "approvedStart": "반출을 시작할 수 있습니다",
         "approvedLenderCheck": "반출 전 장비 상태를 확인해주세요",
         "lenderCheckedBorrowerReceive": "인수 측의 확인을 기다리고 있습니다",
         "borrowerReceivedMarkInUse": "장비를 사용 시작으로 전환해주세요",
         "inUseBorrowerReturn": "반납 준비가 되면 반납 확인을 진행해주세요",
         "borrowerReturnedLenderReceive": "반납 장비를 수령하고 확인해주세요",
         "checkedOutSubmitReturn": "반입 신청을 진행해주세요",
         "returnedApproveReturn": "반입 상태를 검토하고 승인해주세요",
         "pendingCancel": "신청을 취소할 수 있습니다",
         "waitingApprover": "승인자의 검토를 기다리고 있습니다",
         "overdueReturn": "기한이 초과되었습니다. 즉시 반입 신청해주세요",
         "terminal": "모든 절차가 완료되었습니다"
       },
       "actor": {
         "requester": "신청자",
         "approver": "승인자 (기술책임자)",
         "logistics": "반출 담당자",
         "lender": "대여 제공 측",
         "borrower": "대여 사용 측",
         "system": "시스템",
         "none": "-"
       }
     },
     "empty": {
       ...기존 유지...,
       "celebration": {
         "title": "기한 초과 건 없음",
         "description": "모든 반출 건이 기한 내 반입 완료되었습니다."
       }
     }
   }

2. apps/frontend/messages/ko.json — checkouts.nextStep 레이블 키 추가 (Gap 5 보완)
   "checkouts" 하위에 fsm 섹션과 동등하게 추가:

   "nextStep": {
     "current": "현재 단계",
     "next": "다음 단계",
     "actor": "담당",
     "urgency": {
       "normal": "",
       "warning": "주의",
       "critical": "기한 초과"
     },
     "terminal": "완료",
     "blockedHint": "이 단계는 {actor}에게 필요합니다",
     "stepOf": "{current}/{total} 단계"
   }

   이 키들은 NextStepPanel.tsx의 3-line 레이아웃 레이블:
   [현재] → t('checkouts.nextStep.current')
   [다음] → t('checkouts.nextStep.next')
   [담당] → t('checkouts.nextStep.actor')
   urgency 배지 → t(`checkouts.nextStep.urgency.${urgency}`)
   step 카운터 → t('checkouts.nextStep.stepOf', { current, total })

3. apps/frontend/messages/en.json — 동일 구조 영문 번역 추가

4. scripts/check-i18n-keys.mjs — FSM 키 필수 검증 로직 추가:
   const REQUIRED_FSM_KEYS = [
     'checkouts.fsm.action.approve',
     'checkouts.fsm.action.start',
     'checkouts.fsm.hint.pendingApprove',
     'checkouts.fsm.hint.terminal',
     'checkouts.fsm.actor.approver',
     // ... (주요 키 15개)
   ];
   누락 시 process.exit(1) — 빌드 실패 처리

검증:
- node scripts/check-i18n-keys.mjs → exit 0
- pnpm --filter frontend build → 빌드 성공 (i18n 키 누락 에러 없음)
- NextStepPanel에서 t('checkouts.fsm.action.approve') 렌더링 확인
```

---

### 🟡 MEDIUM — PR-9: checkouts.next-step E2E 테스트 (Mode 1)

```
문제:
APPROVED 상태 CTA 가시성, FSM 상태 전이 플로우, urgency 시각화, 접근성에 대한
E2E 테스트가 없음.

조건: PR-5(통합) 완료 후 진행.

작업:

apps/frontend/e2e/checkouts.next-step.spec.ts 신규 생성 (≈220 lines)
기존 apps/frontend/tests/e2e/checkouts/ 디렉토리 패턴 참조.

시나리오:
1. test_engineer 로그인 → pending 반출 상세 페이지
   - NextStepPanel에 "다음: 승인자 검토 대기" hint 텍스트 표시 확인
   - 액션 버튼 없음 확인 (availableToCurrentUser=false)

2. technical_manager 로그인 → 동일 반출 상세 페이지
   - NextStepPanel에 "승인" 버튼 표시 확인
   - "승인" 버튼 클릭 → status가 approved로 전환 확인

3. APPROVED 상태 반출 목록 페이지 (핵심 회귀 검증)
   - CheckoutGroupCard에서 "반출 시작" 버튼/CTA 표시 확인
   - 이전 공백: APPROVED 상태에서 CTA 없던 버그 재발 방지

4. checked_out 상태 + 기한 초과 시뮬레이션
   - NextStepPanel urgency=critical 스타일 확인 (accent bar)
   - prefers-reduced-motion 미디어 쿼리 시뮬레이션:
     await page.emulateMedia({ reducedMotion: 'reduce' });
     animate-pulse 클래스가 없거나 motion-reduce:animate-none이 적용됨 확인

5. rental 7단계 주요 전이
   - lender_checked 상태 → "다음: 인수 확인" hint 확인
   - borrower 역할 사용자에게 borrower_receive 버튼 노출 확인

6. 권한 없는 사용자 (test_engineer)가 approved 상태 반출 상세 방문
   - 승인 관련 버튼 미노출 확인
   - actor hint 텍스트만 표시 확인

7. 키보드 탐색
   - Tab으로 NextStepPanel 버튼에 focus 도달 확인
   - focus-visible ring 표시 확인
   - Enter로 버튼 활성화 확인

8. 다크 모드
   page.emulateMedia({ colorScheme: 'dark' })
   - NextStepPanel의 텍스트 contrast 확인 (axe-core)
   - screenshot.toMatchSnapshot('next-step-panel-dark.png')

fixture 사용:
- 기존 test/fixtures/ storageState 패턴 준수
- 테스트용 checkout ID는 기존 seed 데이터 사용 (새 데이터 생성 금지)

검증:
- pnpm --filter frontend run test:e2e -- checkouts.next-step.spec
- 8개 시나리오 모두 pass
- axe-core 위반 0
```

---

### 🟡 MEDIUM — PR-10: NC elevation 리팩토링 — ELEVATION_TOKENS.surface 승격 (Mode 1)

```
문제:
apps/frontend/components/non-conformances/ 파일들이 로컬 NC_ELEVATION 토큰을 사용.
PR-3에서 ELEVATION_TOKENS.surface가 semantic.ts에 추가되면 NC는 구버전 로컬 토큰을 계속 참조하게 됨.
이번 플랜 완료 후 앱 전체 elevation이 이원화됨.

조건: PR-3(tokens) 완료 + NC e2e 선행 통과 후 진행 (별도 PR).

작업:

1. NC 컴포넌트에서 NC_ELEVATION 로컬 토큰 사용처 조사:
   grep -rn 'NC_ELEVATION' apps/frontend/components/non-conformances/
   → 사용 파일 목록 확인

2. 각 파일에서 교체:
   NC_ELEVATION.flush    → ELEVATION_TOKENS.surface.flush
   NC_ELEVATION.raised   → ELEVATION_TOKENS.surface.raised
   NC_ELEVATION.floating → ELEVATION_TOKENS.surface.floating

3. NC_ELEVATION 로컬 상수가 정의된 위치 확인 후 해당 정의 삭제

4. import 경로 정리:
   import { ELEVATION_TOKENS } from '@/lib/design-tokens'

SSOT 주의:
- replace_all로 일괄 교체 (오타 방지)
- NC_ELEVATION이 NC 전용 elevation 값을 갖고 있는지 먼저 확인:
  값이 ELEVATION_TOKENS.surface와 다르면 migration 전 사용자에게 확인

검증:
- pnpm --filter frontend exec tsc --noEmit
- pnpm --filter frontend run test:e2e -- non-conformances  (기존 NC e2e 회귀 0)
- grep 'NC_ELEVATION' apps/frontend/ → 0 hit
```

---

### 🟡 MEDIUM — PR-11: Self-Audit 게이트 강화 + 번들 크기 측정 (Mode 0)

```
문제:
scripts/self-audit.mjs가 FSM 관련 하드코딩(if (status === 'pending') 류)을 감지하지 못함.
checkout 관련 bundle size baseline이 없어 Phase 5 이후 증가분 측정 불가.

조건: PR-2(backend) 완료 후 진행.

작업:

1. scripts/self-audit.mjs에 FSM 리터럴 검사 추가:
   기존 7대 체크 뒤에 추가:

   // Check 8: FSM 상태 리터럴 하드코딩
   const fsmLiteralPattern = /if\s*\(\s*[\w.]+\.status\s*!==?\s*['"][a-z_]+['"]/g;
   const fsmFiles = glob.sync('apps/backend/src/modules/checkouts/**/*.service.ts');
   for (const file of fsmFiles) {
     const content = fs.readFileSync(file, 'utf8');
     const matches = content.match(fsmLiteralPattern);
     if (matches?.length) {
       errors.push(`[FSM] status literal guard in ${file}: ${matches.length}곳 — canPerformAction() 사용`);
     }
   }

   // Check 9: checkout 관련 role 리터럴 비교
   const roleLiteralPattern = /role\s*===?\s*['"][a-z_]+['"]/g;
   // hasPermission() 경유하지 않는 role 비교 감지

2. 번들 크기 baseline 측정 스크립트:
   scripts/measure-bundle.mjs 신규 생성:
   - ANALYZE=1 pnpm --filter frontend build 실행
   - .next/analyze/ 결과 파싱
   - checkouts 관련 chunk 크기 기록
   - baseline 대비 증가분이 8KB gzipped 초과 시 경고

3. package.json에 script 추가:
   "scripts": {
     "measure:bundle": "node scripts/measure-bundle.mjs"
   }

검증:
- node scripts/self-audit.mjs → exit 0 (기존 위반 없을 때)
- scripts/self-audit.mjs에 의도적으로 if (status === 'pending') 삽입 후 실행 → 오류 출력 확인
- node scripts/measure-bundle.mjs → baseline 출력 확인
```

---

> **PR 실행 순서 (의존성 그래프)**
>
> PR-1 (FSM schemas) → PR-2 (backend)
>                    → PR-3 (tokens) → PR-4 (NextStepPanel) → PR-5 (GroupCard/DetailClient)
>                                    → PR-6 (Stepper/MiniProgress)
>                                    → PR-7 (Stat/Typography)
>                                    → PR-8 (i18n) ──────────────────→ PR-9 (E2E)
>                                                   → PR-10 (NC)
>                                                   → PR-11 (Audit gate)
>
> PR-3과 PR-8은 병렬 가능. PR-5와 PR-6은 병렬 가능. PR-10은 별도 분리 PR.

---

## NC 상세 페이지 "다음 단계 가이던스" — Phase 1~4 프롬프트 (4건)

> **발견 배경 (2026-04-21, /review-design 부적합관리 상세 페이지 64/100)**:
> AP-01~10 개선 + 산재된 4개 안내 UI를 단일 GuidanceCallout 추상화로 통합하는 아키텍처 플랜.
> Plan ID: floating-crafting-pony. 검증일: 2026-04-21.
> 검증 완료: SECTION_RHYTHM_TOKENS/CALLOUT_TOKENS/staggerFadeInItem/NC_WORKFLOW_GUIDANCE_TOKENS/GuidanceCallout.tsx/guidance.ts — 모두 미존재.
> getSemanticContainerColorClasses, getSemanticLeftBorderClasses, getSemanticSolidBgClasses — brand.ts에 존재, index.ts re-export 완료.
> NC_SPACING_TOKENS.afterHeader 단 1개만 존재, section 17 중복(L724+L741), section 20 비어 있음 확인.
> NCDetailClient.tsx는 현재 981 라인 (플랜 작성 시 596줄에서 증가 — 라인 번호 사용 시 grep으로 재확인 필수).
> 실행 순서: NC-P1 → NC-P2 → NC-P3 → NC-P4.

---

### 🟠 HIGH — NC-P1: Layer 2 Semantic 토큰 추가 — SECTION_RHYTHM, CALLOUT_TOKENS, staggerFadeInItem (Mode 0)

```
문제:
1. semantic.ts에 SECTION_RHYTHM_TOKENS 없음 → 컴포넌트마다 raw space-y-5 하드코딩
2. semantic.ts에 CALLOUT_TOKENS 없음 → 4+ 도메인(NC_INFO_NOTICE/DASHBOARD_ALERT/APPROVAL_TIMELINE/DISPOSAL_BANNER)이
   border-l-4 + bg-{color}/5 패턴을 각자 구현 (중복)
3. motion.ts ANIMATION_PRESETS에 staggerFadeInItem 없음 →
   globals.css --animate-stagger-fade-in이 이미 정의되어 있으나 design-tokens에서 노출 안 됨.
   calibration.ts:238이 raw 문자열 복붙 사용 중 (SSOT 위반)
4. motion.ts에 getStaggerFadeInStyle helper 없음 → index: number → CSSProperties 자동화 불가

비파괴 (순수 추가). 기존 export 불변.

수정 파일 (3개):
A. apps/frontend/lib/design-tokens/semantic.ts
B. apps/frontend/lib/design-tokens/motion.ts
C. apps/frontend/lib/design-tokens/index.ts

작업:

[A] semantic.ts — LAYOUT_TOKENS 블록(line 229~239) 직후에 SECTION_RHYTHM_TOKENS 추가:

export const SECTION_RHYTHM_TOKENS = {
  tight:       'space-y-3',              // 12px — 밀접 관련 (헤더+서브타이틀)
  comfortable: 'space-y-5',              // 20px — 기본 섹션 간
  spacious:    'space-y-6 md:space-y-7', // 24/28px — 그룹 경계
  dramatic:    'space-y-8 md:space-y-10',// 32/40px — 액션 직전 강조
} as const;

export type SectionRhythm = keyof typeof SECTION_RHYTHM_TOKENS;

export function getSectionRhythm(density: SectionRhythm = 'comfortable'): string {
  return SECTION_RHYTHM_TOKENS[density];
}

[A] semantic.ts — EMPTY_STATE_TOKENS 블록(line 370~395) 직후에 CALLOUT_TOKENS 추가:

import 추가 필요 (파일 상단에):
  import { getSemanticContainerColorClasses, getSemanticLeftBorderClasses, getSemanticSolidBgClasses, type SemanticColorKey } from './brand';
  (MICRO_TYPO는 같은 파일 내 이미 존재 — import 불필요)

export type CalloutVariant = 'info' | 'warning' | 'critical' | 'ok' | 'neutral';
export type CalloutEmphasis = 'leftBorder' | 'filled' | 'outlined';
export type CalloutSize = 'compact' | 'default' | 'spacious';

const CALLOUT_VARIANT_TO_SEMANTIC: Record<CalloutVariant, SemanticColorKey> = {
  info: 'info', warning: 'warning', critical: 'critical', ok: 'ok', neutral: 'neutral',
};

export const CALLOUT_TOKENS = {
  base: 'flex items-start gap-3 rounded-md',
  size: {
    compact:  'px-3 py-2.5 min-h-[3rem]',
    default:  'px-4 py-3.5 min-h-[3.5rem]',
    spacious: 'px-5 py-4 min-h-[4rem]',
  },
  emphasis: {
    leftBorder: (v: CalloutVariant) =>
      `border-l-4 ${getSemanticLeftBorderClasses(CALLOUT_VARIANT_TO_SEMANTIC[v])} ${getSemanticContainerColorClasses(CALLOUT_VARIANT_TO_SEMANTIC[v])}`,
    outlined: (v: CalloutVariant) =>
      `border ${getSemanticContainerColorClasses(CALLOUT_VARIANT_TO_SEMANTIC[v])}`,
    filled: (v: CalloutVariant) =>
      `${getSemanticSolidBgClasses(CALLOUT_VARIANT_TO_SEMANTIC[v])} text-white`,
  },
  icon: {
    wrap: 'flex-shrink-0 mt-0.5',
    size: 'h-5 w-5',
    color: (v: CalloutVariant) => `text-brand-${CALLOUT_VARIANT_TO_SEMANTIC[v]}`,
  },
  body: 'flex-1 min-w-0 space-y-1',
  title: (v: CalloutVariant) => `text-sm font-semibold text-brand-${CALLOUT_VARIANT_TO_SEMANTIC[v]}`,
  description: 'text-sm text-muted-foreground leading-relaxed',
  action: 'mt-2 flex items-center gap-2',
} as const;

export function getCalloutClasses(
  variant: CalloutVariant,
  emphasis: CalloutEmphasis = 'leftBorder',
  size: CalloutSize = 'default'
): string {
  return [
    CALLOUT_TOKENS.base,
    CALLOUT_TOKENS.size[size],
    CALLOUT_TOKENS.emphasis[emphasis](variant),
  ].join(' ');
}

[B] motion.ts — ANIMATION_PRESETS 객체(line 240~277)에 dialogEnter 직후 추가:

  /** 스태거 fade-in 아이템 (globals.css --animate-stagger-fade-in SSOT 노출)
   * motion-reduce:opacity-100 guard — prefers-reduced-motion 환경에서 사라짐 방지 */
  staggerFadeInItem:
    'motion-safe:animate-stagger-fade-in motion-safe:opacity-0 motion-reduce:opacity-100',

[B] motion.ts — getStaggerDelay 함수(line 75~81) 직후에 추가:

import type React from 'react'; // 파일 상단에 없으면 추가

export function getStaggerFadeInStyle(
  index: number,
  type: keyof typeof MOTION_TOKENS.stagger = 'list',
): React.CSSProperties {
  return { animationDelay: getStaggerDelay(index, type) };
}

[C] index.ts — 기존 semantic.ts export 블록에 아래 추가:

  SECTION_RHYTHM_TOKENS,
  getSectionRhythm,
  CALLOUT_TOKENS,
  getCalloutClasses,
  type CalloutVariant,
  type CalloutEmphasis,
  type CalloutSize,
  type SectionRhythm,

[C] index.ts — 기존 motion.ts export 블록에 아래 추가:

  getStaggerFadeInStyle,

SSOT 주의:
- semantic.ts에서 brand.ts helpers를 직접 import (circular 아님 — brand.ts는 primitives만 import)
- CALLOUT_TOKENS.emphasis의 함수형 값은 토큰이지만 함수 — as const 타입이 함수를 포함하므로 정상
- dark: prefix 절대 금지 — CSS 변수(:root + .dark 양쪽 정의)가 처리
- transition-all 금지 — CALLOUT_TOKENS에 animation 없음, 사용처에서 TRANSITION_PRESETS 경유

커밋 메시지:
feat(design-tokens): add SECTION_RHYTHM, CALLOUT_TOKENS, staggerFadeInItem

- Add SECTION_RHYTHM_TOKENS (tight/comfortable/spacious/dramatic) + getSectionRhythm()
- Add CALLOUT_TOKENS (5 variants × 3 emphasis × 3 sizes) + getCalloutClasses()
  co-located with EMPTY_STATE_TOKENS; emphasis.leftBorder uses brand.ts helpers
- Expose ANIMATION_PRESETS.staggerFadeInItem (globals.css --animate-stagger-fade-in SSOT)
  with motion-reduce:opacity-100 guard
- Add getStaggerFadeInStyle(index, type) composing getStaggerDelay

All additions are non-breaking; existing exports untouched.

검증:
- pnpm --filter frontend tsc --noEmit → 0 errors
- pnpm --filter frontend lint → 0 warnings
- grep 'SECTION_RHYTHM_TOKENS\|CALLOUT_TOKENS\|staggerFadeInItem\|getStaggerFadeInStyle' apps/frontend/lib/design-tokens/index.ts → 4 hits (export 확인)
- 기존 사용처 영향 0개 확인 (순수 추가이므로 기존 import 불변)
- 번들 증가 < 1.5KB gzip

롤백: git revert <nc-p1-sha> (순수 추가 — revert 완전 안전, 기존 사용처 영향 없음)
```

---

### 🟠 HIGH — NC-P2: Layer 3 NC 토큰 + i18n — NC_WORKFLOW_GUIDANCE_TOKENS + detail spacing + 섹션 정리 (Mode 0)

```
전제: NC-P1 커밋 완료 후 진행.

문제:
1. non-conformance.ts 섹션 20 비어 있음 → NC_WORKFLOW_GUIDANCE_TOKENS(상태×역할 11-entry 매트릭스) 미존재
2. NC_SPACING_TOKENS(line 718)에 afterHeader만 있고 detail.* 없음 → NCDetailClient.tsx가 space-y-5 하드코딩
3. 섹션 17 중복: NC_MOTION(line 724) + NC_FOCUS(line 741) 둘 다 // 17. 번호 사용
4. NC_INFO_NOTICE_TOKENS(line 767) @deprecated 마킹 안 됨
5. detail.guidance i18n 키(11 시나리오) 미존재
6. detail.correction에 emptyTitle, addAction 키 미존재
7. detail.actionBar.hintNeedsContent 키 미존재

수정 파일 (3개):
A. apps/frontend/lib/design-tokens/components/non-conformance.ts
B. apps/frontend/messages/ko/non-conformances.json
C. apps/frontend/messages/en/non-conformances.json

작업:

[A] non-conformance.ts — 섹션 17 중복 정리 (주석만 수정, 코드 불변):
  line 740 주석을 아래로 변경:
  // 17b. NC_FOCUS — 포커스 재export
  /** @deprecated FOCUS_TOKENS.classes.default를 직접 import 권장 */

[A] non-conformance.ts — NC_INFO_NOTICE_TOKENS(line 767) 위 주석에 @deprecated 추가:
  /** @deprecated Phase 4 이후 getCalloutClasses('info', 'leftBorder')로 교체 권장 */

[A] non-conformance.ts — NC_SPACING_TOKENS(line 718~721) 교체:
  import { getSectionRhythm } from '../semantic';  // 파일 상단 import에 추가

  export const NC_SPACING_TOKENS = {
    afterHeader: 'mt-6',  // 기존 유지
    detail: {
      /** 페이지 최상위 wrapper — 그룹 경계는 mt-* 처리하므로 space-y-0 */
      pageWrapper: 'space-y-0',
      /** 그룹 1 (상태 파악): Header + RejectionAlert + Timeline + GuidanceCallout */
      statusGroup: getSectionRhythm('tight'),
      /** 그룹 1 → 2 경계 */
      statusToContextGap: 'mt-8',
      /** 그룹 2 (컨텍스트): InfoCards + Collapsibles + Docs */
      contextGroup: getSectionRhythm('comfortable'),
      /** 그룹 2 → 3 경계 (액션 직전) */
      contextToActionGap: 'mt-6',
      /** GuidanceCallout이 Timeline과 긴밀 */
      calloutAfterTimeline: 'mt-3',
    },
  } as const;

[A] non-conformance.ts — 섹션 19(NC_INFO_NOTICE_TOKENS) 직후 섹션 20 추가:
  import { type CalloutVariant, type CalloutEmphasis } from '../semantic'; // 파일 상단에 추가

  // ============================================================================
  // 20. NC_WORKFLOW_GUIDANCE_TOKENS — 상태×역할 다음 단계 가이던스 매트릭스
  // ============================================================================

  export type NCGuidanceStatusKey =
    | 'open'
    | 'openRejected'
    | 'openBlockedRepair'
    | 'openBlockedRecalibration'
    | 'corrected'
    | 'closed';

  export type NCGuidanceRole = 'operator' | 'manager' | 'all';

  export type NCGuidanceKey = `${NCGuidanceStatusKey}_${NCGuidanceRole}`;

  export interface NCGuidanceEntry {
    variant: CalloutVariant;
    emphasis: CalloutEmphasis;
    icon: 'AlertTriangle' | 'Wrench' | 'Clock' | 'CheckCircle2' | 'Lock' | 'ShieldCheck';
    stepBadgeKey: 'one' | 'two' | 'three';
    ctaKind: 'primary' | 'link' | 'none';
    scrollTarget?: 'actionBar' | 'infoRepairCard';
  }

  export const NC_WORKFLOW_GUIDANCE_TOKENS: Record<NCGuidanceKey, NCGuidanceEntry> = {
    open_operator:                     { variant: 'warning',  emphasis: 'leftBorder', icon: 'AlertTriangle', stepBadgeKey: 'one',   ctaKind: 'primary', scrollTarget: 'actionBar' },
    open_manager:                      { variant: 'info',     emphasis: 'leftBorder', icon: 'Clock',         stepBadgeKey: 'one',   ctaKind: 'none' },
    openRejected_operator:             { variant: 'warning',  emphasis: 'leftBorder', icon: 'AlertTriangle', stepBadgeKey: 'one',   ctaKind: 'primary', scrollTarget: 'actionBar' },
    openRejected_manager:              { variant: 'info',     emphasis: 'leftBorder', icon: 'Clock',         stepBadgeKey: 'one',   ctaKind: 'none' },
    openBlockedRepair_operator:        { variant: 'critical', emphasis: 'leftBorder', icon: 'Wrench',        stepBadgeKey: 'one',   ctaKind: 'link',    scrollTarget: 'infoRepairCard' },
    openBlockedRepair_manager:         { variant: 'critical', emphasis: 'leftBorder', icon: 'Wrench',        stepBadgeKey: 'one',   ctaKind: 'none' },
    openBlockedRecalibration_operator: { variant: 'critical', emphasis: 'leftBorder', icon: 'Wrench',        stepBadgeKey: 'one',   ctaKind: 'link' },
    openBlockedRecalibration_manager:  { variant: 'critical', emphasis: 'leftBorder', icon: 'Wrench',        stepBadgeKey: 'one',   ctaKind: 'none' },
    corrected_operator:                { variant: 'info',     emphasis: 'leftBorder', icon: 'Clock',         stepBadgeKey: 'two',   ctaKind: 'none' },
    corrected_manager:                 { variant: 'warning',  emphasis: 'leftBorder', icon: 'ShieldCheck',   stepBadgeKey: 'two',   ctaKind: 'primary', scrollTarget: 'actionBar' },
    closed_all:                        { variant: 'ok',       emphasis: 'leftBorder', icon: 'Lock',          stepBadgeKey: 'three', ctaKind: 'none' },
  } as const;

  import { NonConformanceStatus } from '@equipment-management/schemas'; // 이미 있으면 건너뜀

  export function resolveNCGuidanceKey(args: {
    status: NonConformanceStatus;
    canCloseNC: boolean;
    needsRepair: boolean;
    needsRecalibration: boolean;
    hasRejection: boolean;
  }): NCGuidanceKey {
    const { status, canCloseNC, needsRepair, needsRecalibration, hasRejection } = args;
    const role: NCGuidanceRole = canCloseNC ? 'manager' : 'operator';
    if (status === 'closed') return 'closed_all';
    if (status === 'corrected') return `corrected_${role}`;
    if (needsRepair) return `openBlockedRepair_${role}`;
    if (needsRecalibration) return `openBlockedRecalibration_${role}`;
    if (hasRejection) return `openRejected_${role}`;
    return `open_${role}`;
  }

  export const NC_GUIDANCE_STEP_BADGE_TOKENS = {
    base: [
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
      `${MICRO_TYPO.badge} font-semibold tabular-nums`,
    ].join(' '),
    variant: {
      info:     'bg-brand-info/10 text-brand-info',
      warning:  'bg-brand-warning/10 text-brand-warning',
      critical: 'bg-brand-critical/10 text-brand-critical',
      ok:       'bg-brand-ok/10 text-brand-ok',
      neutral:  'bg-muted text-muted-foreground',
    } satisfies Record<CalloutVariant, string>,
  } as const;

[A] non-conformance.ts — index.ts export 추가 필요 항목 (파일 수정 후 index.ts에도 반영):
  NC_WORKFLOW_GUIDANCE_TOKENS, resolveNCGuidanceKey,
  type NCGuidanceStatusKey, type NCGuidanceRole, type NCGuidanceKey, type NCGuidanceEntry,
  NC_GUIDANCE_STEP_BADGE_TOKENS, NC_SPACING_TOKENS (detail 속성 포함으로 기존 export 유지)

[B] apps/frontend/messages/ko/non-conformances.json
  "detail" 객체(line 136) 내부, "dialog" 섹션 직전에 "guidance" 추가:

  "guidance": {
    "stepBadge": {
      "one": "STEP 1 / 3",
      "two": "STEP 2 / 3",
      "three": "STEP 3 / 3"
    },
    "scrollToAction": "하단으로 이동",
    "open_operator": {
      "title": "시정 조치 내용을 입력하세요",
      "body": "원인을 해결한 방법을 아래 조치 섹션에 기록한 뒤, 하단 '조치 완료' 버튼을 눌러 기술책임자에게 검토를 요청하세요.",
      "ctaHint": "아래 조치 섹션 → 조치 완료 버튼"
    },
    "open_manager": {
      "title": "시험실무자의 조치를 기다리는 중",
      "body": "시험실무자가 조치 내용을 입력하기 전까지 종결 승인은 불가합니다. 필요 시 '수정'으로 원인과 조치 계획을 보완할 수 있습니다."
    },
    "openRejected_operator": {
      "title": "반려 사유를 확인하고 재조치하세요",
      "body": "기술책임자가 반려한 사유를 위 배너에서 확인한 뒤, 조치 내용을 보완하고 '조치 완료'를 다시 눌러주세요.",
      "ctaHint": "하단 조치 완료 버튼"
    },
    "openRejected_manager": {
      "title": "재조치 접수 대기",
      "body": "반려 사유가 시험실무자에게 전달되었습니다. 재조치가 완료되면 상단 상태가 '조치 완료'로 자동 전환됩니다."
    },
    "openBlockedRepair_operator": {
      "title": "수리 이력을 먼저 등록하세요",
      "body": "손상 유형 부적합은 수리 이력 등록이 선행되어야 합니다. 아래 '수리 이력 등록'을 완료해야 조치 완료가 가능합니다.",
      "ctaHint": "수리 카드 → 수리 이력 등록"
    },
    "openBlockedRepair_manager": {
      "title": "수리 이력 선행 확인",
      "body": "조치 완료와 종결 승인은 수리 이력 등록 이후 가능합니다. 필요 시 시험실무자에게 수리 등록을 안내해주세요."
    },
    "openBlockedRecalibration_operator": {
      "title": "재교정 후 조치하세요",
      "body": "교정 기한 초과 부적합은 재교정 완료가 선행되어야 합니다. 장비의 교정 기록 페이지에서 최신 교정을 등록한 뒤 조치 내용을 입력할 수 있습니다.",
      "ctaHint": "교정 기록 확인 →"
    },
    "openBlockedRecalibration_manager": {
      "title": "재교정 선행 확인",
      "body": "조치 완료와 종결 승인은 재교정 기록 등록 이후 가능합니다."
    },
    "corrected_operator": {
      "title": "기술책임자의 종결 승인 대기",
      "body": "조치 내용이 접수되었습니다. 기술책임자의 종결 승인을 기다리고 있습니다. 반려되면 상단 배너에 사유가 표시됩니다."
    },
    "corrected_manager": {
      "title": "종결 여부를 결정하세요",
      "body": "조치 내용을 검토한 뒤 하단 '종결 승인' 또는 '조치 반려'를 선택해주세요. 반려 시 사유 입력이 필수입니다.",
      "ctaHint": "하단 종결 승인 / 조치 반려"
    },
    "closed_all": {
      "title": "부적합 처리가 완료되었습니다",
      "body": "이 부적합은 종결되었습니다. 편집과 상태 변경은 감사 추적 보호를 위해 잠깁니다."
    }
  }

  "correction" 섹션(현재 empty 키만 있음)에 추가:
  "emptyTitle": "시정 조치 내용 없음",
  "addAction": "조치 내용 작성"

  "actionBar" 섹션이 있으면 거기에, 없으면 detail 하위에 신규 추가:
  "actionBar": {
    "hintNeedsContent": "조치 내용을 먼저 입력해주세요"
  }

[C] apps/frontend/messages/en/non-conformances.json — [B]와 동일 구조로 영문 추가:

  "guidance": {
    "stepBadge": { "one": "STEP 1 / 3", "two": "STEP 2 / 3", "three": "STEP 3 / 3" },
    "scrollToAction": "Scroll to action",
    "open_operator": {
      "title": "Enter your corrective action",
      "body": "Record how you resolved the root cause in the correction section below, then click 'Mark as Corrected' to request review from the technical manager.",
      "ctaHint": "Correction section → Mark as Corrected"
    },
    "open_manager": {
      "title": "Waiting for operator's corrective action",
      "body": "Closure approval is not available until the operator enters the correction details. You can edit the cause and action plan via 'Edit' if needed."
    },
    "openRejected_operator": {
      "title": "Review the rejection reason and resubmit",
      "body": "Check the rejection reason in the banner above, update the correction details, then click 'Mark as Corrected' again.",
      "ctaHint": "Mark as Corrected button below"
    },
    "openRejected_manager": {
      "title": "Waiting for resubmission",
      "body": "The rejection reason has been sent to the operator. The status will automatically change to 'Corrected' once resubmitted."
    },
    "openBlockedRepair_operator": {
      "title": "Register repair history first",
      "body": "Damage-type non-conformances require repair history registration before correction. Complete 'Register Repair History' below to enable correction.",
      "ctaHint": "Repair card → Register Repair History"
    },
    "openBlockedRepair_manager": {
      "title": "Repair history required first",
      "body": "Correction and closure approval are available only after repair history is registered. Ask the operator to register repair if needed."
    },
    "openBlockedRecalibration_operator": {
      "title": "Complete recalibration first",
      "body": "Calibration-overdue non-conformances require a new calibration before correction. Register the latest calibration on the equipment's calibration page, then enter the correction.",
      "ctaHint": "Check calibration records →"
    },
    "openBlockedRecalibration_manager": {
      "title": "Recalibration required first",
      "body": "Correction and closure approval are available only after a new calibration record is registered."
    },
    "corrected_operator": {
      "title": "Waiting for technical manager's closure approval",
      "body": "Your correction has been submitted. Waiting for the technical manager's closure approval. If rejected, the reason will appear in the banner above."
    },
    "corrected_manager": {
      "title": "Decide on closure",
      "body": "Review the correction details, then choose 'Approve Closure' or 'Reject Correction' below. A reason is required for rejection.",
      "ctaHint": "Approve Closure / Reject Correction below"
    },
    "closed_all": {
      "title": "Non-conformance processing complete",
      "body": "This non-conformance has been closed. Editing and status changes are locked to protect the audit trail."
    }
  },

  correction 섹션:
  "emptyTitle": "No corrective action recorded",
  "addAction": "Write correction"

  actionBar 섹션:
  "actionBar": {
    "hintNeedsContent": "Please enter corrective action content first"
  }

SSOT 주의:
- NonConformanceStatus는 @equipment-management/schemas에서 import (로컬 재정의 금지)
- MICRO_TYPO는 같은 파일 내 import 없이 직접 참조 가능 (동일 파일에 정의)
- NC_SPACING_TOKENS.detail.statusGroup = getSectionRhythm('tight') — Phase 1 의존
- ko/en JSON: 동일 키 구조, key 수 일치 검증 필수

커밋 메시지:
feat(nc-tokens): add NC_WORKFLOW_GUIDANCE_TOKENS + detail spacing + i18n

- Add section 20: NC_WORKFLOW_GUIDANCE_TOKENS (11 state×role entries)
  with resolveNCGuidanceKey() pure resolver + NC_GUIDANCE_STEP_BADGE_TOKENS
- Extend NC_SPACING_TOKENS.detail (pageWrapper/statusGroup/statusToContextGap/
  contextGroup/contextToActionGap/calloutAfterTimeline) via getSectionRhythm()
- Clean up duplicate section 17 (17 → 17b for NC_FOCUS) + @deprecated on NC_FOCUS
- Mark NC_INFO_NOTICE_TOKENS as @deprecated (replacement: getCalloutClasses)
- Add detail.guidance.* i18n keys (ko/en) — 11 scenarios × 3 fields
- Add detail.correction.emptyTitle + addAction + detail.actionBar.hintNeedsContent

Tokens + i18n only — NCDetailClient.tsx unchanged; NC-P4 will consume.

검증:
- pnpm --filter frontend tsc --noEmit → 0 errors
- pnpm --filter frontend lint → 0 warnings
- jq 'paths(scalars) | join(".")' messages/ko/non-conformances.json | sort > /tmp/nc-ko.txt
  jq 'paths(scalars) | join(".")' messages/en/non-conformances.json | sort > /tmp/nc-en.txt
  diff /tmp/nc-ko.txt /tmp/nc-en.txt → 0 diff
- NC_WORKFLOW_GUIDANCE_TOKENS 11개 key 모두 guidance i18n에 존재 확인
  (open_operator / open_manager / openRejected_operator / openRejected_manager /
   openBlockedRepair_operator / openBlockedRepair_manager /
   openBlockedRecalibration_operator / openBlockedRecalibration_manager /
   corrected_operator / corrected_manager / closed_all)
- grep 'getSectionRhythm' apps/frontend/lib/design-tokens/components/non-conformance.ts → hit 확인

롤백: git revert <nc-p2-sha> (비파괴 추가 — revert 안전, NC-P1 semantic 토큰은 보존됨)
```

---

### 🟡 MEDIUM — NC-P3: URGENT_BADGE_TOKENS Semantic 승격 + NC_URGENT_BADGE_TOKENS @deprecated re-export (Mode 0)

```
전제: NC-P1 커밋 완료 후 진행. NC-P2와 병렬 가능.

문제:
NC_URGENT_BADGE_TOKENS (non-conformance.ts:781) + checkout D+ 배지 + dashboard overdue 배지가
동일 bg-brand-critical text-white 패턴을 각자 구현. Semantic 레이어에 URGENT_BADGE_TOKENS 없음.

수정 파일 (3개):
A. apps/frontend/lib/design-tokens/semantic.ts
B. apps/frontend/lib/design-tokens/components/non-conformance.ts
C. apps/frontend/lib/design-tokens/index.ts

작업:

[A] semantic.ts — 파일 하단(EMPTY_STATE_TOKENS 타입 export 직후)에 추가:

  export const URGENT_BADGE_TOKENS = {
    solid: [
      `inline-flex items-center px-2 py-0.5 rounded ${MICRO_TYPO.badge} font-semibold`,
      'bg-brand-critical text-white',
    ].join(' '),
    outlined: [
      `inline-flex items-center px-2 py-0.5 rounded ${MICRO_TYPO.badge} font-semibold`,
      'border border-brand-critical text-brand-critical',
    ].join(' '),
  } as const;

  // MICRO_TYPO는 동일 파일(semantic.ts) line 326에 이미 정의됨 — import 불필요

[B] non-conformance.ts — NC_URGENT_BADGE_TOKENS(line 781) 교체 (backward compat 유지):
  import { URGENT_BADGE_TOKENS } from '../semantic'; // 파일 상단에 추가

  /** @deprecated Phase 4부터 URGENT_BADGE_TOKENS.solid 직접 사용 권장 */
  export const NC_URGENT_BADGE_TOKENS = {
    badge: URGENT_BADGE_TOKENS.solid,
  } as const;

[C] index.ts — semantic.ts export 블록에 URGENT_BADGE_TOKENS 추가:

  URGENT_BADGE_TOKENS,

SSOT 주의:
- NC_URGENT_BADGE_TOKENS는 삭제하지 않고 re-export (@deprecated) — NCDetailClient.tsx:311이 현재 사용 중
- Checkout/Dashboard 마이그레이션은 후속 세션 (Phase 5 스코프)
- outlined 변형은 향후 사용 대비 — 현재 사용처 없음, 추가 비용 없음

커밋 메시지:
feat(design-tokens): promote URGENT_BADGE_TOKENS to semantic layer

Keep NC_URGENT_BADGE_TOKENS as @deprecated re-export for compat.
Checkout/dashboard migration deferred to separate session.

검증:
- pnpm --filter frontend tsc --noEmit → 0 errors
- pnpm --filter frontend lint → 0 warnings
- grep 'URGENT_BADGE_TOKENS' apps/frontend/lib/design-tokens/index.ts → 1 hit (URGENT_BADGE_TOKENS export)
- NCDetailClient.tsx에서 기존 NC_URGENT_BADGE_TOKENS.badge 참조가 여전히 동작함 확인
  (re-export이므로 런타임 동작 불변)

롤백: git revert <nc-p3-sha> (비파괴 추가 — revert 안전, NC-P1·P2 토큰 보존됨)
```

---

### 🔴 CRITICAL — NC-P4: NCDetailClient.tsx 리팩토링 + GuidanceCallout 컴포넌트 + EmptyState 전환 + E2E (Mode 1)

```
전제: NC-P1, NC-P2, NC-P3 커밋 모두 완료 후 진행.

문제:
1. NCDetailClient.tsx (현재 981 lines) — 4개 안내 UI 산재:
   - 반려 알림 배너 (NC_REJECTION_ALERT_TOKENS) — critical 사유
   - 전제조건 안내 블록 (NC_INFO_NOTICE_TOKENS, grep: 'typeNotice\|repairNeeded\|recalibrationNeeded') — blockers
   - ActionBar roleHint (NC_ACTION_BAR_TOKENS.roleHint) — 평문 힌트
   - ActionBar waitingGuidance (NC_ACTION_BAR_TOKENS.waitingGuidance) — Clock + 텍스트
   → 11 상태×역할 시나리오마다 사용자가 4곳 스캔 필요

2. 조치 섹션 빈 상태에 CTA 없음 (EmptyState 미사용)
3. 페이지 최상위 div에 NC_SPACING_TOKENS.detail 미적용 (raw space-y-5)
4. needsRepair/needsRecalibration 파생 로직이 컴포넌트 내부에 인라인

신규 생성 파일 (3개):
- apps/frontend/lib/non-conformances/guidance.ts
- apps/frontend/components/non-conformances/GuidanceCallout.tsx
- apps/frontend/tests/e2e/non-conformances/nc-guidance.spec.ts

수정 파일 (1개):
- apps/frontend/components/non-conformances/NCDetailClient.tsx

⚠ 라인 번호 주의: NCDetailClient.tsx는 현재 981 라인 (플랜 작성 시 596줄에서 증가).
  아래의 라인 번호는 참고용 — 실제 위치는 grep 패턴으로 확인 후 수정할 것:
  - 페이지 wrapper: grep '<div className="space-y-5"'
  - 전제조건 블록 시작: grep 'NC_INFO_NOTICE_TOKENS\|prerequisite'
  - correction emptyState: grep 'NC_COLLAPSIBLE_TOKENS.emptyState\|correction.*empty'
  - ActionBar roleHint: grep 'roleHint\|waitingGuidance'

작업:

[신규 A] apps/frontend/lib/non-conformances/guidance.ts — pure helper (단위 테스트 대상):

'use server' 미사용 — 순수 함수.

import type { NonConformance } from '@/lib/api/non-conformances-api';
import { getNCPrerequisite, NonConformanceStatusValues as NCVal } from '@equipment-management/schemas';
import { resolveNCGuidanceKey, type NCGuidanceKey } from '@/lib/design-tokens';

export function deriveGuidance(nc: NonConformance, canCloseNC: boolean): {
  key: NCGuidanceKey;
  needsRepair: boolean;
  needsRecalibration: boolean;
} {
  const prerequisite = getNCPrerequisite(nc.ncType);
  const needsRepair = prerequisite === 'repair' && !nc.repairHistoryId;
  const needsRecalibration = prerequisite === 'recalibration' && !nc.calibrationId;
  const key = resolveNCGuidanceKey({
    status: nc.status,
    canCloseNC,
    needsRepair,
    needsRecalibration,
    hasRejection: nc.status === NCVal.OPEN && !!nc.rejectionReason,
  });
  return { key, needsRepair, needsRecalibration };
}

  주의: getNCPrerequisite가 @equipment-management/schemas에 없을 경우 로컬에서 nc.ncType으로
  직접 'damage' | 'calibration_overdue' → 'repair' | 'recalibration' 매핑 추가.
  NCVal.OPEN은 'open' 문자열 — schemas 확인 후 일치 여부 검증.

[신규 B] apps/frontend/components/non-conformances/GuidanceCallout.tsx — React.memo + aria-live:

'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Wrench, Clock, CheckCircle2, Lock, ShieldCheck, ArrowDown } from 'lucide-react';
import {
  NC_WORKFLOW_GUIDANCE_TOKENS,
  NC_GUIDANCE_STEP_BADGE_TOKENS,
  CALLOUT_TOKENS,
  getCalloutClasses,
  FOCUS_TOKENS,
  type NCGuidanceKey,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  AlertTriangle, Wrench, Clock, CheckCircle2, Lock, ShieldCheck,
} as const;

interface GuidanceCalloutProps {
  guidanceKey: NCGuidanceKey;
  onScrollToAction?: () => void;
  onRepairRegister?: () => void;
}

export const GuidanceCallout = memo(function GuidanceCallout({
  guidanceKey,
  onScrollToAction,
  onRepairRegister,
}: GuidanceCalloutProps) {
  const t = useTranslations('non-conformances');
  const entry = NC_WORKFLOW_GUIDANCE_TOKENS[guidanceKey];
  const Icon = ICON_MAP[entry.icon];

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-labelledby={`nc-guidance-title-${guidanceKey}`}
      data-testid="nc-guidance-callout"
      data-guidance-key={guidanceKey}
      className={getCalloutClasses(entry.variant, entry.emphasis, 'default')}
    >
      <Icon
        className={cn(
          CALLOUT_TOKENS.icon.wrap,
          CALLOUT_TOKENS.icon.size,
          CALLOUT_TOKENS.icon.color(entry.variant),
        )}
        aria-hidden="true"
      />
      <div className={CALLOUT_TOKENS.body}>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              NC_GUIDANCE_STEP_BADGE_TOKENS.base,
              NC_GUIDANCE_STEP_BADGE_TOKENS.variant[entry.variant],
            )}
          >
            {t(`detail.guidance.stepBadge.${entry.stepBadgeKey}` as Parameters<typeof t>[0])}
          </span>
          <h2
            id={`nc-guidance-title-${guidanceKey}`}
            className={CALLOUT_TOKENS.title(entry.variant)}
          >
            {t(`detail.guidance.${guidanceKey}.title` as Parameters<typeof t>[0])}
          </h2>
        </div>
        <p className={CALLOUT_TOKENS.description}>
          {t(`detail.guidance.${guidanceKey}.body` as Parameters<typeof t>[0])}
        </p>
        {entry.ctaKind === 'primary' &&
          entry.scrollTarget === 'actionBar' &&
          onScrollToAction && (
            <div className={CALLOUT_TOKENS.action}>
              <button
                type="button"
                onClick={onScrollToAction}
                aria-label={t('detail.guidance.scrollToAction')}
                className={cn(
                  'text-sm text-brand-info hover:underline inline-flex items-center gap-1',
                  FOCUS_TOKENS.classes.default,
                )}
              >
                {t(`detail.guidance.${guidanceKey}.ctaHint` as Parameters<typeof t>[0])}
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        {entry.ctaKind === 'link' &&
          onRepairRegister &&
          guidanceKey.startsWith('openBlockedRepair') && (
            <div className={CALLOUT_TOKENS.action}>
              <button
                type="button"
                onClick={onRepairRegister}
                className={cn(
                  'text-sm text-brand-info hover:underline inline-flex items-center gap-1',
                  FOCUS_TOKENS.classes.default,
                )}
              >
                <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                {t('detail.prerequisite.repairLink')}
              </button>
            </div>
          )}
      </div>
    </aside>
  );
});

[수정] NCDetailClient.tsx — 변경 사항:

1. import 추가:
   import { GuidanceCallout } from './GuidanceCallout';
   import { deriveGuidance } from '@/lib/non-conformances/guidance';
   import {
     NC_SPACING_TOKENS, URGENT_BADGE_TOKENS,
     ANIMATION_PRESETS, getStaggerFadeInStyle,
   } from '@/lib/design-tokens';
   import { FileText } from 'lucide-react';
   import { EmptyState } from '@/components/shared/EmptyState';

2. elapsedDays 계산 useMemo로 감싸기:
   grep 'const elapsedDays = differenceInDays' → 해당 라인 찾아 useMemo 적용.
   const elapsedDays = useMemo(() => differenceInDays(...), [nc.discoveredAt]);

3. needsRepair/needsRecalibration 대체 + hasUnmetPrerequisite useMemo 추가:
   기존 인라인 계산 → deriveGuidance 호출로 교체:
   const { key: guidanceKey, needsRepair, needsRecalibration } = useMemo(
     () => deriveGuidance(nc, canCloseNC),
     [nc, canCloseNC]
   );
   const hasUnmetPrerequisite = useMemo(
     () => needsRepair || needsRecalibration,
     [needsRepair, needsRecalibration]
   );
   (기존 인라인 hasUnmetPrerequisite 계산 완전 제거 — useMemo로 교체됨)

4. 페이지 wrapper div — raw space-y-5 교체:
   grep '<div className="space-y-5"' 찾아 교체:
   <div className={NC_SPACING_TOKENS.detail.pageWrapper}>

5. 헤더+반려알림+Timeline을 statusGroup으로 묶기:
   헤더 시작 ~ Timeline 끝까지를 아래로 감싸기:
   <section className={NC_SPACING_TOKENS.detail.statusGroup}>
     {/* 기존 헤더 영역 */}
     {/* RejectionAlert */}
     {/* WorkflowTimeline */}
   </section>

6. Timeline 바로 뒤(section 닫기 직전)에 GuidanceCallout 삽입:
   <div className={NC_SPACING_TOKENS.detail.calloutAfterTimeline}>
     <GuidanceCallout
       guidanceKey={guidanceKey}
       onScrollToAction={scrollToActionBar}
       onRepairRegister={() => setShowRepairDialog(true)}
     />
   </div>

7. 전제조건 안내 블록 (NC_INFO_NOTICE_TOKENS 사용 블록) 완전 제거:
   ⚠ 삭제 전 기존 E2E 의존 여부 필수 확인:
   grep -rn "detail.prerequisite.typeNotice\|prerequisite.*notice\|typeNotice" apps/frontend/tests/
   hit 존재 시 → 해당 테스트의 selector를 GuidanceCallout data-guidance-key 기반으로 업데이트 후 삭제.
   hit 없으면 → 즉시 삭제 진행.

   grep 'NC_INFO_NOTICE_TOKENS\|typeNotice\|repairNeeded.*notice\|recalibrationNeeded.*notice'
   NCDetailClient.tsx 내 해당 조건부 렌더링 블록 전체 삭제 (GuidanceCallout이 담당).
   단, '수리 이력 등록' 링크는 GuidanceCallout의 ctaKind='link' onRepairRegister로 흡수됨.

8. 정보 카드 섹션 그룹화:
   정보 카드들 시작 div를:
   <section className={cn(NC_SPACING_TOKENS.detail.contextGroup, NC_SPACING_TOKENS.detail.statusToContextGap)}>

9. InfoCards에 stagger fade-in 적용 (context group만 — status group은 미적용):
   각 카드 div에:
   className={cn(기존클래스, ANIMATION_PRESETS.staggerFadeInItem)}
   style={getStaggerFadeInStyle(index, 'section')}  // index: 0, 1, 2, 3 순서

10. correction emptyState JSX → shared EmptyState 교체:
    grep 'NC_COLLAPSIBLE_TOKENS.emptyState\|correction.*empty\|emptyState' 찾아 교체:
    <EmptyState
      variant="no-data"
      icon={FileText}
      title={t('detail.correction.emptyTitle')}
      description={t('detail.correction.empty')}
      primaryAction={
        !hasUnmetPrerequisite && nc.status === 'open'
          ? { label: t('detail.correction.addAction'), onClick: startEditCorrection }
          : undefined
      }
      canAct={canEditNC}
    />
    주의: nc.status === 'open'은 NCVal.OPEN으로 교체 (schemas import 확인).

11. closure emptyState → shared EmptyState 교체 (canAct={false}, primaryAction 없음):
    <EmptyState
      variant="no-data"
      icon={FileText}
      title={t('detail.closure.empty')}
      description=""
      canAct={false}
    />

12. DocumentsSection 후 gap spacer 추가:
    DocumentsSection 직후, ActionBar wrapper 직전에:
    <div className={NC_SPACING_TOKENS.detail.contextToActionGap} />

13. ActionBar wrapper에 ref 추가:
    const actionBarRef = useRef<HTMLDivElement>(null);
    기존 sticky ActionBar wrapper div에: ref={actionBarRef}

14. scrollToActionBar 구현 추가:
    const actionBarRef = useRef<HTMLDivElement>(null);
    const scrollToActionBar = useCallback(() => {
      actionBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const primaryButton = actionBarRef.current?.querySelector<HTMLButtonElement>(
          'button:not([disabled])'
        );
        primaryButton?.focus();
      }, 400);
    }, []);

14b. 상태 전환 후 GuidanceCallout title 포커스 복귀 useEffect:
    useEffect(() => {
      const titleEl = document.getElementById(`nc-guidance-title-${guidanceKey}`);
      titleEl?.focus();
    }, [nc.status, guidanceKey]);
    (nc.status 변경 시 Callout 제목으로 포커스 이동 → 스크린리더 자동 재공지)
    주의: <h2>는 기본 비포커스 — GuidanceCallout h2에 tabIndex={-1} 필수 추가:
      <h2 id={`nc-guidance-title-${guidanceKey}`} tabIndex={-1} className={...}>

15. NC_URGENT_BADGE_TOKENS.badge → URGENT_BADGE_TOKENS.solid 교체:
    grep 'NC_URGENT_BADGE_TOKENS.badge' → URGENT_BADGE_TOKENS.solid 로 교체.

16. ActionBar 내부 roleHint / waitingGuidance / Clock 렌더링 제거:
    ActionBar 함수(grep 'function ActionBar\|const ActionBar') 내부에서
    roleHint / waitingGuidance 관련 JSX 완전 삭제 (GuidanceCallout이 담당).
    버튼과 title prop(disabled 이유)은 유지.

17. markCorrected 버튼 disabled 조건 확장:
    기존: disabled={isUpdating || hasUnmetPrerequisite}
    변경: disabled={isUpdating || hasUnmetPrerequisite || !nc.correctionContent?.trim()}
    title 추가:
    title={
      hasUnmetPrerequisite ? prerequisiteMessage :
      !nc.correctionContent?.trim() ? t('detail.actionBar.hintNeedsContent') :
      undefined
    }

[신규 C] apps/frontend/tests/e2e/non-conformances/nc-guidance.spec.ts:
  기존 e2e 패턴(tests/e2e/ 디렉토리, loginAs/storageState 헬퍼) 참조.
  seed 데이터 ID 확인 후 사용 (새 데이터 생성 금지).

  test.describe('NC 상세 — 다음 단계 가이던스', () => {
    test('1. Operator + OPEN + blockedRepair → Callout + disabled CTA', ...)
    test('2. Operator + OPEN + empty correction → EmptyState CTA', ...)
    test('3. Operator OPEN → CORRECTED 가이던스 전환', ...)
    test('4. Manager CORRECTED → 반려 → openRejected', ...)
    test('5. CLOSED → 모든 편집 UI 잠금', ...)
  })

  각 테스트 패턴:
  시나리오 1:
    await loginAs(page, 'operator');
    await page.goto('/non-conformances/{damage-type-nc-id}');  // seed에서 damage 유형 NC id 확인
    const callout = page.getByTestId('nc-guidance-callout');
    await expect(callout).toHaveAttribute('data-guidance-key', 'openBlockedRepair_operator');
    await expect(callout).toContainText('수리 이력을 먼저 등록하세요');
    await expect(page.getByRole('button', { name: /조치 완료/ })).toBeDisabled();

  시나리오 2:
    await loginAs(page, 'operator');
    await page.goto('/non-conformances/{open-nc-with-no-correction-id}');
    const cta = page.getByRole('button', { name: '조치 내용 작성' });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page.getByPlaceholder(/시정 조치 내용을 입력/)).toBeFocused();

  시나리오 3 — OPEN → CORRECTED 가이던스 전환:
    await loginAs(page, 'operator');
    await page.goto('/non-conformances/{open-ready-nc-id}');  // 조치 미기입 + 수리 불필요 seed
    await expect(page.getByTestId('nc-guidance-callout')).toHaveAttribute('data-guidance-key', 'open_operator');
    // 조치 내용 편집 진입 (편집 버튼 위치 grep '수정\|편집' 확인 후 selector 조정)
    await page.getByRole('button', { name: /수정|편집/ }).first().click();
    const correctionTextarea = page.getByPlaceholder(/시정 조치 내용을 입력/);
    await correctionTextarea.fill('부품 교체 완료 — 측정 정밀도 기준치 이내 재확인됨');
    await page.getByRole('button', { name: '저장' }).click();
    await page.waitForResponse(res => res.url().includes('/non-conformances/') && res.status() === 200);
    // 조치 완료 버튼 활성화 확인 후 클릭
    await expect(page.getByRole('button', { name: '조치 완료' })).toBeEnabled();
    await page.getByRole('button', { name: '조치 완료' }).click();
    // guidance key 전환 확인
    await expect(page.getByTestId('nc-guidance-callout')).toHaveAttribute(
      'data-guidance-key', 'corrected_operator'
    );
    await expect(page.getByTestId('nc-guidance-callout')).toContainText('기술책임자의 종결 승인 대기');

  시나리오 4 — Manager CORRECTED → 반려 → openRejected:
    await loginAs(page, 'manager');
    await page.goto('/non-conformances/{corrected-nc-id}');  // corrected 상태 seed
    await expect(page.getByTestId('nc-guidance-callout')).toHaveAttribute('data-guidance-key', 'corrected_manager');
    // 조치 반려 클릭
    await page.getByRole('button', { name: '조치 반려' }).click();
    await page.getByPlaceholder(/반려 사유를 입력/).fill('증빙 사진 누락 — 현장 사진 첨부 후 재조치 요청');
    await page.getByRole('button', { name: '반려' }).click();
    await page.waitForResponse(res => res.url().includes('/non-conformances/') && res.status() === 200);
    // manager 시점: 반려 알림 배너 + openRejected_manager callout
    await expect(page.getByRole('alert')).toContainText('증빙 사진 누락');
    await expect(page.getByTestId('nc-guidance-callout')).toHaveAttribute(
      'data-guidance-key', 'openRejected_manager'
    );
    // operator 시점으로 재방문 확인
    await loginAs(page, 'operator');
    await page.goto('/non-conformances/{corrected-nc-id}');
    await expect(page.getByTestId('nc-guidance-callout')).toHaveAttribute(
      'data-guidance-key', 'openRejected_operator'
    );
    await expect(page.getByTestId('nc-guidance-callout')).toContainText('반려 사유를 확인하고 재조치하세요');

  시나리오 5:
    await loginAs(page, 'manager');
    await page.goto('/non-conformances/{closed-nc-id}');
    await expect(page.getByTestId('nc-guidance-callout')).toHaveAttribute('data-guidance-key', 'closed_all');
    await expect(page.getByRole('button', { name: /조치 완료/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /종결 승인/ })).toHaveCount(0);

SSOT 자체 감사 (커밋 전 grep으로 확인):
- grep -n "space-y-[0-9]" apps/frontend/components/non-conformances/NCDetailClient.tsx → 0건
- grep -n "mt-[0-9]" apps/frontend/components/non-conformances/NCDetailClient.tsx → 0건
- grep -n "gap-[0-9]" apps/frontend/components/non-conformances/NCDetailClient.tsx → 0건
- grep -rn "transition-all" apps/frontend/components/non-conformances/ → 0건
- grep -rn "dark:" apps/frontend/components/non-conformances/ → 0건
- grep -En "bg-(red|blue|green|yellow)-[0-9]" apps/frontend/components/non-conformances/NCDetailClient.tsx → 0건
- grep -n "eslint-disable" apps/frontend/components/non-conformances/NCDetailClient.tsx apps/frontend/components/non-conformances/GuidanceCallout.tsx → 0건
- grep -n ": any\b" apps/frontend/components/non-conformances/NCDetailClient.tsx apps/frontend/components/non-conformances/GuidanceCallout.tsx apps/frontend/lib/non-conformances/guidance.ts → 0건
- grep -n "setQueryData" apps/frontend/components/non-conformances/NCDetailClient.tsx → 0건
- grep -n "'ADMIN'\|'MANAGER'\|'USER'" apps/frontend/components/non-conformances/NCDetailClient.tsx → 0건
- role+aria-live: GuidanceCallout에 role="status" aria-live="polite" 존재 확인
- 한국어 하드코딩: grep -nE "[가-힣]" apps/frontend/components/non-conformances/NCDetailClient.tsx (주석 제외) → 0건

커밋 메시지:
refactor(nc-detail): consolidate guidance, empty states, section rhythm

- Insert GuidanceCallout (11 state×role scenarios) between RejectionAlert and WorkflowTimeline
- Remove redundant prerequisite notice block — absorbed into Callout openBlockedRepair/Recalibration
  (기존 E2E prerequisite selector grep 사전 확인 후 삭제)
- Replace Collapsible emptyState JSX with shared <EmptyState/> (canAct, primaryAction CTA)
- Restructure page into 3 semantic groups via NC_SPACING_TOKENS.detail.*
- Apply staggerFadeIn to context group (InfoCards, Collapsibles, Docs)
- Memoize elapsedDays / guidanceKey / hasUnmetPrerequisite via useMemo; GuidanceCallout in React.memo
- Add scrollToActionBar (smooth scroll + focus, 400ms guard)
- Add focus restoration useEffect (nc.status → guidance title focus; h2 tabIndex={-1})
- Disable Mark Corrected when correctionContent empty + hintNeedsContent tooltip
- Remove ActionBar roleHint/waitingGuidance (GuidanceCallout handles messaging)
- Add 5 E2E scenarios covering all guidance state×role combinations

AP-01~10 resolved (AP-07 deferred). Target score 64 → 85+.

검증:
- pnpm --filter frontend tsc --noEmit → 0 errors
- pnpm --filter frontend lint → 0 warnings
- pnpm --filter frontend run test:e2e -- nc-guidance → 5 scenarios pass
- 수동 브라우저 5개 시나리오 확인:
  damage 유형 NC (operator) → 'openBlockedRepair_operator' callout + 조치완료 disabled
  일반 OPEN NC (operator, 조치 미기입) → EmptyState + '조치 내용 작성' CTA
  CORRECTED NC (manager) → 'corrected_manager' callout + 종결승인 버튼 visible
  CLOSED NC → 'closed_all' callout + 편집 UI 없음
  scrollToActionBar 버튼 클릭 → 부드러운 스크롤 + 주요 버튼 focus
  nc.status 전환 후 키보드 Tab → guidance title에 자동 포커스 이동 확인
- 다크모드 토글 (DevTools html.dark) → Callout 5 variant 색상 정상
- prefers-reduced-motion 토글 (DevTools Rendering) → staggerFadeIn 요소가 즉시 표시(opacity:1)
- SSOT 자체감사 10개 항목 (위 목록) 전부 0건 확인

롤백:
  git revert <nc-p4-sha>
  → GuidanceCallout + EmptyState + spacing 리팩토링 전체 되돌림
  → Phase 1~3 토큰(semantic.ts / non-conformance.ts)은 보존됨 — Phase 4 재시도 가능
```

---

> **NC 프롬프트 실행 순서 (의존성 그래프)**
>
> NC-P1 (Layer 2 semantic)
>   → NC-P2 (Layer 3 NC tokens + i18n)  ← NC-P3 (URGENT_BADGE semantic)과 병렬 가능
>   → NC-P3 (병렬)
>   → NC-P4 (NCDetailClient 리팩토링 + GuidanceCallout + E2E)
>
> NC-P4는 NC-P1 + NC-P2 + NC-P3 모두 완료 후 진행.
