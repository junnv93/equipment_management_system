import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SiteEnum } from '@equipment-management/schemas';

export const previewEquipmentMigrationSchema = z.object({
  /** 관리번호 없는 행에 자동으로 관리번호 생성 */
  autoGenerateManagementNumber: z
    .union([z.boolean(), z.string().transform((v) => v === 'true')])
    .optional()
    .default(false),
  /** 관리번호/사이트가 없는 행의 기본 사이트 */
  defaultSite: SiteEnum.optional(),
  /** 중복 행 건너뛰기 (false이면 에러로 처리) */
  skipDuplicates: z
    .union([z.boolean(), z.string().transform((v) => v === 'true')])
    .optional()
    .default(true),
});

export type PreviewEquipmentMigrationDto = z.infer<typeof previewEquipmentMigrationSchema>;

export const PreviewEquipmentMigrationPipe = new ZodValidationPipe(previewEquipmentMigrationSchema);

/** Swagger 문서용 클래스 */
export class PreviewEquipmentMigrationSwagger {
  @ApiProperty({ description: '관리번호 자동 생성 여부', default: false, required: false })
  autoGenerateManagementNumber?: boolean;

  @ApiProperty({
    description: '기본 사이트 (suwon | uiwang | pyeongtaek)',
    required: false,
  })
  defaultSite?: string;

  @ApiProperty({ description: '중복 행 건너뛰기 여부', default: true, required: false })
  skipDuplicates?: boolean;
}
