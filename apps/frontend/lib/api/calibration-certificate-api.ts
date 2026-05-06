/**
 * 교정성적서 PDF 추출 API (Phase A — HCT 양식)
 *
 * 백엔드 `POST /api/calibration/certificates/extract`로 PDF를 multipart 업로드하여
 * 표지 메타데이터를 추출. DB 변경 없음 — 사용자 검증/등록 폼 사전 채움 용도.
 *
 * 후속 흐름은 기존 `POST /api/calibration` (multipart) 재사용:
 * 추출 결과 → CalibrationForm defaults 사전 채움 → 사용자 보정 → 기존 등록 endpoint.
 */

import type { ExtractedCalibrationCertificate } from '@equipment-management/schemas';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { apiClient } from './api-client';
import { transformSingleResponse } from './utils/response-transformers';

const calibrationCertificateApi = {
  /**
   * 교정성적서 PDF에서 표지 메타데이터 추출.
   * @param file PDF 파일 (HCT 양식, 최대 10MB)
   */
  extract: async (file: File): Promise<ExtractedCalibrationCertificate> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(API_ENDPOINTS.CALIBRATIONS.EXTRACT_CERTIFICATE, formData);
    return transformSingleResponse<ExtractedCalibrationCertificate>(response);
  },
};

export default calibrationCertificateApi;
