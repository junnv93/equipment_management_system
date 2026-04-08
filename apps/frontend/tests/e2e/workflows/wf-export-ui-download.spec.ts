/**
 * WF-Export-UI: 양식 export 사용자 클릭 동선 가드 (UL-QP-18-NN)
 *
 * 기존 wf-19b/20b 가 `page.request.get` API 직접 호출만 검증하는 것과 보완 관계.
 * 본 spec 은 `expectFileDownload` SSOT helper 위에 구축되어 사용자 시점의 회귀를 잡는다:
 *
 *   1. 권한 가드 (Permission.EXPORT_REPORTS) 가 실제로 버튼 노출을 게이팅하는가
 *   2. 클릭 → blob URL `<a download>` 트리거 → Playwright `download` 이벤트 발화
 *   3. 서버 Content-Disposition `filename*=UTF-8''...` 가 한국어/슬러그 파일명 보존
 *   4. .docx / .xlsx 확장자 유효성
 *
 * 새 양식 export 버튼이 추가될 때마다 본 describe 블록에 한 케이스만 추가하면
 * helper 가 동일 가드를 자동 적용한다 — 도메인별 spec 복제 필요 없음.
 *
 * 커버 양식 (현재):
 *   - UL-QP-18-01: 장비 관리대장 (`EquipmentPageHeader`)
 *   - UL-QP-18-07: 시험용 SW 관리대장 (`TestSoftwareListContent`)
 *   - UL-QP-18-08: 케이블 관리대장 (`CableListContent` — 기존 wf-21-cable-ui 와 중복 허용,
 *     SSOT helper 회귀 가드)
 *
 * 미커버 (UI 진입점 부재):
 *   - UL-QP-18-03 / 05 / 06 / 10 — 양식이 UI 클릭 동선 없이 백엔드 직접 호출만 노출.
 *     향후 UI 추가 시 본 spec 에 케이스 추가.
 *
 * @see apps/frontend/tests/e2e/shared/helpers/download-helpers.ts (SSOT helper)
 * @see .claude/exec-plans/tech-debt-tracker.md L21
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { expectFileDownload } from '../shared/helpers/download-helpers';

test.describe('WF-Export-UI: 양식 export 사용자 클릭 동선', () => {
  test.describe.configure({ mode: 'parallel' });

  test('QP-18-01 장비 관리대장 — testEngineer 클릭 → docx 다운로드 + 파일명 가드', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/equipment');
    // 헤더 렌더 대기 — 권한 게이팅된 export 버튼이 hydrate 되어야 함
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const exportButton = page.getByRole('button', { name: '관리대장 내보내기' });
    await expect(exportButton).toBeVisible();

    const download = await expectFileDownload(page, async () => {
      await exportButton.click();
    });

    // SSOT: 서버 Content-Disposition 헤더가 파일명 결정.
    // mojibake (e.g. "ìž¥ë¹„") 회귀를 잡기 위해 슬러그 + 확장자 동시 매칭.
    expect(download.suggestedFilename()).toMatch(/UL-QP-18-01.*\.(docx|xlsx)$/);
  });

  test('QP-18-07 시험용 SW 관리대장 — testEngineer 클릭 → 다운로드 + 파일명 가드', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/software');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const exportButton = page.getByRole('button', { name: '관리대장 내보내기' });
    await expect(exportButton).toBeVisible();

    const download = await expectFileDownload(page, async () => {
      await exportButton.click();
    });

    expect(download.suggestedFilename()).toMatch(/UL-QP-18-07.*\.(docx|xlsx)$/);
  });

  test('QP-18-08 케이블 관리대장 — testEngineer 클릭 → 다운로드 + 파일명 가드', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/cables');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const exportButton = page.getByRole('button', { name: '양식 내보내기' });
    await expect(exportButton).toBeVisible();

    const download = await expectFileDownload(page, async () => {
      await exportButton.click();
    });

    expect(download.suggestedFilename()).toMatch(/UL-QP-18-08.*\.(docx|xlsx)$/);
  });
});
