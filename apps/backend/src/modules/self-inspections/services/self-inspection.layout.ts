/**
 * UL-QP-18-05 자체점검표 DOCX 레이아웃 SSOT (backend-local).
 *
 * 원본 양식의 셀 좌표(테이블/행/열) + 빈 행 수 + 결재란 셀 인덱스를 SSOT로 분리.
 * 양식 개정 시 본 파일만 수정하면 renderer는 수정 불필요 (surgical update).
 *
 * ⚠️ 셀 좌표/빈 행 수는 **원본 docx 실측값**이어야 한다. 양식 개정 시 docx XML 덤프 후 재측정.
 *
 * @see docs/procedure/template/UL-QP-18-05(01) 자체점검표.docx — 원본 양식
 * @see docs/procedure/양식/QP-18-05_자체점검표.md — 양식 사양
 * @see docs/manual/report-export-mapping.md §3.5 — 현재 매핑 문서
 *
 * 프론트엔드 미참조: 양식 셀 레이아웃은 UI에 노출되지 않음.
 */

/** 양식 번호 (에러 메시지 prefix, 파일명 등에 사용) */
export const FORM_NUMBER = 'UL-QP-18-05' as const;

/**
 * DOCX 테이블 인덱스 SSOT.
 *
 * - HEADER(0): 장비 정보 헤더 + 점검 항목 (T0)
 * - SPECIAL_NOTES(1): 기타 특기사항 (T1)
 * - SIGN_OFF(2): 점검 결과 및 결재 (T2)
 */
export const TABLE_INDEX = {
  HEADER: 0,
  SPECIAL_NOTES: 1,
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
 * T0 점검 항목 섹션 — [번호, 점검항목, 점검결과] 3열.
 *
 * - tableIndex: HEADER(0)
 * - startRow: 6 (R0~R5: 헤더)
 * - emptyRows: 6 (양식 원본 Row 7~12 빈 행 6개)
 * - columns: 3
 * - resultColumnIndex: 2 (멀티라인 결과 셀 — 0-based, 번호=0/항목=1/결과=2)
 */
export const ITEMS_SECTION = {
  tableIndex: TABLE_INDEX.HEADER,
  startRow: 6,
  emptyRows: 6,
  columns: 3,
  resultColumnIndex: 2,
} as const;

/**
 * T1 기타 특기사항 섹션 — [번호, 내용, 일자] 3열.
 *
 * - tableIndex: SPECIAL_NOTES(1)
 * - startRow: 1 (R0: 타이틀)
 * - emptyRows: 2 (양식 원본 Row 2~3 빈 행 2개)
 * - columns: 3
 */
export const SPECIAL_NOTES_SECTION = {
  tableIndex: TABLE_INDEX.SPECIAL_NOTES,
  startRow: 1,
  emptyRows: 2,
  columns: 3,
} as const;

/**
 * T2 결재란 셀 좌표 (tableIndex=2).
 *
 * - R0: 점검일(C1) / 담당 라벨(C4) / 검토 라벨(C5) / 승인 라벨(C6)
 * - R1: 점검자(C1) / 담당 서명(C4) / 검토 서명(C5) / 승인 서명(C6)
 * - R2: 특기사항(C1)
 *
 * 결재 매핑 (UL-QP-18-05):
 * - 담당(C4) = submitter 서명 (시험실무자가 담당+검토 동일인)
 * - 검토(C5) = submitter 서명 (동일인 구조)
 * - 승인(C6) = approver 서명 (기술책임자)
 */
export const SIGN_OFF_CELLS = {
  inspectionDate: { row: 0, col: 1 },
  inspectorName: { row: 1, col: 1 },
  remarks: { row: 2, col: 1 },
  chargeSig: { row: 1, col: 4 },
  reviewSig: { row: 1, col: 5 },
  approveSig: { row: 1, col: 6 },
} as const satisfies Record<string, { row: number; col: number }>;
