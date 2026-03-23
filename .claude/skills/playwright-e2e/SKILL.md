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

Playwright E2E 테스트의 **계획 → 생성 → 실행 → 검증** 전체 사이클을 안정적으로 수행한다.
이 스킬이 존재하는 이유는 playwright-test MCP 에이전트를 무작정 병렬 실행하면
브라우저 리소스 경합으로 사일런트 종료가 발생하기 때문이다. 이 스킬은 그 경험에서
나온 실행 전략과, 프로젝트 고유 인증/로케이터 패턴을 자동 적용하는 가이드를 제공한다.

---

## 워크플로우 (4단계)

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

const EQUIPMENT_ID = 'eeee1001-0001-4001-8001-000000000001';

test.describe('테스트 그룹명', () => {
  // 상태 변경 테스트는 serial 모드
  // test.describe.configure({ mode: 'serial' });

  test('테스트 케이스명', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);
    await expect(page.getByRole('heading', { name: '...' })).toBeVisible();
  });
});
```

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
│   └── NO → 에이전트 배치 실행 (2개씩 순차)
│
├── 에이전트가 5분 내 응답 없는가?
│   ├── YES → 사일런트 종료 판단, 직접 작성으로 전환
│   └── NO → 완료 대기
│
└── 생성 완료 후
    ├── 파일 경로 검증 (apps/frontend/tests/e2e/ 하위)
    ├── import 경로 검증
    ├── 테스트 실행 (--no-deps 플래그 사용)
    └── 실패 시
        ├── 원인 분류: 앱 버그인가? 테스트 버그인가?
        ├── 앱 버그 → 사용자에게 버그 보고 (파일:라인, 원인, 영향 범위)
        │            → /review-architecture 권장 (직접 수정 금지)
        └── 테스트 버그 → healer 에이전트에 실패 파일 일괄 전달
```
