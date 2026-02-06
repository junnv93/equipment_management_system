/**
 * 교정 기록 등록 및 승인 워크플로우 E2E 테스트
 *
 * 승인 흐름 (UL-QP-18):
 * 1. 시험실무자: 교정 기록 등록 (필수 항목 + 교정성적서 첨부)
 * 2. 기술책임자: 검토 및 승인/반려
 *
 * 승인 시:
 * - 교정 기록 확정
 * - 장비 교정일자 자동 업데이트 (lastCalibrationDate, nextCalibrationDate)
 *
 * 반려 시:
 * - 반려 사유와 함께 재등록 요청
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Calibration Registration and Approval Workflow', () => {
  // Chromium에서만 실행 (일관된 테스트 환경)
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test.describe('교정 기록 등록 폼 접근', () => {
    test('시험실무자는 장비 상세 페이지에서 교정 등록 버튼을 볼 수 있다', async ({
      testOperatorPage,
    }) => {
      // 장비 목록 페이지로 이동
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('domcontentloaded');

      // 첫 번째 장비의 링크에서 href 추출
      const firstEquipmentLink = testOperatorPage.locator('tr').nth(1).locator('a').first();
      if ((await firstEquipmentLink.count()) === 0) {
        console.log('테스트할 장비가 없습니다. 테스트 건너뛰기');
        test.skip();
        return;
      }

      const href = await firstEquipmentLink.getAttribute('href');
      if (!href) {
        test.skip();
        return;
      }

      // 교정 이력 탭으로 직접 이동 (URL 쿼리 파라미터 사용)
      await testOperatorPage.goto(`${href}?tab=calibration`);
      await testOperatorPage.waitForLoadState('domcontentloaded');
      // 탭 패널 동적 로딩 대기
      await expect(testOperatorPage.getByRole('heading', { name: /교정 이력/i })).toBeVisible({
        timeout: 15000,
      });

      // 탭 패널이 "교정 이력"으로 전환될 때까지 대기 (동적 로딩)
      await expect(testOperatorPage.getByRole('heading', { name: /교정 이력/i })).toBeVisible({
        timeout: 15000,
      });

      // 교정 등록 버튼 확인
      const registerButton = testOperatorPage.getByRole('button', { name: /교정 등록/i });
      await expect(registerButton).toBeVisible({ timeout: 10000 });
    });

    test('기술책임자도 장비 상세 페이지에서 교정 등록 버튼을 볼 수 있다', async ({
      techManagerPage,
    }) => {
      // 장비 목록 페이지로 이동
      await techManagerPage.goto('/equipment');
      await techManagerPage.waitForLoadState('domcontentloaded');

      // 첫 번째 장비의 링크에서 href 추출
      const firstEquipmentLink = techManagerPage.locator('tr').nth(1).locator('a').first();
      if ((await firstEquipmentLink.count()) === 0) {
        console.log('테스트할 장비가 없습니다. 테스트 건너뛰기');
        test.skip();
        return;
      }

      const href = await firstEquipmentLink.getAttribute('href');
      if (!href) {
        test.skip();
        return;
      }

      // 교정 이력 탭으로 직접 이동 (URL 쿼리 파라미터 사용)
      await techManagerPage.goto(`${href}?tab=calibration`);
      await techManagerPage.waitForLoadState('domcontentloaded');
      // 탭 패널 동적 로딩 대기
      await expect(techManagerPage.getByRole('heading', { name: /교정 이력/i })).toBeVisible({
        timeout: 15000,
      });

      // 교정 등록 버튼 확인
      const registerButton = techManagerPage.getByRole('button', { name: /교정 등록/i });
      await expect(registerButton).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('교정 등록 다이얼로그 필드 검증', () => {
    test('교정 등록 다이얼로그에 필수 필드가 표시된다', async ({ testOperatorPage }) => {
      // 장비 목록 페이지로 이동
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('domcontentloaded');

      // 첫 번째 장비의 링크에서 href 추출
      const firstEquipmentLink = testOperatorPage.locator('tr').nth(1).locator('a').first();
      if ((await firstEquipmentLink.count()) === 0) {
        test.skip();
        return;
      }

      const href = await firstEquipmentLink.getAttribute('href');
      if (!href) {
        test.skip();
        return;
      }

      // 교정 이력 탭으로 직접 이동
      await testOperatorPage.goto(`${href}?tab=calibration`);
      await testOperatorPage.waitForLoadState('domcontentloaded');
      // 탭 패널 동적 로딩 대기
      await expect(testOperatorPage.getByRole('heading', { name: /교정 이력/i })).toBeVisible({
        timeout: 15000,
      });

      // 교정 등록 버튼 클릭
      const registerButton = testOperatorPage.getByRole('button', { name: /교정 등록/i });
      if ((await registerButton.count()) === 0) {
        test.skip();
        return;
      }
      await registerButton.click();

      // 다이얼로그 확인
      await expect(testOperatorPage.getByRole('dialog')).toBeVisible();

      // 필수 필드 라벨 확인 (정확한 텍스트 매칭 또는 first() 사용)
      await expect(testOperatorPage.getByText('교정일 *', { exact: true })).toBeVisible();
      await expect(testOperatorPage.getByText('교정 주기', { exact: false }).first()).toBeVisible();
      await expect(testOperatorPage.getByText('다음 교정일 *', { exact: true })).toBeVisible();
      await expect(testOperatorPage.getByText('교정 기관 *', { exact: true })).toBeVisible();
      await expect(testOperatorPage.getByText('교정성적서 번호 *', { exact: true })).toBeVisible();
      await expect(testOperatorPage.getByText('교정 결과 *', { exact: true })).toBeVisible();
      await expect(testOperatorPage.getByText('교정성적서 파일 *', { exact: true })).toBeVisible();
    });

    test('교정 결과 선택 옵션에 SSOT 값이 표시된다', async ({ testOperatorPage }) => {
      // 장비 목록 페이지로 이동
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('domcontentloaded');

      // 첫 번째 장비의 링크에서 href 추출
      const firstEquipmentLink = testOperatorPage.locator('tr').nth(1).locator('a').first();
      if ((await firstEquipmentLink.count()) === 0) {
        test.skip();
        return;
      }

      const href = await firstEquipmentLink.getAttribute('href');
      if (!href) {
        test.skip();
        return;
      }

      // 교정 이력 탭으로 직접 이동
      await testOperatorPage.goto(`${href}?tab=calibration`);
      await testOperatorPage.waitForLoadState('domcontentloaded');
      // 탭 패널 동적 로딩 대기
      await expect(testOperatorPage.getByRole('heading', { name: /교정 이력/i })).toBeVisible({
        timeout: 15000,
      });

      // 교정 등록 버튼 클릭
      const registerButton = testOperatorPage.getByRole('button', { name: /교정 등록/i });
      if ((await registerButton.count()) === 0) {
        test.skip();
        return;
      }
      await registerButton.click();

      // 교정 결과 드롭다운 열기 (첫 번째 combobox 클릭)
      const resultSelect = testOperatorPage.getByRole('combobox').first();
      await resultSelect.click();

      // listbox가 나타날 때까지 대기
      const listbox = testOperatorPage.getByRole('listbox');
      await expect(listbox).toBeVisible({ timeout: 5000 });

      // SSOT 값 확인 (한글 라벨)
      // Radix UI Select는 포털로 렌더링되어 뷰포트 밖에 위치할 수 있으므로
      // toHaveCount()로 요소 존재 여부 확인
      const options = listbox.getByRole('option');
      await expect(options).toHaveCount(3);

      // 각 옵션 텍스트 확인 - 정규식으로 정확한 매칭 (^적합$)
      // '적합'이 '부적합', '조건부 적합'에도 포함되므로 정확한 매칭 필요
      await expect(options.filter({ hasText: /^적합$/ })).toHaveCount(1);
      await expect(options.filter({ hasText: /^부적합$/ })).toHaveCount(1);
      await expect(options.filter({ hasText: /^조건부 적합$/ })).toHaveCount(1);
    });
  });

  test.describe('승인 대기 목록 접근', () => {
    test('기술책임자는 교정 승인 대기 목록 페이지에 접근할 수 있다', async ({
      techManagerPage,
    }) => {
      await techManagerPage.goto('/admin/calibration-approvals');
      await techManagerPage.waitForLoadState('domcontentloaded');

      // 페이지 제목 확인
      await expect(techManagerPage.getByRole('heading', { name: /교정 승인/i })).toBeVisible();
    });

    test('시험소장도 교정 승인 대기 목록 페이지에 접근할 수 있다', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/admin/calibration-approvals');
      await siteAdminPage.waitForLoadState('domcontentloaded');

      // 페이지 제목 확인
      await expect(siteAdminPage.getByRole('heading', { name: /교정 승인/i })).toBeVisible();
    });
  });

  test.describe('승인/반려 버튼 표시', () => {
    test('기술책임자는 교정 승인 페이지에서 승인/반려 버튼 또는 빈 상태를 볼 수 있다', async ({
      techManagerPage,
    }) => {
      await techManagerPage.goto('/admin/calibration-approvals');
      await techManagerPage.waitForLoadState('domcontentloaded');

      // 페이지 제목 확인
      await expect(techManagerPage.getByRole('heading', { name: /교정 승인/i })).toBeVisible();

      // 승인 대기 항목이 있거나 빈 상태 메시지가 있어야 함
      // 빈 상태 메시지: "승인 대기 중인 교정 요청이 없습니다"
      const emptyMessage = techManagerPage.getByText(/승인 대기 중인 교정 요청이 없습니다/i);
      const approveButton = techManagerPage.getByRole('button', { name: /승인/i }).first();

      // 둘 중 하나는 표시되어야 함
      const hasEmpty = (await emptyMessage.count()) > 0;
      const hasApprove = (await approveButton.count()) > 0;

      if (hasEmpty) {
        await expect(emptyMessage).toBeVisible();
        console.log('빈 상태: 승인 대기 교정 요청 없음');
      } else if (hasApprove) {
        await expect(approveButton).toBeVisible();
        // 반려 버튼도 함께 표시되어야 함
        await expect(techManagerPage.getByRole('button', { name: /반려/i }).first()).toBeVisible();
        console.log('승인 대기 항목 발견: 승인/반려 버튼 표시됨');
      } else {
        // 로딩 상태일 수 있으므로 조금 더 대기
        await techManagerPage.waitForTimeout(2000);
        await expect(
          techManagerPage.locator('text=승인 대기 중인 교정 요청이 없습니다').or(approveButton)
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('다이얼로그 동작', () => {
    test('교정 등록 다이얼로그에서 취소하면 닫힌다', async ({ testOperatorPage }) => {
      // 장비 목록 페이지로 이동
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('domcontentloaded');

      // 첫 번째 장비의 링크에서 href 추출
      const firstEquipmentLink = testOperatorPage.locator('tr').nth(1).locator('a').first();
      if ((await firstEquipmentLink.count()) === 0) {
        test.skip();
        return;
      }

      const href = await firstEquipmentLink.getAttribute('href');
      if (!href) {
        test.skip();
        return;
      }

      // 교정 이력 탭으로 직접 이동
      await testOperatorPage.goto(`${href}?tab=calibration`);
      await testOperatorPage.waitForLoadState('domcontentloaded');
      // 탭 패널 동적 로딩 대기
      await expect(testOperatorPage.getByRole('heading', { name: /교정 이력/i })).toBeVisible({
        timeout: 15000,
      });

      // 교정 등록 버튼 클릭
      const registerButton = testOperatorPage.getByRole('button', { name: /교정 등록/i });
      if ((await registerButton.count()) === 0) {
        test.skip();
        return;
      }
      await registerButton.click();

      // 다이얼로그 확인
      const dialog = testOperatorPage.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 다이얼로그 내의 취소 버튼 클릭 (evaluate로 직접 클릭)
      const cancelButton = dialog.getByRole('button', { name: /취소/i });
      await cancelButton.evaluate((el) => (el as HTMLButtonElement).click());

      // 다이얼로그가 닫혔는지 확인
      await expect(dialog).not.toBeVisible();
    });

    test('필수 필드 미입력 시 제출 버튼이 비활성화되거나 유효성 오류가 표시된다', async ({
      testOperatorPage,
    }) => {
      // 장비 목록 페이지로 이동
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('domcontentloaded');

      // 첫 번째 장비의 링크에서 href 추출
      const firstEquipmentLink = testOperatorPage.locator('tr').nth(1).locator('a').first();
      if ((await firstEquipmentLink.count()) === 0) {
        test.skip();
        return;
      }

      const href = await firstEquipmentLink.getAttribute('href');
      if (!href) {
        test.skip();
        return;
      }

      // 교정 이력 탭으로 직접 이동
      await testOperatorPage.goto(`${href}?tab=calibration`);
      await testOperatorPage.waitForLoadState('domcontentloaded');
      // 탭 패널 동적 로딩 대기
      await expect(testOperatorPage.getByRole('heading', { name: /교정 이력/i })).toBeVisible({
        timeout: 15000,
      });

      // 교정 등록 버튼 클릭
      const registerButton = testOperatorPage.getByRole('button', { name: /교정 등록/i });
      if ((await registerButton.count()) === 0) {
        test.skip();
        return;
      }
      await registerButton.click();

      // 다이얼로그 확인
      const dialog = testOperatorPage.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 다이얼로그 내의 제출 버튼 클릭 시도 (evaluate로 직접 클릭)
      const submitButton = dialog.getByRole('button', { name: /등록.*승인|승인.*요청/i });
      await submitButton.evaluate((el) => (el as HTMLButtonElement).click());

      // 유효성 검증 오류 메시지 확인 (교정 기관 또는 교정성적서 번호 필수)
      await expect(
        dialog.getByText(/교정 기관|교정성적서 번호|입력하세요|필수/i).first()
      ).toBeVisible();
    });
  });

  test.describe('파일 업로드 필드', () => {
    test('교정성적서 파일 필드가 표시되고 파일 선택이 가능하다', async ({ testOperatorPage }) => {
      // 장비 목록 페이지로 이동
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('domcontentloaded');

      // 첫 번째 장비의 링크에서 href 추출
      const firstEquipmentLink = testOperatorPage.locator('tr').nth(1).locator('a').first();
      if ((await firstEquipmentLink.count()) === 0) {
        test.skip();
        return;
      }

      const href = await firstEquipmentLink.getAttribute('href');
      if (!href) {
        test.skip();
        return;
      }

      // 교정 이력 탭으로 직접 이동
      await testOperatorPage.goto(`${href}?tab=calibration`);
      await testOperatorPage.waitForLoadState('domcontentloaded');
      // 탭 패널 동적 로딩 대기
      await expect(testOperatorPage.getByRole('heading', { name: /교정 이력/i })).toBeVisible({
        timeout: 15000,
      });

      // 교정 등록 버튼 클릭
      const registerButton = testOperatorPage.getByRole('button', { name: /교정 등록/i });
      if ((await registerButton.count()) === 0) {
        test.skip();
        return;
      }
      await registerButton.click();

      // 파일 입력 필드 확인
      const fileInput = testOperatorPage.locator('input[type="file"]');
      await expect(fileInput).toBeVisible();

      // accept 속성 확인 (PDF, 이미지 허용)
      const acceptAttr = await fileInput.getAttribute('accept');
      expect(acceptAttr).toContain('.pdf');
    });

    test('파일 미첨부 시 경고 메시지가 표시된다', async ({ testOperatorPage }) => {
      // 장비 목록 페이지로 이동
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('domcontentloaded');

      // 첫 번째 장비의 링크에서 href 추출
      const firstEquipmentLink = testOperatorPage.locator('tr').nth(1).locator('a').first();
      if ((await firstEquipmentLink.count()) === 0) {
        test.skip();
        return;
      }

      const href = await firstEquipmentLink.getAttribute('href');
      if (!href) {
        test.skip();
        return;
      }

      // 교정 이력 탭으로 직접 이동
      await testOperatorPage.goto(`${href}?tab=calibration`);
      await testOperatorPage.waitForLoadState('domcontentloaded');
      // 탭 패널 동적 로딩 대기
      await expect(testOperatorPage.getByRole('heading', { name: /교정 이력/i })).toBeVisible({
        timeout: 15000,
      });

      // 교정 등록 버튼 클릭
      const registerButton = testOperatorPage.getByRole('button', { name: /교정 등록/i });
      if ((await registerButton.count()) === 0) {
        test.skip();
        return;
      }
      await registerButton.click();

      // 파일 미첨부 경고 메시지 확인
      await expect(testOperatorPage.getByText(/교정성적서 파일을 첨부해주세요/i)).toBeVisible();
    });
  });

  test.describe('교정 이력 테이블', () => {
    test('교정 이력 탭에서 테이블 또는 빈 상태 메시지가 표시된다', async ({ testOperatorPage }) => {
      // 장비 목록 페이지로 이동
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('domcontentloaded');

      // 첫 번째 장비의 링크에서 href 추출
      const firstEquipmentLink = testOperatorPage.locator('tr').nth(1).locator('a').first();
      if ((await firstEquipmentLink.count()) === 0) {
        test.skip();
        return;
      }

      const href = await firstEquipmentLink.getAttribute('href');
      if (!href) {
        test.skip();
        return;
      }

      // 교정 이력 탭으로 직접 이동
      await testOperatorPage.goto(`${href}?tab=calibration`);
      await testOperatorPage.waitForLoadState('domcontentloaded');
      // 탭 패널 동적 로딩 대기
      await expect(testOperatorPage.getByRole('heading', { name: /교정 이력/i })).toBeVisible({
        timeout: 15000,
      });

      // 테이블 또는 빈 상태 메시지 중 하나가 표시될 때까지 대기
      // 교정 이력이 있는 경우: 테이블 (교정일 컬럼)이 표시됨
      // 교정 이력이 없는 경우: 빈 상태 메시지가 표시됨
      const tableOrEmpty = testOperatorPage
        .locator('table, :text("등록된 교정 이력이 없습니다"), :text("교정 이력이 없습니다")')
        .first();

      await expect(tableOrEmpty).toBeVisible({ timeout: 10000 });
    });
  });
});
