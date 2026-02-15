import { SetMetadata } from '@nestjs/common';

/**
 * 감사 로그 메타데이터 키
 */
export const AUDIT_LOG_KEY = 'auditLog';

/**
 * 감사 로그 메타데이터 인터페이스
 */
export interface AuditLogMetadata {
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'approve'
    | 'reject'
    | 'checkout'
    | 'return'
    | 'cancel'
    | 'login'
    | 'logout'
    | 'close'
    | 'reject_correction';
  entityType:
    | 'equipment'
    | 'calibration'
    | 'checkout'
    | 'rental'
    | 'user'
    | 'team'
    | 'calibration_factor'
    | 'non_conformance'
    | 'software'
    | 'calibration_plan'
    | 'repair_history'
    | 'equipment_import'
    | 'location_history'
    | 'maintenance_history'
    | 'incident_history'
    | 'settings';
  /**
   * 엔티티 ID를 추출하는 함수 또는 파라미터 경로
   * - 함수: (request, response) => entityId
   * - 문자열: 'params.uuid', 'body.id', 'response.uuid' 등
   */
  entityIdPath?: string;
  /**
   * 엔티티 이름을 추출하는 함수 또는 경로
   * - 문자열: 'body.name', 'response.name' 등
   */
  entityNamePath?: string;
  /**
   * 변경 전 값을 포함할지 여부 (update/delete 시 유용)
   */
  trackPreviousValue?: boolean;
}

/**
 * 감사 로그 데코레이터
 *
 * 사용 예시:
 * ```typescript
 * @AuditLog({
 *   action: 'create',
 *   entityType: 'equipment',
 *   entityIdPath: 'response.uuid',
 *   entityNamePath: 'response.name',
 * })
 * @Post()
 * create(@Body() dto: CreateDto) { ... }
 *
 * @AuditLog({
 *   action: 'approve',
 *   entityType: 'calibration',
 *   entityIdPath: 'params.uuid',
 * })
 * @Patch(':uuid/approve')
 * approve(@Param('uuid') uuid: string) { ... }
 * ```
 */
export const AuditLog = (metadata: AuditLogMetadata): MethodDecorator =>
  SetMetadata(AUDIT_LOG_KEY, metadata);
