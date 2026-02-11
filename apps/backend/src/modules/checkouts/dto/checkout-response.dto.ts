import { ApiProperty } from '@nestjs/swagger';

/**
 * 사용자 정보 DTO (중첩)
 */
class UserInfoDto {
  @ApiProperty({ description: '사용자 UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: '사용자 이름', example: '홍길동' })
  name: string;

  @ApiProperty({ description: '사용자 역할', example: 'test_engineer' })
  role: string;

  @ApiProperty({
    description: '팀 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  teamId?: string | null;
}

/**
 * 장비 정보 DTO (중첩)
 */
class EquipmentInfoDto {
  @ApiProperty({ description: '장비 UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: '장비명', example: '디지털 멀티미터' })
  name: string;

  @ApiProperty({ description: '관리번호', example: 'SUW-E-0001' })
  managementNumber: string;

  @ApiProperty({ description: '장비 상태', example: 'available' })
  status: string;

  @ApiProperty({ description: '분류', example: 'electronic' })
  classification: string;
}

/**
 * 반출 항목 DTO (중첩)
 */
class CheckoutItemDto {
  @ApiProperty({ description: '항목 UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: '반출 UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  checkoutId: string;

  @ApiProperty({ description: '장비 UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  equipmentId: string;

  @ApiProperty({ description: '반출 전 상태', required: false })
  conditionBefore?: string | null;

  @ApiProperty({ description: '반입 후 상태', required: false })
  conditionAfter?: string | null;

  @ApiProperty({ description: '검사 비고', required: false })
  inspectionNotes?: string | null;

  @ApiProperty({ description: '등록일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;

  @ApiProperty({ description: '장비 정보', type: EquipmentInfoDto, required: false })
  equipment?: EquipmentInfoDto;
}

/**
 * 반출 응답 DTO
 *
 * Swagger 문서화 및 타입 안정성을 위한 반출 응답 데이터 구조
 */
export class CheckoutResponseDto {
  // ============================================================================
  // 기본 정보
  // ============================================================================

  @ApiProperty({ description: '반출 UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: '등록일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;

  @ApiProperty({
    description: '낙관적 잠금 버전 (Optimistic Locking Version)',
    example: 1,
    type: Number,
  })
  version: number;

  // ============================================================================
  // 사용자 정보
  // ============================================================================

  @ApiProperty({ description: '신청자 UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  requesterId: string;

  @ApiProperty({
    description: '승인자 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  approverId?: string | null;

  @ApiProperty({
    description: '반입 처리자 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  returnerId?: string | null;

  @ApiProperty({ description: '신청자 정보', type: UserInfoDto, required: false })
  requester?: UserInfoDto;

  @ApiProperty({ description: '승인자 정보', type: UserInfoDto, required: false })
  approver?: UserInfoDto;

  @ApiProperty({ description: '반입 처리자 정보', type: UserInfoDto, required: false })
  returner?: UserInfoDto;

  // ============================================================================
  // 반출 정보
  // ============================================================================

  @ApiProperty({
    description: '반출 목적',
    example: 'calibration',
    enum: ['calibration', 'repair', 'rental', 'return_to_vendor'],
  })
  purpose: string;

  @ApiProperty({ description: '반출 유형', example: 'calibration' })
  checkoutType: string;

  @ApiProperty({ description: '반출지', example: '외부 교정기관' })
  destination: string;

  @ApiProperty({ description: '빌려주는 팀 ID', required: false })
  lenderTeamId?: string | null;

  @ApiProperty({ description: '빌려주는 사이트 ID', required: false })
  lenderSiteId?: string | null;

  @ApiProperty({ description: '연락처', example: '010-1234-5678', required: false })
  phoneNumber?: string | null;

  @ApiProperty({ description: '주소', required: false })
  address?: string | null;

  @ApiProperty({ description: '반출 사유', example: '정기 교정' })
  reason: string;

  // ============================================================================
  // 날짜 정보
  // ============================================================================

  @ApiProperty({ description: '실제 반출일', required: false })
  checkoutDate?: Date | null;

  @ApiProperty({ description: '예상 반입일' })
  expectedReturnDate: Date;

  @ApiProperty({ description: '실제 반입일', required: false })
  actualReturnDate?: Date | null;

  // ============================================================================
  // 상태 및 승인 정보
  // ============================================================================

  @ApiProperty({ description: '반출 상태', example: 'pending' })
  status: string;

  @ApiProperty({ description: '승인 일시', required: false })
  approvedAt?: Date | null;

  @ApiProperty({ description: '반려 사유', required: false })
  rejectionReason?: string | null;

  // ============================================================================
  // 반입 검사 정보
  // ============================================================================

  @ApiProperty({ description: '교정 확인 여부', required: false })
  calibrationChecked?: boolean | null;

  @ApiProperty({ description: '수리 확인 여부', required: false })
  repairChecked?: boolean | null;

  @ApiProperty({ description: '작동 상태 확인 여부', required: false })
  workingStatusChecked?: boolean | null;

  @ApiProperty({ description: '검사 비고', required: false })
  inspectionNotes?: string | null;

  // ============================================================================
  // 반입 승인 정보
  // ============================================================================

  @ApiProperty({
    description: '반입 최종 승인자 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  returnApprovedBy?: string | null;

  @ApiProperty({ description: '반입 최종 승인 일시', required: false })
  returnApprovedAt?: Date | null;

  @ApiProperty({ description: '반입 최종 승인자 정보', type: UserInfoDto, required: false })
  returnApprover?: UserInfoDto;

  // ============================================================================
  // 대여 확인 정보
  // ============================================================================

  @ApiProperty({
    description: '빌려준 측 확인자 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  lenderConfirmedBy?: string | null;

  @ApiProperty({ description: '빌려준 측 확인 일시', required: false })
  lenderConfirmedAt?: Date | null;

  @ApiProperty({ description: '빌려준 측 확인 메모', required: false })
  lenderConfirmNotes?: string | null;

  @ApiProperty({ description: '빌려준 측 확인자 정보', type: UserInfoDto, required: false })
  lenderConfirmer?: UserInfoDto;

  // ============================================================================
  // 반출 항목 (장비 목록)
  // ============================================================================

  @ApiProperty({ description: '반출 항목 목록', type: [CheckoutItemDto], required: false })
  items?: CheckoutItemDto[];

  @ApiProperty({ description: '장비 목록 (간편 접근)', type: [EquipmentInfoDto], required: false })
  equipment?: EquipmentInfoDto[];
}
