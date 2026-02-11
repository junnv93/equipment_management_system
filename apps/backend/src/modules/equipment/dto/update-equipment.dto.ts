import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  UpdateEquipmentInput,
  EquipmentStatus,
  Site,
  Classification,
  SiteCode,
} from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { updateEquipmentSchema } from '@equipment-management/schemas';
import { VersionedDto } from '../../../common/dto/base-versioned.dto';

/**
 * 장비 업데이트 DTO
 *
 * ✅ Optimistic Locking: VersionedDto 상속으로 version 필드 자동 포함
 * ✅ Phase 1: Equipment Module - 2026-02-11
 * ✅ 참고: ApproveCheckoutDto와 동일한 패턴
 *
 * 모든 필드가 선택적입니다.
 */
export class UpdateEquipmentDto extends VersionedDto implements Partial<UpdateEquipmentInput> {
  // ✅ version 필드는 VersionedDto에서 자동 상속
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

  @ApiPropertyOptional({ description: '제조사 연락처' })
  manufacturerContact?: string;

  @ApiPropertyOptional({ description: '일련번호' })
  serialNumber?: string;

  @ApiPropertyOptional({ description: '위치' })
  location?: string;

  @ApiPropertyOptional({ description: '장비사양 (설명)' })
  description?: string;

  @ApiPropertyOptional({
    description: '시방일치 여부',
    enum: ['match', 'mismatch'],
  })
  specMatch?: 'match' | 'mismatch';

  @ApiPropertyOptional({
    description: '교정필요 여부',
    enum: ['required', 'not_required'],
  })
  calibrationRequired?: 'required' | 'not_required';

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

  @ApiPropertyOptional({
    description: '관리 방법 (교정 방법)',
    enum: ['external_calibration', 'self_inspection', 'not_applicable'],
  })
  calibrationMethod?: 'external_calibration' | 'self_inspection' | 'not_applicable';

  @ApiPropertyOptional({ description: '최종 중간 점검일' })
  lastIntermediateCheckDate?: Date;

  @ApiPropertyOptional({ description: '중간점검 주기 (개월)' })
  intermediateCheckCycle?: number;

  @ApiPropertyOptional({ description: '차기 중간 점검일' })
  nextIntermediateCheckDate?: Date;

  @ApiPropertyOptional({ description: '구매 연도' })
  purchaseYear?: number;

  @ApiPropertyOptional({ description: '팀 ID (UUID)' })
  teamId?: string;

  @ApiPropertyOptional({
    description: '사이트',
    enum: ['suwon', 'uiwang', 'pyeongtaek'],
    example: 'suwon',
  })
  site?: Site;

  @ApiPropertyOptional({
    description: '장비 분류 (관리번호 자동 생성용)',
    enum: ['fcc_emc_rf', 'general_emc', 'general_rf', 'sar', 'automotive_emc', 'software'],
  })
  classification?: Classification;

  @ApiPropertyOptional({
    description: '시험소코드',
    enum: ['SUW', 'UIW', 'PYT'],
  })
  siteCode?: SiteCode;

  @ApiPropertyOptional({
    description: '분류코드',
    enum: ['E', 'R', 'W', 'S', 'A', 'P'],
  })
  classificationCode?: 'E' | 'R' | 'W' | 'S' | 'A' | 'P';

  @ApiPropertyOptional({
    description: '관리번호 일련번호',
    example: 1,
  })
  managementSerialNumber?: number;

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

  @ApiPropertyOptional({ description: '기술 책임자 (사이트/팀 기준 필터링)' })
  technicalManager?: string;

  @ApiPropertyOptional({ description: '최초 설치 위치' })
  initialLocation?: string;

  @ApiPropertyOptional({ description: '설치 일시' })
  installationDate?: Date;

  @ApiPropertyOptional({ description: '교정 결과' })
  calibrationResult?: string;

  @ApiPropertyOptional({ description: '보정계수' })
  correctionFactor?: string;

  @ApiPropertyOptional({
    description: '장비 상태',
    enum: [
      'available',
      'in_use',
      'checked_out',
      'calibration_scheduled',
      'calibration_overdue',
      'non_conforming',
      'spare',
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
