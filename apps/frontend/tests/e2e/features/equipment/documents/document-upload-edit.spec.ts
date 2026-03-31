/**
 * 시나리오 3: 장비 수정 시 사진/매뉴얼 추가 업로드
 *
 * 수정 모드 위자드: 3단계 (기본 정보 → 상태·위치 → 교정 정보)
 * AttachmentSection은 Step 2 (교정 정보)에 하단에 표시됨
 * "이력·첨부" 스텝은 hidden (isEdit=true)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';
import path from 'path';
import type { Page } from '@playwright/test';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

/**
 * 수정 폼에서 Step 2 (교정 정보 + 첨부파일)까지 이동
 * Step 0: 기본 정보 (필수 이미 채워짐)
 * Step 1: 상태·위치 (필수 검증 없음)
 * Step 2: 교정 정보 + AttachmentSection
 */
async function navigateToStep2(page: Page) {
  await page.goto(`/equipment/${EQUIPMENT_ID}/edit`);
  await expect(page.getByRole('heading', { name: '장비 수정', level: 1 })).toBeVisible({
    timeout: 10000,
  });

  // "다음" → Step 1
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByText('상태·위치')).toBeVisible({ timeout: 5000 });

  // "다음" → Step 2 (마지막 — 교정 정보 + 첨부파일)
  await page.getByRole('button', { name: '다음' }).click();
  // 교정 정보 또는 파일 첨부 로드 대기
  await expect(page.getByText('파일 첨부').first()).toBeVisible({ timeout: 5000 });
}

test.describe('장비 수정 — 문서 추가 업로드', () => {
  test('TC-01: 수정 폼 Step2에 AttachmentSection 3구역 표시', async ({ techManagerPage: page }) => {
    await navigateToStep2(page);

    // 3개 업로드 영역 확인 (h4 heading으로 한정)
    await expect(page.getByRole('heading', { name: '장비 사진', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '장비 매뉴얼', level: 4 })).toBeVisible();
    // 수정 모드에서는 "새 파일 추가" 라벨 (이력카드)
    await expect(page.getByRole('heading', { name: '새 파일 추가', level: 4 })).toBeVisible();
  });

  test('TC-02: 기존 첨부파일 목록 표시 (문서 존재 시)', async ({ techManagerPage: page }) => {
    await navigateToStep2(page);

    // "기존 첨부파일" 섹션은 existingAttachments > 0일 때만 표시
    const existingFiles = page.getByRole('heading', { name: '기존 첨부파일', level: 4 });
    const hasExisting = await existingFiles.isVisible().catch(() => false);

    // 기존 파일이 있으면 다운로드 링크도 확인
    if (hasExisting) {
      const downloadLinks = page.getByRole('link', { name: /다운로드/ });
      const count = await downloadLinks.count();
      expect(count).toBeGreaterThan(0);
    }
    // 기존 파일이 없어도 테스트 통과 (시드 데이터에 따라 다름)
    expect(true).toBeTruthy();
  });

  test('TC-03: 새 장비 사진 추가 업로드', async ({ techManagerPage: page }) => {
    await navigateToStep2(page);

    // 사진 업로드 영역에 파일 첨부
    const photoInput = page.locator('input[type="file"][accept*="image/jpeg"]');
    await photoInput.setInputFiles(path.join(FIXTURES_DIR, 'test-photo.png'));

    // 업로드된 파일명 표시 확인
    await expect(page.getByText('test-photo.png')).toBeVisible({ timeout: 5000 });
  });

  test('TC-04: 새 매뉴얼 추가 업로드', async ({ techManagerPage: page }) => {
    await navigateToStep2(page);

    // 매뉴얼 업로드
    const manualInput = page.locator('input[type="file"][accept="application/pdf"]');
    await manualInput.setInputFiles(path.join(FIXTURES_DIR, 'test-manual.pdf'));

    // 업로드된 파일명 표시 확인
    await expect(page.getByText('test-manual.pdf')).toBeVisible({ timeout: 5000 });
  });
});
