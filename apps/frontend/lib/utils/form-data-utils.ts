/**
 * ✅ SSOT: 폼 데이터 변환 유틸리티
 *
 * Zod 스키마와 일치하도록 폼 데이터를 정제합니다.
 * - 빈 문자열 → undefined (선택적 필드)
 * - 빈 문자열 → null (nullable 필드)
 * - 타입 변환 (string → number, Date)
 */

/**
 * 빈 문자열을 undefined로 변환
 * Zod의 .optional() 필드와 호환
 */
export function emptyToUndefined<T>(value: T | string | null | undefined): T | undefined {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  return value as T;
}

/**
 * 빈 문자열을 null로 변환
 * Zod의 .nullable() 필드와 호환
 */
export function emptyToNull<T>(value: T | string | null | undefined): T | null {
  if (value === '' || value === undefined) {
    return null;
  }
  return value as T;
}

/**
 * 객체의 모든 빈 문자열 필드를 undefined로 변환
 * 중첩 객체는 지원하지 않음 (flat object만)
 */
export function sanitizeFormData<T extends Record<string, unknown>>(
  data: T,
  options?: {
    /** undefined로 변환할 필드 목록 (기본: 모든 빈 문자열) */
    optionalFields?: string[];
    /** null로 변환할 필드 목록 */
    nullableFields?: string[];
    /** 완전히 제거할 필드 목록 */
    excludeFields?: string[];
  }
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    // 제외 필드는 스킵
    if (options?.excludeFields?.includes(key)) {
      continue;
    }

    // nullable 필드 처리
    if (options?.nullableFields?.includes(key)) {
      result[key as keyof T] = emptyToNull(value) as T[keyof T];
      continue;
    }

    // optional 필드 처리 (기본값)
    const sanitized = emptyToUndefined(value);
    if (sanitized !== undefined) {
      result[key as keyof T] = sanitized as T[keyof T];
    }
  }

  return result;
}

/**
 * FormData 객체 생성 헬퍼
 * - Date 객체 → ISO 문자열 변환
 * - undefined/null 필드 제외
 * - 빈 문자열 제외
 */
export function createFormData(data: Record<string, unknown>, files?: File[]): FormData {
  const formData = new FormData();

  // 데이터 추가
  Object.entries(data).forEach(([key, value]) => {
    // undefined, null, 빈 문자열은 제외
    if (value === undefined || value === null || value === '') {
      return;
    }

    // Date 객체는 ISO 문자열로 변환
    if (value instanceof Date) {
      formData.append(key, value.toISOString());
      return;
    }

    // 나머지는 문자열로 변환
    formData.append(key, String(value));
  });

  // 파일 추가
  files?.forEach((file) => {
    formData.append('files', file);
  });

  return formData;
}
