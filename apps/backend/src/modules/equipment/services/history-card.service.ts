import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import PizZip from 'pizzip';
import type { AppDatabase } from '@equipment-management/db';
import { equipment } from '@equipment-management/db/schema/equipment';
import { calibrations } from '@equipment-management/db/schema/calibrations';
import { checkouts, checkoutItems } from '@equipment-management/db/schema/checkouts';
import { repairHistory } from '@equipment-management/db/schema/repair-history';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import { equipmentLocationHistory } from '@equipment-management/db/schema/equipment-location-history';
import { equipmentMaintenanceHistory } from '@equipment-management/db/schema/equipment-maintenance-history';
import { equipmentIncidentHistory } from '@equipment-management/db/schema/equipment-incident-history';
import { teams } from '@equipment-management/db/schema/teams';
import { users } from '@equipment-management/db/schema/users';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';
import { FormTemplateService } from '../../reports/form-template.service';

const SPEC_MATCH_LABELS: Record<string, string> = {
  match: '일치',
  mismatch: '불일치',
};

const CALIBRATION_REQUIRED_LABELS: Record<string, string> = {
  required: '필요',
  not_required: '불필요',
};

const MANAGEMENT_METHOD_LABELS: Record<string, string> = {
  external_calibration: '외부교정',
  self_inspection: '자체점검',
  not_applicable: '비대상',
};

interface HistoryCardEquipmentInfo {
  managementNumber: string;
  name: string;
  modelName: string;
  manufacturer: string;
  serialNumber: string;
  status: string;
  site: string;
  location: string;
  teamName: string;
  managerName: string;
  deputyManagerName: string;
  purchaseYear: string;
  installationDate: string;
  description: string;
  assetNumber: string;
  accessories: string;
  manufacturerContact: string;
  supplier: string;
  supplierContact: string;
  specMatch: string;
  calibrationRequired: string;
  calibrationCycle: string;
  managementMethod: string;
  manualLocation: string;
  initialLocation: string;
  needsIntermediateCheck: string;
  approverName: string;
  approvalDate: string;
}

interface HistoryCardCalibration {
  [key: string]: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  status: string;
  result: string;
  technicianId: string;
  certificateNumber: string;
}

interface HistoryCardCheckout {
  [key: string]: string;
  checkoutDate: string;
  returnDate: string;
  purpose: string;
  destination: string;
  status: string;
}

interface HistoryCardRepair {
  [key: string]: string;
  repairDate: string;
  description: string;
  result: string;
  notes: string;
}

interface HistoryCardNonConformance {
  [key: string]: string;
  discoveryDate: string;
  ncType: string;
  cause: string;
  status: string;
  correctionContent: string;
  actionPlan: string;
}

interface HistoryCardLocationHistory {
  [key: string]: string;
  changedAt: string;
  previousLocation: string;
  newLocation: string;
  notes: string;
}

interface HistoryCardMaintenanceHistory {
  [key: string]: string;
  performedAt: string;
  content: string;
}

interface HistoryCardIncidentHistory {
  [key: string]: string;
  occurredAt: string;
  incidentType: string;
  content: string;
}

interface HistoryCardData {
  equipment: HistoryCardEquipmentInfo;
  calibrations: HistoryCardCalibration[];
  checkouts: HistoryCardCheckout[];
  repairs: HistoryCardRepair[];
  nonConformances: HistoryCardNonConformance[];
  locationHistory: HistoryCardLocationHistory[];
  maintenanceHistory: HistoryCardMaintenanceHistory[];
  incidentHistory: HistoryCardIncidentHistory[];
  approverSignaturePath: string | null;
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
    private readonly db: AppDatabase,
    private readonly formTemplateService: FormTemplateService
  ) {}

  async generateHistoryCard(equipmentId: string): Promise<Buffer> {
    const data = await this.aggregateData(equipmentId);
    const templateBuf = await this.formTemplateService.getTemplateBuffer('UL-QP-18-02');
    return this.renderDocx(data, templateBuf);
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

    // 팀/담당자/부담당자/승인자 정보
    const [team] = equipmentRow.teamId
      ? await this.db.select().from(teams).where(eq(teams.id, equipmentRow.teamId)).limit(1)
      : [null];

    const [manager] = equipmentRow.managerId
      ? await this.db.select().from(users).where(eq(users.id, equipmentRow.managerId)).limit(1)
      : [null];

    const [deputyManager] = equipmentRow.deputyManagerId
      ? await this.db
          .select()
          .from(users)
          .where(eq(users.id, equipmentRow.deputyManagerId))
          .limit(1)
      : [null];

    const [approver] = equipmentRow.approvedBy
      ? await this.db.select().from(users).where(eq(users.id, equipmentRow.approvedBy)).limit(1)
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

    // 위치 변동 이력
    const locationRows = await this.db
      .select()
      .from(equipmentLocationHistory)
      .where(eq(equipmentLocationHistory.equipmentId, equipmentId))
      .orderBy(desc(equipmentLocationHistory.changedAt))
      .limit(50);

    // 유지보수 내역
    const maintenanceRows = await this.db
      .select()
      .from(equipmentMaintenanceHistory)
      .where(eq(equipmentMaintenanceHistory.equipmentId, equipmentId))
      .orderBy(desc(equipmentMaintenanceHistory.performedAt))
      .limit(50);

    // 손상/오작동/변경/수리 내역
    const incidentRows = await this.db
      .select()
      .from(equipmentIncidentHistory)
      .where(eq(equipmentIncidentHistory.equipmentId, equipmentId))
      .orderBy(desc(equipmentIncidentHistory.occurredAt))
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
        deputyManagerName: deputyManager?.name ?? '-',
        purchaseYear: equipmentRow.purchaseYear ? String(equipmentRow.purchaseYear) : '-',
        installationDate: formatDate(equipmentRow.installationDate),
        description: equipmentRow.description ?? '-',
        assetNumber: equipmentRow.assetNumber ?? '-',
        accessories: equipmentRow.accessories ?? '-',
        manufacturerContact: equipmentRow.manufacturerContact ?? '-',
        supplier: equipmentRow.supplier ?? '-',
        supplierContact: equipmentRow.contactInfo ?? '-',
        specMatch: SPEC_MATCH_LABELS[equipmentRow.specMatch ?? ''] ?? '-',
        calibrationRequired:
          CALIBRATION_REQUIRED_LABELS[equipmentRow.calibrationRequired ?? ''] ?? '-',
        calibrationCycle: equipmentRow.calibrationCycle
          ? `${equipmentRow.calibrationCycle}개월`
          : '-',
        managementMethod: MANAGEMENT_METHOD_LABELS[equipmentRow.managementMethod ?? ''] ?? '-',
        manualLocation: equipmentRow.manualLocation ?? '-',
        initialLocation: equipmentRow.initialLocation ?? '-',
        needsIntermediateCheck: equipmentRow.needsIntermediateCheck ? 'O' : 'X',
        approverName: approver?.name ?? '-',
        approvalDate: formatDate(equipmentRow.updatedAt),
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
      locationHistory: locationRows.map((row) => ({
        changedAt: formatDate(row.changedAt),
        previousLocation: row.previousLocation ?? '-',
        newLocation: row.newLocation,
        notes: row.notes ?? '-',
      })),
      maintenanceHistory: maintenanceRows.map((row) => ({
        performedAt: formatDate(row.performedAt),
        content: row.content,
      })),
      incidentHistory: incidentRows.map((row) => ({
        occurredAt: formatDate(row.occurredAt),
        incidentType: row.incidentType,
        content: row.content,
      })),
      approverSignaturePath: approver?.signatureImagePath ?? null,
      generatedAt: new Date().toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE }),
    };
  }

  /**
   * 템플릿 기반 docx 생성
   *
   * 원본 양식(UL-QP-18-02)을 로드하여 기본정보 셀에 데이터를 주입하고,
   * 이력 테이블(위치변동/교정/유지보수/사고수리)에 행을 추가합니다.
   */
  private renderDocx(data: HistoryCardData, templateBuf: Buffer): Buffer {
    const zip = new PizZip(templateBuf);
    let xml = zip.file('word/document.xml')!.asText();

    const esc = (v: unknown): string =>
      String(v ?? '-')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const eq = data.equipment;

    // ── 섹션 1: 기본정보 셀 주입 ──
    // 템플릿 XML에서 빈 셀(<w:p>에 <w:r>이 없는 셀)을 찾아 데이터를 주입
    // labelFragment: 해당 행을 식별할 수 있는 고유 텍스트 조각 (XML 내 <w:t> 태그 제거 후 매칭)
    // emptyCellIndex: 해당 행에서 N번째 빈 셀 (0-based)
    const injectCellAfterLabel = (
      labelFragment: string,
      value: string,
      emptyCellIndex: number
    ): void => {
      // 행(<w:tr>...</w:tr>)을 순회하며 labelFragment를 포함하는 행을 찾음
      const rowRegex = /<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g;
      let rowMatch: RegExpExecArray | null;
      while ((rowMatch = rowRegex.exec(xml)) !== null) {
        const rowXml = rowMatch[0];
        // 행 내 모든 텍스트를 추출하여 label 매칭 (XML 태그 제거)
        const rowText = rowXml.replace(/<[^>]+>/g, '');
        if (!rowText.includes(labelFragment)) continue;

        // 이 행에서 빈 셀을 찾음: <w:tc>...</w:tc> 중 <w:r>이 없는 셀
        const cellRegex = /<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g;
        let cellMatch: RegExpExecArray | null;
        let emptyCount = 0;
        while ((cellMatch = cellRegex.exec(rowXml)) !== null) {
          const cellXml = cellMatch[0];
          // 빈 셀 = <w:r>이 없는 셀
          if (!/<w:r\b/.test(cellXml)) {
            if (emptyCount === emptyCellIndex) {
              // </w:p> 앞에 <w:r> 삽입
              const runXml = `<w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${esc(value)}</w:t></w:r>`;
              const newCellXml = cellXml.replace('</w:p>', runXml + '</w:p>');
              const newRowXml = rowXml.replace(cellXml, newCellXml);
              xml = xml.replace(rowXml, newRowXml);
              return;
            }
            emptyCount++;
          }
        }
        break; // 행을 찾았지만 빈 셀이 부족하면 종료
      }
    };

    // Row 2: 관리번호, 자산번호
    injectCellAfterLabel('관  리', eq.managementNumber, 0);
    injectCellAfterLabel('산  번', eq.assetNumber, 0);
    // Row 3: 장비명, 부속품&주요기능
    injectCellAfterLabel('장    비    명', eq.name, 0);
    injectCellAfterLabel('부 속 품', eq.accessories, 0);
    // Row 4: 제조사명 (merged cells — 1st empty)
    injectCellAfterLabel('제  조', eq.manufacturer, 0);
    // Row 5: 제조사 연락처
    injectCellAfterLabel('제조사  연락처', eq.manufacturerContact, 0);
    // Row 6: 공급사
    injectCellAfterLabel('공    급    사', eq.supplier, 0);
    // Row 7: 공급사 연락처
    injectCellAfterLabel('공급사  연락처', eq.supplierContact, 0);
    // Row 8: 일련번호 (시방일치 행, "일련번호" 옆 빈 셀)
    injectCellAfterLabel('일 련', eq.serialNumber, 0);
    // Row 9: 운영책임자 정
    injectCellAfterLabel('운  영 책임자', eq.managerName, 0);
    // Row 10: 교정주기, 부담당자
    injectCellAfterLabel('교  정  주  기', eq.calibrationCycle, 0);
    injectCellAfterLabel('부', eq.deputyManagerName, 0);
    // Row 13: 최초 설치 위치, 설치일시
    injectCellAfterLabel('최초 설치 위치', eq.initialLocation, 0);
    injectCellAfterLabel('설 치  일', eq.installationDate, 0);

    // 확인란 (서명/날짜): "/   /" → "승인자 / 승인일"
    xml = xml.replace('/   /', esc(`${eq.approverName} / ${eq.approvalDate}`));

    // 시방일치 여부: "□일치   □불일치" → 체크 표시
    if (eq.specMatch === '일치') {
      xml = xml.replace('□일치   □불일치', '■일치   □불일치');
    } else if (eq.specMatch === '불일치') {
      xml = xml.replace('□일치   □불일치', '□일치   ■불일치');
    }

    // 교정필요 여부: "□필요   □불필요" → 체크 표시
    if (eq.calibrationRequired === '필요') {
      xml = xml.replace('□필요   □불필요', '■필요   □불필요');
    } else if (eq.calibrationRequired === '불필요') {
      xml = xml.replace('□필요   □불필요', '□필요   ■불필요');
    }

    // S/W 매뉴얼 보관장소: 빈 "(보관장소 : ...)" 패턴에 위치 주입
    xml = xml.replace(/\(보관장소\s*:[\s\n]*\)/g, `(보관장소 : ${esc(eq.manualLocation)})`);

    // ── 섹션 2~5: 이력 테이블 행 추가 ──
    // 이력 테이블은 헤더 행만 있는 빈 테이블이므로 헤더 행 뒤에 데이터 행을 삽입

    const makeRow = (cells: string[], colCount: number): string => {
      const tcs = cells
        .slice(0, colCount)
        .map(
          (c) =>
            `<w:tc><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${esc(c)}</w:t></w:r></w:p></w:tc>`
        )
        .join('');
      return `<w:tr>${tcs}</w:tr>`;
    };

    // 위치 변동 이력 (테이블 1 하단 — "변 \n동  일\n 시" 행 뒤)
    if (data.locationHistory.length > 0) {
      const locationRows = data.locationHistory
        .map((h) => makeRow([h.changedAt, h.newLocation, h.notes], 3))
        .join('');
      // "비\n  고" 셀이 포함된 헤더 행의 </w:tr> 뒤에 삽입
      const locationHeaderEnd = xml.indexOf('비\n  고');
      if (locationHeaderEnd > -1) {
        const insertPoint = xml.indexOf('</w:tr>', locationHeaderEnd) + '</w:tr>'.length;
        xml = xml.slice(0, insertPoint) + locationRows + xml.slice(insertPoint);
      }
    }

    // 교정 이력 (테이블 1 — "주 요   결 과" 행 뒤)
    if (data.calibrations.length > 0) {
      const calRows = data.calibrations
        .map((c) => makeRow([c.calibrationDate, c.result, c.nextCalibrationDate], 3))
        .join('');
      const calHeaderEnd = xml.indexOf('차기 교정\n 예정일');
      if (calHeaderEnd > -1) {
        const insertPoint = xml.indexOf('</w:tr>', calHeaderEnd) + '</w:tr>'.length;
        xml = xml.slice(0, insertPoint) + calRows + xml.slice(insertPoint);
      }
    }

    // 유지보수 내역 (테이블 2 — " 장비 유지보수 내역" 제목 뒤)
    if (data.maintenanceHistory.length > 0) {
      const maintRows = data.maintenanceHistory
        .map((m) => makeRow([m.performedAt, m.content], 2))
        .join('');
      // "주  요\n    내  용" (유지보수 섹션) 뒤에 삽입
      const maintHeader = xml.indexOf('장비 유지보수 내역');
      if (maintHeader > -1) {
        // 유지보수 헤더 행 = "일   시" + "주  요\n    내  용" 뒤의 </w:tr>
        const maintHeaderRowEnd = xml.indexOf(
          '</w:tr>',
          xml.indexOf('주  요\n    내  용', maintHeader)
        );
        if (maintHeaderRowEnd > -1) {
          const insertPoint = maintHeaderRowEnd + '</w:tr>'.length;
          xml = xml.slice(0, insertPoint) + maintRows + xml.slice(insertPoint);
        }
      }
    }

    // 손상/오작동/변경/수리 내역 (테이블 2 — " 장비 손상, 오작동" 제목 뒤)
    if (data.incidentHistory.length > 0) {
      const incRows = data.incidentHistory
        .map((inc) => makeRow([inc.occurredAt, `[${inc.incidentType}] ${inc.content}`], 2))
        .join('');
      const incHeader = xml.indexOf('장비 손상, 오작동');
      if (incHeader > -1) {
        const incHeaderRowEnd = xml.indexOf(
          '</w:tr>',
          xml.indexOf('주  요\n    내  용', incHeader)
        );
        if (incHeaderRowEnd > -1) {
          const insertPoint = incHeaderRowEnd + '</w:tr>'.length;
          xml = xml.slice(0, insertPoint) + incRows + xml.slice(insertPoint);
        }
      }
    }

    // XML 업데이트
    zip.file('word/document.xml', xml);
    return Buffer.from(zip.generate({ type: 'nodebuffer' }));
  }
}
