import { test } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

// 수동 디버그 전용 — inspection-form-unified.spec.ts가 자동화 커버리지 담당
// CI에서 실행하려면 page.pause() 제거 후 test.skip 해제
test.skip('seed 장비로 점검폼 시각 확인 (수동 디버그)', async ({ testOperatorPage }) => {
  await testOperatorPage.goto(`/equipment/${EQUIPMENT_ID}?tab=inspection`);

  const btn = testOperatorPage.getByRole('button', { name: /점검 기록 작성/ });
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click();

  const dialog = testOperatorPage.getByRole('dialog');
  await dialog.waitFor({ state: 'visible', timeout: 5000 });

  // 브라우저에서 직접 확인하려면 아래 주석 해제:
  // await testOperatorPage.pause();
});
