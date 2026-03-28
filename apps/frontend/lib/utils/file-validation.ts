/**
 * 파일 검증 유틸리티 — FileUpload 컴포넌트와 <Input type="file"> 공통 사용
 *
 * SSOT: @equipment-management/shared-constants의 FILE_TYPES에서 파생
 */

import {
  ALLOWED_EXTENSIONS,
  EXTENSION_TO_MIME,
  FILE_UPLOAD_LIMITS,
} from '@equipment-management/shared-constants';

export interface FileValidationOptions {
  /** HTML accept 문자열 (예: ".pdf,.png" 또는 "image/jpeg") */
  accept?: string;
  /** 최대 파일 크기 (bytes) */
  maxSize?: number;
}

export interface FileValidationError {
  /** 에러 타입: 'size' | 'type' */
  type: 'size' | 'type';
  /** 파일명 */
  fileName: string;
  /** accept 문자열 (type 에러 시) */
  accept?: string;
  /** 최대 크기 MB (size 에러 시) */
  maxSizeMB?: number;
}

/**
 * 파일 타입/크기 검증
 *
 * accept 문자열의 확장자(.pdf) 및 MIME(image/png) 형식 모두 지원.
 * file.type이 빈 문자열인 경우 확장자에서 MIME을 추론합니다.
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationError | null {
  const { accept = ALLOWED_EXTENSIONS.join(','), maxSize = FILE_UPLOAD_LIMITS.MAX_FILE_SIZE } =
    options;

  if (file.size > maxSize) {
    return {
      type: 'size',
      fileName: file.name,
      maxSizeMB: Math.round(maxSize / 1024 / 1024),
    };
  }

  const acceptTokens = accept.split(',').map((token) => token.trim().toLowerCase());
  const fileExt = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
  const fileMime = file.type.toLowerCase();
  const effectiveMime = fileMime || EXTENSION_TO_MIME.get(fileExt) || '';

  const isAllowed = acceptTokens.some((token) => {
    if (token.startsWith('.')) {
      return token === fileExt;
    }
    if (token.endsWith('/*')) {
      return effectiveMime.startsWith(token.replace('/*', '/'));
    }
    return token === effectiveMime;
  });

  if (!isAllowed) {
    return {
      type: 'type',
      fileName: file.name,
      accept,
    };
  }

  return null;
}
