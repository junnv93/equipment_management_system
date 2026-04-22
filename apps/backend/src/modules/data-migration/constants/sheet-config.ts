import { MIGRATION_SHEET_TYPE, type MigrationSheetType } from '@equipment-management/schemas';
export type { MigrationSheetType };

export interface SheetConfig {
  type: MigrationSheetType;
  /**
   * 시트 이름 매칭 패턴 (소문자 포함 검사)
   * exactPatterns가 있으면 정확 매치 우선, 없으면 namePatterns로 부분 매치
   */
  namePatterns: string[];
  /**
   * 정확 매치 패턴 (소문자 정규화 후 완전 일치)
   * 부분 매치 패턴보다 우선 적용됨 — "공용장비"가 "장비"에 포함되는 충돌 방지
   */
  exactPatterns?: string[];
  /** 이 시트의 한국어 레이블 */
  label: string;
}

export const SHEET_CONFIGS: SheetConfig[] = [
  // ── 공용장비는 EQUIPMENT보다 먼저 등록 (exactPatterns 우선 적용) ───────────
  {
    type: MIGRATION_SHEET_TYPE.SHARED_EQUIPMENT,
    namePatterns: ['shared_equipment', 'shared equipment', '임시장비'],
    exactPatterns: ['공용장비', '공용 장비'],
    label: '공용장비',
  },
  {
    type: MIGRATION_SHEET_TYPE.EQUIPMENT,
    namePatterns: ['장비', 'equipment', '기기', '장비등록'],
    label: '장비 등록',
  },
  {
    type: MIGRATION_SHEET_TYPE.CALIBRATION,
    namePatterns: ['교정', 'calibration', '교정이력', '교정 이력'],
    label: '교정 이력',
  },
  {
    type: MIGRATION_SHEET_TYPE.REPAIR,
    namePatterns: ['수리', 'repair', '수리이력', '수리 이력', '유지보수'],
    label: '수리 이력',
  },
  {
    type: MIGRATION_SHEET_TYPE.INCIDENT,
    namePatterns: ['사고', 'incident', '사고이력', '사고 이력', '사건'],
    label: '사고 이력',
  },
  {
    type: MIGRATION_SHEET_TYPE.CABLE,
    namePatterns: ['케이블', 'cable', 'rf케이블', 'rf cable'],
    label: '케이블',
  },
  {
    type: MIGRATION_SHEET_TYPE.TEST_SOFTWARE,
    namePatterns: ['시험용소프트웨어', '시험용 소프트웨어', 'test software', '시험sw', '시험 sw'],
    label: '시험용 소프트웨어',
  },
  {
    type: MIGRATION_SHEET_TYPE.CALIBRATION_FACTOR,
    namePatterns: ['교정인자', '교정 인자', 'calibration factor', '보정계수'],
    label: '교정 인자',
  },
  {
    type: MIGRATION_SHEET_TYPE.NON_CONFORMANCE,
    namePatterns: ['부적합', 'non-conformance', 'nonconformance', 'nc', '부적합 관리'],
    label: '부적합',
  },
  {
    type: MIGRATION_SHEET_TYPE.CHECKOUT,
    namePatterns: ['반출', 'checkout', '반출입', '반출이력', '반출 이력', 'checkout history'],
    label: '반출입 이력',
  },
];

/**
 * 시트 이름으로 타입 감지 — 2단계 매칭
 *
 * 1단계: exactPatterns 완전 일치 (우선순위 高)
 *   → "공용장비"가 EQUIPMENT의 "장비" 부분 매치에 포함되는 충돌 방지
 * 2단계: namePatterns 부분 포함 매치 (기존 동작 유지)
 */
export function detectSheetType(sheetName: string): MigrationSheetType | null {
  const lower = sheetName.toLowerCase().trim();

  // 1단계: exactPatterns 완전 일치
  for (const config of SHEET_CONFIGS) {
    if (config.exactPatterns?.some((p) => lower === p.toLowerCase())) {
      return config.type;
    }
  }

  // 2단계: namePatterns 부분 포함 매치
  for (const config of SHEET_CONFIGS) {
    if (config.namePatterns.some((p) => lower.includes(p.toLowerCase()))) {
      return config.type;
    }
  }

  return null;
}
