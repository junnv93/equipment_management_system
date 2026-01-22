import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
// ✅ Single Source of Truth: schemas 패키지에서 import
import { RentalTypeEnum, RentalType } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 대여 생성 스키마
 */
export const createRentalSchema = z.object({
  equipmentId: z.string().uuid('유효한 UUID 형식이 아닙니다'),
  userId: z.string().uuid('유효한 UUID 형식이 아닙니다').optional(),
  type: RentalTypeEnum.optional(),
  startDate: z.string().datetime().optional(),
  expectedEndDate: z.string().datetime({ message: '유효한 날짜 형식이 아닙니다' }),
  purpose: z.string().min(1, '대여 목적을 입력해주세요'),
  location: z.string().optional(),
  approverId: z.string().uuid('유효한 UUID 형식이 아닙니다').optional(),
  notes: z.string().optional(),
});

export type CreateRentalInput = z.infer<typeof createRentalSchema>;
export const CreateRentalValidationPipe = new ZodValidationPipe(createRentalSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateRentalDto {
  @ApiProperty({
    description: '대여할 장비 UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  equipmentId: string;

  @ApiProperty({
    description: '대여 신청자 UUID (서버에서 JWT에서 자동 설정, 클라이언트에서 보내지 않음)',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  userId?: string;

  // Note: type 필드는 현재 loans 테이블에 없지만, 향후 확장을 위해 유지
  // 실제로는 모든 rentals가 'internal' (같은 시험소 내 대여)
  @ApiProperty({
    description: '대여 유형 (현재는 internal만 사용)',
    enum: RentalTypeEnum,
    example: 'internal',
    required: false,
  })
  type?: RentalType;

  @ApiProperty({
    description: '대여 시작 일시 (ISO 형식)',
    example: '2023-06-01T09:00:00Z',
    required: false,
  })
  startDate?: string;

  @ApiProperty({
    description: '예상 반납 일시 (ISO 형식)',
    example: '2023-06-15T18:00:00Z',
  })
  expectedEndDate: string;

  @ApiProperty({
    description: '대여 목적',
    example: '프로젝트 A 테스트를 위한 장비 대여',
  })
  purpose: string;

  @ApiProperty({
    description: '대여 장소 (선택사항)',
    example: '연구소 2층 테스트실',
    required: false,
  })
  location?: string;

  @ApiProperty({
    description: '승인자 UUID (선택사항, 승인 시 자동 설정)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  approverId?: string;

  @ApiProperty({
    description: '추가 비고 사항',
    example: '테스트 완료 후 즉시 반납 예정',
    required: false,
  })
  notes?: string;
}
