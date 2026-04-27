---
slug: checkout-sprint4-3-to-5
created: 2026-04-27
sprint: Sprint 4.3 → 5
mode: 2
round: 1
---

# Contract: Checkouts V3 Sprint 4.3 → 5

## MUST (loop-blocking failures)

### M1. Sprint 4.3 DdayBadge
- [ ] `apps/frontend/lib/utils/dday-utils.ts` 신설 — `calculateDaysRemaining(expectedReturnDate: string): number` export
- [ ] `apps/frontend/components/checkouts/DdayBadge.tsx` 신설 — `daysRemaining === null`이면 null 렌더
- [ ] `CheckoutDetailClient.tsx` 헤더에 `<DdayBadge variant="hero" />` 삽입, terminal 상태 가드
- [ ] i18n ko + en 동시: `checkouts.detail.ddayLabel`, `checkouts.detail.ddaySrLabel`
- [ ] `role="img"` + `aria-label` 적용. 색+숫자+아이콘 3중 단서

### M2. Sprint 4.4 CheckoutPhaseIndicator
- [ ] `apps/frontend/lib/design-tokens/components/checkout-phase.ts` 신설 — `CHECKOUT_RENTAL_PHASE_TOKENS` export. 하드코딩 0
- [ ] `lib/design-tokens/index.ts` re-export 추가
- [ ] `apps/frontend/components/checkouts/CheckoutPhaseIndicator.tsx` 신설
  - `descriptor.phase === null`이면 null 렌더
  - phaseIndex 비교로 dot state 도출
  - `RENTAL_PHASE_I18N_KEY` 경유 phase label
  - `role="group"` + `aria-label`
- [ ] `CheckoutGroupCard.tsx` rental 조건 안에 `<CheckoutPhaseIndicator>` 삽입
- [ ] non-rental 변경 0
- [ ] i18n ko + en: `rentalPhase.xOfY`, `rentalPhase.ariaLabel`, `rentalPhase.{approve,handover,return}.label`

### M3. Sprint 4.4 WorkflowTimeline Phase 재구성
- [ ] rental purpose: 3 phase card 접힘/펼침 (current expanded, completed/future collapsed)
- [ ] non-rental: 기존 렌더링 유지 (회귀 0)
- [ ] `aria-expanded` + `aria-controls` 짝맞춤, Space/Enter 키보드 조작
- [ ] i18n ko + en: `rentalPhase.expandAll`, `rentalPhase.collapseAll`, `rentalPhase.viewSteps`, `rentalPhase.waiting`

### M4. U-09 D-day 6단계 색온도
- [ ] `apps/frontend/lib/design-tokens/components/dday-colors.ts` 신설
- [ ] `getDdayBadgeClasses`, `getDdayTier`, `getDdayIconKey` 3개 SSOT export
- [ ] 6 tier 구현 (farFuture/upcoming/soon/dueToday/overdueShort/overdueLong)
- [ ] 신규 색: brand CSS 변수 (`:root` + `.dark` 양쪽). raw `bg-orange-500` 0
- [ ] D+4+ tier만 `motion-safe:animate-pulse`
- [ ] 기존 `getDdayClasses` → deprecated alias로 `getDdayBadgeClasses` 위임
- [ ] `lib/design-tokens/index.ts` re-export

### M5. U-11 Nav "내 차례" 배지
- [ ] `nav-config.ts` `badgeKey?: 'approvals' | 'checkouts-your-turn'` 확장
- [ ] checkouts 아이템에 `badgeKey: 'checkouts-your-turn'` 추가
- [ ] `getFilteredNavSections` 세 번째 파라미터 `checkoutYourTurnCount?: number` 추가
- [ ] `DashboardShell.tsx` `queryKeys.checkouts.resource.pendingCount()` 쿼리 추가 + 전달
- [ ] `apps/frontend/components/layout/NavBadge.tsx` 신설 — 0이면 null, 10+ "9+", `aria-label`
- [ ] i18n ko + en: `navigation.checkouts.yourTurnAria`
- [ ] 클릭 → `/checkouts?view=yourTurn`

### M6. U-12 Empty/Error variant 5종
- [ ] `CheckoutEmptyState.tsx` variant `noneYet | noPermission | noFilterResult | error | network` 5종
- [ ] 각 variant primary CTA (최소 1개)
- [ ] `noPermission`: 현재 역할 inline 표시
- [ ] `noFilterResult`: "필터 초기화" CTA
- [ ] `network`: `navigator.onLine` 감지
- [ ] i18n 20개 키 ko + en (5 × {title, description, primaryCta, secondaryCta})

### M7. U-10 Optimistic UI 보강
- [ ] `CheckoutGroupCard.tsx` `approveMutation`의 optimistic update 패턴 확인/적용 (status optimistic 변경)
- [ ] `CheckoutCacheInvalidation.invalidateAfterApproval` detail cache 포함 검증

### M8. Backend `POST /checkouts/bulk-approve`
- [ ] `dto/bulk-approve.dto.ts` Zod 검증 (ids: uuid[], min 1, max 50)
- [ ] approverId = `extractUserId(req)` (Rule 2). body의 approverId 신뢰 0
- [ ] `Promise.allSettled` 부분 실패 응답: `{ approved, failed }`
- [ ] cross-team 거부 (scope → FSM → domain 순)
- [ ] cache invalidate view:* + resource:*

### M9. Backend `GET /checkouts/rejection-presets`
- [ ] 신규 Drizzle schema `rejection_presets` 테이블
- [ ] `db:generate` → `db:migrate` 실행
- [ ] `@RequirePermissions(Permission.REJECT_CHECKOUT)`
- [ ] 응답 Zod 검증

### M10. Backend `GET /checkouts/destinations/recent`
- [ ] userId scope (`WHERE requester_id = $userId`). cross-user 0
- [ ] Drizzle groupBy + desc. `sql\`ANY(${arr})\`` 패턴 0 (MEMORY)
- [ ] 캐시 TTL 60s, key에 userId 포함
- [ ] 응답 max 5건

### M11. Backend `POST /checkouts/:id/revoke-approval`
- [ ] fail-close 순서: scope → FSM(approved+5분이내) → domain(approvedBy===approverId)
- [ ] CAS: version 불일치 → 409 `ErrorCode.VersionConflict`
- [ ] `ErrorCode.REVOCATION_WINDOW_EXPIRED` 신설 (`packages/schemas/src/error-codes.ts`)
- [ ] AuditLog: revokedBy, revokeReason, previousApprovedAt
- [ ] 트랜잭션: status pending, approvedAt null, approvedBy null, version++

### M12. tsc 0 errors (frontend + backend)
- [ ] `pnpm tsc --noEmit` exit 0

### M13. lint 0 errors
- [ ] `pnpm lint` exit 0

### M14. SSOT 준수 (Rule 0)
- [ ] enum/permission/queryKey 로컬 재정의 0
- [ ] design token raw class 0

### M15. 보안 (Rule 2)
- [ ] 모든 backend userId/approverId: `extractUserId(req)` 서버 추출

### M16. i18n parity
- [ ] 모든 신규 키 ko.json + en.json 동시. 누락 0

### M17. 다크모드
- [ ] `dark:` prefix 사용 0. brand CSS 변수 경유
- [ ] 신규 색: `:root` + `.dark` 양쪽 정의

### M18. 접근성
- [ ] 신규 인터랙티브 요소 키보드 조작 + `focus-visible` 가시
- [ ] 색만으로 정보 전달 0 (DdayBadge: 색+숫자+아이콘)
- [ ] axe-core 0 위반

---

## SHOULD (non-blocking)

- S1. `rejection_presets` 시드 데이터는 사용자 확인 후 결정 (임의 생성 금지)
- S2. `revokeApproval` 5분 경계 unit test (4분59초 success / 5분1초 fail)
- S3. WorkflowTimeline rental phase Playwright screenshot 회귀 테스트
- S4. bundle-size gate: First Load JS 증가 ±3KB gzip 이내
- S5. U-11 nav badge SSE 연동 (notification stream이 있는 경우)
- S6. `OverflowAction` type DashboardShell 밖으로 export (carry-over from Sprint 4.2)

---

## MUST NOT

- `rental-phase.ts` / `checkout-fsm.ts` schemas 수정 (이미 완성)
- non-rental `WorkflowTimeline` 로직 변경 (회귀)
- `setQueryData` 사용 (onSuccess에서)
- `eslint-disable` 추가
- body의 userId/approverId 신뢰
- U-02/U-03/U-06/U-07 구현 (다음 세션)

---

## OUT OF SCOPE (Phase 6 이월)

- U-02 전역 단축키 치트시트
- U-03 Saved Views (localStorage + URL)
- U-06 QR drawer trigger
- U-07 스크롤 복원

---

## 검증 시퀀스

```bash
pnpm --filter frontend tsc --noEmit
pnpm --filter backend run tsc --noEmit
pnpm lint
pnpm --filter backend run test
grep -rn "getDdayClasses" apps/frontend/components --include="*.tsx" # → 0건 (deprecated alias만)
grep -rn "dark:" apps/frontend/lib/design-tokens --include="*.ts"   # → 0건
grep -rn "'pl-4'" apps/frontend/app/\(dashboard\)/checkouts --include="*.tsx" # → 0건
```
