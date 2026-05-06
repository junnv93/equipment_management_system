'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { ExtractedCalibrationCertificate } from '@equipment-management/schemas';
import calibrationCertificateApi from '@/lib/api/calibration-certificate-api';
import {
  getCalibrationErrorI18nKey,
  type CalibrationErrorCode,
} from '@/lib/errors/calibration-errors';
import { extractErrorCode } from '@/lib/errors/disposal-errors';

/**
 * 교정성적서 PDF 추출 mutation hook (Phase A — HCT 양식).
 *
 * - 백엔드 `POST /api/calibration/certificates/extract` 호출 (multipart, dry-run).
 * - 추출 결과는 캐시하지 않음 (idempotent + side-effect 없음 + 사용자 보정 가능).
 * - 에러는 ErrorCode SSOT 5-layer를 거쳐 i18n 키로 routing 가능.
 *
 * 사용처:
 * - `CalibrationCertificatePdfUploader` 컴포넌트의 onDrop/onSelect 핸들러
 * - 추출 성공 시 결과를 `extractedToFormDefaults`로 변환 → CalibrationForm defaults
 *
 * @see calibrationCertificateApi.extract — API 호출 본체
 * @see getCalibrationErrorI18nKey — ErrorCode → i18n 키 라우팅 (Layer 5)
 */
export function useExtractCalibrationCertificate(
  options?: Omit<UseMutationOptions<ExtractedCalibrationCertificate, Error, File>, 'mutationFn'>
) {
  return useMutation<ExtractedCalibrationCertificate, Error, File>({
    mutationFn: (file: File) => calibrationCertificateApi.extract(file),
    ...options,
  });
}

/**
 * Mutation 에러를 i18n 키와 변수로 변환합니다.
 *
 * - Layer 5 (frontend mapper) 진입점.
 * - `details.field`(필드 누락 케이스)를 변수로 전달하여 사용자 친화적 메시지 생성.
 *
 * @returns `{ key: i18n key, vars: { field?: string } }` — 호출자가 `t(key, vars)` 적용.
 */
export function getExtractCertificateErrorI18n(error: unknown): {
  key: string;
  vars: { field?: string };
} {
  const code = extractErrorCode(error) as CalibrationErrorCode | null;
  const key = code
    ? getCalibrationErrorI18nKey(code)
    : 'calibration.errors.certificateExtractionFailed';

  // details.field 추출 (CalibrationCertificateFieldMissing 케이스)
  let field: string | undefined;
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const data = (error.response as { data: unknown }).data;
    if (
      data &&
      typeof data === 'object' &&
      'details' in data &&
      data.details &&
      typeof data.details === 'object' &&
      'field' in data.details &&
      typeof data.details.field === 'string'
    ) {
      field = data.details.field;
    }
  }

  return { key, vars: field ? { field } : {} };
}
