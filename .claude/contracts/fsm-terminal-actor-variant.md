# Contract: fsm-terminal-actor-variant

작성일: 2026-04-27
대상 exec-plan: `.claude/exec-plans/active/2026-04-27-fsm-terminal-actor-variant.md`
범위: tech-debt 1 (fsm-terminal-step-index-semantics) + tech-debt 2 (actor-variant-role-mapping-gap)

---

## MUST (루프 차단 — 모두 PASS해야 완료)

### 빌드/타입/테스트 게이트
- [ ] `pnpm tsc --noEmit` (root, all packages): 0 error
- [ ] `pnpm --filter @equipment-management/schemas run test` PASS
- [ ] `pnpm --filter backend run test` PASS
- [ ] `pnpm --filter frontend run test` PASS
- [ ] `pnpm lint` PASS (0 error, 0 신규 warning)

### Phase 1 — schemas SSOT
- [ ] `NextStepDescriptor` 인터페이스에 `reachedStepIndex: number` (readonly) 필드 존재
- [ ] `NextStepDescriptorSchema` Zod에 `reachedStepIndex: z.number().int().positive()` 포함, `safeParse` PASS
- [ ] `computeReachedStepIndex(status, purpose, terminatedFromStatus?)` 함수 export
- [ ] terminal 상태(`rejected`|`canceled`) + `terminatedFromStatus` 제공 시 `computeReachedStepIndex === computeStepIndex(terminatedFromStatus, purpose)`
- [ ] terminal 상태 + `terminatedFromStatus` null/undefined 시 `computeReachedStepIndex === computeStepIndex(status, purpose)` (fallback = 1)
- [ ] 비-terminal 상태에서 `computeReachedStepIndex === computeStepIndex(status, purpose)` (6+ 단위 테스트)
- [ ] `getNextStep` signature에 `terminatedFromStatus?: CheckoutStatus | null` 옵셔널 추가
- [ ] `getNextStep` 3개 return 분기(terminal early-return / no-candidate / 정상 candidate) 모두 `reachedStepIndex` 필드 채움
- [ ] `ActorVariant` 타입이 `@equipment-management/schemas`에서 export
- [ ] `roleToActorVariant(role: string): ActorVariant | null` 함수 export
- [ ] roleToActorVariant 매핑: `test_engineer→'requester'`, `quality_manager→'approver'`, `lab_manager→'approver'`, `technical_manager→'receiver'`, `system_admin→null`
- [ ] roleToActorVariant unknown role → `null` (단위 테스트)

### Phase 1 — DB 스키마
- [ ] `packages/db/src/schema/checkouts.ts` `checkouts` 테이블에 `terminatedFromStatus` 컬럼 정의 존재 (`varchar(50)`, nullable, `$type<CheckoutStatus>()`)

### Phase 2 — backend service
- [ ] `CheckoutsService.buildNextStep`이 `getNextStep` 호출 시 `terminatedFromStatus: checkout.terminatedFromStatus ?? null` 전달
- [ ] `CheckoutsService.reject` 메서드의 update payload에 `terminatedFromStatus: checkout.status` 포함
- [ ] `CheckoutsService.borrowerReject` 메서드의 update payload에 `terminatedFromStatus: checkout.status` 포함
- [ ] `CheckoutsService.cancel` 메서드의 update payload에 `terminatedFromStatus: checkout.status` 포함
- [ ] `approve`, `borrowerApprove`, `startCheckout`, `returnCheckout`, `approveReturn`, `rejectReturn`은 `terminatedFromStatus` 미설정 (비-terminal)

### Phase 3 — frontend NextStepPanel
- [ ] `apps/frontend/components/shared/NextStepPanel.tsx`의 로컬 `type ActorVariant` 정의 삭제, schemas에서 import
- [ ] `currentUserRole: _currentUserRole` underscore prefix 제거 → `currentUserRole` 사용
- [ ] `roleToActorVariant`를 schemas에서 import하여 사용 (frontend 로컬 매핑 금지)
- [ ] `isMyTurn` 로직 구현: `system_admin`은 `descriptor.availableToCurrentUser`로, 그 외는 `roleToActorVariant(role) === actorVariant`로
- [ ] `currentUserRole` undefined 시 `isMyTurn = false`
- [ ] 비-terminal + `isMyTurn === true` 시 `CHECKOUT_YOUR_TURN_BADGE_TOKENS`으로 "내 차례" 뱃지 렌더
- [ ] terminal descriptor(`descriptor.nextAction === null`) 분기에서 뱃지 렌더 없음
- [ ] 뱃지에 `role="status"` + `aria-label` 적용
- [ ] urgency에 따라 뱃지 variant 분기 (`normal`/`warning`/`critical`)

### Phase 3 — i18n parity
- [ ] `apps/frontend/messages/ko/checkouts.json` `fsm.yourTurn.label` 키 추가
- [ ] `apps/frontend/messages/en/checkouts.json` 동일 위치에 동일 키 추가 (parity)
- [ ] ko/en 양쪽 `fsm.yourTurn.ariaLabel` 키 존재

### SSOT 무결성
- [ ] `ActorVariant` 타입이 frontend에서 재정의되지 않음 (grep `type ActorVariant` → schemas 1곳만)
- [ ] `roleToActorVariant`가 frontend에서 재정의 없음 (import only)
- [ ] frontend가 UserRole 리터럴 분기로 actor variant 직접 결정하는 코드 없음

### 보안/CAS/캐시 무결성 (회귀 방지)
- [ ] reject/cancel/borrowerReject의 기존 CAS(`updateWithVersion`) 경로 유지, version 인자 보존
- [ ] 기존 audit 이벤트, 알림 이벤트 페이로드 변경 없음
- [ ] 기존 캐시 무효화 로직 변경 없음

---

## SHOULD (이연 허용, tech-debt-tracker 기록)

- [ ] backend E2E: rental pending→borrower_approve→reject 시 `meta.nextStep.reachedStepIndex === 2`
- [ ] backend E2E: rental approved→cancel 시 `reachedStepIndex === 3`
- [ ] backend E2E: non-rental pending→reject 시 `reachedStepIndex === 1`
- [ ] frontend E2E: technical_manager가 본인 팀 lender checkout에서 뱃지 visible
- [ ] frontend E2E: test_engineer가 본인 신청 approved checkout에서 뱃지 visible
- [ ] frontend E2E: quality_manager는 뱃지 미visible (조회 전용)
- [ ] frontend E2E: terminal(rejected/canceled) checkout에서 뱃지 미visible
- [ ] `CheckoutGroupHeader`, `CheckoutDetailClient`, `CheckoutListRow`에 `currentUserRole` prop wiring 완성
- [ ] compact variant 뱃지 정책 결정 (full/dot/border-only)
- [ ] `verify-checkout-fsm` 스킬에 신규 규칙 추가

---

## 검증 명령어

```bash
# 빌드/타입
pnpm tsc --noEmit

# 단위 테스트
pnpm --filter @equipment-management/schemas run test
pnpm --filter backend run test
pnpm --filter frontend run test

# lint
pnpm lint

# SSOT grep 검증 (수동)
grep -rn "type ActorVariant" apps/frontend packages/
grep -rn "roleToActorVariant" apps/frontend packages/

# DB 마이그레이션 (사용자 수동)
pnpm --filter backend run db:generate
pnpm --filter backend run db:migrate
```
