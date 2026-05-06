/**
 * Calibration Certificate Extract E2E (Phase A — HCT 양식)
 *
 * 검증 대상: `POST /api/calibration/certificates/extract`
 *   - 9-layer 보안 (mime / magic byte / size / timeout / maxBuffer / temp path /
 *     permission / rate limit / audit log) 중 e2e에서 검증 가능한 layer
 *   - ErrorCode SSOT 5-layer 정합성 (response.code === ErrorCode.X)
 *   - HCT 양식 happy path (env-gated, 실제 PDF — `HCT_PDF_SAMPLE_DIR`)
 *
 * test_engineer (`loginAs('user')`)가 CREATE_CALIBRATION 권한 보유 — bootstrap.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import request from 'supertest';
import { ErrorCode } from '@equipment-management/schemas';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, type TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';

describe('Calibration Certificate Extract E2E', () => {
  let ctx: TestAppContext;
  let accessToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    // test_engineer — CREATE_CALIBRATION 권한 보유 (등록·추출 가능 권한군)
    accessToken = await loginAs(ctx.app, 'user');
  });

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  describe('인증 / 권한', () => {
    it('Authorization 헤더 없이 호출 → 401', async () => {
      await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATIONS.EXTRACT_CERTIFICATE)
        .attach('file', Buffer.from('%PDF-1.4 minimal'), 'cert.pdf')
        .expect(401);
    });
  });

  describe('파일 검증 (defense in depth — 9-layer 보안)', () => {
    it('파일 누락 → 400 + ErrorCode.CalibrationFileRequired', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATIONS.EXTRACT_CERTIFICATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.code).toBe(ErrorCode.CalibrationFileRequired);
    });

    it('비-PDF mime → 400 + CalibrationCertificateFormatUnsupported (multer fileFilter)', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATIONS.EXTRACT_CERTIFICATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('not a pdf'), {
          filename: 'cert.txt',
          contentType: 'text/plain',
        })
        .expect(400);

      expect(response.body.code).toBe(ErrorCode.CalibrationCertificateFormatUnsupported);
    });

    it('mime은 PDF지만 magic byte 불일치 → 400 + CalibrationCertificateExtractionFailed', async () => {
      // mime 우회 — 첫 4바이트가 `%PDF`이 아닌 임의 buffer
      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATIONS.EXTRACT_CERTIFICATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('FAKE_PDF_CONTENT_MIME_SPOOFED'), {
          filename: 'cert.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);

      expect(response.body.code).toBe(ErrorCode.CalibrationCertificateExtractionFailed);
    });

    it('빈 파일 (size=0) → 400 + CalibrationCertificateExtractionFailed', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATIONS.EXTRACT_CERTIFICATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.alloc(0), {
          filename: 'cert.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);

      expect(response.body.code).toBe(ErrorCode.CalibrationCertificateExtractionFailed);
    });

    it('PDF magic byte는 있으나 HCT 마커 미발견 → 400 + CalibrationCertificateFormatUnsupported', async () => {
      // 최소 valid PDF (mock — magic byte는 있고 텍스트 있음, HCT 마커 없음)
      const minimalPdf = Buffer.concat([
        Buffer.from('%PDF-1.4\n'),
        Buffer.from('% Mock PDF without HCT markers\n'),
        Buffer.from('1 0 obj <<>> endobj\n'),
        Buffer.from('xref\ntrailer<<>>\n%%EOF'),
      ]);
      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATIONS.EXTRACT_CERTIFICATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', minimalPdf, {
          filename: 'cert.pdf',
          contentType: 'application/pdf',
        });

      // pdftotext가 minimal PDF를 처리할 수 있으면 HCT 마커 검증에서 차단,
      // 처리 실패하면 ExtractionFailed로 fail-close. 둘 다 400 (BadRequestException 경로).
      expect(response.status).toBe(400);
      expect([
        ErrorCode.CalibrationCertificateFormatUnsupported,
        ErrorCode.CalibrationCertificateExtractionFailed,
      ]).toContain(response.body.code);
    });
  });

  describe('Happy path (env-gated — 실제 HCT PDF)', () => {
    const sampleDir = process.env.HCT_PDF_SAMPLE_DIR;
    const sampleE0149 = sampleDir ? path.join(sampleDir, 'SUW-E0149_C-2026-051428.PDF') : null;

    const conditionalIt = sampleE0149 && fs.existsSync(sampleE0149) ? it : it.skip;

    conditionalIt(
      'SUW-E0149 (Network Analyzer) → 200 + ExtractedCalibrationCertificate',
      async () => {
        const response = await request(ctx.app.getHttpServer())
          .post(API_ENDPOINTS.CALIBRATIONS.EXTRACT_CERTIFICATE)
          .set('Authorization', `Bearer ${accessToken}`)
          .attach('file', sampleE0149!)
          .expect(200);

        expect(response.body).toMatchObject({
          managementNumber: 'SUW-E0149',
          certificateNumber: 'IC-2026-044869',
          revisionNumber: 1,
          parentCertificateNumber: null,
          calibrationDate: '2026-04-20',
          nextCalibrationDate: '2027-04-20',
          agencyName: 'HCT',
        });
      }
    );

    if (!sampleDir) {
      it.skip('skipped — set HCT_PDF_SAMPLE_DIR env to run real PDF e2e', () => {
        // intentionally empty
      });
    }
  });
});
