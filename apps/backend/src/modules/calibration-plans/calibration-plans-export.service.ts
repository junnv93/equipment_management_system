import { Injectable } from '@nestjs/common';
import { CalibrationPlanExportDataService } from './services/calibration-plan-export-data.service';
import {
  CalibrationPlanRendererService,
  type ExportResult,
} from './services/calibration-plan-renderer.service';

/**
 * 교정계획서 Export 오케스트레이터 (얇은 레이어).
 *
 * 상태 가드: CalibrationPlanExportDataService (approved만 허용)
 * 렌더링:   CalibrationPlanRendererService (xlsx-helper + layout SSOT)
 */
@Injectable()
export class CalibrationPlansExportService {
  constructor(
    private readonly exportDataService: CalibrationPlanExportDataService,
    private readonly rendererService: CalibrationPlanRendererService
  ) {}

  async exportExcel(uuid: string): Promise<ExportResult> {
    const plan = await this.exportDataService.fetchForExport(uuid);
    return this.rendererService.render(plan);
  }
}
