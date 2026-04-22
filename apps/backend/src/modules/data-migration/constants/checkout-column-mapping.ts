/**
 * 반출입 이력 시트 컬럼 매핑 (SSOT)
 *
 * 1행 = 1 checkouts 레코드 + 1 checkout_items 레코드
 *
 * status 자동 결정 (buildCheckoutValues에서 처리):
 * - actualReturnDate 있음 → 'return_approved' (완료된 이력)
 * - actualReturnDate 없음 + checkoutDate 과거 → 'checked_out' (진행 중)
 * - checkoutDate 미래 또는 없음 → 'approved' (예정)
 *
 * requesterId 필수 → requesterEmail/requesterName 중 최소 1개 필수
 * FK 해석 실패 시 해당 행은 ERROR (임의 사용자 배정 금지)
 */
import type { CheckoutPurpose, CheckoutType } from '@equipment-management/schemas';
import {
  CHECKOUT_PURPOSE_VALUES,
  CHECKOUT_TYPE_VALUES,
  CHECKOUT_PURPOSE_LABELS,
  CHECKOUT_TYPE_LABELS,
} from '@equipment-management/schemas';
import {
  type ColumnMappingEntry,
  parseExcelDate,
  buildAliasIndex,
} from './equipment-column-mapping';

/** 반출 목적 alias → CheckoutPurpose enum 매핑 */
const PURPOSE_MAP: Record<string, CheckoutPurpose> = {
  교정: 'calibration',
  calibration: 'calibration',
  수리: 'repair',
  repair: 'repair',
  대여: 'rental',
  rental: 'rental',
  '렌탈 반납': 'return_to_vendor',
  return_to_vendor: 'return_to_vendor',
  렌탈반납: 'return_to_vendor',
};

/** 반출 유형 alias → CheckoutType enum 매핑 */
const TYPE_MAP: Record<string, CheckoutType> = {
  교정: 'calibration',
  calibration: 'calibration',
  수리: 'repair',
  repair: 'repair',
  대여: 'rental',
  rental: 'rental',
};

/** SSOT 라벨 맵에서 hint 문자열 생성 */
function enumHintFromValues(values: readonly string[], labels: Record<string, string>): string {
  return values.map((v) => labels[v] ?? v).join('/');
}

export function mapCheckoutPurpose(value: unknown): CheckoutPurpose | undefined {
  if (!value || typeof value !== 'string') return undefined;
  return PURPOSE_MAP[value.trim().toLowerCase()] ?? PURPOSE_MAP[value.trim()];
}

export function mapCheckoutType(value: unknown): CheckoutType | undefined {
  if (!value || typeof value !== 'string') return undefined;
  return TYPE_MAP[value.trim().toLowerCase()] ?? TYPE_MAP[value.trim()];
}

/**
 * 반출입 이력 컬럼 매핑 테이블
 */
export const CHECKOUT_COLUMN_MAPPING: ColumnMappingEntry[] = [
  // ── 장비 참조 (필수) ───────────────────────────────────────────────────────
  {
    dbField: 'managementNumber',
    aliases: ['관리번호', '장비번호', 'Management Number', 'Mgmt No.'],
    required: true,
  },

  // ── 반출 기본 정보 (필수) ───────────────────────────────────────────────────
  {
    dbField: 'checkoutDate',
    aliases: ['반출일', '반출일자', 'Checkout Date', '반출 일자'],
    required: true,
    transform: parseExcelDate,
  },
  {
    dbField: 'expectedReturnDate',
    aliases: ['예상반입일', '예상 반입일', '예정 반입일', 'Expected Return Date'],
    required: true,
    transform: parseExcelDate,
  },
  {
    dbField: 'purpose',
    aliases: ['반출목적', '반출 목적', '목적', 'Purpose'],
    required: true,
    transform: mapCheckoutPurpose,
    headerLabel: `반출목적(${enumHintFromValues(CHECKOUT_PURPOSE_VALUES, CHECKOUT_PURPOSE_LABELS)}) *`,
  },
  {
    dbField: 'destination',
    aliases: ['반출장소', '반출 장소', '장소', 'Destination'],
    required: true,
  },
  {
    dbField: 'reason',
    aliases: ['반출사유', '반출 사유', '사유', 'Reason'],
    required: true,
  },

  // ── 신청자 (필수 — FK 해석, requesterEmail/requesterName 중 최소 1개 필요) ─
  {
    dbField: 'requesterEmail',
    aliases: ['신청자이메일', '신청자 이메일', '담당자이메일', 'Requester Email'],
  },
  {
    dbField: 'requesterName',
    aliases: ['신청자', '신청자명', '반출신청자', 'Requester', 'Requester Name'],
  },

  // ── 선택 정보 ─────────────────────────────────────────────────────────────
  {
    dbField: 'actualReturnDate',
    aliases: ['실제반입일', '반입일', '반납일', 'Actual Return Date', '실제 반입일'],
    transform: parseExcelDate,
  },
  {
    dbField: 'checkoutType',
    aliases: ['반출유형', '반출 유형', '유형', 'Checkout Type'],
    transform: mapCheckoutType,
    headerLabel: `반출유형(${enumHintFromValues(CHECKOUT_TYPE_VALUES, CHECKOUT_TYPE_LABELS)})`,
  },
  {
    dbField: 'phoneNumber',
    aliases: ['연락처', '전화번호', 'Phone Number', 'Phone'],
  },
  {
    dbField: 'address',
    aliases: ['주소', '반출지주소', 'Address'],
  },
  {
    dbField: 'rejectionReason',
    aliases: ['반려사유', '반려 사유', 'Rejection Reason'],
  },

  // ── 승인자/반납자 FK 해석용 가상 필드 ─────────────────────────────────────
  {
    dbField: 'approverEmail',
    aliases: ['승인자이메일', '승인자 이메일', 'Approver Email'],
  },
  {
    dbField: 'approverName',
    aliases: ['승인자', '승인자명', 'Approver', 'Approver Name'],
  },
  {
    dbField: 'returnerEmail',
    aliases: ['반입처리자이메일', '반입자이메일', 'Returner Email'],
  },
  {
    dbField: 'returnerName',
    aliases: ['반입처리자', '반입자', 'Returner', 'Returner Name'],
  },
];

export const CHECKOUT_ALIAS_INDEX: Map<string, ColumnMappingEntry> =
  buildAliasIndex(CHECKOUT_COLUMN_MAPPING);

/** 제거된 컬럼 (기존 Excel 호환) */
export const DEPRECATED_CHECKOUT_COLUMNS: ColumnMappingEntry[] = [];
