/**
 * 양식 관리 E2E 테스트 (PR #157 신규 API 계약)
 *
 * UL-QP-03 §7.5 개정관리: 양식명(formName)이 SSOT, formNumber는 개정 시점의 한 값.
 * - POST /api/form-templates : 최초/개정 통합 등록
 * - GET  /api/form-templates/:id/download : row UUID 기준 다운로드
 * - GET  /api/form-templates/history?formName=... : 양식명 기준 이력
 *
 * Serial 실행 — 업로드(TC-02)가 다운로드(TC-03)/이력(TC-05)보다 먼저.
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';
import { getBackendToken } from '../../shared/helpers/api-helpers';
import { BASE_URLS } from '../../shared/constants/shared-test-data';

const BACKEND_URL = BASE_URLS.BACKEND;
const TEST_FORM_NAME = '자체 점검표';
const TEST_FORM_NUMBER = 'UL-QP-18-05';

interface FormListItem {
  formName: string;
  initialFormNumber: string;
  current: { id: string; formNumber: string } | null;
}

interface HistoryItem {
  id: string;
  version: number;
  isCurrent: boolean;
  formNumber: string;
}

function buildMinimalDocx(): Buffer {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PizZip = require('pizzip');
  const zip = new PizZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
  );
  zip.file(
    'word/document.xml',
    '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>test</w:t></w:r></w:p></w:body></w:document>'
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
  );
  return Buffer.from(zip.generate({ type: 'nodebuffer' }));
}

test.describe('양식 관리 (Form Templates)', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC-01: 양식 목록 조회 → 응답 성공', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(`${BACKEND_URL}/api/form-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const data = (body.data ?? body) as FormListItem[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].formName).toBeTruthy();
    expect(data[0].initialFormNumber).toBeTruthy();
  });

  test('TC-02: TM이 양식 업로드(개정 등록) → 성공', async ({ techManagerPage: page }) => {
    const token = await getBackendToken(page, 'technical_manager');

    const uploadResp = await page.request.post(`${BACKEND_URL}/api/form-templates`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        formName: TEST_FORM_NAME,
        formNumber: TEST_FORM_NUMBER,
        changeSummary: 'E2E 테스트 등록/개정',
        file: {
          name: `${TEST_FORM_NUMBER}_test.docx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: buildMinimalDocx(),
        },
      },
    });

    expect(uploadResp.status()).toBe(201);
    const uploadData = await uploadResp.json();
    const uploaded = uploadData.data ?? uploadData;
    expect(uploaded.formNumber).toBe(TEST_FORM_NUMBER);
    expect(uploaded.isCurrent).toBe(true);
    expect(uploaded.id).toBeTruthy();
  });

  test('TC-03: 활성 템플릿 다운로드 → 200 + 바이너리', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    // 새 계약: row UUID로 다운로드 → list에서 current.id 조회 필요
    const listResp = await page.request.get(`${BACKEND_URL}/api/form-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listBody = await listResp.json();
    const items = (listBody.data ?? listBody) as FormListItem[];
    const target = items.find((it) => it.formName === TEST_FORM_NAME);
    expect(target?.current?.id, '자체 점검표 현행 템플릿이 등록되어 있어야 함').toBeTruthy();

    const resp = await page.request.get(
      `${BACKEND_URL}/api/form-templates/${target!.current!.id}/download`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(200);
    const body = await resp.body();
    expect(body.length).toBeGreaterThan(100);
  });

  test('TC-04: TE는 업로드 불가 → 403', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const uploadResp = await page.request.post(`${BACKEND_URL}/api/form-templates`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        formName: TEST_FORM_NAME,
        formNumber: TEST_FORM_NUMBER,
        changeSummary: 'TE 업로드 시도',
        file: {
          name: 'test.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: buildMinimalDocx(),
        },
      },
    });

    expect(uploadResp.status()).toBe(403);
  });

  test('TC-05: 양식명 기준 개정 이력 조회 → 활성 버전 1개', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(
      `${BACKEND_URL}/api/form-templates/history?formName=${encodeURIComponent(TEST_FORM_NAME)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const data = (body.data ?? body) as HistoryItem[];
    expect(data.length).toBeGreaterThanOrEqual(1);

    const currentCount = data.filter((d) => d.isCurrent).length;
    expect(currentCount).toBe(1);
  });
});
