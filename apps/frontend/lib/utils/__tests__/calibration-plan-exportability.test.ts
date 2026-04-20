import {
  CALIBRATION_PLAN_STATUS_VALUES,
  type CalibrationPlanStatus,
} from '@equipment-management/schemas';
import {
  EXPORTABLE_CALIBRATION_PLAN_STATUSES,
  isCalibrationPlanExportable,
} from '../calibration-plan-exportability';

// 신규 CalibrationPlanStatus가 추가되면 이 테스트가 깨져 명시적 정책 결정을 강제한다.

describe('isCalibrationPlanExportable()', () => {
  it('draft → false (작성 중, 미승인 상태)', () => {
    expect(isCalibrationPlanExportable('draft')).toBe(false);
  });

  it('pending_review → false (품질책임자 검토 대기 중)', () => {
    expect(isCalibrationPlanExportable('pending_review')).toBe(false);
  });

  it('pending_approval → false (시험소장 승인 대기 중)', () => {
    expect(isCalibrationPlanExportable('pending_approval')).toBe(false);
  });

  it('approved → true (시험소장 최종 승인 완료)', () => {
    expect(isCalibrationPlanExportable('approved')).toBe(true);
  });

  it('rejected → false (반려됨, 재작성 필요)', () => {
    expect(isCalibrationPlanExportable('rejected')).toBe(false);
  });

  it('전체 상태 매트릭스: approved만 true', () => {
    const results = CALIBRATION_PLAN_STATUS_VALUES.map((s) => ({
      status: s,
      exportable: isCalibrationPlanExportable(s as CalibrationPlanStatus),
    }));
    const exportable = results.filter((r) => r.exportable).map((r) => r.status);
    expect(exportable).toEqual(['approved']);
  });
});

describe('EXPORTABLE_CALIBRATION_PLAN_STATUSES', () => {
  it('approved만 포함', () => {
    expect(EXPORTABLE_CALIBRATION_PLAN_STATUSES).toEqual(['approved']);
  });

  it('전체 5개 상태 중 4개는 제외됨', () => {
    const totalStatuses = CALIBRATION_PLAN_STATUS_VALUES.length;
    expect(totalStatuses - EXPORTABLE_CALIBRATION_PLAN_STATUSES.length).toBe(4);
  });
});
