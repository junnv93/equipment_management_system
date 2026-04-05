/**
 * UL-QP-18 양식 카탈로그 — 단일 진실 공급원 (SSOT)
 *
 * 양식 번호, 공식 문서명, 보존연한, 구현 상태를 하나의 카탈로그로 관리합니다.
 * 양식명은 UL-QP-18 절차서의 공식 문서명이므로 i18n 대상이 아닙니다.
 */

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
  /** 전용 엔드포인트로 안내 (별도 API 경로 존재 시) */
  dedicatedEndpoint?: boolean;
}

export const FORM_CATALOG = {
  'UL-QP-18-01': {
    formNumber: 'UL-QP-18-01',
    name: '시험설비 관리 대장',
    retentionYears: -1,
    retentionLabel: '영구보존',
    implemented: true,
  },
  'UL-QP-18-02': {
    formNumber: 'UL-QP-18-02',
    name: '시험설비 이력카드',
    retentionYears: -1,
    retentionLabel: '영구보존',
    implemented: false,
    dedicatedEndpoint: true,
  },
  'UL-QP-18-03': {
    formNumber: 'UL-QP-18-03',
    name: '중간점검표',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: false,
  },
  'UL-QP-18-04': {
    formNumber: 'UL-QP-18-04',
    name: '교정 성적서',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: false,
  },
  'UL-QP-18-05': {
    formNumber: 'UL-QP-18-05',
    name: '자체점검표',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: true,
  },
  'UL-QP-18-06': {
    formNumber: 'UL-QP-18-06',
    name: '교정계획서',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: false,
  },
  'UL-QP-18-07': {
    formNumber: 'UL-QP-18-07',
    name: '시험용 소프트웨어 관리대장',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: false,
  },
  'UL-QP-18-08': {
    formNumber: 'UL-QP-18-08',
    name: 'Cable/Path Loss 관리대장',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: false,
  },
  'UL-QP-18-09': {
    formNumber: 'UL-QP-18-09',
    name: '소프트웨어 유효성 확인',
    retentionYears: 5,
    retentionLabel: '5년',
    implemented: false,
  },
  'UL-QP-18-10': {
    formNumber: 'UL-QP-18-10',
    name: '반출/반입 기록',
    retentionYears: 3,
    retentionLabel: '3년',
    implemented: false,
  },
  'UL-QP-18-11': {
    formNumber: 'UL-QP-18-11',
    name: '부적합 보고서',
    retentionYears: 3,
    retentionLabel: '3년',
    implemented: false,
  },
} as const satisfies Record<string, FormCatalogEntry>;

export type FormNumber = keyof typeof FORM_CATALOG;

export const FORM_NUMBERS = Object.keys(FORM_CATALOG) as FormNumber[];

export function isFormImplemented(formNumber: string): boolean {
  const entry = FORM_CATALOG[formNumber as FormNumber];
  return entry?.implemented === true;
}

export function isFormDedicatedEndpoint(formNumber: string): boolean {
  const entry = FORM_CATALOG[formNumber as FormNumber];
  return entry?.dedicatedEndpoint === true;
}
