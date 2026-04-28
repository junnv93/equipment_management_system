# i18n Parity Hardening — 호출지 키 정적 검증 + 회귀 차단

## 메타

- 생성: 2026-04-28
- 모드: Mode 2 (Harness)
- 예상 변경: 6~9개 파일 (스크립트 1, 컴포넌트 1, 메시지 2, husky 1, skill 1, 페이지 1 옵션, frontend-patterns 1)
- 슬러그: `i18n-parity-hardening`

## 설계 철학

**버그(`MISSING_MESSAGE: common.loading`)는 표면.** 실제 문제는 "i18n 호출지 키와 messages JSON 사이에
**정적 검증이 존재하지 않는다**"는 검증 인프라 공백이다. 본 작업은 (a) 표면 수정, (b) 동일 패턴
잔존 버그 일괄 제거, (c) 검증 게이트로 회귀 차단을 한 사이클로 묶어 처리한다.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| 표면 수정 방식 | **prop 주입** (atom에 `loadingLabel` prop 추가, caller가 `t('status.loading')` 전달) | NextStepPanel.tsx:159 주석 "atom의 도메인 중립성 보장 — atom은 i18n 모름"과 코드(`useTranslations('common')` 호출)가 **자기 모순**. atom 원칙 회복 + 다국어 키 SSOT를 caller(도메인 컨텍스트)에 두는 것이 design-token/digit hierarchy 일관 |
| 정적 검증 방식 | **scope-aware regex** (1차) + 향후 AST 마이그레이션 여지 남김 | 호출지 5,907개. AST(@typescript-eslint/parser)는 정확하나 cold-start ~300ms × N file 고비용. regex로 단일 binding 스코프 ~3,500개 커버, shadowed binding은 명시적 SKIP하고 보고서에 출력 → 점진적 개선. 측정 결과 단일 파일 처리 ~0.3ms |
| Pre-push 추가 비용 | **단일 명령 < 1초** 추가 (현재 i18n check 54ms → 호출지 검증 추가 후 ~500ms 목표) | 기존 pre-push가 tsc(~30s) + 양 테스트(~수십초)이므로 i18n 추가 0.5초는 dev 워크플로 영향 미미 |
| 네임스페이스 SSOT | `i18n/request.ts`의 namespaces 배열은 **유지** + 빌드 타임에 messages 디렉토리 실측과 cross-check 추가 | filesystem 자동 도출은 매력적이나 (1) 의도적 미존재 ns(reservations 부분 구현) 표현 어려움, (2) Turbopack/webpack의 dynamic import codegen 친화성 떨어짐. 명시 배열 유지하되 누락/추가 드리프트만 검증 |
| 레거시 `lib/i18n/client.ts:useTranslation` 래퍼 | **deprecation 경고 추가** (별도 작업, 본 Phase에서는 보류) | 해당 래퍼가 missing key를 silently swallow하여 본 회귀를 가렸을 가능성 — 단, 사용처 분석 + 마이그레이션은 본 작업 범위 초과. tech-debt에 기록 |
| 회귀 테스트 | playwright smoke 1건 (`/equipment/[id]/non-conformance` 라우트 — 실제 38개 누락 키가 모이는 페이지) | NextStepPanel.tsx 단독은 단위 테스트로 검증 가능하나, **본 회귀 본질**은 NCManagementClient 38건이 더 큰 폭. smoke 1건이 라우트 수준 회귀 차단 ROI 최고 |

---

## Phase 0 — 정찰 결과 요약 (이미 수행됨)

### 호출지 통계

- `useTranslations()` 호출 사이트 (정적): **407개** 라인
- `getTranslations()` 호출 사이트: **23개** 라인
- 사용 중인 namespace: **79개** (예: `common`, `equipment.repairHistory`, `dashboard.welcome` 등 dot-nested 포함)
- 정적으로 추출 가능한 key 호출(단일 바인딩 스코프 한정): **3,586개**
- 검증 결과 **누락 키**: 약 **68건**(false positive 1건 제외)
  - **NextStepPanel.tsx :: common -> 'loading'** (1건, 보고된 표면 버그)
  - **NonConformanceManagementClient.tsx :: non-conformances -> management.\*** (35건+) — 2026-04-21 commit `a16d95cd`이 `management.*` 블록을 "레거시"로 오인하여 삭제. 실제 라우트 `/equipment/[id]/non-conformance`에서 여전히 호출됨. E2E 테스트 다수가 해당 경로 goto로 누락 키를 트리거
  - **CreateNonConformanceForm.tsx :: non-conformances -> management.form.\*** (16건) — 동일 원인
  - **EquipmentTable/CalibrationFactorsClient/RepairHistoryClient/CheckoutHistoryTab/StatusLocationSection/DocumentRevisionDialog/EquipmentQRCode/TeamEquipmentList/ReceiveEquipmentImportForm 등** — equipment.\* / qr.\* 네임스페이스 산발적 누락 (10여 건)
  - shadowed binding(같은 파일에 `const t = useTranslations(...)` 2회 이상)으로 정밀 검증 SKIP된 호출 87건 — 별도 audit으로 후속 처리 권장 (tech-debt)

### Namespace 파일 parity

- `messages/ko/` 22 files vs `messages/en/` 22 files — **파일 수 일치 (PASS)**
- 키 수 sample (`dashboard`/`equipment`/`checkouts`): 372/1305/655 모두 ko/en 동수 — flat 키 수준 parity OK

### 기존 검증 인프라 갭

| 항목 | 현재 상태 | 갭 |
|------|----------|----|
| `scripts/check-i18n-keys.mjs` | `checkouts.json`만 검사. 107개 hard-coded 키 존재 여부만 검증 | 호출지 키 정적 추출 미구현. 다른 22개 namespace 미커버 |
| `verify-i18n` skill (15 step) | **메시지 파일 간** parity 위주 (ko↔en, fieldLabels SSOT, ICU 변수 등) | 호출지 ↔ JSON 간 unidirectional 검증 없음. Step 7(동적 키)은 enum 기반이지 호출지 기반 아님 |
| `.husky/pre-push` | tsc + 단위 테스트 | i18n parity 미실행 |
| `.husky/pre-commit` | `check-i18n-keys.mjs --changed` (checkouts만) | 동일 한계 |

### 아키텍처 smell (본 버그와 직접 관계는 없으나 발견)

- `apps/frontend/lib/i18n/client.ts:useTranslation` (S 없는 단수형): missing key를 `console.warn`만 찍고 raw key 반환 → 회귀를 silently swallow. 사용처 추적 + 마이그레이션 권고 (tech-debt)
- `i18n/request.ts:31` Phase 0~Phase 1+ 주석이 코드와 lag — namespace 추가/삭제 시 주석 갱신 누락 위험 (low priority)
- shadowed `const t = useTranslations(...)` 패턴 12+개 파일 — 같은 namespace prefix만 다른 binding 2개 이상이 동일 함수에 존재. 가독성 + 정적 검증 곤란성 모두 악화. ESLint custom rule 후보 (tech-debt)

---

## Phase 1 — 표면 수정 (atom 원칙 회복: prop 주입)

**목표:** `NextStepPanel`의 자기-모순적 `tCommon('loading')` 호출 제거. atom에 `loadingLabel` prop 추가하여
i18n 책임을 caller에게 위임.

**변경 파일:**

1. `apps/frontend/components/shared/NextStepPanel.tsx` — **수정**
   - `useTranslations('common')` 바인딩 + `tCommon('loading')` 라인 제거
   - props에 `loadingLabel?: string` 추가 (optional, 기본값은 `t('hint.terminal')` 같은 기존 ns를 사용하지 않고 빈 prop fallback 패턴 — sr-only 라벨이므로 빈 값이면 InlineActionButton의 자체 fallback 사용)
   - 도메인 중립성 주석 정확화: "이 atom은 i18n에 의존하지 않고, caller가 모든 사용자 가시 텍스트를 prop으로 주입한다" 같은 단언 + 위반 방지
2. `apps/frontend/components/shared/NextStepPanel.tsx` 호출지 (`grep -rn "<NextStepPanel" apps/frontend`)
   - 각 caller가 자신의 컨텍스트에서 `loadingLabel={tFromCallerNs('적절키')}`를 전달하도록 수정
   - caller가 `useTranslations('common')`을 이미 호출하면 `'status.loading'` 사용 (SSOT — common.json의 정확한 경로)

**근거:**

- atom design 원칙: 가장 작은 재사용 단위. i18n hook 호출 = 컨텍스트 의존 = atom 위반
- 본 atom은 4개 variant(floating/inline/compact/hero)와 actor variant(approver/receiver/requester)를 분기. 모두 checkout 도메인 특화 caller가 wrapping → caller에서 i18n 주입 자연스러움
- 동일 패턴이 `InlineActionButton`(이미 `loadingLabel` prop 패턴 사용)과 일치 — 디자인 일관성

**성공 기준:**

- `grep -n "useTranslations" apps/frontend/components/shared/NextStepPanel.tsx` → **0 hit**
- 콘솔에 `MISSING_MESSAGE: common.loading` 0건 (Phase 6 e2e 검증)
- 모든 caller가 명시적 `loadingLabel` 전달 (TypeScript optional이지만 lint rule로 강제 권고 — 본 Phase에서는 명시 전달만 충족하면 PASS)

**검증:**

```bash
pnpm tsc --noEmit
grep -n "useTranslations\|tCommon" apps/frontend/components/shared/NextStepPanel.tsx
```

---

## Phase 2 — 호출지 누락 키 일괄 보정 (회귀 정리)

**목표:** Phase 0에서 발견된 ~67건 누락 키를 메시지 JSON에 복원. 가장 큰 비중(38건+16건)인
`non-conformances.management.*` 블록을 git history `ccc386af`에서 복원하여 기능 회귀 종결.

**변경 파일:**

1. `apps/frontend/messages/ko/non-conformances.json` — **수정**
   - 삭제된 `management` 서브트리 복원 (commit `a16d95cd` 직전 상태 = `ccc386af` 구조)
   - 호출지에서 실제 사용되는 키만 정확히 (오버키잉 방지)
2. `apps/frontend/messages/en/non-conformances.json` — **수정**
   - `management` 서브트리 영문 번역 추가 (parity 보장)
3. `apps/frontend/messages/ko/equipment.json`, `apps/frontend/messages/en/equipment.json` — **수정**
   - Phase 0에서 발견된 산발적 누락 키 추가:
     - `checkoutHistoryTab.error`, `viewDetailShort`, `form.statusLocation.managersLoadError`,
       `attachmentsTab.revision.error`, `receiveEquipmentImport.loadError`,
       `fieldLabels.lastCalibrationDate`, `fieldLabels.calibrationAgency`,
       `calibrationFactorsClient.loadError`, `repairHistoryClient.loadError` 외
4. `apps/frontend/messages/ko/qr.json`, `apps/frontend/messages/en/qr.json` — **수정**
   - `qrDisplay.error` 추가
5. (옵션) shadowed-binding 87건 파일 목록을 tech-debt-tracker.md에 등록

**성공 기준:**

- Phase 3에서 도입할 새 검증 게이트 `node scripts/check-i18n-call-sites.mjs --all` PASS
- `pnpm --filter frontend run build` 성공
- 모든 추가 키는 ko/en 동시 존재 (parity)
- **Phase 1에서 변경한 NextStepPanel은 이제 broken 키 없음**

**검증:**

```bash
node scripts/check-i18n-call-sites.mjs --all   # Phase 3에서 만들 신규 스크립트
pnpm tsc --noEmit
pnpm --filter frontend run build
```

---

## Phase 3 — 검증 인프라 강화 (호출지 정적 검증)

**목표:** "호출지 → JSON" 방향 정적 검증 게이트를 신규 도입하여 본 회귀가 다시는 main에 들어가지 못하게 한다.

**변경 파일:**

1. `scripts/check-i18n-call-sites.mjs` — **신규**
   - 책임: `apps/frontend/**/*.{ts,tsx}` 스캔, `useTranslations`/`getTranslations` 바인딩 추출,
     동일 함수 스코프 내 t-호출 정적 키 추출, ko/en JSON parity 검증
   - 출력: PASS 시 통계(검사 키 수, 추출 ns 수), FAIL 시 누락 키 목록 + 파일/라인
   - shadowed binding(같은 변수명 다중 선언)은 SKIP하고 stderr에 WARN 출력 (false positive 방지)
   - 동적 키(`` t(`prefix.${var}`) ``)도 SKIP — 별도 enum 기반 검증(`verify-i18n` Step 7) 영역
   - exit code: 0(전체 PASS) / 1(누락 키 1개 이상) / 2(I/O 오류)
   - 실행 모드: `--all` (전체) / `--changed` (git diff staged) / `--file <path>` (단일 파일 디버깅)
   - 성능 목표: 전체 모드 < 5초 (현재 단일 파일 ~0.3ms × 600 파일 ≈ 0.2초 예상)
2. `scripts/check-i18n-keys.mjs` — **수정 (선택)**
   - 기존 `checkouts.json` hard-coded key 검사는 유지(보안성 ↑)
   - 신규 스크립트로 통합하지 않고 **별도 스크립트로 공존**: 기존은 "필수 키 contract" 게이트(소량의 known-critical 키), 신규는 "호출지 ↔ JSON" 일반 게이트. 책임 분리 명확
3. `.claude/skills/verify-i18n/SKILL.md` — **수정**
   - Step 16 추가: "호출지 정적 검증" — `node scripts/check-i18n-call-sites.mjs --all`로 PASS 검사
   - Step 4 (네임스페이스 참조 일관성)는 namespace 단위만 검증 → Step 16과 보완 관계 명시
   - shadowed binding 87건은 tech-debt이며 정적 검증 한계임을 Exceptions 섹션에 명시
4. (옵션) `.claude/skills/verify-i18n/references/i18n-checks.md` — **수정**
   - Step 16 상세 절차 + 예제 출력 추가

**성공 기준:**

- 신규 스크립트가 Phase 0의 67건 발견을 동일하게 보고 (회귀 케이스로 자체 검증 — Phase 2 이후엔 0건이어야 함)
- 실행 시간 ≤ 5초 (S1 SHOULD)
- false positive 1건 이하 (현재 알려진 1건: `equipment-errors.ts` 주석에 `t('key')` 표기 — regex 보완으로 제거)

**검증:**

```bash
node scripts/check-i18n-call-sites.mjs --all          # 0 broken 출력
time node scripts/check-i18n-call-sites.mjs --all     # < 5s
pnpm tsc --noEmit
```

---

## Phase 4 — Pre-push / Pre-commit 게이트 wiring

**목표:** 신규 검증을 husky 훅에 연결하여 회귀를 push 직전 차단.

**변경 파일:**

1. `.husky/pre-push` — **수정**
   - 기존 `tsc → backend test → frontend test` 순서에 `node scripts/check-i18n-call-sites.mjs --all` 추가
   - 위치: `tsc` 직후, `backend test` 직전 (실패 시 빨리 차단)
   - 실패 메시지: 어느 파일/라인/ns/key가 누락인지 stderr에 명시 (스크립트 자체가 제공)
2. `.husky/pre-commit` — **수정**
   - 기존 `check-i18n-keys.mjs --changed` 다음 라인에 `check-i18n-call-sites.mjs --changed` 추가
   - `--changed` 모드는 staged 파일만 스캔(빠름) — pre-commit 응답성 유지
3. `apps/frontend/package.json` — **수정 (옵션)**
   - `scripts.verify:i18n-call-sites` npm script 추가 → husky/CI에서 동일 명령 호출

**성공 기준:**

- `cat .husky/pre-push | grep check-i18n-call-sites` → 1 hit
- `cat .husky/pre-commit | grep check-i18n-call-sites` → 1 hit
- pre-push 실행 시간 증가 < 1초 (현재 tsc ~30s 대비 미미)
- 실제로 broken 키 도입 시 pre-push가 차단함을 시뮬레이션 검증

**검증:**

```bash
cat .husky/pre-push   # check-i18n-call-sites 라인 확인
cat .husky/pre-commit
# 시뮬레이션
git stash
echo "<broken>" > /tmp/sim
# (사용자가 실제 push 시도하여 차단 확인 — 자동화 어려우므로 메뉴얼)
```

---

## Phase 5 — 아키텍처 하드닝 (atom 원칙 + namespace SSOT 결정 문서화)

**목표:** 본 회귀 재발 방지를 위한 design 원칙을 frontend-patterns.md에 명시. namespace 배열의
SSOT 위치 결정 + 이유 기록.

**변경 파일:**

1. `docs/references/frontend-patterns.md` — **수정**
   - 신규 섹션 "Atom-level i18n 금지 원칙" 추가
     - atom(NextStepPanel, InlineActionButton, EmptyState 등)은 **`useTranslations`/`getTranslations` 호출 금지**
     - 사용자 가시 텍스트는 모두 props로 받는다 (caller의 i18n 컨텍스트가 SSOT)
     - 위반 적발 방법: `verify-i18n` Step 16(신규) + ESLint custom rule 후보(tech-debt)
   - 신규 섹션 "loading.tsx Server Component i18n 패턴"
     - `getTranslations()` async 사용 필수 (이미 user memory)
     - 하드코딩 sr-only 텍스트 금지 — 본 회귀의 "공유 atom"과 반대 방향이지만 **둘 다 같은 원칙의 인스턴스**: i18n 책임이 적절한 레이어에 있어야 함
   - 신규 섹션 "i18n namespace SSOT"
     - SSOT는 `apps/frontend/i18n/request.ts`의 `namespaces` 배열
     - filesystem 자동 도출 채택하지 않은 이유 (본 plan 아키텍처 결정 표 참조)
     - namespace 추가 시 5단계 체크리스트 (1) ko/en JSON 생성, (2) request.ts 배열 추가, (3) 호출지 작성 후 verify-i18n 실행, (4) check-i18n-call-sites 실행, (5) 한 라우트 직접 렌더링 검증
2. `.claude/exec-plans/tech-debt-tracker.md` — **수정**
   - 신규 항목 추가:
     - `lib/i18n/client.ts:useTranslation` 단수형 래퍼 deprecation + 사용처 마이그레이션 (회귀 silent swallow 원인)
     - shadowed `const t = useTranslations(...)` 87건 파일 목록 + ESLint custom rule 후보
     - `i18n/request.ts:31` 주석과 namespaces 배열 lag 정합 (low priority)

**성공 기준:**

- frontend-patterns.md에 3개 신규 섹션 존재
- tech-debt-tracker.md에 3개 항목 추가 (출처 슬러그 명시)
- 본 plan과 contract가 frontend-patterns.md 신규 섹션을 cross-link

**검증:**

```bash
grep -n "Atom-level i18n 금지\|namespace SSOT\|loading.tsx Server" docs/references/frontend-patterns.md
grep -n "i18n-parity-hardening\|useTranslation 단수형\|shadowed binding" .claude/exec-plans/tech-debt-tracker.md
```

---

## Phase 6 — 회귀 차단 e2e smoke (권고)

**목표:** 본 회귀 본질이 가장 크게 드러나는 라우트 `/equipment/[id]/non-conformance`에 대해 raw 키
노출 0건을 e2e로 보장. 추가로 `/checkouts` 라우트(NextStepPanel 표면 버그 발생 페이지)도 검증.

**변경 파일:**

1. `apps/frontend/tests/e2e/features/i18n/no-missing-message.spec.ts` — **신규**
   - 시나리오: ko 로케일로 다음 페이지 navigate → 콘솔에 `MISSING_MESSAGE` 0건, raw key 패턴
     (예: `management.title`이 그대로 텍스트 노출) 0건
     - `/checkouts` (NextStepPanel 트리거)
     - `/equipment/<seed-id>/non-conformance` (NCManagementClient 트리거)
   - 추가: en 로케일 동일 시나리오 (locale switch 후 재검증)
   - 셀렉터: `page.on('console', ...)`로 missingMessage 캐치 + `page.locator('text=/^[a-z]+\\.[a-z]+/')` 같은 raw key 휴리스틱
   - 기존 fixture(storageState, role-based) 재사용

**성공 기준:**

- ko/en × 2 라우트 = 4 케이스 모두 missing key 0건
- 본 spec이 Phase 1~2 미적용 상태(rollback)에서는 의도대로 FAIL해야 함을 시뮬레이션

**검증:**

```bash
pnpm --filter frontend run test:e2e -- tests/e2e/features/i18n/no-missing-message.spec.ts
```

---

## 전체 변경 파일 요약

### 신규 생성

| 파일 | 목적 |
|------|------|
| `scripts/check-i18n-call-sites.mjs` | 호출지 ↔ messages JSON 정적 검증 게이트 |
| `apps/frontend/tests/e2e/features/i18n/no-missing-message.spec.ts` | 라우트 단위 회귀 차단 e2e (Phase 6 옵션) |

### 수정

| 파일 | 변경 의도 |
|------|----------|
| `apps/frontend/components/shared/NextStepPanel.tsx` | `useTranslations` 제거, `loadingLabel` prop 도입 (atom 원칙 회복) |
| (caller files) `**/*.tsx` | NextStepPanel 호출지에 `loadingLabel` 명시 전달 |
| `apps/frontend/messages/ko/non-conformances.json` | `management.*` 블록 복원 (commit a16d95cd 회귀 정리) |
| `apps/frontend/messages/en/non-conformances.json` | 동일 — en parity |
| `apps/frontend/messages/ko/equipment.json` | 산발적 누락 키 추가 (~9건) |
| `apps/frontend/messages/en/equipment.json` | 동일 — en parity |
| `apps/frontend/messages/ko/qr.json` | `qrDisplay.error` 추가 |
| `apps/frontend/messages/en/qr.json` | 동일 |
| `scripts/check-i18n-keys.mjs` | (변경 없음, 책임 분리 유지) |
| `.husky/pre-push` | `check-i18n-call-sites.mjs --all` 라인 추가 |
| `.husky/pre-commit` | `check-i18n-call-sites.mjs --changed` 라인 추가 |
| `.claude/skills/verify-i18n/SKILL.md` | Step 16 추가 (호출지 정적 검증) |
| `apps/frontend/package.json` | `verify:i18n-call-sites` script 추가 (옵션) |
| `docs/references/frontend-patterns.md` | "Atom-level i18n 금지 / namespace SSOT / loading.tsx 패턴" 3개 섹션 추가 |
| `.claude/exec-plans/tech-debt-tracker.md` | 3개 후속 항목 등록 |

---

## 영역별 결정 (사용자 메모리 규칙 — "추후 고려" 금지)

| 영역 | 결정 |
|------|------|
| **SSOT** | i18n key SSOT는 `messages/{ko,en}/<ns>.json`. 호출지는 정적 검증 대상이며 가공 금지. namespace 배열 SSOT는 `i18n/request.ts` (filesystem 자동 도출은 불채택) |
| **비하드코딩** | atom(NextStepPanel)에서 한국어 fallback 하드코딩 금지 — prop 미전달 시 InlineActionButton의 자체 fallback에 의존(이미 i18n) |
| **워크플로** | pre-commit (changed) → pre-push (all) → CI(GitHub Actions, 본 작업 외 별도) 3-tier. 회귀는 push 직전에 차단 |
| **성능** | 신규 스크립트 < 5초 (S1 SHOULD). pre-push 추가 비용 < 1초 (현재 ~수십초의 1.5% 미만) |
| **보안** | i18n 메시지에는 사용자 입력 미반영(static text). XSS 표면 없음. 단, `t(\`${dynamic}\`)` 패턴은 enum 기반 동적 키만 허용(verify-i18n Step 7). 호출지 검증으로 임의 dynamic 키 흘러들어가지 않음 |
| **접근성** | sr-only loading 라벨이 빈 문자열로 노출되는 문제(user memory `aria-label={t('key', { name: '' })}` 패턴 금지)와 동일 카테고리. prop 주입 시 빈 문자열 fallback이 아니라 caller가 항상 명시적 라벨 제공하도록 권고 (TS optional이지만 lint custom rule 후보) |
| **관측성** | broken 키 발생 시 next-intl이 console.error로 `MISSING_MESSAGE` 출력 — 본 plan은 검증으로 사전 차단. 런타임 fallback은 별도 작업(레거시 useTranslation 래퍼 deprecation에서 다룸) |
| **i18n parity (자가 적용)** | ko/en 동시 추가 강제 (parity check 기존 인프라가 잡음 + 신규 스크립트로 호출지 측 동시 검증) |
| **dark mode** | i18n 영역 외 — 본 작업 비대상 |
| **feature flag** | 단순 검증 도입이므로 flag 불필요. rollback은 husky 라인 1줄 제거 |
| **rollback** | 단계별 git revert 가능. Phase 4 husky 라인이 가장 격리 — 즉시 무력화 가능 |
| **bundle size** | 영향 없음 (스크립트는 pre-push only, 런타임 미포함). messages JSON은 누락 키 복원이므로 약간 증가 (~3KB 미만 예상) |

---

## 아키텍처 보강 섹션 (rev-2 경험 적용)

본 회귀는 표면적으로 1줄 missing key지만, 정찰에서 드러난 **3개의 구조 문제**:

1. **Silent swallow 래퍼**(`lib/i18n/client.ts`)가 회귀를 가렸을 가능성 — 본 plan에서는 우선순위가 낮아 tech-debt에만 등록. 단, 후속 작업으로 deprecation 예정
2. **Atom 의도와 코드 모순** — 주석은 "atom은 i18n 모름"인데 `useTranslations` 호출. 동일 모순이 다른 atom에도 잠재. Phase 5의 frontend-patterns.md 명시화 + verify-i18n Step 16이 동시 잡음
3. **검증 비대칭성** — 메시지 ↔ 메시지(en↔ko)는 strong, 호출지 ↔ 메시지는 weak/empty. Phase 3가 직접 해결

**향후 고려 (본 plan 외 — tech-debt에 등록):**

- ESLint custom rule `no-atom-i18n` (atom 디렉토리에서 `useTranslations`/`getTranslations` import 금지)
- shadowed binding 87건 → ESLint `no-shadow-i18n-binding` 또는 정렬 작업
- next-intl 4.x의 `getMessageFallback` API 활용 → missing 시 console.error 강제(현재 next-intl 4.9.1 채택 중)

---

## 의사결정 로그

- **2026-04-28 (정찰)**: 표면 1건 vs 실제 67건 누락 발견. 표면-only fix 시 다음 회귀 누락 보장. 일괄 정리 결정
- **2026-04-28 (atom 결정)**: prop 주입 vs flat key 추가 두 안 검토. atom 원칙 + 디자인 일관성 + verify-i18n Step 16과의 정합으로 prop 주입 채택
- **2026-04-28 (검증 도구 결정)**: AST(@typescript-eslint/parser) 표준이나 cold-start 비용. regex로 충분(scope-aware + shadowed SKIP). 향후 false positive 누적 시 AST 마이그레이션
- **2026-04-28 (namespace SSOT)**: filesystem 자동 도출 vs 명시 배열. 명시 배열 유지 — Turbopack/webpack codegen 친화 + 의도적 미존재 ns 표현 가능
