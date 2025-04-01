/**
 * 장비 교정 방법에 대한 열거형 타입
 */
export enum CalibrationMethodEnum {
  EXTERNAL_CALIBRATION = 'external_calibration',  // 외부 교정
  SELF_INSPECTION = 'self_inspection',           // 자체 점검
  NOT_APPLICABLE = 'not_applicable',             // 비대상
} 