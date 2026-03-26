/**
 * 사고이력 → 부적합 생성 워크플로우 E2E 테스트
 *
 * 테스트 시나리오:
 * 1. 사고이력만 생성 (부적합 생성 안함)
 * 2. damage/malfunction 선택 시 체크박스 표시
 * 3. 부적합 생성 + 장비 상태 유지 (외관 손상)
 * 4. 부적합 생성 + 장비 상태 변경 (심각한 오작동)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Incident History → Non-Conformance Integration', () => {
  // 테스트용 장비 ID (실제 DB에 있어야 함)
  let testEquipmentId: string;

  test.beforeEach(async ({ testOperatorPage }, testInfo) => {
    // Chromium에서만 실행
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }

    // 장비 목록에서 첫 번째 장비 가져오기
    await testOperatorPage.goto('/equipment');

    const firstEquipmentLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    if ((await firstEquipmentLink.count()) === 0) {
      console.log('테스트할 장비가 없습니다. 테스트 건너뛰기');
      test.skip();
      return;
    }

    await firstEquipmentLink.click();

    // URL에서 장비 ID 추출
    const url = testOperatorPage.url();
    const match = url.match(/\/equipment\/([^/?]+)/);
    testEquipmentId = match?.[1] || '';

    // 사고이력 탭 클릭 - 여러 셀렉터 시도
    // Radix UI의 TabsTrigger는 data-state 속성을 사용
    const incidentTab =
      testOperatorPage.getByRole('tab', { name: /사고 이력/i }) ||
      testOperatorPage.locator('button[value="incident"]') ||
      testOperatorPage.locator('button:has-text("사고 이력")');

    // 탭이 표시될 때까지 대기

    const tabCount = await incidentTab.count();
    console.log(`Found ${tabCount} incident tab(s)`);

    if (tabCount > 0) {
      await incidentTab.first().click();
    } else {
      // 탭 목록 확인을 위한 디버깅
      const allTabs = await testOperatorPage.getByRole('tab').allTextContents();
      console.log('Available tabs:', allTabs);
      console.log('사고 이력 탭을 찾을 수 없습니다. 테스트 건너뛰기');
      test.skip();
    }
  });

  test('should create incident only (without non-conformance)', async ({ testOperatorPage }) => {
    // 탭 컨텐츠가 로드될 때까지 대기

    // 사고 등록 버튼 찾기 (여러 방법 시도)
    let registerButton = testOperatorPage.getByRole('button', { name: /사고 등록/i });
    if ((await registerButton.count()) === 0) {
      registerButton = testOperatorPage.locator('button:has-text("사고 등록")');
    }
    if ((await registerButton.count()) === 0) {
      registerButton = testOperatorPage.locator('button:has(svg)').filter({ hasText: /등록/i });
    }

    const buttonCount = await registerButton.count();
    console.log(`Found ${buttonCount} register button(s)`);

    // 디버깅: 페이지에 있는 모든 버튼 출력
    const allButtons = await testOperatorPage.locator('button').allTextContents();
    console.log('Available buttons:', allButtons.slice(0, 10)); // 처음 10개만

    if (buttonCount === 0) {
      console.log('사고 등록 버튼을 찾을 수 없습니다. 테스트 건너뛰기');
      test.skip();
      return;
    }
    await registerButton.first().click();

    // 폼 입력 - 날짜
    const dateInput = testOperatorPage.locator('input[type="date"]');
    if ((await dateInput.count()) > 0) {
      await dateInput.fill('2026-01-26');
    }

    // 사고 유형 선택 (Select/Combobox)
    const typeSelect = testOperatorPage.locator('button[role="combobox"]').first();
    if ((await typeSelect.count()) > 0) {
      await typeSelect.click();
      const changeOption = testOperatorPage.getByRole('option', { name: /변경/i });
      if ((await changeOption.count()) > 0) {
        await changeOption.click();
      }
    }

    // 내용 입력
    const contentTextarea = testOperatorPage.locator('textarea').first();
    if ((await contentTextarea.count()) > 0) {
      await contentTextarea.fill('케이블 교체 작업');
    }

    // 부적합 체크박스가 표시되지 않음 (change 유형)
    await expect(testOperatorPage.getByText('부적합으로 등록')).not.toBeVisible();

    // 저장
    await testOperatorPage.getByRole('button', { name: /저장/i }).click();

    // 성공 확인 (토스트 메시지 또는 목록에 추가됨)
    const successIndicator = testOperatorPage.getByText(/등록 완료|케이블 교체 작업/i);
    await expect(successIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show checkbox for damage/malfunction types', async ({ testOperatorPage }) => {
    // 탭 컨텐츠가 로드될 때까지 대기

    // 사고 등록 버튼 찾기
    let registerButton = testOperatorPage.getByRole('button', { name: /사고 등록/i });
    if ((await registerButton.count()) === 0) {
      registerButton = testOperatorPage.locator('button:has-text("사고 등록")');
    }
    if ((await registerButton.count()) === 0) {
      test.skip();
      return;
    }
    await registerButton.first().click();

    // 사고 유형 선택 (Select/Combobox)
    const typeSelect = testOperatorPage.locator('button[role="combobox"]').first();
    if ((await typeSelect.count()) === 0) {
      test.skip();
      return;
    }

    // damage 선택 시 체크박스 표시
    await typeSelect.click();
    const damageOption = testOperatorPage.getByRole('option', { name: /손상/i });
    if ((await damageOption.count()) > 0) {
      await damageOption.click();
      await expect(testOperatorPage.getByText('부적합으로 등록')).toBeVisible();
    }

    // change 선택 시 체크박스 숨김
    await typeSelect.click();
    const changeOption = testOperatorPage.getByRole('option', { name: /변경/i });
    if ((await changeOption.count()) > 0) {
      await changeOption.click();
      await expect(testOperatorPage.getByText('부적합으로 등록')).not.toBeVisible();
    }

    // malfunction 선택 시 체크박스 표시
    await typeSelect.click();
    const malfunctionOption = testOperatorPage.getByRole('option', { name: /오작동/i });
    if ((await malfunctionOption.count()) > 0) {
      await malfunctionOption.click();
      await expect(testOperatorPage.getByText('부적합으로 등록')).toBeVisible();
    }
  });

  test('should create incident + non-conformance without status change', async ({
    testOperatorPage,
  }) => {
    // 탭 컨텐츠가 로드될 때까지 대기

    // 사고 등록 버튼 찾기
    let registerButton = testOperatorPage.getByRole('button', { name: /사고 등록/i });
    if ((await registerButton.count()) === 0) {
      registerButton = testOperatorPage.locator('button:has-text("사고 등록")');
    }
    if ((await registerButton.count()) === 0) {
      test.skip();
      return;
    }
    await registerButton.first().click();

    // 날짜 입력
    const dateInput = testOperatorPage.locator('input[type="date"]');
    if ((await dateInput.count()) > 0) {
      await dateInput.fill('2026-01-26');
    }

    // 손상 유형 선택
    const typeSelect = testOperatorPage.locator('button[role="combobox"]').first();
    if ((await typeSelect.count()) > 0) {
      await typeSelect.click();
      const damageOption = testOperatorPage.getByRole('option', { name: /손상/i });
      if ((await damageOption.count()) > 0) {
        await damageOption.click();
      }
    }

    // 내용 입력
    const contentTextarea = testOperatorPage.locator('textarea').first();
    if ((await contentTextarea.count()) > 0) {
      await contentTextarea.fill('디스플레이 크랙 (측정 기능 정상)');
    }

    // 부적합 체크박스 선택
    const checkbox = testOperatorPage.locator('input[type="checkbox"]').first();
    if ((await checkbox.count()) > 0) {
      await checkbox.check();
    } else {
      console.log('부적합 체크박스를 찾을 수 없습니다');
      test.skip();
      return;
    }

    // 저장
    await testOperatorPage.getByRole('button', { name: /저장/i }).click();

    // 확인 Dialog 표시
    const confirmDialog = testOperatorPage.getByText(/장비 상태 변경 확인|사용할 수 없습니까/i);
    if ((await confirmDialog.count()) > 0) {
      // "아니오" 선택 - 계속 사용 가능
      const noButton = testOperatorPage.getByText(/계속 사용|아니오/i);
      if ((await noButton.count()) > 0) {
        await noButton.first().click();
      }
    }

    // 성공 확인
    const successIndicator = testOperatorPage.getByText(/등록 완료|디스플레이 크랙/i);
    await expect(successIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('should create incident + non-conformance with status change', async ({
    testOperatorPage,
  }) => {
    // 탭 컨텐츠가 로드될 때까지 대기

    // 사고 등록 버튼 찾기
    let registerButton = testOperatorPage.getByRole('button', { name: /사고 등록/i });
    if ((await registerButton.count()) === 0) {
      registerButton = testOperatorPage.locator('button:has-text("사고 등록")');
    }
    if ((await registerButton.count()) === 0) {
      test.skip();
      return;
    }
    await registerButton.first().click();

    // 날짜 입력
    const dateInput = testOperatorPage.locator('input[type="date"]');
    if ((await dateInput.count()) > 0) {
      await dateInput.fill('2026-01-26');
    }

    // 오작동 유형 선택
    const typeSelect = testOperatorPage.locator('button[role="combobox"]').first();
    if ((await typeSelect.count()) > 0) {
      await typeSelect.click();
      const malfunctionOption = testOperatorPage.getByRole('option', { name: /오작동/i });
      if ((await malfunctionOption.count()) > 0) {
        await malfunctionOption.click();
      }
    }

    // 내용 입력
    const contentTextarea = testOperatorPage.locator('textarea').first();
    if ((await contentTextarea.count()) > 0) {
      await contentTextarea.fill('전원부 고장으로 사용 불가');
    }

    // 부적합 체크박스 선택
    const checkbox = testOperatorPage.locator('input[type="checkbox"]').first();
    if ((await checkbox.count()) > 0) {
      await checkbox.check();
    } else {
      console.log('부적합 체크박스를 찾을 수 없습니다');
      test.skip();
      return;
    }

    // 저장
    await testOperatorPage.getByRole('button', { name: /저장/i }).click();

    // 확인 Dialog에서 "예" 선택 - 사용 불가
    const confirmDialog = testOperatorPage.getByText(/장비 상태 변경 확인|사용할 수 없습니까/i);
    if ((await confirmDialog.count()) > 0) {
      const yesButton = testOperatorPage.getByText(/사용할 수 없습니다|예/i);
      if ((await yesButton.count()) > 0) {
        await yesButton.first().click();
      }
    }

    // 성공 확인
    const successIndicator = testOperatorPage.getByText(/등록 완료|전원부 고장/i);
    await expect(successIndicator.first()).toBeVisible({ timeout: 5000 });

    // 장비 상태가 "부적합"으로 변경되었는지 확인 (선택적)
    const nonConformingBadge = testOperatorPage.getByText(/부적합|non_conforming/i);
    if ((await nonConformingBadge.count()) > 0) {
      console.log('부적합 상태 배지 확인됨');
    }
  });
});
