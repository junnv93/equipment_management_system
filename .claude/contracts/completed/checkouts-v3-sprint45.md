# Contract — Checkouts V3 Sprint 4.5 T1+T2

## Scope

Sprint 4.5의 6개 편의성 UX 항목 (T1+T2):
- **U-09** D-day 시각 6-level 분리 (4-tier SSOT 보존, 시각 헬퍼만 6-level)
- **U-11** SidebarNav "내 차례 N" 배지 (pendingCount 재사용)
- **U-12** EmptyState 인간적 복구 경로 (variant별 secondary action)
- **U-10** Optimistic UI + Skeleton 일관성 (CAS 409 detail invalidate)
- **U-07** 돌아가기 컨텍스트 보존 (URL SSOT + sessionStorage 보조)
- **U-01** 일괄 승인/반려 (bulk-reject backend 신설 + BulkActionBar wiring)

선행 Sprint (1~3, 4.1~4.4, 5) 모두 완료. 본 Contract는 Sprint 4.5 T1·T2 종결 기준.

## MUST (loop-blocking)

- [ ] **M1** tsc --noEmit PASS — `pnpm tsc --noEmit` 전 패키지
- [ ] **M2** pnpm build PASS — frontend + backend
- [ ] **M3** SSOT 위반 0건 — `verify-ssot` Step 42-44, `@equipment-management/schemas` enum 로컬 재정의 0, `@equipment-management/shared-constants` permission/endpoint 로컬 재정의 0
- [ ] **M4** 하드코딩 0건 — `verify-hardcoding` Step 28 (`router.push` FRONTEND_ROUTES 경유), URL 문자열 인라인 0, magic number 0
- [ ] **M5** i18n parity ko/en 100% — 신규 키 양쪽 추가, `verify-i18n` Step 19 PASS, 빈 문자열 prop 0
  > **D2 delegation 후속 갱신 (2026-04-30)**: Plan-level 17~19키 추정은 BulkRejectDialog 신설 전제. 실제 구현은 ApprovalsClient(`outgoing`/`incoming` 카테고리)로 delegation — `toasts.bulkApprove*` 기존 키 재사용. 신규 추가 키는 `ddaySrLabel.{overdue,urgent,normal,relaxed}` (4) + `emptyState.{error.retry,network.offlineReason}` (2) = 6키. ko/en parity 100%.
- [ ] **M6** setQueryData 사용 0 — `useOptimisticMutation.onSuccess` 내 setQueryData 금지 (MEMORY)
- [ ] **M7** 서버사이드 userId 추출 — `bulk-reject` controller `extractUserId(req)` (Rule 2), body 신뢰 0
- [ ] **M8** CAS 409 처리 — `useOptimisticMutation` onError에서 detail 캐시 invalidate (MEMORY: stale cache 무한 409 방지)
- [ ] **M9** WCAG 색만으로 정보 전달 0 — D-day는 색+숫자+아이콘+sr-only 4중 단서
- [ ] **M10** prefers-reduced-motion 존중 — D+ pulse animation은 `motion-safe:` prefix
- [ ] **M11** ARIA 적절 — BulkActionBar `role="toolbar"` + `aria-live="polite"`, EmptyState `role="status"` (정보) / `role="alert"` (네트워크 오프라인) 분기
  > **2026-04-30 수정**: `apps/frontend/components/common/BulkActionBar.tsx:75`에 `aria-live="polite"` 추가 (선택 카운트 변화 SR 알림). EmptyState `CheckoutEmptyState.tsx:74-75` 분기 적용.
- [ ] **M12** dark mode CSS 변수 기반 — `dark:` prefix 0건 (design-token 파일 내, MEMORY brand-color-migration)
- [ ] **M13** Backend `bulk-reject` 응답 스키마 — `bulk-approve.dto.ts`와 대칭 (`{rejected: [{id,version}], failed: [{id,error}]}`)
- [ ] **M14** bulk action partial failure — 전체 실패 / 부분 성공 / 전체 성공 3-way 토스트 분리 (approvals ApprovalsClient 패턴)
  > **D2 delegation 후속 (2026-04-30)**: ApprovalsClient.tsx ll. 263-289 + 354-391에 3-way toast 완전 구현. checkout 도메인은 `isCheckoutCategory(category)` 분기로 backend bulk endpoint 호출 후 동일 패턴 활용. 신규 BulkRejectDialog 신설 N/A — 기존 RejectModal + bulkRejectMutation 재사용.
- [ ] **M15** BulkActionBar 도메인 wrapper 0 — `apps/frontend/components/checkouts/`에 `function BulkActionBar` 신규 정의 0건 (공용 재사용만, D2)
- [ ] **M16** bulk-reject 보안 fail-close 순서 — scope → FSM → reason validation 순 (단건 `reject` 패턴 그대로, MEMORY 보안 규칙 "도메인 검증이 scope 이전이면 스코프 외 사용자가 오류 메시지로 상태 역추론 가능")
- [ ] **M17** pre-push hook 통과 — `.husky/pre-push` 자동 실행 (tsc + backend/frontend test)
- [ ] **M18** any 사용 0 — 신규/수정 파일에서 `: any` 0건
- [ ] **M19** bulk-reject reason required + max 500 — Zod 검증 (단건 reject 동등 수준)
- [ ] **M20** AuditLog 기록 — bulk-approve/bulk-reject 모두 `entityIdPath: 'body.ids'`로 배열 기록
- [ ] **M21** 4-tier SSOT 보존 — `getCheckoutDday4Tier`/`DDAY_4TIER_CLASSES` 호출자 변경 0 (D1 하이브리드 — 시각 6-level은 별도 헬퍼)

## SHOULD (record + follow-up)

- [ ] **S1** BulkActionBar actions slot 표준 명문화 (`SKILL.md` step 추가)
- [ ] **S2** useRowSelection IME 가드 (단축키 A/Shift+A 한글 입력 중 발화 방지)
- [ ] **S3** 그룹 헤더 indeterminate 체크박스 (CheckoutGroupCard 헤더 그룹 단위 일괄 선택)
- [ ] **S4** D-day 6-level 시각 디자인 storybook 추가 (visual regression)
- [ ] **S5** U-07 sessionStorage TTL 1시간 자동 삭제 (구현됨)
- [ ] **S6** U-12 mailto 외 in-app 도움말 페이지 라우팅 (PublicHelpPage 신설 시)
- [ ] **S7** U-11 분석 이벤트 (`sidebar.checkouts.click`, pendingCount 동선 측정)
- [ ] **S8** bulk-reject e2e 테스트 (Playwright, 5건 일괄 반려 + 부분 실패 시뮬레이션)
- [ ] **S9** BulkRejectDialog reason textarea charsRemaining 카운터 (qualityApproveDialog `2f24232e` 패턴)

## Non-Goals (out of scope)

- Sprint 4.5 T3 (별도 세션 — undo timeline, alert dedup 등)
- audit log 신규 카테고리 (기존 'approve'/'reject' action 재사용)
- bulk-cancel / bulk-return (status-aware bulk는 별도 Sprint)
- D-day 6-tier backend 임계값 격상 (D1: 4-tier SSOT 보존)
- equipment 도메인 동일 패턴 적용 (L4ext — 본 Sprint scope 외)
- approvals 도메인 BulkActionBar 개선 (S1~S3은 별도 PR)
- BulkActionBar 도메인별 wrapper 신설 (D2: 공용 재사용 강제)
- pending 외 탭(outbound/inbound)에 BulkActionBar 노출 (D3: pending only)

## Verification Commands

### Phase 0 (Pre-flight, 12개)
```bash
grep -n "bulk-approve" apps/backend/src/modules/checkouts/checkouts.controller.ts
grep -rn "bulk-reject" apps/backend/src/modules/checkouts/  # 0건
grep -n "DDAY_4TIER_CLASSES" apps/frontend/lib/design-tokens/components/dday-colors.ts
grep -n "export function useRowSelection" apps/frontend/hooks/use-bulk-selection.ts
grep -n "pendingCount" apps/frontend/lib/api/query-config.ts  # ll. 554
grep -n "CHECKOUTS" apps/frontend/lib/constants/routes.ts
grep -n "TCachedData" apps/frontend/hooks/use-optimistic-mutation.tsx
```

### Phase 7 (Self-audit + Final)
```bash
# Static
pnpm tsc --noEmit
pnpm build
pnpm lint

# Tests
pnpm --filter backend run test
pnpm --filter frontend run test
pnpm --filter frontend run test:e2e -- --grep "checkouts (bulk|dday|return)"

# SSOT/하드코딩 grep
grep -rn "setQueryData" apps/frontend/components/checkouts/  # 0
grep -rn ": any\b" apps/{backend,frontend}/src/modules/checkouts apps/frontend/components/checkouts/ # 0
grep -rn "dark:" apps/frontend/lib/design-tokens/components/dday-colors.ts  # 0
grep -rn "function BulkActionBar\b" apps/frontend/components/checkouts/  # 0
grep -rn "router.push.*['\"]\\./checkouts" apps/frontend/components/checkouts/  # 0

# i18n + a11y
node scripts/verify-i18n-parity.mjs apps/frontend/messages/
```

## Architecture Constraints

### CLAUDE.md Rules (위반 시 production bug)
- **Rule 0 (SSOT)**: `@equipment-management/schemas` enum / `@equipment-management/shared-constants` permission/endpoint 로컬 재정의 0
- **Rule 1 (Single DB)**: 별도 테스트 DB 제안 0 (e2e도 development DB)
- **Rule 2 (Server-side userId)**: `bulk-reject` controller `extractUserId(req)` — body의 rejectorId 신뢰 0
- **Rule 3 (TypeScript Strict)**: `any` 0 — `BulkRejectResult`/`BulkRejectInput` 타입 명시
- **Rule 4 (Next.js 16)**: `params/searchParams` Promise — `await props.params` 패턴 (해당 시)

### MEMORY 핵심 가드레일
- `feedback_main_only_no_branches`: 모든 작업 main 직접 (브랜치 0)
- `feedback_qr_is_path_not_workflow`: 신규 워크플로 0 — bulk-reject는 단건 reject service의 batch wrapper
- `feedback_disabled_with_reason_over_hide`: U-12 network offline 시 primary action `disabled` + i18n 사유 (hide 0)
- `feedback_pre_commit_self_audit`: 7대 영역 매 커밋 전 grep
- `feedback_lintstaged_other_session_files`: 커밋 전 staged 파일 다른 세션 파일 0
- `useOptimisticMutation setQueryData 금지`: TData ≠ TCachedData crash 방지
- `CAS 409 detail 캐시 invalidate`: 미삭제 시 stale cache 재시도 무한 409
- `verify-ssot Step 42-44`: 신설 SSOT 등록 절차
- `verify-i18n Step 19`: ko/en parity grep
- `verify-hardcoding Step 28`: router.push FRONTEND_ROUTES 경유
- `verify-frontend-state Step 35`: setQueryData 0
- `behavioral-guidelines.md`: 코딩 전 생각하기 / 최소 코드 / 수술적 변경 / 목표 기반 실행
- `feedback_destructive_dry_run_first`: rm/mv 전 대상 리스트 출력

### 보안 추가 가드
- bulk-reject는 단건 `reject`의 fail-close 순서 그대로: scope → FSM → reason validation
- max 50건 (DoS 가드 — bulk-approve 동일)
- AuditLog `entityIdPath: 'body.ids'`

## L0 Inferred Assumptions
1. D-day 4-tier SSOT 보존이 backend aggregation 일관성에 필수 (D1 하이브리드)
2. `queryKeys.checkouts.resource.pendingCount()` 존재 (Phase 0-8 검증됨)
3. checkout pending 탭 = pending status 단일 — bulk approve/reject UX 자연스러움 (D3)
4. `BulkActionBar` 공용 actions slot이 checkout 도메인 버튼 수용 충분 (D2)
5. 단건 `reject` service의 fail-close 순서가 bulk에 그대로 적용 가능 (D4)
6. sessionStorage TTL 1시간이 사용자 동선에 적합

## D2 Delegation 결정 후속 갱신 (2026-04-30)

Plan에서 정의한 "BulkRejectDialog.tsx 신설 + checkout pending 탭 wiring"은 실제 코드베이스 검증 결과 **불필요**:
1. ApprovalsClient.tsx가 이미 `outgoing`/`incoming` 카테고리로 checkout 승인/반려를 담당 (`AdminApprovals` 페이지)
2. BulkActionBar + useRowSelection + bulkApproveMutation + bulkRejectMutation + RejectModal 모두 구현됨
3. 본 Sprint 변경은 **delegation adapter** — `approvalsApi.bulkApprove/bulkReject`에서 checkout 카테고리일 때 backend bulk endpoint(`/api/checkouts/bulk-approve`, `/api/checkouts/bulk-reject`)로 위임
4. 결과적으로 N개 HTTP 요청 → 1개로 감소, AuditLog 통합 기록(`entityIdPath: 'body.ids'`)

**N/A 항목** (D2 delegation으로 대체됨):
- BulkRejectDialog.tsx 신설 → ApprovalsClient.RejectModal 재사용
- `checkouts.bulk.*` 8 i18n 키 → ApprovalsClient의 `toasts.bulkApprove*` 키 재사용
- `checkouts.emptyState.recovery.*` 5 i18n 키 → caller-provided secondaryAction label 패턴
- BulkActionBar pending 탭 wiring → ApprovalsClient에서 이미 wired

이 변경은 contract 의도(M14 3-way toast, M11 aria-live, M15 도메인 wrapper 0, S2 IME 가드)를 모두 충족하면서 DRY 위반 없이 backend bulk endpoint를 활용한다.

## Sprint 종결 조건
- [ ] M1~M21 모두 PASS
- [ ] S1~S9 follow-up 항목 issue/tracker 등록
- [ ] `git push` pre-push hook PASS
- [ ] active → completed 이동 (`.claude/exec-plans/`, `.claude/contracts/`)
- [ ] MEMORY 프로젝트 이력 항목 추가
