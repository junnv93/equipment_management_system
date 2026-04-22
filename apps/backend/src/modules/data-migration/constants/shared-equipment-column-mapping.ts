/**
 * 공용장비 시트 컬럼 매핑 (SSOT)
 *
 * 정규 장비와 달리 교정 관련 필드를 제외하고,
 * 소유처·사용기간 필드를 필수/핵심으로 구성.
 *
 * ⚠️ isShared / status / approvalStatus는 이 매핑에 없음
 *    — validator가 자동 주입 (사용자 입력 불필요)
 * ⚠️ 관리번호 미기입 시 generateTemporaryManagementNumber() SSOT 경유 자동 생성
 */
import type { Site, SharedSource, Classification } from '@equipment-management/schemas';
import {
  SITE_LABELS,
  SHARED_SOURCE_LABELS,
  CLASSIFICATION_LABELS,
} from '@equipment-management/schemas';
import {
  type ColumnMappingEntry,
  mapSiteValue,
  parseExcelDate,
  buildAliasIndex,
} from './equipment-column-mapping';

/** 공용장비 출처 alias → SharedSource enum 매핑 */
const SHARED_SOURCE_MAP: Record<string, SharedSource> = {
  '시험소 공용': 'safety_lab',
  safety_lab: 'safety_lab',
  시험소: 'safety_lab',
  공용: 'safety_lab',
  '외부 렌탈': 'external',
  external: 'external',
  렌탈: 'external',
  외부: 'external',
};

/** 공용장비 출처 정규화 */
export function mapSharedSource(value: unknown): SharedSource | undefined {
  if (!value || typeof value !== 'string') return undefined;
  return SHARED_SOURCE_MAP[value.trim().toLowerCase()] ?? SHARED_SOURCE_MAP[value.trim()];
}

/** 장비분류 alias → Classification enum 매핑 */
const CLASSIFICATION_MAP: Record<string, Classification> = {
  'fcc emc/rf': 'fcc_emc_rf',
  fcc_emc_rf: 'fcc_emc_rf',
  'fcc emc rf': 'fcc_emc_rf',
  e: 'fcc_emc_rf',
  'general emc': 'general_emc',
  general_emc: 'general_emc',
  r: 'general_emc',
  'general rf': 'general_rf',
  general_rf: 'general_rf',
  w: 'general_rf',
  sar: 'sar',
  s: 'sar',
  'automotive emc': 'automotive_emc',
  automotive_emc: 'automotive_emc',
  a: 'automotive_emc',
  'software program': 'software',
  software: 'software',
  p: 'software',
};

/** 장비 분류 정규화 */
export function mapClassification(value: unknown): Classification | undefined {
  if (!value || typeof value !== 'string') return undefined;
  return CLASSIFICATION_MAP[value.trim().toLowerCase()];
}

/** SSOT 라벨 맵에서 한국어 요약 생성 */
function enumHintFromLabels(labels: Record<string, string>): string {
  return Object.values(labels).join('/');
}

/**
 * 공용장비 전용 컬럼 매핑 테이블
 *
 * 순서: 사이트(필수) → 기본 정보 → 공용장비 전용 필드 → FK 해석 가상 필드
 * 교정 관련 필드(교정주기, 최종교정일, 차기교정일, 교정기관, 교정필요) 의도적으로 제외
 */
export const SHARED_EQUIPMENT_COLUMN_MAPPING: ColumnMappingEntry[] = [
  // ── 사이트 (필수) ──────────────────────────────────────────────────────────
  {
    dbField: 'site',
    aliases: ['사이트', 'Site', '시험소', '위치(사이트)'],
    transform: mapSiteValue,
    required: true,
    headerLabel: `사이트(${enumHintFromLabels(SITE_LABELS)}) *`,
  },

  // ── 기본 장비 정보 ─────────────────────────────────────────────────────────
  {
    dbField: 'name',
    aliases: ['장비명', '장비 명', 'Equipment Name', 'Name'],
    required: true,
  },
  {
    dbField: 'initialLocation',
    aliases: ['설치위치', '위치', '보관위치', 'Location', 'Initial Location'],
    required: true,
  },
  {
    dbField: 'managementNumber',
    aliases: ['관리번호', '장비번호', 'Management Number', 'Mgmt No.'],
    headerLabel: '관리번호 (미입력 시 TEMP-자동생성)',
  },

  // ── 공용장비 전용 필드 (필수/핵심) ──────────────────────────────────────────
  {
    dbField: 'owner',
    aliases: ['소유처', '소유자', '소유 기관', 'Owner'],
    required: true,
  },
  {
    dbField: 'classification',
    aliases: ['장비분류', '분류', 'Classification', '분류코드'],
    transform: mapClassification,
    required: true,
    headerLabel: `장비분류(${enumHintFromLabels(CLASSIFICATION_LABELS)}) *`,
  },
  {
    dbField: 'usagePeriodStart',
    aliases: ['사용시작일', '사용 시작일', 'Usage Start', 'Usage Period Start'],
    transform: parseExcelDate,
    required: true,
  },
  {
    dbField: 'usagePeriodEnd',
    aliases: ['사용종료일', '사용 종료일', 'Usage End', 'Usage Period End'],
    transform: parseExcelDate,
  },
  {
    dbField: 'sharedSource',
    aliases: ['공용출처', '공용 출처', '출처', 'Shared Source'],
    transform: mapSharedSource,
    headerLabel: `공용출처(${enumHintFromLabels(SHARED_SOURCE_LABELS)})`,
  },
  {
    dbField: 'externalIdentifier',
    aliases: ['외부식별번호', '소유처번호', '외부번호', 'External ID'],
  },

  // ── 선택 정보 ─────────────────────────────────────────────────────────────
  {
    dbField: 'modelName',
    aliases: ['모델명', '모델', 'Model', 'Model Name'],
  },
  {
    dbField: 'manufacturer',
    aliases: ['제조사', '제조업체', 'Manufacturer'],
  },
  {
    dbField: 'serialNumber',
    aliases: ['일련번호', '시리얼번호', 'Serial Number', 'S/N'],
  },
  {
    dbField: 'description',
    aliases: ['장비사양', '사양', '설명', 'Description', 'Specification'],
  },
  {
    dbField: 'assetNumber',
    aliases: ['자산번호', 'Asset Number', 'Asset No.'],
  },

  // ── FK 해석용 가상 필드 ────────────────────────────────────────────────────
  {
    dbField: 'managerName',
    aliases: ['운영책임자', '담당자', '담당자명', 'Manager'],
  },
  {
    dbField: 'managerEmail',
    aliases: ['담당자이메일', '담당자 이메일', 'Manager Email'],
  },
];

export const SHARED_EQUIPMENT_ALIAS_INDEX: Map<string, ColumnMappingEntry> = buildAliasIndex(
  SHARED_EQUIPMENT_COLUMN_MAPPING
);

/** 제거된 컬럼 (기존 Excel 호환 — 해당 시트에서만 무시) */
export const DEPRECATED_SHARED_EQUIPMENT_COLUMNS: ColumnMappingEntry[] = [];

export { buildAliasIndex as buildSharedEquipmentAliasIndex };
