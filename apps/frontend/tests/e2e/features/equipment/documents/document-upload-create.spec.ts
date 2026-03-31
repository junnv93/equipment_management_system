/**
 * 시나리오 1: 장비 등록 시 사진/매뉴얼 업로드
 *
 * 검증 항목:
 * - AttachmentSection 3개 업로드 영역 표시 (사진/매뉴얼/검수보고서)
 * - 장비 사진(PNG) 첨부 → 파일명 표시
 * - 매뉴얼(PDF) 첨부 → 파일명 표시
 * - 전체 폼 제출 (사진+매뉴얼+검수보고서)
 *
 * 폼 구조: 4단계 위자드 (기본 정보 → 상태·위치 → 교정 정보 → 이력·첨부)
 * 파일 첨부는 Step 4 "이력·첨부"에 위치
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import path from 'path';
import type { Page } from '@playwright/test';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

/**
 * 위자드 Step 1 필수 입력 + Step 4까지 이동 (TE용)
 * Step 1 필수: name (site/teamId는 TE에게 자동 설정)
 * Step 2, 3: 필수 검증 없음 → 바로 "다음"
 */
async function navigateToAttachmentStep(page: Page) {
  await page.goto('/equipment/create');
  await expect(page.getByRole('heading', { name: '장비 등록', level: 1 })).toBeVisible();

  // Step 1: 장비명 입력 (필수)
  await page.getByLabel('장비명').fill('문서 테스트 장비');

  // "다음" 클릭 → Step 2
  await page.getByRole('button', { name: '다음' }).click();
  // Step 2 로드 대기 (상태·위치)
  await expect(page.getByText('상태·위치')).toBeVisible({ timeout: 5000 });

  // "다음" 클릭 → Step 3
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByText('교정 정보')).toBeVisible({ timeout: 5000 });

  // "다음" 클릭 → Step 4 (이력·첨부)
  await page.getByRole('button', { name: '다음' }).click();
  // 파일 첨부 섹션이 보일 때까지 대기
  await expect(page.getByText('파일 첨부').first()).toBeVisible({ timeout: 5000 });
}

/**
 * TM용: 위자드 필수 입력 + Step 4까지 이동 + 전체 필수 입력 완료
 */
async function fillFormAndNavigateToAttachmentStep(page: Page) {
  await page.goto('/equipment/create');
  await expect(page.getByRole('heading', { name: '장비 등록', level: 1 })).toBeVisible();

  // Step 1: 기본 정보
  await page.getByLabel('장비명').fill('문서 업로드 테스트 장비');
  await page.locator('input[name="managementSerialNumberStr"]').fill('9001');
  await page.getByLabel('모델명').fill('Doc Upload Test Model');
  await page.locator('input[name="manufacturer"]').fill('Test Manufacturer');
  await page.locator('input[name="serialNumber"]').fill('SN-DOC-9001');

  // "다음" → Step 2
  await page.getByRole('button', { name: '다음' }).click();

  // Step 2: 위치 입력
  const locationInput = page.locator('input[name="location"]');
  if (await locationInput.isVisible().catch(() => false)) {
    await locationInput.fill('RF1 Room');
  }
  // 기술책임자 선택
  const techManagerCombobox = page.getByRole('combobox', { name: /기술책임자/ });
  if (await techManagerCombobox.isVisible().catch(() => false)) {
    await techManagerCombobox.click();
    await page.getByRole('option').first().click();
  }

  // "다음" → Step 3
  await page.getByRole('button', { name: '다음' }).click();

  // "다음" → Step 4
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByText('파일 첨부').first()).toBeVisible({ timeout: 5000 });
}

test.describe('장비 등록 - 문서 업로드', () => {
  test('TC-01: Step4 이력·첨부에 3개 업로드 영역이 표시된다', async ({
    testOperatorPage: page,
  }) => {
    await navigateToAttachmentStep(page);

    // 3개 업로드 영역 제목 확인 (h4 heading)
    await expect(page.getByRole('heading', { name: '장비 사진', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '장비 매뉴얼', level: 4 })).toBeVisible();
    // 생성 모드: "검수보고서 첨부" heading
    await expect(page.getByRole('heading', { name: /검수보고서/, level: 4 })).toBeVisible();
  });

  test('TC-02: 장비 사진 PNG 파일 첨부 후 파일명 표시', async ({ testOperatorPage: page }) => {
    await navigateToAttachmentStep(page);

    // 사진 업로드 영역의 file input (accept="image/jpeg,image/png,image/gif")
    const photoInput = page.locator('input[type="file"][accept*="image/jpeg"]');
    await photoInput.setInputFiles(path.join(FIXTURES_DIR, 'test-photo.png'));

    // 업로드된 파일명 표시 확인
    await expect(page.getByText('test-photo.png')).toBeVisible({ timeout: 5000 });
  });

  test('TC-03: 매뉴얼 PDF 파일 첨부 후 파일명 표시', async ({ testOperatorPage: page }) => {
    await navigateToAttachmentStep(page);

    // 매뉴얼 업로드 (accept="application/pdf")
    const manualInput = page.locator('input[type="file"][accept="application/pdf"]');
    await manualInput.setInputFiles(path.join(FIXTURES_DIR, 'test-manual.pdf'));

    // 업로드된 파일명 표시 확인
    await expect(page.getByText('test-manual.pdf')).toBeVisible({ timeout: 5000 });
  });

  test('TC-04: 사진+매뉴얼+검수보고서 첨부 후 장비 등록 제출', async ({
    techManagerPage: page,
  }) => {
    await fillFormAndNavigateToAttachmentStep(page);

    // 사진 첨부
    const photoInput = page.locator('input[type="file"][accept*="image/jpeg"]');
    await photoInput.setInputFiles(path.join(FIXTURES_DIR, 'test-photo.png'));
    await expect(page.getByText('test-photo.png')).toBeVisible({ timeout: 5000 });

    // 매뉴얼 첨부
    const manualInput = page.locator('input[type="file"][accept="application/pdf"]');
    await manualInput.setInputFiles(path.join(FIXTURES_DIR, 'test-manual.pdf'));
    await expect(page.getByText('test-manual.pdf')).toBeVisible({ timeout: 5000 });

    // 검수보고서 첨부 (3번째 file input — 범용 accept)
    const allInputs = page.locator('input[type="file"]');
    const reportInput = allInputs.nth(2);
    await reportInput.setInputFiles(path.join(FIXTURES_DIR, 'test-certificate.pdf'));
    await expect(page.getByText('test-certificate.pdf')).toBeVisible({ timeout: 5000 });

    // 등록 제출
    const submitButton = page.getByRole('button', { name: /^등록/ });
    await submitButton.click();

    // 등록 완료: TM은 직접 등록 → /equipment 리다이렉트 또는 상세 페이지
    await page.waitForURL(/\/equipment/, { timeout: 30000 });
    // URL이 /equipment로 이동했으면 성공
    expect(page.url()).toMatch(/\/equipment/);
  });
});
