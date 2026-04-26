# Contract — Tech-debt Batch 0426

> 작성: 2026-04-26
> 연결 플랜: `.claude/exec-plans/active/2026-04-26-tech-debt-batch-0426.md`
> 모드: Harness Mode 2 (architectural batch)

## MUST (모두 PASS)

### M1 — Backend TypeScript clean
```bash
pnpm --filter backend run tsc --noEmit
```
종료 코드 0. 새로운 type error 0건.

### M2 — Frontend TypeScript clean
```bash
pnpm --filter frontend run tsc --noEmit
```
종료 코드 0. 새로운 type error 0건.

### M3 — Backend unit tests PASS
```bash
pnpm --filter backend run test
```
종료 코드 0. checkouts.service.spec.ts 통과. 기존 테스트 회귀 0건.

### M4 — Phase 1 Safety 구현 검증

**M4.1 — P1-A 5 이벤트 등록** (모두 count >= 1):
```bash
grep -c "SOFTWARE_VALIDATION_SUBMITTED\]:" apps/backend/src/common/cache/cache-event.registry.ts
grep -c "SOFTWARE_VALIDATION_APPROVED\]:" apps/backend/src/common/cache/cache-event.registry.ts
grep -c "SOFTWARE_VALIDATION_QUALITY_APPROVED\]:" apps/backend/src/common/cache/cache-event.registry.ts
grep -c "SOFTWARE_VALIDATION_REJECTED\]:" apps/backend/src/common/cache/cache-event.registry.ts
grep -c "TEST_SOFTWARE_REVALIDATION_REQUIRED\]:" apps/backend/src/common/cache/cache-event.registry.ts
```
각각 1 이상 출력 → PASS. 0 → FAIL.

**M4.2 — P1-B Stale CAS 회피** (fetchCasVersion 또는 inline fresh fetch 패턴):
```bash
grep -c "fetchCasVersion\|await checkoutApi.getCheckout(checkout.id)" \
  apps/frontend/components/checkouts/CheckoutDetailClient.tsx
```
8 이상 → PASS. 7 이하 → FAIL (8개 mutation 중 누락 존재).

**M4.3 — P1-C WorkflowTimeline 접근성**:
```bash
grep -A 3 "TooltipTrigger asChild" apps/frontend/components/checkouts/WorkflowTimeline.tsx \
  | grep -E "tabIndex|<button"
```
매칭 존재 → PASS. 없음 → FAIL.

### M5 — Phase 2 SSOT 위반 모두 수정

```bash
# P2-A: USER_SELECTABLE_CHECKOUT_PURPOSES 사용 확인
grep -c "USER_SELECTABLE_CHECKOUT_PURPOSES" \
  apps/frontend/components/checkouts/CheckoutsContent.tsx          # >= 1
! grep -E "\['calibration'.*'repair'.*'rental'\]" \
  apps/frontend/components/checkouts/CheckoutsContent.tsx

# P2-B: DEFAULT_PAGE_SIZE 사용 + 매직넘버 제거
grep -c "DEFAULT_PAGE_SIZE" apps/frontend/components/checkouts/OutboundCheckoutsTab.tsx  # >= 1
! grep "pageSize ?? 10" apps/frontend/components/checkouts/OutboundCheckoutsTab.tsx

# P2-C: overdueClear 아이콘 SSOT 등록
grep -c "overdueClear:" apps/frontend/lib/design-tokens/components/checkout-icons.ts   # >= 1

# P2-D: urgencyBadge 섹션 등록 + YourTurnBadge 로컬 맵 제거
grep -c "urgencyBadge:" apps/frontend/lib/design-tokens/components/checkout-icons.ts   # >= 1
! grep "URGENCY_ICON" apps/frontend/components/checkouts/YourTurnBadge.tsx

# P2-E: CHECKOUT_DETAIL 프리셋 등록
grep -c "CHECKOUT_DETAIL:" apps/frontend/lib/api/query-config.ts  # >= 1
grep -c "QUERY_CONFIG.CHECKOUT_DETAIL" apps/frontend/components/checkouts/CheckoutDetailClient.tsx  # >= 1

# P2-F: href 하드코딩 제거
grep -c "FRONTEND_ROUTES" apps/frontend/components/checkouts/CheckoutDetailClient.tsx   # >= 1
! grep -E '`/equipment/\$\{' apps/frontend/components/checkouts/CheckoutDetailClient.tsx

# P2-G: staggerItem SSOT
grep -c "MOTION_TOKENS.stagger.comfortable" apps/frontend/lib/design-tokens/motion.ts  # >= 1
! grep -E "index \* 60[^0-9]" apps/frontend/lib/design-tokens/motion.ts

# P2-H: Layer 1 직접 import 0건
! grep -E "from '\.\./primitives'" apps/frontend/lib/design-tokens/components/dashboard.ts
! grep -E "from '\.\./primitives'" apps/frontend/lib/design-tokens/components/header.ts
! grep -E "from '\.\./primitives'" apps/frontend/lib/design-tokens/components/sidebar.ts

# P2-I: role 리터럴 → Permission
grep -cE "Permission\.APPROVE_EQUIPMENT_IMPORT|can\(Permission" \
  apps/frontend/components/equipment-imports/EquipmentImportDetail.tsx   # >= 1
```

### M6 — isNextStepPanelEnabled 호출부 0건

```bash
COUNT=$(grep -rn "isNextStepPanelEnabled" apps/frontend 2>/dev/null | wc -l)
test "$COUNT" -eq 0
```
PASS: COUNT=0. FAIL: COUNT>=1.

### M7 — RentalFlowInline + legacy NextStepPanel 완전 제거

```bash
COUNT_A=$(grep -rn "RentalFlowInline" apps/frontend 2>/dev/null | wc -l)
test "$COUNT_A" -eq 0

COUNT_B=$(grep -rn "RENTAL_FLOW_INLINE_TOKENS" apps/frontend 2>/dev/null | wc -l)
test "$COUNT_B" -eq 0

# legacy 파일 삭제 검증
test ! -f apps/frontend/components/checkouts/NextStepPanel.tsx

# legacy import 0건
COUNT_C=$(grep -rn "from '@/components/checkouts/NextStepPanel'" apps/frontend 2>/dev/null | wc -l)
test "$COUNT_C" -eq 0

# i18n rentalFlow 키 0건
COUNT_D=$(grep -rn '"rentalFlow"' apps/frontend/messages 2>/dev/null | wc -l)
test "$COUNT_D" -eq 0
```

### M8 — Frontend build PASS

```bash
pnpm --filter frontend run build
```
종료 코드 0. webpack/turbopack 에러 0건.

---

## SHOULD (가급적 PASS)

### S1 — Phase 3 dead code / type safety

S1.1 — P3-A approverId 파라미터 제거:
```bash
! grep -E "approverId: string" apps/frontend/lib/api/approvals-api.ts
```

S1.2 — P3-B Checkout.user.department optional:
```bash
grep -E "department\?: string" apps/frontend/lib/api/checkout-api.ts   # >= 1
```

S1.3 — P3-C WorkflowTimeline Suspense 단순화:
```bash
# 0건 또는 1건 (이중 래핑 제거)
SUSP=$(grep -c "Suspense" apps/frontend/components/checkouts/WorkflowTimeline.tsx)
test "$SUSP" -le 1
```

S1.4 — P3-D nextStepIndex +1 오프셋 제거:
```bash
! grep "nextStepIndex={nextStepDescriptor.currentStepIndex + 1}" \
  apps/frontend/components/checkouts/CheckoutDetailClient.tsx
```

S1.5 — P3-E rejectReturn error callback 초기화:
```bash
grep -A 20 "rejectReturnMutation" apps/frontend/components/checkouts/CheckoutDetailClient.tsx \
  | grep "setReturnRejectReason('')"   # >= 1
```

S1.6 — P3-F aria-label i18n:
```bash
grep "count\.unit" apps/frontend/messages/ko/checkouts.json   # >= 1
grep "count\.unit" apps/frontend/messages/en/checkouts.json   # >= 1
! grep -E '`?\$\{.*\}건' apps/frontend/components/checkouts/OutboundCheckoutsTab.tsx
```

### S2 — Phase 5 borrower 테스트 4 케이스

```bash
grep -c "describe.*borrowerApprove\|describe.*borrowerReject" \
  apps/backend/src/modules/checkouts/checkouts.service.spec.ts   # >= 2
grep -c "BORROWER_APPROVE_RENTAL_ONLY\|BORROWER_TEAM_ONLY" \
  apps/backend/src/modules/checkouts/checkouts.service.spec.ts   # >= 2
pnpm --filter backend run test -- --testPathPattern checkouts.service.spec
```

### S3 — Phase 6 design tokens

S3.1 — P6-A skeleton 토큰:
```bash
! grep "bg-primary/10" apps/frontend/components/checkouts/CheckoutListSkeleton.tsx
```

S3.2 — P6-B Error 배너 공통 컴포넌트:
```bash
grep -c "InlineErrorBanner\|CHECKOUT_ERROR_BANNER_TOKENS" \
  apps/frontend/components/checkouts/HeroKPIError.tsx             # >= 1
grep -c "InlineErrorBanner\|CHECKOUT_ERROR_BANNER_TOKENS" \
  apps/frontend/components/checkouts/NextStepPanelError.tsx       # >= 1
grep -c "InlineErrorBanner\|CHECKOUT_ERROR_BANNER_TOKENS" \
  apps/frontend/components/checkouts/WorkflowTimelineError.tsx    # >= 1
```

### S4 — verify-implementation harness PASS

```bash
# verify-ssot + verify-hardcoding + verify-i18n 핵심 step 실행
# 스킬이 run.mjs를 제공하는 경우:
# node .claude/skills/verify-implementation/run.mjs
```
SSOT 위반 0건 (새로 도입된 위반 없음), 하드코딩 0건, i18n 패리티 PASS.

---

## 평가 절차 (Evaluator)

1. M1~M3 순차 실행. 하나라도 실패 시 즉시 NO-GO
2. M4~M7 grep 검증 일괄. 0건이어야 할 항목이 1건이라도 있으면 NO-GO
3. M8 build 실행. 에러 시 NO-GO
4. SHOULD 항목 평가 — S1/S2/S3/S4 각각 PASS/FAIL 기록
5. 종합 판정:
   - **GO**: M1~M8 모두 PASS + SHOULD >= 3/4
   - **PARTIAL**: M1~M8 PASS + SHOULD < 3/4 — 잔여 SHOULD를 tech-debt-tracker에 등록 후 commit
   - **NO-GO**: M 중 1건이라도 FAIL

## 참고 SSOT 헬퍼 위치

| 헬퍼 | 위치 |
|---|---|
| `USER_SELECTABLE_CHECKOUT_PURPOSES` | `@equipment-management/schemas` |
| `DEFAULT_PAGE_SIZE` | `@equipment-management/shared-constants` |
| `CHECKOUT_ICON_MAP` | `apps/frontend/lib/design-tokens/components/checkout-icons.ts` |
| `QUERY_CONFIG.*` | `apps/frontend/lib/api/query-config.ts` |
| `FRONTEND_ROUTES.*` | `packages/shared-constants/src/frontend-routes.ts` |
| `MOTION_TOKENS.stagger.*` | `apps/frontend/lib/design-tokens/motion.ts` |
| `Permission.*` | `@equipment-management/shared-constants` |
| `CACHE_INVALIDATION_REGISTRY` | `apps/backend/src/common/cache/cache-event.registry.ts` |
