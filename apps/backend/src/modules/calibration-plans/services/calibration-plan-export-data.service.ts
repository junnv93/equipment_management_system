import { BadRequestException, Injectable } from '@nestjs/common';
import { CalibrationPlansService } from '../calibration-plans.service';
import type { CalibrationPlanDetail } from '../calibration-plans.types';

// allowlist — 프론트엔드 EXPORTABLE_CALIBRATION_PLAN_STATUSES 패턴과 방향 통일
// (calibration-plan-exportability.ts 동기화)
// 신규 CalibrationPlanStatus 추가 시 이 목록을 명시적으로 갱신해야 export 허용
const EXPORTABLE_PLAN_STATUSES = ['approved'] as const;

/**
 * 교정계획서 Export용 DB 조회 + 상태 가드 서비스.
 *
 * 직접 API 호출로 우회 가능한 프론트 게이트와 달리,
 * 여기서 approved 외 상태를 차단하는 것이 진짜 보안 레이어다.
 */
@Injectable()
export class CalibrationPlanExportDataService {
  constructor(private readonly calibrationPlansService: CalibrationPlansService) {}

  async fetchForExport(uuid: string): Promise<CalibrationPlanDetail> {
    const plan = await this.calibrationPlansService.findOne(uuid);

    if (
      !EXPORTABLE_PLAN_STATUSES.includes(plan.status as (typeof EXPORTABLE_PLAN_STATUSES)[number])
    ) {
      throw new BadRequestException({
        code: 'NON_EXPORTABLE_PLAN_STATUS',
        message: `Status '${plan.status}' is not exportable. Only 'approved' plans can be exported.`,
      });
    }

    return plan;
  }
}
