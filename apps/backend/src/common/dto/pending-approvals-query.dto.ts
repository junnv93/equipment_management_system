import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { SiteEnum, type Site, uuidString, VM } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * 승인 대기 목록 공용 쿼리 스키마 (SSOT)
 *
 * calibration, calibration-factors, software 등 여러 모듈의
 * findPendingApprovals() 엔드포인트에서 공통으로 사용하는 쿼리 파라미터.
 *
 * @SiteScoped 데코레이터가 site/teamId를 자동 주입하므로
 * 클라이언트가 직접 설정할 필요는 없지만, Zod 검증으로 타입 안전성을 보장합니다.
 */
export const pendingApprovalsQuerySchema = z.object({
  /** @SiteScoped에 의해 자동 주입 */
  site: SiteEnum.optional(),
  /** @SiteScoped(team 스코프)에 의해 자동 주입 */
  teamId: uuidString(VM.uuid.invalid('팀')).optional(),
});

export type PendingApprovalsQueryInput = z.infer<typeof pendingApprovalsQuerySchema>;

export const PendingApprovalsQueryPipe = new ZodValidationPipe(pendingApprovalsQuerySchema, {
  targets: ['query'],
});

/** Swagger 문서화용 DTO 클래스 */
export class PendingApprovalsQueryDto {
  @ApiProperty({
    description: '사이트 필터 (@SiteScoped 자동 주입)',
    enum: SiteEnum.options,
    required: false,
  })
  site?: Site;

  @ApiProperty({
    description: '팀 UUID 필터 (@SiteScoped team 스코프 자동 주입)',
    required: false,
  })
  teamId?: string;
}
