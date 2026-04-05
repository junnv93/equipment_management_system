import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import PizZip from 'pizzip';
import type { AppDatabase } from '@equipment-management/db';
import { equipment } from '@equipment-management/db/schema/equipment';
import { calibrations } from '@equipment-management/db/schema/calibrations';
import { checkouts, checkoutItems } from '@equipment-management/db/schema/checkouts';
import { repairHistory } from '@equipment-management/db/schema/repair-history';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import { teams } from '@equipment-management/db/schema/teams';
import { users } from '@equipment-management/db/schema/users';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';

interface HistoryCardData {
  equipment: Record<string, unknown>;
  calibrations: Record<string, unknown>[];
  checkouts: Record<string, unknown>[];
  repairs: Record<string, unknown>[];
  nonConformances: Record<string, unknown>[];
  generatedAt: string;
}

/**
 * 시험설비 이력카드 (UL-QP-18-02) docx 내보내기 서비스
 *
 * 5개 테이블(equipment, calibrations, checkouts, repair_history, non_conformances)
 * 데이터를 통합하여 docx 이력카드를 생성합니다.
 */
@Injectable()
export class HistoryCardService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async generateHistoryCard(equipmentId: string): Promise<Buffer> {
    const data = await this.aggregateData(equipmentId);
    return this.renderDocx(data);
  }

  private async aggregateData(equipmentId: string): Promise<HistoryCardData> {
    const [equipmentRow] = await this.db
      .select()
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);

    if (!equipmentRow) {
      throw new NotFoundException(`장비를 찾을 수 없습니다: ${equipmentId}`);
    }

    // 팀/담당자 정보
    const [team] = equipmentRow.teamId
      ? await this.db.select().from(teams).where(eq(teams.id, equipmentRow.teamId)).limit(1)
      : [null];

    const [manager] = equipmentRow.managerId
      ? await this.db.select().from(users).where(eq(users.id, equipmentRow.managerId)).limit(1)
      : [null];

    // 교정 이력
    const calibrationRows = await this.db
      .select()
      .from(calibrations)
      .where(eq(calibrations.equipmentId, equipmentId))
      .orderBy(desc(calibrations.calibrationDate))
      .limit(50);

    // 반출 이력 (checkout_items를 통해 장비와 연결)
    const checkoutRows = await this.db
      .select({
        checkoutDate: checkouts.checkoutDate,
        actualReturnDate: checkouts.actualReturnDate,
        purpose: checkouts.purpose,
        destination: checkouts.destination,
        status: checkouts.status,
      })
      .from(checkoutItems)
      .innerJoin(checkouts, eq(checkoutItems.checkoutId, checkouts.id))
      .where(eq(checkoutItems.equipmentId, equipmentId))
      .orderBy(desc(checkouts.createdAt))
      .limit(50);

    // 수리 이력
    const repairRows = await this.db
      .select()
      .from(repairHistory)
      .where(eq(repairHistory.equipmentId, equipmentId))
      .orderBy(desc(repairHistory.repairDate))
      .limit(50);

    // 부적합 이력
    const ncRows = await this.db
      .select()
      .from(nonConformances)
      .where(eq(nonConformances.equipmentId, equipmentId))
      .orderBy(desc(nonConformances.createdAt))
      .limit(50);

    const formatDate = (d: Date | string | null | undefined): string => {
      if (!d) return '-';
      const date = d instanceof Date ? d : new Date(d);
      return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
    };

    return {
      equipment: {
        managementNumber: equipmentRow.managementNumber ?? '-',
        name: equipmentRow.name,
        modelName: equipmentRow.modelName ?? '-',
        manufacturer: equipmentRow.manufacturer ?? '-',
        serialNumber: equipmentRow.serialNumber ?? '-',
        status: equipmentRow.status,
        site: equipmentRow.site ?? '-',
        location: equipmentRow.location ?? '-',
        teamName: team?.name ?? '-',
        managerName: manager?.name ?? '-',
        purchaseYear: equipmentRow.purchaseYear ? String(equipmentRow.purchaseYear) : '-',
        installationDate: formatDate(equipmentRow.installationDate),
        description: equipmentRow.description ?? '-',
      },
      calibrations: calibrationRows.map((row) => ({
        calibrationDate: formatDate(row.calibrationDate),
        nextCalibrationDate: formatDate(row.nextCalibrationDate),
        status: row.status ?? '-',
        result: row.result ?? '-',
        technicianId: row.technicianId ?? '-',
        certificateNumber: row.certificateNumber ?? '-',
      })),
      checkouts: checkoutRows.map((row) => ({
        checkoutDate: formatDate(row.checkoutDate),
        returnDate: formatDate(row.actualReturnDate),
        purpose: row.purpose ?? '-',
        destination: row.destination ?? '-',
        status: row.status,
      })),
      repairs: repairRows.map((row) => ({
        repairDate: formatDate(row.repairDate),
        description: row.repairDescription ?? '-',
        result: row.repairResult ?? '-',
        notes: row.notes ?? '-',
      })),
      nonConformances: ncRows.map((row) => ({
        discoveryDate: row.discoveryDate ?? '-',
        ncType: row.ncType ?? '-',
        cause: row.cause ?? '-',
        status: row.status,
        correctionContent: row.correctionContent ?? '-',
        actionPlan: row.actionPlan ?? '-',
      })),
      generatedAt: new Date().toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE }),
    };
  }

  private renderDocx(data: HistoryCardData): Buffer {
    // docxtemplater를 사용하여 프로그래밍적으로 docx 생성
    // 템플릿 없이 XML로 직접 구성
    const templateXml = this.buildTemplateXml(data);
    const zip = new PizZip();

    // Minimal docx structure
    zip.file('[Content_Types].xml', CONTENT_TYPES_XML);
    zip.file('_rels/.rels', RELS_XML);
    zip.file('word/_rels/document.xml.rels', DOCUMENT_RELS_XML);
    zip.file('word/document.xml', templateXml);
    zip.file('word/styles.xml', STYLES_XML);

    return Buffer.from(zip.generate({ type: 'nodebuffer' }));
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private buildTemplateXml(data: HistoryCardData): string {
    const esc = (v: unknown): string => this.escapeXml(String(v ?? '-'));
    const eq = data.equipment;
    const rows = (items: Record<string, unknown>[], keys: string[]): string =>
      items
        .map(
          (item) =>
            `<w:tr>${keys.map((k) => `<w:tc><w:p><w:r><w:t>${esc(item[k])}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`
        )
        .join('');

    const tableHeader = (headers: string[]): string =>
      `<w:tr>${headers.map((h) => `<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>${esc(h)}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`;

    const heading = (text: string): string =>
      `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`;

    const para = (label: string, value: string): string =>
      `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${esc(label)}: </w:t></w:r><w:r><w:t>${esc(value)}</w:t></w:r></w:p>`;

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14">
<w:body>
${heading('시험설비 이력카드 (UL-QP-18-02)')}
${para('생성일', data.generatedAt)}
<w:p/>
${heading('1. 장비 기본 정보')}
${para('관리번호', String(eq.managementNumber))}
${para('장비명', String(eq.name))}
${para('모델명', String(eq.modelName))}
${para('제조사', String(eq.manufacturer))}
${para('일련번호', String(eq.serialNumber))}
${para('상태', String(eq.status))}
${para('사이트', String(eq.site))}
${para('설치장소', String(eq.location))}
${para('소속팀', String(eq.teamName))}
${para('담당자', String(eq.managerName))}
${para('구입년도', String(eq.purchaseYear))}
${para('설치일', String(eq.installationDate))}
${para('장비사양', String(eq.description))}
<w:p/>
${heading('2. 교정 이력')}
<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/></w:tblPr>
${tableHeader(['교정일', '차기교정일', '상태', '결과', '담당자ID', '성적서번호'])}
${rows(data.calibrations, ['calibrationDate', 'nextCalibrationDate', 'status', 'result', 'technicianId', 'certificateNumber'])}
</w:tbl>
<w:p/>
${heading('3. 반출 이력')}
<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/></w:tblPr>
${tableHeader(['반출일', '반입일', '목적', '반출지', '상태'])}
${rows(data.checkouts, ['checkoutDate', 'returnDate', 'purpose', 'destination', 'status'])}
</w:tbl>
<w:p/>
${heading('4. 수리 이력')}
<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/></w:tblPr>
${tableHeader(['수리일', '수리내용', '결과', '비고'])}
${rows(data.repairs, ['repairDate', 'description', 'result', 'notes'])}
</w:tbl>
<w:p/>
${heading('5. 부적합 이력')}
<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/></w:tblPr>
${tableHeader(['발견일', '유형', '원인', '상태', '조치내용', '조치계획'])}
${rows(data.nonConformances, ['discoveryDate', 'ncType', 'cause', 'status', 'correctionContent', 'actionPlan'])}
</w:tbl>
</w:body>
</w:document>`;
  }
}

// Minimal OOXML boilerplate for valid docx
const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      </w:tblBorders>
    </w:tblPr>
  </w:style>
</w:styles>`;
