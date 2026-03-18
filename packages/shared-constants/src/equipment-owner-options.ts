/**
 * 공용장비 소유처 옵션 (SSOT)
 *
 * value: DB owner 컬럼에 저장되는 locale-independent 식별자
 * i18nKey: frontend i18n 키 접미사 (equipment.form.temporary.{i18nKey})
 *
 * EquipmentForm 드롭다운과 E2E 테스트에서 공통으로 사용.
 * 라벨 텍스트는 i18n 시스템에서 관리하므로 여기에 중복 정의하지 않음.
 *
 * ⚠️ value를 변경하면 DB에 저장되는 값이 바뀝니다.
 *    기존 데이터가 있는 경우 마이그레이션이 필요합니다.
 */
export const EQUIPMENT_OWNER_OPTIONS = [
  { value: 'safety_team', i18nKey: 'ownerSafetyTeam' },
  { value: 'battery_team', i18nKey: 'ownerBatteryTeam' },
  { value: 'other', i18nKey: 'ownerOther' },
] as const;

export type EquipmentOwnerOption = (typeof EQUIPMENT_OWNER_OPTIONS)[number];
export type EquipmentOwnerValue = EquipmentOwnerOption['value'];
