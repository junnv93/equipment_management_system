/**
 * 다운로드/Export 버튼 공통 에러 → 토스트 메시지 변환 유틸.
 *
 * 모든 blob 다운로드 버튼(ExportFormButton, ExportDocumentButton, 기타 export 버튼 등)이
 * catch 블록에서 동일한 방식으로 에러 메시지를 만들 수 있도록 SSOT 제공.
 *
 * 흐름:
 *   axios interceptor → parseBlobErrorData → createApiError → ApiError { code, message }
 *   → getDownloadErrorToast → { title, description }
 *
 * 특정 코드(`FORM_TEMPLATE_NOT_FOUND` 등)는 백엔드가 보낸 구체 메시지를 우선 사용,
 * 매핑되지 않은 generic 에러는 호출자가 제공한 fallback description 사용.
 */

import { ApiError, EquipmentErrorCode, ERROR_MESSAGES } from './equipment-errors';

export interface DownloadErrorToast {
  title?: string;
  description: string;
}

/**
 * 다운로드 실패 시 `useToast`의 `{ title, description }`으로 변환.
 *
 * @param error catch 블록에서 받은 unknown 에러
 * @param fallbackDescription generic 에러에 사용할 한국어 description (i18n 값)
 * @returns 토스트 표시용 { title?, description }
 */
export function getDownloadErrorToast(
  error: unknown,
  fallbackDescription: string
): DownloadErrorToast {
  if (error instanceof ApiError) {
    const info = ERROR_MESSAGES[error.code];

    // 구체 매핑이 있는 코드(FORM_TEMPLATE_NOT_FOUND, EQUIPMENT_NOT_FOUND 등)는
    // 백엔드 전송 메시지를 description으로 사용하고, title은 로컬 카탈로그에서 사용.
    if (info && error.code !== EquipmentErrorCode.UNKNOWN_ERROR) {
      const serverMessage = error.message?.trim();
      return {
        title: info.title,
        description: serverMessage && serverMessage.length > 0 ? serverMessage : info.message,
      };
    }
  }

  return { description: fallbackDescription };
}
