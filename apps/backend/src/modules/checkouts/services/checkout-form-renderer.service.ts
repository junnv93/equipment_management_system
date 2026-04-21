import { Inject, Injectable } from '@nestjs/common';
import { DocxTemplate } from '../../../common/docx/docx-template.util';
import { insertDocxSignature } from '../../../common/docx/docx-xml-helpers';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../../common/storage/storage.interface';
import {
  FORM_NUMBER,
  ROWS,
  DESTINATION_ROW_COLS,
  ITEM_COLS,
  SIGN_OFF_COLS,
  TEXT_COL,
  formatQp1806Date,
} from './checkout-form.layout';
import type { CheckoutFormExportData } from './checkout-form-export-data.service';

/**
 * UL-QP-18-06 장비 반·출입 확인서 DOCX 렌더러.
 *
 * checkout/rental-import 두 variant 공용.
 * CheckoutFormExportData를 받아 원본 템플릿에 주입한 DOCX 버퍼를 반환.
 * 셀 좌표는 `checkout-form.layout.ts` SSOT 참조.
 * DB 호출 없음 — 순수 렌더링 담당.
 */
@Injectable()
export class CheckoutFormRendererService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider
  ) {}

  async render(data: CheckoutFormExportData, templateBuf: Buffer): Promise<Buffer> {
    const doc = new DocxTemplate(templateBuf, FORM_NUMBER);

    // R2: 반출지 / 전화번호
    doc.setCellValue(
      0,
      ROWS.destination,
      DESTINATION_ROW_COLS.destination,
      data.destination ?? '-'
    );
    doc.setCellValue(
      0,
      ROWS.destination,
      DESTINATION_ROW_COLS.phoneNumber,
      data.phoneNumber ?? '-'
    );
    // R3: 반출주소
    doc.setCellValue(0, ROWS.address, TEXT_COL, data.address ?? '-');
    // R4: 반출사유
    doc.setCellValue(0, ROWS.reason, TEXT_COL, data.reason ?? '-');

    // R5: 반출 확인 문장 + 날짜
    const checkoutDateStr = formatQp1806Date(data.checkoutDate);
    doc.setCellValue(
      0,
      ROWS.checkoutConfirmText,
      0,
      `아래 목록과 같이 측정장비를 반출하였음을 확인합니다.    ${checkoutDateStr}    반출자 : ${data.requester?.name ?? '-'}`
    );

    // R9~R22: 장비 목록 14행
    for (let i = 0; i < ROWS.itemsCount; i++) {
      const rowIdx = ROWS.itemsStart + i;
      const item = data.items.find((it) => it.sequenceNumber === i + 1);
      if (!item) {
        doc.setCellValue(0, rowIdx, ITEM_COLS.name, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.model, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.quantity, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.managementNumber, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.conditionBefore, '-');
        doc.setCellValue(0, rowIdx, ITEM_COLS.conditionAfter, '-');
        continue;
      }
      doc.setCellValue(0, rowIdx, ITEM_COLS.name, item.equipmentName ?? '-');
      doc.setCellValue(0, rowIdx, ITEM_COLS.model, item.equipmentModel ?? '-');
      doc.setCellValue(0, rowIdx, ITEM_COLS.quantity, String(item.quantity));
      doc.setCellValue(
        0,
        rowIdx,
        ITEM_COLS.managementNumber,
        item.equipmentManagementNumber ?? '-'
      );
      doc.setCellValue(
        0,
        rowIdx,
        ITEM_COLS.conditionBefore,
        item.conditionBefore ?? data.conditionCheckout ?? '-'
      );
      doc.setCellValue(
        0,
        rowIdx,
        ITEM_COLS.conditionAfter,
        item.conditionAfter ?? data.conditionReturn ?? '-'
      );
    }

    // R23: 특기사항
    doc.setCellValue(0, ROWS.remarks, TEXT_COL, data.inspectionNotes ?? '-');

    // R24: 반입 확인 문장 + 날짜
    const returnDateStr = formatQp1806Date(data.actualReturnDate);
    doc.setCellValue(
      0,
      ROWS.returnConfirmText,
      0,
      `상기 목록과 같이 측정장비를 이상없이 반입하였음을 확인합니다.    ${returnDateStr}    반입자 : ${data.requester?.name ?? '-'}`
    );

    // R1: 결재란 (반출 시점)
    await insertDocxSignature(
      doc,
      0,
      ROWS.checkoutSignOff,
      SIGN_OFF_COLS.requester,
      data.requester?.signaturePath ?? null,
      '(서명)',
      this.storage
    );
    await insertDocxSignature(
      doc,
      0,
      ROWS.checkoutSignOff,
      SIGN_OFF_COLS.approver,
      data.approver?.signaturePath ?? null,
      '(서명)',
      this.storage
    );

    // R25: 결재란 (반입 시점)
    await insertDocxSignature(
      doc,
      0,
      ROWS.returnSignOff,
      SIGN_OFF_COLS.requester,
      data.requester?.signaturePath ?? null,
      '(서명)',
      this.storage
    );
    await insertDocxSignature(
      doc,
      0,
      ROWS.returnSignOff,
      SIGN_OFF_COLS.approver,
      data.approver?.signaturePath ?? null,
      '(서명)',
      this.storage
    );

    return doc.toBuffer();
  }
}
