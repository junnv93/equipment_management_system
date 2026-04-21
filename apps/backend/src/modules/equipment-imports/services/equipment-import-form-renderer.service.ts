import { Inject, Injectable } from '@nestjs/common';
import { DocxTemplate } from '../../reports/docx-template.util';
import { insertDocxSignature } from '../../reports/docx-xml-helper';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../../common/storage/storage.interface';
import {
  FORM_NUMBER,
  ROWS,
  USAGE_ROW_COLS,
  LOCATION_PERIOD_ROW_COLS,
  ITEM_COLS,
  SIGN_OFF_COLS,
  formatQp1810Date,
  koConditionLabel,
} from './equipment-import-form.layout';
import type { EquipmentImportFormExportData } from './equipment-import-form-export-data.service';

/**
 * UL-QP-18-10 공용 장비 사용/반납 확인서 DOCX 렌더러.
 *
 * EquipmentImportFormExportData를 받아 원본 템플릿에 주입한 DOCX 버퍼를 반환.
 * 셀 좌표는 `equipment-import-form.layout.ts` SSOT 참조.
 * DB 호출 없음 — 순수 렌더링 담당.
 */
@Injectable()
export class EquipmentImportFormRendererService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider
  ) {}

  async render(data: EquipmentImportFormExportData, templateBuf: Buffer): Promise<Buffer> {
    const doc = new DocxTemplate(templateBuf, FORM_NUMBER);

    // ============== Part 1: 사용 확인서 ==============

    // R1: 결재란 Part1
    await insertDocxSignature(
      doc,
      0,
      ROWS.part1SignOff,
      SIGN_OFF_COLS.requester,
      data.requester?.signaturePath ?? null,
      '(서명)',
      this.storage
    );
    await insertDocxSignature(
      doc,
      0,
      ROWS.part1SignOff,
      SIGN_OFF_COLS.approver,
      data.approver?.signaturePath ?? null,
      '(서명)',
      this.storage
    );

    // R2: 사용부서 / 사용자
    const deptLabel = data.teamName ?? data.ownerDepartment ?? '-';
    doc.setCellValue(0, ROWS.usageDepartment, USAGE_ROW_COLS.department, deptLabel);
    doc.setCellValue(0, ROWS.usageDepartment, USAGE_ROW_COLS.user, data.requester?.name ?? '-');

    // R3: 사용장소 / 사용기간
    doc.setCellValue(
      0,
      ROWS.usageLocation,
      LOCATION_PERIOD_ROW_COLS.location,
      data.usageLocation ?? '-'
    );
    const usageStart = formatQp1810Date(data.usagePeriodStart);
    const usageEnd = formatQp1810Date(data.usagePeriodEnd);
    doc.setCellValue(
      0,
      ROWS.usageLocation,
      LOCATION_PERIOD_ROW_COLS.period,
      `${usageStart} ~ ${usageEnd}`
    );

    // R4: 사용목적
    doc.setCellValue(0, ROWS.usagePurpose, 1, data.reason ?? '-');

    // R5: 사용 확인 문장 + 날짜
    const checkoutDateStr = formatQp1810Date(data.usagePeriodStart);
    doc.setCellValue(
      0,
      ROWS.usageConfirmText,
      0,
      `아래 목록과 같이 공용장비 사용(반출)을 확인합니다.    ${checkoutDateStr}    사용자 : ${data.requester?.name ?? '-'}`
    );

    // R9~R13: Part1 장비 데이터 행 5개
    for (let i = 0; i < ROWS.part1ItemsCount; i++) {
      const rowIdx = ROWS.part1ItemsStart + i;
      if (i === 0) {
        doc.setCellValue(0, rowIdx, ITEM_COLS.name, data.equipmentName ?? '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.model, data.modelName ?? '-');
        doc.setCellValue(
          0,
          rowIdx,
          ITEM_COLS.quantity,
          data.quantityOut != null ? String(data.quantityOut) : '-'
        );
        doc.setCellValue(0, rowIdx, ITEM_COLS.managementNumber, data.managementLabel ?? '-');
        doc.setCellValue(
          0,
          rowIdx,
          ITEM_COLS.conditionBefore,
          koConditionLabel(data.receivingAppearance)
        );
        doc.setCellValue(0, rowIdx, ITEM_COLS.conditionAfter, '-');
      } else {
        doc.setCellValue(0, rowIdx, ITEM_COLS.name, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.model, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.quantity, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.managementNumber, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.conditionBefore, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.conditionAfter, '-');
      }
    }

    // ============== Part 2: 반납 확인서 ==============

    // R15: 결재란 Part2
    await insertDocxSignature(
      doc,
      0,
      ROWS.part2SignOff,
      SIGN_OFF_COLS.requester,
      data.requester?.signaturePath ?? null,
      '(서명)',
      this.storage
    );
    await insertDocxSignature(
      doc,
      0,
      ROWS.part2SignOff,
      SIGN_OFF_COLS.approver,
      data.approver?.signaturePath ?? null,
      '(서명)',
      this.storage
    );

    // R18~R22: Part2 반납 데이터 행 5개
    for (let i = 0; i < ROWS.part2ItemsCount; i++) {
      const rowIdx = ROWS.part2ItemsStart + i;
      if (i === 0) {
        doc.setCellValue(0, rowIdx, ITEM_COLS.name, data.equipmentName ?? '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.model, data.modelName ?? '-');
        doc.setCellValue(
          0,
          rowIdx,
          ITEM_COLS.quantity,
          data.quantityReturned != null ? String(data.quantityReturned) : '-'
        );
        doc.setCellValue(0, rowIdx, ITEM_COLS.managementNumber, data.managementLabel ?? '-');
        doc.setCellValue(
          0,
          rowIdx,
          ITEM_COLS.conditionBefore,
          koConditionLabel(data.returnedAppearance)
        );
        doc.setCellValue(
          0,
          rowIdx,
          ITEM_COLS.conditionAfter,
          koConditionLabel(data.returnedAbnormality)
        );
      } else {
        doc.setCellValue(0, rowIdx, ITEM_COLS.name, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.model, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.quantity, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.managementNumber, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.conditionBefore, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.conditionAfter, '-');
      }
    }

    // R23: 특기사항
    doc.setCellValue(0, ROWS.remarks, 1, data.returnedAbnormalDetails ?? '-');

    // R24: 반납 확인 문장 + 날짜
    const returnDateStr = formatQp1810Date(data.receivedAt);
    doc.setCellValue(
      0,
      ROWS.returnConfirmText,
      0,
      `상기 목록과 같이 공용 장비를 이상없이 반납하였음을 확인합니다.    ${returnDateStr}    반납자 : ${data.requester?.name ?? '-'}`
    );

    return doc.toBuffer();
  }
}
