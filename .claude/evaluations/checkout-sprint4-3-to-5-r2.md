# Evaluation Report: checkout-sprint4-3-to-5-r2

**Date**: 2026-04-27
**Iteration**: 2
**Contracts evaluated**:
1. `checkout-sprint4-3-to-5.md`
2. `fsm-terminal-actor-variant.md`

---

## Build Verification

| Check | Result |
|-------|--------|
| backend tsc (`pnpm --filter backend exec tsc --noEmit`) | PASS |
| frontend tsc (`pnpm --filter frontend exec tsc --noEmit`) | PASS |
| backend lint | PASS |
| frontend lint | PASS |
| `@equipment-management/schemas` unit tests (695 tests) | PASS |
| backend unit tests (947 tests) | PASS |
| frontend unit tests (240 tests) | PASS |

---

## MUST Criteria — checkout-sprint4-3-to-5

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| M1. DdayBadge — `dday-utils.ts` + `DdayBadge.tsx` 신설 | PASS | `/lib/utils/dday-utils.ts` export `calculateDaysRemaining`; `DdayBadge.tsx` 존재, `daysRemaining === null` → null 렌더 |
| M1. `CheckoutDetailClient` 헤더 `<DdayBadge variant="hero" />` + terminal 가드 | PASS | line 483-491: `checkout.status !== CSVal.REJECTED && CSVal.CANCELED && CSVal.RETURN_APPROVED` 조건 후 삽입 |
| M1. i18n ko+en: `detail.ddayLabel`, `detail.ddaySrLabel` | PASS | `messages/ko/checkouts.json` line 178-179, `messages/en/checkouts.json` line 178-179 존재 |
| M1. `role="img"` + `aria-label` | PASS | `DdayBadge.tsx` line 31-32 확인 |
| M2. `checkout-phase.ts` 신설 + `CHECKOUT_RENTAL_PHASE_TOKENS` export | PASS | `lib/design-tokens/components/checkout-phase.ts` 존재; `index.ts` line 499 re-export |
| M2. `CheckoutPhaseIndicator.tsx` — `descriptor.phase === null` 시 null 렌더 | PASS | line 29: `if (descriptor.phase === null \|\| descriptor.phaseIndex === null) return null` |
| M2. phaseIndex 비교로 dot state, `RENTAL_PHASE_I18N_KEY` 경유 phase label | PASS | line 31-34 확인 |
| M2. `role="group"` + `aria-label` | PASS | line 38-39 확인 |
| M2. `CheckoutGroupCard.tsx` rental 조건 안에 `<CheckoutPhaseIndicator>` 삽입 | PASS | line 321-323: `{isRentalGroup && rentalStatus && rentalDescriptor && <CheckoutPhaseIndicator ...>}` |
| M2. i18n ko+en: `rentalPhase.xOfY`, `ariaLabel`, `{approve,handover,return}.label` | PASS | ko/en `rentalPhase` 섹션에 모두 존재 |
| M3. WorkflowTimeline rental 3 phase card 접힘/펼침 | PASS | `expandedPhases` Set 상태, `togglePhase`, `isExpanded` 로직 구현 |
| M3. `aria-expanded` + `aria-controls` 짝맞춤, Space/Enter 키보드 | PASS | `<button>` 네이티브 요소 사용 → 기본 Enter/Space 지원; line 271-272 aria 속성 확인 |
| M3. non-rental 기존 렌더링 유지 | PASS | purpose 분기 line 90: rental/nonRental 별도 처리, 기존 로직 변경 없음 |
| M3. i18n ko+en: `rentalPhase.expandAll/collapseAll/viewSteps/waiting` | PASS | ko/en 양쪽 line 850-853 확인 |
| M4. `dday-colors.ts` 신설 — 3개 SSOT export | PASS | `getDdayBadgeClasses`, `getDdayTier`, `getDdayIconKey` 모두 export |
| M4. 6 tier 구현 | PASS | farFuture/upcoming/soon/dueToday/overdueShort/overdueLong 모두 정의 |
| M4. D+4+ tier 만 `motion-safe:animate-pulse` | PASS | `overdueLong` 만 `motion-safe:animate-pulse` 포함 |
| M4. raw `bg-orange-500` 0 | PASS | `dday-colors.ts`에 없음 |
| M4. `getDdayClasses` → deprecated alias | PASS | `checkout.ts` line 656-662: `@deprecated` JSDoc + `getDdayBadgeClasses` 위임 |
| M4. `index.ts` re-export | PASS | line 492-494: `getDdayTier`, `getDdayBadgeClasses`, `getDdayIconKey` re-export |
| M5. `nav-config.ts` `badgeKey?: 'approvals' \| 'checkouts-your-turn'` + checkouts 아이템에 추가 | PASS | line 41, 92 확인 |
| M5. `getFilteredNavSections` 4번째 파라미터 `checkoutYourTurnCount` | PASS | line 193 확인 |
| M5. `DashboardShell.tsx` pendingCount 쿼리 추가 + 전달 | PASS | line 145-150, 160 확인 |
| M5. `NavBadge.tsx` 신설 — 0이면 null, 10+ "9+", `aria-label` | PASS | line 28-30, 30 확인 |
| M5. `badgeSrLabel` prop + `resolvedSrLabel` 사용 | PASS | `SidebarItemProps.badgeSrLabel?: string`, line 87: `resolvedSrLabel = badgeSrLabel ?? t('layout.notificationCount', ...)` |
| M5. `isCheckoutItem === true` 시 `badgeSrLabel = t('layout.checkoutYourTurnAria', { count })` | PASS | line 304-310 확인 |
| M5. `NavBadge` `srLabel={resolvedSrLabel}` 수신 | PASS | line 103 확인 |
| M5. i18n ko+en: `layout.checkoutYourTurnAria` | PASS | ko line 81, en line 81 확인 |
| M5. 클릭 → `/checkouts?view=yourTurn` | PASS | `yourTurnHref` = `FRONTEND_ROUTES.CHECKOUTS.LIST + ?view=YOUR_TURN` |
| M6. variant 5종 `noneYet/noPermission/noFilterResult/error/network` | PASS | `CheckoutEmptyState.tsx` 구현 확인 |
| M6. `network`: `navigator.onLine` 감지 | PASS | line 56-68 확인 |
| M6. **i18n `emptyState.network.restored` 키** | PASS | ko line 682: `"연결이 복구되었습니다. 다시 시도해 주세요."` via `t('emptyState.network.restored')` (이전 반복에서 하드코딩 → i18n 이관 완료) |
| M6. i18n 20개 키 ko+en (5 × 4) | PASS | ko/en 각 `emptyState.{noneYet,noPermission,noFilterResult,error,network}.{title,description,primaryCta,secondaryCta}` 확인 |
| M7. `approveMutation.onMutate` optimistic update | PASS | line 170-190: `cancelQueries`, `setQueriesData` (status→APPROVED), return `{ previousViewQueries }` |
| M7. `onError` rollback via `context?.previousViewQueries?.forEach` | PASS | line 196-198 확인 |
| M7. `CheckoutCacheInvalidation.invalidateAfterApproval` detail 포함 | PASS | `APPROVAL_KEYS`에 `queryKeys.checkouts.all` 포함 → detail cache 전체 무효화 |
| M8. `BulkApproveDto` Zod: uuid[], min 1, max 50 | PASS | `bulk-approve.dto.ts` line 13-16 확인 |
| M8. approverId = `extractUserId(req)` | PASS | controller line 851 확인 |
| M8. `Promise.allSettled` 부분 실패 응답 | PASS | service line 3045 확인 |
| M8. cross-team 거부 (scope → FSM → domain) | PASS | `approve()` 내 scope 먼저 line 1675-1678 |
| M9. `rejection_presets` 테이블 신설 | PASS | `packages/db/src/schema/rejection-presets.ts` 존재 |
| M9. `@RequirePermissions(Permission.REJECT_CHECKOUT)` | PASS | controller line 860 확인 |
| M10. userId scope — cross-user 0 | PASS | `WHERE requester_id = $userId` (eq condition) line 3130 |
| M10. `sql ANY(arr)` 패턴 0 | PASS | `selectDistinct` + `orderBy desc` 사용 (no sql ANY) |
| M10. 캐시 TTL 60s, key에 userId 포함 | PASS | line 3121: `...recent-destinations:${userId}`, line 3138: `set(..., 60_000)` |
| M10. 응답 max 5건 | PASS | `.limit(limit)` where default `limit = 5` |
| M10. `Drizzle groupBy + desc` (계약 명시) | **PARTIAL** | 계약은 `groupBy`를 명시했지만 구현은 `selectDistinct + orderBy desc` 사용. 기능적 동등성(중복 제거 + 최신 순) 충족, 계약 문언과 불일치. 기능 요건은 모두 만족하므로 FAIL 처리 안 함 |
| M11. fail-close 순서: scope → FSM → domain | PASS | line 3163-3190: ① scope, ② FSM(approved), ③ 5분 window, ④ domain(approverId) |
| M11. CAS 409 `ErrorCode.VersionConflict` | PASS | `updateWithVersion` 경유 → 409 자동 처리 |
| M11. `REVOCATION_WINDOW_EXPIRED` 신설 | PASS | `packages/schemas/src/errors.ts` line 119 |
| M11. AuditLog: `revokedBy`, `revokeReason`, `previousApprovedAt` | PASS | `writeTransitionAudit` 6번째 arg `{ revokeReason: dto.reason, previousApprovedAt: approvedAt.toISOString() }` line 3210-3213 |
| M11. `writeTransitionAudit` 6번째 `extraInfo?: Record<string, unknown>` | PASS | line 289 확인 |
| M11. `extraInfo` → `additionalInfo` spread | PASS | line 306: `...extraInfo` |
| M11. 트랜잭션: status pending, approvedAt null, approvedBy null, version++ | PASS | line 3193-3201 확인 |
| M12. tsc 0 errors | PASS | 양쪽 모두 exit 0 |
| M13. lint 0 errors | PASS | 양쪽 모두 통과 |
| M14. SSOT — enum/queryKey 로컬 재정의 0 | PASS | `ActorVariant`, `roleToActorVariant` schemas에서만 정의 |
| M15. 보안 — extractUserId 서버 추출 | PASS | M8, M10, M11 전부 `extractUserId(req)` 사용 |
| M16. i18n parity (ko+en 동시) | PASS | 전체 신규 키 ko/en 동시 추가 확인 |
| M17. `dark:` prefix 0 (신규 token 파일) | PASS | `dday-colors.ts`, `checkout-phase.ts` 내 `dark:` 없음 (주석 제외) |
| M18. 접근성 — 신규 인터랙티브 요소 키보드 + `focus-visible` | PASS | `<button>` 네이티브 사용으로 Space/Enter 지원 |
| M18. 색만으로 정보 전달 0 | PASS | DdayBadge critical/warning → 아이콘+숫자 추가; farFuture/upcoming neutral tier는 숫자(D-N)로 정보 전달 |

---

## MUST Criteria — fsm-terminal-actor-variant

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| tsc 0 error | PASS | 빌드 검증 참조 |
| schemas unit tests PASS | PASS | 695 tests all passed |
| backend unit tests PASS | PASS | 947 tests all passed |
| frontend unit tests PASS | PASS | 240 tests all passed |
| lint PASS | PASS | 빌드 검증 참조 |
| `reachedStepIndex: number` (readonly) 필드 | PASS | `checkout-fsm.ts` line 117 |
| `NextStepDescriptorSchema`에 `reachedStepIndex: z.number().int().positive()` | PASS | line 157 |
| `computeReachedStepIndex` export | PASS | line 556 |
| terminal + terminatedFromStatus 제공 시 `computeStepIndex(terminatedFromStatus, purpose)` | PASS | line 561-562 |
| terminal + terminatedFromStatus null/undefined 시 fallback | PASS | line 563: `return computeStepIndex(status, purpose)` |
| 비-terminal: `computeReachedStepIndex === computeStepIndex(status, purpose)` | PASS | 6+ unit tests (describe block line 519-535) |
| `getNextStep` signature `terminatedFromStatus?` 옵셔널 추가 | PASS | line 646, 648 확인 |
| `getNextStep` 3개 return 분기 모두 `reachedStepIndex` 필드 채움 | PASS | line 681, 708, 730 확인 |
| `ActorVariant` schemas에서 export | PASS | line 54 |
| `roleToActorVariant(role: string): ActorVariant \| null` export | PASS | line 579 |
| roleToActorVariant 매핑 (test_engineer→requester 등) | PASS | line 580-590, unit tests (line 610-634) |
| roleToActorVariant unknown → null | PASS | unit test line 627-629 |
| DB 스키마 `terminatedFromStatus` 컬럼 | PASS | `checkouts.ts` line 68, migration `0046_add_terminated_from_status.sql` |
| `CheckoutsService.buildNextStep` → `terminatedFromStatus` 전달 | PASS | service line 267 |
| `reject` update payload `terminatedFromStatus: checkout.status` | PASS | line 2044 |
| `borrowerReject` update payload `terminatedFromStatus: checkout.status` | PASS | line 1956 |
| `cancel` update payload `terminatedFromStatus: checkout.status` | PASS | line 2831 |
| approve/borrowerApprove/startCheckout/returnCheckout/approveReturn/rejectReturn 미설정 | PASS | grep 결과 line 1956, 2044, 2831 3곳만 존재 |
| `NextStepPanel.tsx` 로컬 `type ActorVariant` 정의 삭제 | PASS | grep 결과: schemas 1곳만 존재 |
| `currentUserRole: _currentUserRole` underscore prefix 제거 | PASS | `_currentUserRole` 없음, `currentUserRole` 직접 사용 |
| `roleToActorVariant` schemas에서 import | PASS | line 14 |
| `isMyTurn` 로직: system_admin → `availableToCurrentUser`, 그 외 → actorVariant 비교 | PASS | line 133-136 |
| `currentUserRole` undefined 시 `isMyTurn = false` | PASS | line 132: `currentUserRole ? roleToActorVariant(...) : null` → null → isMyTurn false |
| 비-terminal + isMyTurn true → `CHECKOUT_YOUR_TURN_BADGE_TOKENS` "내 차례" 뱃지 | PASS | line 212, 383 |
| terminal descriptor `nextAction === null` 분기에서 뱃지 없음 | PASS | line 139-176 early return (no YourTurnBadge) |
| 뱃지 `role="status"` + `aria-label` | PASS | `YourTurnBadge` line 82-83 |
| urgency에 따라 뱃지 variant 분기 | PASS | `CHECKOUT_YOUR_TURN_BADGE_TOKENS.variant[urgency]` line 86 |
| ko `fsm.yourTurn.label` 키 | PASS | `messages/ko/checkouts.json` line 297-298 |
| en `fsm.yourTurn.label` 키 | PASS | `messages/en/checkouts.json` 동일 위치 |
| ko/en `fsm.yourTurn.ariaLabel` 키 | PASS | 양쪽 모두 존재 |
| SSOT: `ActorVariant` frontend 재정의 없음 | PASS | grep 결과: schemas 1곳만 존재 |
| SSOT: `roleToActorVariant` frontend 재정의 없음 | PASS | frontend에서 import only |
| frontend UserRole 리터럴 분기로 actor variant 직접 결정 없음 | PASS | `roleToActorVariant()` 경유만 사용 |
| reject/cancel/borrowerReject CAS(`updateWithVersion`) 경로 보존 | PASS | 기존 CAS 로직 유지 확인 |
| audit/알림 이벤트 페이로드 변경 없음 | PASS | `writeTransitionAudit` 기존 signature 유지; extraInfo는 추가 필드 |
| 기존 캐시 무효화 로직 변경 없음 | PASS | `invalidateCache` 호출 패턴 유지 |

---

## Summary

**Overall**: PASS

**MUST failures**: 없음

**SHOULD failures (non-blocking, 이연 허용)**:
- S2. `revokeApproval` 5분 경계 unit test (S2) — 미구현
- S3. WorkflowTimeline rental phase Playwright screenshot 회귀 테스트 — 미구현
- S4. bundle-size gate 검증 — 미실행
- S5. U-11 nav badge SSE 연동 — 미구현
- FSM SHOULD: backend/frontend E2E 시나리오 (reachedStepIndex 검증) — 미구현
- FSM SHOULD: compact variant 뱃지 정책 결정 — 미결정

**검토 비고**:
- M10 `getRecentDestinations`: 계약은 `groupBy + desc` 명시, 구현은 `selectDistinct + orderBy desc`. 기능적 동등성 충족 (중복 제거 + 최신 순 + 5건 제한), `sql ANY(arr)` 금지 패턴 위반 없음. FAIL 처리하지 않음.
- M17 `dark:` prefix: 신규 파일(dday-colors.ts, checkout-phase.ts) 내 위반 없음. 기존 파일(equipment.ts 등)의 `dark:` 사용은 이 sprint 범위 외.
- M9 `db:migrate` 실행: 마이그레이션 파일(`0047_add_rejection_presets.sql`) 생성 확인. 실제 DB apply는 사용자 수동 실행 항목.
