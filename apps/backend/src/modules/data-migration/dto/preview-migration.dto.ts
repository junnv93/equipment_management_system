import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
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

export class PreviewEquipmentMigrationDto extends createZodDto(previewEquipmentMigrationSchema) {}

export const PreviewEquipmentMigrationPipe = new ZodValidationPipe(previewEquipmentMigrationSchema);
