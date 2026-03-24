---
name: playwright-e2e
description: |
  Playwright E2E 테스트 계획 수립, 코드 생성, 실행, 검증까지의 전체 워크플로우를 관리하는 스킬.
  "E2E 테스트 작성", "Playwright 테스트", "테스트 계획", "테스트 생성", "페이지 테스트",
  "기능 테스트", "역할별 테스트", "권한 테스트", "통합 테스트 작성" 등의 맥락에서 사용하세요.
  playwright-test MCP 서버의 planner/generator/healer 에이전트를 조율하며,
  브라우저 리소스 경합을 방지하는 순차 실행 전략과 프로젝트 고유 패턴을 자동 적용합니다.
  사용자가 특정 페이지나 기능에 대한 E2E 테스트를 요청할 때 반드시 이 스킬을 사용하세요.
---

# Playwright E2E 테스트 워크플로우 스킬

## 목적

Playwright E2E 테스트의 **계획 → 생성 → 실행 → 검증 → 보고** 전체 사이클을 안정적으로 수행한다.
이 스킬이 존재하는 이유는 playwright-test MCP 에이전트를 무작정 병렬 실행하면
브라우저 리소스 경합으로 사일런트 종료가 발생하기 때문이다. 이 스킬은 그 경험에서
나온 실행 전략과, 프로젝트 고유 인증/로케이터 패턴을 자동 적용하는 가이드를 제공한다.

---

## 워크플로우 (6단계)

### Phase 1: 탐색 및 분석

테스트 대상 페이지의 구조를 파악한다. 두 가지 방법을 병행한다.

**1a. 코드 분석 (우선)**

코드를 직접 읽는 것이 가장 정확하다. 브라우저 탐색보다 빠르고 안정적이다.

```
분석 순서:
1. 페이지 컴포넌트: app/(dashboard)/<feature>/page.tsx, [id]/page.tsx
2. 클라이언트 컴포넌트: components/<feature>/*Client.tsx, *Content.tsx
3. i18n 텍스트: messages/ko/<feature>.json — 실제 화면에 표시되는 한국어 텍스트
4. 기존 테스트: tests/e2e/features/<feature>/**/*.spec.ts — 검증된 로케이터 패턴
5. 권한 로직: 컴포넌트 내 hasRole/canCreate 조건 — 역할별 UI 차이
```

**1b. 브라우저 스냅샷 (보조)**

코드만으로 불확실할 때, `playwright-test-planner` 에이전트로 실제 DOM을 확인한다.
동적 렌더링(조건부 버튼, 역할별 UI 차이, 상태별 버튼 유무)을 확인할 때 특히 유용하다.

### Phase 2: 테스트 계획 수립

`planner_save_plan` 도구로 테스트 계획을 저장한다. 이 단계에서는 브라우저가 필요 없다.

계획 작성 원칙:
- suite 단위로 기능 영역 분리 (목록/상세/역할별 등)
- 각 test에 구체적인 steps와 expectedResults 명시
- file 경로는 반드시 `tests/e2e/features/<feature>/` 하위로 지정

### Phase 3: 테스트 코드 생성

**이것이 가장 중요한 단계다.**

#### 에이전트 vs 직접 작성 — 판단 기준

| 상황 | 방법 | 이유 |
|------|------|------|
| 테스트 5개 이하 | **직접 작성** | 에이전트 오버헤드 > 이득 |
| 로케이터가 코드/기존 테스트에서 명확 | **직접 작성** | 브라우저 탐색 불필요 |
| 단순 권한 체크 (visible/not.visible) | **직접 작성** | 패턴이 단순 |
| 복잡한 UI 상호작용 (다이얼로그, 폼) | **에이전트** | 실제 DOM 확인 필요 |
| 6개 이상 + 로케이터 불확실 | **에이전트 배치** | 2개씩 순차 실행 |

#### Generator 에이전트 동시 실행 제한

playwright-test-generator 에이전트는 각각 독립 브라우저 인스턴스를 사용한다.
MCP 브라우저 서버는 동시 세션에 제한이 있다.

```
동시 실행 제한:
  - 2개 이하: 안전
  - 3개: 환경에 따라 불안정
  - 4개 이상: 금지 (사일런트 종료 발생)

권장 패턴:
  배치 1: 에이전트 2개 병렬 → 완료 대기
  배치 2: 에이전트 2개 병렬 → 완료 대기
  ...

  5분 이상 응답 없으면 사일런트 종료로 판단 → 직접 작성으로 전환
```

이 제한이 존재하는 이유: generator 에이전트 10개를 동시에 실행했을 때 7개가 아무 알림 없이
종료되어 1시간을 낭비한 실제 경험에서 나온 규칙이다.

#### Generator 프롬프트 템플릿

```
Test plan file: <plan-file-path>

<test-suite><!-- suite name --></test-suite>
<test-name><!-- test name --></test-name>
<test-file><!-- output file path --></test-file>
<seed-file><!-- seed file path --></seed-file>
<body>
CRITICAL RULES:
1. Import: import { test, expect } from '<relative-path>/shared/fixtures/auth.fixture';
2. Fixture: <fixture-name> (NOT page) — 예: techManagerPage, testOperatorPage
3. 절대 loginAs(), page.goto('/login'), signIn() 사용 금지
4. Korean locale (ko) — 모든 텍스트가 한국어
5. waitForTimeout 금지 → expect(locator).toBeVisible() 사용
6. Semantic locators: getByRole, getByText, getByLabel, getByPlaceholder
7. 파일 저장 경로: apps/frontend/tests/e2e/ 하위에 저장

Steps:
<구체적인 테스트 단계>

Expected results:
<검증 기대값>
</body>
```

### Phase 4: 실행 및 검증

1. **파일 경로 검증** — `apps/frontend/tests/e2e/` 하위인지 확인.
   프로젝트 루트 `tests/`에 생성되는 경우가 잦으므로 반드시 체크하고 이동한다.

2. **import 경로 검증** — `../../../shared/fixtures/auth.fixture` 상대 경로 정확성 확인

3. **테스트 실행**:
   ```bash
   # storageState가 이미 있으면 --no-deps로 auth.setup 건너뛰기 (간헐 실패 방지)
   pnpm --filter frontend exec playwright test <path> --project=chromium --no-deps

   # storageState 없으면 (최초 실행)
   pnpm --filter frontend exec playwright test <path> --project=chromium
   ```

4. **실패 분류 (앱 버그 vs 테스트 버그)** — 테스트가 실패하면 바로 고치기 전에 원인을 분류한다.

   ```
   실패 원인 판단 기준:

   테스트 코드를 고쳐야 하는 경우:
   - 로케이터 오류 (이름 불일치, exact: true 누락, strict mode 위반)
   - 잘못된 장비 상태 선택 (checked_out에서 반출 버튼 찾기)
   - 타이밍 이슈 (로딩 대기 부족)
   - 경로/import 오류

   앱 코드를 고쳐야 하는 경우:
   - 기대한 버튼/요소가 렌더링되지 않는데, 비즈니스 로직상 표시되어야 함
   - 권한이 있는 역할인데 액션이 비활성화됨
   - 상태 전이 후 UI가 갱신되지 않음 (캐시 무효화 누락)
   - API 호출 실패 (네트워크 에러, 500 응답)
   - i18n 키 누락으로 텍스트가 안 보임

   판단이 어려운 경우:
   - 앱 코드의 해당 컴포넌트를 읽어서 의도된 동작인지 확인
   - CLAUDE.md의 도메인 규칙(UL-QP-18)과 대조
   - 사용자에게 "이 동작이 의도된 것인지" 확인 질문
   ```

   **앱 버그가 발견되면 직접 코드를 수정하지 않는다.**
   대신 다음을 사용자에게 보고한다:

   ```
   앱 버그 보고 형식:

   ## E2E 테스트에서 발견된 앱 버그

   **테스트 파일:** <spec 파일 경로>
   **실패 단계:** <어떤 assertion에서 실패했는지>
   **기대 동작:** <비즈니스 로직상 이래야 하는 것>
   **실제 동작:** <실제로 관찰된 것>

   **원인 추정:**
   - 관련 컴포넌트: <파일 경로:라인>
   - 관련 서비스/API: <파일 경로:라인>
   - 추정 원인: <캐시 무효화 누락 / 권한 체크 조건 오류 / i18n 키 누락 등>

   **영향 범위:**
   - 영향받는 역할: <test_engineer, lab_manager 등>
   - 영향받는 페이지: <URL>

   **권장 조치:** /review-architecture 로 해당 모듈 아키텍처 리뷰 후 수정
   ```

   앱 버그는 이 테스트 워크플로우의 범위를 넘는 문제다.
   `/review-architecture`로 계층 관통 리뷰를 하거나, 사용자가 직접 수정 범위를 결정해야 한다.
   E2E 테스트 스킬이 앱 코드를 함부로 수정하면 사이드 이펙트가 발생할 수 있다.

5. **테스트 코드 수정** — 테스트 버그인 경우에만 healer 에이전트에 실패 파일을 전달.
   Healer는 테스트 러너 기반이므로 generator와 달리 브라우저 경합이 없다.
   여러 실패 파일을 하나의 에이전트 호출에 동시에 넘겨도 안전하다.
   단, healer는 "테스트를 통과시키는 것"이 목표이므로, 앱 버그를 테스트 수정으로
   덮어버리지 않도록 반드시 4단계의 분류를 먼저 거친다.

### Phase 5: 결과 보고서

**모든 테스트 실행이 완료된 후 반드시 이 보고서를 작성한다.**

테스트 실행 결과를 종합하여 사용자가 전체 상황을 한눈에 파악하고,
다음 액션을 결정할 수 있도록 구조화된 보고서를 제공한다.

#### 보고서 템플릿

```markdown
# E2E 테스트 결과 보고서

**대상:** <테스트 대상 기능/페이지>
**실행 일시:** <날짜>
**실행 범위:** <spec 파일 수> 파일, <테스트 케이스 수> 케이스

---

## 1. 요약

| 구분 | 수량 |
|------|------|
| ✅ 통과 | N |
| ❌ 실패 (테스트 코드 문제) | N |
| 🚨 실패 (앱 코드 문제) | N |
| ⏭️ 스킵 | N |

---

## 2. 기능별 상세 결과

### ✅ 정상 동작하는 기능

| 테스트 | 파일 | 검증된 내용 |
|--------|------|-------------|
| <테스트명> | <spec 파일 경로> | <무엇이 정상 동작하는지 1줄 요약> |
| ... | ... | ... |

### ❌ 테스트 코드 수정으로 해결된 실패

| 테스트 | 원인 | 수정 내용 |
|--------|------|-----------|
| <테스트명> | 로케이터 불일치 / 타이밍 / import 오류 등 | <어떻게 수정했는지> |
| ... | ... | ... |

### 🚨 앱 코드 수정이 필요한 실패

이 항목들은 테스트 코드 수정만으로는 해결할 수 없다.
프론트엔드 또는 백엔드의 구조적 문제이므로 별도 작업이 필요하다.

#### 이슈 1: <문제 제목>

- **테스트 파일:** <spec 파일 경로>
- **실패한 단계:** <어떤 assertion에서 실패했는지>
- **기대 동작:** <비즈니스 로직상 이래야 하는 것>
- **실제 동작:** <실제로 관찰된 것>
- **원인 분석:**
  - 관련 파일: <프론트엔드/백엔드 파일 경로:라인>
  - 근본 원인: <캐시 무효화 누락 / 권한 조건 오류 / API 응답 불일치 / i18n 키 누락 등>
  - 수정 범위: <프론트엔드만 / 백엔드만 / 양쪽 모두>
- **권장 조치:** <구체적인 수정 방향 — 어떤 파일의 어떤 부분을 어떻게 고쳐야 하는지>
- **영향 범위:** <영향받는 역할, 페이지, 다른 기능과의 연관>

#### 이슈 2: ...

---

## 3. 다음 단계 (Action Items)

### 즉시 가능한 작업 (테스트 범위 내)
- [ ] <테스트 코드 수정/추가 항목>

### 앱 코드 수정 필요 (별도 작업)
- [ ] <이슈 1 제목> — 수정 범위: <FE/BE/양쪽>, 권장: `/review-architecture`
- [ ] <이슈 2 제목> — 수정 범위: <FE/BE/양쪽>

### 추가 테스트 권장
- [ ] <아직 커버하지 못한 시나리오>
```

#### 보고서 작성 원칙

1. **앱 코드 문제는 수정하지 않고 보고만 한다** — 원인 분석과 수정 방향까지 제시하되,
   실제 코드 수정은 사용자가 결정한다. E2E 테스트 스킬이 앱 코드를 건드리면
   의도치 않은 사이드 이펙트가 발생할 수 있다.

2. **"왜 테스트만으로 안 되는지"를 명확히 설명한다** — 사용자가 "테스트 코드를 고치면
   되는 거 아닌가?"라고 생각할 수 있으므로, 앱 버그 항목에는 반드시
   "이것은 앱의 X 동작이 잘못된 것이므로 테스트를 수정해도 근본 해결이 안 됩니다"를 명시한다.

3. **수정 범위를 구체적으로 제시한다** — "백엔드 수정 필요"가 아니라
   "checkouts.service.ts:245의 상태 전이 조건에 rental 케이스가 빠져있음"처럼
   파일과 라인까지 특정한다.

4. **기능별로 그룹핑한다** — 같은 기능의 여러 테스트가 실패했으면 하나의 이슈로 묶는다.
   동일한 근본 원인을 가진 실패를 개별로 나열하면 보고서가 불필요하게 길어진다.

### Phase 6: 자기 개선

**모든 테스트 워크플로우 종료 후 반드시 실행한다. 이 단계를 건너뛰지 않는다.**

이 스킬은 실행할 때마다 경험을 축적하여 스스로 발전한다.
경험은 `LEARNINGS.md` 파일에 기록되며, 다음 실행 시 반드시 참조된다.

#### 6a. 경험 기록 (LEARNINGS.md 업데이트)

워크플로우 중 발생한 모든 유의미한 경험을 `LEARNINGS.md`에 기록한다.

```
기록 대상 (하나라도 해당되면 기록):

1. 로케이터 패턴
   - 실패한 로케이터 → 올바른 로케이터로 수정한 사례
   - 특정 컴포넌트에서 발견한 효과적인 로케이터 전략

2. 테스트 데이터 주의사항
   - 특정 ID가 특정 상태여서 테스트에 부적합했던 사례
   - 시드 데이터의 상태가 예상과 달랐던 경우

3. 에이전트 행동 패턴
   - generator가 반복적으로 하는 실수 (잘못된 import 경로, fixture 미사용 등)
   - healer가 assertion을 삭제해서 테스트 의미를 훼손한 사례
   - 에이전트 타임아웃이나 사일런트 종료 발생 조건

4. 타이밍/안정성 패턴
   - 특정 페이지에서 networkidle 대기가 필요했던 경우
   - 특정 동작 후 추가 대기가 필요했던 경우

5. 앱 버그 이력
   - 발견된 앱 버그와 해결 여부 추적
   - 해결된 버그는 상태를 '해결됨'으로 업데이트
```

#### 6b. 스킬 규칙 업데이트 (SKILL.md 자체 수정)

같은 유형의 경험이 **3회 이상** 반복되면, 그것은 패턴이다.
패턴이 되면 `LEARNINGS.md`의 개별 기록에서 `SKILL.md`의 정식 규칙으로 승격한다.

```
승격 기준:
- 같은 로케이터 실수가 3회 → "로케이터 규칙" 섹션에 새 규칙 추가
- 같은 에이전트 실수가 3회 → "에이전트 사용 가이드" 또는 "Generator 프롬프트 템플릿"에 반영
- 같은 타이밍 문제가 3회 → "프로젝트 규칙"에 대기 전략 추가
- 같은 데이터 선택 실수가 3회 → "테스트 데이터 선택 가이드"에 주의사항 추가

승격 시:
1. SKILL.md의 해당 섹션에 규칙 추가
2. LEARNINGS.md의 "스킬 개선 이력"에 변경 사항과 근거 기록
3. 원본 경험 기록은 유지 (삭제하지 않음 — 근거 추적용)
```

#### 6c. 실행 시작 시 LEARNINGS.md 참조

**Phase 1(탐색) 시작 전에 반드시 `LEARNINGS.md`를 읽는다.**

```
참조 순서:
1. LEARNINGS.md 전체를 읽는다
2. 현재 테스트 대상과 관련된 경험이 있는지 확인한다
   - 같은 페이지의 로케이터 패턴이 기록되어 있는가?
   - 사용하려는 테스트 데이터에 주의사항이 있는가?
   - 이전에 발견된 앱 버그 중 아직 미해결인 것이 있는가?
3. 관련 경험이 있으면 계획/코드 생성에 즉시 반영한다
   - 이전에 실패한 로케이터를 다시 사용하지 않는다
   - 이전에 발견한 효과적인 패턴을 우선 적용한다
```

#### 6d. 경험 정리 (분기별)

LEARNINGS.md가 200줄을 초과하면 정리한다:
- 해결된 앱 버그는 '해결됨' 표시 유지 (삭제하지 않음)
- SKILL.md로 승격된 패턴의 원본 기록은 "승격됨 → SKILL.md 반영" 표시
- 더 이상 유효하지 않은 기록(앱 코드 변경으로 무의미해진 것)은 삭제

---

## 프로젝트 규칙 (자동 적용)

### 인증: storageState 기반 Fixture

```typescript
// ✅ 올바른 패턴
import { test, expect } from '../../../shared/fixtures/auth.fixture';

test('테스트명', async ({ techManagerPage: page }) => {
  await page.goto('/equipment');
});

// ❌ 금지 패턴
import { test } from '@playwright/test';  // auth fixture 미사용
await loginAs(page, 'technical_manager'); // loginAs 금지
await page.goto('/login');                // 직접 로그인 금지
```

### 역할별 Fixture 매핑

| Fixture | 역할 | Korean | storageState |
|---------|------|--------|-------------|
| `testOperatorPage` | test_engineer | 시험실무자 | test-engineer.json |
| `techManagerPage` | technical_manager | 기술책임자 | technical-manager.json |
| `qualityManagerPage` | quality_manager | 품질책임자 | quality-manager.json |
| `siteAdminPage` | lab_manager | 시험소장 | lab-manager.json |
| `systemAdminPage` | system_admin | 시스템관리자 | system-admin.json |

### 로케이터 규칙

```typescript
// ✅ 시맨틱 로케이터 (우선)
page.getByRole('tab', { name: '교정 이력 탭' })
page.getByRole('button', { name: '폐기 요청' })
page.getByRole('heading', { name: '안테나 시스템 1' })
page.getByPlaceholder('장비명, 모델명, 관리번호로 검색')

// ✅ 부분 매칭 주의 — exact: true 사용
// '장비 등록' 검색 시 '공용장비 등록'도 매칭 → strict mode 위반
page.getByRole('link', { name: '장비 등록', exact: true })  // ✅
page.getByRole('link', { name: '장비 등록' })               // ❌ 2개 매칭

// ✅ 중복 텍스트 — first() 또는 범위 한정
// 'SUW-E0001'이 관리번호 + 시리얼번호(SN-SUW-E0001)에 모두 있을 때
page.getByText('SUW-E0001', { exact: true })                // ✅
page.locator('#equipment-sticky-header').getByText('SUW-E0001') // ✅ 범위 한정

// ❌ 금지
page.locator('[role="dialog"]')           // → getByRole('dialog', { name: '...' })
page.waitForTimeout(1000)                 // → expect(locator).toBeVisible()
```

### 테스트 데이터 선택 가이드

장비 상태에 따라 보이는 버튼이 달라지므로, 테스트 목적에 맞는 장비를 선택해야 한다.

```
반출 신청 버튼 테스트 → available 상태 장비 사용
  (checked_out 장비는 반출 버튼이 렌더링되지 않음)

폐기 요청 테스트 → available + 비공유 장비
  (공유 장비는 폐기 불가)

부적합 배너 테스트 → non_conforming 상태 장비

상태 스트립 필터 테스트 → 해당 상태 장비가 0건이면 버튼 자체가 사라짐
  (isVisible() 체크 후 조건부 처리 필요)
```

테스트 데이터 ID는 `tests/e2e/shared/constants/shared-test-data.ts`에서 확인한다.
이 파일이 SSOT이며, 백엔드 `database/utils/uuid-constants.ts`와 동기화되어 있다.

### 테스트 파일 구조

```typescript
// 파일 상단 주석 (plan/seed 연결)
// spec: apps/frontend/tests/e2e/features/<feature>/<plan>.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/<seed>.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';
// 또는 기능별 상수 파일: import { TEST_CHECKOUT_IDS } from '../../helpers/checkout-constants';

test.describe('테스트 그룹명', () => {
  // 상태 변경 테스트는 serial 모드
  // test.describe.configure({ mode: 'serial' });

  test('테스트 케이스명', async ({ techManagerPage: page }) => {
    // ✅ SSOT: shared-test-data.ts에서 import (UUID 하드코딩 금지)
    await page.goto(`/equipment/${EQUIPMENT_IDS.SPECTRUM_ANALYZER}`);
    await expect(page.getByRole('heading', { name: '...' })).toBeVisible();
  });
});
```

> **SSOT 참조:** 테스트 데이터 ID는 `shared-test-data.ts`, Fixture 매핑은 `auth.fixture.ts`가 원본이다.
> 이 스킬의 테이블은 가이드 목적의 요약이며, 실제 값이 달라지면 원본 파일을 기준으로 한다.

---

## 에이전트 사용 가이드

### 에이전트별 리소스 특성

| 에이전트 | 리소스 | 동시 실행 | 비고 |
|---------|--------|---------|------|
| **planner** | 브라우저 1개 점유 | 1개만 | 대화형 탐색, 계획 저장 |
| **generator** | 브라우저 1개 + 파일쓰기 | 최대 2개 | 경합 주의, 경로 검증 필수 |
| **healer** | 테스트 러너 기반 | 1개에 여러 파일 OK | 브라우저 경합 없음 |

### Planner 사용법

```
1. planner_setup_page(seedFile: "apps/frontend/tests/e2e/shared/seed/<seed>.spec.ts")
2. 로그인 페이지 도착 → dev login 버튼 클릭으로 역할 선택
3. browser_navigate → 대상 페이지 이동
4. browser_snapshot → 구조 확인
5. planner_save_plan → 계획 저장
```

### Healer 사용법

```
프롬프트:
"다음 테스트들이 실패합니다. 각각 디버깅하고 수정해주세요:
1. tests/e2e/features/equipment/comprehensive/detail-basic-info.spec.ts
2. tests/e2e/features/equipment/comprehensive/role-tech-manager.spec.ts
..."
```

여러 파일을 한번에 넘겨도 healer가 순차적으로 `test_debug` → 수정 → 재실행한다.

### tmux 에이전트 팀 활용 (대규모 테스트)

tmux 환경에서 실행될 때, 여러 Claude Code 인스턴스를 팀으로 조율하여
단일 세션의 한계(MCP 브라우저 2개 제한, 컨텍스트 윈도우 소모)를 극복한다.

#### 언제 에이전트 팀을 사용하는가

```
단일 세션으로 충분한 경우:
  - 테스트 10개 이하
  - 단일 기능(feature) 테스트
  - 실패 수정(healer) 작업

에이전트 팀이 필요한 경우:
  - 테스트 10개 이상 + 여러 기능에 걸쳐 있음
  - 전체 기능 회귀 테스트 (모든 feature 스위트 실행)
  - 생성 + 실행 + 수정을 파이프라인으로 처리하고 싶을 때
```

#### 팀 구성 패턴

**패턴 1: 기능별 분할 (Feature Split)**

테스트 대상 기능이 여러 개일 때, 기능별로 독립 인스턴스를 배정한다.

```
tmux 레이아웃:
┌─────────────────────┬─────────────────────┐
│ Pane 1: 코디네이터   │ Pane 2: equipment   │
│ (계획 + 보고서)      │ (생성 + 실행)        │
├─────────────────────┼─────────────────────┤
│ Pane 3: checkouts   │ Pane 4: calibration │
│ (생성 + 실행)        │ (생성 + 실행)        │
└─────────────────────┴─────────────────────┘

각 Pane의 프롬프트:

Pane 1 (코디네이터):
  "equipment, checkouts, calibration 3개 기능의 E2E 테스트를 팀으로 진행합니다.
   나는 코디네이터입니다. 테스트 계획을 수립하고, 각 기능별 계획 파일을
   생성한 뒤, 다른 pane들의 작업이 끝나면 결과를 수집하여 Phase 5 보고서를 작성합니다."

Pane 2-4 (실행자):
  "/playwright-e2e equipment 기능 E2E 테스트를 생성하고 실행해주세요.
   테스트 계획: tests/e2e/features/equipment/equipment-comprehensive.plan.md
   완료 후 결과를 LEARNINGS.md에 기록해주세요."
```

**패턴 2: 파이프라인 (Pipeline)**

한 인스턴스가 생성하면, 다른 인스턴스가 실행하고, 또 다른 인스턴스가 수정한다.

```
tmux 레이아웃:
┌─────────────────────────────────────────────┐
│ Pane 1: 생성자 (Phase 1-3)                    │
│ → 테스트 코드를 작성하여 파일로 저장              │
├─────────────────────────────────────────────┤
│ Pane 2: 실행자 (Phase 4)                      │
│ → 생성된 파일을 실행하고 결과를 기록               │
├─────────────────────────────────────────────┤
│ Pane 3: 수정자 (Phase 4 healer + Phase 5-6)  │
│ → 실패한 테스트 수정 + 보고서 + LEARNINGS 업데이트  │
└─────────────────────────────────────────────┘

실행 순서:
1. Pane 1이 테스트 파일 생성 → 완료 신호 (파일 존재 확인)
2. Pane 2가 생성된 파일 실행 → 결과를 임시 파일에 기록
3. Pane 3이 실패 목록을 읽고 healer로 수정 → 보고서 작성
```

**패턴 3: 역할 분리 (Role Split)**

코드 분석과 테스트 작성을 분리하여 컨텍스트 윈도우를 효율적으로 사용한다.

```
tmux 레이아웃:
┌─────────────────────┬─────────────────────┐
│ Pane 1: 분석가       │ Pane 2: 작성자       │
│ (Phase 1 코드 분석)   │ (Phase 3 코드 생성)   │
└─────────────────────┴─────────────────────┘

활용:
- Pane 1: 앱 코드를 읽고 로케이터, 권한 조건, 상태 전이를 분석
  → 분석 결과를 임시 파일에 정리 (예: /tmp/e2e-analysis-equipment.md)
- Pane 2: 분석 파일을 읽고 테스트 코드만 집중 생성
  → 앱 코드를 직접 읽지 않아도 되므로 컨텍스트 절약
```

#### 팀 간 통신 규약

에이전트 팀은 파일 시스템을 통해 통신한다.
각 인스턴스는 독립된 Claude Code 세션이므로 직접 메시지를 주고받을 수 없다.

```
통신 파일 위치: tests/e2e/.team/

구조:
tests/e2e/.team/
├── plan.json                    # 코디네이터가 작성하는 전체 계획
├── status/
│   ├── equipment.json           # { "phase": "done", "passed": 8, "failed": 2, ... }
│   ├── checkouts.json
│   └── calibration.json
├── analysis/
│   ├── equipment-locators.md    # 분석가가 발견한 로케이터 정보
│   └── equipment-permissions.md # 권한 조건 분석 결과
└── results/
    └── final-report.md          # 코디네이터가 작성하는 최종 보고서

.gitignore에 추가: tests/e2e/.team/
```

**상태 파일 형식:**

```json
{
  "feature": "equipment",
  "phase": "executing",
  "startedAt": "2026-03-24T10:00:00Z",
  "specs": {
    "total": 10,
    "passed": 7,
    "failed": 2,
    "skipped": 1
  },
  "failures": [
    {
      "file": "detail-basic-info.spec.ts",
      "type": "test_bug",
      "reason": "로케이터 불일치",
      "fixed": true
    },
    {
      "file": "role-permissions.spec.ts",
      "type": "app_bug",
      "reason": "권한 체크 조건 오류",
      "fixed": false,
      "details": "components/equipment/EquipmentActions.tsx:45 — hasRole 조건에 quality_manager 누락"
    }
  ]
}
```

#### 코디네이터 인스턴스 역할

팀으로 실행할 때 반드시 하나의 인스턴스가 코디네이터 역할을 맡는다.

```
코디네이터 책임:
1. 전체 테스트 계획 수립 (어떤 기능을 어떤 pane에 배정할지)
2. .team/plan.json 작성
3. 각 실행자 pane의 상태 파일(.team/status/*.json) 모니터링
4. 모든 pane 완료 후:
   a. 상태 파일들을 수집하여 Phase 5 통합 보고서 작성
   b. LEARNINGS.md 업데이트 (Phase 6)
   c. .team/ 디렉토리 정리

코디네이터 완료 감지 전략:
  - 각 실행자는 완료 시 상태 파일의 "phase"를 "done"으로 설정
  - 코디네이터는 모든 status/*.json의 "phase"가 "done"인지 확인
  - 확인 방법: ls tests/e2e/.team/status/ && grep -l '"done"' tests/e2e/.team/status/*.json
  - 아직 "done"이 아닌 파일이 있으면 사용자에게 "N개 기능 진행 중" 알림 후 대기
  - 타임아웃: 실행자가 30분 이상 상태 변경 없으면 해당 pane 확인 요청

코디네이터 프롬프트 예시:
  "E2E 테스트 코디네이터입니다. 다른 pane들이 작업 중입니다.
   tests/e2e/.team/status/ 디렉토리의 상태 파일들을 확인하고,
   모든 기능이 완료되면 통합 보고서를 작성해주세요.
   /playwright-e2e 스킬의 Phase 5 보고서 템플릿을 따르세요."
```

#### 주의사항

```
파일 충돌 방지:
  - 각 실행자는 자기 기능의 spec 파일만 생성/수정한다
  - LEARNINGS.md는 코디네이터만 수정한다 (실행자는 상태 파일에만 기록)
  - SKILL.md 규칙 승격도 코디네이터만 판단한다

브라우저 리소스:
  - 각 pane은 독립된 MCP 세션을 가지므로 브라우저 제한이 별도로 적용된다
  - 그래도 pane당 generator 에이전트는 2개 이하로 유지한다
  - 테스트 실행(playwright test)은 동시에 여러 pane에서 실행 가능하다
    단, DB 상태를 변경하는 serial 테스트가 겹치지 않도록 기능을 분리한다

storageState 공유:
  - .auth/*.json 파일은 모든 pane이 공유한다
  - 첫 번째 pane이 auth.setup을 실행하면 나머지는 --no-deps로 건너뛴다
```

---

## 의사결정 트리

```
사용자가 테스트 요청
│
├── 대상 페이지가 명확한가?
│   ├── YES → Phase 1: 코드 분석으로 구조 파악
│   └── NO → 사용자에게 대상 페이지/기능 확인
│
├── 기존 테스트가 있는가?
│   ├── YES → 기존 패턴 참조, 빠진 시나리오만 추가
│   └── NO → Phase 2: 전체 테스트 계획 수립
│
├── 테스트 수가 5개 이하인가?
│   ├── YES → 직접 작성 (에이전트 오버헤드 불필요)
│   └── NO
│       ├── 10개 이하 또는 단일 기능 → 에이전트 배치 실행 (2개씩 순차)
│       └── 10개 초과 + 여러 기능 + tmux 환경
│           → 에이전트 팀 구성 (기능별 분할 또는 파이프라인)
│
├── 에이전트가 5분 내 응답 없는가?
│   ├── YES → 사일런트 종료 판단, 직접 작성으로 전환
│   └── NO → 완료 대기
│
└── 생성 완료 후
    ├── 파일 경로 검증 (apps/frontend/tests/e2e/ 하위)
    ├── import 경로 검증
    ├── 테스트 실행 (--no-deps 플래그 사용)
    ├── 실패 시
    │   ├── 원인 분류: 앱 버그인가? 테스트 버그인가?
    │   ├── 앱 버그 → 보고서에 기록 (직접 수정 금지)
    │   └── 테스트 버그 → healer 에이전트에 실패 파일 일괄 전달
    │
    ├── Phase 5: 결과 보고서 작성
    │   ├── ✅ 정상 동작 기능 목록
    │   ├── ❌ 테스트 코드 수정으로 해결된 항목
    │   ├── 🚨 앱 코드 수정 필요 항목 (파일:라인, 원인, 수정 방향)
    │   └── 다음 단계 (Action Items) — 즉시 가능 vs 별도 작업
    │
    └── Phase 6: 자기 개선
        ├── LEARNINGS.md에 이번 세션 경험 기록
        ├── 3회 이상 반복 패턴 → SKILL.md 정식 규칙으로 승격
        └── 다음 실행 시 LEARNINGS.md 참조 (Phase 1 시작 전)
```
