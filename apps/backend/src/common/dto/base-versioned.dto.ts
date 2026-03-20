import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { VM } from '@equipment-management/schemas';

/**
 * Optimistic Locking용 Base DTO
 *
 * ✅ DRY 원칙: 모든 mutation DTO가 이 클래스를 상속
 * ✅ 일관성: version 필드를 깜빡할 수 없음
 * ✅ 타입 안전성: TypeScript + Zod 이중 검증
 *
 * @example
 * export class ApproveCheckoutDto extends VersionedDto {
 *   // version 필드는 자동으로 상속됨
 *   notes?: string;
 * }
 */
export abstract class VersionedDto {
  @ApiProperty({
    description: 'Optimistic locking version (필수)',
    example: 1,
    required: true,
    type: 'integer',
    minimum: 1,
  })
  version!: number;
}

/**
 * Zod schema mixin for versioned DTOs
 *
 * ✅ Zod 스키마에서 재사용 가능
 * ✅ 런타임 검증: 양수 정수 검증
 *
 * @example
 * export const approveCheckoutSchema = z.object({
 *   ...versionedSchema,
 *   notes: z.string().optional(),
 * });
 */
export const versionedSchema = {
  version: z.number().int(VM.version.int).positive(VM.version.positive),
};
