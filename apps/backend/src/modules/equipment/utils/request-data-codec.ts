/**
 * RequestDataCodec — equipment_requests.requestData 직렬화/역직렬화 SSOT
 *
 * 문제:
 *   JSON.stringify(dto) → DB TEXT → JSON.parse() 과정에서
 *   Date 객체가 ISO 문자열로 변환된 뒤 복원되지 않는다.
 *   Drizzle ORM은 Date.toISOString()을 호출하므로 문자열이 들어오면 TypeError 발생.
 *
 * 해결:
 *   requestType별 Zod 스키마를 통한 역직렬화 → z.coerce.date()가 자동 복원.
 *   모든 requestData 읽기/쓰기는 반드시 이 코덱을 통해야 한다.
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
// 2. 직렬화 (DTO → JSON string)
// ---------------------------------------------------------------------------

/**
 * DTO를 JSON 문자열로 직렬화.
 * Date 필드는 JSON.stringify가 자동으로 ISO 문자열로 변환한다.
 */
export function serializeRequestData(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}

// ---------------------------------------------------------------------------
// 3. 역직렬화 (JSON string → typed DTO)
// ---------------------------------------------------------------------------

/**
 * JSON 문자열을 requestType에 맞는 Zod 스키마로 파싱.
 *
 * - z.coerce.date()가 ISO 문자열 → Date 객체 자동 변환
 * - .passthrough()로 version 등 추가 필드 보존
 * - 스키마 검증 실패 시 ZodError throw
 */
export function deserializeRequestData<T extends RequestType>(
  requestType: T,
  jsonString: string | null
): RequestDataTypeMap[T] {
  const raw = JSON.parse(jsonString || '{}');
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
 * Zod 검증 없이 JSON.parse만 수행. 실패 시 빈 객체 반환.
 */
export function parseRequestDataForDisplay(jsonString: string | null): RequestDataDisplayInfo {
  try {
    return JSON.parse(jsonString || '{}') as RequestDataDisplayInfo;
  } catch {
    return {};
  }
}
