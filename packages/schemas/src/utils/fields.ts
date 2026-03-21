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
