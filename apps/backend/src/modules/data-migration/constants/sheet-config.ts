import type { MigrationSheetType } from '@equipment-management/schemas';
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
    type: 'equipment',
    namePatterns: ['장비', 'equipment', '기기', '장비등록'],
    label: '장비 등록',
  },
  {
    type: 'calibration',
    namePatterns: ['교정', 'calibration', '교정이력', '교정 이력'],
    label: '교정 이력',
  },
  {
    type: 'repair',
    namePatterns: ['수리', 'repair', '수리이력', '수리 이력', '유지보수'],
    label: '수리 이력',
  },
  {
    type: 'incident',
    namePatterns: ['사고', 'incident', '사고이력', '사고 이력', '사건'],
    label: '사고 이력',
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
