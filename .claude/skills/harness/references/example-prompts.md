# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-22 (반출입 v2 프롬프트 9개 신규 PR-12~PR-19 + 기존 9개 PR-3~PR-11 [v2 보강] 마커 부착 + tech-debt 미처리 5건 PR-20~PR-24 신규, 총 23 active PR. PR-1·PR-2 완료 ✅, NC-P1~P4 완료 → archive)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.
> **v2 설계 SSOT**: `.claude/plans/zany-swimming-feigenbaum.md` (Section 0 UX Philosophy + 시각 재구성 A~T + 신규 흡수 P~T)

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

### ~~🔴 CRITICAL — PR-1: FSM SSOT 도입 — `checkout-fsm.ts` + unit tests (Mode 1)~~ ✅

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

### ~~🔴 CRITICAL — PR-2: Backend FSM 통합 — guard 교체 + audit + cache event (Mode 2)~~ ✅

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

### 🟠 HIGH — PR-3 [v2 보강]: Design Token Layer 2 확장 — surface 5단/typography/spacing/workflow-panel/checkout-icons/brand-틴트 [정체성] (Mode 1)

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
       flush:    'bg-muted/30',                                         // level 0
       raised:   'bg-card border border-border/60 shadow-sm',           // level 1
       floating: 'bg-card border border-border/80 shadow-md',           // level 2
       emphasis: 'bg-card border-2 border-brand-info/40 shadow-md',     // level 3 (NC_ELEVATION.emphasis 승계)
       overlay:  'bg-card/95 backdrop-blur-md border border-border shadow-xl', // level 4 (Sticky ActionBar 전용)
     },
   } as const;
   // ★ NC_ELEVATION.emphasis → ELEVATION_TOKENS.surface.emphasis (PR-10에서 1:1 승계, 네이밍 불변)
   // ★ overlay는 Sticky ActionBar/Mobile Drawer 용도 — PR-10 scope 아님, PR-3에서 신규 추가

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

5. apps/frontend/lib/design-tokens/index.ts에 workflow-panel.ts + checkout-icons.ts re-export 추가

6. [v2 보강] 신규 파일: apps/frontend/lib/design-tokens/components/checkout-icons.ts (≈50 lines)
   NC GuidanceCallout.tsx L25-32의 ICON_MAP 패턴 미러링 — 전 컴포넌트가 이 파일에서 import해야 함.

   import { AlertTriangle, Wrench, Clock, CheckCircle2, Lock, ShieldCheck,
            ArrowRight, Send, UserCheck, Package, RotateCcw, Ban, Timer } from 'lucide-react';

   export const CHECKOUT_ICON_MAP = {
     // 상태별 아이콘
     status: {
       pending:          Clock,
       approved:         UserCheck,
       checked_out:      Package,
       returned:         RotateCcw,
       return_approved:  CheckCircle2,
       rejected:         Ban,
       canceled:         Ban,
       overdue:          Timer,
       lender_checked:   ShieldCheck,
       borrower_received: ArrowRight,
       in_use:           Package,
       borrower_returned: RotateCcw,
       lender_received:  CheckCircle2,
     },
     // ctaKind별 아이콘 (NextStepPanel 액션 버튼용)
     action: {
       approve:          CheckCircle2,
       reject:           Ban,
       start:            ArrowRight,
       lender_check:     ShieldCheck,
       submit_return:    Send,
       approve_return:   CheckCircle2,
       reject_return:    AlertTriangle,
     },
     // emptyState별 아이콘
     emptyState: {
       'in-progress':    Clock,
       completed:        CheckCircle2,
       filtered:         AlertTriangle,
     },
     // 긴급도별 아이콘
     urgency: {
       normal:   ArrowRight,
       warning:  AlertTriangle,
       critical: Timer,
     },
   } as const;
   // ★ 각 컴포넌트에서 로컬 ICON_MAP 재정의 금지 — 반드시 이 파일에서 import

7. [v2 보강] apps/frontend/lib/design-tokens/brand.ts — 시맨틱 틴트 2개 추가
   기존 BRAND_COLORS_HEX 객체 끝에 추가:
   progress: {  // checked_out 이후 "진행 중" 상태 전용 (in_use, lender_checked 등)
     DEFAULT:     'hsl(var(--brand-progress))',
     foreground:  'hsl(var(--brand-progress-foreground))',
   },
   archive: {   // completed/canceled 아카이브 상태 전용
     DEFAULT:     'hsl(var(--brand-archive))',
     foreground:  'hsl(var(--brand-archive-foreground))',
   },

   apps/frontend/lib/design-tokens/brand.ts — BRAND_CLASS_MATRIX에도 추가:
   progress: { bg: 'bg-brand-progress', text: 'text-brand-progress', border: 'border-brand-progress' },
   archive:  { bg: 'bg-brand-archive',  text: 'text-brand-archive',  border: 'border-brand-archive'  },

   apps/frontend/app/globals.css — CSS 변수 추가 (:root 및 .dark 섹션 양쪽):
   --brand-progress: 213 79% 48%;        /* #1d6fb8 — 진행중 블루그레이 */
   --brand-progress-foreground: 0 0% 98%;
   --brand-archive: 220 9% 60%;          /* #919aaa — 완료/취소 회색 */
   --brand-archive-foreground: 0 0% 98%;

SSOT 주의:
- bg-card/border-border/text-brand-* 등 CSS 변수 경유 — 하드코딩 hex 0건
- TRANSITION_PRESETS는 motion.ts에서 import (직접 Tailwind 클래스 hardcoding 금지)
- ring-dashed가 Tailwind 기본 유틸리티에 없다면 globals.css @layer utilities에
  .ring-dashed { outline: 2px dashed; outline-offset: 2px; } 추가
- CHECKOUT_ICON_MAP에서 모든 lucide 아이콘 import — 컴포넌트 단위 재선언 금지
- hex 색상 하드코딩 금지 — CSS 변수만 허용 (brand-progress, brand-archive도 동일)
- FSM 리터럴 (`status === 'pending'` 등) 금지 — getNextStep/canPerformAction 경유
- 기존 파일 70%+ 전면 교체 금지 — 증분만

검증:
- pnpm --filter frontend exec tsc --noEmit
- grep 'ELEVATION_TOKENS\|TYPOGRAPHY_TOKENS\|SPACING_RHYTHM_TOKENS\|CHECKOUT_ICON_MAP' apps/frontend/lib/design-tokens/index.ts → 4개 export 확인
- grep 'brand-progress\|brand-archive' apps/frontend/app/globals.css → 2개 CSS 변수 존재
- NEXT_STEP_PANEL_TOKENS + CHECKOUT_ICON_MAP import 가능 여부 타입 체크
```

---

### 🟠 HIGH — PR-4 [v2 보강]: NextStepPanel 컴포넌트 + useCheckoutNextStep 훅 + Storybook 스토리 [P2,P4] (Mode 1)

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

### 🟠 HIGH — PR-5 [v2 보강]: CheckoutGroupCard + CheckoutDetailClient FSM 통합 + 2-섹션 레이아웃 [P1,P3] (Mode 2)

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

### 🟠 HIGH — PR-6 [v2 보강]: CheckoutStatusStepper next 상태 + CheckoutMiniProgress 확장 [P2] (Mode 1)

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

### 🟡 MEDIUM — PR-7 [v2 보강]: Stat Card 계층화 + HeroKPI.tsx/SparklineMini.tsx 파일 분리 + Typography·Spacing·Motion — AP-01·02·03·06·09 [P1] (Mode 1)

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

4. [v2 보강] 파일 분리 — HeroKPI.tsx + SparklineMini.tsx
   OutboundCheckoutsTab.tsx의 hero KPI 그리드를 2개 독립 컴포넌트로 분리:

   apps/frontend/components/checkouts/HeroKPI.tsx (≈60 lines)
   - Props: { label: string; value: number; trend?: 'up'|'down'|'flat'; variant?: 'ok'|'warning'|'critical'|'info'|'progress'|'archive' }
   - surface: ELEVATION_TOKENS.surface.floating — 나머지보다 한 층 위
   - KPI 숫자: TYPOGRAPHY_TOKENS.kpi + ' text-5xl tabular-nums'
   - variant에 따라 BRAND_CLASS_MATRIX[variant].text 색상 적용
   - trend 아이콘: TrendingUp/TrendingDown/Minus (lucide-react)

   apps/frontend/components/checkouts/SparklineMini.tsx (≈45 lines)
   - Props: { values: number[]; trend: 'up'|'down'|'flat'; variant: 'ok'|'warning'|'critical'|'info'|'progress'|'archive'; width?: number; height?: number }
   - 순수 인라인 SVG 렌더링 — 외부 차트 라이브러리 금지
   - polyline points 계산: values 배열 → 정규화 → SVG path
   - stroke 색상: BRAND_CLASS_MATRIX[variant].text + CSS currentColor
   - aria-hidden="true" (스크린리더 생략)
   - 기본 크기: width=64, height=24

   OutboundCheckoutsTab.tsx hero 카드:
   `<HeroKPI label="기한 초과" value={summary.overdue} variant="critical" trend="up" />`
   Secondary 카드에 SparklineMini 슬롯 추가 (값 없으면 미렌더)

SSOT 주의:
- TYPOGRAPHY_TOKENS, SPACING_RHYTHM_TOKENS, EMPTY_STATE_TOKENS는 @/lib/design-tokens에서 import
- CHECKOUT_ICON_MAP는 @/lib/design-tokens에서 import (TrendingUp 등 trend 아이콘은 직접 import 허용)
- getStaggerDelay는 @/lib/design-tokens/motion에서 import
- text-4xl이 기존 KPI보다 너무 크다면 TYPOGRAPHY_TOKENS.kpi를 'text-3xl ...'로 조정
- hex 색상 하드코딩 금지 — BRAND_CLASS_MATRIX variant 경유
- 기존 파일 70%+ 전면 교체 금지 — OutboundCheckoutsTab.tsx 증분만

검증:
- pnpm --filter frontend exec tsc --noEmit
- 수동 확인: overdue > 0 시 overdue card가 col-span-2로 확대됨 + SparklineMini 표시
- 수동 확인: overdue === 0 필터 적용 시 체크마크 + 긍정 메시지 표시
- 수동 확인: skeleton 로딩 시 3개가 stagger(순차) fade-in
- grep 'HeroKPI\|SparklineMini' apps/frontend/components/checkouts/ → 두 파일 독립 존재
```

---

### 🟡 MEDIUM — PR-8 [v2 보강]: i18n 8 네임스페이스 (fsm/guidance/list/timeline/emptyState/yourTurn/toast/help) + 검증 게이트 (Mode 0)

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

2. apps/frontend/messages/ko.json — 나머지 7 네임스페이스 추가:

   "checkouts": {
     ...기존 fsm 섹션 유지...,
     "guidance": {
       "nextStep": "다음 단계", "currentStep": "현재 단계",
       "actor": "담당", "panelTitle": "다음 할 일",
       "urgency": { "normal": "", "warning": "주의", "critical": "기한 초과" },
       "terminal": "완료",
       "blockedHint": "{actor}에게 필요한 단계입니다",
       "stepOf": "{current}/{total} 단계"
     },
     "list": {
       "subtab": { "inProgress": "진행 중", "completed": "완료" },
       "count": { "checkouts": "반출 {count}건", "equipment": "장비 {count}대", "separator": " · " }
     },
     "timeline": {
       "status": {
         "past": "완료", "current": "진행 중", "next": "다음", "future": "예정", "skipped": "건너뜀"
       },
       "tooltip": { "completedAt": "{date}에 완료", "pendingActor": "{actor} 대기 중" }
     },
     "emptyState": {
       "inProgress": { "title": "진행 중인 반출이 없습니다", "description": "새 반출 신청을 등록하면 여기에 표시됩니다", "cta": "반출 신청" },
       "completed":  { "title": "완료된 반출이 없습니다",    "description": "완료된 반출 내역이 쌓이면 여기에서 확인할 수 있습니다" },
       "filtered":   { "title": "검색 결과가 없습니다",       "description": "필터 조건을 변경하거나 검색어를 수정해보세요", "cta": "필터 초기화" }
     },
     "yourTurn": { "label": "내 차례", "tooltip": "{action} 필요" },
     "toast": {
       "transition": {
         "approve":       { "success": "{equipmentName} 반출 승인 완료. 물류팀 대기 중입니다." },
         "start":         { "success": "{equipmentName} 반출 시작됨. 반납 예정일: {dueAt}" },
         "submitReturn":  { "success": "{equipmentName} 반입 처리 완료. 승인자 검토 대기 중" },
         "approveReturn": { "success": "{equipmentName} 반입 최종 승인. 장비가 보관 상태로 복귀되었습니다." },
         "overdue":       { "warning": "{equipmentName} 기한 초과. 즉시 반납해주세요." }
       }
     },
     "help": {
       "status": {
         "pending":           { "title": "승인 대기",      "description": "기술책임자의 검토 및 승인을 기다리고 있습니다." },
         "approved":          { "title": "승인 완료",      "description": "반출 준비가 완료되었습니다. 물류 담당자가 반출을 시작할 수 있습니다." },
         "rejected":          { "title": "반려됨",         "description": "승인자가 신청을 반려했습니다. 사유를 확인하고 재신청해주세요." },
         "lender_checked":    { "title": "반출 확인 완료", "description": "반출 측에서 장비 상태를 확인했습니다. 인수 확인 대기 중입니다." },
         "borrower_received": { "title": "인수 완료",      "description": "수취 측에서 장비를 수령했습니다. 사용 시작을 눌러주세요." },
         "in_use":            { "title": "사용 중",        "description": "장비가 현재 사용 중입니다. 반납 시 반납 확인을 진행해주세요." },
         "borrower_returned": { "title": "반납 확인 완료", "description": "반납 측이 반납을 확인했습니다. 반납 장비 수령을 진행해주세요." },
         "checked_out":       { "title": "반출 중",        "description": "장비가 현재 반출 상태입니다. 반입 신청을 진행해주세요." },
         "returned":          { "title": "반입 신청 완료", "description": "반입 신청이 접수되었습니다. 승인자 검토를 기다리고 있습니다." },
         "completed":         { "title": "반입 완료",      "description": "모든 반출/반입 절차가 완료되었습니다." },
         "canceled":          { "title": "취소됨",         "description": "반출 신청이 취소되었습니다." },
         "overdue":           { "title": "기한 초과",      "description": "반납 기한이 초과되었습니다. 즉시 반납 처리가 필요합니다." },
         "return_rejected":   { "title": "반입 반려",      "description": "반입 검토에서 반려되었습니다. 상태를 확인하고 재처리해주세요." }
       }
     }
   }

   help 네임스페이스는 WorkflowTimeline 노드 tooltip + CheckoutStatusBadge "?" 아이콘 tooltip 공유 소스.
   Radix Tooltip → aria-describedby 연결, 양쪽이 동일 키 t('checkouts.help.status.{status}.description') 사용.

3. apps/frontend/messages/en.json — 동일 8 네임스페이스 구조 영문 번역 추가
   예시: "guidance.panelTitle": "What to do next"
         "yourTurn.label": "Your Turn"
         "toast.transition.approve.success": "{equipmentName} checkout approved. Awaiting logistics team."
         "help.status.pending.title": "Pending Approval"
         "help.status.pending.description": "Waiting for technical manager's review and approval."
   (13개 status × ko/en, 총 26개 help 항목)

4. scripts/check-i18n-keys.mjs — 8 네임스페이스 필수 키 전체 검증:
   const REQUIRED_KEYS = [
     // fsm
     'checkouts.fsm.action.approve', 'checkouts.fsm.actor.approver',
     'checkouts.fsm.hint.pendingApprove', 'checkouts.fsm.hint.terminal',
     // guidance
     'checkouts.guidance.nextStep', 'checkouts.guidance.panelTitle',
     'checkouts.guidance.urgency.critical',
     // list
     'checkouts.list.subtab.inProgress', 'checkouts.list.count.checkouts',
     // timeline
     'checkouts.timeline.status.current', 'checkouts.timeline.status.next',
     // emptyState
     'checkouts.emptyState.inProgress.title', 'checkouts.emptyState.filtered.title',
     // yourTurn
     'checkouts.yourTurn.label',
     // toast
     'checkouts.toast.transition.approve.success', 'checkouts.toast.transition.approveReturn.success',
     // help — 13개 status
     'checkouts.help.status.pending.title', 'checkouts.help.status.overdue.title',
     'checkouts.help.status.completed.title',
   ];
   누락 시 process.exit(1)

   검증 모드 2가지:
   --all:     모든 REQUIRED_KEYS 전체 검증 (CI full-pass)
   --changed: git diff 기반 변경 파일 내 키만 검증 (CI fast-path)

검증:
- node scripts/check-i18n-keys.mjs --all → exit 0
- 의도적으로 'checkouts.yourTurn.label' 삭제 → exit 1 + stderr 누락 키 출력 확인
- pnpm --filter frontend run build → i18n 키 누락 에러 없음
- WorkflowTimeline 노드 hover → tooltip t('checkouts.help.status.{status}.description') 렌더링 확인
```

---

### 🟡 MEDIUM — PR-9 [v2 보강]: checkouts E2E 11 시나리오 — FSM 8 + 서브탭 + YourTurn + 빈 상태 [P1,P2,P4] (Mode 1)

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

[v2 보강 — 목록 IA 시나리오 3개 추가, 총 11 시나리오]

apps/frontend/tests/e2e/features/checkouts/suite-list-ia/ 디렉토리 신규:

9. s-subtab.spec.ts — 서브탭 IA 검증
   - 기본 진입 시 "진행 중" 탭 active + URL ?subTab=in-progress 확인
   - "완료" 탭 클릭 → URL ?subTab=completed + 완료 반출 목록 렌더 확인
   - 각 탭 헤더 "반출 N건 · 장비 M대" 이중 카운트 노출
   - role="tablist" + aria-selected + ←/→ 키보드 전환 확인

10. s-your-turn.spec.ts — YourTurnBadge 검증
    - technical_manager 로그인 → APPROVED 상태 반출 row
    - data-testid="your-turn-badge" 뱃지 + "내 차례" 텍스트 노출 확인
    - test_engineer 동일 row → 뱃지 미노출 확인 (role-based visibility)

11. s-empty-states.spec.ts — 빈 상태 3종 검증
    - 필터 결과 없음 → data-testid="empty-state-filtered" + "필터 초기화" CTA 확인
    - "완료" 탭 빈 상태 → data-testid="empty-state-completed" 아이콘/텍스트 확인
    - "진행 중" 탭 빈 상태 → data-testid="empty-state-in-progress" + "반출 신청" CTA 확인

fixture 사용:
- 기존 test/fixtures/ storageState 패턴 준수
- 테스트용 checkout ID는 기존 seed 데이터 사용 (새 데이터 생성 금지)

검증:
- pnpm --filter frontend run test:e2e -- suite-next-step  (S1~S8, 8개)
- pnpm --filter frontend run test:e2e -- suite-list-ia    (S9~S11, 3개)
- 전체 11 시나리오 pass + axe-core 위반 0
```

---

### 🟡 MEDIUM — PR-10 [v2 보강]: NC elevation 리팩토링 — ELEVATION_TOKENS.surface 5단 승격 (emphasis 키 유지) [정체성] (Mode 1)

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
   NC_ELEVATION.emphasis → ELEVATION_TOKENS.surface.emphasis  ← 키 이름 1:1 유지 (리네이밍 없음)

3. NC_ELEVATION 자체 리터럴 제거 후 re-export로 축소:
   // Before — lib/design-tokens/components/non-conformance.ts (자체 리터럴 정의 제거)
   export const NC_ELEVATION = { flush: '...', raised: '...', floating: '...', emphasis: '...' } as const;

   // After — 4줄 치환, NC 컴포넌트 import 경로 변경 없이 SSOT 일원화
   export const NC_ELEVATION = ELEVATION_TOKENS.surface;

   이렇게 하면 기존 NC 컴포넌트가 NC_ELEVATION.* 그대로 사용 가능하고,
   실제 값은 ELEVATION_TOKENS.surface에서 파생됨 (이원화 제거).

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

### 🟡 MEDIUM — PR-11 [v2 보강]: Self-Audit 게이트 강화 + 번들 크기 측정 (체크 ⑧ FSM 리터럴 + 체크 ⑨ hex 색상) (Mode 0)

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

   // Check 9: hex 색상 직접 하드코딩 감지 (AP-01·AP-04 금지)
   const hexColorPattern = /#[0-9a-fA-F]{3,8}\b/g;
   const frontendCompFiles = glob.sync('apps/frontend/components/checkouts/**/*.{ts,tsx}');
   for (const file of frontendCompFiles) {
     const content = fs.readFileSync(file, 'utf8');
     // CSS 변수 정의(:root 블록) 및 주석 제외
     const stripped = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/:root\s*\{[^}]*\}/g, '');
     const matches = stripped.match(hexColorPattern);
     if (matches?.length) {
       errors.push(`[COLOR] hex 하드코딩 in ${file}: ${matches.join(', ')} — BRAND_CLASS_MATRIX 경유`);
     }
   }

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
- 의도적으로 if (status === 'pending') 삽입 → 체크 ⑧ 오류 출력 확인
- 의도적으로 #22C55E hex 삽입 → 체크 ⑨ 오류 출력 확인
- node scripts/measure-bundle.mjs → baseline 출력 확인
```

---

### 🟠 HIGH — PR-12: 목록 IA 서브탭 + 이중 카운트 헤더 + 빈 상태 3종 + backend status[] 복수 필터 [P1,P3,P4] (Mode 2)

```
문제:
반출 목록 페이지에서 완료/진행 중 반출이 날짜 기준 한 목록에 혼재됨 (IA 혼재).
"20건"이 row 수인지 장비 수인지 UI에 표시 없음. 빈 상태가 획일적 텍스트.

조건: PR-8(i18n) 완료 + ListCheckoutsDto status 단일/복수 여부 선행 verify 필수.

작업:

0. [선행 verify] apps/backend/src/modules/checkouts/dto/list-checkouts.dto.ts
   status?: CheckoutStatus (단일) → status?: CheckoutStatus[] 복수 확장 필요 여부 확인.
   이미 복수 지원이면 0번·1번 생략.

1. (조건부) 백엔드 status[] 복수 필터 확장:
   - list-checkouts.dto.ts: status?: CheckoutStatus  →  status?: CheckoutStatus[]
   - checkouts.service.ts listCheckouts(): eq(checkout.status, dto.status) → inArray(checkout.status, dto.status)
   - inArray import from 'drizzle-orm'

2. CHECKOUT_STATUS_GROUPS 재사용 (lib/constants/checkouts/labels.ts L105-117):
   서브탭 필터 SSOT — in_progress / completed 그룹 직접 사용. 리터럴 배열 나열 금지.

3. CheckoutsContent.tsx — 서브탭 + URL SSOT:
   - useSearchParams() + useRouter() 로 ?subTab=in-progress(기본)|completed URL 동기화
   - 탭 전환 시 CHECKOUT_STATUS_GROUPS[subTab] → API status[] 파라미터 전달
   - role="tablist" + aria-label + ←/→ 키 핸들러

4. 이중 카운트 헤더 "반출 {N}건 · 장비 {M}대":
   - i18n: t('checkouts.list.count.checkouts', {count}) + separator + t('...equipment', {count})

5. CheckoutEmptyState.tsx (신규) + lib/design-tokens/components/checkout-empty-state.ts:
   export const CHECKOUT_EMPTY_STATE_TOKENS = {
     container: 'flex flex-col items-center justify-center py-16 px-4 text-center',
     icon:       'h-12 w-12 mb-4 text-muted-foreground/60',
     title:      'text-base font-medium text-foreground mb-2',
     description:'text-sm text-muted-foreground max-w-xs',
     cta:        'mt-6',
   } as const;
   - variant: 'in-progress' | 'completed' | 'filtered'
   - data-testid="empty-state-{variant}" 부착
   - 아이콘: CHECKOUT_ICON_MAP.emptyState[variant]

SSOT 주의:
- CHECKOUT_STATUS_GROUPS: labels.ts L105-117 import — 리터럴 나열 금지
- CheckoutStatus[]: packages/schemas에서 import
- hex 하드코딩 금지 / 기존 파일 70%+ 전면 교체 금지

금지:
- FSM 상태 리터럴 직접 배열(['pending', 'approved', ...]) 금지
- tab 신규 UI 스택 도입 금지 (shadcn/ui Tabs 재사용)

검증:
- pnpm --filter backend run tsc --noEmit
- pnpm --filter frontend run tsc --noEmit
- URL ?subTab=in-progress → 진행 중 반출만 표시
- URL ?subTab=completed → 완료 반출만 표시
- grep -r 'empty-state-' apps/frontend/components/checkouts/ → 3 hits
```

---

### 🟠 HIGH — PR-13: YourTurnBadge + 그룹 카드 Redesign + checkout-your-turn.ts 토큰 [P2,P4] (Mode 1)

```
문제:
반출 목록에서 현재 사용자가 액션해야 할 row인지 구분 불가.
그룹 카드가 단순 날짜+목록 나열 — 누가 무엇을 해야 하는지 즉시 파악 불가.

조건: PR-12(서브탭) + PR-4(useCheckoutNextStep 훅) 완료 후 진행.

작업:

1. lib/design-tokens/components/checkout-your-turn.ts (신규):
   export const CHECKOUT_YOUR_TURN_BADGE_TOKENS = {
     base:    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
     variant: {
       normal:   'bg-brand-info/10 text-brand-info',
       warning:  'bg-brand-warning/10 text-brand-warning',
       critical: 'bg-brand-critical/10 text-brand-critical animate-pulse motion-reduce:animate-none',
     },
     icon: 'h-3 w-3',
   } as const;

2. YourTurnBadge.tsx (신규):
   apps/frontend/components/checkouts/YourTurnBadge.tsx
   - Props: { urgency: 'normal' | 'warning' | 'critical'; label?: string }
   - data-testid="your-turn-badge" 부착
   - 아이콘: CHECKOUT_ICON_MAP.urgency[urgency]
   - i18n: t('checkouts.yourTurn.label'), t('checkouts.yourTurn.tooltip', {action})
   - aria-label 부착

3. hooks/use-checkout-group-descriptors.ts (신규):
   그룹 내 모든 checkout row의 descriptor를 useMemo로 일괄 계산:
   - 인자: CheckoutRow[], currentUserId, userRole
   - 순수 getNextStep() 직접 호출 (훅은 단일 전용이므로 순수함수 사용)
   - 반환: Map<checkoutId, NextStepDescriptor>
   - getNextStep: packages/schemas/src/fsm/checkout-fsm.ts에서 import

4. CheckoutGroupCard.tsx 증분:
   - 각 row에 YourTurnBadge 슬롯 (descriptor.availableToCurrentUser && urgency)
   - 그룹 헤더 우측 "내 차례 {N}건" 요약 카운트

SSOT 주의:
- getNextStep: packages/schemas/src/fsm/checkout-fsm.ts에서 import (재구현 금지)
- getPermissions: @equipment-management/shared-constants에서 import
- hex 하드코딩 금지 / 기존 파일 70%+ 전면 교체 금지

검증:
- pnpm --filter frontend run tsc --noEmit
- APPROVED 상태 반출 목록 → technical_manager에게 뱃지 노출, test_engineer 미노출
- grep -n "your-turn-badge" apps/frontend/components/checkouts/CheckoutGroupCard.tsx → 존재
```

---

### 🟠 HIGH — PR-14: WorkflowTimeline — 5/7단계 분기 + 노드 상태 5종 + checkout-timeline.ts 토큰 [P1,P3] (Mode 1)

```
문제:
반출 상세 페이지에 반출 흐름 타임라인 없음.
사용자가 전체 프로세스에서 어디에 있는지 스크롤 없이 파악 불가.

조건: PR-3(tokens) + PR-4(NextStepPanel) 완료 후 진행 (PR-6·PR-7과 병렬 가능).

작업:

1. lib/design-tokens/components/checkout-timeline.ts (신규):
   export const CHECKOUT_TIMELINE_TOKENS = {
     container: 'relative flex flex-col gap-0',
     connector: { base: 'absolute left-4 top-8 bottom-0 w-0.5', past: 'bg-brand-ok', future: 'bg-border' },
     node: { past: 'opacity-100', current: 'opacity-100', next: 'opacity-80', future: 'opacity-40', skipped: 'opacity-30' },
     dot: {
       base:    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
       past:    'bg-brand-ok text-white',
       current: 'bg-brand-info text-white ring-2 ring-brand-info/30',
       next:    'bg-muted border-2 border-brand-info text-brand-info',
       future:  'bg-muted border border-border text-muted-foreground',
       skipped: 'bg-muted border border-border opacity-50',
     },
     label: { past: 'text-muted-foreground text-sm', current: 'font-medium text-sm', next: 'text-brand-info text-sm' },
   } as const;

2. WorkflowTimeline.tsx (신규):
   apps/frontend/components/checkouts/WorkflowTimeline.tsx
   - computeStepIndex: packages/schemas/src/fsm/checkout-fsm.ts에서 import
   - purpose prop으로 5단계(non-rental) / 7단계(rental) 분기
   - 노드 상태 5종: past / current / next / future / skipped
   - Radix Tooltip: t('checkouts.help.status.{status}.description') — i18n 공유 소스
   - 모바일: @media max-width: 768px compact 세로 모드
   - data-testid="workflow-timeline" 부착

3. CheckoutDetailClient.tsx 증분:
   - statusGroup 섹션에 WorkflowTimeline 추가
   - Suspense + WorkflowTimelineSkeleton fallback

SSOT 주의:
- computeStepIndex: checkout-fsm.ts에서 import (재구현 금지)
- tooltip i18n: checkouts.help.status.* 공유 소스 (중복 번역 금지)
- hex 하드코딩 금지

검증:
- pnpm --filter frontend run tsc --noEmit
- non-rental 반출 → 5개 노드, rental → 7개 노드 렌더 확인
- current 노드 ring + data-step-state="current" 확인
```

---

### 🟡 MEDIUM — PR-15: 모션 디자인 7종 + prefers-reduced-motion [P1] (Mode 1)

```
문제:
TRANSITION_PRESETS는 있으나 stagger/fadeInUp/pulse-hard/lift/accordion/confetti 미구현.
prefers-reduced-motion 지원 없음.

조건: PR-4(NextStepPanel) 완료 후 진행.

작업:

1. lib/design-tokens/motion.ts — 7종 모션 추가 (기존 ANIMATION_PRESETS 보강):
   staggerItem: (index: number) => ({ animationDelay: `${index * 60}ms` }),
   fadeInUp:    'animate-fadeInUp',         // @keyframes fadeInUp (opacity 0→1, translateY 8px→0)
   pulseSoft:   'animate-pulse-soft',       // 2s ease-in-out infinite, opacity 1→0.7
   pulseHard:   'animate-pulse-hard',       // 1s linear infinite
   lift:        'hover:-translate-y-0.5 hover:shadow-md transition-shadow transition-transform',
   accordionDown:'animate-accordion-down',  // Radix UI 기본 활용
   confettiMicro:'animate-confetti-micro',  // 완료 상태 0.4s 1회, scale(1→1.08→1)

   export const REDUCED_MOTION = {
     safe: (animClass: string) => `${animClass} motion-reduce:animate-none`,
   };

2. globals.css 또는 tailwind.config.ts — @keyframes 등록:
   fadeInUp, pulse-soft, confetti-micro 3종

3. CheckoutGroupCard.tsx — stagger 적용:
   그룹 내 row에 staggerItem(index) 딜레이 + motion-reduce:animate-none 래핑

4. NextStepPanel.tsx 증분:
   urgency === 'critical' → REDUCED_MOTION.safe(ANIMATION_PRESETS.pulseHard)

SSOT 주의:
- transition-all 사용 금지 (TRANSITION_PRESETS만 허용)
- duration-[ms] arbitrary 금지
- 모든 animate-* 클래스에 motion-reduce:animate-none 짝 필수

검증:
- pnpm --filter frontend run tsc --noEmit
- grep -rn 'transition-all' apps/frontend/components/checkouts/ → 0 hit
- page.emulateMedia({ reducedMotion: 'reduce' }) → pulse 비활성 확인
```

---

### 🟡 MEDIUM — PR-16: 접근성 강화 — skip link + kbd nav + focus trap + aria-live 다단계 [전원칙] (Mode 1)

```
문제:
서브탭 ←/→ 키 탐색, NextStepPanel aria-live, skip-to-content 링크 미구현.

조건: PR-12(서브탭) + PR-14(Timeline) 완료 후 진행.

작업:

1. 레이아웃 skip link:
   apps/frontend/components/layout/ — skip link 추가:
   <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 ...">
     {t('common.skipToContent')}
   </a>
   페이지 <main> 에 id="main-content" 부착

2. 서브탭 ←/→ 키보드:
   CheckoutsContent.tsx onKeyDown: ArrowLeft/ArrowRight 시 탭 인덱스 순환
   포커스 탭에 FOCUS_TOKENS.classes.default ring 부착

3. NextStepPanel aria-live:
   urgency === 'critical' → aria-live="assertive"
   urgency !== 'critical' → aria-live="polite"
   상태 전이 후 NextStepPanel로 focus 복귀 (useRef + focus())
   GuidanceCallout.tsx L52-58 패턴 미러링

4. WorkflowTimeline tooltip keyboard:
   각 노드 button role + Enter/Space → Radix Tooltip 토글 (내장 keyboard 지원)

SSOT 주의:
- FOCUS_TOKENS.classes.default: lib/design-tokens/ 에서 import
- aria-live: GuidanceCallout.tsx L52-58 패턴 참조
- hex 하드코딩 금지

검증:
- pnpm --filter frontend run tsc --noEmit
- Tab → NextStepPanel 버튼 도달 + Enter 활성화
- urgency critical → aria-live="assertive" 확인 (playwright getAttribute)
- axe-core: role="tablist" + aria-selected 위반 0
```

---

### 🟢 LOW — PR-17: 최종 리뷰 + 번들 크기 diff + S-14 Feature Flag tech-debt 등록 + 3-Phase rollout (Mode 0)

```
문제:
PR-3~PR-16 완료 후 전체 통합 검증 없음.
NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 상시화 계획 미등록.

조건: PR-3~PR-16 전부 완료 후 진행 (최종 단계, 병렬 불가).

작업:

1. 전체 통합 검증:
   pnpm --filter frontend run tsc --noEmit && pnpm --filter backend run tsc --noEmit
   pnpm --filter frontend run lint
   node scripts/self-audit.mjs --all         (체크 ①~⑨ 위반 0)
   node scripts/check-i18n-keys.mjs --all    (8 네임스페이스 누락 0)
   pnpm --filter frontend run build
   NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true \
     pnpm --filter frontend run test:e2e -- --grep "@next-step|@checkout-ia|@your-turn|@empty-state"
   (11 시나리오 전부 PASS)

2. S-14 Feature Flag tech-debt 등록:
   .claude/exec-plans/tech-debt-tracker.md 항목 추가:
   - 제목: "Feature Flag NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 상시화"
   - 분류: MEDIUM / 기술부채
   - 조건: Beta 2 세션 안정 + 프로덕션 A/B 1주 관찰 후
   - 대응: flag 코드 제거 → flag=false 분기 삭제 → .env.example 해당 줄 삭제
   - 예상 시점: 2026-Q2

3. 번들 크기 diff:
   pnpm --filter frontend run build 2>&1 | node scripts/check-bundle-size.mjs --compare
   /checkouts, /checkouts/[id], /dashboard 라우트 < 5% 증가 확인

4. Feature Flag 3-Phase rollout 체크리스트:

   | 단계 | 시점                             | NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL | 비고                       |
   |------|----------------------------------|--------------------------------------|----------------------------|
   | Alpha| PR-5 머지 직후                   | false (기본)                         | 내부 QA만 true 수동 토글   |
   | Beta | E2E 11 시나리오 2 세션 안정화 후 | true (개발 환경)                     | 프로덕션은 여전히 false    |
   | GA   | 프로덕션 A/B 1주 관찰 후         | true (전역)                          | flag 코드 제거 (S-14 후속) |

SSOT 주의:
- tech-debt-tracker 항목 형식: 기존 항목 스타일 준수
- 번들 baseline: check-bundle-size.mjs baseline 파일 갱신 금지 (비교 기준 보존)

검증:
- 위 1번 전체 통합 검증 PASS
- tech-debt-tracker.md에 NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 항목 존재
- 번들 증가분 < 5% 확인
```

---

### 🟠 HIGH — PR-18: Contextual Tooltip (M-81) + Onboarding + Toast 템플릿 + Mobile Bottom Sheet + E2E 3 시나리오 [P1,P2,P4] (Mode 2)

```
문제:
상태 뱃지 의미를 기억에 의존. 최초 진입자에게 NextStepPanel CTA 인지 없음.
상태 전이 toast가 획일적 텍스트. 모바일 Sticky ActionBar 사용성 미흡.

조건: PR-5(통합+flag) + PR-8(i18n) + PR-14(Timeline) 완료 후 진행.

작업:

1. Contextual tooltip — CheckoutStatusBadge "?" 아이콘 (M-81):
   CheckoutStatusBadge.tsx 증분:
   - 뱃지 우측 subtle "?" 아이콘 (opacity-0 group-hover:opacity-100)
   - Radix Tooltip: t('checkouts.help.status.{status}.description')
   - aria-describedby 연결
   - WorkflowTimeline tooltip과 동일 i18n 소스 공유 (중복 번역 금지)

2. lib/design-tokens/components/checkout-toast.ts (신규):
   export const CHECKOUT_TOAST_TOKENS = {
     icon: { ok: 'CheckCircle2', warning: 'AlertTriangle', error: 'XCircle' },
     duration: { success: 4000, warning: 6000, error: 8000 },
   } as const;

3. lib/checkouts/toast-templates.ts (신규):
   buildToastMessage(action, ctx: { equipmentName, dueAt? }, t):
   - i18n: checkouts.toast.transition.{action}.success/warning
   - sonner toast() 래퍼 포함 (신규 toast 라이브러리 도입 금지)

4. hooks/use-checkout-onboarding.ts (신규):
   localStorage 키: checkout-onboarded-v2 (v2 접미사 고정 — 향후 재트리거 가능)
   - isOnboarding: localStorage 미설정 시 true
   - markDone(): localStorage.setItem('checkout-onboarded-v2', 'true')
   - prefersReducedMotion: matchMedia 감지
   - 5초 timeout fallback으로 자동 markDone()

5. NextStepPanel.tsx 증분:
   isOnboarding 시 primary CTA에 REDUCED_MOTION.safe(ANIMATION_PRESETS.pulseHard) 1회
   CTA 클릭 → markDone()

6. StickyActionBar.tsx — Mobile Bottom Sheet (M-85):
   @media (max-width: 768px): shadcn/ui Drawer 컴포넌트 활용
   기본 peek 64px (primary CTA 1개) + swipe/tap → full expand
   padding-bottom: env(safe-area-inset-bottom), aria-modal="true"

7. E2E 3 시나리오 (apps/frontend/tests/e2e/features/checkouts/suite-ux/):
   - s-onboarding.spec.ts: localStorage 없이 진입 → pulseOnce → 클릭 후 checkout-onboarded-v2 저장
   - s-toast.spec.ts: approve 액션 → toast 메시지 + 아이콘 5종 전이
   - s-mobile-bottom-sheet.spec.ts: viewport 375px → Drawer peek 64px → tap → full expand

SSOT 주의:
- help i18n: WorkflowTimeline 공유 소스, 중복 번역 금지
- sonner: 이미 설치됨 — 신규 toast 라이브러리 금지
- shadcn Drawer: components/ui/drawer.tsx 재사용 — 신규 UI 스택 금지
- localStorage 키: checkout-onboarded-v2 고정
- hex 하드코딩 금지 / setQueryData onSuccess 내 사용 금지

검증:
- pnpm --filter frontend run tsc --noEmit
- s-onboarding: localStorage.getItem('checkout-onboarded-v2') === 'true' 확인
- s-toast: 5개 전이 toast 텍스트 확인
- s-mobile-bottom-sheet: aria-modal="true" + peek 64px 확인
- page.emulateMedia({ reducedMotion: 'reduce' }) → pulse 없음 확인
```

---

### 🟡 MEDIUM — PR-19: Loading Skeleton 6종 + inline Error 3 위치 + checkout-loading-skeleton.ts 토큰 [P1] (Mode 1)

```
문제:
데이터 로딩 중 spinner 표시 또는 빈 화면 — 레이아웃 시프트. 부분 에러 표시 불가.

조건: PR-5(통합) + PR-7(HeroKPI) + PR-14(Timeline) 완료 후 진행.

작업:

1. lib/design-tokens/components/checkout-loading-skeleton.ts (신규):
   export const CHECKOUT_LOADING_SKELETON_TOKENS = {
     base:     'animate-pulse rounded-md bg-muted motion-reduce:animate-none',
     text:     { sm: 'h-3 w-24', md: 'h-4 w-40', lg: 'h-5 w-56' },
     card:     'h-24 w-full rounded-lg',
     badge:    'h-6 w-16 rounded-full',
     icon:     'h-8 w-8 rounded-full',
     timeline: 'h-64 w-full',
   } as const;

2. Loading Skeleton 6종 (신규 4 + 기존 2 확장):
   신규:
   - HeroKPISkeleton.tsx:        Hero floating card + 4 secondary raised 그리드
   - WorkflowTimelineSkeleton.tsx: 5/7 노드 dot + connector line
   - NextStepPanelSkeleton.tsx:  icon + title + button 3-line
   - CheckoutGroupCardSkeleton.tsx: 그룹 헤더 + row 3개
   기존 확장:
   - CheckoutListSkeleton.tsx:   HeroKPI skeleton 섹션 추가
   - CheckoutDetailSkeleton.tsx: WorkflowTimeline skeleton 섹션 추가
   모든 skeleton: animate-pulse + motion-reduce:animate-none, spinner 사용 금지

3. inline Error 3 위치:
   - HeroKPIError:         목록 페이지 KPI 영역, role="alert" + retry 버튼 (목록 정상 유지)
   - NextStepPanelError:   상세 페이지, "다음 단계를 계산하지 못했습니다" + retry
   - WorkflowTimelineError:접힌 상태, "진행 단계를 표시할 수 없습니다" + retry
   모든 Error 컴포넌트: role="alert" + aria-live="assertive"

4. Suspense 경계 세분화:
   CheckoutDetailClient.tsx: statusGroup / contextGroup / actionBar 각각 Suspense
   각 fallback: 해당 skeleton 컴포넌트

SSOT 주의:
- spinner 금지: animate-pulse + CHECKOUT_LOADING_SKELETON_TOKENS만 사용
- hex 하드코딩 금지

검증:
- pnpm --filter frontend run tsc --noEmit
- 네트워크 throttle → 각 Suspense 영역 skeleton 렌더 확인
- HeroKPI API 에러 → HeroKPIError inline (목록 하단은 정상) 확인
- grep 'spinner\|Spinner' apps/frontend/components/checkouts/ → 0 hit
```

---

---

### 🟡 MEDIUM — PR-20: Backend SSOT/패리티 — approveReturn checkTeamPermission 패리티 + approve 테스트 mock 수정 (Mode 1) [부분완료: 1·2번 ✅ 547485f5]

```
배경 (2026-04-22 p1p3 + review-arch tech-debt):
apps/backend/src/modules/checkouts/checkouts.service.ts에 3개의 독립적 이슈가 공존.
보안 이슈 1건 + SSOT 위반 1건 + 패턴 비대칭 1건.

문제:
1. [보안 🔴] rejectReturn 스코프 체크 순서 역전 (L1995~2023)
   assertFsmAction 호출이 enforceScopeFromData보다 먼저 실행됨.
   → 스코프 외 사용자가 scope 차단 대신 FSM 오류 메시지를 먼저 수신 (정보 노출).
   approve(L1421)/approveReturn은 enforceScopeFromCheckout을 FSM 전에 호출하는 올바른 패턴 사용.

2. [SSOT 🟠] submitConditionCheck step 리터럴 (L2131-2207)
   'lender_checkout' / 'lender_return' 문자열 리터럴 3개소가 직접 비교됨.
   stepTransitions 객체 키도 동일한 리터럴 사용.
   SSOT: ConditionCheckStepValues.LENDER_CHECKOUT / ConditionCheckStepValues.LENDER_RETURN 상수 존재.

3. [패턴 비대칭 🟡] approveReturn checkTeamPermission 미적용
   approve/rejectReturn은 EMC/RF 교차 금지 checkTeamPermission() 호출.
   approveReturn은 동일 호출 없음.
   또한 approveReturn은 enforceScopeFromCheckout(추가 DB 쿼리) 사용 vs approve/rejectReturn의 enforceScopeFromData(쿼리 0).

4. [테스트 🟢] approve 테스트 mockDrizzle.where.then 패턴 비작동
   describe('approve') success/LENDER_TEAM_ONLY 테스트(spec L312-336, 390-405)가
   chain.where.then 오버라이드 사용하나 실제로 비작동.
   현재 findByIds mock이 입력 무관하게 equipment 반환하여 우연히 통과.
   → mockChain.then 패턴으로 통일.

조건: PR-2(backend FSM) 이후 독립 진행 가능. frontend와 무관.

작업:

1. checkouts.service.ts — rejectReturn 스코프 체크 순서 수정 (수술적 변경)
   L1995 근처: assertFsmAction 호출을 enforceScopeFromData 이후로 이동.
   패턴 참조: approve 메서드 구조 (enforceScopeFromData → checkTeamPermission → assertFsmAction 순서).
   변경 범위: rejectReturn 메서드 내 2줄 순서 교환만. 인접 로직 변경 금지.

2. checkouts.service.ts — submitConditionCheck step 리터럴 교체 (수술적 변경)
   L2131-2207 범위:
   'lender_checkout' → ConditionCheckStepValues.LENDER_CHECKOUT  (3개소)
   'lender_return'   → ConditionCheckStepValues.LENDER_RETURN    (3개소)
   stepTransitions 객체 키: computed property key 문법 사용
     { [ConditionCheckStepValues.LENDER_CHECKOUT]: ..., [ConditionCheckStepValues.LENDER_RETURN]: ... }
   ConditionCheckStepValues import 경로: @equipment-management/schemas (기존 import 확인 후 추가)
   변경 범위: L2131-2207 이내만. 다른 메서드 변경 금지.

3. checkouts.service.ts — approveReturn 패리티 검토 + 적용
   먼저 approveReturn 메서드를 읽고:
   - 반납 최종 승인자에게 팀 분류 제약이 도메인상 없다면: 파일 상단 주석으로 의도 명시하고 종료.
   - 제약이 있어야 한다면: approve/rejectReturn 패턴으로 checkTeamPermission() 추가.
   - enforceScopeFromCheckout → enforceScopeFromData 교체 여부: 추가 DB 쿼리 제거가 성능상 유리하나,
     데이터 이미 로드된 경우에만 안전. approveReturn에서 checkout이 select된 직후 호출인지 확인 후 판단.
   ※ 의도적 생략이면 코드 변경 없이 주석만 추가. 코드 추측으로 변경 금지.

4. checkouts.service.spec.ts — approve 테스트 mock 패턴 수정
   spec L312-336, L390-405:
   chain.where.then 오버라이드 → mockChain.then 직접 오버라이드 패턴으로 교체.
   기존 테스트 파일의 mockChain 설정 방식(파일 내 다른 테스트) 참조하여 일관성 유지.
   테스트 결과는 동일(pass) — mock 신뢰성만 개선.

SSOT 주의:
- ConditionCheckStepValues는 @equipment-management/schemas에서 import (로컬 재정의 금지)
- assertFsmAction, enforceScopeFromData, checkTeamPermission 호출 순서는 approve 메서드를 SSOT로 참조
- 변경 파일: checkouts.service.ts + checkouts.service.spec.ts 2개만

검증:
- pnpm --filter backend exec tsc --noEmit
- pnpm --filter backend run test -- checkouts.service
- grep "'lender_checkout'\|'lender_return'" apps/backend/src/modules/checkouts/checkouts.service.ts → 0 hit
- rejectReturn: enforceScopeFromData 호출이 assertFsmAction보다 앞에 있음을 grep으로 확인
```

---

### ~~🟡 MEDIUM — PR-21: 프론트엔드 구조 수정 — WCAG tablist 위치 + Radix Select 가드 + QUERY_CONFIG SSOT + URL 일원화 (Mode 1)~~ ✅

```
배경 (2026-04-22 subtab-ia tech-debt 4건):
CheckoutsContent.tsx/OutboundCheckoutsTab.tsx에서 발견된 구조적 이슈 4건.
각 이슈는 독립적이지만 모두 checkout 필터/탭 레이어에 집중되어 있어 단일 PR로 처리.

문제:
1. [WCAG 4.1.2 🟠] role="tabpanel" 내부에 role="tablist" 위치
   OutboundCheckoutsTab.tsx:348-357:
   <div role="tabpanel" aria-labelledby="...">
     <CheckoutListTabs ... />   {/* CheckoutListTabs가 tablist 렌더 */}
     ...
   </div>
   WCAG 2.1 Tab Pattern: tablist는 tabpanel의 sibling이어야 함 (자식 불가).
   axe-core: "Elements with role="tablist" must not be contained in elements with role="tabpanel"".

2. [아키텍처 🟡] Radix Select spurious onValueChange 가드 누락
   CheckoutsContent.tsx의 4개 핸들러가 동일 값 선택 시에도 URL 업데이트 실행:
   handleStatusChange / handleLocationChange / handlePurposeChange / handlePeriodChange
   Radix Select는 네비게이션 중 spurious 발화 가능 → 의도치 않은 필터 리셋 위험.

3. [SSOT 🟡] QUERY_CONFIG 인라인 오버라이드 (4차 재발)
   CheckoutsContent.tsx:141: staleTime: CACHE_TIMES.SHORT (pendingCount)
   CheckoutsContent.tsx:149: staleTime: CACHE_TIMES.LONG  (destinations)
   CheckoutsContent.tsx:165: staleTime: CACHE_TIMES.SHORT (liveSummary)
   QUERY_CONFIG에 프리셋이 없어 매번 인라인 지정. 기존 모듈(equipment 등)은 QUERY_CONFIG 프리셋 사용.

4. [아키텍처 🟢] handlePageChange URL SSOT 이중 경로
   OutboundCheckoutsTab.tsx:132-148:
   handlePageChange → new URLSearchParams(searchParams.toString()).set('page', ...)
   handleSubTabChange → new URLSearchParams(searchParams.toString()).set('subTab', ...)
   CheckoutsContent.tsx의 updateUrl(filtersToSearchParams(...)) 패턴과 이중 경로.

조건: PR-12(서브탭 + 목록 IA) 완료 후 진행. PR-16(접근성 강화)과 병렬 가능.
      WCAG 이슈(1번)는 PR-16 전에 해결하는 것이 권장.

작업:

1. OutboundCheckoutsTab.tsx — tablist 위치 수정 (수술적)
   현재:
   <div id={`subtab-panel-${filters.subTab}`} role="tabpanel" aria-labelledby="...">
     <CheckoutListTabs ... />
     <div className="space-y-3">...</div>
   </div>

   수정 후:
   <CheckoutListTabs ... />   {/* tabpanel 외부로 이동 */}
   <div id={`subtab-panel-${filters.subTab}`} role="tabpanel" aria-labelledby="...">
     <div className="space-y-3">...</div>
   </div>

   주의: CheckoutListTabs의 aria-labelledby 연결이 tabpanel id와 일치하는지 확인.
   WCAG Tab Pattern: tablist와 tabpanel은 같은 레벨 sibling 구조.

2. CheckoutsContent.tsx — Radix Select 가드 추가 (4개 핸들러)
   각 핸들러 첫 줄에 early-return 가드:
   const handleStatusChange = (value: string) => {
     if (value === filters.status) return;   // ← 추가
     const inferredSubTab = getSubTabForStatus(value);
     updateUrl({ ...filters, status: value, subTab: inferredSubTab ?? filters.subTab, page: 1 });
   };
   동일 패턴: handleLocationChange(destination), handlePurposeChange(purpose), handlePeriodChange(period)
   변경 범위: 각 핸들러 첫 줄만. 핸들러 내부 로직 변경 금지.

3. lib/api/query-config.ts — CHECKOUT 쿼리 프리셋 추가
   기존 QUERY_CONFIG 객체에 checkout 섹션 추가:
   checkout: {
     pendingCount: { staleTime: CACHE_TIMES.SHORT },
     destinations: { staleTime: CACHE_TIMES.LONG },
     summary:      { staleTime: CACHE_TIMES.SHORT },
     list:         { staleTime: CACHE_TIMES.SHORT },
   }
   CACHE_TIMES는 동일 파일에 이미 존재 — import 변경 불필요.

   CheckoutsContent.tsx 3곳 교체:
   L141: staleTime: CACHE_TIMES.SHORT → ...QUERY_CONFIG.checkout.pendingCount
   L149: staleTime: CACHE_TIMES.LONG  → ...QUERY_CONFIG.checkout.destinations
   L165: staleTime: CACHE_TIMES.SHORT → ...QUERY_CONFIG.checkout.summary
   스프레드(...)로 교체하여 staleTime 외 필드(gcTime 등) 확장 가능하게 유지.

4. OutboundCheckoutsTab.tsx — handlePageChange/handleSubTabChange 일원화
   현재 두 함수가 URLSearchParams 직접 조작 → filtersToSearchParams 경유로 통일.

   handlePageChange 수정:
   const handlePageChange = (newPage: number) => {
     const updated = { ...filters, page: newPage };
     const params = filtersToSearchParams(updated);
     const qs = params.toString();
     router.replace(qs ? `${FRONTEND_ROUTES.CHECKOUTS.LIST}?${qs}` : FRONTEND_ROUTES.CHECKOUTS.LIST, { scroll: false });
   };

   handleSubTabChange 수정:
   const handleSubTabChange = (newSubTab: CheckoutSubTab) => {
     const updated = { ...filters, subTab: newSubTab, status: 'all' as const, page: 1 };
     const params = filtersToSearchParams(updated);
     const qs = params.toString();
     router.replace(qs ? `${FRONTEND_ROUTES.CHECKOUTS.LIST}?${qs}` : FRONTEND_ROUTES.CHECKOUTS.LIST, { scroll: false });
   };

   filtersToSearchParams는 이미 import됨 — 추가 import 불필요.
   FRONTEND_ROUTES.CHECKOUTS.LIST import 확인 (이미 있으면 추가 불필요).
   변경 범위: 두 함수 본문만. prop/인터페이스 변경 금지.

SSOT 주의:
- filtersToSearchParams: @/lib/utils/checkout-filter-utils에서 import (이미 있음, 재확인만)
- QUERY_CONFIG: @/lib/api/query-config에서 import
- CACHE_TIMES: query-config.ts 내부에서 참조 (외부 재정의 금지)
- role="tabpanel" id는 기존 `subtab-panel-${filters.subTab}` 유지 (aria 연결 보존)
- hex 하드코딩 금지 / 기존 파일 70%+ 전면 교체 금지

검증:
- pnpm --filter frontend exec tsc --noEmit
- grep "staleTime: CACHE_TIMES" apps/frontend/app/\(dashboard\)/checkouts/CheckoutsContent.tsx → 0 hit
- grep "new URLSearchParams" apps/frontend/app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx → 0 hit
- axe-core: role="tablist" contained in role="tabpanel" 위반 0
- 수동 확인: 동일 상태 Select 재선택 시 URL 변경 없음
```

---

### 🟡 MEDIUM — PR-22: Checkout API 정리 — getCheckoutSummary() 데드 코드 + 레거시 필드 + verifyHandoverToken Zod (Mode 1)

```
배경 (checkout-api.ts 분석 + 2026-04-22 subtab-ia verify-zod tech-debt):
checkout-api.ts에 실제로 사용되지 않는 코드와 레거시 호환 필드가 누적되어 있음.
데드 코드는 유지 비용과 혼란을 증가시키므로 제거.

문제:
1. [데드 코드 🟡] getCheckoutSummary() — hardcoded zeros, 실 호출 없음
   apps/frontend/lib/api/checkout-api.ts:414-425:
   async getCheckoutSummary(): Promise<CheckoutSummary> {
     const response = await this.getCheckouts({ pageSize: 1 });
     return {
       total: response.meta.pagination.total,
       pending: 0,   // ← hardcoded
       approved: 0,  // ← hardcoded
       overdue: 0,   // ← hardcoded
       returnedToday: 0, // ← hardcoded
     };
   }
   실제 summary는 getCheckouts({ includeSummary: true })를 통해 result.meta.summary로 수신.
   getCheckoutSummary()는 CheckoutsContent의 liveSummary 쿼리가 이미 올바른 방법으로 대체.
   → 제거 대상. 제거 전 codebase 전체 사용처 확인 필수.

2. [레거시 필드 🟡] Checkout 인터페이스 레거시 호환 필드 쌍
   checkout-api.ts Checkout 인터페이스:
   - requesterId?: string  vs  userId?: string         (레거시)
   - destination: string  vs  location?: string        (레거시)
   - phoneNumber?: string  vs  contactNumber?: string  (레거시)
   - checkoutDate?: string  vs  startDate?: string     (레거시)
   - approverId?: string  vs  approvedById?: string    (레거시)
   ※ 백엔드가 이미 신규 필드명으로 통일된 경우, 프론트 레거시 필드는 제거 가능.
   제거 전: codebase 전체에서 레거시 필드명 사용처를 grep으로 확인.
   사용처가 있으면 신규 필드명으로 교체 후 레거시 제거.
   백엔드 응답에 레거시 필드가 없으면 레거시 필드 타입만 제거 (런타임 안전).

3. [verify-zod 🟢] verifyHandoverToken @UseInterceptors 누락
   apps/backend/src/modules/checkouts/checkouts.controller.ts:194:
   @ZodResponse 데코레이터 있으나 메서드 단위 @UseInterceptors(ZodSerializerInterceptor) 없음.
   → Swagger 스펙은 바뀌나 실제 직렬화 미적용.
   ZodSerializerInterceptor 글로벌 승격 전까지 메서드 단위 추가.
   참조: issueHandoverToken 메서드(같은 컨트롤러)의 기존 패턴.

조건: PR-2(backend) 이후 독립 진행. 다른 PR과 무관.

작업:

1. getCheckoutSummary() 제거
   사전 확인:
   grep -rn "getCheckoutSummary" apps/frontend/
   → 호출처 0이면 함수 제거.
   → 호출처 있으면 각 호출처를 getCheckouts({ includeSummary: true })로 교체 후 제거.
   제거 범위: checkout-api.ts:410-425의 함수 정의 블록만.
   CheckoutSummary 타입은 유지 (다른 곳에서 사용됨).

2. Checkout 인터페이스 레거시 필드 제거
   사전 확인 (각 레거시 필드별 grep):
   grep -rn "\.userId\b\|\.location\b\|\.contactNumber\b\|\.startDate\b\|\.approvedById\b" apps/frontend/ --include="*.ts" --include="*.tsx"
   → 각 사용처 목록 확보
   → 신규 필드명으로 교체 가능한 경우: 교체 후 레거시 필드 제거
   → 교체 불가능한 경우(백엔드 응답 포함): 레거시 필드 유지 + 주석 업데이트
   ※ 제거 여부는 실측 grep 결과에만 근거. 추측으로 제거 금지.

3. verifyHandoverToken @UseInterceptors 추가
   checkouts.controller.ts:194 근처 verifyHandoverToken 메서드에:
   @UseInterceptors(ZodSerializerInterceptor) 추가 (메서드 레벨 데코레이터)
   ZodSerializerInterceptor import 확인 (issueHandoverToken 메서드 상단에 이미 있으면 추가 불필요).
   변경 범위: 데코레이터 1줄 + import 1줄(필요 시).

SSOT 주의:
- CheckoutSummary 타입: checkout-api.ts에서 export됨 — 삭제 금지 (함수만 제거)
- 레거시 필드: grep 실측 기반 판단 (의존성 있으면 유지)
- ZodSerializerInterceptor: 기존 import 경로 재사용 (새 경로 불필요)
- 백엔드 컨트롤러: 변경 파일 수 최소화 (checkouts.controller.ts 1개만)

금지:
- 사용처 확인 없이 일괄 제거
- 레거시 → 신규 필드 일괄 rename (개별 확인 필수)

검증:
- pnpm --filter frontend exec tsc --noEmit
- pnpm --filter backend exec tsc --noEmit
- grep "getCheckoutSummary" apps/frontend/ → 0 hit (제거된 경우)
- grep "verifyHandoverToken" apps/backend/ | grep "UseInterceptors\|ZodResponse" → 양쪽 존재 확인
```

---

### 🟡 MEDIUM — PR-23: 마무리 정리 — NextStepPanel 플래그 상시화 + .env.example + focus-visible + i18n urgency (Mode 1)

```
배경 (2026-04-22 checkout-arch-pr3-11 tech-debt 4건):
PR-5에서 도입된 NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 피처 플래그가
Beta 2 세션 안정화 완료 후 제거 대상. 동시에 소규모 접근성/i18n 마무리 3건 처리.

트리거 조건: 이 PR은 다음 조건 모두 충족 후 진행:
- E2E 11 시나리오 2 세션 연속 안정 (PR-9 이후)
- NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true 개발 환경 1주 이상 운영

문제:
1. [플래그 제거 🟡] NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 코드 정리
   CheckoutDetailClient.tsx: showNextStepPanel 분기 + LegacyActionsBlock
   CheckoutGroupCard.tsx:    showNextStepPanel 분기 + LegacyInlineActions
   checkout-flags.ts (있다면): isNextStepPanelEnabled() 호출부 3곳

2. [접근성 🟢] workflow-panel.ts:49-52 blocked 버튼 focus-visible 누락
   WORKFLOW_PANEL_TOKENS.action.blocked에 FOCUS_TOKENS.classes.default 없음.
   primary 버튼에는 이미 존재.
   → blocked 버튼도 동일하게 focus-visible ring 추가.

3. [문서화 🟢] .env.example 플래그 문서화 누락
   .env.example, apps/frontend/.env.local.example 양쪽에
   # NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false 항목 누락.
   → 플래그 제거 시: 항목 삭제. 제거 전이면: 항목 추가.

4. [i18n 🟢] checkouts.json guidance.urgency.normal 빈 문자열
   apps/frontend/messages/ko/checkouts.json + en/checkouts.json:
   "guidance": { "urgency": { "normal": "" } }  ← 빈 문자열
   런타임 호출 코드가 현재 없으나 키 정의는 유지해야 함.
   → 적절한 fallback 텍스트 추가 또는 명시적 빈 문자열 유지 (의도 주석 추가).

조건: PR-5(플래그 도입) + E2E 11 시나리오 안정 확인 후. 트리거 조건 충족 전 대기.

작업:

1. NextStepPanel 플래그 상시화 (트리거 조건 충족 시)
   CheckoutDetailClient.tsx:
   - showNextStepPanel 분기 삭제
   - LegacyActionsBlock 컴포넌트 제거 (로컬 함수 또는 별도 파일 모두)
   - NextStepPanel 단일 렌더만 남김

   CheckoutGroupCard.tsx:
   - showNextStepPanel 분기 삭제
   - LegacyInlineActions 컴포넌트 제거
   - NextStepPanel compact variant 단일 렌더만 남김

   checkout-flags.ts (파일 존재 시):
   - isNextStepPanelEnabled() 함수 제거
   - 파일 전체 비면 파일 삭제
   - import 정리: 해당 파일 import하던 모든 곳에서 제거

   환경변수:
   - .env.local: NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true 줄 삭제
   - .env.local.example: 해당 줄 삭제
   - .env.example: 해당 줄 삭제 (있으면)

2. workflow-panel.ts blocked 버튼 focus-visible 추가
   apps/frontend/lib/design-tokens/components/workflow-panel.ts:49-52:
   WORKFLOW_PANEL_TOKENS.action.blocked 객체에:
   focusVisible: FOCUS_TOKENS.classes.default   ← 추가
   참조: 동일 파일의 primary 버튼 focusVisible 속성 (이미 존재하는 값 재사용).
   FOCUS_TOKENS import: @/lib/design-tokens에서 import (이미 있으면 추가 불필요).

3. .env.example 문서화 (트리거 조건 충족 전인 경우만)
   이 항목은 PR-23 트리거 전에 먼저 실행 가능:
   apps/frontend/.env.local.example 파일에 추가:
   # Next Step Panel 피처 플래그 (Beta 완료 후 제거 예정)
   # NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false
   .env.example에도 동일하게 추가.

4. guidance.urgency.normal i18n 처리
   apps/frontend/messages/ko/checkouts.json:
   "guidance": { "urgency": { "normal": "일반" } }  ← 빈 문자열 → 의미있는 값 또는
   또는 키 자체를 제거 (런타임 미사용이면 PR-8의 check-i18n-keys.mjs REQUIRED_KEYS에도 없으므로 제거 안전).
   apps/frontend/messages/en/checkouts.json 동일.
   선택: "일반" / "Normal" 추가 또는 키 제거 — 어느 쪽이든 빈 문자열 불허.

SSOT 주의:
- FOCUS_TOKENS: @/lib/design-tokens에서 import (하드코딩 금지)
- 레거시 컴포넌트 제거 시: 참조 import 흔적 0 확인 필수
- i18n 키 제거 시: check-i18n-keys.mjs REQUIRED_KEYS에서 해당 키도 제거

검증:
- pnpm --filter frontend exec tsc --noEmit
- grep "NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL\|showNextStepPanel\|LegacyActionsBlock\|LegacyInlineActions" apps/frontend/ → 0 hit (플래그 제거 시)
- grep "blocked" apps/frontend/lib/design-tokens/components/workflow-panel.ts → focusVisible 존재 확인
- grep '"normal": ""' apps/frontend/messages/ → 0 hit
```

---

### 🟢 LOW — PR-24: FSM 리터럴 7건 외과적 교체 — status === '<literal>' → CSVal.* (Mode 1)

```
배경 (2026-04-22 checkout-arch-pr3-11 + nc-p4-guidance tech-debt):
기존 파일 7곳에서 status 직접 리터럴 비교가 발견됨.
PR-2에서 적용한 canPerformAction/CSVal 패턴과 불일치.
self-audit ⑧ 체크 대상 (PR-11에서 게이트 추가된 패턴).

문제:
파일별 위반 목록 (grep으로 사전 확인 필수 — 리팩토링 이후 라인 번호 이동 가능):
1. apps/frontend/components/equipment/CreateEquipmentContent.tsx:115
   status === 'checked_out' 류 비교

2. apps/frontend/components/non-conformances/ResultSectionFormDialog.tsx:154
   status 리터럴 비교

3. apps/frontend/components/non-conformances/CreateNonConformanceForm.tsx:145
   status 리터럴 비교

4. apps/frontend/components/non-conformances/NCDocumentsSection.tsx:78
   status 리터럴 비교

5. apps/frontend/components/equipment/IntermediateCheckAlert.tsx:153
   status 리터럴 비교

6. apps/frontend/components/equipment/IntermediateCheckAlert.tsx:219
   status 리터럴 비교

7. apps/frontend/lib/utils/document-upload-utils.ts:59
   status 리터럴 비교

조건: PR-2(FSM/CSVal) 완료 후 독립 진행. 파일별 독립적이므로 순서 무관.

작업:

각 파일별 외과적 변경 (파일당 변경 최소화):

사전 확인 (실제 라인 번호 확인):
grep -n "status === '\|status !== '" apps/frontend/components/equipment/CreateEquipmentContent.tsx
grep -n "status === '\|status !== '" apps/frontend/components/non-conformances/ResultSectionFormDialog.tsx
(... 7개 파일 모두)

각 파일에서:
- 변경 전: if (checkout.status === 'checked_out')
- 변경 후: if (checkout.status === CSVal.CHECKED_OUT)
  또는: if (checkout.status === CheckoutStatusValues.CHECKED_OUT)
  (사용 중인 import alias 확인 후 일관성 유지)

CSVal import 추가 (각 파일에 없는 경우만):
import { CheckoutStatusValues as CSVal } from '@equipment-management/schemas';
또는 기존 import에서 CheckoutStatusValues 추가.

수술적 변경 원칙:
- 해당 리터럴 비교 라인만 변경. 인접 코드(에러 메시지, 타입, 주석 등) 변경 금지.
- 각 파일의 기존 import 스타일(named import alias 등) 유지.
- 빈 파일 생성 금지, 기존 파일 전면 교체 금지.

✅ 변경 대상:
- 각 파일의 리터럴 비교 라인 (최대 2줄/파일)
- import 추가 (필요 시, 파일당 1줄)

❌ 변경 금지:
- 인접 로직, 함수 시그니처, 타입 정의, 주석
- NC 도메인 로직 (NC 파일은 status 비교 의미 변경 없이 상수만 교체)

SSOT 주의:
- CheckoutStatusValues (CSVal): @equipment-management/schemas에서 import
- EquipmentStatus 리터럴이 있으면: EquipmentStatusValues 상수 사용 (별도 import)
- 파일별 실측 grep으로 정확한 라인 확인 후 Edit 실행 (라인 번호 추측 금지)

검증:
- pnpm --filter frontend exec tsc --noEmit
- node scripts/self-audit.mjs → 체크 ⑧ FSM 리터럴 위반 0
- 각 파일별: grep "status === '" <파일경로> → 0 hit (status 비교 패턴 제거 확인)
- pnpm --filter frontend run test (NC, equipment 단위 테스트 회귀 0)
```

---

> **PR 실행 순서 (의존성 그래프, 23 PR — PR-1·2 완료 ✅)**
>
> **Phase 1 (완료)**: PR-1 (FSM schemas) ✅ → PR-2 (backend) ✅
>
> **Phase 2&3 (PR-3·PR-8 병렬)**:
> - PR-3 (tokens) → PR-4 (NextStepPanel) → PR-5 (통합+flag) → PR-9 (E2E 11)
> - PR-8 (i18n 8NS) ──────────────────────────────────────→ PR-9, PR-12
>
> **Phase 4 (PR-3 이후, 병렬)**:
> - PR-6 (Stepper/MiniProgress) | PR-7 (HeroKPI/Stat) | PR-14 (WorkflowTimeline)
>
> **Phase 5**: PR-5 + PR-8 완료 → PR-12 (목록 IA + 서브탭)
>
> **Phase 6**: PR-12 완료 → PR-13 (YourTurnBadge + 그룹 카드)
>
> **Phase 7**: PR-4 완료 → PR-15 (모션 7종)
>
> **Phase 8**: PR-12 + PR-14 완료 → PR-16 (접근성)
>
> **Phase 9**: PR-5 + PR-7 + PR-14 완료 → PR-19 (Loading skeleton + Error)
>
> **Phase 10**: PR-5 + PR-8 완료 → PR-18 (Tooltip + Onboarding + Toast + Mobile)
>
> **Phase 11 (독립)**: PR-3 + NC e2e PASS → PR-10 (NC elevation 승격)
>
> **Phase 12 (독립)**: PR-2 이후 → PR-11 (Audit gate)
>
> **Phase 16 (최종)**: PR-3~PR-19 전부 완료 → PR-17 (최종 리뷰 + 번들 + Flag rollout)
>
> **Phase A (독립 — 즉시 진행 가능)**: PR-2 이후 → PR-20 (Backend 보안/SSOT)
>
> **Phase B (독립 — 즉시 진행 가능)**: PR-2 이후 → PR-22 (API 정리 + Zod)
>
> **Phase C (독립 — 즉시 진행 가능)**: PR-2 이후 → PR-24 (FSM 리터럴 7건)
>
> **Phase D**: PR-12(서브탭) 완료 후 → PR-21 (WCAG + QUERY_CONFIG + URL SSOT)
>
> **Phase E (조건부)**: PR-5 + E2E 2세션 안정 후 → PR-23 (플래그 상시화 + 마무리)
>
> ※ PR-3과 PR-8은 병렬 가능. PR-5·6·7·14는 PR-3 이후 병렬 가능.
> ※ PR-10은 별도 분리 PR (NC e2e PASS 선행). PR-11은 PR-2 이후 독립.
> ※ PR-20·PR-22·PR-24는 frontend PR과 완전 독립 → 즉시 실행 가능.
> ※ PR-23은 트리거 조건(E2E 2세션 안정) 충족 전 대기 필수.

---

