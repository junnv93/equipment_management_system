import { z } from 'zod';
import {
  CalibrationMethodEnum,
  EquipmentStatusEnum,
  SiteEnum,
  SiteCodeEnum,
  ClassificationEnum,
  SharedSourceEnum,
  SoftwareTypeEnum,
  SpecMatchEnum,
  CalibrationRequiredEnum,
} from './enums';
import { ApprovalStatusEnum } from './equipment-request';
import { SoftDeleteEntity, PaginatedResponse } from './common/base';

/**
 * 장비 스키마
 *
 * ✅ 구조 개선 완료 (T3 Stack 패턴):
 * - Drizzle 스키마가 `@equipment-management/db` 패키지로 이동됨
 * - 이제 `packages/db/src/schema/equipment.ts`가 단일 소스입니다
 *
 * 📋 스키마 변경 체크리스트:
 * 1. `packages/db/src/schema/equipment.ts` 수정 (단일 소스)
 * 2. 이 파일(Zod 스키마)도 함께 업데이트하여 동기화 유지
 * 3. 필드 추가/삭제 시 양쪽 모두 반영
 * 4. `pnpm --filter @equipment-management/schemas build` 실행하여 빌드 확인
 *
 * 🔄 향후 개선 방향:
 * - Zod v4 호환성 해결 후 drizzle-zod 자동 생성 활성화
 *   - `import { equipment } from '@equipment-management/db/schema/equipment';`
 *   - `export const equipmentSchema = createSelectSchema(equipment);`
 * - 자세한 내용: docs/development/schema-sync-strategies.md 참고
 */

// 기본 장비 스키마 (공통 필드)
// Zod v4 호환: .default()를 사용하는 필드는 생성 시 선택적으로 처리
// ⚠️ 주의: name과 managementNumber는 생성 시 필수이지만, 업데이트 시에는 선택적입니다.
// updateEquipmentSchema에서 .partial()을 사용하여 모든 필드를 선택적으로 만듭니다.
export const baseEquipmentSchema = z.object({
  // 필수 필드 (생성 시에만 필수, 업데이트 시에는 .partial()로 선택적)
  name: z.string().min(2).max(100),
  managementNumber: z.string().min(2).max(50),

  // 관리번호 컴포넌트 (선택적 - 서비스 레이어에서 파싱하여 자동 설정)
  // 관리번호 형식: XXX-XYYYY (시험소코드 3자리 - 분류코드 1자리 + 일련번호 4자리)
  siteCode: SiteCodeEnum.optional(), // 시험소코드: SUW, UIW, PYT
  classificationCode: z.enum(['E', 'R', 'W', 'S', 'A', 'P']).optional(), // 분류코드
  managementSerialNumber: z.number().int().min(1).max(9999).optional(), // 일련번호: 1~9999
  classification: ClassificationEnum.optional(), // 분류 (프론트엔드 입력용)

  // 선택적 필드
  assetNumber: z.string().optional(),
  modelName: z.string().optional(),
  manufacturer: z.string().optional(),
  manufacturerContact: z.string().optional(), // 제조사 연락처 (신규)
  serialNumber: z.string().optional(), // 라벨: 일련번호
  location: z.string().optional(),
  description: z.string().optional(), // 라벨: 장비사양

  // 시방일치 여부 및 교정필요 여부 (신규)
  specMatch: SpecMatchEnum.optional(), // 시방일치 여부: 'match' | 'mismatch'
  calibrationRequired: CalibrationRequiredEnum.optional(), // 교정필요 여부: 'required' | 'not_required'

  // 교정 정보
  calibrationCycle: z.number().int().positive().optional(),
  lastCalibrationDate: z.coerce.date().optional(),
  nextCalibrationDate: z.coerce.date().optional(),
  calibrationAgency: z.string().optional(), // placeholder: HCT
  // 기본값이 있는 필드는 생성 시 선택적으로 처리 (서비스 레이어에서 기본값 적용)
  needsIntermediateCheck: z.boolean().optional(),
  calibrationMethod: CalibrationMethodEnum.optional(), // 라벨: 관리 방법

  // 중간점검 정보 (신규: 3개 필드로 분리)
  lastIntermediateCheckDate: z.coerce.date().optional(), // 최종 중간 점검일
  intermediateCheckCycle: z.number().int().positive().optional(), // 중간점검 주기 (개월)
  nextIntermediateCheckDate: z.coerce.date().optional(), // 차기 중간 점검일

  // 관리 정보
  purchaseYear: z.number().int().min(1990).max(2100).optional().nullable(), // 구입년도 (연도 정수)
  price: z.number().int().positive().nullable().optional(), // DB와 동기화: price (integer)
  teamId: z.string().uuid().optional().nullable(), // ✅ 스키마 일치화: uuid 타입으로 변경
  site: SiteEnum, // ✅ 사이트별 권한 관리: 필수 필드로 변경

  // 추가 정보
  supplier: z.string().optional(),
  contactInfo: z.string().optional(),
  softwareVersion: z.string().optional(),
  firmwareVersion: z.string().optional(),

  // 소프트웨어 정보 (프롬프트 9-1)
  softwareName: z.string().optional(), // 소프트웨어명 (EMC32, UL EMC, DASY6 SAR 등)
  softwareType: SoftwareTypeEnum.optional(), // 'measurement' | 'analysis' | 'control' | 'other'
  manualLocation: z.string().optional(),
  accessories: z.string().optional(),
  mainFeatures: z.string().optional(), // DB와 동기화: 주요 기능
  technicalManager: z.string().optional(), // 기술책임자 (사이트/팀 기준 필터링 Select)

  // 장비 타입 (DB와 동기화)
  equipmentType: z.string().optional(), // 장비 타입

  // 위치 및 설치 정보 (신규)
  initialLocation: z.string().optional(), // 최초 설치 위치
  installationDate: z.coerce.date().optional(), // 설치 일시

  // 승인 프로세스 필드
  approvalStatus: ApprovalStatusEnum.optional(),
  requestedBy: z.string().uuid().optional(),
  approvedBy: z.string().uuid().optional(),

  // 추가 필드 (정리됨)
  calibrationResult: z.string().optional(), // 교정 결과
  correctionFactor: z.string().optional(), // 보정계수

  // 상태 정보 (기본값이 있지만 생성 시 선택적)
  status: EquipmentStatusEnum.optional(),

  // 공용장비 필드 (프롬프트 8-1)
  // 기본값은 서비스 레이어에서 처리 (DB 기본값: false)
  isShared: z.boolean().optional(), // 공용장비 여부
  sharedSource: SharedSourceEnum.optional().nullable(), // 공용장비 출처: 'safety_lab' | 'external' | null
  owner: z.string().optional().nullable(), // 소유처 (공용장비: 팀명, 렌탈장비: 업체명)
  externalIdentifier: z.string().optional().nullable(), // 소유처 원본 식별번호 (예: SAF-EQ-1234)
  usagePeriodStart: z.coerce.date().optional().nullable(), // 사용 시작일 (임시등록 전용)
  usagePeriodEnd: z.coerce.date().optional().nullable(), // 사용 종료일 (임시등록 전용)
});

// 장비 생성 스키마
// 필수 필드만 명시하고 나머지는 선택적으로 처리
// 기본값이 필요한 필드는 서비스 레이어에서 처리
export const createEquipmentSchema = baseEquipmentSchema;

// 장비 업데이트 스키마
export const updateEquipmentSchema = baseEquipmentSchema.partial();

// 장비 조회용 스키마
// DB 스키마 (packages/db/src/schema/equipment.ts)와 동기화
export const equipmentSchema = baseEquipmentSchema.extend({
  id: z.string().uuid(), // DB와 동기화: uuid로 변경 (serial에서 변경됨)
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // DB에 있는 추가 필드들
  managerId: z.string().optional().nullable(), // 담당자 ID
  intermediateCheckSchedule: z.coerce.date().optional().nullable(), // 중간점검 일정
  repairHistory: z.string().optional().nullable(), // 수리 내역
});

// 장비 검색 필터 스키마
// 쿼리 파라미터는 모두 선택적이며, 페이지네이션도 선택적입니다
export const equipmentFilterSchema = z.object({
  search: z.string().optional(),
  status: EquipmentStatusEnum.optional(),
  teamId: z.string().uuid().optional(),
  location: z.string().optional(),
  manufacturer: z.string().optional(),
  site: SiteEnum.optional(),
  classification: ClassificationEnum.optional(), // 분류 필터 (fcc_emc_rf, general_emc 등)
  classificationCode: z.enum(['E', 'R', 'W', 'S', 'A', 'P']).optional(), // 분류코드 필터
  calibrationMethod: CalibrationMethodEnum.optional(), // 교정 방법 필터 (외부교정/자체점검/비대상)
  calibrationDue: z.coerce.number().int().positive().optional(), // 숫자(일)로 변환 - N일 이내 교정 임박
  calibrationDueAfter: z.coerce.number().int().positive().optional(), // 숫자(일)로 변환 - N일 이후 교정 여유
  calibrationOverdue: z
    .preprocess((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    }, z.boolean())
    .optional(), // 교정 기한 초과 필터 (true: 기한 초과된 장비만) - status와 독립적으로 작동
  sort: z.string().optional(), // 정렬 기준 (예: 'name.asc')
  isShared: z
    .preprocess((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    }, z.boolean())
    .optional(), // 공용장비 필터 (true: 공용장비만, false: 일반장비만)
  // 페이지네이션은 선택적이며, 기본값은 서비스 레이어에서 처리
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

// 타입 정의
export type BaseEquipment = z.infer<typeof baseEquipmentSchema>;
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type Equipment = z.infer<typeof equipmentSchema> & SoftDeleteEntity;
export type EquipmentFilter = z.infer<typeof equipmentFilterSchema>;

/**
 * ✅ API 응답용 장비 타입 (팀 이름 포함)
 *
 * 백엔드 API 응답에서 팀 테이블과 조인하여 반환되는 데이터 형식입니다.
 * 프론트엔드에서 추가 API 호출 없이 팀 이름을 표시할 수 있습니다.
 *
 * @example
 * // API 응답
 * {
 *   id: "uuid-1234",
 *   name: "Receiver",
 *   teamId: "team-uuid-5678",
 *   teamName: "RF팀(수원)",  // ← 조인된 팀 이름
 *   ...
 * }
 */
export const equipmentResponseSchema = equipmentSchema.extend({
  teamName: z.string().nullable().optional(), // 팀 테이블에서 조인된 팀 이름
});
export type EquipmentResponse = z.infer<typeof equipmentResponseSchema>;

// 장비 목록 조회를 위한 응답 스키마 (팀 이름 포함)
export const equipmentListResponseSchema = PaginatedResponse(equipmentResponseSchema);
export type EquipmentListResponse = z.infer<typeof equipmentListResponseSchema>;

// 타입 가드
export const isEquipment = (value: unknown): value is Equipment => {
  try {
    return equipmentSchema.parse(value) !== null;
  } catch {
    return false;
  }
};
