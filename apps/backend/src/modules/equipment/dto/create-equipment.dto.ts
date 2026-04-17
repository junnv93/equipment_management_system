import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateEquipmentInput,
  EquipmentStatus,
  Classification,
  Site,
  SiteCode,
  EQUIPMENT_STATUS_VALUES,
  MANAGEMENT_METHOD_VALUES,
  SPEC_MATCH_VALUES,
  CALIBRATION_REQUIRED_VALUES,
  SHARED_SOURCE_VALUES,
  SiteEnum,
  ClassificationEnum,
  SiteCodeEnum,
  ClassificationCodeEnum,
  type ManagementMethod,
  type SpecMatch,
  type CalibrationRequired,
  type SharedSource,
  type ClassificationCode,
  ApprovalStatusEnum,
  type ApprovalStatus,
  createEquipmentSchema,
} from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * 장비 생성 DTO
 * Zod 스키마와 동기화된 명시적 DTO 정의
 * Reservations 모듈 패턴을 따름
 */
export class CreateEquipmentDto implements CreateEquipmentInput {
  @ApiProperty({ description: '장비명', example: 'RF 신호 분석기' })
  name: string;

  @ApiProperty({ description: '관리번호', example: 'EQP-2023-001' })
  managementNumber: string;

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

  @ApiPropertyOptional({ description: '설명 (장비사양)' })
  description?: string;

  @ApiPropertyOptional({
    description: '시방일치 여부',
    enum: SPEC_MATCH_VALUES,
  })
  specMatch?: SpecMatch;

  @ApiPropertyOptional({
    description: '교정필요 여부',
    enum: CALIBRATION_REQUIRED_VALUES,
  })
  calibrationRequired?: CalibrationRequired;

  @ApiPropertyOptional({ description: '교정 주기 (개월)', example: 12 })
  calibrationCycle?: number;

  @ApiPropertyOptional({ description: '최종 교정일' })
  lastCalibrationDate?: Date;

  @ApiPropertyOptional({ description: '차기 교정일' })
  nextCalibrationDate?: Date;

  @ApiPropertyOptional({ description: '교정 기관' })
  calibrationAgency?: string;

  @ApiPropertyOptional({ description: '중간 점검 필요 여부', default: false })
  needsIntermediateCheck?: boolean;

  @ApiPropertyOptional({
    description: '관리 방법 (교정 방법)',
    enum: MANAGEMENT_METHOD_VALUES,
  })
  managementMethod?: ManagementMethod;

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

  @ApiProperty({
    description: '사이트 (필수)',
    enum: SiteEnum.options,
    example: 'suwon',
  })
  site: Site;

  @ApiPropertyOptional({
    description: '장비 분류 (관리번호 자동 생성용)',
    enum: ClassificationEnum.options,
    example: 'fcc_emc_rf',
  })
  classification?: Classification;

  @ApiPropertyOptional({
    description: '관리번호 일련번호 (4자리 문자열, 예: 0001)',
    example: '0001',
  })
  managementSerialNumberStr?: string;

  // 관리번호 컴포넌트 (서비스에서 자동 파싱)
  @ApiPropertyOptional({
    description: '시험소코드 (자동 파싱)',
    enum: SiteCodeEnum.options,
  })
  siteCode?: SiteCode;

  @ApiPropertyOptional({
    description: '분류코드 (자동 파싱)',
    enum: ClassificationCodeEnum.options,
  })
  classificationCode?: ClassificationCode;

  @ApiPropertyOptional({
    description: '관리번호 일련번호 (정수, 자동 파싱)',
    example: 1,
  })
  managementSerialNumber?: number;

  @ApiPropertyOptional({ description: '공급사' })
  supplier?: string;

  @ApiPropertyOptional({ description: '공급사 연락처' })
  supplierContact?: string;

  @ApiPropertyOptional({ description: '펌웨어 버전' })
  firmwareVersion?: string;

  @ApiPropertyOptional({ description: '메뉴얼 위치' })
  manualLocation?: string;

  @ApiPropertyOptional({ description: '부속품' })
  accessories?: string;

  @ApiPropertyOptional({ description: '기술 책임자 (사이트/팀 기준 필터링)' })
  technicalManager?: string;

  @ApiPropertyOptional({ description: '담당자 ID (운영 책임자 정, UUID — 기술책임자 이상)' })
  managerId?: string | null;

  @ApiPropertyOptional({ description: '부담당자 ID (운영 책임자 부, UUID — 기술책임자 이상)' })
  deputyManagerId?: string | null;

  @ApiProperty({ description: '최초 설치 위치' })
  initialLocation: string;

  @ApiPropertyOptional({ description: '설치 일시' })
  installationDate?: Date;

  // 교정 결과 및 보정계수
  @ApiPropertyOptional({ description: '교정 결과' })
  calibrationResult?: string;

  @ApiPropertyOptional({ description: '보정계수' })
  correctionFactor?: string;

  @ApiPropertyOptional({
    description: '장비 상태',
    enum: EQUIPMENT_STATUS_VALUES,
    default: 'available',
    example: 'available',
  })
  status?: EquipmentStatus;

  // 승인 프로세스 필드 (시스템 관리자는 직접 승인 가능)
  @ApiPropertyOptional({
    description: '승인 상태',
    enum: ApprovalStatusEnum.options,
    default: 'pending_approval',
  })
  approvalStatus?: ApprovalStatus;

  // 공용장비 필드 (프롬프트 8-1)
  @ApiPropertyOptional({
    description: '공용장비 여부',
    default: false,
  })
  isShared?: boolean;

  @ApiPropertyOptional({
    description: '공용장비 출처',
    enum: SHARED_SOURCE_VALUES,
  })
  sharedSource?: SharedSource;
}

// Zod 검증 파이프 생성
export const CreateEquipmentValidationPipe = new ZodValidationPipe(createEquipmentSchema);
