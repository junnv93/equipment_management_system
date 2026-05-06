import { FILE_UPLOAD_LIMITS, REPORT_EXPORT_MIME } from '@equipment-management/shared-constants';

/**
 * Client-side 파일 검증 결과 — discriminated union.
 * - `ok: true`: extract endpoint 호출 가능
 * - `ok: false`: i18n 키로 toast 처리. extract 호출 차단.
 */
export type CertificateFileValidation = { ok: true } | { ok: false; i18nKey: string };

/**
 * 교정성적서 PDF 업로드의 client-side 사전 검증.
 *
 * 목적:
 *   - 서버 호출 전 mime/size 위반을 차단해 불필요한 네트워크 트래픽 회피.
 *   - 동일 SSOT(REPORT_EXPORT_MIME.pdf / FILE_UPLOAD_LIMITS)를 backend와 공유.
 *   - 검증 결과를 i18n 키로 표현해 toast routing의 일관성 유지.
 *
 * 분리 이유 (testability):
 *   - JSDOM 환경에서 input file의 type/size를 fireEvent.change로 정확히 전달
 *     하기 어려운 well-known RTL 한계를 회피. helper를 직접 호출하는 단위
 *     테스트가 *순수 함수* 검증으로 100% deterministic.
 *   - 컴포넌트는 이 helper를 호출만 하므로 보안 정책 변경 시 단일 진입점 수정.
 *
 * Backend ErrorCode와의 관계:
 *   - 이 helper는 client-side pre-flight 차단용 (네트워크 호출 회피).
 *   - 서버 응답의 ErrorCode 라우팅은 별도 helper(`getExtractCertificateErrorI18n`)
 *     가 담당 — 책임 분리.
 */
export function validateCertificateFile(file: File): CertificateFileValidation {
  if (file.type !== REPORT_EXPORT_MIME.pdf) {
    return {
      ok: false,
      i18nKey: 'calibration.errors.certificateFormatUnsupported',
    };
  }
  if (file.size > FILE_UPLOAD_LIMITS.MAX_FILE_SIZE) {
    return {
      ok: false,
      i18nKey: 'calibration.errors.fileLimitExceeded',
    };
  }
  return { ok: true };
}
