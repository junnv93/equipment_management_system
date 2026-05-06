import { FILE_UPLOAD_LIMITS } from '@equipment-management/shared-constants';
import { validateCertificateFile } from '../validate-certificate-file';

/**
 * Plain object cast로 file.type/size를 정확히 보장 — JSDOM의 File 생성자가
 * mime을 일관되게 보존하지 못하는 한계 회피. 검증 logic 자체가 순수 함수라
 * File 인터페이스만 만족하면 충분 (DOM은 사용 안 함).
 */
function makeFile(size: number, mime: string): File {
  return {
    name: 'cert.pdf',
    type: mime,
    size,
    lastModified: Date.now(),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    slice: () => new Blob(),
    stream: () => new ReadableStream(),
    text: () => Promise.resolve(''),
    webkitRelativePath: '',
  } as unknown as File;
}

describe('validateCertificateFile', () => {
  describe('positive cases', () => {
    it('정상 PDF (mime + size 모두 OK) → ok: true', () => {
      const result = validateCertificateFile(makeFile(2048, 'application/pdf'));
      expect(result.ok).toBe(true);
    });

    it('경계값: MAX_FILE_SIZE 정확히 일치 → ok: true (≤ 허용)', () => {
      const result = validateCertificateFile(
        makeFile(FILE_UPLOAD_LIMITS.MAX_FILE_SIZE, 'application/pdf')
      );
      expect(result.ok).toBe(true);
    });

    it('빈 PDF (size 0)도 mime 통과 → ok: true (서버 magic byte로 차단됨)', () => {
      const result = validateCertificateFile(makeFile(0, 'application/pdf'));
      expect(result.ok).toBe(true);
    });
  });

  describe('negative cases — i18n key routing', () => {
    it('비-PDF mime → certificateFormatUnsupported i18n 키', () => {
      const result = validateCertificateFile(makeFile(1024, 'image/jpeg'));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.i18nKey).toBe('calibration.errors.certificateFormatUnsupported');
      }
    });

    it('빈 mime 문자열도 차단 (mime spoofing 방어)', () => {
      const result = validateCertificateFile(makeFile(1024, ''));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.i18nKey).toBe('calibration.errors.certificateFormatUnsupported');
      }
    });

    it('size > MAX_FILE_SIZE → fileLimitExceeded i18n 키', () => {
      const result = validateCertificateFile(
        makeFile(FILE_UPLOAD_LIMITS.MAX_FILE_SIZE + 1, 'application/pdf')
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.i18nKey).toBe('calibration.errors.fileLimitExceeded');
      }
    });

    it('mime + size 양쪽 위반 시 mime이 먼저 차단 (검증 순서 — defense in depth)', () => {
      const result = validateCertificateFile(
        makeFile(FILE_UPLOAD_LIMITS.MAX_FILE_SIZE + 1, 'image/jpeg')
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // mime 검증이 먼저 실행되어야 함
        expect(result.i18nKey).toBe('calibration.errors.certificateFormatUnsupported');
      }
    });
  });

  describe('discriminated union — type narrowing', () => {
    it('ok: true 분기에서는 i18nKey 접근 불가 (compile-time 보장)', () => {
      const result = validateCertificateFile(makeFile(1024, 'application/pdf'));
      if (result.ok) {
        // @ts-expect-error — ok: true 분기에 i18nKey 없음
        expect(result.i18nKey).toBeUndefined();
      }
    });
  });
});
