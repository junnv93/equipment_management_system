import { z } from 'zod';
import { VM } from '../validation/messages';

/**
 * Lenient UUID 정규식 — 8-4-4-4-12 hex 형식만 검증.
 *
 * Zod v4의 z.string().uuid()는 RFC 9562 버전(1-8) + 변형(8-b) 니블을 강제하여
 * 개발 시드 UUID(00000000-0000-0000-0000-000000000002 등)를 거부합니다.
 * 프로젝트 전체에서 z.string().uuid() 대신 uuidString()을 사용합니다.
 */
const UUID_LENIENT =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * 필수 UUID 문자열 검증 — z.string().uuid() 대체 SSOT
 *
 * 프로젝트 전체에서 z.string().uuid() 대신 이 함수를 사용합니다.
 * Zod v4 RFC 9562 엄격 검증 대신 8-4-4-4-12 hex 형식만 검증합니다.
 *
 * @param message - UUID 검증 실패 시 표시할 커스텀 메시지 (기본: VM.uuid.generic)
 *
 * @example
 * // packages/schemas 스키마에서
 * import { uuidString } from './utils/fields';
 * const schema = z.object({ id: uuidString() });
 *
 * @example
 * // 백엔드 DTO에서 엔티티별 메시지와 함께
 * import { uuidString } from '@equipment-management/schemas';
 * const schema = z.object({ equipmentId: uuidString(VM.uuid.invalid('장비')) });
 */
export function uuidString(message?: string) {
  return z.string().regex(UUID_LENIENT, message ?? VM.uuid.generic);
}

/**
 * HTML 폼 안전 Optional UUID 스키마
 *
 * HTML <select>, <input> 요소는 미선택 시 '' (빈 문자열)을 전송하지만,
 * UUID 검증은 빈 문자열을 거부합니다.
 * 이 유틸리티는 '' → undefined 변환을 표준화합니다.
 *
 * @param message - UUID 검증 실패 시 표시할 커스텀 메시지 (기본: VM.uuid.generic)
 * @returns 입력: UUID | '' | undefined → 출력: string | undefined
 *
 * @example
 * // packages/schemas SSOT 스키마에서
 * import { optionalUuid } from './utils/fields';
 * const schema = z.object({ leaderId: optionalUuid() });
 *
 * @example
 * // 프론트엔드 폼에서 i18n 메시지와 함께
 * import { optionalUuid } from '@equipment-management/schemas';
 * const schema = z.object({ leaderId: optionalUuid(t('validation.invalidUserId')) });
 */
export function optionalUuid(message?: string) {
  return z
    .union([z.literal(''), uuidString(message)])
    .optional()
    .transform((val) => (val === '' ? undefined : val));
}

/**
 * HTML 폼 안전 Nullable Optional UUID 스키마
 *
 * update DTO에서 null 전송으로 값을 해제하는 패턴에 사용합니다.
 * '' → undefined, null은 그대로 유지됩니다.
 *
 * @param message - UUID 검증 실패 시 표시할 커스텀 메시지 (기본: VM.uuid.generic)
 * @returns 입력: UUID | '' | null | undefined → 출력: string | null | undefined
 */
export function nullableOptionalUuid(message?: string) {
  return z
    .union([z.literal(''), uuidString(message)])
    .nullable()
    .optional()
    .transform((val) => (val === '' ? undefined : val));
}

/**
 * Query DTO 자유 텍스트 필드 SSOT 헬퍼 — Optional + trim + max + 빈 문자열 정규화
 *
 * 모든 Query DTO의 search / manufacturer / destination / statuses 등
 * optional 자유 텍스트 필드의 단일 진입점.
 *
 * 보장 사항:
 * - HTML form `?search=` (빈 문자열) → undefined (`optionalUuid`와 동일 시맨틱)
 * - whitespace bypass 차단 (`.trim()` 선행)
 * - DoS 차단 (`.max(maxLen)` 강제)
 * - 메시지 SSOT: `VM.string.max(fieldName, maxLen)`
 *
 * @param maxLen - 허용 최대 길이. `VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH` (단일 검색어)
 *                또는 `VALIDATION_RULES.LONG_CSV_MAX_LENGTH` (CSV 다중값) 사용 권장
 * @param fieldNameForMessage - VM.string.max 메시지에 들어갈 필드명 (예: '검색어')
 * @returns Zod 스키마 — 입력: string | undefined → 출력: string | undefined (빈 문자열 → undefined)
 *
 * @example
 *   import { optionalTrimmedString } from '@equipment-management/schemas';
 *   import { VALIDATION_RULES } from '@equipment-management/shared-constants';
 *
 *   const schema = z.object({
 *     search: optionalTrimmedString(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH, '검색어'),
 *     statuses: optionalTrimmedString(VALIDATION_RULES.LONG_CSV_MAX_LENGTH, '상태 목록'),
 *   });
 */
export function optionalTrimmedString(maxLen: number, fieldNameForMessage: string) {
  return z
    .string()
    .trim()
    .max(maxLen, VM.string.max(fieldNameForMessage, maxLen))
    .transform((val) => (val === '' ? undefined : val))
    .optional();
}

/**
 * ISO 8601 날짜 문자열 (date-only or datetime) optional SSOT 헬퍼.
 *
 * Backend Query DTO의 fromDate/toDate/startDate/endDate 등 날짜 범위 필터 단일 진입점.
 *
 * 허용 형식:
 * - `YYYY-MM-DD` (date-only)
 * - `YYYY-MM-DDTHH:mm:ss[.SSS][Z]` (ISO 8601 datetime)
 *
 * 보장:
 * - 빈 문자열 / whitespace → undefined (HTML form 안전망)
 * - format 검증 (regex + Date.parse)
 * - max 30자 (datetime 최대 길이) — DoS 차단
 *
 * @param fieldNameForMessage - 검증 실패 메시지에 들어갈 필드명 (예: '시작일')
 *
 * @example
 *   const schema = z.object({
 *     fromDate: optionalIsoDateString('시작일'),
 *     toDate: optionalIsoDateString('종료일'),
 *   });
 */
export function optionalIsoDateString(fieldNameForMessage: string) {
  // YYYY-MM-DD 또는 YYYY-MM-DDTHH:mm:ss[.SSS][Z]
  const ISO_DATE_OR_DATETIME = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  return z
    .string()
    .trim()
    .max(30, VM.string.max(fieldNameForMessage, 30))
    .refine(
      (val) => val === '' || (ISO_DATE_OR_DATETIME.test(val) && !Number.isNaN(Date.parse(val))),
      { message: VM.date.invalid }
    )
    .transform((val) => (val === '' ? undefined : val))
    .optional();
}

/**
 * Pagination cursor optional SSOT 헬퍼.
 *
 * cursor는 도메인별로 형식이 다양 (timestamp+id 직렬화, base64 토큰, UUID 등).
 * 형식 검증은 도메인 책임이지만 trim/max는 공통 적용.
 *
 * @param maxLen - cursor 최대 길이 (기본 200 = `EXTENDED_TEXT_MAX_LENGTH` 가정 mirror)
 */
export function optionalCursor(maxLen: number) {
  return z
    .string()
    .trim()
    .max(maxLen, VM.string.max('cursor', maxLen))
    .transform((val) => (val === '' ? undefined : val))
    .optional();
}

/**
 * CSV 다중값 enum 검증 SSOT 헬퍼 — `'a,b,c'` 형식의 token-level whitelist + length cap.
 *
 * 자유 텍스트 LONG_CSV (max 1000자)만 적용한 후 service layer에서 token enum 검증을 잊으면
 * unknown token이 silent 통과 (예: `?statuses=unknown_status`). 이 helper는 토큰 단위로
 * Zod에서 enum 검증을 강제하여 silent miss를 차단.
 *
 * 동작:
 * 1. trim + max(maxLen) — DoS 1차 차단 (LONG_CSV_MAX_LENGTH=1000 권장)
 * 2. split(',') → 토큰 배열
 * 3. 각 토큰을 enum 화이트리스트로 검증
 * 4. 빈 문자열 / whitespace only → undefined
 *
 * @param allowedValues - 허용 토큰 배열 (`...Enum.options` 또는 `..._VALUES` SSOT 직접 참조)
 * @param maxLen - 입력 문자열 max (LONG_CSV_MAX_LENGTH=1000 권장)
 * @param fieldNameForMessage - 검증 실패 시 메시지에 들어갈 필드명 (예: '반출 상태 목록')
 * @returns Zod 스키마 — 입력: string | undefined → 출력: T[] | undefined (split + 정규화 결과)
 *
 * @example
 *   import { optionalCsvEnum } from '@equipment-management/schemas';
 *   import { CHECKOUT_STATUS_VALUES } from '@equipment-management/schemas';
 *   import { VALIDATION_RULES } from '@equipment-management/shared-constants';
 *
 *   statuses: optionalCsvEnum(
 *     CHECKOUT_STATUS_VALUES,
 *     VALIDATION_RULES.LONG_CSV_MAX_LENGTH,
 *     '반출 상태 목록',
 *   ),
 */
export function optionalCsvEnum<const T extends readonly string[]>(
  allowedValues: T,
  maxLen: number,
  fieldNameForMessage: string
) {
  return z
    .string()
    .trim()
    .max(maxLen, VM.string.max(fieldNameForMessage, maxLen))
    .transform((val) => (val === '' ? undefined : val))
    .optional()
    .transform((val, ctx): T[number][] | undefined => {
      if (val === undefined) return undefined;
      const tokens = val
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const allowed = allowedValues as readonly string[];
      const invalid = tokens.filter((t) => !allowed.includes(t));
      if (invalid.length > 0) {
        ctx.addIssue({
          code: 'custom',
          message: `${fieldNameForMessage}에 유효하지 않은 값이 포함되었습니다: ${invalid.join(', ')}`,
        });
        return z.NEVER;
      }
      return tokens as T[number][];
    });
}

/**
 * CSV 다중값 UUID 검증 SSOT 헬퍼 — `'<uuid>,<uuid>'` 형식의 토큰 단위 lenient UUID 검증.
 *
 * `optionalTrimmedString(LONG_CSV_MAX_LENGTH)` 만 적용한 후 service layer 에서 UUID 형식 검증을
 * 잊으면 invalid token (예: `?ids=not-a-uuid,abc`) 이 service 까지 흘러가 SQL parameter 에서
 * cast error 또는 silent 0 결과 반환. 이 helper 는 토큰 단위 UUID 형식을 Zod 에서 강제.
 *
 * 동작:
 * 1. trim + max(maxLen) — DoS 1차 차단 (LONG_CSV_MAX_LENGTH=1000 권장)
 * 2. split(',') → 토큰 배열
 * 3. 각 토큰을 lenient UUID 정규식 (8-4-4-4-12 hex) 으로 검증 — 시드 UUID 호환
 * 4. 빈 문자열 / whitespace only → undefined
 *
 * `optionalCsvEnum` 과의 차이: enum 화이트리스트 대신 UUID 형식 정규식 검증.
 * 권한/존재 검증은 service 책임 — 본 헬퍼는 형식만 보장.
 *
 * @param maxLen - 입력 문자열 max (LONG_CSV_MAX_LENGTH=1000 권장)
 * @param fieldNameForMessage - 검증 실패 시 메시지에 들어갈 필드명 (예: '팀 ID 목록')
 * @returns Zod 스키마 — 입력: string | undefined → 출력: string[] | undefined
 *
 * @example
 *   import { optionalCsvUuid } from '@equipment-management/schemas';
 *   import { VALIDATION_RULES } from '@equipment-management/shared-constants';
 *
 *   ids: optionalCsvUuid(VALIDATION_RULES.LONG_CSV_MAX_LENGTH, '팀 ID 목록'),
 *   teams: optionalCsvUuid(VALIDATION_RULES.LONG_CSV_MAX_LENGTH, '팀 목록'),
 */
export function optionalCsvUuid(maxLen: number, fieldNameForMessage: string) {
  return z
    .string()
    .trim()
    .max(maxLen, VM.string.max(fieldNameForMessage, maxLen))
    .transform((val) => (val === '' ? undefined : val))
    .optional()
    .transform((val, ctx): string[] | undefined => {
      if (val === undefined) return undefined;
      const tokens = val
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const invalid = tokens.filter((t) => !UUID_LENIENT.test(t));
      if (invalid.length > 0) {
        ctx.addIssue({
          code: 'custom',
          message: `${fieldNameForMessage}에 유효하지 않은 UUID 형식이 포함되었습니다: ${invalid.join(', ')}`,
        });
        return z.NEVER;
      }
      return tokens;
    });
}
