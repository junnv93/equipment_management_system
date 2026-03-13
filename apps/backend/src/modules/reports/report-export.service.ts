import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import type { ReportFormat } from '@equipment-management/schemas';

export type { ReportFormat };

export interface ReportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ReportData {
  title: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  generatedAt?: Date;
}

export interface GeneratedFile {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

/**
 * 보고서 파일 생성 서비스
 *
 * 책임: 구조화된 데이터를 Excel / CSV / PDF 파일 Buffer로 변환
 * 데이터 조회 책임은 ReportsService가 담당 (SRP)
 */
@Injectable()
export class ReportExportService {
  /**
   * 보고서 데이터를 지정 포맷의 Buffer로 변환
   */
  async generate(data: ReportData, format: ReportFormat): Promise<GeneratedFile> {
    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = data.title.replace(/\s+/g, '_');

    switch (format) {
      case 'excel': {
        const buffer = await this.generateExcel(data);
        return {
          buffer,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filename: `${safeName}_${dateStr}.xlsx`,
        };
      }
      case 'csv': {
        const buffer = this.generateCsv(data);
        return {
          buffer,
          mimeType: 'text/csv; charset=utf-8',
          filename: `${safeName}_${dateStr}.csv`,
        };
      }
      case 'pdf': {
        const buffer = await this.generatePdf(data);
        return {
          buffer,
          mimeType: 'application/pdf',
          filename: `${safeName}_${dateStr}.pdf`,
        };
      }
    }
  }

  // ── Excel ────────────────────────────────────────────────────────────────

  private async generateExcel(data: ReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Equipment Management System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(data.title, {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // 제목 행
    sheet.mergeCells(1, 1, 1, data.columns.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = data.title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // 생성 일시 행
    sheet.mergeCells(2, 1, 2, data.columns.length);
    const subCell = sheet.getCell(2, 1);
    const generatedAt = data.generatedAt ?? new Date();
    subCell.value = `생성일시: ${generatedAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`;
    subCell.font = { color: { argb: 'FF666666' }, size: 10 };
    subCell.alignment = { horizontal: 'right' };

    // 헤더 행 (3행)
    sheet.columns = data.columns.map((col) => ({
      key: col.key,
      width: col.width ?? 18,
    }));

    const headerRow = sheet.getRow(3);
    data.columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }, // primary-600
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 24;

    // 데이터 행
    data.rows.forEach((row, rowIdx) => {
      const sheetRow = sheet.addRow(data.columns.map((col) => row[col.key] ?? ''));
      sheetRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        // 짝수 행 배경
        if (rowIdx % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' },
          };
        }
        cell.alignment = { vertical: 'middle', wrapText: false };
      });
    });

    // 자동 필터 (헤더에 적용)
    sheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: data.columns.length },
    };

    // 첫 3행 고정 (스크롤 시 헤더 유지)
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ── CSV ──────────────────────────────────────────────────────────────────

  private generateCsv(data: ReportData): Buffer {
    const escape = (val: unknown): string => {
      const str = String(val ?? '');
      // 쉼표, 쌍따옴표, 줄바꿈이 포함된 경우 따옴표로 감쌈
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const lines: string[] = [
      // BOM — 한국어 Excel에서 인코딩 깨짐 방지
      '\uFEFF' + data.columns.map((c) => escape(c.header)).join(','),
      ...data.rows.map((row) => data.columns.map((col) => escape(row[col.key])).join(',')),
    ];

    return Buffer.from(lines.join('\r\n'), 'utf-8');
  }

  // ── PDF ──────────────────────────────────────────────────────────────────

  private generatePdf(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // 제목
      doc.font('Helvetica-Bold').fontSize(16).text(data.title, { align: 'center' });
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#666666')
        .text(
          `생성일시: ${(data.generatedAt ?? new Date()).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
          { align: 'right' }
        )
        .fillColor('#000000')
        .moveDown(0.5);

      // 테이블 헤더
      const colCount = data.columns.length;
      const pageWidth = doc.page.width - 80;
      const colWidth = pageWidth / colCount;
      const rowHeight = 20;

      const drawRow = (cols: string[], y: number, isHeader: boolean, isEven: boolean) => {
        if (isHeader) {
          doc.rect(40, y, pageWidth, rowHeight).fill('#2563EB');
        } else if (isEven) {
          doc.rect(40, y, pageWidth, rowHeight).fill('#F9FAFB');
        }

        cols.forEach((text, idx) => {
          const x = 40 + idx * colWidth;
          doc
            .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(8)
            .fillColor(isHeader ? '#FFFFFF' : '#111827')
            .text(String(text ?? '').slice(0, 30), x + 3, y + 5, {
              width: colWidth - 6,
              height: rowHeight,
              lineBreak: false,
              ellipsis: true,
            });
        });
        // 가로선
        doc
          .moveTo(40, y + rowHeight)
          .lineTo(40 + pageWidth, y + rowHeight)
          .strokeColor('#E5E7EB')
          .lineWidth(0.5)
          .stroke();
      };

      let currentY = doc.y;
      drawRow(
        data.columns.map((c) => c.header),
        currentY,
        true,
        false
      );
      currentY += rowHeight;

      data.rows.forEach((row, idx) => {
        if (currentY + rowHeight > doc.page.height - 60) {
          doc.addPage();
          currentY = 40;
          drawRow(
            data.columns.map((c) => c.header),
            currentY,
            true,
            false
          );
          currentY += rowHeight;
        }
        drawRow(
          data.columns.map((c) => String(row[c.key] ?? '')),
          currentY,
          false,
          idx % 2 === 1
        );
        currentY += rowHeight;
      });

      // 페이지 번호
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#9CA3AF')
          .text(`${i + 1} / ${pageCount}`, 40, doc.page.height - 30, {
            align: 'center',
          });
      }

      doc.end();
    });
  }
}
