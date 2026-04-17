import { Injectable, Inject, Logger } from '@nestjs/common';
import PizZip from 'pizzip';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../../common/storage/storage.interface';
import {
  FormRenderError,
  escapeXml,
  injectTextIntoLabeledCell,
  injectXmlIntoLabeledCell,
  assertReplace,
  assertReplaceRegex,
  fillSectionEmptyRows,
  addImageResource,
  buildInlineDrawingXml,
  formatYmdSlash,
} from '../../reports/docx-xml-helper';
import {
  FORM_NUMBER,
  RUN_RPR_XML,
  CELL_LABELS,
  CHECKBOX_PATTERNS,
  APPROVAL_DATE_PLACEHOLDER,
  MANUAL_LOCATION_REGEX,
  SECTIONS,
  IMAGE_DIMENSIONS,
  EQUIPMENT_PHOTO_ANCHOR,
} from './history-card.layout';
import type { HistoryCardData, HistoryCardEquipmentInfo } from './history-card-data.service';

/**
 * UL-QP-18-02 이력카드 DOCX 렌더러.
 *
 * HistoryCardData(집계 결과)를 받아 원본 템플릿에 주입한 DOCX 버퍼를 반환.
 * 매직 문자열/섹션명/빈 행 수는 전부 `history-card.layout.ts` SSOT에서 읽어들여 양식 개정 시 surgical update 가능.
 *
 * 렌더링 단계:
 * 1. 기본정보 셀 — CELL_LABELS의 각 라벨로 `injectTextIntoLabeledCell`
 * 2. 승인일 + 서명 — APPROVAL_DATE_PLACEHOLDER 치환 + 서명 이미지(또는 텍스트 fallback)
 * 3. 체크박스 — SPEC_MATCH / CALIBRATION_REQUIRED
 * 4. 보관장소 — MANUAL_LOCATION_REGEX 치환
 * 5. 이력 섹션 4개 — LOCATION / CALIBRATION / MAINTENANCE / UNIFIED_INCIDENT
 * 6. 장비사진 — EQUIPMENT_PHOTO_ANCHOR 기반
 */
@Injectable()
export class HistoryCardRendererService {
  private readonly logger = new Logger(HistoryCardRendererService.name);

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider
  ) {}

  async render(data: HistoryCardData, templateBuf: Buffer): Promise<Buffer> {
    const zip = new PizZip(templateBuf);
    const docFile = zip.file('word/document.xml');
    if (!docFile) {
      throw new FormRenderError(
        FORM_NUMBER,
        'word/document.xml 없음',
        '템플릿 zip 구조가 올바르지 않습니다.'
      );
    }
    let xml = docFile.asText();

    xml = this.injectBasicInfo(xml, data.equipment);
    xml = this.injectApprovalDate(xml, data.equipment.approvalDate);
    xml = await this.injectApproverSignature(
      zip,
      xml,
      data.approverSignaturePath,
      data.equipment.approverName
    );
    xml = this.applyCheckboxes(xml, data.equipment);
    xml = this.injectManualLocation(xml, data.equipment.manualLocation);
    xml = this.fillHistorySections(xml, data);
    xml = await this.injectEquipmentPhoto(zip, xml, data.equipmentPhotoPath);

    zip.file('word/document.xml', xml);
    return Buffer.from(zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
  }

  // ── 기본정보 셀 주입 ──────────────────────────────────────────────────
  private injectBasicInfo(xml: string, eq: HistoryCardEquipmentInfo): string {
    // layout.ts의 CELL_LABELS 정의에 1:1 매핑되는 값 배열
    const injections: ReadonlyArray<[keyof typeof CELL_LABELS, string]> = [
      ['MANAGEMENT_NUMBER', eq.managementNumber],
      ['ASSET_NUMBER', eq.assetNumber],
      ['EQUIPMENT_NAME', eq.name],
      ['ACCESSORIES', eq.accessories],
      ['MANUFACTURER', eq.manufacturer],
      ['MANUFACTURER_CONTACT', eq.manufacturerContact],
      ['SUPPLIER', eq.supplier],
      ['SUPPLIER_CONTACT', eq.supplierContact],
      ['SERIAL_NUMBER', eq.serialNumber],
      ['MANAGER', eq.managerName],
      ['CALIBRATION_CYCLE', eq.calibrationCycle],
      ['DEPUTY_MANAGER', eq.deputyManagerName],
      ['INITIAL_LOCATION', eq.initialLocation],
      ['INSTALLATION_DATE', eq.installationDate],
    ];
    let currentXml = xml;
    for (const [key, value] of injections) {
      const { fragment, emptyCellIndex } = CELL_LABELS[key];
      currentXml = injectTextIntoLabeledCell(
        currentXml,
        fragment,
        value,
        emptyCellIndex,
        RUN_RPR_XML,
        FORM_NUMBER
      );
    }
    return currentXml;
  }

  // ── 승인일 치환 ────────────────────────────────────────────────────
  private injectApprovalDate(xml: string, approvalDate: string): string {
    return assertReplace(
      xml,
      APPROVAL_DATE_PLACEHOLDER,
      escapeXml(approvalDate),
      '승인일자',
      FORM_NUMBER
    );
  }

  // ── 승인자 서명 (이미지 + 텍스트 fallback) ───────────────────────────
  private async injectApproverSignature(
    zip: PizZip,
    xml: string,
    signaturePath: string | null,
    approverName: string
  ): Promise<string> {
    const { fragment, emptyCellIndex } = CELL_LABELS.APPROVER_PANEL;

    if (!signaturePath) {
      return injectTextIntoLabeledCell(
        xml,
        fragment,
        approverName,
        emptyCellIndex,
        RUN_RPR_XML,
        FORM_NUMBER
      );
    }

    let imageBuffer: Buffer;
    try {
      imageBuffer = await this.storage.download(signaturePath);
    } catch {
      this.logger.warn(`Failed to load approver signature: ${signaturePath}`);
      return injectTextIntoLabeledCell(
        xml,
        fragment,
        approverName,
        emptyCellIndex,
        RUN_RPR_XML,
        FORM_NUMBER
      );
    }

    const ext = signaturePath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
    const fileName = `approver_signature.${ext}`;
    const rId = 'rIdApproverSig';
    addImageResource(zip, imageBuffer, fileName, ext, rId);

    const drawing = buildInlineDrawingXml(
      rId,
      fileName,
      101,
      IMAGE_DIMENSIONS.APPROVER_SIGNATURE.cx,
      IMAGE_DIMENSIONS.APPROVER_SIGNATURE.cy
    );
    return injectXmlIntoLabeledCell(xml, fragment, drawing);
  }

  // ── 체크박스 (시방일치 / 교정필요) ───────────────────────────────────
  private applyCheckboxes(xml: string, eq: HistoryCardEquipmentInfo): string {
    let currentXml = xml;
    const spec = CHECKBOX_PATTERNS.SPEC_MATCH;
    if (eq.specMatch === '일치') {
      currentXml = assertReplace(
        currentXml,
        spec.template,
        spec.checked_match,
        '시방일치 체크박스',
        FORM_NUMBER
      );
    } else if (eq.specMatch === '불일치') {
      currentXml = assertReplace(
        currentXml,
        spec.template,
        spec.checked_mismatch,
        '시방일치 체크박스',
        FORM_NUMBER
      );
    }

    const cal = CHECKBOX_PATTERNS.CALIBRATION_REQUIRED;
    if (eq.calibrationRequired === '필요') {
      currentXml = assertReplace(
        currentXml,
        cal.template,
        cal.checked_required,
        '교정필요 체크박스',
        FORM_NUMBER
      );
    } else if (eq.calibrationRequired === '불필요') {
      currentXml = assertReplace(
        currentXml,
        cal.template,
        cal.checked_not_required,
        '교정필요 체크박스',
        FORM_NUMBER
      );
    }
    return currentXml;
  }

  // ── 보관장소 regex 치환 ───────────────────────────────────────────
  private injectManualLocation(xml: string, manualLocation: string): string {
    return assertReplaceRegex(
      xml,
      MANUAL_LOCATION_REGEX,
      `$1${escapeXml(manualLocation)})`,
      '보관장소',
      FORM_NUMBER
    );
  }

  // ── 이력 섹션 4개 채우기 ──────────────────────────────────────────
  private fillHistorySections(xml: string, data: HistoryCardData): string {
    let currentXml = xml;

    // §2 위치 변동 이력
    currentXml = fillSectionEmptyRows(
      currentXml,
      SECTIONS.LOCATION.title,
      data.locationHistory.map((h) => [h.changedAt, h.newLocation, h.notes]),
      SECTIONS.LOCATION.headerSkip,
      SECTIONS.LOCATION.emptyRows,
      RUN_RPR_XML,
      FORM_NUMBER
    );

    // §3 교정 이력 — 주요결과는 `result (agency)` 합성
    currentXml = fillSectionEmptyRows(
      currentXml,
      SECTIONS.CALIBRATION.title,
      data.calibrations.map((c) => [
        c.calibrationDate,
        c.agency ? `${c.result} (${c.agency})` : c.result,
        c.nextCalibrationDate,
      ]),
      SECTIONS.CALIBRATION.headerSkip,
      SECTIONS.CALIBRATION.emptyRows,
      RUN_RPR_XML,
      FORM_NUMBER
    );

    // §4 유지보수 내역
    currentXml = fillSectionEmptyRows(
      currentXml,
      SECTIONS.MAINTENANCE.title,
      data.maintenanceHistory.map((m) => [m.performedAt, m.content]),
      SECTIONS.MAINTENANCE.headerSkip,
      SECTIONS.MAINTENANCE.emptyRows,
      RUN_RPR_XML,
      FORM_NUMBER
    );

    // §5 통합 이력: incident + repair + non_conformances
    // UL-QP-18 §9.9 개정14: 3개 테이블을 한 섹션에 합쳐 표시
    currentXml = fillSectionEmptyRows(
      currentXml,
      SECTIONS.UNIFIED_INCIDENT.title,
      data.timeline.map((entry) => [
        formatYmdSlash(entry.occurredAt),
        `[${entry.label}] ${entry.content}`,
      ]),
      SECTIONS.UNIFIED_INCIDENT.headerSkip,
      SECTIONS.UNIFIED_INCIDENT.emptyRows,
      RUN_RPR_XML,
      FORM_NUMBER
    );

    return currentXml;
  }

  // ── 장비사진 ──────────────────────────────────────────────────────
  private async injectEquipmentPhoto(
    zip: PizZip,
    xml: string,
    photoPath: string | null
  ): Promise<string> {
    if (!photoPath) return xml;

    let imageBuffer: Buffer;
    try {
      imageBuffer = await this.storage.download(photoPath);
    } catch {
      this.logger.warn(`Failed to download equipment photo: ${photoPath}`);
      return xml;
    }

    const ext = photoPath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
    const fileName = `equipment_photo.${ext}`;
    const rId = 'rIdEquipPhoto';
    addImageResource(zip, imageBuffer, fileName, ext, rId);

    const drawing = buildInlineDrawingXml(
      rId,
      fileName,
      100,
      IMAGE_DIMENSIONS.EQUIPMENT_PHOTO.cx,
      IMAGE_DIMENSIONS.EQUIPMENT_PHOTO.cy
    );

    // "사진" 텍스트가 있는 셀의 다음 셀에 삽입 (양식 내 고정 레이아웃)
    const anchorIdx = xml.indexOf(EQUIPMENT_PHOTO_ANCHOR);
    if (anchorIdx === -1) return xml;
    const nextTcStart = xml.indexOf('<w:tc', xml.indexOf('</w:tc>', anchorIdx));
    if (nextTcStart === -1) return xml;
    const nextPEnd = xml.indexOf('</w:p>', nextTcStart);
    if (nextPEnd === -1) return xml;
    return xml.substring(0, nextPEnd) + drawing + xml.substring(nextPEnd);
  }
}
