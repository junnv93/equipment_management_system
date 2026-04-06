/**
 * 양식 관리 E2E 테스트
 *
 * 양식 목록 조회, 업로드, 다운로드, 권한, 버전 이력 워크플로우 검증.
 * Serial 실행 — 업로드(TC-02)가 다운로드(TC-03)보다 먼저 실행되어야 함.
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';
import { getBackendToken } from '../../shared/helpers/api-helpers';
import { BASE_URLS } from '../../shared/constants/shared-test-data';

const BACKEND_URL = BASE_URLS.BACKEND;
const TEST_FORM = 'UL-QP-18-05'; // 자체점검표

test.describe('양식 관리 (Form Templates)', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC-01: 양식 목록 조회 → 응답 성공', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(`${BACKEND_URL}/api/form-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const data = body.data ?? body;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].formNumber).toBeTruthy();
    expect(data[0].name).toBeTruthy();
  });

  test('TC-02: TM이 양식 업로드 → 성공', async ({ techManagerPage: page }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // 작은 docx 파일 생성 (최소 valid zip)
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
    const fileBuffer = Buffer.from(zip.generate({ type: 'nodebuffer' }));

    const uploadResp = await page.request.post(
      `${BACKEND_URL}/api/form-templates/${TEST_FORM}/upload`,
      {
        headers: { Authorization: `Bearer ${token}` },
        multipart: {
          file: {
            name: `${TEST_FORM}_test.docx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            buffer: fileBuffer,
          },
        },
      }
    );

    expect(uploadResp.status()).toBe(201);
    const uploadData = await uploadResp.json();
    const uploaded = uploadData.data ?? uploadData;
    expect(uploaded.version).toBeGreaterThanOrEqual(1);
    expect(uploaded.formNumber).toBe(TEST_FORM);
  });

  test('TC-03: 활성 템플릿 다운로드 → 200 + 바이너리', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(`${BACKEND_URL}/api/form-templates/${TEST_FORM}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(200);
    const body = await resp.body();
    expect(body.length).toBeGreaterThan(100);
  });

  test('TC-04: TE는 업로드 불가 → 403', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const uploadResp = await page.request.post(
      `${BACKEND_URL}/api/form-templates/${TEST_FORM}/upload`,
      {
        headers: { Authorization: `Bearer ${token}` },
        multipart: {
          file: {
            name: 'test.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            buffer: Buffer.from('fake'),
          },
        },
      }
    );

    expect(uploadResp.status()).toBe(403);
  });

  test('TC-05: 버전 이력 조회 → 활성 버전 1개', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(`${BACKEND_URL}/api/form-templates/${TEST_FORM}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const data = (body.data ?? body) as Array<{ version: number; isActive: boolean }>;
    expect(data.length).toBeGreaterThanOrEqual(1);

    const activeCount = data.filter((d) => d.isActive).length;
    expect(activeCount).toBe(1);
  });
});
