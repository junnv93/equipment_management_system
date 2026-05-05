import * as fs from 'node:fs';
import { CertificateExtractorService } from '../services/certificate-extractor.service';

/**
 * 실제 PDF 샘플로 end-to-end 검증 (pdftotext 외부 호출 포함).
 *
 * PDF 샘플은 사용자 로컬에만 존재 — 환경변수 `HCT_PDF_SAMPLE_DIR`로 경로 주입.
 * CI나 다른 PC에서 샘플이 없으면 자동 skip.
 *
 * 로컬 실행 예:
 *   HCT_PDF_SAMPLE_DIR='/mnt/c/Users/kmjkd/Downloads' pnpm --filter backend exec jest \
 *     --testPathPattern=certificate-extractor.integration
 */
describe('CertificateExtractorService (integration with real HCT PDFs)', () => {
  const sampleDir = process.env.HCT_PDF_SAMPLE_DIR;
  const samples = sampleDir
    ? [
        {
          path: `${sampleDir}/SUW-E0149_C-2026-051428.PDF`,
          expected: {
            managementNumber: 'SUW-E0149',
            certificateNumber: 'IC-2026-044869',
            revisionNumber: 1,
            parentCertificateNumber: null,
            calibrationDate: '2026-04-20',
            nextCalibrationDate: '2027-04-20',
          },
        },
        {
          path: `${sampleDir}/새 폴더 (9)/SUW-E0409_C-2026-006161.PDF`,
          expected: {
            managementNumber: 'SUW-E0409',
            certificateNumber: 'IC-2026-004871-R1',
            revisionNumber: 2,
            parentCertificateNumber: 'IC-2026-004871',
            calibrationDate: '2026-01-14',
            nextCalibrationDate: '2027-01-14',
          },
        },
        {
          path: `${sampleDir}/새 폴더 (9)/SUW-E0205_C-2025-033730.PDF`,
          expected: {
            managementNumber: 'SUW-E0205',
            certificateNumber: 'IC-2025-028904',
            revisionNumber: 1,
            parentCertificateNumber: null,
            calibrationDate: '2025-03-24',
            nextCalibrationDate: null,
          },
        },
      ].filter((s) => fs.existsSync(s.path))
    : [];

  // 샘플이 없는 환경에서는 전체 describe skip
  const conditionalIt = samples.length > 0 ? it : it.skip;

  for (const sample of samples) {
    conditionalIt(`extracts correctly from ${sample.path.split('/').pop()}`, async () => {
      const service = new CertificateExtractorService();
      const buffer = fs.readFileSync(sample.path);
      const result = await service.extractFromBuffer(buffer);
      expect(result).toMatchObject({
        ...sample.expected,
        agencyName: 'HCT',
      });
    });
  }

  if (samples.length === 0) {
    it.skip('skipped — set HCT_PDF_SAMPLE_DIR env to run real PDF integration tests', () => {
      // intentionally empty
    });
  }
});
