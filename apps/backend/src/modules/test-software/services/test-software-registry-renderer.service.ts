import { Injectable } from '@nestjs/common';
import { DocxTemplate } from '../../reports/docx-template.util';
import { SOFTWARE_AVAILABILITY_LABELS } from '@equipment-management/schemas';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';
import { FORM_NUMBER, TABLE } from './test-software-registry.layout';
import type { TestSoftwareRegistryExportData } from './test-software-registry-export-data.service';
import type { SoftwareAvailability } from '@equipment-management/schemas';

/**
 * UL-QP-18-07 시험용 소프트웨어 관리대장 DOCX 렌더러.
 *
 * TestSoftwareRegistryExportData를 받아 원본 템플릿에 주입한 DOCX 버퍼를 반환.
 * 셀 좌표/빈 행 수는 `test-software-registry.layout.ts` SSOT 참조.
 * DB 호출 없음 — 순수 렌더링 담당.
 */
@Injectable()
export class TestSoftwareRegistryRendererService {
  private formatDate(d: Date | string | null | undefined): string {
    if (!d) return '-';
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
  }

  render(data: TestSoftwareRegistryExportData, templateBuf: Buffer): Buffer {
    const doc = new DocxTemplate(templateBuf, FORM_NUMBER);

    const dataRows = data.rows.map((row) => {
      const managerDisplay = [row.primaryManagerName, row.secondaryManagerName]
        .filter(Boolean)
        .join(',');
      // requiresValidation=true → 'X'(대상), false → 'O'(미대상)
      const validationLabel = row.requiresValidation ? 'X' : 'O';

      return [
        row.managementNumber,
        row.name,
        row.softwareVersion ?? '-',
        row.testField,
        managerDisplay || '-',
        this.formatDate(row.installedAt),
        row.manufacturer ?? '-',
        row.location ?? '-',
        SOFTWARE_AVAILABILITY_LABELS[row.availability as SoftwareAvailability] ?? row.availability,
        validationLabel,
      ];
    });

    doc.setDataRows(TABLE.tableIndex, TABLE.templateDataRow, dataRows, TABLE.emptyRows);
    return doc.toBuffer();
  }
}
