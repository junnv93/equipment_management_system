import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateEquipmentInput, EquipmentStatus } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { updateEquipmentSchema } from '@equipment-management/schemas';

/**
 * 장비 업데이트 DTO
 * 모든 필드가 선택적입니다.
 */
export class UpdateEquipmentDto implements Partial<UpdateEquipmentInput> {
  @ApiPropertyOptional({ description: '장비명' })
  name?: string;

  @ApiPropertyOptional({ description: '관리번호' })
  managementNumber?: string;

  @ApiPropertyOptional({ description: '자산번호' })
  assetNumber?: string;

  @ApiPropertyOptional({ description: '모델명' })
  modelName?: string;

  @ApiPropertyOptional({ description: '제조사' })
  manufacturer?: string;

  @ApiPropertyOptional({ description: '일련번호' })
  serialNumber?: string;

  @ApiPropertyOptional({ description: '위치' })
  location?: string;

  @ApiPropertyOptional({ description: '설명' })
  description?: string;

  @ApiPropertyOptional({ description: '교정 주기 (개월)' })
  calibrationCycle?: number;

  @ApiPropertyOptional({ description: '최종 교정일' })
  lastCalibrationDate?: Date;

  @ApiPropertyOptional({ description: '차기 교정일' })
  nextCalibrationDate?: Date;

  @ApiPropertyOptional({ description: '교정 기관' })
  calibrationAgency?: string;

  @ApiPropertyOptional({ description: '중간 점검 필요 여부' })
  needsIntermediateCheck?: boolean;

  @ApiPropertyOptional({ description: '교정 방법' })
  calibrationMethod?: 'external_calibration' | 'self_inspection' | 'not_applicable';

  @ApiPropertyOptional({ description: '구매 연도' })
  purchaseYear?: number;

  @ApiPropertyOptional({ description: '팀 ID (UUID)' })
  teamId?: string;

  @ApiPropertyOptional({ description: '관리자 ID' })
  managerId?: string;

  @ApiPropertyOptional({
    description: '사이트',
    enum: ['suwon', 'uiwang'],
    example: 'suwon',
  })
  site?: 'suwon' | 'uiwang';

  @ApiPropertyOptional({ description: '공급사' })
  supplier?: string;

  @ApiPropertyOptional({ description: '연락처' })
  contactInfo?: string;

  @ApiPropertyOptional({ description: '소프트웨어 버전' })
  softwareVersion?: string;

  @ApiPropertyOptional({ description: '펌웨어 버전' })
  firmwareVersion?: string;

  @ApiPropertyOptional({ description: '메뉴얼 위치' })
  manualLocation?: string;

  @ApiPropertyOptional({ description: '부속품' })
  accessories?: string;

  @ApiPropertyOptional({ description: '주요 기능' })
  mainFeatures?: string;

  @ApiPropertyOptional({ description: '기술 책임자' })
  technicalManager?: string;

  // 추가 필수 필드 (프롬프트 3 요구사항)
  @ApiPropertyOptional({ description: '장비 타입' })
  equipmentType?: string;

  @ApiPropertyOptional({ description: '교정 결과' })
  calibrationResult?: string;

  @ApiPropertyOptional({ description: '보정계수' })
  correctionFactor?: string;

  @ApiPropertyOptional({ description: '중간점검일정' })
  intermediateCheckSchedule?: Date;

  @ApiPropertyOptional({ description: '장비 수리 내역' })
  repairHistory?: string;

  @ApiPropertyOptional({
    description: '장비 상태',
    enum: [
      'available',
      'in_use',
      'checked_out',
      'calibration_scheduled',
      'calibration_overdue',
      'under_maintenance',
      'retired',
    ],
    example: 'in_use',
  })
  status?: EquipmentStatus;

  // 승인 프로세스 필드
  @ApiPropertyOptional({
    description: '승인 상태',
    enum: ['pending_approval', 'approved', 'rejected'],
  })
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
}

// Zod 검증 파이프 생성
export const UpdateEquipmentValidationPipe = new ZodValidationPipe(updateEquipmentSchema);
