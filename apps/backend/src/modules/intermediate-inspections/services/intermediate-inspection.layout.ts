/**
 * UL-QP-18-03 중간점검표 DOCX 레이아웃 SSOT (backend-local).
 *
 * 원본 양식의 셀 좌표(테이블/행/열) + 빈 행 수 + 결재란 셀 인덱스를 SSOT로 분리.
 * 양식 개정 시 본 파일만 수정하면 renderer는 수정 불필요 (surgical update).
 *
 * ⚠️ 셀 좌표/빈 행 수는 **원본 docx 실측값**이어야 한다. 양식 개정 시 docx XML 덤프 후 재측정.
 *
 * @see docs/procedure/template/UL-QP-18-03(02) 중간점검표.docx — 원본 양식
 * @see docs/procedure/양식/QP-18-03_중간점검표.md — 양식 사양
 * @see docs/manual/report-export-mapping.md §3.3 — 현재 매핑 문서
 *
 * 프론트엔드 미참조: 양식 셀 레이아웃은 UI에 노출되지 않음.
 */

/** 양식 번호 (에러 메시지 prefix, 파일명 등에 사용) */
export const FORM_NUMBER = 'UL-QP-18-03' as const;

/**
 * DOCX 테이블 인덱스 SSOT.
 *
 * - HEADER(0): 장비 정보 헤더 + 점검 항목 (T0)
 * - MEASURE_EQUIPMENT(1): 측정 장비 List (T1)
 * - SIGN_OFF(2): 점검 결과 및 결재 (T2)
 */
export const TABLE_INDEX = {
  HEADER: 0,
  MEASURE_EQUIPMENT: 1,
  SIGN_OFF: 2,
} as const;

/**
 * T0 장비 정보 헤더 셀 좌표 — 값을 교체할 셀 인덱스 (tableIndex=0).
 *
 * 양식 원본(T0) 구조:
 * - R0: 분류(C0 라벨, C1 값)    | 관리팀(C2 라벨, C3 값)
 * - R1: 관리번호(C0 라벨, C1 값) | 장비위치(C2 라벨, C3 값)
 * - R2: 장비명(C0 라벨, C1 값)   | 모델명(C2 라벨, C3 값)
 * - R3: 점검주기(C0 라벨, C1 값) | 교정유효기간(C2 라벨, C3 값)
 * - R4: 구분행(유지)
 * - R5: 항목 헤더행(유지)
 * - R6+: 점검 항목 데이터
 */
export const HEADER_CELLS = {
  classification: { row: 0, col: 1 },
  teamName: { row: 0, col: 3 },
  managementNumber: { row: 1, col: 1 },
  location: { row: 1, col: 3 },
  equipmentName: { row: 2, col: 1 },
  modelName: { row: 2, col: 3 },
  inspectionCycle: { row: 3, col: 1 },
  validityPeriod: { row: 3, col: 3 },
} as const satisfies Record<string, { row: number; col: number }>;

/**
 * T0 점검 항목 섹션 — [번호, 점검항목, 점검기준, 점검결과, 판정] 5열.
 *
 * - tableIndex: HEADER(0)
 * - startRow: 6 (R0~R5: 헤더)
 * - emptyRows: 4 (양식 원본 Row 7~10 빈 행 4개)
 * - columns: 5
 * - resultColumnIndex: 3 (멀티라인 결과 셀 위치 — 0-based, 번호=0/항목=1/기준=2/결과=3/판정=4)
 */
export const ITEMS_SECTION = {
  tableIndex: TABLE_INDEX.HEADER,
  startRow: 6,
  emptyRows: 4,
  columns: 5,
  resultColumnIndex: 3,
} as const;

/**
 * T1 측정 장비 List — [No, 관리번호, 장비명, 교정일] 4열.
 *
 * - tableIndex: MEASURE_EQUIPMENT(1)
 * - startRow: 2 (R0: 타이틀, R1: 헤더)
 * - emptyRows: 3 (양식 원본 Row 3~5 빈 행 3개)
 * - columns: 4
 */
export const MEASURE_EQUIPMENT_SECTION = {
  tableIndex: TABLE_INDEX.MEASURE_EQUIPMENT,
  startRow: 2,
  emptyRows: 3,
  columns: 4,
} as const;

/**
 * T2 결재란 셀 좌표 (tableIndex=2).
 *
 * - R0: 점검일(C1) / 담당 라벨(C4) / 검토 라벨(C5) / 승인 라벨(C6)
 * - R1: 점검자(C1) / 담당 서명(C4) / 검토 서명(C5) / 승인 서명(C6)
 * - R2: 특기사항(C1)
 *
 * 결재 매핑 (UL-QP-18-03):
 * - 담당(C4) = inspector 서명
 * - 검토(C5) = inspector 서명 (동일인 — 담당/검토 1인 구조)
 * - 승인(C6) = approver 서명
 */
export const SIGN_OFF_CELLS = {
  inspectionDate: { row: 0, col: 1 },
  inspectorName: { row: 1, col: 1 },
  remarks: { row: 2, col: 1 },
  chargeSig: { row: 1, col: 4 },
  reviewSig: { row: 1, col: 5 },
  approveSig: { row: 1, col: 6 },
} as const satisfies Record<string, { row: number; col: number }>;
