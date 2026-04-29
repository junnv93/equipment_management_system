---
slug: rental-approval-workflow-fix
mode: 2
created: 2026-04-28
domain: checkouts-fsm
exec_plan: .claude/exec-plans/active/2026-04-28-rental-approval-workflow-fix.md
---

# Rental Checkout Approval Workflow Fix — Contract

## Goals (high-level outcome)

- 평택랩 TM(lender)이 `pending` 상태의 rental checkout 에서 잘못된 액션 버튼(`approve` / `borrower_approve`) 를 클릭해 400/403 받는 회귀가 0건이다.
- 수원랩 TM(borrower)만이 `pending` 상태에서 `borrower_approve` / `borrower_reject` 액션을 활성 버튼으로 본다.
- 평택랩 TM(lender)은 `borrower_approved` 상태에서만 `approve` / `reject` 액션을 활성 버튼으로 본다.
- 모든 checkout 응답(list + detail + pending-checks) 에 `meta.availableActions` + `meta.nextStep` 가 포함된다 (FSM drift warning 0).
- `errors.UNKNOWN_ERROR.actionLabel` 키가 ko/en 양쪽에 존재하며, 모든 `getLocalizedErrorInfo` 대상 EquipmentErrorCode 의 `actionLabel` parity 가 보장된다 (MISSING_MESSAGE warning 0).
- SSOT 준수: 새 하드코딩 0건, role 리터럴(`'technical_manager'` 등) 분기 0건, FSM transition 권위는 `packages/schemas/src/fsm/checkout-fsm.ts` 단일.
- Backend defense-in-depth 보존: `enforceScopeForBorrower` / `enforceScopeFromCheckout` / `assertFsmAction` 가드가 그대로 1차 게이트로 작동.

---

## MUST criteria (loop blockers)

- id: must-1
  title: tsc --noEmit BE+FE pass
  cmd: |
    cd /home/kmjkds/equipment_management_system && \
      pnpm --filter backend exec tsc --noEmit && \
      pnpm --filter frontend exec tsc --noEmit
  why: 모든 시그니처 변화 (CheckoutActorContext 합류, CheckoutAvailableActions 확장) 가 BE/FE 양쪽 동기화되었음을 검증.

- id: must-2
  title: schemas FSM unit + table tests pass
  cmd: |
    cd /home/kmjkds/equipment_management_system && \
      pnpm --filter @equipment-management/schemas run test
  why: 280-row FSM table test 회귀 가드 + 신규 actorCtx 매트릭스.

- id: must-3
  title: backend checkouts module tests pass
  cmd: |
    cd /home/kmjkds/equipment_management_system/apps/backend && \
      npx jest --testPathPattern=checkouts --runInBand
  why: |
    - `findAll` 응답에 meta 항상 포함 검증
    - `calculateAvailableActions` lender/borrower team identity 분기 검증
    - `approve/borrowerApprove` 의 FSM + scope guard 회귀 가드
    - `getPendingChecks(Count)` 의 borrower pending 포함 (G9)

- id: must-4
  title: backend approvals module tests pass
  cmd: |
    cd /home/kmjkds/equipment_management_system/apps/backend && \
      npx jest --testPathPattern=approvals --runInBand
  why: outgoingCheckouts 카운트 변경(Open Q1 결정) 후 회귀 가드.

- id: must-5
  title: backend lint pass
  cmd: |
    cd /home/kmjkds/equipment_management_system && pnpm --filter backend run lint

- id: must-6
  title: frontend lint pass
  cmd: |
    cd /home/kmjkds/equipment_management_system && pnpm --filter frontend run lint

- id: must-7
  title: i18n parity ko/en 100%
  cmd: |
    cd /home/kmjkds/equipment_management_system && \
      node scripts/check-i18n-call-sites.mjs --all
  why: |
    - errors.UNKNOWN_ERROR.actionLabel ko/en 양쪽 존재
    - checkouts.fsm.blocked.actor_team ko/en 양쪽 존재
    - checkouts.fsm.hint.pendingBorrowerWait ko/en 양쪽 존재
    - getLocalizedErrorInfo 대상 모든 코드의 actionLabel parity

- id: must-8
  title: 4 dev-log symptoms 회귀 테스트 모두 PASS
  desc: |
    Backend integration 또는 frontend e2e 테스트로 다음 4 케이스 모두 검증:
    (a) 평택랩(lender) TM 이 `pending+rental` 에 `/approve` 호출 → 400 INVALID_TRANSITION 유지
        (방어선 보존) — UI 가 더 이상 이 endpoint 를 발사하지 않음을 별도 검증
    (b) 평택랩(lender) TM 이 `pending+rental` 에 `/borrower-approve` 호출 → 403 SCOPE_MISMATCH 유지
        (방어선 보존) — UI 의 `borrower_approve` 버튼이 disabled + actor_team 사유 표시 검증
    (c) 모든 list/detail 응답에 meta.availableActions / meta.nextStep 가 동봉되어
        FSM drift warning 0 (`apps/frontend/lib/api/checkout-api.ts:warnMetaDrift` 미실행)
    (d) errors.UNKNOWN_ERROR.actionLabel 키가 ko + en 양쪽에 존재
        (jest snapshot 또는 jq schema validate)

- id: must-9
  title: verify-checkout-fsm PASS (Step 38-40 신규 포함)
  desc: |
    - canPerformAction / getNextStep 호출처가 actorCtx 전달 일관성
    - calculateAvailableActions 의 모든 boolean 이 actorCtx 경유
    - findAll 결과 매핑에 meta 항상 포함
    - approvals-api outgoing dispatch 가 server-meta 또는 status/purpose 분기

- id: must-10
  title: verify-ssot PASS — role 리터럴 및 하드코딩 0
  desc: |
    - role string literal ('technical_manager', 'test_engineer' 등) 분기 0건
    - hardcoded action string 외부 dispatch 0건 (모두 CheckoutAction 타입 + meta.availableActions 경유)
    - FSM transition 룰 재구현 0 — packages/schemas/src/fsm 외 다른 위치 0

- id: must-11
  title: SECURITY — backend FSM/scope guards 강도 유지 (defense in depth 보존)
  desc: |
    - enforceScopeForBorrower / enforceScopeFromCheckout 시그니처/로직 변경 0
    - assertFsmAction 호출이 모든 transition endpoint 에 보존 (approve/borrowerApprove/reject/start/return/cancel/conditionCheck)
    - UI 사전 차단은 보조 — 권한 체계의 1차 게이트가 아님
    - fail-close 순서 (scope → FSM → domain) 모든 endpoint 에서 일관

- id: must-12
  title: verify-cas PASS — CAS coherence 보존
  desc: |
    - approve/borrowerApprove/reject 모두 updateWithVersion 경유
    - onVersionConflict 훅이 detail 캐시 invalidate
    - useOptimisticMutation 의 setQueryData onSuccess 0건

- id: must-13
  title: verify-i18n PASS — error.actionLabel parity 신규 step 포함

- id: must-14
  title: review-architecture (post-implementation) — Critical 0건
  desc: |
    DB → Service → Controller → DTO → Hook → Component → Cache 7-layer 트레이스에서
    Critical 지적 0건. Major/Minor 는 SHOULD 로 추적.

---

## SHOULD criteria (track but don't block)

- title: WCAG 2.4.6 — disabled 액션 버튼 aria-label + 사유 SR 텍스트 (`actor_team` blocked)
- title: NextStepPanel 의 `blockingReason='actor_team'` 분기 시 i18n key parity (ko/en) 통과
- title: 새로 user-facing 표시되는 모든 문자열 (특히 fsm.hint.pendingBorrowerWait, fsm.blocked.actor_team) ko + en 동시 추가
- title: NextStepPanel 가 FSM descriptor 만 사용 (role-based 분기 0건)
- title: 성능 — list 응답 페이로드 증가량 측정 후 < 5KB / 50 row (meta 추가 영향)
- title: cache 이벤트 — 상태 전이 시 기존 invalidateAfterApproval / APPROVAL_KEYS 패턴 유지, 추가 emit 불필요
- title: pre-push hook (tsc + backend test + frontend test) 통과 — push 시 자동 검증
- title: bundle gate baseline 유지 (descriptor schema 확장은 미미)
- title: Open Q1 (OUTGOING rental+pending 처리) 결정 사항이 README/도메인 문서에 기록됨
- title: 8단계 rental e2e 시나리오 1회 통과 (수원랩 TE 신청 → 수원랩 TM borrower_approve → 평택랩 TM approve → lender_check → borrower_receive → mark_in_use → borrower_return → lender_receive → submit_return → approve_return)
- title: 평택랩 TM 이 pending 상세에서 borrower_approve 버튼 disabled + 사유 표시 e2e 검증

---

## Out of Scope

- approval workflow 외 다른 도메인 (calibration plans, equipment imports 등) 의 actor identity 처리는 별도 세션.
- mobile-specific UX (compact variant 외) 변경 없음.
- 새로운 audit event suffix 추가 없음 (기존 `borrower_approved` 등 보존).
- DB 마이그레이션 없음 (스키마 변경 없음 — checkouts 테이블 그대로).

---

## Risk → Mitigation

| 위험 | 완화 |
|------|------|
| canPerformAction 시그니처 확장 시 280 row table test 회귀 | optional 파라미터 → undefined 시 기존 동작 보장. 신규 actorCtx 매트릭스는 별도 케이스. |
| findAll 페이로드 ↑ | 측정 후 SHOULD 통과 — 50 row 당 < 5KB. cache TTL 동일. |
| approvals OUTGOING 카운트 변화로 KPI 차이 | Open Q1 결정 후 마이그레이션 노트 작성. |
| useCheckoutNextStep client-side fallback 이 actorCtx 없이 동작 | hook 시그니처 확장 → useSession.user.teamId + checkout.lenderTeamId/requesterTeamId 자동 주입. |
| eval 서클이 재돌면서 schema/test fixture 분기 폭증 | schemas 테스트 fixture descriptor-table.ts 는 현 baseline 유지 (actorCtx 없는 케이스 = 기존). 신규 fixture 별도. |

---

## Reference

- Exec plan: `.claude/exec-plans/active/2026-04-28-rental-approval-workflow-fix.md`
- FSM SSOT: `packages/schemas/src/fsm/checkout-fsm.ts`
- BE service: `apps/backend/src/modules/checkouts/checkouts.service.ts`
- FE detail: `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`
- FE row: `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
- FE approvals: `apps/frontend/lib/api/approvals-api.ts`
- i18n: `apps/frontend/messages/{ko,en}/{errors,checkouts}.json`
- Skills: `.claude/skills/{verify-checkout-fsm,verify-i18n,verify-ssot}/SKILL.md`
