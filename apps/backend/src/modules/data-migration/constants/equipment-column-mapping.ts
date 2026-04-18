/**
 * Excel 컬럼 헤더 ↔ DB 필드명 매핑 상수
 *
 * 한국어/영어 alias 모두 지원 (대소문자 무시, 공백 트림).
 * Excel 헤더가 여기 정의된 alias와 일치하면 자동으로 DB 필드에 매핑됨.
 *
 * ⚠️ DB 필드명은 반드시 Drizzle 스키마(camelCase)를 따름
 * ⚠️ alias map의 value는 SSOT enum 타입으로 강제 — 신규 enum 값 추가 시 tsc가 누락 감지
 */
import type { Site, ManagementMethod, CalibrationRequired } from '@equipment-management/schemas';
import {
  SITE_LABELS,
  MANAGEMENT_METHOD_LABELS,
  CALIBRATION_REQUIRED_LABELS,
  SPEC_MATCH_LABELS,
} from '@equipment-management/schemas';

/** 값 변환 함수 타입 */
type TransformFn = (value: unknown) => unknown;

/** 컬럼 매핑 항목 */
export interface ColumnMappingEntry {
  /** DB 필드명 (camelCase) */
  dbField: string;
  /** 인식할 Excel 헤더 alias 목록 (첫 번째가 primary label) */
  aliases: string[];
  /** 선택적 값 변환 함수 */
  transform?: TransformFn;
  /** 필수 여부 */
  required?: boolean;
  /** 템플릿 헤더에 표시할 텍스트 (미지정 시 aliases[0] + 필수 표시 자동 생성) */
  headerLabel?: string;
}

/** SSOT 라벨 맵에서 한국어 요약 생성 */
function enumHintFromLabels(labels: Record<string, string>): string {
  return Object.values(labels).join('/');
}

// ── 변환 유틸리티 ─────────────────────────────────────────────────────────────

/**
 * Excel 날짜 파싱
 * ExcelJS: date-formatted cell → JS Date (자동), text cell → string
 * 한국어 형식 지원: 2024.03.15, 2024-03-15, 2024/03/15, 20240315
 */
export function parseExcelDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // Excel serial date number (1900년 기준)
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 86400000);
  }
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/[./]/g, '-');
    const date = new Date(cleaned);
    return isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}

/**
 * 사이트명 alias → Site enum 매핑 (SSOT 타입 강제)
 * Key: Excel 헤더 alias (한/영 소문자 정규화)
 * Value: Site enum 값 — schemas에 사이트 추가 시 tsc가 타입 오류로 누락 감지
 */
const SITE_MAP: Record<string, Site> = {
  수원: 'suwon',
  suwon: 'suwon',
  suw: 'suwon',
  수원랩: 'suwon',
  의왕: 'uiwang',
  uiwang: 'uiwang',
  uiw: 'uiwang',
  의왕랩: 'uiwang',
  평택: 'pyeongtaek',
  pyeongtaek: 'pyeongtaek',
  pyt: 'pyeongtaek',
  평택랩: 'pyeongtaek',
};

/** 사이트명 정규화 (한/영 → DB enum 값) */
export function mapSiteValue(value: unknown): Site | undefined {
  if (!value || typeof value !== 'string') return undefined;
  return SITE_MAP[value.trim().toLowerCase()];
}

/**
 * 관리방법 alias → ManagementMethod enum 매핑 (SSOT 타입 강제)
 * Value: ManagementMethod enum 값 — schemas 변경 시 tsc가 타입 오류로 누락 감지
 */
const METHOD_MAP: Record<string, ManagementMethod> = {
  '외부 교정': 'external_calibration',
  외부교정: 'external_calibration',
  external_calibration: 'external_calibration',
  external: 'external_calibration',
  '자체 점검': 'self_inspection',
  자체점검: 'self_inspection',
  self_inspection: 'self_inspection',
  self: 'self_inspection',
  비대상: 'not_applicable',
  not_applicable: 'not_applicable',
  'n/a': 'not_applicable',
  na: 'not_applicable',
};

/** 교정 방법 정규화 (한/영 → DB enum 값) */
export function mapManagementMethod(value: unknown): ManagementMethod | undefined {
  if (!value || typeof value !== 'string') return undefined;
  return METHOD_MAP[value.trim().toLowerCase()];
}

/**
 * 교정필요 여부 alias → CalibrationRequired enum 매핑 (SSOT 타입 강제)
 */
const CALIBRATION_REQUIRED_MAP: Record<string, CalibrationRequired> = {
  필요: 'required',
  required: 'required',
  y: 'required',
  yes: 'required',
  불필요: 'not_required',
  비대상: 'not_required',
  not_required: 'not_required',
  n: 'not_required',
  no: 'not_required',
};

/** 교정 필요 여부 정규화 */
export function mapCalibrationRequired(value: unknown): CalibrationRequired | undefined {
  if (!value || typeof value !== 'string') return undefined;
  return CALIBRATION_REQUIRED_MAP[value.trim().toLowerCase()];
}

/** 숫자 변환 (문자열 숫자 → number) */
export function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

/** 정수 변환 */
export function toInteger(value: unknown): number | undefined {
  const num = toNumber(value);
  return num !== undefined ? Math.floor(num) : undefined;
}

/** spec match 정규화 (일치/match → 'match', 불일치/mismatch → 'mismatch') */
export function mapSpecMatch(value: unknown): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  const MAP: Record<string, string> = {
    일치: 'match',
    match: 'match',
    '일치(match)': 'match',
    불일치: 'mismatch',
    mismatch: 'mismatch',
    '불일치(mismatch)': 'mismatch',
  };
  return MAP[normalized];
}

/** 예/아니오 → boolean 변환 */
export function toBoolean(value: unknown): boolean | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['예', 'y', 'yes', 'true', '1'].includes(normalized)) return true;
  if (['아니오', 'n', 'no', 'false', '0'].includes(normalized)) return false;
  return undefined;
}

// ── 컬럼 매핑 정의 ────────────────────────────────────────────────────────────

/**
 * 장비 Excel 컬럼 매핑 테이블
 *
 * 순서: 사이트(필수) → UL-QP-18-01 관리대장 열 순서 → 추가 필드 → FK 해석용 가상 필드
 * 열 순서는 관리대장에서 복사-붙여넣기 편의를 위해 최적화됨.
 */
export const EQUIPMENT_COLUMN_MAPPING: ColumnMappingEntry[] = [
  // ── 사이트 (필수, 맨 앞 — 사용자 요청) ─────────────────────────────────────
  {
    dbField: 'site',
    aliases: ['사이트', 'Site', '시험소', '위치(사이트)', '사업장'],
    transform: mapSiteValue,
    required: true,
    headerLabel: `사이트(${enumHintFromLabels(SITE_LABELS)}) *`,
  },

  // ── UL-QP-18-01 관리대장 열 순서 (1~15열) ─────────────────────────────────
  {
    dbField: 'managementNumber',
    aliases: ['관리번호', '장비번호', 'Management Number', 'Mgmt No.', 'Mgmt No', '관리 번호'],
  },
  {
    dbField: 'assetNumber',
    aliases: ['자산번호', '자산 번호', 'Asset Number', 'Asset No.', 'Asset No'],
  },
  {
    dbField: 'name',
    aliases: ['장비명', '장비 명', 'Equipment Name', 'Name', '기기명'],
    required: true,
  },
  {
    dbField: 'managementMethod',
    aliases: ['관리방법', '교정방법', '관리 방법', 'Calibration Method', 'Cal Method'],
    transform: mapManagementMethod,
    headerLabel: `관리방법(${enumHintFromLabels(MANAGEMENT_METHOD_LABELS)})`,
  },
  {
    dbField: 'lastCalibrationDate',
    aliases: [
      '최종교정일',
      '최종 교정일',
      '교정일',
      'Last Calibration Date',
      'Last Cal Date',
      '최근교정일',
    ],
    transform: parseExcelDate,
  },
  {
    dbField: 'calibrationAgency',
    aliases: ['교정기관', '교정 기관', 'Calibration Agency', 'Cal Agency', '교정처'],
  },
  {
    dbField: 'calibrationCycle',
    aliases: ['교정주기', '교정 주기', 'Calibration Cycle', 'Cal Cycle', '주기(개월)', '주기'],
    transform: toInteger,
  },
  {
    dbField: 'nextCalibrationDate',
    aliases: ['차기교정일', '차기 교정일', '다음교정일', 'Next Calibration Date', 'Next Cal Date'],
    transform: parseExcelDate,
  },
  {
    dbField: 'manufacturer',
    aliases: ['제조사', '제조업체', 'Manufacturer', 'Maker'],
  },
  {
    dbField: 'purchaseYear',
    aliases: ['구입년도', '구입 년도', '취득년도', 'Purchase Year', 'Year'],
    transform: toInteger,
  },
  {
    dbField: 'modelName',
    aliases: ['모델명', '모델', 'Model', 'Model Name', '기종'],
  },
  {
    dbField: 'serialNumber',
    aliases: ['일련번호', '시리얼번호', 'Serial Number', 'S/N', 'SN', '일련 번호'],
  },
  {
    dbField: 'description',
    aliases: ['장비사양', '사양', '설명', 'Description', 'Specification', 'Spec'],
  },
  {
    dbField: 'initialLocation',
    aliases: [
      '설치위치',
      '위치',
      '보관위치',
      'Location',
      'Initial Location',
      '설치 위치',
      '보관 위치',
    ],
    required: true,
  },
  {
    dbField: 'needsIntermediateCheck',
    aliases: ['중간점검필요', '중간 점검 필요', 'Needs Intermediate Check'],
    transform: toBoolean,
    headerLabel: '중간점검필요(예/아니오)',
  },

  // ── 관리대장에 없는 추가 필드 ────────────────────────────────────────────────
  {
    dbField: 'calibrationRequired',
    aliases: ['교정필요', '교정 필요', '교정여부', 'Calibration Required', 'Cal Required'],
    transform: mapCalibrationRequired,
    headerLabel: `교정필요(${enumHintFromLabels(CALIBRATION_REQUIRED_LABELS)})`,
  },
  {
    dbField: 'calibrationResult',
    aliases: ['교정결과', '교정 결과', 'Calibration Result'],
  },
  {
    dbField: 'specMatch',
    aliases: ['시방일치', 'Spec Match', '시방 일치'],
    transform: mapSpecMatch,
    headerLabel: `시방일치(${enumHintFromLabels(SPEC_MATCH_LABELS)})`,
  },
  {
    dbField: 'price',
    aliases: ['구입금액', '가격', '금액', 'Price', 'Cost', '구입가'],
    transform: toInteger,
  },
  {
    dbField: 'supplier',
    aliases: ['공급사', '구입처', '공급업체', '납품업체', 'Supplier', 'Vendor'],
  },
  {
    dbField: 'supplierContact',
    aliases: ['공급사 연락처', '연락처', 'Contact Info', 'Supplier Contact', 'Contact Information'],
  },
  {
    dbField: 'manufacturerContact',
    aliases: ['제조사연락처', '제조사 연락처', 'Manufacturer Contact'],
  },
  {
    dbField: 'installationDate',
    aliases: ['설치일자', '설치일', '도입일', 'Installation Date', 'Install Date'],
    transform: parseExcelDate,
  },
  {
    dbField: 'accessories',
    aliases: ['부속품', '액세서리', 'Accessories'],
  },
  {
    dbField: 'manualLocation',
    aliases: ['매뉴얼위치', '매뉴얼 위치', 'Manual Location'],
  },
  {
    dbField: 'firmwareVersion',
    aliases: ['펌웨어버전', 'FW Version', 'Firmware Version'],
  },
  {
    dbField: 'equipmentType',
    aliases: ['장비유형', '장비타입', '유형', 'Equipment Type', 'Type'],
  },
  {
    dbField: 'intermediateCheckCycle',
    aliases: ['중간점검주기', '중간 점검 주기', 'Intermediate Check Cycle'],
    transform: toInteger,
  },
  {
    dbField: 'lastIntermediateCheckDate',
    aliases: ['최종중간점검일', '최종 중간점검일', 'Last Intermediate Check Date'],
    transform: parseExcelDate,
  },
  {
    dbField: 'nextIntermediateCheckDate',
    aliases: ['차기중간점검일', '차기 중간점검일', 'Next Intermediate Check Date'],
    transform: parseExcelDate,
  },
  {
    dbField: 'technicalManager',
    aliases: ['기술책임자', 'Technical Manager', '기술 책임자'],
  },
  {
    dbField: 'externalIdentifier',
    aliases: ['외부식별번호', '소유처번호', '외부번호', 'External ID', 'External Identifier'],
  },
  {
    dbField: 'correctionFactor',
    aliases: ['보정계수', '보정 계수', 'Correction Factor'],
  },
  {
    dbField: 'isShared',
    aliases: ['공용여부', '공용', 'Shared', 'Is Shared'],
    transform: toBoolean,
  },
  {
    dbField: 'sharedSource',
    aliases: ['공용출처', '공용 출처', 'Shared Source'],
  },
  {
    dbField: 'owner',
    aliases: ['소유처', '소유자', 'Owner'],
  },
  {
    dbField: 'usagePeriodStart',
    aliases: ['사용시작일', '사용 시작일', 'Usage Start', 'Usage Period Start'],
    transform: parseExcelDate,
  },
  {
    dbField: 'usagePeriodEnd',
    aliases: ['사용종료일', '사용 종료일', 'Usage End', 'Usage Period End'],
    transform: parseExcelDate,
  },

  // ── FK 해석용 가상 필드 (DB 컬럼에 직접 매핑 안 됨, FkResolutionService가 해석) ──
  {
    dbField: 'managerName',
    aliases: ['운영책임자(정)', '담당자', '담당자명', '운영책임자 정', 'Manager', 'Manager Name'],
  },
  {
    dbField: 'deputyManagerName',
    aliases: [
      '운영책임자(부)',
      '부담당자',
      '부담당자명',
      '운영책임자 부',
      'Deputy Manager',
      'Deputy Manager Name',
    ],
  },
  {
    dbField: 'managerEmail',
    aliases: ['담당자이메일', '담당자 이메일', 'Manager Email'],
  },
  {
    dbField: 'deputyManagerEmail',
    aliases: ['부담당자이메일', '부담당자 이메일', 'Deputy Manager Email'],
  },
];

// ── 폐기된 컬럼 정의 (SSOT: 제거된 매핑 엔트리에서 alias 자동 추출) ──────────

/**
 * 마이그레이션 템플릿에서 제거되었지만 기존 Excel 호환을 위해 무시할 컬럼 정의.
 * 이 배열에서 DEPRECATED_ALIAS_INDEX가 자동 생성됨 — 하드코딩 Set 아님.
 */
export const DEPRECATED_EQUIPMENT_COLUMNS: ColumnMappingEntry[] = [];
// 모든 항목이 EQUIPMENT_COLUMN_MAPPING으로 승격됨 — DEPRECATED_EQUIPMENT_ALIAS_SET export는 유지

import { DEPRECATED_CALIBRATION_COLUMNS } from './calibration-column-mapping';
import { DEPRECATED_TEST_SOFTWARE_COLUMNS } from './test-software-column-mapping';

// ── SSOT: 템플릿 헤더 생성 ────────────────────────────────────────────────────

/**
 * ColumnMappingEntry → Excel 템플릿 헤더 텍스트 (SSOT)
 *
 * generateTemplate()과 buildAliasIndex() 양쪽에서 이 함수 하나만 호출하여
 * 헤더 생성 공식이 단일 지점에만 존재하도록 보장한다.
 *
 * 규칙:
 * - headerLabel이 있으면 그대로 사용 (예: "사이트(수원/의왕/평택) *")
 * - 없으면 aliases[0] + 필수 표시 (예: "장비명 *", "자산번호")
 */
export function getTemplateHeader(entry: ColumnMappingEntry): string {
  return entry.headerLabel ?? `${entry.aliases[0]}${entry.required ? ' *' : ''}`;
}

// ── SSOT: deprecated alias Set 빌드 ───────────────────────────────────────────

/** alias 배열에서 Set 자동 추출 (SSOT 패턴 — 모든 deprecated 정의에 공통 적용) */
export function buildAliasSet(columns: ColumnMappingEntry[]): Set<string> {
  return new Set(columns.flatMap((e) => e.aliases.map((a) => a.toLowerCase().trim())));
}

/**
 * 시트별 deprecated alias Set (크로스시트 오염 방지)
 *
 * ALL_DEPRECATED_ALIASES(통합)를 사용하면 교정 시트의 deprecated "교정비용"이
 * 장비 시트에서 경고 없이 무시되는 크로스시트 오염이 발생한다.
 * 시트별로 해당 시트의 deprecated만 적용하여 정확한 unmapped 경고를 제공.
 */
export const DEPRECATED_EQUIPMENT_ALIAS_SET = buildAliasSet(DEPRECATED_EQUIPMENT_COLUMNS);
export const DEPRECATED_CALIBRATION_ALIAS_SET = buildAliasSet(DEPRECATED_CALIBRATION_COLUMNS);
export const DEPRECATED_TEST_SOFTWARE_ALIAS_SET = buildAliasSet(DEPRECATED_TEST_SOFTWARE_COLUMNS);

/** 시트 타입 → deprecated alias Set 매핑 (ExcelParserService에서 사용) */
export const DEPRECATED_ALIAS_BY_SHEET: Record<string, Set<string>> = {
  equipment: DEPRECATED_EQUIPMENT_ALIAS_SET,
  calibration: DEPRECATED_CALIBRATION_ALIAS_SET,
  test_software: DEPRECATED_TEST_SOFTWARE_ALIAS_SET,
  // deprecated가 없는 시트는 빈 Set — 미등록 컬럼은 전부 unmapped 경고
  repair: new Set(),
  incident: new Set(),
  cable: new Set(),
  calibration_factor: new Set(),
  non_conformance: new Set(),
};

/**
 * 모든 시트 통합 폐기 alias (하위 호환용 — 신규 코드는 DEPRECATED_ALIAS_BY_SHEET 사용 권장)
 * @deprecated DEPRECATED_ALIAS_BY_SHEET를 사용하세요
 */
export const ALL_DEPRECATED_ALIASES: Set<string> = new Set([
  ...DEPRECATED_EQUIPMENT_ALIAS_SET,
  ...DEPRECATED_CALIBRATION_ALIAS_SET,
  ...DEPRECATED_TEST_SOFTWARE_ALIAS_SET,
]);

// ── SSOT: alias 역색인 빌드 ──────────────────────────────────────────────────

/**
 * ColumnMappingEntry[] → alias 역색인 빌드 (대소문자 무시, 공백 트림)
 *
 * aliases + getTemplateHeader() 결과를 모두 등록하여
 * generateTemplate()이 생성하는 헤더로 import해도 정상 매핑되게 한다.
 *
 * getTemplateHeader()를 단일 진실의 소스로 사용하므로
 * 헤더 생성 공식이 변경되어도 인덱스가 자동 동기화된다.
 */
export function buildAliasIndex(mapping: ColumnMappingEntry[]): Map<string, ColumnMappingEntry> {
  const index = new Map<string, ColumnMappingEntry>();
  for (const entry of mapping) {
    // 1. 기본 aliases
    for (const alias of entry.aliases) {
      index.set(alias.toLowerCase().trim(), entry);
    }
    // 2. 템플릿 헤더 (getTemplateHeader SSOT 사용)
    const templateHeader = getTemplateHeader(entry).toLowerCase().trim();
    index.set(templateHeader, entry);
  }
  return index;
}

/**
 * alias → ColumnMappingEntry 역색인 (대소문자 무시, 공백 트림)
 * Excel 헤더 파싱 시 O(1) 조회용
 */
export const COLUMN_ALIAS_INDEX: Map<string, ColumnMappingEntry> =
  buildAliasIndex(EQUIPMENT_COLUMN_MAPPING);
