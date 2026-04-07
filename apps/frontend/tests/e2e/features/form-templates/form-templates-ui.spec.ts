/**
 * 양식 관리 UI Smoke Test (PR #157 — UL-QP-03 compliance)
 *
 * 검증 대상:
 *  - 페이지 로드 + 헤더/통계 strip
 *  - 카테고리 메타데이터 배지 (PR #157 신규)
 *  - 과거 번호 검색 바 (PR #157 신규)
 *  - 개정 이력 다이얼로그
 *  - 업로드 다이얼로그 + 개정 사유(changeSummary) 필드 (PR #157 신규)
 *
 * Note: 기존 form-templates.spec.ts는 100% API-level. 이 파일은 UI-level만 담당.
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';
import { getBackendToken } from '../../shared/helpers/api-helpers';
import { BASE_URLS } from '../../shared/constants/shared-test-data';

const BACKEND_URL = BASE_URLS.BACKEND;
const SEED_FORM_NAME = '자체 점검표';
const SEED_FORM_NUMBER = 'UL-QP-18-05';

/**
 * 최소 valid docx (PizZip)
 */
function createMinimalDocxBuffer(): Buffer {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PizZip = require('pizzip');
  const zip = new PizZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
  );
  zip.file(
    'word/document.xml',
    '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>seed</w:t></w:r></w:p></w:body></w:document>'
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
  );
  return Buffer.from(zip.generate({ type: 'nodebuffer' }));
}

test.describe('양식 관리 UI Smoke (PR #157)', () => {
  // 개정 등록 버튼이 보이려면 최소 1개 양식이 등록되어 있어야 함 → API로 시드.
  // 절차서상 고유한 formNumber(UL-QP-18-05)를 유지해야 dev DB에 잔재가 쌓이지 않음.
  // 전략: 먼저 POST /replace 시도(현행 row 파일만 교체) → 현행 row가 없으면 POST 로 최초 생성.
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      const token = await getBackendToken(page, 'technical_manager');
      const fileBuffer = createMinimalDocxBuffer();
      const fileField = {
        name: `${SEED_FORM_NUMBER}_seed.docx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: fileBuffer,
      };

      // 멀티워커 race 대응: replace→404→create 경로에서 두 워커가 동시에 create를 호출하면
      // unique constraint(formNumber) 위반(409)이 발생할 수 있다.
      // 전략: replace 우선 → 404면 create → create가 conflict면 다른 워커가 끝낸 것이므로 replace 재시도.
      const tryReplace = () =>
        page.request.post(`${BACKEND_URL}/api/form-templates/replace`, {
          headers: { Authorization: `Bearer ${token}` },
          multipart: { formName: SEED_FORM_NAME, file: fileField },
        });

      // 1) 동일 formNumber 파일 교체 시도 — 현행 row가 있으면 성공
      const replaceResp = await tryReplace();
      if (replaceResp.ok()) return;
      if (replaceResp.status() !== 404) {
        const body = await replaceResp.text();
        throw new Error(`form-template replace failed: ${replaceResp.status()} ${body}`);
      }

      // 2) 현행 row가 없으면 최초 생성
      const createResp = await page.request.post(`${BACKEND_URL}/api/form-templates`, {
        headers: { Authorization: `Bearer ${token}` },
        multipart: {
          formName: SEED_FORM_NAME,
          formNumber: SEED_FORM_NUMBER,
          changeSummary: 'UI smoke test seed (자동 생성)',
          file: fileField,
        },
      });
      if (createResp.ok()) return;

      // 3) 다른 워커가 먼저 생성한 경우(409 Conflict) → replace로 폴백
      if (createResp.status() === 409) {
        const retryResp = await tryReplace();
        if (retryResp.ok()) return;
        const body = await retryResp.text();
        throw new Error(`form-template seed retry-replace failed: ${retryResp.status()} ${body}`);
      }

      const body = await createResp.text();
      throw new Error(`form-template seed failed: ${createResp.status()} ${body}`);
    } finally {
      await ctx.close();
    }
  });

  test('TC-UI-01: 페이지 로드 → 헤더 + 통계 strip 표시 (TE)', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/form-templates');
    await expect(page.getByRole('heading', { name: '양식 관리', level: 1 })).toBeVisible();

    // 통계 카드 3개 (전체 / 등록 완료 / 미등록)
    await expect(page.getByText('전체 양식')).toBeVisible();
    await expect(page.getByText('등록 완료')).toBeVisible();
    await expect(page.getByText('미등록').first()).toBeVisible();
  });

  test('TC-UI-02: 테이블 + 카테고리 배지 표시 (PR #157 메타데이터)', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/form-templates');
    await expect(page.getByRole('heading', { name: '양식 관리', level: 1 })).toBeVisible();

    // 테이블 헤더
    await expect(page.getByRole('columnheader', { name: '양식명' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '현행 번호' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '보존연한' })).toBeVisible();

    // 카테고리 배지 (품질 양식 또는 기술 양식 중 최소 1개 존재)
    const qualityBadge = page.getByText('품질 양식').first();
    const technicalBadge = page.getByText('기술 양식').first();
    await expect(qualityBadge.or(technicalBadge)).toBeVisible();

    // 권장 관리 메타 (recommendedManager.*)
    const recommendedHint = page.getByText(/권장 관리:/).first();
    await expect(recommendedHint).toBeVisible();
  });

  test('TC-UI-03: 과거 번호 검색 → 미존재 번호 noResult (PR #157 검색바)', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/form-templates');
    await expect(page.getByRole('heading', { name: '양식 관리', level: 1 })).toBeVisible();

    const searchInput = page.getByPlaceholder(/과거 양식 번호로 검색/);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('UL-QP-99-99-NONEXISTENT');
    // 헤더 글로벌 검색(aria-label="검색")과 충돌 방지 → Enter 키로 제출
    await searchInput.press('Enter');

    await expect(page.getByText('해당 번호의 양식을 찾을 수 없습니다.')).toBeVisible();
  });

  test('TC-UI-04: 개정 이력 다이얼로그 열기 (TE)', async ({ testOperatorPage: page }) => {
    await page.goto('/form-templates');
    await expect(page.getByRole('heading', { name: '양식 관리', level: 1 })).toBeVisible();

    // 첫 번째 row의 "개정 이력" 버튼 클릭
    // Mobile Chrome viewport에서 sticky header가 상단 row를 가려 pointer event를 가로채므로
    // scrollIntoView({block: 'center'})로 화면 중앙에 배치한 뒤 클릭
    const historyBtn = page.getByRole('button', { name: /개정 이력/ }).first();
    await historyBtn.scrollIntoViewIfNeeded();
    await historyBtn.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await historyBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '개정 이력' })).toBeVisible();
  });

  test('TC-UI-06: 활성/아카이브 탭 토글 + URL ?view=archived SSOT', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/form-templates');
    await expect(page.getByRole('heading', { name: '양식 관리', level: 1 })).toBeVisible();

    // 기본은 활성 탭 — URL에 ?view= 없음
    await expect(page).toHaveURL(/\/form-templates(\?(?!view=).*)?$/);
    await expect(page.getByRole('tab', { name: /활성 양식/ })).toHaveAttribute(
      'data-state',
      'active'
    );

    // 아카이브 탭 클릭 → URL 변경 + 탭 활성 + 설명 노출 또는 빈 상태
    await page.getByRole('tab', { name: /보존연한 만료/ }).click();
    await expect(page).toHaveURL(/\?view=archived/);
    await expect(page.getByRole('tab', { name: /보존연한 만료/ })).toHaveAttribute(
      'data-state',
      'active'
    );
    // 빈 상태 또는 데이터 — 둘 중 하나는 반드시 표시
    const emptyMsg = page.getByText('아카이브된 양식이 없습니다.');
    const desc = page.getByText(/보존연한이 경과하여 자동 아카이브된 양식/);
    await expect(emptyMsg.or(desc)).toBeVisible();

    // 활성 탭으로 복귀 → URL 파라미터 제거
    await page.getByRole('tab', { name: /활성 양식/ }).click();
    await expect(page).not.toHaveURL(/\?view=archived/);
  });

  test('TC-UI-07: ?view=archived 딥링크 직접 진입 시 아카이브 탭 활성', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/form-templates?view=archived');
    await expect(page.getByRole('heading', { name: '양식 관리', level: 1 })).toBeVisible();
    await expect(page.getByRole('tab', { name: /보존연한 만료/ })).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  test('TC-UI-05: TM 업로드 다이얼로그 → 개정 사유 필드 존재 (PR #157)', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/form-templates');
    await expect(page.getByRole('heading', { name: '양식 관리', level: 1 })).toBeVisible();

    // changeSummary 필드는 "개정 등록" 모드(기존 현행 row 존재)에서만 표시됨.
    // 이미 등록된 양식의 "개정 등록" 버튼만 사용.
    const reviseBtn = page.getByRole('button', { name: /개정 등록/ }).first();
    await expect(reviseBtn).toBeVisible();
    // Mobile Chrome sticky header 가로채기 회피 (TC-UI-04와 동일)
    await reviseBtn.scrollIntoViewIfNeeded();
    await reviseBtn.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await reviseBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // PR #157 핵심: changeSummary (개정 사유) 필드 — UL-QP-03 §7.5
    await expect(dialog.getByLabel('개정 사유')).toBeVisible();
    await expect(dialog.getByText(/UL-QP-03 §7.5/)).toBeVisible();
    await expect(dialog.getByLabel('새 양식 번호')).toBeVisible();
  });
});
