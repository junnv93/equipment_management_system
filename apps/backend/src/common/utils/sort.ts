/**
 * 타입 안전한 정렬 유틸리티
 *
 * 동적 속성 접근 시 noImplicitAny 오류를 피하기 위한 헬퍼 함수들
 */

/**
 * 객체에서 안전하게 속성 값을 가져옵니다.
 * @param obj - 대상 객체
 * @param key - 속성 키
 * @returns 속성 값 또는 undefined
 */
export function getProperty<T extends object>(obj: T, key: string): unknown {
  return (obj as Record<string, unknown>)[key];
}

/**
 * 배열을 동적 필드로 정렬합니다.
 * @param items - 정렬할 배열
 * @param field - 정렬 기준 필드명
 * @param direction - 정렬 방향 ('asc' | 'desc')
 * @returns 정렬된 배열 (원본 배열은 변경되지 않음)
 */
export function sortByField<T extends object>(
  items: T[],
  field: string,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  const multiplier = direction === 'desc' ? -1 : 1;

  return [...items].sort((a, b) => {
    const valueA = getProperty(a, field);
    const valueB = getProperty(b, field);

    // null/undefined 처리: 항상 마지막으로
    if (valueA == null && valueB == null) return 0;
    if (valueA == null) return 1;
    if (valueB == null) return -1;

    // 비교
    if (valueA < valueB) return -1 * multiplier;
    if (valueA > valueB) return 1 * multiplier;
    return 0;
  });
}

/**
 * 정렬 문자열을 파싱합니다.
 * @param sortString - "field.direction" 형식의 문자열 (예: "name.asc", "createdAt.desc")
 * @returns { field, direction } 또는 null
 */
export function parseSortString(
  sortString: string | undefined
): { field: string; direction: 'asc' | 'desc' } | null {
  if (!sortString) return null;

  const [field, dir] = sortString.split('.');
  if (!field) return null;

  const direction = dir === 'desc' ? 'desc' : 'asc';
  return { field, direction };
}
