import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { and, eq, desc } from 'drizzle-orm';
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
import { documents } from '@equipment-management/db/schema/documents';
import { teams } from '@equipment-management/db/schema/teams';
import { users } from '@equipment-management/db/schema/users';
import {
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  HISTORY_CARD_QUERY_LIMIT,
} from '@equipment-management/shared-constants';
import {
  SPEC_MATCH_LABELS,
  CALIBRATION_REQUIRED_LABELS,
  MANAGEMENT_METHOD_LABELS,
  CALIBRATION_RESULT_LABELS,
} from '@equipment-management/schemas';
import { FormTemplateService } from '../../reports/form-template.service';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../../common/storage/storage.interface';
import { FORM_NUMBER as FORM_LABEL } from './history-card.layout';

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
  agency: string;
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
  equipmentPhotoPath: string | null;
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
  private readonly logger = new Logger(HistoryCardService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
    private readonly formTemplateService: FormTemplateService
  ) {}

  async generateHistoryCard(
    equipmentId: string
  ): Promise<{ buffer: Buffer; managementNumber: string; equipmentName: string }> {
    const data = await this.aggregateData(equipmentId);
    const templateBuf = await this.formTemplateService.getTemplateBuffer('UL-QP-18-02');
    const buffer = await this.renderDocx(data, templateBuf);
    return {
      buffer,
      managementNumber: data.equipment.managementNumber,
      equipmentName: data.equipment.name,
    };
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

    // 이력 데이터 병렬 조회 (독립 쿼리 8개 — Promise.all)
    const [
      calibrationRows,
      checkoutRows,
      repairRows,
      ncRows,
      locationRows,
      maintenanceRows,
      incidentRows,
      [photoDoc],
    ] = await Promise.all([
      this.db
        .select()
        .from(calibrations)
        .where(eq(calibrations.equipmentId, equipmentId))
        .orderBy(desc(calibrations.calibrationDate))
        .limit(HISTORY_CARD_QUERY_LIMIT),
      this.db
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
        .limit(HISTORY_CARD_QUERY_LIMIT),
      this.db
        .select()
        .from(repairHistory)
        .where(eq(repairHistory.equipmentId, equipmentId))
        .orderBy(desc(repairHistory.repairDate))
        .limit(HISTORY_CARD_QUERY_LIMIT),
      this.db
        .select()
        .from(nonConformances)
        .where(eq(nonConformances.equipmentId, equipmentId))
        .orderBy(desc(nonConformances.createdAt))
        .limit(HISTORY_CARD_QUERY_LIMIT),
      this.db
        .select()
        .from(equipmentLocationHistory)
        .where(eq(equipmentLocationHistory.equipmentId, equipmentId))
        .orderBy(desc(equipmentLocationHistory.changedAt))
        .limit(HISTORY_CARD_QUERY_LIMIT),
      this.db
        .select()
        .from(equipmentMaintenanceHistory)
        .where(eq(equipmentMaintenanceHistory.equipmentId, equipmentId))
        .orderBy(desc(equipmentMaintenanceHistory.performedAt))
        .limit(HISTORY_CARD_QUERY_LIMIT),
      this.db
        .select()
        .from(equipmentIncidentHistory)
        .where(eq(equipmentIncidentHistory.equipmentId, equipmentId))
        .orderBy(desc(equipmentIncidentHistory.occurredAt))
        .limit(HISTORY_CARD_QUERY_LIMIT),
      this.db
        .select({ filePath: documents.filePath })
        .from(documents)
        .where(
          and(
            eq(documents.equipmentId, equipmentId),
            eq(documents.documentType, 'equipment_photo'),
            eq(documents.status, 'active'),
            eq(documents.isLatest, true)
          )
        )
        .orderBy(desc(documents.createdAt))
        .limit(1),
    ]);

    const formatDate = (d: Date | string | null | undefined): string => {
      if (!d) return '-';
      const date = d instanceof Date ? d : new Date(d);
      if (Number.isNaN(date.getTime())) return '-';
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${y}/${m}/${day}`;
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
        supplierContact: equipmentRow.supplierContact ?? '-',
        specMatch: equipmentRow.specMatch ? SPEC_MATCH_LABELS[equipmentRow.specMatch] : '-',
        calibrationRequired: equipmentRow.calibrationRequired
          ? CALIBRATION_REQUIRED_LABELS[equipmentRow.calibrationRequired]
          : '-',
        calibrationCycle: equipmentRow.calibrationCycle
          ? `${equipmentRow.calibrationCycle}개월`
          : '-',
        managementMethod: equipmentRow.managementMethod
          ? ((MANAGEMENT_METHOD_LABELS as Record<string, string>)[equipmentRow.managementMethod] ??
            '-')
          : '-',
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
        result: row.result
          ? ((CALIBRATION_RESULT_LABELS as Record<string, string>)[row.result] ?? row.result)
          : '-',
        agency: row.agencyName ?? '',
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
      equipmentPhotoPath: photoDoc?.filePath ?? null,
      generatedAt: new Date().toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE }),
    };
  }

  /**
   * 템플릿 기반 docx 생성
   *
   * 원본 양식(UL-QP-18-02)을 로드하여 기본정보 셀에 데이터를 주입하고,
   * 이력 테이블(위치변동/교정/유지보수/사고수리)에 행을 추가합니다.
   */
  private async renderDocx(data: HistoryCardData, templateBuf: Buffer): Promise<Buffer> {
    const zip = new PizZip(templateBuf);
    const docFile = zip.file('word/document.xml');
    if (!docFile) {
      throw new NotFoundException({
        code: 'TEMPLATE_STRUCTURE_INVALID',
        message: `${FORM_LABEL} 템플릿 구조가 올바르지 않습니다 (word/document.xml 없음).`,
      });
    }
    let xml = docFile.asText();

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
              const runXml = `<w:r><w:rPr><w:rFonts w:ascii="굴림체" w:eastAsia="굴림체" w:hAnsi="굴림체"/><w:sz w:val="18"/></w:rPr><w:t>${esc(value)}</w:t></w:r>`;
              const newCellXml = cellXml.replace('</w:p>', runXml + '</w:p>');
              const newRowXml = rowXml.replace(cellXml, newCellXml);
              xml = xml.replace(rowXml, newRowXml);
              return;
            }
            emptyCount++;
          }
        }
        // 행을 찾았지만 빈 셀이 부족
        throw new InternalServerErrorException(
          `[${FORM_LABEL}] 라벨 '${labelFragment}' 행에서 빈 셀[${emptyCellIndex}] 없음 (빈 셀 ${emptyCount}개 발견). 양식 셀 구조가 변경되었을 수 있습니다.`
        );
      }
      // 라벨을 포함하는 행 자체를 찾지 못함
      throw new InternalServerErrorException(
        `[${FORM_LABEL}] 라벨 '${labelFragment}' 매칭 실패. 양식의 라벨 텍스트가 변경되었을 수 있습니다.`
      );
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
    // Row 9: 운영책임자 정 — "운  영 책임자" 행의 1번째 빈 셀 (C4)
    injectCellAfterLabel('운  영 책임자', eq.managerName, 0);
    // Row 10: 교정주기(C1), 부담당자(C4) — 같은 행에 2개 빈 셀
    injectCellAfterLabel('교  정  주  기', eq.calibrationCycle, 0);
    injectCellAfterLabel('교  정  주  기', eq.deputyManagerName, 1);
    // Row 13: 최초 설치 위치, 설치일시
    injectCellAfterLabel('최초 설치 위치', eq.initialLocation, 0);
    injectCellAfterLabel('설 치  일', eq.installationDate, 0);

    // ── 문자열 치환 헬퍼: 치환 실패 시 throw ──
    const assertReplace = (pattern: string, replacement: string, desc: string): void => {
      const result = xml.replace(pattern, replacement);
      if (result === xml) {
        throw new InternalServerErrorException(
          `[${FORM_LABEL}] '${desc}' 패턴 '${pattern}' 매칭 실패. 양식이 변경되었을 수 있습니다.`
        );
      }
      xml = result;
    };

    const assertReplaceRegex = (pattern: RegExp, replacement: string, desc: string): void => {
      const result = xml.replace(pattern, replacement);
      if (result === xml) {
        throw new InternalServerErrorException(
          `[${FORM_LABEL}] '${desc}' 정규식 패턴 매칭 실패. 양식이 변경되었을 수 있습니다.`
        );
      }
      xml = result;
    };

    // 확인란: "/   /" → 날짜만 (YYYY/MM/DD)
    assertReplace('/   /', esc(eq.approvalDate), '승인일자');

    // 확인란 서명: 제목행(vMerge restart)의 C2 빈 셀에 전자서명 이미지 or 이름
    if (data.approverSignaturePath) {
      await this.injectSignatureImage(
        zip,
        xml,
        '시험설비 이력카드',
        data.approverSignaturePath,
        eq.approverName
      ).then((newXml) => {
        xml = newXml;
      });
    } else {
      injectCellAfterLabel('시험설비 이력카드', eq.approverName, 0);
    }

    // 시방일치 여부: "□일치   □불일치" → 체크 표시
    if (eq.specMatch === '일치') {
      assertReplace('□일치   □불일치', '■일치   □불일치', '시방일치 체크박스');
    } else if (eq.specMatch === '불일치') {
      assertReplace('□일치   □불일치', '□일치   ■불일치', '시방일치 체크박스');
    }

    // 교정필요 여부: "□필요   □불필요" → 체크 표시
    if (eq.calibrationRequired === '필요') {
      assertReplace('□필요   □불필요', '■필요   □불필요', '교정필요 체크박스');
    } else if (eq.calibrationRequired === '불필요') {
      assertReplace('□필요   □불필요', '□필요   ■불필요', '교정필요 체크박스');
    }

    // S/W 매뉴얼 보관장소: "             )" 공백 패턴을 실제 위치로 교체
    // XML에서 "보관장소 :" 뒤의 공백+닫는괄호가 별도 <w:t>에 있음
    // 첫 번째만 교체 (2개 보관장소 중 첫 번째를 S/W, 두 번째를 매뉴얼로)
    assertReplaceRegex(/(<w:t[^>]*>)\s*\)/, `$1${esc(eq.manualLocation)})`, '보관장소');

    // ── 섹션 2~5: 기존 빈 행에 데이터 채우기 ──
    // 템플릿에 미리 생성된 빈 행(<w:r> 없는 셀)에 데이터를 주입한다.
    // 새 행을 삽입하면 셀 너비/테두리 등 서식이 깨지므로 기존 행을 유지한다.

    /**
     * 섹션의 빈 행에 데이터를 채운다.
     *
     * @param sectionMarker - 섹션 제목 텍스트 (e.g. '장비 위치 변동 이력')
     * @param dataRows - 행별 셀 데이터 배열
     * @param skipTrCount - 제목행+헤더행 건너뛸 수 (보통 2)
     * @param emptyRowCount - 템플릿에 있는 빈 행 수
     */
    const fillSectionRows = (
      sectionMarker: string,
      dataRows: string[][],
      skipTrCount: number,
      emptyRowCount: number
    ): void => {
      const sectionPos = xml.indexOf(sectionMarker);
      if (sectionPos === -1) {
        throw new InternalServerErrorException(
          `[${FORM_LABEL}] 섹션 '${sectionMarker}' 매칭 실패. 양식의 섹션 제목이 변경되었을 수 있습니다.`
        );
      }

      // 제목행 + 헤더행 건너뛰기
      let pos = sectionPos;
      for (let i = 0; i < skipTrCount; i++) {
        pos = xml.indexOf('</w:tr>', pos);
        if (pos === -1) {
          throw new InternalServerErrorException(
            `[${FORM_LABEL}] 섹션 '${sectionMarker}' 헤더 행 구조 불일치 (${skipTrCount}개 행 필요, ${i}개만 발견). 양식이 변경되었을 수 있습니다.`
          );
        }
        pos += '</w:tr>'.length;
      }

      // 빈 행 N개를 순서대로 처리
      for (let rowIdx = 0; rowIdx < emptyRowCount; rowIdx++) {
        const trStart = xml.indexOf('<w:tr', pos);
        if (trStart === -1) break;
        const trEnd = xml.indexOf('</w:tr>', trStart) + '</w:tr>'.length;
        const rowXml = xml.substring(trStart, trEnd);

        if (rowIdx < dataRows.length) {
          // 데이터가 있으면: 빈 셀에 텍스트 주입
          const cellData = dataRows[rowIdx];
          let cellIdx = 0;
          const filledRow = rowXml.replace(
            /<w:tc\b([^>]*)>([\s\S]*?)<\/w:tc>/g,
            (match, attrs, content) => {
              // <w:r>이 이미 있는 셀은 건너뛰기 (보통 없지만 방어)
              if (/<w:r\b/.test(content) || cellIdx >= cellData.length) return match;
              const value = esc(cellData[cellIdx++]);
              // </w:p> 앞에 <w:r> 삽입
              const newContent = content.replace(
                '</w:p>',
                `<w:r><w:rPr><w:rFonts w:ascii="굴림체" w:eastAsia="굴림체" w:hAnsi="굴림체"/><w:sz w:val="18"/></w:rPr><w:t>${value}</w:t></w:r></w:p>`
              );
              return `<w:tc${attrs}>${newContent}</w:tc>`;
            }
          );
          xml = xml.substring(0, trStart) + filledRow + xml.substring(trEnd);
          // 다음 행 위치 보정 (길이 변경)
          pos = trStart + filledRow.length;
        } else {
          // 데이터 없는 빈 행: 그대로 유지
          pos = trEnd;
        }
      }
    };

    // 위치 변동 이력: 제목(1)+헤더(1)=2 건너뛰기, 빈 행 5개
    fillSectionRows(
      '장비 위치 변동 이력',
      data.locationHistory.map((h) => [h.changedAt, h.newLocation, h.notes]),
      2,
      5
    );

    // 교정 이력: 제목(1)+헤더(1)=2 건너뛰기, 빈 행 9개
    fillSectionRows(
      '장비 교정 이력',
      data.calibrations.map((c) => [
        c.calibrationDate,
        c.agency ? `${c.result} (${c.agency})` : c.result,
        c.nextCalibrationDate,
      ]),
      2,
      9
    );

    // 유지보수 내역: 제목(1)+헤더(1)=2 건너뛰기, 빈 행 8개
    fillSectionRows(
      '장비 유지보수 내역',
      data.maintenanceHistory.map((m) => [m.performedAt, m.content]),
      2,
      8
    );

    // 손상/오작동/변경/수리 내역: 제목(1)+헤더(1)=2 건너뛰기, 빈 행 8개
    fillSectionRows(
      '장비 손상, 오작동',
      data.incidentHistory.map((inc) => [inc.occurredAt, inc.content]),
      2,
      8
    );

    // 장비사진 삽입
    if (data.equipmentPhotoPath) {
      xml = await this.insertEquipmentPhoto(zip, xml, data.equipmentPhotoPath);
    }

    // XML 업데이트
    zip.file('word/document.xml', xml);
    return Buffer.from(zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
  }

  /**
   * 장비사진을 DOCX에 삽입한다.
   * "장비사진" 라벨 옆 빈 셀의 </w:p> 앞에 인라인 이미지를 삽입.
   */
  private async insertEquipmentPhoto(zip: PizZip, xml: string, photoPath: string): Promise<string> {
    let imageBuffer: Buffer;
    try {
      imageBuffer = await this.storage.download(photoPath);
    } catch {
      this.logger.warn(`Failed to download equipment photo: ${photoPath}`);
      return xml;
    }

    const ext = photoPath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    // 1. word/media/ 에 이미지 파일 추가
    const imageFileName = `equipment_photo.${ext}`;
    zip.file(`word/media/${imageFileName}`, imageBuffer);

    // 2. word/_rels/document.xml.rels 에 relationship 추가
    const relsPath = 'word/_rels/document.xml.rels';
    let relsXml = zip.file(relsPath)!.asText();
    const rId = `rIdEquipPhoto`;
    const relEntry = `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imageFileName}"/>`;
    relsXml = relsXml.replace('</Relationships>', relEntry + '</Relationships>');
    zip.file(relsPath, relsXml);

    // 3. [Content_Types].xml 에 확장자 등록 (중복 방지)
    const ctPath = '[Content_Types].xml';
    let ctXml = zip.file(ctPath)!.asText();
    if (!ctXml.includes(`Extension="${ext}"`)) {
      ctXml = ctXml.replace(
        '</Types>',
        `<Default Extension="${ext}" ContentType="${contentType}"/></Types>`
      );
      zip.file(ctPath, ctXml);
    }

    // 4. "장비사진" 라벨 옆 빈 셀에 이미지 삽입
    // 사진 영역: 가로 12cm(4320000 EMU) × 세로 9cm(3240000 EMU)
    const cx = 4320000;
    const cy = 3240000;
    const drawingXml =
      `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
      `<wp:extent cx="${cx}" cy="${cy}"/>` +
      `<wp:docPr id="100" name="EquipmentPhoto"/>` +
      `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
      `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
      `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
      `<pic:nvPicPr><pic:cNvPr id="0" name="${imageFileName}"/><pic:cNvPicPr/></pic:nvPicPr>` +
      `<pic:blipFill><a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>` +
      `<a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
      `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
      `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
      `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;

    // "사진" 텍스트가 있는 셀의 다음 빈 셀을 찾아 삽입
    const photoTextIdx = xml.indexOf('사진');
    if (photoTextIdx === -1) return xml;

    // 사진 텍스트가 있는 <w:tc>의 끝을 찾고, 그 다음 <w:tc>의 </w:p> 앞에 삽입
    const nextTcStart = xml.indexOf('<w:tc', xml.indexOf('</w:tc>', photoTextIdx));
    if (nextTcStart === -1) return xml;

    const nextPEnd = xml.indexOf('</w:p>', nextTcStart);
    if (nextPEnd === -1) return xml;

    return xml.substring(0, nextPEnd) + drawingXml + xml.substring(nextPEnd);
  }

  /**
   * 라벨 행의 빈 셀에 전자서명 이미지를 삽입한다 (텍스트 fallback).
   */
  private async injectSignatureImage(
    zip: PizZip,
    xml: string,
    labelFragment: string,
    signaturePath: string,
    fallbackName: string
  ): Promise<string> {
    let imageBuffer: Buffer;
    try {
      imageBuffer = await this.storage.download(signaturePath);
    } catch {
      this.logger.warn(`Failed to load signature: ${signaturePath}`);
      return this.injectTextIntoEmptyCell(xml, labelFragment, fallbackName);
    }

    const ext = signaturePath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const imgFileName = `approver_signature.${ext}`;

    zip.file(`word/media/${imgFileName}`, imageBuffer);

    const relsPath = 'word/_rels/document.xml.rels';
    let relsXml = zip.file(relsPath)!.asText();
    const rId = 'rIdApproverSig';
    if (!relsXml.includes(rId)) {
      relsXml = relsXml.replace(
        '</Relationships>',
        `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imgFileName}"/></Relationships>`
      );
      zip.file(relsPath, relsXml);
    }

    const ctPath = '[Content_Types].xml';
    let ctXml = zip.file(ctPath)!.asText();
    if (!ctXml.includes(`Extension="${ext}"`)) {
      ctXml = ctXml.replace(
        '</Types>',
        `<Default Extension="${ext}" ContentType="${contentType}"/></Types>`
      );
      zip.file(ctPath, ctXml);
    }

    const cx = 900000;
    const cy = 540000;
    const drawingXml =
      `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
      `<wp:extent cx="${cx}" cy="${cy}"/>` +
      `<wp:docPr id="101" name="ApproverSignature"/>` +
      `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
      `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
      `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
      `<pic:nvPicPr><pic:cNvPr id="0" name="${imgFileName}"/><pic:cNvPicPr/></pic:nvPicPr>` +
      `<pic:blipFill><a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>` +
      `<a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
      `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
      `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
      `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;

    return this.injectDrawingIntoEmptyCell(xml, labelFragment, drawingXml);
  }

  private injectTextIntoEmptyCell(xml: string, labelFragment: string, value: string): string {
    const escVal = (v: string): string =>
      v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const rowRegex = /<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(xml)) !== null) {
      const rowText = rowMatch[0].replace(/<[^>]+>/g, '');
      if (!rowText.includes(labelFragment)) continue;
      const cellRegex = /<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g;
      let cellMatch: RegExpExecArray | null;
      while ((cellMatch = cellRegex.exec(rowMatch[0])) !== null) {
        if (!/<w:r\b/.test(cellMatch[0])) {
          const runXml = `<w:r><w:rPr><w:rFonts w:ascii="굴림체" w:eastAsia="굴림체" w:hAnsi="굴림체"/><w:sz w:val="18"/></w:rPr><w:t>${escVal(value)}</w:t></w:r>`;
          const newCell = cellMatch[0].replace('</w:p>', runXml + '</w:p>');
          const newRow = rowMatch[0].replace(cellMatch[0], newCell);
          return xml.replace(rowMatch[0], newRow);
        }
      }
      break;
    }
    return xml;
  }

  private injectDrawingIntoEmptyCell(
    xml: string,
    labelFragment: string,
    drawingXml: string
  ): string {
    const rowRegex = /<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(xml)) !== null) {
      const rowText = rowMatch[0].replace(/<[^>]+>/g, '');
      if (!rowText.includes(labelFragment)) continue;
      const cellRegex = /<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g;
      let cellMatch: RegExpExecArray | null;
      while ((cellMatch = cellRegex.exec(rowMatch[0])) !== null) {
        if (!/<w:r\b/.test(cellMatch[0])) {
          const newCell = cellMatch[0].replace('</w:p>', drawingXml + '</w:p>');
          const newRow = rowMatch[0].replace(cellMatch[0], newCell);
          return xml.replace(rowMatch[0], newRow);
        }
      }
      break;
    }
    return xml;
  }
}
