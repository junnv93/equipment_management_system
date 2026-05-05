import { BadRequestException } from '@nestjs/common';
import { CertificateExtractorService } from '../services/certificate-extractor.service';
import {
  HCT_COVER_BASELINE,
  HCT_COVER_REVISION_R1,
  HCT_COVER_NO_NEXT_DATE,
  NON_HCT_FORM,
  HCT_COVER_MISSING_CERT_NO,
} from './fixtures/hct-cover-pages';

describe('CertificateExtractorService.parseHctCoverPage', () => {
  let service: CertificateExtractorService;

  beforeEach(() => {
    service = new CertificateExtractorService();
  });

  describe('positive cases', () => {
    it('일반 성적서에서 4개 핵심 필드를 모두 추출한다 (E0149)', () => {
      const result = service.parseHctCoverPage(HCT_COVER_BASELINE);
      expect(result).toEqual({
        managementNumber: 'SUW-E0149',
        certificateNumber: 'IC-2026-044869',
        revisionNumber: 1,
        parentCertificateNumber: null,
        calibrationDate: '2026-04-20',
        nextCalibrationDate: '2027-04-20',
        agencyName: 'HCT',
      });
    });

    it('수정 성적서에서 revisionNumber + parentCertificateNumber 추출 (E0409 R1)', () => {
      const result = service.parseHctCoverPage(HCT_COVER_REVISION_R1);
      expect(result.certificateNumber).toBe('IC-2026-004871-R1');
      expect(result.revisionNumber).toBe(2);
      expect(result.parentCertificateNumber).toBe('IC-2026-004871');
      expect(result.managementNumber).toBe('SUW-E0409');
      expect(result.calibrationDate).toBe('2026-01-14');
      expect(result.nextCalibrationDate).toBe('2027-01-14');
    });

    it('차기교정예정일자 누락 양식을 nullable로 처리 (E0205, KOLAS-G-008 비대상)', () => {
      const result = service.parseHctCoverPage(HCT_COVER_NO_NEXT_DATE);
      expect(result.nextCalibrationDate).toBeNull();
      expect(result.calibrationDate).toBe('2025-03-24');
      expect(result.managementNumber).toBe('SUW-E0205');
      expect(result.certificateNumber).toBe('IC-2025-028904');
    });

    it('agencyName은 항상 HCT로 고정', () => {
      expect(service.parseHctCoverPage(HCT_COVER_BASELINE).agencyName).toBe('HCT');
      expect(service.parseHctCoverPage(HCT_COVER_REVISION_R1).agencyName).toBe('HCT');
      expect(service.parseHctCoverPage(HCT_COVER_NO_NEXT_DATE).agencyName).toBe('HCT');
    });
  });

  describe('negative cases', () => {
    it('HCT 양식 marker가 없으면 BadRequestException', () => {
      expect(() => service.parseHctCoverPage(NON_HCT_FORM)).toThrow(BadRequestException);
      expect(() => service.parseHctCoverPage(NON_HCT_FORM)).toThrow(/HCT 양식만/);
    });

    it('성적서번호 누락 시 BadRequestException', () => {
      expect(() => service.parseHctCoverPage(HCT_COVER_MISSING_CERT_NO)).toThrow(
        BadRequestException
      );
      expect(() => service.parseHctCoverPage(HCT_COVER_MISSING_CERT_NO)).toThrow(/성적서번호/);
    });

    it('빈 문자열 입력 시 HCT marker 검증에서 차단', () => {
      expect(() => service.parseHctCoverPage('')).toThrow(BadRequestException);
    });
  });

  describe('Zod schema 자체 검증', () => {
    it('추출 결과는 extractedCalibrationCertificateSchema 계약을 만족', () => {
      // service.parseHctCoverPage 내부에서 schema.parse() 통과 — 도달하면 OK
      const result = service.parseHctCoverPage(HCT_COVER_BASELINE);
      expect(result.calibrationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.revisionNumber).toBeGreaterThanOrEqual(1);
    });
  });
});
