# Sprint 4.5 SHOULD 잔여 3건 — Exec Plan

**Slug**: `sprint45-should-residual`
**Date**: 2026-04-30
**Mode**: Mode 2 (Planner → Generator → Evaluator harness)
**Source**: `.claude/exec-plans/tech-debt-tracker.md` line 30-32 (S3 / S4 / S6)

---

## Goal (한 줄)

Checkouts V3 Sprint 4.5 SHOULD 이연 3건 (그룹 헤더 indeterminate 체크박스 / D-day 6-level visual regression / EmptyState in-app 도움말 라우팅) 을 **단편 임시방편 없이** 시스템 전반 개선 수준으로 마감.

---

## Architectural Context (사전 조사 결과)

| 항목 | 현재 상태 |
|------|----------|
| **D-day 6-tier SSOT** | `apps/frontend/lib/design-tokens/components/dday-colors.ts:CHECKOUT_DDAY_VISUAL_THRESHOLDS / DDAY_VISUAL_LEVEL_CLASSES / getCheckoutDdayVisualLevel()` 이미 존재 |
| **D-day 단위 테스트** | `__tests__/dday-colors.test.ts` 25 케이스 PASS — visual regression (스크린샷)만 부재 |
| **useRowSelection** | `isAllPageSelected`/`isIndeterminate` 이미 노출 (use-bulk-selection.ts:166-174) — **신규 hook 시그니처 변경 불필요** |
| **BulkActionBar** | `components/common/BulkActionBar.tsx` (canonical, generic) + `components/approvals/BulkActionBar.tsx` (wrapper) |
| **CheckoutGroupCard** | 그룹 헤더는 `CollapsibleTrigger` button + bulk approve Button 만 존재. **헤더 체크박스 자체 부재** — 신규 도입 필요 |
| **EmptyState 컴포넌트** | 3개 파일: `dashboard/atoms/EmptyState.tsx` (변형 3) / `shared/EmptyState.tsx` (variant token) / `checkouts/CheckoutEmptyState.tsx` (network/error/noPermission 등) |
| **mailto: 사용처** | `TeamMemberList.tsx`, `MemberProfileDialog.tsx` — **EmptyState 도움말 mailto 0건** (트래커 표현은 정확하지 않음 — "in-app 도움말 라우팅 자체 부재") |
| **/help 라우트** | `apps/frontend/app/(dashboard)/` 하위 미존재 — 신규 정적 페이지 생성 필요 |
| **frontend-routes.ts** | `FRONTEND_ROUTES.HELP` 키 미존재 — SSOT에 추가 필요 |
| **Storybook 의존성** | frontend `package.json` devDeps에 storybook 0건 (Playwright snapshot이 기존 인프라) |
| **Playwright snapshot 패턴** | `dashboard-screenshots.spec.ts` 존재 (역할별 fullPage 캡처). **컴포넌트 단위 snapshot 패턴 없음** — 본 작업에서 신설 |

---

## Phases

### Phase 0 — D-day 6-level Playwright snapshot 인프라 (S4)

**목표**: 의존성 신규 도입 없이, **기존 Playwright 인프라**로 D-day 6-level visual regression baseline을 확립.

**WHY Storybook이 아닌 Playwright**:

- Storybook 도입 시 `@storybook/nextjs` + `@storybook/addon-themes` ≈ 50MB devDep + CI runtime 90~120s 추가
- Playwright `expect(locator).toHaveScreenshot()` 는 이미 사용 가능 (`@playwright/test ^1.59.1` 설치됨)
- 의존성 추가 없이 검증만 추가 — 트레이드오프 우위 명확
- Storybook은 "디자인 시스템 카탈로그" 별도 sprint에 도입 검토 (out-of-scope)

**변경 파일**:

- `apps/frontend/tests/e2e/visual/dday-6level.spec.ts` (신규) — 6 case (level 1~6) × light/dark 2 모드 = 12 baseline
- `apps/frontend/tests/e2e/visual/__fixtures__/dday-fixture.tsx` (신규) — 6-level isolated rendering fixture (Next.js page route 또는 storybook 대체 페이지)
- `apps/frontend/app/(dashboard)/__visual__/dday/page.tsx` (신규, **dev-only**) — fixture page. `process.env.NODE_ENV !== 'production'` 가드. 프로덕션 빌드 제외 검증.

**의도 (WHAT, NOT HOW)**:

- 6-level fixture 페이지는 `getCheckoutDdayVisualLevel()` 6개 입력값(`-5, -2, 0, 2, 5, 10`) 을 **데이터 직접 import**하여 렌더 (하드코딩 0건)
- spec은 `daysRemaining` 입력값별로 locator 추출 → `toHaveScreenshot('dday-level-{N}-{theme}.png')`
- baseline 갱신 명령: `pnpm exec playwright test visual/dday-6level --update-snapshots`
- CI runtime 영향: 기존 chromium 프로젝트 내 spec 1개 추가 → +30s

**검증 명령**:

```bash
pnpm --filter frontend exec playwright test visual/dday-6level --project=chromium
ls apps/frontend/tests/e2e/visual/dday-6level.spec.ts-snapshots/  # 12 PNG 기대
```

**의존성**: 없음 (선행 Phase 없음)

**Rollback**: spec/fixture 파일 3개 삭제 + `(dashboard)/__visual__/` 디렉토리 삭제. baseline PNG는 git untracked 상태이므로 영향 0.

---

### Phase 1 — CheckoutGroupCard 그룹 헤더 indeterminate 체크박스 (S3, 격리 단위)

**목표**: 그룹 헤더에 indeterminate 체크박스를 도입해 **그룹 단위 일괄 선택**이 가능하게 한다. 3-state (none/some/all) 정확 반영.

#### 호출자 grep 결과 (v2 사전 조사 — TR-5 정정 근거)

| 호출자 | 파일 | 현재 selection 상태 | 통합 결정 |
|-------|------|------------------|----------|
| OutboundCheckoutsTab | `app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx:497` | `useBulkSelection`/`useRowSelection` **부재**, BulkActionBar 부재 | ⏸ **Out-of-Scope** (별도 sprint) |
| InboundCheckoutsTab | `app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx:217` | 동일하게 부재 | ⏸ **Out-of-Scope** |
| ApprovalsClient | (CheckoutGroupCard 무관, ApprovalList 호출) | 자체 selectedItems 보유 | ⛔ **무관** |

**TR-5 최종 결정 (정정)**: 부모 통합 = useBulkSelection 신규 도입 + BulkActionBar 신규 통합 + state lift up + bulk action 핸들러(approve/reject/return/cancel) 다중 도메인 신설 = **scope +50% 이상, 본 세션 범위 초과**. 따라서 부모 통합 대신 **격리 fixture page + e2e 시나리오로 indeterminate 동작 증명**으로 시니어 검증 표준 (정적+런타임+CI 3중) 달성.

**의도 (WHAT, NOT HOW)**:

- CheckoutGroupCard에 selection prop 옵셔널 추가 (`selectedRowIds?`, `onToggleRow?`, `onToggleGroup?`) — prop 미전달 시 헤더 체크박스 hidden (후방호환)
- Radix `<Checkbox checked='indeterminate'>` 패턴 (BulkActionBar 검증 패턴 재사용, `aria-checked='mixed'` 자동)
- IME 가드: `e.nativeEvent.isComposing` (verify-bulk-action-bar Step 7)
- 그룹별 row id 추출 헬퍼 SSOT는 `lib/checkouts/group-selection.ts` 신설 (`getGroupRowIds(group: CheckoutGroup): readonly string[]`)

**변경 파일**:

- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — 그룹 헤더에 Radix `<Checkbox>` 추가, prop API 3개 확장. prop 미전달 시 hidden.
- `apps/frontend/lib/checkouts/group-selection.ts` (신규) — `getGroupRowIds(group: CheckoutGroup): readonly string[]` SSOT 헬퍼. row 키 컨벤션은 checkout 단위(`group.checkouts.map(c => c.id)`).
- `apps/frontend/components/checkouts/__tests__/CheckoutGroupCard.test.tsx` (신규) — 9 케이스 (none/indeterminate/all + IME 가드 + Space/Enter + prop 미전달 시 hidden)
- `apps/frontend/messages/ko/checkouts.json`, `apps/frontend/messages/en/checkouts.json` — `groupCard.selectAll`, `groupCard.selectAllAria`, `groupCard.indeterminateAria` 신규 키 (ko + en parity)
- `.claude/skills/verify-bulk-action-bar/SKILL.md` — Step 8 신설 ("그룹 헤더 indeterminate") (SHOULD)

**Out-of-Scope (Phase 1)**:

- OutboundCheckoutsTab / InboundCheckoutsTab 부모 통합 — Phase 1.5에서 **격리 fixture로 대체**, 실제 부모 통합은 트래커 등록 후 별도 sprint
- BulkActionBar 두 파일 dedup — tech-debt-tracker 별도 항목
- Row-level RowSelectCell 도입 — 그룹 헤더 단위만

**검증 명령**:

```bash
pnpm --filter frontend test CheckoutGroupCard.test --no-coverage
pnpm --filter frontend test use-bulk-selection.test --no-coverage  # 13 PASS 회귀 0건
```

**의존성**: 없음

**Rollback**: prop은 옵셔널이라 호출처 영향 0. 헤더 체크박스 div + prop API + group-selection.ts + 테스트 파일 revert로 복원.

---

### Phase 1.5 — Visual fixture page + e2e 격리 검증 (S3 시니어 검증, NEW)

**목표**: 부모 통합 없이도 그룹 헤더 indeterminate가 **런타임에서 진짜 작동**함을 격리 환경에서 증명. 시니어 검증 표준 "정적(단위 테스트) + 런타임(fixture page) + CI(e2e)" 3중 충족.

**WHY 격리 fixture**:

- 부모 통합 = scope +50% (도메인 결정 다중 — bulk approve/reject/return/cancel)
- 격리 fixture = scope 격리 + 런타임 증명 + Phase 0 (D-day fixture) 패턴 재사용
- production 가드로 번들 영향 0

**변경 파일**:

- `apps/frontend/app/(dashboard)/__visual__/group-indeterminate/page.tsx` (신규)
  - `process.env.NODE_ENV !== 'production'` 가드 (production 미빌드 또는 `notFound()`)
  - mock CheckoutGroup 1개 (3 row, 다양한 status) + `useState<Set<string>>` 자체 selection 관리
  - CheckoutGroupCard에 selection prop 3개 전달
  - 페이지 자체 toggle 핸들러 (`onToggleRow`, `onToggleGroup`) — getGroupRowIds 사용
- `apps/frontend/tests/e2e/features/checkouts/group-indeterminate.spec.ts` (신규)
  - 시나리오 3건:
    - **A. 미선택**: `/__visual__/group-indeterminate` 진입 직후 헤더 checkbox `aria-checked="false"` (또는 `data-state="unchecked"`)
    - **B. 부분 선택 → indeterminate**: row 1건만 선택(or row checkbox는 fixture 내부 button으로 대체) → 헤더 `aria-checked="mixed"` (또는 `data-state="indeterminate"`)
    - **C. 헤더 토글**: 헤더 클릭(none → all) → 모든 row checked 상태 표시; 다시 클릭(all → none) → 모든 row unchecked

**fallback 명시**:

- e2e가 storageState 의존 시: `/__visual__/group-indeterminate`는 인증 의존 (dashboard 그룹). e2e는 기존 testEngineerPage fixture 사용
- production 빌드 검증: `pnpm --filter frontend run build` 시 `/__visual__/*` 라우트가 `notFound()` 반환 또는 빌드 제외 확인 (production bundle 영향 0)

**검증 명령**:

```bash
pnpm --filter frontend exec playwright test group-indeterminate --project=chromium
# fixture page production 가드 검증
pnpm --filter frontend run build 2>&1 | grep -E "__visual__"  # production 빌드에 미포함 또는 0KB stub
```

**의존성**: Phase 1 완료

**Rollback**: fixture page + e2e spec 단독 revert. Phase 1 (CheckoutGroupCard prop) 보존.

#### tech-debt-tracker 신규 등록 (시니어 결정)

- **항목**: `[2026-04-30 sprint-4.5 S3 후속] 🟡 MEDIUM checkouts-tab-bulk-selection-integration`
- **내용**: Outbound/Inbound 탭에 useBulkSelection + BulkActionBar 도입. CheckoutGroupCard prop API는 본 세션에 신설됨 (selectedRowIds, onToggleRow, onToggleGroup). 부모는 prop만 전달하면 헤더 indeterminate 동작 — bulk approve/reject/return/cancel 도메인 액션 정의는 별도.
- **트리거**: bulk approve/reject 운영 요구사항 발생 시

---

### Phase 2 — In-app 도움말 라우트 SSOT + EmptyState 통합 (S6)

**목표**: in-app 도움말 라우트(`/help`) 신설 + `FRONTEND_ROUTES.HELP` SSOT + EmptyState/CheckoutEmptyState에 도움말 secondary action 패턴 표준화.

**WHY**:

- 현재 EmptyState 3종 모두 도움말 secondary action 부재 — 사용자가 "어떻게 해야 하나요?" 의문 시 조치 경로 0
- `mailto:` 는 데스크톱 메일 클라이언트 의존 + 모바일 웹뷰 미흡 — in-app 라우트가 보편 기준
- **dedup 결정**: `dashboard/atoms/EmptyState.tsx` (간소형) vs `shared/EmptyState.tsx` (token 기반) — **본 세션 dedup 미수행** (수술적 변경 원칙). 양쪽 모두 secondary action 신설만 적용.

**의도 (WHAT, NOT HOW)**:

- `packages/shared-constants/src/frontend-routes.ts` — `FRONTEND_ROUTES.HELP` 신설:
  - `INDEX: '/help'`
  - `TOPIC: (topicKey: string) => '/help#${topicKey}'` (FAQ 섹션 deep link)
- `apps/frontend/app/(dashboard)/help/page.tsx` (신규) — 정적 FAQ 페이지. Next.js 16 sync Page (PageProps 패턴 미사용 — params 없는 페이지). Server Component. i18n 메시지 기반 섹션 렌더.
- `apps/frontend/app/(dashboard)/help/HelpClient.tsx` (신규, optional) — 섹션 collapsible toggle만 client. 단순 정적이면 Client 분리 불필요.
- `apps/frontend/messages/ko/help.json`, `apps/frontend/messages/en/help.json` (신규) — FAQ 컨텐츠 (4~6 섹션 권장: "반출 신청 안내", "교정 일정 확인", "부적합 보고", "권한 요청"). **사용자 컨텐츠 추측 금지** — 본 Phase에서 넣을 컨텐츠는 **plan에 placeholder 키만 명시**, 실제 카피는 사용자 confirm 받아 입력.
- `apps/frontend/components/dashboard/atoms/EmptyState.tsx` — secondary action prop 신설 (`secondaryAction?: { label: string; href?: string; onClick?: () => void }`). EmptyState 컨슈머가 도움말 링크를 표준 패턴으로 첨부할 수 있게 한다.
- `apps/frontend/components/checkouts/CheckoutEmptyState.tsx` — **이미 secondaryAction prop 존재** — 본 Phase는 추가 변경 없음 (확인만)
- `apps/frontend/components/shared/EmptyState.tsx` — **이미 secondaryAction prop 존재** — 추가 변경 없음

**Out-of-Scope**:

- EmptyState 두/세 파일 dedup — 본 세션 미수행 (별도 tech-debt 항목)
- 실제 FAQ 콘텐츠 작성 — 사용자 confirm 후 별도 작업 (placeholder 키만 등록)
- `mailto:` 사용처 (`TeamMemberList`, `MemberProfileDialog`) 변경 — 본 Phase 범위 외 (도메인 의도가 다름: 회원 직접 컨택 vs 일반 도움말)

**검증 명령**:

```bash
# SSOT 등록 확인
grep -n "HELP:" packages/shared-constants/src/frontend-routes.ts
# 라우트 페이지 존재
ls apps/frontend/app/\(dashboard\)/help/page.tsx
# EmptyState secondary action API
grep -n "secondaryAction" apps/frontend/components/dashboard/atoms/EmptyState.tsx
# i18n parity
test "$(jq 'keys | length' apps/frontend/messages/ko/help.json)" = "$(jq 'keys | length' apps/frontend/messages/en/help.json)"
```

**의존성**: 없음

**Rollback**:

- frontend-routes.ts에서 `HELP` 키 제거
- `app/(dashboard)/help/` 디렉토리 삭제
- `messages/{ko,en}/help.json` 삭제
- EmptyState `secondaryAction` prop 제거 (옵셔널이므로 호출처 영향 0)

---

### Phase 3 — 검증 + tech-debt-tracker 정리

**목표**: 전체 검증 + 항목 archive 이전 + 후속 SHOULD 등록.

**변경 파일**:

- `.claude/exec-plans/tech-debt-tracker.md` — line 30-32 strikethrough + Batch 이력에 본 세션 등록
- `.claude/exec-plans/tech-debt-tracker-archive.md` — S3/S4/S6 항목 이동
- `.claude/contracts/REGISTRY.md` — Active에서 본 slug 이동, completed/ 디렉토리에 contract 복사

**검증 명령**:

```bash
# Phase 0~2 모든 변경 통합 검증
pnpm tsc --noEmit
pnpm --filter frontend run build
pnpm --filter frontend run lint
pnpm --filter frontend test --no-coverage
pnpm --filter frontend exec playwright test visual/dday-6level --project=chromium

# verify-* 스킬 회귀
grep -rn "useFormState" apps/frontend --include="*.tsx" --include="*.ts" | grep -v node_modules  # 0건 기대
grep -rn "from 'middleware'" apps/frontend --include="*.tsx" | grep -v node_modules  # 0건
grep -rn "router\.push.*'/help" apps/frontend --include="*.tsx"  # 하드코딩 0, FRONTEND_ROUTES.HELP 사용
```

**의존성**: Phase 0, 1, 2 완료

---

## 아키텍처 보강 섹션 (필수)

### SSOT 통합 매트릭스

| 데이터 | SSOT 위치 | 본 세션에서 import 경로 |
|--------|----------|------------------------|
| D-day 6-level threshold | `lib/design-tokens/components/dday-colors.ts` | `CHECKOUT_DDAY_VISUAL_THRESHOLDS`, `getCheckoutDdayVisualLevel()` |
| D-day 6-level CSS class | 동일 | `DDAY_VISUAL_LEVEL_CLASSES` |
| Bulk selection | `hooks/use-bulk-selection.ts` | `useRowSelection` (시그니처 변경 0건) |
| Help route | `packages/shared-constants/src/frontend-routes.ts` | `FRONTEND_ROUTES.HELP` (신규 추가) |
| Checkbox primitive | `components/ui/checkbox.tsx` | Radix `data-state='indeterminate'` |
| Validation rules (charset 등) | `packages/shared-constants/src/validation-rules.ts` | 본 세션 직접 import 없음 (S3 단순 selection only) |

### i18n parity 체크리스트

- ko + en 양쪽에 동일 키 추가 (jq keys length 비교 검증)
- `groupCard.selectAll`, `groupCard.selectAllAria`, `groupCard.indeterminate` (S3)
- `help.title`, `help.sections.*`, `help.searchPlaceholder` (S6 placeholder)
- `emptyState.secondaryAction.help` 표준 라벨 (Phase 2)

### Dark mode 지원

- D-day 6-level snapshot은 `light` + `dark` 양쪽 캡처 (Phase 0)
- 그룹 헤더 체크박스는 Radix Checkbox 사용 — `data-[state=*]` selector + brand CSS 변수로 자동 dark 대응
- Help 페이지: brand semantic token만 사용, `dark:` prefix 0건

### A11y SC 명시 (WCAG 2.2)

| 요구사항 | SC | 본 세션 적용 |
|---------|----|---|
| Indeterminate aria-checked='mixed' | 4.1.2 Name, Role, Value | Radix 자동 (Phase 1) |
| 카운트 변화 SR 알림 | 4.1.3 Status Messages | 그룹 헤더 옆 sr-only span aria-live='polite' (Phase 1) |
| Keyboard operable (Space/Enter) | 2.1.1 Keyboard | Radix Checkbox 기본 + IME 가드 (Phase 1) |
| Help 페이지 헤딩 구조 | 1.3.1 Info and Relationships | h1 → h2 (섹션) 단계 (Phase 2) |
| Help 링크 가시 라벨 | 2.4.4 Link Purpose | EmptyState secondaryAction.label 명시 (Phase 2) |
| Reduced motion | 2.3.3 Animation from Interactions | D-day Level 6 `motion-safe:animate-pulse` (이미 SSOT) |

### Bundle size impact

- Phase 0: dev-only fixture page → production bundle 0 (`process.env.NODE_ENV` 가드)
- Phase 1: 체크박스 prop 추가 — Tailwind class만 증가 (~ +0.3KB gzip)
- Phase 2: `/help` 정적 페이지 + i18n JSON ~3KB → +5~7KB First Load (route segment, 방문 시만 fetch)
- **합산 추정**: 메인 청크 +0.3KB / `/help` 청크 +5~7KB. SHOULD baseline 갱신 권장 (출시 후).

### Performance 고려

- 그룹 헤더 체크박스 클릭 → `onToggleGroup(rowIds, allSelected)` 콜백만 호출 — 부모가 single setState로 처리
- `useRowSelection` snapshot Map은 LRU 500 cap 보존 (use-bulk-selection.ts:48). 그룹 toggle은 selectAllOnPage 와 동일 비용 O(n)
- React.memo `CheckoutGroupCard` 보존 — selection prop이 추가되어도 부모가 stable callback 전달 시 re-render 영향 없음
- D-day fixture page는 production 미포함 — runtime 영향 0

---

## Out-of-Scope (명시적 제외)

본 세션에서 의도적으로 다루지 않는 항목 (수술적 변경 원칙):

1. **BulkActionBar 두 파일 dedup** (`components/common/` vs `components/approvals/`) — tech-debt-tracker line 22 별도 항목
2. **EmptyState 3종 dedup** (`dashboard/atoms/` / `shared/` / `checkouts/CheckoutEmptyState`) — 별도 sprint
3. **mailto: 사용처 변경** (`TeamMemberList`, `MemberProfileDialog`) — 도메인 의도(직접 컨택)가 in-app 도움말과 다름
4. **CheckoutGroupCard selection 부모 통합 (TR-5 v2 정정)** — prop API만 노출 + 격리 fixture page + e2e 시나리오로 런타임 동작 증명. OutboundCheckoutsTab/InboundCheckoutsTab 부모 통합 (useBulkSelection + BulkActionBar + bulk action 핸들러 도메인 결정)은 scope +50%로 본 세션 초과 — `checkouts-tab-bulk-selection-integration` 트래커 신규 등록.
5. **실제 Help FAQ 콘텐츠 작성** — 사용자 confirm 후 별도 작업
6. **Storybook 도입** — 의존성 추가 신중성 우선 — Playwright snapshot으로 충분
7. **D-day 6-level 외 시각 회귀 baseline 확장** (예: BulkActionBar / NextStepPanel snapshot) — S4 범위에 포함 안 됨
8. **CharsCounter 5곳 SSOT 통합** (tech-debt-tracker line 23 별도) — 본 세션 무관
9. **PII deny-list 'role' 정책 명문화** (line 24) — 별도

---

## Test Matrix

### S3 — CheckoutGroupCard 헤더 indeterminate

| 시나리오 | 입력 | 기대 |
|---------|------|------|
| 빈 그룹 | rows=[] | 헤더 체크박스 hidden 또는 disabled |
| 미선택 | selected=∅, rows=3 | `data-state='unchecked'`, aria-checked='false' |
| 일부 선택 | selected={1}, rows=3 | `data-state='indeterminate'`, aria-checked='mixed' |
| 전체 선택 | selected={1,2,3}, rows=3 | `data-state='checked'`, aria-checked='true' |
| 헤더 클릭 (none → all) | onToggleGroup 호출 | rowIds 전체 + `allSelected=false` 인자 |
| 헤더 클릭 (indeterminate → all) | onToggleGroup 호출 | rowIds 전체 + `allSelected=false` |
| 헤더 클릭 (all → none) | onToggleGroup 호출 | rowIds 전체 + `allSelected=true` |
| Space 키 토글 | 헤더 focus + Space | 위 클릭과 동일 (Radix 기본) |
| 한글 IME 입력 중 Enter | nativeEvent.isComposing=true | 토글 무시 |

**언어 × 테마**: ko/en × light/dark 4 조합 모두 RTL 회귀 없음 (시각 회귀 부분 — Phase 0 인프라 재사용 가능하나 본 세션 SHOULD)

**Phase 1.5 e2e 시나리오 (TR-5 v2 격리 검증)**:

| 시나리오 | 입력 | 기대 |
|---------|------|------|
| A. 미선택 진입 | `/__visual__/group-indeterminate` 첫 진입 | 헤더 checkbox `data-state="unchecked"` 또는 `aria-checked="false"` |
| B. 부분 선택 | row 1건 토글 | 헤더 `data-state="indeterminate"` 또는 `aria-checked="mixed"` |
| C. 헤더 토글 (none → all → none) | 헤더 click ×2 | 1차 클릭 후 모든 row checked, 2차 클릭 후 모든 row unchecked |

### S4 — D-day 6-level snapshot

| level | daysRemaining | 기대 className 키워드 | 테마 매트릭스 |
|------|--------------|--------------------|------------|
| 1 (relaxed) | 10 | `bg-muted` | light + dark |
| 2 (normal) | 5 | `bg-brand-info/10` | light + dark |
| 3 (warning-soft) | 2 | `bg-brand-warning/14` | light + dark |
| 4 (urgent) | 0 | `bg-brand-warning/20` | light + dark |
| 5 (overdue-light) | -2 | `bg-brand-critical/14` | light + dark |
| 6 (critical-pulse) | -5 | `bg-brand-critical/20 motion-safe:animate-pulse` | light + dark |

**12 baseline PNG** = 6 level × 2 theme. Playwright `--update-snapshots`로 1회 캡처.

### S6 — In-app help 라우트

| 시나리오 | 기대 |
|---------|------|
| `/help` 접근 (모든 역할) | 200 OK, h1 visible |
| `FRONTEND_ROUTES.HELP.INDEX` import | `'/help'` 반환 |
| EmptyState secondaryAction `{ label, href: FRONTEND_ROUTES.HELP.INDEX }` | Link 렌더, 클릭 시 `/help` 이동 |
| ko + en JSON keys 동일 | jq keys length 비교 |
| `mailto:` regression in EmptyState consumers | 0건 (dashboard/checkout/shared 모두) |

---

## Rollback Plan (Phase 단위)

| Phase | Rollback 명령 |
|-------|--------------|
| Phase 0 | `git revert <commit>` — D-day fixture page + spec + snapshots 디렉토리 영향 (production bundle 영향 0) |
| Phase 1 | `git revert <commit>` — CheckoutGroupCard prop 옵셔널이라 호출처 영향 0 (후방호환). 단위 테스트 파일 + group-selection.ts 자동 삭제 |
| Phase 1.5 | `git revert <commit>` — group-indeterminate fixture page + e2e spec 단독 revert 가능. Phase 1 (prop API) 보존 |
| Phase 2 | `git revert <commit>` — `/help` 라우트 + i18n + secondaryAction prop. EmptyState consumer 미사용 시 prop 영향 0 |

전체 revert: `git reset --hard <pre-session-sha>` — solo trunk-based, 단일 main 브랜치이므로 revert PR 불필요 (단, 이미 push된 경우 `git revert` 권장).

---

## Observability

### Phase 0 — Visual regression

- baseline PNG는 git 추적 (`tests/e2e/visual/dday-6level.spec.ts-snapshots/`) — `.gitignore` 미포함 확인 필수
- CI 명령: `pnpm --filter frontend exec playwright test visual/dday-6level --project=chromium` — 회귀 시 `--snapshot-diffs` 디렉토리 artifact 업로드 권장 (별도 CI sprint)
- 디자인 토큰 변경 시: 의도된 변경이면 `--update-snapshots`로 baseline 갱신 + 커밋 메시지에 `chore(visual): refresh dday baseline` 명시

### Phase 1 — Selection analytics (optional, SHOULD)

- `track('checkout.group.toggleAll', { state: 'all' | 'none', rowCount })` (analytics SSOT 재사용) — PII 없음. **본 세션 MUST 미포함, SHOULD로 가능**

### Phase 2 — Help page hit tracking (optional, SHOULD)

- `track('help.view', { topic: <hash> })` (analytics SSOT)

---

## 사용자 승인 필요 사항

1. **Help 페이지 콘텐츠**: 본 plan은 placeholder i18n 키만 등록. 실제 FAQ 4~6 섹션 카피는 별도 작업.
2. **D-day fixture 페이지 위치**: `app/(dashboard)/__visual__/dday/page.tsx` 가 적절한가, 아니면 `app/__visual__/dday/page.tsx` (dashboard 외부) 가 더 적절한가? 인증 의존도 고려.
3. **CheckoutGroupCard selection prop drilling**: 본 세션은 prop API만 추가. 부모 통합은 후속 — 동의 여부.

---

## 산출물 체크리스트

- [ ] `.claude/contracts/sprint45-should-residual.md` 작성 완료
- [ ] `.claude/contracts/REGISTRY.md` Active 1행 추가
- [ ] Generator 진행 전 사용자 승인
