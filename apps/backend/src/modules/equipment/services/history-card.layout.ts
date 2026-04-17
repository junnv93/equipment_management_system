/**
 * UL-QP-18-02 시험설비 이력카드 DOCX 레이아웃 SSOT (backend-local)
 *
 * docx 템플릿(`form-templates/UL-QP-18-02/*.docx`)의 셀 라벨·섹션 제목·빈 행 수·체크박스 패턴을
 * 서비스 코드에서 분리하여 양식 개정 시 surgical update가 가능하도록 한다.
 *
 * ⚠️ 각 상수의 문자열(특히 유니코드 공백 포함 fragment)은 **원본 docx의 실제 텍스트**와 1:1 일치해야 한다.
 *    양식 개정 시에는 docx를 XML로 덤프하여 실제 셀 텍스트를 확인한 후 수정할 것.
 *
 * @see docs/procedure/양식/QP-18-02_시험설비이력카드.md — 양식 사양
 * @see docs/procedure/절차서/장비관리절차서.md §7.7, §9.9 — 이력카드 필수 항목
 * @see docs/manual/report-export-mapping.md §3.2 — 현재 매핑 문서
 *
 * 프론트엔드 미참조: 양식 셀 레이아웃은 프론트 UI에 노출되지 않는다.
 * 공용 양식 메타(번호/이름/보존연한)는 `packages/shared-constants/src/form-catalog.ts` 참조.
 */

/** 양식 번호 (에러 메시지 prefix, 파일명 등에 사용) */
export const FORM_NUMBER = 'UL-QP-18-02' as const;

/** 날짜 포맷 — QP-18-02 전용 (`YYYY/MM/DD`). 다른 양식은 다른 포맷 사용. */
export const DATE_FORMAT = 'YYYY/MM/DD' as const;

/**
 * DOCX 셀 주입용 런(run) 공통 속성 — 굴림체 9pt (템플릿 기본 폰트 유지).
 * 양식 원본과 동일한 폰트로 표시되어야 인쇄물이 기존 양식과 구분되지 않는다.
 */
export const RUN_RPR_XML =
  '<w:rPr><w:rFonts w:ascii="굴림체" w:eastAsia="굴림체" w:hAnsi="굴림체"/><w:sz w:val="18"/></w:rPr>';

/**
 * 이미지 EMU 치수 (English Metric Units, 1 cm = 360000 EMU).
 *
 * - 승인자 서명: 2.5cm × 1.5cm 고정 (결재란 서명 영역)
 * - 장비 사진: **동적 계산** — 셀 가로에 맞추고 원본 비율 유지 (아래 EQUIPMENT_PHOTO_* 상수 참조)
 */
export const IMAGE_DIMENSIONS = {
  APPROVER_SIGNATURE: { cx: 900000, cy: 540000 },
} as const;

/**
 * 장비 사진 영역 제약 (UL-QP-18-02 양식 실측 기반).
 *
 * 렌더러가 `sharp`로 원본 이미지 치수를 읽어 비율을 유지한 채 다음 제약 내에서 cx/cy를 계산:
 * - 가로: 셀 가로(CELL_WIDTH_EMU)에 맞춤 — 세로가 허용 범위 내일 때
 * - 세로: 원본 비율로 계산 후 [MIN_HEIGHT_EMU, MAX_HEIGHT_EMU]로 클램프
 *   * 세로가 상한을 넘으면 세로를 max로 고정하고 가로를 비율에 맞게 축소
 *   * 세로가 하한 미만이면 세로를 min으로 고정하고 가로는 셀 가로를 상한으로 제한
 *
 * **실측 방법** (변경 시 재측정 필수):
 * 1. 원본 docx → `PizZip(buf).file('word/document.xml').asText()`
 * 2. "사진" 텍스트가 있는 셀의 **다음 셀** `<w:tcW w:w="7226" w:type="dxa"/>` 추출
 * 3. EMU 변환: `dxa × 635` (dxa = 1/20pt, EMU = 1/914400inch, 1pt=12700EMU → 1dxa=635EMU)
 * 4. 현재 측정값: 7226 dxa → 4,588,510 EMU = 12.75cm
 */
export const EQUIPMENT_PHOTO_CELL_WIDTH_EMU = 4_588_510 as const; // 12.75cm (셀 가로 실측)
export const EQUIPMENT_PHOTO_MAX_HEIGHT_EMU = 3_600_000 as const; // 10cm (양식 레이아웃 보호 상한)
export const EQUIPMENT_PHOTO_MIN_HEIGHT_EMU = 1_080_000 as const; // 3cm (식별 가능성 하한)

/**
 * DOCX 내 drawing 리소스 식별자 SSOT.
 *
 * OOXML `<wp:docPr id="..."/>` 는 문서 내 모든 드로잉 간 **고유 ID**여야 하고,
 * `<Relationship Id="..."/>` 는 relationship 파일 내 고유해야 한다.
 *
 * UL-QP-18-02 양식은 템플릿에 기본 drawing이 없어 아래 ID가 첫 할당이지만,
 * 향후 다른 양식에 drawing이 이미 있다면 충돌 없는 범위로 상향 조정해야 한다 (권장 ≥ 1000).
 */
export const DRAWING_IDS = {
  EQUIPMENT_PHOTO: {
    relationshipId: 'rIdEquipPhoto',
    docPrId: 100,
    fileBaseName: 'equipment_photo',
  },
  APPROVER_SIGNATURE: {
    relationshipId: 'rIdApproverSig',
    docPrId: 101,
    fileBaseName: 'approver_signature',
  },
} as const;

/**
 * 기본정보 셀 주입용 라벨 fragment + 대상 빈 셀 인덱스.
 *
 * 각 fragment는 해당 행을 식별하는 고유 텍스트 (XML 태그 제거 후 매칭).
 * `emptyCellIndex`는 해당 행에서 몇 번째 빈 셀에 값을 넣을지 지정 (0-based).
 *
 * 값은 원본 docx 템플릿의 실제 텍스트이며, **유니코드 공백 문자가 포함되어 있다**.
 * 수정 시 docx XML을 직접 확인할 것 (기존 `history-card.service.ts` L467-489 fragment 복사).
 */
export const CELL_LABELS = {
  /** 관리번호 행 — "관 리" 식별자 (공백 2개) */
  MANAGEMENT_NUMBER: { fragment: '관  리', emptyCellIndex: 0 },
  /** 자산번호 행 — "산 번" (asset number 단어 포함) */
  ASSET_NUMBER: { fragment: '산  번', emptyCellIndex: 0 },
  /** 장비명 행 */
  EQUIPMENT_NAME: { fragment: '장    비    명', emptyCellIndex: 0 },
  /** 부속품 & 주요기능 행 */
  ACCESSORIES: { fragment: '부 속 품', emptyCellIndex: 0 },
  /** 제조사명 행 */
  MANUFACTURER: { fragment: '제  조', emptyCellIndex: 0 },
  /** 제조사 연락처 */
  MANUFACTURER_CONTACT: { fragment: '제조사  연락처', emptyCellIndex: 0 },
  /** 공급사 */
  SUPPLIER: { fragment: '공    급    사', emptyCellIndex: 0 },
  /** 공급사 연락처 */
  SUPPLIER_CONTACT: { fragment: '공급사  연락처', emptyCellIndex: 0 },
  /** 일련번호 */
  SERIAL_NUMBER: { fragment: '일 련', emptyCellIndex: 0 },
  /** 운영 책임자 (정) — 같은 행 첫 번째 빈 셀 */
  MANAGER: { fragment: '운  영 책임자', emptyCellIndex: 0 },
  /** 교정주기 — "교 정 주 기" 행의 첫 번째 빈 셀 */
  CALIBRATION_CYCLE: { fragment: '교  정  주  기', emptyCellIndex: 0 },
  /** 운영 책임자 (부) — "교 정 주 기" 행의 두 번째 빈 셀 (같은 행에 부담당자도 위치) */
  DEPUTY_MANAGER: { fragment: '교  정  주  기', emptyCellIndex: 1 },
  /** 최초 설치 위치 */
  INITIAL_LOCATION: { fragment: '최초 설치 위치', emptyCellIndex: 0 },
  /** 설치일시 */
  INSTALLATION_DATE: { fragment: '설 치  일', emptyCellIndex: 0 },
  /** 승인자 서명/이름 주입용 식별 라벨 (제목행) */
  APPROVER_PANEL: { fragment: '시험설비 이력카드', emptyCellIndex: 0 },
} as const satisfies Record<string, { fragment: string; emptyCellIndex: number }>;

/**
 * 체크박스 치환 패턴 — "□" 기호를 "■"로 교체하여 선택 상태 표시.
 *
 * 원본 양식의 실제 텍스트: 공백 **3개**로 구분되어 있음.
 */
export const CHECKBOX_PATTERNS = {
  SPEC_MATCH: {
    template: '□일치   □불일치',
    checked_match: '■일치   □불일치',
    checked_mismatch: '□일치   ■불일치',
  },
  CALIBRATION_REQUIRED: {
    template: '□필요   □불필요',
    checked_required: '■필요   □불필요',
    checked_not_required: '□필요   ■불필요',
  },
} as const;

/**
 * 승인일 셀의 빈 날짜 구분자 — "/   /" (슬래시 사이 공백 3개)를 실제 날짜로 교체.
 */
export const APPROVAL_DATE_PLACEHOLDER = '/   /' as const;

/**
 * 매뉴얼/SW 보관장소 셀의 공백 패턴 regex — 첫 번째 "공백 + )" 패턴을 찾아 실제 값으로 교체.
 *
 * 원본 양식의 "보관장소 :" 뒤에 빈 공간 + 닫는 괄호가 별도 `<w:t>` 태그로 분리되어 있어
 * 일반 문자열 치환 불가. `replace()`는 첫 매칭만 대체.
 */
export const MANUAL_LOCATION_REGEX = /(<w:t[^>]*>)\s*\)/;

/**
 * 이력 섹션 레이아웃 — 각 섹션 제목 + 제목/헤더행 skip 수 + 빈 행 수 + 컬럼 수.
 *
 * 양식 원본은 섹션별로 고정된 수의 빈 행을 제공한다. 데이터가 많으면 뒤쪽 행은 잘리고,
 * 적으면 남은 빈 행은 그대로 유지된다 (양식 서식 보존).
 *
 * - headerSkip: 섹션 제목 행(1) + 컬럼 헤더 행(1) = 2행 건너뛰기
 * - emptyRows: 템플릿에 미리 생성된 빈 데이터 행 수
 * - columns: 각 빈 행의 데이터 셀 수 (주입 시 배열 길이)
 */
export const SECTIONS = {
  /** §2 장비 위치 변동 이력 — [변동일시, 설치 위치, 비고] */
  LOCATION: {
    title: '장비 위치 변동 이력',
    headerSkip: 2,
    emptyRows: 5,
    columns: 3,
  },
  /** §3 장비 교정 이력 — [교정일시, 주요 결과, 차기 교정 예정일] */
  CALIBRATION: {
    title: '장비 교정 이력',
    headerSkip: 2,
    emptyRows: 9,
    columns: 3,
  },
  /** §4 장비 유지보수 내역 — [일시, 주요 내용] */
  MAINTENANCE: {
    title: '장비 유지보수 내역',
    headerSkip: 2,
    emptyRows: 8,
    columns: 2,
  },
  /**
   * §5 장비 손상/오작동/변경/수리 내역 (통합 섹션) — [일시, 주요 내용]
   *
   * UL-QP-18 §9.9 + 개정14(2024.11.26) 요구에 따라 다음 3개 테이블을 합쳐 주입:
   * - equipment_incident_history
   * - repair_history
   * - non_conformances
   *
   * 통합 정렬/중복 제거 규칙은 `equipment-timeline.service.ts` 참조.
   */
  UNIFIED_INCIDENT: {
    title: '장비 손상, 오작동',
    headerSkip: 2,
    emptyRows: 8,
    columns: 2,
  },
} as const satisfies Record<
  string,
  { title: string; headerSkip: number; emptyRows: number; columns: number }
>;

/**
 * 사진 셀 탐색 앵커 — "사진" 텍스트가 있는 셀의 **다음** 셀을 사진 삽입 대상으로 사용.
 */
export const EQUIPMENT_PHOTO_ANCHOR = '사진' as const;
