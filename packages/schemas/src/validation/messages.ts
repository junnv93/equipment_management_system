/**
 * Validation Message Registry (SSOT)
 *
 * 모든 Zod DTO 검증 메시지의 단일 진실의 소스.
 * 각 DTO 파일은 이 레지스트리를 import하여 메시지를 참조합니다.
 *
 * 설계 원칙:
 * 1. 유니버설 메시지: 도메인 무관 검증 (UUID, 날짜, 필수 필드 등)
 * 2. 도메인 메시지: 특정 모듈 전용 검증 (반출 사유, 교정 기관 등)
 * 3. 파라미터화: 동적 값은 함수로 제공 (필드명, 최소/최대값 등)
 * 4. 일관된 어미: 모든 메시지는 마침표 없이 종결
 *
 * @example
 * import { VM } from '@equipment-management/schemas';
 * uuidString(VM.uuid.invalid('장비'))
 * z.string().min(1, VM.required('반출 사유'))
 */

// ============================================================================
// Universal Validation Messages (도메인 무관)
// ============================================================================

/** UUID 검증 메시지 */
const uuid = {
  /** 일반 UUID 형식 오류 */
  generic: '유효한 UUID 형식이 아닙니다',
  /** 엔티티별 UUID 오류 (파라미터화) */
  invalid: (entity: string) => `유효한 ${entity} UUID가 아닙니다`,
} as const;

/** 날짜 검증 메시지 */
const date = {
  /** ISO 8601 datetime 오류 */
  invalid: '유효한 날짜 형식이 아닙니다',
  /** YYYY-MM-DD 형식 오류 */
  invalidYMD: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)',
} as const;

/** 이메일 검증 메시지 */
const email = {
  invalid: '유효한 이메일 주소를 입력해주세요',
} as const;

/** 필수 필드 메시지 */
const required = (fieldName: string) => `${fieldName}을(를) 입력해주세요`;

/** 필수 선택 메시지 */
const requiredSelect = (fieldName: string) => `${fieldName}을(를) 선택해주세요`;

/** 문자열 길이 검증 메시지 */
const string = {
  /** 최소 길이 */
  min: (fieldName: string, min: number) => `${fieldName}은(는) ${min}자 이상 입력해주세요`,
  /** 최대 길이 */
  max: (fieldName: string, max: number) => `${fieldName}은(는) ${max}자 이하여야 합니다`,
  /** 필수 문자열 (빈 문자열 불가) */
  nonempty: (fieldName: string) => `${fieldName}은(는) 필수입니다`,
} as const;

/** 배열 검증 메시지 */
const array = {
  /** 최소 개수 */
  min: (fieldName: string, min: number) => `최소 ${min}개의 ${fieldName}을(를) 선택해야 합니다`,
  /** 최대 개수 */
  max: (fieldName: string, max: number) => `최대 ${max}개까지 선택 가능합니다`,
} as const;

/** 숫자 검증 메시지 */
const number = {
  /** 정수 필수 */
  int: (fieldName: string) => `${fieldName}은(는) 정수여야 합니다`,
  /** 양수 필수 */
  positive: (fieldName: string) => `${fieldName}은(는) 양수여야 합니다`,
  /** 최솟값 */
  min: (fieldName: string, min: number) => `${fieldName}은(는) ${min} 이상이어야 합니다`,
  /** 최댓값 */
  max: (fieldName: string, max: number) => `${fieldName}은(는) ${max} 이하여야 합니다`,
} as const;

/** Enum 검증 메시지 */
const enumInvalid = (fieldName: string) => `유효하지 않은 ${fieldName}입니다`;

/** 버전 (CAS) 검증 메시지 */
const version = {
  int: 'version은(는) 정수여야 합니다',
  positive: 'version은(는) 양수여야 합니다',
} as const;

// ============================================================================
// Domain-Specific Validation Messages
// ============================================================================

/** 반출(Checkout) 검증 메시지 */
const checkout = {
  destination: { required: '반출 장소를 입력해주세요' },
  reason: { required: '반출 사유를 입력해주세요' },
  purpose: { invalid: '유효하지 않은 반출 목적입니다' },
  status: { invalid: '유효하지 않은 반출 상태값입니다' },
  conditionCheck: {
    step: { invalid: '유효하지 않은 상태 확인 단계입니다' },
    appearance: { invalid: '유효하지 않은 외관 상태입니다' },
    operation: { invalid: '유효하지 않은 작동 상태입니다' },
  },
} as const;

/** 교정(Calibration) 검증 메시지 */
const calibration = {
  agency: { required: '교정 기관을 입력해주세요' },
  techManagerComment: '기술책임자는 등록자 코멘트를 반드시 입력해야 합니다',
} as const;

/** 부적합(Non-Conformance) 검증 메시지 */
const nonConformance = {
  cause: { required: '부적합 원인을 입력해주세요' },
  status: { invalid: '유효하지 않은 상태입니다 (open, corrected, closed)' },
  type: { invalid: '유효하지 않은 유형입니다' },
} as const;

/** 장비 반입(Equipment Import) 검증 메시지 */
const equipmentImport = {
  name: { required: '장비명을 입력해주세요' },
  reason: { required: '반입 사유를 입력해주세요' },
  rentalCompany: { required: '렌탈 업체명을 입력해주세요' },
  ownerDepartment: { required: '소유 부서를 입력해주세요' },
  classification: { invalid: '유효하지 않은 분류입니다' },
  calibrationRequired: '외부 교정 선택 시 교정 주기, 최종 교정일, 교정 기관을 모두 입력해야 합니다',
} as const;

/** 소프트웨어(Software) 검증 메시지 */
const software = {
  name: { required: '소프트웨어명을 입력해주세요' },
  newVersion: { required: '새 버전을 입력해주세요' },
  verificationRecord: { required: '검증 기록은 필수입니다' },
} as const;

/** 보정계수(Calibration Factor) 검증 메시지 */
const calibrationFactor = {
  name: { required: '보정계수 이름을 입력해주세요' },
  unit: { required: '단위를 입력해주세요' },
  value: { invalid: '보정계수 값은 숫자여야 합니다' },
} as const;

/** 교정 계획(Calibration Plan) 검증 메시지 */
const calibrationPlan = {
  site: { invalid: '유효하지 않은 시험소 ID입니다 (suwon, uiwang, pyeongtaek)' },
  status: { invalid: '유효하지 않은 상태입니다' },
} as const;

/** 팀(Team) 검증 메시지 */
const team = {
  name: { required: '팀 이름을 입력해주세요' },
} as const;

/** 사용자(User) 검증 메시지 */
const user = {
  name: { required: '이름을 입력해주세요' },
  role: { invalid: 'test_engineer 또는 technical_manager만 지정할 수 있습니다' },
  currentRole: { invalid: '현재 역할이 올바르지 않습니다' },
} as const;

/** 알림(Notification) 검증 메시지 */
const notification = {
  title: { required: '알림 제목을 입력해주세요' },
  content: { required: '알림 내용을 입력해주세요' },
  timeFormat: '시간은 HH:MM 형식이어야 합니다 (예: 09:00)',
} as const;

/** 폐기(Disposal) 검증 메시지 */
const disposal = {
  reason: {
    min: (min: number) => `폐기 사유는 ${min}자 이상 입력해주세요`,
  },
} as const;

/** 승인(Approval) 공통 검증 메시지 */
const approval = {
  approverComment: { required: '승인 시 승인자 코멘트는 필수입니다' },
  rejectReason: { required: '반려 사유를 입력해주세요' },
} as const;

/** 감사(Audit) 검증 메시지 */
const audit = {
  entityType: { invalid: '유효하지 않은 엔티티 타입입니다' },
  action: { invalid: '유효하지 않은 액션입니다' },
} as const;

// ============================================================================
// Export: VM (Validation Messages) — 단축 alias
// ============================================================================

/**
 * Validation Messages Registry
 *
 * @example
 * import { VM } from '@equipment-management/schemas';
 *
 * // Universal
 * uuidString(VM.uuid.invalid('장비'))
 * z.string().min(1, VM.required('반출 사유'))
 * z.string().max(100, VM.string.max('이름', 100))
 * z.array(...).min(1, VM.array.min('장비', 1))
 * z.number().int(VM.number.int('연도'))
 *
 * // Domain
 * z.string().min(1, VM.checkout.destination.required)
 * z.string().min(1, VM.approval.rejectReason.required)
 */
export const VM = {
  // Universal
  uuid,
  date,
  email,
  required,
  requiredSelect,
  string,
  array,
  number,
  enumInvalid,
  version,

  // Domain-specific
  checkout,
  calibration,
  nonConformance,
  equipmentImport,
  software,
  calibrationFactor,
  calibrationPlan,
  team,
  user,
  notification,
  disposal,
  approval,
  audit,
} as const;

/** VM 타입 (테스트/확장용) */
export type ValidationMessages = typeof VM;
