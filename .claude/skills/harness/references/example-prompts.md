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
     userRole: UserRole
   ): NextStepDescriptor
   export function canPerformAction(
     checkout: Pick<{status: CheckoutStatus; purpose: CheckoutPurpose}>,
     action: CheckoutAction,
     role: UserRole
   ): { ok: true } | { ok: false; reason: 'invalid_transition' | 'permission' }
   export function computeStepIndex(status: CheckoutStatus, purpose: CheckoutPurpose): number
   export function computeTotalSteps(purpose: CheckoutPurpose): number
   export function computeUrgency(checkout: Pick<{status: CheckoutStatus; dueAt?: string | null}>): Urgency

   불변식 검증 (module-level 실행):
   function assertFsmInvariants(transitions: readonly TransitionRule[]): void
   - 모든 CheckoutStatus(13개)가 from 또는 terminal로 등장
   - rejected/canceled/return_approved는 out-edge 0
   - rental 경로 순회 가능성 검증
   - 순환 없음(DAG)
   - 모든 rule의 requires Permission이 Permission enum에 존재

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
   const check = canPerformAction(checkout, 'approve', req.user.role);
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
   
   private calculateAvailableActions(checkout: Checkout, role: UserRole): CheckoutAvailableActions {
     const rules = getTransitionsFor(checkout.status, checkout.purpose);
     const allowed = new Set(
       rules.filter(r => hasPermission(role, r.requires)).map(r => r.action)
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
   
   private buildNextStep(checkout: Checkout, role: UserRole): NextStepDescriptor {
     return getNextStep(checkout, role);
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
     nextActor: getNextStep(updatedCheckout, systemRole).nextActor,  // 다음 행위자
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
- hasPermission은 @equipment-management/shared-constants에서 import
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
