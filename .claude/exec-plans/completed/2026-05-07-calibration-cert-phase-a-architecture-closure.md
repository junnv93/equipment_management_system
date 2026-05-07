# Calibration Certificate Phase A — Architecture Closure (Mode 2, atomic)

## 메타
- 생성: 2026-05-07
- 모드: Mode 2 (Planner → Generator → Evaluator loop)
- Slug: `calibration-cert-phase-a-architecture-closure`
- 후속 sprint: `calibration-cert-phase-a-closure` (2026-05-06 commit `80e77488`로 사용자-facing 가치 main 반영)
- 예상 변경: ~13 파일 (신규 5 / 수정 8)
- atomic 단일 commit (분할 시 cross-dep 위험 — sub-route는 useEquipment chip data sourcing 의존, FilterChip은 design token 의존)

---

## 설계 철학

Phase A 사용자-facing 가치(controller + ErrorCode 5-layer + e2e + register/dialog PDF Uploader + filter chip + dialog managementNumber prop)는 main에서 동작 중이다. 시니어 자기 감사 결과 *시스템 전반 일관성* 갭 6건이 식별됐다 — 이는 단편 해결의 잔재이며, **새 기능 추가가 아닌 기존 기능을 다른 도메인 패턴과 정합시키는 작업**이다.

핵심 원칙:
- **재사용 우선** — 기존 hook/api/component를 합성. 신규 service/API/data flow 0건.
- **mirror 우선** — `repair-history`/`calibration-factors`/`non-conformance` 3 도메인 sub-route 패턴을 정확히 따름.
- **SSOT 강제** — chip/design token 분산 → 단일 진입점.
- **cross-domain 격리** — `lib/api/*`(query-r3-closure 진행 중) / dashboard / approvals / checkouts / commit-pipeline 손대지 않음.

---

## 사전 탐색 결과 (직접 read evidence)

### F.1 Sub-route 3 도메인 패턴 비교

| 도메인 | page.tsx 패턴 | Server Component fetch | 메타데이터 |
|---|---|---|---|
| `repair-history` | sync Page → `Suspense` → `*ContentAsync` (params/searchParams 분리 await) | 없음 (Client에서만 fetch) | `generateMetadata` Promise + ID 표시 |
| `calibration-factors` | sync Page → `Suspense` → `*ContentAsync` (params만) | 없음 | `generateMetadata` Promise |
| `non-conformance` | sync Page → `Suspense` → `*Async` + `getEquipmentCached` (`React.cache`) prefetch + `notFound()` 404 처리 | 있음 (장비 + NC 병렬 prefetch, NC 실패 시 undefined 폴백) | 없음 |

**결정**: `non-conformance` 패턴 채택. equipment prefetch + NC와 동일하게 calibration history도 server-side prefetch (chip data sourcing 갭 4와 정합 — list 비어도 chip이 deterministic하게 장비명/관리번호 표시).

### F.2 기존 재사용 자산 확인

- `useEquipment(id)` (`apps/frontend/hooks/use-equipment.ts:37`) — 이미 존재. `queryKey: queryKeys.equipment.detail(id)` + `QUERY_CONFIG.EQUIPMENT_DETAIL`. 신규 fetcher 작성 금지.
- `CalibrationListTable` (`apps/frontend/components/calibration/CalibrationListTable.tsx`) — 데이터 props 기반. 재사용.
- `CalibrationRegisterDialog` (`apps/frontend/components/equipment/CalibrationRegisterDialog.tsx`) — `equipmentId` + `managementNumber` props 받음. 재사용.
- `CalibrationHistoryTab` (`apps/frontend/components/equipment/CalibrationHistoryTab.tsx`) — equipment prop 받아 calibrations + documents 일괄 조회 + table 렌더 + register dialog 통합. **이 컴포넌트가 sub-route Client component의 핵심 재사용 단위**.
- `PageHeader` (`apps/frontend/components/shared/PageHeader.tsx`) — backUrl/backLabel 지원.
- `equipmentApiServer.getEquipment` + `isNotFoundError` — `non-conformance/page.tsx`에서 검증된 server-side fetch 패턴.

### F.3 Inline chip의 정확한 위치 + i18n 상태

- `apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx:241` — `bg-muted/50 border border-border text-sm` inline tailwind chip.
- chip data: `calibrationHistoryData?.data?.[0]?.equipmentName ?? '—'` + `?.managementNumber` (갭 4 — 0건이면 `—` 표시).
- i18n key 이미 존재: `calibration.content.filterChip.{equipmentLabel,clear,clearAriaLabel}` (ko line 297-301 / en parity 확인).
- 신규 i18n 키 작성 0건 — 기존 키 재배치만.

### F.4 Design token 패턴 (FilterChip 위치 결정)

- 13 파일이 `BADGE_TOKENS|SEMANTIC_BADGE` 사용 (`audit/checkout/team/approval/non-conformance/...`). 패턴: `Record<Variant, classString>` + getter 함수 + JIT-safe (`as const`).
- `non-conformance.ts` `NC_STATUS_SEMANTIC_MAP` + `getSemanticBadgeClasses()` 패턴이 가장 가까움.
- **결정**: `lib/design-tokens/components/filter-chip.ts` 신규. 신 시스템이 아닌 기존 token 시스템에 *컴포넌트 단위로 추가* — `BADGE_TOKENS` 재사용은 chip이 badge가 아닌 *interactive remove button* 가지므로 부적합.
- index.ts re-export 추가.

### F.5 AuditLog 갭 5 — 옵션 A 선택

- `audit-log.decorator.ts:20-21` — `entityIdPath?: string` 지원 (`'response.uuid'` 같은 경로 문자열).
- controller 현재: `@AuditLog({ action: 'extract', entityType: 'calibration_certificate' })` — entityIdPath 누락 → backend warn `Could not extract entityId for extract calibration_certificate`.
- 응답 shape: `ExtractedCalibrationCertificate` (response에 `certificateNumber: string` 존재 — domain entity ID로 적합).
- **결정**: 옵션 A — `entityIdPath: 'response.certificateNumber'` 추가. dry-run audit 별도 처리는 새 인프라 필요 = 과한 변경. 단순 path 1줄로 silent miss 차단.

### F.6 Dialog 위치 (재사용)

- `CalibrationRegisterDialog`는 이미 `equipmentId` + `managementNumber` props로 mismatch 토스트 처리 중 (`certificateUpload.noEquipmentMatch` 키 + state 미보존).
- sub-route Client에서 동일 prop 전달 — 본 sprint dialog 변경 0건.

---

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| sub-route Client 위치 | `apps/frontend/components/equipment/CalibrationHistoryClient.tsx` | repair-history mirror — `components/equipment/RepairHistoryClient.tsx` 위치 패턴 정합 |
| sub-route 데이터 fetching | server-side `getEquipmentCached` prefetch (`non-conformance` 패턴) + Client는 `CalibrationHistoryTab` 합성 | F.1 — 가장 robust한 패턴, 갭 4 chip data 자연스럽게 해결 |
| FilterChip 위치 | `apps/frontend/components/shared/FilterChip.tsx` | shared/ 디렉토리에 EmptyState/PageHeader/ErrorState 등 재사용 컴포넌트 모임 |
| FilterChip 시그니처 | `{ label: string; value: ReactNode; onClear: () => void; clearAriaLabel: string }` | label/value 분리로 i18n 변수 자유도 + ariaLabel 필수 (a11y) |
| design token 위치 | `lib/design-tokens/components/filter-chip.ts` 신규 + index.ts re-export | F.4 — chip은 badge가 아닌 button 포함, 신규 token 그룹 적합 |
| chip data sourcing | `useEquipment(equipmentId)` 호출 추가 (별도 useQuery) | F.2 — 기존 hook 재사용. fetcher 작성 0건. list `[0]` 의존 제거 |
| AuditLog 처리 | `entityIdPath: 'response.certificateNumber'` (옵션 A) | F.5 — 1줄 변경, 새 인프라 0건 |
| RTL spec 위치 | `apps/frontend/app/(dashboard)/calibration/__tests__/CalibrationContent.test.tsx` + `apps/frontend/components/equipment/__tests__/CalibrationRegisterDialog.test.tsx` | 컴포넌트 위치 mirror. 기존 `CalibrationCertificatePdfUploader.test.tsx` 패턴 재사용 |
| atomic single commit | 6 갭 모두 한 commit | sub-route ↔ FilterChip ↔ design token ↔ chip data sourcing 4개가 cross-dep. RTL spec은 모든 컴포넌트 의존. AuditLog는 backend independent하지만 sprint 단위로 묶음 |

---

## 구현 Phase

### Phase 1: Sub-route 신설 (HIGH 갭 1)

**목표:** `/equipment/[id]/calibration-history` 신규 sub-route. `non-conformance` mirror 패턴.

**달성해야 할 것 (what to achieve, NOT how to code):**
- `apps/frontend/app/(dashboard)/equipment/[id]/calibration-history/page.tsx` Server Component (sync Page → Suspense → async ContentAsync) — Next.js 16 PageProps + `await props.params`
- `apps/frontend/app/(dashboard)/equipment/[id]/calibration-history/loading.tsx` (skeleton)
- `apps/frontend/components/equipment/CalibrationHistoryClient.tsx` Client Component — equipment prop 수신, `CalibrationHistoryTab` 또는 `CalibrationListTable` + register dialog 합성
- `getEquipmentCached(React.cache)` 서버 prefetch + `isNotFoundError → notFound()` 처리
- `generateMetadata` 한국어 문자열 (다른 도메인 mirror)
- 새 service/api/fetcher 0건 — 기존 `useEquipment` + `useQuery(queryKeys.calibrations.byEquipment(id))` 합성

**검증:**
```bash
ls apps/frontend/app/\(dashboard\)/equipment/\[id\]/calibration-history/page.tsx
grep -c "await props.params\|paramsPromise" apps/frontend/app/\(dashboard\)/equipment/\[id\]/calibration-history/page.tsx
# expected: file exists + ≥ 1 await pattern
```

### Phase 2: FilterChip 추출 + Design Token (HIGH 갭 2 + MEDIUM 갭 3)

**목표:** inline tailwind chip → SSOT 컴포넌트 + design token.

**달성해야 할 것:**
- `apps/frontend/components/shared/FilterChip.tsx` 신규 — `{ label, value, onClear, clearAriaLabel }` props
- `apps/frontend/lib/design-tokens/components/filter-chip.ts` 신규 — `FILTER_CHIP_TOKENS = { container, label, value, clearButton } as const` + JIT-safe (동적 보간 0건, `as const` 강제)
- `apps/frontend/lib/design-tokens/index.ts` re-export 1줄 추가
- `CalibrationContent.tsx:241` inline JSX 제거 → `<FilterChip>` 호출. 기존 i18n key 그대로 props로 전달
- 새 i18n 키 0건 — `content.filterChip.equipmentLabel/clear/clearAriaLabel` 재사용

**검증:**
```bash
grep -c "<FilterChip" apps/frontend/app/\(dashboard\)/calibration/CalibrationContent.tsx
# expected: ≥ 1

grep -c "bg-muted/50 border border-border text-sm" apps/frontend/app/\(dashboard\)/calibration/CalibrationContent.tsx
# expected: 0 (inline 제거 확인)

# JIT safe: 동적 보간 0건
grep -E "text-(brand|muted)-\\\$\\{" apps/frontend/lib/design-tokens/components/filter-chip.ts | wc -l
# expected: 0
```

### Phase 3: Chip Data Sourcing (MEDIUM 갭 4)

**목표:** chip이 list `[0]` 의존 → equipment 별도 fetch.

**달성해야 할 것:**
- `CalibrationContent.tsx`에 `useEquipment(filters.equipmentId)` 호출 추가 (`filters.equipmentId` 없으면 hook 자체 호출 가드 — `enabled: false`)
- chip의 `equipmentName` / `managementNumber` source: `equipmentDetail.data?.name` / `.managementNumber`로 변경
- list 비어도 chip 정확하게 표시 (deterministic)
- `QUERY_CONFIG.EQUIPMENT_DETAIL` 적용 (이미 hook 내부 적용됨)

**검증:**
```bash
grep -c "useEquipment\|queryKeys.equipment.detail" apps/frontend/app/\(dashboard\)/calibration/CalibrationContent.tsx
# expected: ≥ 1

# old anti-pattern 제거
grep -c "calibrationHistoryData?.data?.\[0\]?.equipmentName" apps/frontend/app/\(dashboard\)/calibration/CalibrationContent.tsx
# expected: 0
```

### Phase 4: Backend AuditLog entityIdPath (LOW 갭 5)

**목표:** `Could not extract entityId for extract calibration_certificate` warn closure.

**달성해야 할 것:**
- `apps/backend/src/modules/calibration/calibration-certificate.controller.ts` `@AuditLog` 데코레이터에 `entityIdPath: 'response.certificateNumber'` 추가 (옵션 A)
- backend tsc + 기존 calibration module test 회귀 0건
- backend warn log 사라짐 (수동 확인 — Evaluator는 contract grep으로 entityIdPath 존재 확인)

**검증:**
```bash
grep -E "@AuditLog\(\{[^}]*entityIdPath" apps/backend/src/modules/calibration/calibration-certificate.controller.ts | wc -l
# expected: ≥ 1

grep "response.certificateNumber" apps/backend/src/modules/calibration/calibration-certificate.controller.ts
# expected: ≥ 1
```

### Phase 5: RTL Spec (LOW 갭 6)

**목표:** 회귀 보호 spec 추가.

**달성해야 할 것:**

`apps/frontend/app/(dashboard)/calibration/__tests__/CalibrationContent.test.tsx` 신규 (mock 패턴 — `next-intl`/`useToast`/`useEquipment`/calibration-api 통상 mock):
- ✅ equipmentId chip 렌더 (query param `?equipmentId=...` 있을 때 + useEquipment 데이터 mocked)
- ✅ chip clear 클릭 시 다른 filter (예: site/teamId) 보존 (URL 변경 검증)
- ✅ equipmentId 없을 때 chip render 안 됨

`apps/frontend/components/equipment/__tests__/CalibrationRegisterDialog.test.tsx` 신규:
- ✅ managementNumber mismatch 시 destructive toast 발화 (`certificateUpload.noEquipmentMatch` 키 호출 검증)
- ✅ dialog close → 재open 시 form state 미보존 (extractedCertificate/extractedFile reset 검증)

**검증:**
```bash
pnpm --filter frontend exec jest --testPathPattern="(CalibrationContent.test|CalibrationRegisterDialog.test)" --silent
# expected: ≥ 4 tests PASS, 0 failures
```

### Phase 6: 검증 + tech-debt mark + atomic commit + push

1. `pnpm tsc --noEmit` (전체)
2. `pnpm lint`
3. `pnpm --filter frontend exec jest` 회귀 0건
4. `pnpm --filter backend exec jest --testPathPattern="modules/calibration"` 회귀 0건
5. `pnpm --filter backend run build` (smoke)
6. cross-domain diff 0줄 확인 — `git diff --stat` 검증
7. tech-debt-tracker 6건 `[x]` mark + archive 이동
8. atomic single commit (6 갭 모두 한 commit)
9. `git push` (pre-push hook tsc + test 자동 실행)
10. contract `completed/` 이동 + REGISTRY 갱신은 evaluator PASS 후 후처리

---

## Touch Inventory (atomic commit boundary)

| File | Action | 갭 |
|---|---|---|
| `apps/frontend/app/(dashboard)/equipment/[id]/calibration-history/page.tsx` | 신규 | 1 |
| `apps/frontend/app/(dashboard)/equipment/[id]/calibration-history/loading.tsx` | 신규 | 1 |
| `apps/frontend/components/equipment/CalibrationHistoryClient.tsx` | 신규 | 1 |
| `apps/frontend/components/shared/FilterChip.tsx` | 신규 | 2 |
| `apps/frontend/lib/design-tokens/components/filter-chip.ts` | 신규 | 3 |
| `apps/frontend/lib/design-tokens/index.ts` | 수정 (re-export) | 3 |
| `apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx` | 수정 (chip → FilterChip + useEquipment) | 2,4 |
| `apps/frontend/app/(dashboard)/calibration/__tests__/CalibrationContent.test.tsx` | 신규 | 6 |
| `apps/frontend/components/equipment/__tests__/CalibrationRegisterDialog.test.tsx` | 신규 | 6 |
| `apps/backend/src/modules/calibration/calibration-certificate.controller.ts` | 수정 (entityIdPath 1줄) | 5 |
| `.claude/exec-plans/tech-debt-tracker.md` | 수정 (6건 [x]) | post |
| `.claude/contracts/REGISTRY.md` | 수정 (Active → Completed 이동, evaluator PASS 후) | post |

**의도적 0줄 변경 영역 (cross-domain 격리):**
- `apps/frontend/lib/api/*` (query-r3-closure 진행 중)
- `apps/frontend/components/{dashboard,approvals,checkouts}/`
- `apps/backend/src/modules/{dashboard,approvals,checkouts}/`
- `commitlint.config.js` / `.husky/*`
- `packages/schemas/*` / `packages/shared-constants/*` (신규 i18n key 0건, 신규 enum 0건)

---

## 시니어 자기검토 7대 영역 (사전 반영)

| 영역 | 본 sprint 처리 |
|---|---|
| state 분산 | `useEquipment` 별도 호출만 추가, list state와 chip state 분리. local useState 신규 0건 |
| prop drilling | sub-route Client는 equipment 1단 prop drilling만. CalibrationHistoryTab 기존 패턴 그대로 |
| destructive cancel | dialog 변경 0건 (이미 reset 구현). RTL spec이 close→재open reset 회귀 보호 |
| SSOT 우회 | 신규 i18n key 0 / 신규 enum 0 / FilterChip + design token이 inline 하드코딩 제거 |
| performance | `useEquipment` enabled 가드 (filters.equipmentId 없으면 skip) — 불필요 fetch 0 |
| cross-domain | lib/api/* / dashboard / approvals / checkouts / commit-pipeline 0줄 변경 |
| mock-only | 갭 6 RTL spec은 mock 기반(jsdom 한계 알려진 패턴) — 정상 flow는 기존 backend e2e/Playwright가 cover (별도 sprint) |

---

## 후속 (이 sprint scope 외)

- frontend 다른 도메인(checkouts/equipment) deep-link filter chip 마이그레이션 — 다른 도메인이 동일 패턴 등장 시 FilterChip 재사용 (본 sprint는 calibration 1곳만 마이그레이션)
- equipment 상세 페이지에서 calibration-history sub-route로 진입하는 navigation tab/link 추가 — 별도 sprint (본 sprint는 sub-route 자체 구현만)
- CalibrationHistoryTab과 CalibrationListTable 통합 여부 검토 — 본 sprint에서는 분리 유지 (overlap 분석 후 별도 sprint)
