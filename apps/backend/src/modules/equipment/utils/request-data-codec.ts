/**
 * RequestDataCodec — equipment_requests.requestData 직렬화/역직렬화 SSOT
 *
 * DB 컬럼이 jsonb이므로 Drizzle ORM이 JS 객체 ↔ JSON 변환을 자동 처리합니다.
 * 이 코덱은 Zod 스키마 기반 타입 변환(Date 복원 등)만 담당합니다.
 *
 * 모든 requestData 읽기/쓰기는 반드시 이 코덱을 통해야 한다.
 */
import { createEquipmentSchema, updateEquipmentSchema } from '@equipment-management/schemas';
import { z } from 'zod';
import type { CreateEquipmentDto } from '../dto/create-equipment.dto';
import type { UpdateEquipmentDto } from '../dto/update-equipment.dto';

// ---------------------------------------------------------------------------
// 1. requestType → Zod schema 매핑
// ---------------------------------------------------------------------------

const deleteRequestDataSchema = z
  .object({
    reason: z.string().optional(),
  })
  .passthrough();

/**
 * requestType별 Zod 스키마 레지스트리.
 * .passthrough()로 Zod가 알지 못하는 필드(version 등)를 보존한다.
 */
const REQUEST_DATA_SCHEMAS = {
  create: createEquipmentSchema.passthrough(),
  update: updateEquipmentSchema.passthrough(),
  delete: deleteRequestDataSchema,
} as const;

type RequestType = keyof typeof REQUEST_DATA_SCHEMAS;

// requestType → deserialized 타입 매핑
interface RequestDataTypeMap {
  create: CreateEquipmentDto;
  update: UpdateEquipmentDto;
  delete: { reason?: string; [key: string]: unknown };
}

// ---------------------------------------------------------------------------
// 2. 직렬화 (DTO → jsonb 호환 객체)
// ---------------------------------------------------------------------------

/**
 * DTO를 jsonb 호환 plain object로 변환.
 * jsonb 컬럼에서는 Drizzle ORM이 자동으로 JSON 직렬화하므로
 * JSON.stringify 대신 plain object를 반환합니다.
 */
export function serializeRequestData(data: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 3. 역직렬화 (jsonb → typed DTO)
// ---------------------------------------------------------------------------

/**
 * jsonb에서 읽은 객체를 requestType에 맞는 Zod 스키마로 파싱.
 *
 * - z.coerce.date()가 ISO 문자열 → Date 객체 자동 변환
 * - .passthrough()로 version 등 추가 필드 보존
 * - 스키마 검증 실패 시 ZodError throw
 *
 * jsonb 컬럼은 Drizzle ORM이 자동 파싱하여 객체를 전달하지만,
 * 하위 호환성을 위해 문자열도 처리합니다.
 */
export function deserializeRequestData<T extends RequestType>(
  requestType: T,
  data: unknown
): RequestDataTypeMap[T] {
  const raw = typeof data === 'string' ? JSON.parse(data) : (data ?? {});
  const schema = REQUEST_DATA_SCHEMAS[requestType];
  return schema.parse(raw) as RequestDataTypeMap[T];
}

// ---------------------------------------------------------------------------
// 4. 표시용 경량 파싱 (알림/UI 목록)
// ---------------------------------------------------------------------------

interface RequestDataDisplayInfo {
  name?: string;
  managementNumber?: string;
  equipmentName?: string;
  [key: string]: unknown;
}

/**
 * 알림 이벤트, UI 목록 등에서 name/managementNumber만 필요한 경우.
 * Zod 검증 없이 객체를 직접 반환. 실패 시 빈 객체 반환.
 */
export function parseRequestDataForDisplay(data: unknown): RequestDataDisplayInfo {
  try {
    if (typeof data === 'string') {
      return JSON.parse(data) as RequestDataDisplayInfo;
    }
    return (data ?? {}) as RequestDataDisplayInfo;
  } catch {
    return {};
  }
}
