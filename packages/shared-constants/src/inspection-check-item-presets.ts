/**
 * 중간점검 항목 프리셋 (실제 UL-QP-18-03 양식 기반)
 *
 * 9개 실제 중간점검 문서에서 추출한 점검 항목 + 기준.
 * 프론트엔드에서 Select로 선택하면 checkItem + checkCriteria가 자동 입력됨.
 * checkCriteria는 장비별로 다를 수 있으므로 사용자가 수정 가능.
 * "custom" 선택 시 직접 입력 가능.
 *
 * @see docs/procedure/양식/QP-18-03_중간점검표.md
 * @see docs/procedure/실제양식/ — 9개 실제 작성 완료 문서
 */

export interface InspectionCheckItemPreset {
  readonly key: string;
  readonly checkItem: string;
  readonly checkCriteria: string;
}

export const INSPECTION_CHECK_ITEM_PRESETS: readonly InspectionCheckItemPreset[] = [
  {
    key: 'appearance',
    checkItem: '외관 검사',
    checkCriteria: '마모 상태 확인',
  },
  {
    key: 'output_characteristic',
    checkItem: '출력 특성 점검',
    checkCriteria: '제조사 선언 오차범위 이내',
  },
  {
    key: 'signal_path',
    checkItem: '신호 경로 특성 검사',
    checkCriteria: '제조사 선언 오차범위 이내',
  },
  {
    key: 'rf_output',
    checkItem: 'RF 출력 검사',
    checkCriteria: 'CW Level ±1 dB 이내',
  },
  {
    key: 'rf_input',
    checkItem: 'RF 입력 검사',
    checkCriteria: 'S/G Level ±1 dB 이내',
  },
  {
    key: 'matching',
    checkItem: '정합 특성 검사',
    checkCriteria: 'VSWR < 1.2',
  },
  {
    key: 'vswr',
    checkItem: 'VSWR 특성',
    checkCriteria: 'SWR < 2.0',
  },
  {
    key: 'self_test',
    checkItem: '장비 내부 자체 점검 프로그램',
    checkCriteria: '장비 내부 점검',
  },
  {
    key: 'obw',
    checkItem: 'OBW 특성 검사',
    checkCriteria: '99% BW(MHz)',
  },
  {
    key: 'dc_voltage_output',
    checkItem: 'DC 전압 출력 특성 검사',
    checkCriteria: 'Output 대비 ±0.1V 이내',
  },
  {
    key: 'input_voltage',
    checkItem: '입력 전압 점검',
    checkCriteria: 'Output 대비 ±0.1V 이내',
  },
  {
    key: 'input_characteristic',
    checkItem: '입력 특성 검사',
    checkCriteria: 'S/G Level ±1 dB 이내',
  },
] as const;

export type InspectionCheckItemPresetKey = (typeof INSPECTION_CHECK_ITEM_PRESETS)[number]['key'];
