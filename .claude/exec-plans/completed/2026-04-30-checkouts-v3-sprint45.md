# Checkouts V3 Sprint 4.5 T1+T2 — 편의성 UX 6종 통합 Plan

> **상태**: Active (planned 2026-04-30)
> **Scope**: U-09 / U-11 / U-12 / U-10 / U-07 / U-01 (T1·T2 6개)
> **선행**: Sprint 1~3, 4.1~4.4, 5 모두 완료 (`.claude/exec-plans/completed/2026-04-24-checkouts-v3-roadmap.md`)
> **선언**: 신규 워크플로 0, 신규 도메인 데이터 0 — 기존 SSOT/훅/컴포넌트 재사용 + 누락 wiring/엔드포인트만 보강
> **워크플로**: main 직접 작업, pre-push hook(tsc + backend/frontend test) 게이트

---

## 핵심 결정 (Sr 판단)

| ID | 결정 | 근거 |
|----|------|------|
| D1 | **D-day 4-tier SSOT 유지 + 시각 6-level 분리 (하이브리드)** | backend `CHECKOUT_DDAY_THRESHOLDS`(0/2/14) 보존, `getCheckoutDdayVisualLevel()` 6단계 헬퍼 신설로 시각 차별성 달성. tier(아이콘)/visual(색온도) 분리. |
| D2 | **BulkActionBar 공용 컴포넌트 재사용** (`components/common/`) | AD-5 generic 설계 + approvals 검증 패턴. 도메인별 wrapper 신설 0 (M15). |
| D3 | **pending 탭 only wiring** | outbound/inbound는 status별 액션 분기 복잡 → 별도 Sprint scope. |
| D4 | **bulk-reject backend 신설 — bulk-approve 대칭 + reason required** | 단건 `reject` service의 fail-close 순서(scope→FSM→reason) 그대로 활용. |

## L0 Inferred Assumptions

1. `queryKeys.checkouts.resource.pendingCount()` 존재 검증됨 (`apps/frontend/lib/api/query-config.ts:554`)
2. `getCheckoutDday4Tier` SSOT 검증됨 (`dday-colors.ts:44`) — 4-tier 보존 가능
3. `CHECKOUT_DDAY_THRESHOLDS` shared-constants에 frontend/backend 공유 — **수정 금지**
4. `BulkActionBar` 공용(`components/common/BulkActionBar.tsx`) actions slot 충분 (approvals 사례 검증)
5. 단건 `reject(id, dto, req)` service의 fail-close 순서가 bulk wrapper에 그대로 적용 가능

## L4ext (확장 영향)

- **bulk-reject endpoint**: approvals 도메인 영향 0 (checkouts 단독)
- **BulkActionBar**: 이미 approvals/equipment에서 사용 중 — 공용 변경 0, slot 활용만
- **`getCheckoutDdayVisualLevel`**: outbound aggregation 영향 0 (시각 전용, backend SSOT 보존)
- **useRowSelection 단축키 가드**: equipment 도메인에도 적용 가능 → SHOULD S2

## Phase Dependency Graph

```
Phase 0 (검증) → Phase 1 (D-day, 독립)
              → Phase 5 (Return ctx, 독립)
              → Phase 3 (EmptyState, 독립)
              → Phase 2 (Sidebar 배지) → Phase 4 (invalidateKeys)
              → Phase 4 (Optimistic, CAS 409)
              → Phase 6 (Bulk wiring, backend 신설)
              → Phase 7 (audit + archive)

권장 실행 순서: 0 → 1 → 5 → 3 → 2 → 4 → 6 → 7
(독립 Phase 우선 → CAS/Backend 후순)
```

---

## Phase 0 — Pre-flight 인프라 매핑 검증

### 목표
plan 본문 가정의 SSOT/엔드포인트/훅이 실재함을 grep으로 재확인.

### 검증 명령 + 기대 결과

```bash
# 0-1. bulk-approve endpoint
grep -n "bulk-approve" apps/backend/src/modules/checkouts/checkouts.controller.ts
# 기대: 1건 (ll. 859)

# 0-2. bulk-reject 부재
grep -rn "bulk-reject" apps/backend/src/modules/checkouts/
# 기대: 0건 — Phase 6 신설

# 0-3. BulkApproveResult 구조
grep -n "BulkApproveResult\|approved.*failed" apps/backend/src/modules/checkouts/dto/bulk-approve.dto.ts
# 기대: { approved: [{id,version}], failed: [{id,error}] }

# 0-4. 4-tier SSOT
grep -n "DDAY_4TIER_CLASSES\|getCheckoutDday4Tier" apps/frontend/lib/design-tokens/components/dday-colors.ts
# 기대: 4건 이상

# 0-5. shared-constants 임계값
grep -rn "CHECKOUT_DDAY_THRESHOLDS\|getCheckoutDdayTier" packages/shared-constants/src/
# 기대: SSOT 위치 + frontend import

# 0-6. BulkActionBar 공용
grep -n "export function BulkActionBar" apps/frontend/components/common/BulkActionBar.tsx
# 기대: 1건 (actions slot props)

# 0-7. useRowSelection
grep -n "export function useRowSelection" apps/frontend/hooks/use-bulk-selection.ts
# 기대: 1건

# 0-8. pendingCount 쿼리 키
grep -n "pendingCount" apps/frontend/lib/api/query-config.ts
# 기대: ll. 554 — 검증됨

# 0-9. CheckoutEmptyState variant 시스템
grep -n "variant" apps/frontend/components/checkouts/CheckoutEmptyState.tsx | head -10
# 기대: variant 분기 명확

# 0-10. useOnlineStatus
grep -rn "export.*useOnlineStatus" apps/frontend/hooks/
# 기대: 1건

# 0-11. FRONTEND_ROUTES
grep -n "CHECKOUTS" apps/frontend/lib/constants/routes.ts
# 기대: 라우트 SSOT

# 0-12. useOptimisticMutation TCachedData
grep -n "TCachedData\|setQueryData" apps/frontend/hooks/use-optimistic-mutation.tsx
# 기대: 타입 분리 + setQueryData 금지 명시
```

### Exit
- 12개 검증 모두 PASS → Phase 1 진입
- 실패 시 해당 Phase 변경 범위 확장

---

## Phase 1 — U-09 D-day 시각 6-level 분리 (D1: 하이브리드)

### Phase 목표
4-tier SSOT 보존 + 시각 6-level 헬퍼 신설로 D-day 색온도 6단계 달성. `prefers-reduced-motion` 존중.

### 6-level 매핑 (시각 전용)
| Level | 일수 | 시각 |
|-------|------|------|
| 1 (relaxed) | D-7+ | neutral, font-medium |
| 2 (normal) | D-6 ~ D-4 | brand-info tint, font-semibold |
| 3 (warning) | D-3 ~ D-1 | brand-warning, font-semibold |
| 4 (urgent) | D-0 | brand-warning solid, font-bold |
| 5 (overdue) | D+1 ~ D+3 | brand-critical, font-bold |
| 6 (critical-pulse) | D+4+ | brand-critical, font-bold, motion-safe:animate-pulse |

### 변경 파일

- `apps/frontend/lib/design-tokens/components/dday-colors.ts` (수정)
  - WHAT: `DDAY_VISUAL_LEVEL_TOKENS` 6단계 매핑 신설 (color + font-weight + animation)
  - WHAT: `getCheckoutDdayVisualLevel(daysRemaining: number): 1|2|3|4|5|6` 헬퍼
  - WHAT: `getCheckoutDdayVisualClasses(daysRemaining: number): string` 헬퍼
  - WHAT: 4-tier 헬퍼는 그대로 유지 (backend aggregation 일관성)
- `apps/frontend/components/checkouts/DdayBadge.tsx` (수정)
  - WHAT: `getCheckoutDdayVisualClasses` 사용 (색상)
  - WHAT: `getCheckoutDday4TierIconKey` 사용 (아이콘 — tier 분리 유지)
  - WHAT: `tabular-nums` 추가, sr-only 텍스트로 tier별 분기
- `apps/frontend/messages/ko.json` + `en.json` (수정)
  - WHAT: `checkouts.detail.ddaySrLabel` 키를 4분기 (overdue/urgent/normal/relaxed)

### 재사용 인프라
- `getCheckoutDday4Tier`, `DDAY_4TIER_ICON_KEY`, `formatDday`, `CHECKOUT_DDAY_THRESHOLDS` (shared-constants)
- brand CSS 변수 (`:root`/`.dark` 자동 전환)

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test -- DdayBadge

# 6-level 헬퍼 신설 확인
grep -n "getCheckoutDdayVisualLevel\|DDAY_VISUAL_LEVEL_TOKENS" apps/frontend/lib/design-tokens/components/dday-colors.ts
# 기대: 6단계 매핑 + 헬퍼 함수

# motion-safe prefix
grep -n "motion-safe:animate-pulse" apps/frontend/lib/design-tokens/components/dday-colors.ts
# 기대: 1건 (level 6)

# dark: prefix 0
grep -n "^.*dark:" apps/frontend/lib/design-tokens/components/dday-colors.ts
# 기대: 0건

# 4-tier 호출자 영향 0 (backend aggregation 보존)
grep -rn "getCheckoutDday4Tier" apps/ --include="*.ts" --include="*.tsx" | wc -l
# 기대: 변경 전과 동일 (호출자 보존)
```

### CAS 영향
없음 (시각 토큰)

### i18n
- `checkouts.detail.ddaySrLabel.overdue` (신규)
- `checkouts.detail.ddaySrLabel.urgent` (신규)
- `checkouts.detail.ddaySrLabel.normal` (신규)
- `checkouts.detail.ddaySrLabel.relaxed` (신규)
- ko/en 양쪽

### WCAG SC
- **1.4.1 Use of Color** (Level A): 색+숫자+아이콘+sr-only 4중 단서
- **2.3.3 Animation from Interactions** (AAA): `motion-safe:` prefix
- **1.4.4 Resize Text** (AA): font-weight 변화로 정보 전달, 200% 확대 시에도 가독

### 관측성
없음

### Dark mode
brand CSS 변수 자동 전환

### Rollback
DdayBadge.tsx + dday-colors.ts 단일 commit revert. i18n 키 별도 commit.

---

## Phase 2 — U-11 SidebarNav "내 차례 N" 배지

### Phase 목표
사이드바 "반출 관리" item에 pending count 배지. **신규 쿼리 0** (`pendingCount` 재사용).

### 변경 파일

- `apps/frontend/components/layout/SidebarNav.tsx` (수정)
  - WHAT: 반출 NavItem에 `useQuery(queryKeys.checkouts.resource.pendingCount(), ...)` 호출
  - WHAT: count > 0 시 `CHECKOUT_TAB_BADGE_TOKENS.alert` 적용, 10+ → "9+"
  - WHAT: collapsed 상태에서 dot indicator (기존 dot 슬롯 재사용)
  - WHAT: `aria-label` i18n 키 (count 포함)
- `apps/frontend/lib/api/checkouts-api.ts` (확인)
  - WHAT: `getPendingCount()` 함수 존재 여부 확인 (없으면 신설)
- `apps/frontend/messages/ko.json` + `en.json` (수정)
  - WHAT: `nav.checkouts.yourTurnAria` (스크린리더 — "{count}건 처리 대기")

### 재사용 인프라
- `queryKeys.checkouts.resource.pendingCount()` (검증됨)
- `CHECKOUT_TAB_BADGE_TOKENS.alert`
- `REFETCH_STRATEGIES.IMPORTANT` (2분)

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test -- SidebarNav

# 신규 쿼리 키 신설 0
grep -n "pendingCount\|pending-count" apps/frontend/lib/api/query-config.ts | wc -l
# 기대: 변경 전과 동일

# 하드코딩 URL 0
grep -n "/checkouts/pending" apps/frontend/components/layout/SidebarNav.tsx
# 기대: 0건 — FRONTEND_ROUTES 경유
```

### CAS 영향
없음

### i18n
- `nav.checkouts.yourTurnAria` (신규)
- ko/en 양쪽

### WCAG SC
- **1.4.3 Contrast** (AA): brand 토큰 명도
- **4.1.3 Status Messages** (AA): `aria-live="polite"` count 변화 SR 알림

### 관측성
SHOULD: `analytics.track('sidebar.checkouts.click', { pendingCount })`

### Rollback
SidebarNav.tsx 단일 revert + i18n 1쌍 revert.

---

## Phase 3 — U-12 EmptyState 인간적 복구 경로

### Phase 목표
variant별 secondary action(복구 경로) 명시. **MEMORY `feedback_disabled_with_reason_over_hide`** 적용.

### 변경 파일

- `apps/frontend/components/checkouts/CheckoutEmptyState.tsx` (수정)
  - WHAT: variant별 `recoveryAction` map — `network`/`noPermission`/`filterEmpty`/`noData`
  - WHAT: `network` variant에서 `useOnlineStatus` 오프라인 시 primary action `disabled` + i18n 사유
- `apps/frontend/components/checkouts/CheckoutsContent.tsx` (수정)
  - WHAT: `filterEmpty` variant 호출부에 `secondaryAction={{ label: t('emptyState.recovery.filterEmpty.label'), onClick: resetFilters }}` 전달
- `apps/frontend/messages/ko.json` + `en.json` (수정)
  - WHAT: `checkouts.emptyState.recovery.{network|noPermission|filterEmpty|noData}.label` 4쌍
  - WHAT: `checkouts.emptyState.recovery.noPermission.adminMailto` 1쌍 (mailto: 관리자)

### 재사용 인프라
- `CheckoutEmptyState` variant 시스템
- `useOnlineStatus`
- `CHECKOUT_EMPTY_STATE_TOKENS`

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test -- CheckoutEmptyState

# disabled+reason 패턴
grep -n "disabled.*useOnlineStatus\|isOnline.*disabled" apps/frontend/components/checkouts/CheckoutEmptyState.tsx
# 기대: 1건 (network offline 시)

# i18n parity
node scripts/verify-i18n-parity.mjs apps/frontend/messages/
```

### CAS 영향
없음

### i18n
4쌍 + 1 mailto (총 9개 키, ko/en 양쪽)

### WCAG SC
- **3.3.3 Error Suggestion** (AA): variant별 구체적 복구 경로
- **3.3.4 Error Prevention** (AA): mailto는 외부 앱 진입 — `aria-label`로 사전 고지

### 관측성
SHOULD: `analytics.track('emptyState.recoveryClick', { variant })`

### Rollback
CheckoutEmptyState.tsx + CheckoutsContent.tsx revert + i18n 키 revert.

---

## Phase 4 — U-10 Optimistic UI + Skeleton 일관성 (CAS 409)

### Phase 목표
checkout list/detail mutation의 optimistic update 누락 wiring + Skeleton 일관성. **MEMORY 규칙**: setQueryData 0 + CAS 409 detail invalidate.

### 변경 파일

- `apps/frontend/components/checkouts/CheckoutsContent.tsx` (수정)
  - WHAT: cancel/approve mutation을 `useOptimisticMutation` 경유로 통일
  - WHAT: `optimisticUpdate: (old) => old?.filter(...)` 패턴 (목록 즉시 제거)
  - WHAT: `invalidateKeys: [queryKeys.checkouts.resource.pendingCount()]` 추가 (Phase 2 동기화)
- `apps/frontend/components/checkouts/CheckoutDetailClient.tsx` (수정)
  - WHAT: approve/return mutation onError에서 `queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.detail(id) })` 명시 (CAS 409 stale 방지)
- `apps/frontend/components/checkouts/CheckoutLoadingSkeleton.tsx` (확인 + 수정 필요 시)
  - WHAT: list/detail/group skeleton stagger delay 통일 (`STAGGER_ROW_LIMIT` SSOT)

### 재사용 인프라
- `useOptimisticMutation` (TData/TCachedData 분리, setQueryData 금지)
- `STAGGER_ROW_LIMIT`, `CHECKOUT_LOADING_SKELETON_TOKENS`
- `queryKeys.checkouts.*`

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test -- CheckoutsContent CheckoutDetail

# setQueryData 0 (verify-frontend-state Step 35)
grep -rn "setQueryData" apps/frontend/components/checkouts/
# 기대: 0건

# CAS 409 onError invalidate
grep -B2 -A8 "onError\|onErrorCallback" apps/frontend/components/checkouts/CheckoutDetailClient.tsx | grep "invalidateQueries"
# 기대: 1건 이상
```

### CAS 영향
**핵심**: CAS 409 시 detail 캐시 즉시 invalidate (MEMORY: stale cache 무한 409 방지)

### i18n
없음 (기존 토스트 키 재사용)

### WCAG SC
- **2.2.1 Timing Adjustable** (A): optimistic UI 즉시 피드백
- **3.3.1 Error Identification** (A): 409 충돌 토스트 (`useOptimisticMutation` 내장)

### Rollback
파일별 독립 revert (1 commit씩).

---

## Phase 5 — U-07 돌아가기 컨텍스트 보존

### Phase 목표
checkout 상세 → 목록 복귀 시 직전 필터/페이지/정렬 복원. **URL이 SSOT**, sessionStorage는 보조.

### 변경 파일

- `apps/frontend/lib/utils/checkout-return-context.ts` (신규)
  - WHAT: `saveCheckoutListContext(searchParams)` / `restoreCheckoutListContext(): URLSearchParams | null`
  - WHAT: TTL 1시간 (timestamp 비교) — 만료 시 null
  - WHAT: sessionStorage key `CHECKOUT_RETURN_CONTEXT_KEY` 상수
  - WHAT: try/catch + private mode 가드 (storage 차단 시 null fallback)
- `apps/frontend/components/checkouts/CheckoutsContent.tsx` (수정)
  - WHAT: 필터/페이지 변경 effect에서 `saveCheckoutListContext(searchParams)` 호출
- `apps/frontend/components/checkouts/CheckoutDetailClient.tsx` (수정)
  - WHAT: "목록으로" 버튼 onClick — `restoreCheckoutListContext()` 결과로 라우트 push (`FRONTEND_ROUTES.CHECKOUTS` SSOT)

### 재사용 인프라
- `parseEquipmentFiltersFromSearchParams` (필터 SSOT 패턴)
- `FRONTEND_ROUTES.CHECKOUTS`
- `next/navigation` `useRouter`/`useSearchParams`

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit

# 하드코딩 URL 0 (verify-hardcoding Step 28)
grep -rn "router.push.*['\"]\\./checkouts" apps/frontend/components/checkouts/
# 기대: 0건 — FRONTEND_ROUTES 경유

# sessionStorage TTL guard
grep -n "TTL\|expires\|timestamp" apps/frontend/lib/utils/checkout-return-context.ts
# 기대: 1건 이상

# storage try/catch
grep -n "try.*sessionStorage" apps/frontend/lib/utils/checkout-return-context.ts
# 기대: 1건
```

### CAS 영향
없음

### i18n
없음 (기존 라벨 재사용)

### WCAG SC
- **2.4.4 Link Purpose** (A): "목록으로" 라벨이 컨텍스트 보존 시사
- **3.2.4 Consistent Identification** (AA): 다른 도메인 "돌아가기" 패턴과 일관

### Rollback
신규 헬퍼 1 + 호출부 2 revert.

---

## Phase 6 — U-01 Bulk Approve/Reject Wiring (D2/D3/D4)

### Phase 목표
bulk-reject backend 신설 + frontend pending 탭에 BulkActionBar wiring (승인/반려 2종).

### 변경 파일

#### Backend (3 파일)

- `apps/backend/src/modules/checkouts/dto/bulk-reject.dto.ts` (신규)
  - WHAT: Zod 스키마 `bulkRejectSchema` — `{ ids: uuid[1..50], reason: string[1..500] }`
  - WHAT: `BulkRejectInput` 타입 + `BulkRejectValidationPipe`
  - WHAT: `BulkRejectResult` 인터페이스 — `{ rejected: [{id,version}], failed: [{id,error}] }`
  - WHAT: Swagger DTO 클래스
- `apps/backend/src/modules/checkouts/checkouts.controller.ts` (수정)
  - WHAT: `@Post('bulk-reject')` 메서드 — `Permission.APPROVE_CHECKOUT` (reject도 동일 권한), `BulkRejectValidationPipe`, `extractUserId(req)` 서버 추출, `@AuditLog`
- `apps/backend/src/modules/checkouts/checkouts.service.ts` (수정)
  - WHAT: `bulkReject(ids, reason, rejectorId, req): Promise<BulkRejectResult>` — `Promise.allSettled`로 단건 `reject()` 감쌈 (bulkApprove ll. 3311-3344 패턴)
  - WHAT: 단건 `reject`의 fail-close 순서(scope → FSM → reason validation) 그대로 활용

#### Frontend (5 파일)

- `apps/frontend/lib/api/checkouts-api.ts` (수정)
  - WHAT: `bulkApproveCheckouts(ids, commonReason?)` 함수 (없으면 신설)
  - WHAT: `bulkRejectCheckouts(ids, reason)` 함수 신설 — POST `/checkouts/bulk-reject`
- `apps/frontend/components/checkouts/CheckoutsContent.tsx` (수정)
  - WHAT: pending 탭에 `useRowSelection<Checkout>(items, c => c.id)` 적용
  - WHAT: `BulkActionBar`(공용) actions slot에 BulkApproveButton + BulkRejectButton 주입
  - WHAT: bulk mutation 2종을 `useOptimisticMutation` 경유 (TData=BulkResult, TCachedData=Checkout[])
  - WHAT: 부분 실패 토스트 3-way (전체 실패/부분 성공/전체 성공) — approvals ApprovalsClient ll. 263-289 패턴
- `apps/frontend/components/checkouts/BulkRejectDialog.tsx` (신규)
  - WHAT: AlertDialog + reason textarea (max 500) + i18n 카운터 (qualityApproveDialog `2f24232e` 패턴)
  - WHAT: 제출 시 `bulkRejectMutation.mutate({ ids, reason })`
- `apps/frontend/messages/ko.json` + `en.json` (수정)
  - WHAT: 8키 추가 — `checkouts.bulk.{approveButton|rejectButton|approveAll|rejectAll|partialResult|reasonRequired|reasonPlaceholder|charsRemaining}`

### 재사용 인프라
- **Backend**: `Promise.allSettled`(bulkApprove 패턴), `extractUserId`, `@AuditLog`, `Permission.APPROVE_CHECKOUT`, `runWithConcurrency`(존재 시)
- **Frontend**: `BulkActionBar`(공용), `useRowSelection`(snapshot+LRU+isSelectable), `useOptimisticMutation`(TData/TCachedData 분리), `CHECKOUT_TOAST_TOKENS`, `APPROVAL_MOTION`

### 검증 명령
```bash
# Backend
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- bulk-reject

# DTO 대칭
diff <(grep -E "z\.|export" apps/backend/src/modules/checkouts/dto/bulk-approve.dto.ts | sort) \
     <(grep -E "z\.|export" apps/backend/src/modules/checkouts/dto/bulk-reject.dto.ts | sort)
# 기대: 구조적 대칭

# Rule 2 — 서버사이드 userId
grep -A3 "bulk-reject" apps/backend/src/modules/checkouts/checkouts.controller.ts | grep "extractUserId\|req.user.userId"
# 기대: 1건 — body 신뢰 0

# AuditLog
grep -B1 "@Post.*bulk-reject" apps/backend/src/modules/checkouts/checkouts.controller.ts | grep "@AuditLog"
# 기대: 1건

# Frontend
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test -- BulkRejectDialog CheckoutsContent

# setQueryData 0
grep -A20 "bulkApproveMutation\|bulkRejectMutation" apps/frontend/components/checkouts/CheckoutsContent.tsx | grep "setQueryData"
# 기대: 0건

# BulkActionBar 도메인 wrapper 0 (M15)
grep -rn "function BulkActionBar\b" apps/frontend/components/checkouts/
# 기대: 0건

# 하드코딩 URL 0
grep -n "'/checkouts/bulk" apps/frontend/lib/api/checkouts-api.ts
# 기대: 0건 — API_ENDPOINTS 경유 또는 SSOT 경유
```

### CAS 영향
**있음**: bulk operation은 per-item version 클라이언트 전달 불가 → service 내부 `findCheckoutEntity(id).version` 사용 (bulkApprove 동일). 충돌은 `Promise.allSettled.failed`에 개별 항목으로 분리.

### i18n
8키 (ko/en)

### WCAG SC
- **2.1.1 Keyboard** (A): BulkActionBar Radix Checkbox 키보드 접근
- **4.1.2 Name, Role, Value** (A): `role="toolbar"` + `aria-label`
- **3.3.3 Error Suggestion** (AA): 부분 실패 토스트에 실패 사유
- **3.3.4 Error Prevention** (AA): bulkReject AlertDialog 확인 단계

### 관측성
- Backend `@AuditLog({ action: 'reject', entityType: 'checkout', entityIdPath: 'body.ids' })`
- Frontend SHOULD: `analytics.track('checkout.bulk.reject', { count, partialFailed })`

### Dark mode
brand CSS 변수 — `dark:` prefix 0

### Rollback
- backend 3파일 → frontend 4파일 순서 revert (backend 먼저 가능)
- BulkRejectDialog 신규 파일 삭제만으로 frontend 부분 rollback

---

## Phase 7 — Self-Audit + tsc + build + e2e + Sprint Archive

### Self-Audit 7대 영역 (MEMORY `feedback_pre_commit_self_audit`)

```bash
# 7-1. SSOT 위반 0
node .claude/skills/verify-ssot/scripts/check.mjs apps/ 2>&1 | tail -20

# 7-2. 하드코딩 0
node .claude/skills/verify-hardcoding/scripts/check.mjs apps/frontend/ 2>&1 | tail -20

# 7-3. eslint-disable 신규 0
git diff main..HEAD -- '*.ts' '*.tsx' | grep "^+.*eslint-disable" | wc -l
# 기대: 0건

# 7-4. role 리터럴 0 (테스트 외)
grep -rn "'ADMIN'\|'USER'\|'MANAGER'" apps/frontend/components/checkouts/ apps/backend/src/modules/checkouts/ --include="*.ts" --include="*.tsx" | grep -v ".spec.\|.test."
# 기대: 0건

# 7-5. setQueryData 0
grep -rn "setQueryData" apps/frontend/components/checkouts/
# 기대: 0건

# 7-6. any 0
grep -rn ": any\b" apps/backend/src/modules/checkouts/ apps/frontend/components/checkouts/ apps/frontend/lib/utils/checkout-return-context.ts
# 기대: 0건

# 7-7. a11y aria 누락 0
grep -L "aria-label\|aria-labelledby\|role=" apps/frontend/components/checkouts/BulkRejectDialog.tsx
# 기대: 0건 (파일이 출력되지 않음)
```

### 빌드/테스트
```bash
pnpm tsc --noEmit
pnpm build
pnpm --filter backend run test
pnpm --filter frontend run test
pnpm --filter frontend run test:e2e -- --grep "checkouts (bulk|dday|return)"
node scripts/verify-i18n-parity.mjs apps/frontend/messages/
```

### Sprint archive
```bash
mv .claude/exec-plans/active/2026-04-30-checkouts-v3-sprint45.md \
   .claude/exec-plans/completed/2026-04-30-checkouts-v3-sprint45.md

mv .claude/contracts/checkouts-v3-sprint45.md \
   .claude/contracts/completed/checkouts-v3-sprint45.md

# REGISTRY.md Active 섹션에서 해당 행 삭제
```

### Pre-push hook
`git push` — `.husky/pre-push`가 자동으로 tsc + backend/frontend test 실행

---

## Risk Matrix

| Phase | Risk | Severity | Mitigation |
|-------|------|----------|------------|
| 1 | 4-tier 호출자 영향 (backend aggregation) | low | visual level 분리 — 4-tier 헬퍼 보존 |
| 2 | pendingCount 신규 쿼리 누락 | low | Phase 0-8 검증 PASS |
| 3 | mailto 모바일 동작 차이 | low | aria-label 사전 고지 |
| 4 | optimistic update cache key mismatch | high | TCachedData 명시 + setQueryData 0 grep |
| 5 | sessionStorage private mode 차단 | medium | try/catch + URL fallback |
| 6 | bulk-reject FSM 위반 | high | 단건 reject fail-close 순서 활용 |
| 6 | partial failure UX 혼란 | medium | approvals 패턴 차용 |

## 변경 파일 총량

- **Backend**: 3 파일 (1 신규: bulk-reject.dto.ts, 2 수정)
- **Frontend**: 13 파일 (2 신규: checkout-return-context.ts, BulkRejectDialog.tsx)
- **i18n**: 2 파일 (ko/en) — 17~19 키 추가
- **Total**: 18 파일, 1 신규 endpoint, 0 신규 워크플로
