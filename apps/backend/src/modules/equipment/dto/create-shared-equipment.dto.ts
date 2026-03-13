import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  CalibrationMethodEnum,
  CALIBRATION_METHOD_VALUES,
  SharedSourceEnum,
  SHARED_SOURCE_VALUES,
  SiteEnum,
  type CalibrationMethod,
  type SharedSource,
  type Site,
} from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * 공용장비 생성 스키마 (Zod)
 *
 * 공용장비는 최소 정보만 필수로 요구합니다.
 * - name: 장비명 (필수)
 * - managementNumber: 관리번호 (필수)
 * - sharedSource: 공용장비 출처 (필수)
 * - site: 사이트 (필수)
 *
 * 교정성적서 파일은 별도로 첨부 가능합니다.
 */
export const createSharedEquipmentSchema = z.object({
  // 필수 필드
  name: z.string().min(2).max(100),
  managementNumber: z.string().min(2).max(50),
  sharedSource: SharedSourceEnum,
  site: SiteEnum,

  // 선택적 필드 (공용장비도 추가 정보 입력 가능)
  modelName: z.string().optional(),
  manufacturer: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),

  // 교정 정보 (공용장비도 교정 정보 입력 가능)
  calibrationCycle: z.number().int().positive().optional(),
  lastCalibrationDate: z.coerce.date().optional(),
  nextCalibrationDate: z.coerce.date().optional(),
  calibrationAgency: z.string().optional(),
  calibrationMethod: CalibrationMethodEnum.optional(),
});

export type CreateSharedEquipmentInput = z.infer<typeof createSharedEquipmentSchema>;

/**
 * 공용장비 생성 DTO
 *
 * 공용장비 등록을 위한 간소화된 DTO입니다.
 * - 최소 필수 필드: name, managementNumber, sharedSource, site
 * - 교정성적서 파일 첨부 지원
 */
export class CreateSharedEquipmentDto implements CreateSharedEquipmentInput {
  @ApiProperty({
    description: '장비명',
    example: 'Safety Lab 공용 스펙트럼 분석기',
  })
  name: string;

  @ApiProperty({
    description: '관리번호',
    example: 'SHARED-2024-001',
  })
  managementNumber: string;

  @ApiProperty({
    description: '공용장비 출처',
    enum: SHARED_SOURCE_VALUES,
    example: 'safety_lab',
  })
  sharedSource: SharedSource;

  @ApiProperty({
    description: '사이트 (필수)',
    enum: SiteEnum.options,
    example: 'suwon',
  })
  site: Site;

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

  @ApiPropertyOptional({ description: '교정 주기 (개월)', example: 12 })
  calibrationCycle?: number;

  @ApiPropertyOptional({ description: '최종 교정일' })
  lastCalibrationDate?: Date;

  @ApiPropertyOptional({ description: '차기 교정일' })
  nextCalibrationDate?: Date;

  @ApiPropertyOptional({ description: '교정 기관' })
  calibrationAgency?: string;

  @ApiPropertyOptional({
    description: '교정 방법',
    enum: CALIBRATION_METHOD_VALUES,
  })
  calibrationMethod?: CalibrationMethod;
}

// Zod 검증 파이프 생성
export const CreateSharedEquipmentValidationPipe = new ZodValidationPipe(
  createSharedEquipmentSchema
);
