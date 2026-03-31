/**
 * Excel 컬럼 헤더 ↔ DB 필드명 매핑 상수
 *
 * 한국어/영어 alias 모두 지원 (대소문자 무시, 공백 트림).
 * Excel 헤더가 여기 정의된 alias와 일치하면 자동으로 DB 필드에 매핑됨.
 *
 * ⚠️ DB 필드명은 반드시 Drizzle 스키마(camelCase)를 따름
 */

/** 값 변환 함수 타입 */
type TransformFn = (value: unknown) => unknown;

/** 컬럼 매핑 항목 */
export interface ColumnMappingEntry {
  /** DB 필드명 (camelCase) */
  dbField: string;
  /** 인식할 Excel 헤더 alias 목록 */
  aliases: string[];
  /** 선택적 값 변환 함수 */
  transform?: TransformFn;
  /** 필수 여부 */
  required?: boolean;
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

/** 사이트명 정규화 (한/영 → DB enum 값) */
export function mapSiteValue(value: unknown): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  const SITE_MAP: Record<string, string> = {
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
  return SITE_MAP[normalized];
}

/** 교정 방법 정규화 (한/영 → DB enum 값) */
export function mapCalibrationMethod(value: unknown): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  const METHOD_MAP: Record<string, string> = {
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
  return METHOD_MAP[normalized];
}

/** 교정 필요 여부 정규화 */
export function mapCalibrationRequired(value: unknown): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  const MAP: Record<string, string> = {
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
  return MAP[normalized];
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

// ── 컬럼 매핑 정의 ────────────────────────────────────────────────────────────

/**
 * 장비 Excel 컬럼 매핑 테이블
 *
 * 순서: 필수 필드 → 식별 필드 → 교정 필드 → 부가 정보
 */
export const EQUIPMENT_COLUMN_MAPPING: ColumnMappingEntry[] = [
  // 필수
  {
    dbField: 'name',
    aliases: ['장비명', '장비 명', 'Equipment Name', 'Name', '기기명'],
    required: true,
  },
  {
    dbField: 'site',
    aliases: ['사이트', 'Site', '시험소', '위치(사이트)', '사업장'],
    transform: mapSiteValue,
    required: true,
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

  // 관리번호 (자동생성 옵션 없을 때 필수)
  {
    dbField: 'managementNumber',
    aliases: ['관리번호', '장비번호', 'Management Number', 'Mgmt No.', 'Mgmt No', '관리 번호'],
  },

  // 식별 정보
  {
    dbField: 'modelName',
    aliases: ['모델명', '모델', 'Model', 'Model Name', '기종'],
  },
  {
    dbField: 'manufacturer',
    aliases: ['제조사', '제조업체', 'Manufacturer', 'Maker'],
  },
  {
    dbField: 'serialNumber',
    aliases: ['일련번호', '시리얼번호', 'Serial Number', 'S/N', 'SN', '일련 번호'],
  },
  {
    dbField: 'assetNumber',
    aliases: ['자산번호', '자산 번호', 'Asset Number', 'Asset No.', 'Asset No'],
  },

  // 교정 정보
  {
    dbField: 'calibrationMethod',
    aliases: ['관리방법', '교정방법', '관리 방법', 'Calibration Method', 'Cal Method'],
    transform: mapCalibrationMethod,
  },
  {
    dbField: 'calibrationRequired',
    aliases: ['교정필요', '교정 필요', '교정여부', 'Calibration Required', 'Cal Required'],
    transform: mapCalibrationRequired,
  },
  {
    dbField: 'calibrationCycle',
    aliases: ['교정주기', '교정 주기', 'Calibration Cycle', 'Cal Cycle', '주기(개월)', '주기'],
    transform: toInteger,
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
    dbField: 'nextCalibrationDate',
    aliases: ['차기교정일', '차기 교정일', '다음교정일', 'Next Calibration Date', 'Next Cal Date'],
    transform: parseExcelDate,
  },
  {
    dbField: 'calibrationAgency',
    aliases: ['교정기관', '교정 기관', 'Calibration Agency', 'Cal Agency', '교정처'],
  },

  // 구매/수입 정보
  {
    dbField: 'purchaseYear',
    aliases: ['구입년도', '구입 년도', '취득년도', 'Purchase Year', 'Year'],
    transform: toInteger,
  },
  {
    dbField: 'price',
    aliases: ['구입금액', '가격', '금액', 'Price', 'Cost', '구입가'],
    transform: toInteger,
  },
  {
    dbField: 'supplier',
    aliases: ['구입처', '공급업체', '납품업체', 'Supplier', 'Vendor'],
  },
  {
    dbField: 'installationDate',
    aliases: ['설치일자', '설치일', '도입일', 'Installation Date', 'Install Date'],
    transform: parseExcelDate,
  },

  // 추가 정보
  {
    dbField: 'description',
    aliases: ['장비사양', '사양', '설명', 'Description', 'Specification', 'Spec'],
  },
  {
    dbField: 'mainFeatures',
    aliases: ['주요기능', '주요 기능', 'Main Features', 'Features'],
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
    dbField: 'manufacturerContact',
    aliases: ['제조사연락처', '제조사 연락처', 'Manufacturer Contact', 'Contact'],
  },
  {
    dbField: 'contactInfo',
    aliases: ['연락처', 'Contact Info', 'Contact Information'],
  },

  // 소프트웨어 정보
  {
    dbField: 'softwareName',
    aliases: ['소프트웨어명', '소프트웨어 명', 'Software Name', 'Software'],
  },
  {
    dbField: 'softwareVersion',
    aliases: ['소프트웨어버전', 'SW Version', 'Software Version'],
  },
  {
    dbField: 'firmwareVersion',
    aliases: ['펌웨어버전', 'FW Version', 'Firmware Version'],
  },
];

/**
 * alias → ColumnMappingEntry 역색인 (대소문자 무시, 공백 트림)
 * Excel 헤더 파싱 시 O(1) 조회용
 */
export const COLUMN_ALIAS_INDEX: Map<string, ColumnMappingEntry> = new Map(
  EQUIPMENT_COLUMN_MAPPING.flatMap((entry) =>
    entry.aliases.map((alias) => [alias.toLowerCase().trim(), entry])
  )
);
