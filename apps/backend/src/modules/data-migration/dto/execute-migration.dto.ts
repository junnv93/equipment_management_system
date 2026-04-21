import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
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

export class ExecuteEquipmentMigrationDto extends createZodDto(executeEquipmentMigrationSchema) {}

export const ExecuteEquipmentMigrationPipe = new ZodValidationPipe(executeEquipmentMigrationSchema);
