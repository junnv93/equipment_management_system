# Playwright E2E — 프로젝트 규칙

## 인증: storageState 기반 Fixture

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

## 역할별 Fixture 매핑

| Fixture | 역할 | Korean | storageState |
|---------|------|--------|-------------|
| `testOperatorPage` | test_engineer | 시험실무자 | test-engineer.json |
| `techManagerPage` | technical_manager | 기술책임자 | technical-manager.json |
| `qualityManagerPage` | quality_manager | 품질책임자 | quality-manager.json |
| `siteAdminPage` | lab_manager | 시험소장 | lab-manager.json |
| `systemAdminPage` | system_admin | 시스템관리자 | system-admin.json |

## 로케이터 규칙

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

## 테스트 데이터 선택 가이드

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

## 테스트 파일 구조

```typescript
// 파일 상단 주석 (plan/seed 연결)
// spec: apps/frontend/tests/e2e/features/<feature>/<plan>.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/<seed>.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

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
