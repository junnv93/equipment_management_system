/**
 * UL-QP-18-09 시험 소프트웨어 유효성확인 DOCX 레이아웃 SSOT (backend-local).
 *
 * 원본 양식의 셀 좌표(테이블/행/열)를 SSOT로 분리.
 * 양식 개정 시 본 파일만 수정하면 renderer는 수정 불필요 (surgical update).
 *
 * ⚠️ 셀 좌표는 **원본 docx 실측값**이어야 한다. 양식 개정 시 docx XML 덤프 후 재측정.
 *
 * @see docs/procedure/template/UL-QP-18-09(02) 시험소프트웨어유효성확인.docx — 원본 양식
 * @see docs/procedure/양식/QP-18-09_*.md — 양식 사양
 */

/** 양식 번호 (에러 메시지 prefix, 파일명 등에 사용) */
export const FORM_NUMBER = 'UL-QP-18-09' as const;

/**
 * DOCX 테이블 인덱스 SSOT.
 *
 * 방법 1 (공급자 시연): T0~T2
 * - T0: 기본정보 (3행2열) — R0: Vendor, R1: SW Name, R2: Version/Date
 * - T1: 검증내용 (5행2열) — R0: infoDate+Summary, R1~R4: 상세
 * - T2: 수령정보 (3행2열) — R0: Receiver, R1: Date, R2: Attachments
 *
 * 방법 2 (UL 자체 시험): T3~T8
 * - T3: 기본정보 (7행2열) — R0~R6: Name/Author/Version/References/Operating/SW/HW
 * - T4: 획득기능 (3행2열) — R0: Name, R1: Means(독립방법), R2: Criteria(수락기준)
 * - T5: 프로세싱기능 (3행2열) — R0: Name, R1: Means, R2: Criteria
 * - T6: 제어기능 (4행4열) — R0: Header, R1~R3: equipmentFunction/expectedFunction/observedFunction/criteria
 * - T7: 수락기준 (1행2열) — (템플릿 유지)
 * - T8: 승인란 (3행2열) — R0: Date, R1: Performer, R2: QualityApprover(col0)/TechApprover(col1)
 */
export const TABLE_INDEX = {
  // 방법 1
  VENDOR_BASIC: 0,
  VENDOR_CONTENT: 1,
  VENDOR_RECEIPT: 2,
  // 방법 2
  SELF_BASIC: 3,
  ACQUISITION: 4,
  PROCESSING: 5,
  CONTROL: 6,
  ACCEPTANCE: 7,
  SIGN_OFF: 8,
} as const;

/** T0 방법1 기본정보 셀 좌표 */
export const VENDOR_BASIC_CELLS = {
  vendorName: { row: 0, col: 1 },
  softwareNameVersion: { row: 1, col: 1 },
  versionDate: { row: 2, col: 1 },
} as const;

/** T1 방법1 검증내용 셀 좌표 */
export const VENDOR_CONTENT_CELLS = {
  infoDate: { row: 0, col: 0 },
  summary: { row: 0, col: 1 },
} as const;

/** T2 방법1 수령정보 셀 좌표 */
export const VENDOR_RECEIPT_CELLS = {
  receiverName: { row: 0, col: 1 },
  receivedDate: { row: 1, col: 1 },
  attachmentNote: { row: 2, col: 1 },
} as const;

/** T3 방법2 기본정보 셀 좌표 */
export const SELF_BASIC_CELLS = {
  softwareNameVersion: { row: 0, col: 1 },
  softwareAuthor: { row: 1, col: 1 },
  softwareVersion: { row: 2, col: 1 },
  referenceDocuments: { row: 3, col: 1 },
  operatingUnit: { row: 4, col: 1 },
  softwareComponents: { row: 5, col: 1 },
  hardwareComponents: { row: 6, col: 1 },
} as const;

/**
 * T4/T5 획득/프로세싱 기능 셀 좌표 — R0=Name, R1=Means(독립방법), R2=Criteria(수락기준).
 * data col은 항상 1 (col0 = 라벨).
 */
export const FUNCTION_ITEM_DATA_COL = 1 as const;
export const FUNCTION_ITEM_ROWS = {
  name: 0,
  independentMethod: 1, // 독립 방법 (Means) — 절차서 QP-18-09 T4/T5 R1
  acceptanceCriteria: 2, // 수락 기준 (Criteria) — 절차서 QP-18-09 T4/T5 R2
} as const;

/**
 * T6 제어기능 셀 좌표 — 4열 구조.
 * R0 = 헤더(유지), R1~R3 = 데이터 행.
 * 열: col0=장비기능, col1=예상기능, col2=확인기능, col3=수락기준
 */
export const CONTROL_DATA_START_ROW = 1 as const;
export const CONTROL_COLS = {
  equipmentFunction: 0,
  expectedFunction: 1,
  observedFunction: 2,
  acceptanceCriteria: 3,
} as const;

/** T8 승인란 셀 좌표 */
export const SIGN_OFF_CELLS = {
  testDate: { row: 0, col: 1 },
  performerName: { row: 1, col: 1 },
  qualityApproverSig: { row: 2, col: 0 },
  techApproverSig: { row: 2, col: 1 },
} as const;
