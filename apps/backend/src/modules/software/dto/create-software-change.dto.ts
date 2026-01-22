import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 소프트웨어 변경 등록 스키마
 */
export const createSoftwareChangeSchema = z.object({
  equipmentId: z.string().uuid({ message: '유효한 장비 UUID가 아닙니다' }),
  softwareName: z
    .string()
    .min(1, '소프트웨어명을 입력해주세요')
    .max(200, '소프트웨어명은 200자 이하여야 합니다'),
  previousVersion: z.string().max(50, '이전 버전은 50자 이하여야 합니다').optional(),
  newVersion: z.string().min(1, '새 버전을 입력해주세요').max(50, '새 버전은 50자 이하여야 합니다'),
  verificationRecord: z.string().min(1, '검증 기록은 필수입니다'),
  changedBy: z.string().uuid({ message: '유효한 변경자 UUID가 아닙니다' }),
});

export type CreateSoftwareChangeInput = z.infer<typeof createSoftwareChangeSchema>;
export const CreateSoftwareChangeValidationPipe = new ZodValidationPipe(createSoftwareChangeSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateSoftwareChangeDto {
  @ApiProperty({
    description: '장비 UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  equipmentId: string;

  @ApiProperty({
    description: '소프트웨어명 (EMC32, UL EMC, DASY6 SAR 등)',
    example: 'EMC32',
  })
  softwareName: string;

  @ApiProperty({
    description: '이전 버전 (최초 등록 시 생략 가능)',
    example: '10.2.0',
    required: false,
  })
  previousVersion?: string;

  @ApiProperty({
    description: '새 버전',
    example: '10.3.0',
  })
  newVersion: string;

  @ApiProperty({
    description: '검증 기록 (변경 후 검증 내용) - 필수',
    example: '변경 후 테스트 완료. 기존 측정 결과와 비교하여 0.1dB 이내 차이 확인.',
  })
  verificationRecord: string;

  @ApiProperty({
    description: '변경자 UUID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  changedBy: string;
}
