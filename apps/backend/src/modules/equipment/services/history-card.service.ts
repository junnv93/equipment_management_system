import { Injectable, Logger } from '@nestjs/common';
import { FormTemplateService } from '../../reports/form-template.service';
import { HistoryCardDataService } from './history-card-data.service';
import { HistoryCardRendererService } from './history-card-renderer.service';
import { FORM_NUMBER } from './history-card.layout';

/**
 * UL-QP-18-02 시험설비 이력카드 DOCX 내보내기 orchestrator.
 *
 * 3-way 분리 아키텍처:
 * - 집계: `HistoryCardDataService` (장비+관계+이력 쿼리 + 병합 + 라벨 변환)
 * - 렌더링: `HistoryCardRendererService` (DOCX XML 주입 + 이미지 삽입)
 * - 템플릿 로딩: `FormTemplateService` (스토리지 캐시)
 *
 * 이 서비스는 세 단계를 순서대로 연결만 하며, 구현 세부사항은 각 하위 서비스에 위임.
 * 양식 개정/도메인 변경 시 대응할 하위 서비스만 수정하면 된다.
 *
 * @see docs/procedure/절차서/장비관리절차서.md §7.7 §9.9
 * @see docs/procedure/양식/QP-18-02_시험설비이력카드.md
 */
@Injectable()
export class HistoryCardService {
  private readonly logger = new Logger(HistoryCardService.name);

  constructor(
    private readonly formTemplateService: FormTemplateService,
    private readonly dataService: HistoryCardDataService,
    private readonly rendererService: HistoryCardRendererService
  ) {}

  async generateHistoryCard(
    equipmentId: string
  ): Promise<{ buffer: Buffer; managementNumber: string; equipmentName: string }> {
    const data = await this.dataService.aggregate(equipmentId);
    const templateBuf = await this.formTemplateService.getTemplateBuffer(FORM_NUMBER);
    const buffer = await this.rendererService.render(data, templateBuf);
    return {
      buffer,
      managementNumber: data.equipment.managementNumber,
      equipmentName: data.equipment.name,
    };
  }
}
