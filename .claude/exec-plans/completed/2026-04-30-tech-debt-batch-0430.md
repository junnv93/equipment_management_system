# Tech-Debt Batch 0430 — 실행 계획

**생성일**: 2026-04-30
**슬러그**: tech-debt-batch-0430
**모드**: Mode 2 (Full)

## 배경

8건의 누적 tech-debt를 단일 배치로 해소.
- 1건은 모듈 분할(MEDIUM, 1538줄 거대 API SSOT 파일)
- 1건은 i18n 정적 게이트 확장(MEDIUM, 회귀 차단 범위 확대)
- 6건은 LOW 위험도의 SSOT/문서/주석/테스트 정합성 정리

처리 순서는 (a) **거대 분할 먼저** → (b) **검증 게이트 확장** → (c) **나머지 LOW 항목**.
의존성 충돌이 없도록 모든 Phase는 독립 파일 집합을 갖는다.

## Phase 목록

| Phase | 항목 | 변경 파일 | 위험도 |
|---|---|---|---|
| A | approvals-api-module-split | `apps/frontend/lib/api/approvals-api.ts` (barrel로 축소) + 신규 sub-module 5개 | 🟡 MEDIUM |
| B | cross-cutting-ns-structural-check | `scripts/check-i18n-call-sites.mjs` | 🟡 MEDIUM |
| C | eslint-require-alias-rename-gap | `apps/backend/.eslintrc.js` | 🟢 LOW |
| D | overflow-action-type-ssot | `apps/frontend/lib/types/checkout-ui.ts` (신규) + `components/shared/NextStepPanel.tsx` + `components/checkouts/CheckoutGroupCard.tsx` | 🟢 LOW |
| E | identifier-negative-test | `apps/backend/src/common/identifiers/identifier.service.spec.ts` | 🟢 LOW |
| F | i18n-namespaces-array-comment-lag | `apps/frontend/i18n/request.ts` | 🟢 LOW |
| G | frontend-patterns-shared-exception-text-precision | `docs/references/frontend-patterns.md` (line ≈ 243) | 🟢 LOW |
| H | tracker-inconsistency-fix | `.claude/exec-plans/tech-debt-tracker.md` | 🟢 LOW |

> **참고**: 본 프로젝트의 i18n SSOT 파일은 `apps/frontend/i18n/request.ts`. namespaces 배열 위치: lines 39-63 인근.

---

## Phase A — approvals-api-module-split

### 변경 파일
- `apps/frontend/lib/api/approvals-api.ts` (기존, barrel로 축소)
- `apps/frontend/lib/api/approvals/` (신규 디렉토리)
  - `apps/frontend/lib/api/approvals/types.ts` (신규)
  - `apps/frontend/lib/api/approvals/internal-rows.ts` (신규)
  - `apps/frontend/lib/api/approvals/mappers.ts` (신규)
  - `apps/frontend/lib/api/approvals/fetchers.ts` (신규)
  - `apps/frontend/lib/api/approvals/actions.ts` (신규)

### 분할 경계 (기능 축 분리)

카테고리 축(equipment/calibration/...)이 아닌 **기능 축**으로 분리한다.
이유: `approve()`의 대형 switch는 단일 파일에 있어야 하고, mapper들이 여러 fetcher에서 재사용되므로
카테고리 분리는 순환 의존성을 만든다.

의존성 방향: `types ← internal-rows ← mappers ← fetchers ← actions ← barrel`

### 달성 목표 (WHAT, not HOW)

1. **barrel 보존**: 23개 호출처가 사용하는 모든 export 심볼은 `approvals-api.ts`에서 그대로 re-export. 호출처 수정 0건.
2. **types.ts**: 순수 타입/상수/Zod 스키마만 보유.
   - `ApprovalCategory`, `UnifiedApprovalStatus`, `ApprovalSection`, `APPROVAL_SECTIONS`, `TabMeta`, `TAB_META`, `ROLE_TABS`, `REQUEST_TYPES`, `REJECTION_MIN_LENGTH`, `RejectReasonSchema`, `ApprovalHistoryEntry`, `Attachment`, `ApprovalSummaryData`, `ApprovalItem`, `PendingCountsByCategory`, `ApprovalKpiResponse`, `BulkActionResult`
   - 의존성: `@equipment-management/schemas`, `@equipment-management/shared-constants`, `zod`, 외부 타입만. 다른 sub-module 의존 없음.
3. **internal-rows.ts**: `@internal` DTO 인터페이스(DisposalApprovalRow, EquipmentRequestApprovalRow 등)만 보유. `approvals-api.ts` barrel에서 re-export 안 함.
4. **mappers.ts**: 순수 함수형 mapper + status 매핑. 클래스 메서드를 모듈 함수로 변환. 의존성: `types.ts`, `internal-rows.ts`, 외부 타입/유틸. `fetchers.ts`/`actions.ts` 의존 금지.
5. **fetchers.ts**: `getPendingItems` switch + 카테고리별 fetcher + `getPendingCounts` + `getKpi`. 의존성: 외부 API + `mappers.ts` + `types.ts`. `actions.ts` 의존 금지(순환 차단).
6. **actions.ts**: `approve`/`reject`/`bulkApprove`/`bulkReject` + type guard + `ORIGINAL_DATA_REQUIRED_CATEGORIES`. 의존성: 외부 API + `types.ts` + `fetchers.ts`(bulk 처리).
7. **approvals-api.ts (barrel)**: ≤ 80줄. 모든 sub-module public 심볼 re-export. `approvalsApi` 객체 facade(기존 메서드 시그니처 보존) export(default + named).
8. **순환 의존성 0건**: `mappers ← fetchers ← actions ← barrel` 단방향.
9. 동작 변경 금지 — 메서드 시그니처/반환 타입/에러 처리 일체 보존.

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
pnpm --filter frontend run build
grep -rn "from '@/lib/api/approvals-api'" apps/frontend --include="*.ts" --include="*.tsx" | wc -l
# 기대값: 23 (호출처 무변경)
```

---

## Phase B — cross-cutting-ns-structural-check

### 변경 파일
- `scripts/check-i18n-call-sites.mjs`

### 달성 목표

1. `checkCommonJsonStructure()`를 일반화하여 **cross-cutting namespace 집합** (`common`, `navigation`, `notifications`, `errors`, `auth`) 모두에 동일 검사 적용.
2. 검사 정의: 각 ns의 root level은 object(sub-namespace)만 허용. flat string/array/number 발견 시 위반 → exit 1.
3. cross-cutting ns 목록은 스크립트 상단 상수 `CROSS_CUTTING_NAMESPACES`로 SSOT화.
4. 위반 메시지는 ns별로 그룹화(`{locale}/{ns}.json :: "{key}"`). 기존 violation report 형식 호환.
5. `--all` / `--file` 모드에서만 실행(기존 정책 유지).

### 검증 명령
```bash
node scripts/check-i18n-call-sites.mjs --all
# 회귀 테스트 (수동):
# (1) apps/frontend/messages/ko/errors.json 루트에 "tempFlatKey": "test" 추가
# (2) node scripts/check-i18n-call-sites.mjs --all → exit 1
# (3) 키 제거 → exit 0
```

---

## Phase C — eslint-require-alias-rename-gap

### 변경 파일
- `apps/backend/.eslintrc.js`

### 달성 목표

1. `no-restricted-syntax`에 동적 `import('node:crypto')`/`import('crypto')` 호출 패턴 차단 selector 추가:
   - `CallExpression[callee.type='Import'][arguments.0.value='node:crypto']`
   - `CallExpression[callee.type='Import'][arguments.0.value='crypto']`
2. 기존 메시지 톤(SSOT 경로 + identifier-policy.md 링크) 일관 유지.
3. 예외 override: `src/common/identifiers/identifier.service.ts`에서 새 selector도 off.

### 검증 명령
```bash
pnpm --filter backend run lint
# 회귀 테스트 (수동): 임의 service에 `const { randomUUID: r } = await import('node:crypto')` 추가 → lint 실패
```

---

## Phase D — overflow-action-type-ssot

### 변경 파일
- `apps/frontend/lib/types/checkout-ui.ts` (신규)
- `apps/frontend/components/shared/NextStepPanel.tsx`
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` (선택 — import 경로 유지)

### 달성 목표

1. 신규 SSOT 파일 `lib/types/checkout-ui.ts` 생성. checkout UI 타입 추가 위치 docstring 명시.
2. `OverflowAction` interface를 SSOT 파일로 이전(label/onClick/variant? 시그니처 보존).
3. `NextStepPanel.tsx`: 로컬 `export interface OverflowAction` 제거. SSOT에서 import. type re-export 추가(기존 호출처 호환).
4. `CheckoutGroupCard.tsx`: 기존 import 경로 유지(barrel re-export로 호환). 수정 불필요.
5. 새 호출처는 `lib/types/checkout-ui.ts` 직접 import 권장 주석을 NextStepPanel.tsx에 명시.

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
grep -rn "interface OverflowAction" apps/frontend --include="*.ts" --include="*.tsx"
# 기대값: lib/types/checkout-ui.ts 1건만 (re-export는 export type으로 interface 아님)
```

---

## Phase E — identifier-negative-test

### 변경 파일
- `apps/backend/src/common/identifiers/identifier.service.spec.ts`

### 달성 목표

1. jest.spyOn으로 `randomUUID`가 throw하도록 모킹.
2. `generateAttachmentId()` 호출 시 error가 propagate됨을 검증.
3. afterEach에서 spy 복원. 기존 테스트 append-only.

### 검증 명령
```bash
pnpm --filter backend exec jest src/common/identifiers/identifier.service.spec.ts
```

---

## Phase F — i18n-namespaces-array-comment-lag

### 변경 파일
- `apps/frontend/i18n/request.ts`

### 달성 목표

1. "Phase 0/Phase 1+" 분류 주석 제거(namespaces 배열 현재 상태와 정합하지 않음).
2. namespaces 배열 위 주석 한 줄 유지: next-intl 동적 로딩 의도 설명.
3. namespaces 배열 자체 변경 금지.

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run build
```

---

## Phase G — frontend-patterns-shared-exception-text-precision

### 변경 파일
- `docs/references/frontend-patterns.md` (line ≈ 243)

### 달성 목표

1. 모순 텍스트 제거: "props으로 끌어올리는 것이 일관적이다" vs 직접 호출 허용 실제 정책.
2. 명확한 분기 명시:
   - 도메인-결합 컴포넌트 → 해당 도메인 namespace 직접 호출 OK
   - cross-cutting `common.*` → 위치 무관 props 주입 강제
   - `components/shared/`에 위치한 단지 *재사용* 사유 컴포넌트 → ns 결합도 props으로 분리

### 검증 명령
```bash
grep -A 6 "예외:" docs/references/frontend-patterns.md
```

---

## Phase H — tracker-inconsistency-fix

### 변경 파일
- `.claude/exec-plans/tech-debt-tracker.md`

### 달성 목표

1. 라인 163-165의 중복 `[ ]` 항목 3건 제거(옵션 A: 중복 제거).
   - `pre-existing-dday-deprecation`
   - `dashboard-controller-zod-scope-validation`
   - `dashboard-controller-process-env-direct`
2. 동일 슬러그가 lines 169-171에 `[x]`로 완전한 컨텍스트와 함께 존재 → 중복 행 제거로 일관성 확보.

### 검증 명령
```bash
grep -E "^\- \[ \].*pre-existing-dday-deprecation" .claude/exec-plans/tech-debt-tracker.md
grep -E "^\- \[ \].*dashboard-controller-zod-scope-validation" .claude/exec-plans/tech-debt-tracker.md
grep -E "^\- \[ \].*dashboard-controller-process-env-direct" .claude/exec-plans/tech-debt-tracker.md
# 모두 매치 0건이어야 통과
```

---

## Phase 의존성 그래프

```
A (approvals-api 분할)         ── lib/api/approvals/* + approvals-api.ts
B (i18n 게이트 확장)            ── scripts/check-i18n-call-sites.mjs
C (eslint 가드 보강)            ── apps/backend/.eslintrc.js
D (OverflowAction SSOT)         ── lib/types/checkout-ui.ts + 2개 컴포넌트
E (identifier negative test)    ── identifier.service.spec.ts
F (i18n 주석 정리)              ── i18n/request.ts
G (frontend-patterns 문구)      ── docs/references/frontend-patterns.md
H (tracker 중복 제거)           ── tech-debt-tracker.md
```

모든 Phase는 독립 파일 집합 → 순서 자유. 권장 순서: A → B → C → D → E → F → G → H

---

## 최종 통합 검증

```bash
# Frontend
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
pnpm --filter frontend run build

# Backend
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run lint:ci
pnpm --filter backend exec jest src/common/identifiers/identifier.service.spec.ts

# i18n 게이트
node scripts/check-i18n-call-sites.mjs --all

# barrel 호환 확인
grep -rn "from '@/lib/api/approvals-api'" apps/frontend --include="*.ts" --include="*.tsx" | wc -l

# tracker 불일치 0건
grep -E "^\- \[ \].*(pre-existing-dday-deprecation|dashboard-controller-zod-scope-validation|dashboard-controller-process-env-direct)" .claude/exec-plans/tech-debt-tracker.md
```
