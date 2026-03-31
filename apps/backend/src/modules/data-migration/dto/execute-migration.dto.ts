import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SiteEnum } from '@equipment-management/schemas';

export const executeEquipmentMigrationSchema = z.object({
  /** Preview에서 반환된 sessionId */
  sessionId: z.string().uuid({ message: 'sessionId는 유효한 UUID여야 합니다.' }),
  /** 관리번호 없는 행에 자동으로 관리번호 생성 (Preview와 동일하게 설정) */
  autoGenerateManagementNumber: z.boolean().optional().default(false),
  /** 기본 사이트 */
  defaultSite: SiteEnum.optional(),
  /** 중복 행 건너뛰기 */
  skipDuplicates: z.boolean().optional().default(true),
  /** 실행할 행 번호 목록 (생략 시 유효 행 전체) */
  selectedRows: z.array(z.number().int().positive()).optional(),
});

export type ExecuteEquipmentMigrationDto = z.infer<typeof executeEquipmentMigrationSchema>;

export const ExecuteEquipmentMigrationPipe = new ZodValidationPipe(executeEquipmentMigrationSchema);

/** Swagger 문서용 클래스 */
export class ExecuteEquipmentMigrationSwagger {
  @ApiProperty({ description: 'Preview에서 발급된 sessionId' })
  sessionId!: string;

  @ApiProperty({ description: '관리번호 자동 생성 여부', default: false, required: false })
  autoGenerateManagementNumber?: boolean;

  @ApiProperty({ description: '기본 사이트', required: false })
  defaultSite?: string;

  @ApiProperty({ description: '중복 행 건너뛰기 여부', default: true, required: false })
  skipDuplicates?: boolean;

  @ApiProperty({
    description: '실행할 행 번호 목록 (생략 시 전체)',
    required: false,
    type: [Number],
  })
  selectedRows?: number[];
}
