import { MIGRATION_SHEET_TYPE, type MigrationSheetType } from '@equipment-management/schemas';
export type { MigrationSheetType };

export interface SheetConfig {
  type: MigrationSheetType;
  /** 시트 이름 매칭 패턴 (소문자 포함 검사) */
  namePatterns: string[];
  /** 이 시트의 한국어 레이블 */
  label: string;
}

export const SHEET_CONFIGS: SheetConfig[] = [
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
];

/** 시트 이름으로 타입 감지 */
export function detectSheetType(sheetName: string): MigrationSheetType | null {
  const lower = sheetName.toLowerCase().trim();
  for (const config of SHEET_CONFIGS) {
    if (config.namePatterns.some((p) => lower.includes(p))) {
      return config.type;
    }
  }
  return null;
}
