import { Injectable } from '@nestjs/common';
import { DocxTemplate } from '../../../common/docx/docx-template.util';
import { FORM_NUMBER, TABLE } from '../layouts/calibration-factor-register.layout';
import type { CalibrationFactorRegisterData } from './calibration-factor-register-data.service';

@Injectable()
export class CalibrationFactorRegisterRendererService {
  render(data: CalibrationFactorRegisterData, templateBuffer: Buffer): Buffer {
    const doc = new DocxTemplate(templateBuffer, FORM_NUMBER);
    const rows = data.rows.map((row) => [
      String(row.sequence),
      row.managementNumber,
      row.equipmentName,
      row.factorLabel,
      row.effectiveDate,
      row.checkedBy,
      row.changedDate,
    ]);

    doc.setDataRows(TABLE.tableIndex, TABLE.templateDataRow, rows, TABLE.emptyRows);
    return doc.toBuffer();
  }
}
