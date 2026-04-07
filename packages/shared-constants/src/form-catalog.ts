/**
 * UL-QP-18/19 양식 카탈로그 — 단일 진실 공급원 (SSOT)
 *
 * 양식 번호, 공식 문서명, 보존연한, 구현 상태를 하나의 카탈로그로 관리합니다.
 * 양식명은 UL-QP-18/19 절차서의 공식 문서명이므로 i18n 대상이 아닙니다.
 *
 * ⚠️ 주의: 양식 번호, 양식명, 보존연한은 공식 절차서 원문에서만 가져와야 합니다.
 *    AI가 추측하거나 임의로 생성하지 마세요. 절차서 원문을 확인한 후에만 수정하세요.
 */

/**
 * 양식 카테고리 (UL-QP-03 §6.1)
 * - quality: 품질 양식 (품질책임자 관리)
 * - technical: 기술 양식 (기술 부서 관리, UL-QP-18/19 계열)
 */
export type FormCategory = 'quality' | 'technical';

export interface FormCatalogEntry {
  /** 양식 번호 (예: 'UL-QP-18-01') */
  formNumber: string;
  /** 공식 양식명 (UL 절차서 문서명) */
  name: string;
  /** 보존연한 (년), -1 = 영구보존 */
  retentionYears: number;
  /** 보존연한 표시 라벨 */
  retentionLabel: string;
  /** 양식 내보내기 구현 여부 */
  implemented: boolean;
  /** 양식 카테고리 — 권장 관리자 안내용 (권한 강제 X) */
  category: FormCategory;
  /** 전용 엔드포인트로 안내 (별도 API 경로 존재 시) */
  dedicatedEndpoint?: boolean;
}

export const FORM_CATALOG: Record<string, FormCatalogEntry> = {
  'UL-QP-18-01': {
    formNumber: 'UL-QP-18-01',
    name: '시험설비 관리대장',
    retentionYears: -1,
    retentionLabel: '영구보존',
    implemented: true,
    category: 'technical',
  },
  'UL-QP-18-02': {
    formNumber: 'UL-QP-18-02',
    name: '시험설비 이력카드',
    retentionYears: -1,
    retentionLabel: '영구보존',
    implemented: false,
    category: 'technical',
    dedicatedEndpoint: true,
  },
  'UL-QP-18-03': {
    formNumber: 'UL-QP-18-03',
    name: '중간 점검표',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: true,
    category: 'technical',
  },
  'UL-QP-18-05': {
    formNumber: 'UL-QP-18-05',
    name: '자체 점검표',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: true,
    category: 'technical',
  },
  'UL-QP-18-06': {
    formNumber: 'UL-QP-18-06',
    name: '장비 반·출입 확인서',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: false,
    category: 'technical',
  },
  'UL-QP-18-07': {
    formNumber: 'UL-QP-18-07',
    name: '시험용 소프트웨어 관리대장',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: true,
    category: 'technical',
  },
  'UL-QP-18-08': {
    formNumber: 'UL-QP-18-08',
    name: 'Cable and Path Loss 관리 대장',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: true,
    category: 'technical',
  },
  'UL-QP-18-09': {
    formNumber: 'UL-QP-18-09',
    name: '시험 소프트웨어의 유효성확인',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: true,
    category: 'technical',
  },
  'UL-QP-18-10': {
    formNumber: 'UL-QP-18-10',
    name: '공용 장비 사용/반납 확인서',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: false,
    category: 'technical',
  },
  'UL-QP-18-11': {
    formNumber: 'UL-QP-18-11',
    name: '보정인자 및 파라미터 관리대장',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: false,
    category: 'technical',
  },

  // ============================================================================
  // UL-QP-19: 교정 절차서 양식
  // ============================================================================
  'UL-QP-19-01': {
    formNumber: 'UL-QP-19-01',
    name: '연간 교정계획서',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: true,
    category: 'technical',
    dedicatedEndpoint: true,
  },
};

export type FormNumber = string;

export const FORM_NUMBERS = Object.keys(FORM_CATALOG);

export function isFormImplemented(formNumber: string): boolean {
  return FORM_CATALOG[formNumber]?.implemented === true;
}

export function isFormDedicatedEndpoint(formNumber: string): boolean {
  return FORM_CATALOG[formNumber]?.dedicatedEndpoint === true;
}

/**
 * 양식명 → 카탈로그 엔트리 인덱스 (빌드 타임 구성, O(1) 조회).
 *
 * FORM_CATALOG 키는 `initialFormNumber`(최초 등록 시점의 번호)이지만,
 * 런타임에서 양식명(안정 식별자)으로 메타데이터를 찾는 경우가 많아 역인덱스를 미리 구성합니다.
 */
const FORM_CATALOG_BY_NAME: ReadonlyMap<string, FormCatalogEntry> = new Map(
  Object.values(FORM_CATALOG).map((entry) => [entry.name, entry])
);

/**
 * 양식명으로 카탈로그 엔트리 조회 (O(1)).
 *
 * 양식 번호가 개정되어도 양식명은 변하지 않으므로, DB의 `form_templates.formName`을
 * FORM_CATALOG 메타데이터(retention/implemented/dedicatedEndpoint)에 매핑할 때 사용.
 */
export function getFormCatalogEntryByName(name: string): FormCatalogEntry | undefined {
  return FORM_CATALOG_BY_NAME.get(name);
}

/** 카탈로그의 모든 양식명 (절차서 공식 명칭) */
export const FORM_NAMES: readonly string[] = Array.from(FORM_CATALOG_BY_NAME.keys());
