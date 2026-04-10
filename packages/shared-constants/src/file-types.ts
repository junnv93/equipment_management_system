/**
 * 파일 업로드 타입 상수 — Backend/Frontend SSOT
 *
 * MIME 타입, 확장자, 문서 타입별 허용 규칙을 한 곳에서 관리합니다.
 * - 프론트엔드: FileUpload 컴포넌트의 accept prop, 검증 로직
 * - 백엔드: FileUploadService의 MIME 타입 검증
 */

import type { DocumentType } from '@equipment-management/schemas';

// ============================================================
// MIME 타입 ↔ 확장자 매핑 (SSOT)
// ============================================================

export interface FileTypeEntry {
  /** MIME 타입 (예: 'image/png') */
  readonly mime: string;
  /** 확장자 목록 (점 포함, 예: ['.png']) */
  readonly extensions: readonly string[];
  /** 파일 시그니처 (magic bytes) — 백엔드 MIME 위장 공격 방지용 */
  readonly magicBytes: readonly (readonly number[])[];
}

/**
 * 시스템에서 허용하는 모든 파일 타입 정의
 *
 * 추가/제거 시 이 배열만 수정하면 프론트엔드/백엔드 양쪽에 반영됩니다.
 * - MIME 타입 → 백엔드 allowedMimeTypes
 * - 확장자 → 프론트엔드 accept prop
 * - magicBytes → 백엔드 validateMagicBytes
 */
export const FILE_TYPES = [
  { mime: 'application/pdf', extensions: ['.pdf'], magicBytes: [[0x25, 0x50, 0x44, 0x46]] }, // %PDF
  { mime: 'image/jpeg', extensions: ['.jpg', '.jpeg'], magicBytes: [[0xff, 0xd8, 0xff]] },
  { mime: 'image/png', extensions: ['.png'], magicBytes: [[0x89, 0x50, 0x4e, 0x47]] }, // \x89PNG
  { mime: 'image/gif', extensions: ['.gif'], magicBytes: [[0x47, 0x49, 0x46, 0x38]] }, // GIF8
  { mime: 'application/msword', extensions: ['.doc'], magicBytes: [[0xd0, 0xcf, 0x11, 0xe0]] }, // OLE compound
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['.docx'],
    magicBytes: [[0x50, 0x4b, 0x03, 0x04]], // PK ZIP
  },
  {
    mime: 'application/vnd.ms-excel',
    extensions: ['.xls'],
    magicBytes: [[0xd0, 0xcf, 0x11, 0xe0]],
  }, // OLE compound
  {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['.xlsx'],
    magicBytes: [[0x50, 0x4b, 0x03, 0x04]], // PK ZIP
  },
  { mime: 'text/csv', extensions: ['.csv'], magicBytes: [] }, // 텍스트 파일 — 매직바이트 없음
] as const satisfies readonly FileTypeEntry[];

// ============================================================
// 파생 상수 (FILE_TYPES에서 자동 생성)
// ============================================================

/** 허용된 모든 MIME 타입 목록 */
export const ALLOWED_MIME_TYPES: readonly string[] = FILE_TYPES.map((ft) => ft.mime);

/** 허용된 모든 확장자 목록 (점 포함, 소문자) */
export const ALLOWED_EXTENSIONS: readonly string[] = FILE_TYPES.flatMap((ft) => ft.extensions);

/** MIME 타입 → 확장자 매핑 */
export const MIME_TO_EXTENSIONS: ReadonlyMap<string, readonly string[]> = new Map(
  FILE_TYPES.map((ft) => [ft.mime, ft.extensions])
);

/** 확장자 → MIME 타입 매핑 (소문자 정규화) */
export const EXTENSION_TO_MIME: ReadonlyMap<string, string> = new Map(
  FILE_TYPES.flatMap((ft) => ft.extensions.map((ext) => [ext.toLowerCase(), ft.mime]))
);

/** MIME 타입 → magic bytes 매핑 (백엔드 파일 시그니처 검증용) */
export const MIME_TO_MAGIC_BYTES: ReadonlyMap<string, readonly (readonly number[])[]> = new Map(
  FILE_TYPES.map((ft) => [ft.mime, ft.magicBytes])
);

// ============================================================
// 문서 타입별 허용 파일 규칙
// ============================================================

/**
 * 문서 타입별 허용되는 MIME 타입 + accept 문자열
 *
 * - accept: HTML `<input type="file">` 의 accept 속성값 (확장자 형식)
 * - mimes: 서버 검증용 MIME 타입 배열
 */
export interface DocumentFileRule {
  readonly accept: string;
  readonly mimes: readonly string[];
}

/**
 * FILE_TYPES에서 MIME 카테고리별 파일 규칙을 파생합니다.
 * MIME 문자열/확장자를 하드코딩하지 않고 SSOT에서 자동 생성.
 */
function buildRule(mimeFilter: (mime: string) => boolean): DocumentFileRule {
  const matched = FILE_TYPES.filter((ft) => mimeFilter(ft.mime));
  return {
    accept: matched.flatMap((ft) => ft.extensions).join(','),
    mimes: matched.map((ft) => ft.mime),
  };
}

/** 이미지 파일만 허용 */
const IMAGE_RULE: DocumentFileRule = buildRule((m) => m.startsWith('image/'));

/** PDF 파일만 허용 */
const PDF_RULE: DocumentFileRule = buildRule((m) => m === 'application/pdf');

/** 교정성적서/검수보고서 등 일반 문서 (전체 허용) */
const ALL_DOCUMENTS_RULE: DocumentFileRule = {
  accept: ALLOWED_EXTENSIONS.join(','),
  mimes: [...ALLOWED_MIME_TYPES],
};

/** 교정 관련 문서 (PDF + 이미지) */
const CALIBRATION_DOCUMENT_RULE: DocumentFileRule = buildRule(
  (m) => m === 'application/pdf' || m.startsWith('image/')
);

/**
 * 문서 타입별 파일 규칙 매핑
 *
 * key: DocumentType (from @equipment-management/schemas)
 */
export const DOCUMENT_FILE_RULES: Readonly<Record<DocumentType, DocumentFileRule>> = {
  equipment_photo: IMAGE_RULE,
  equipment_manual: PDF_RULE,
  calibration_certificate: CALIBRATION_DOCUMENT_RULE,
  raw_data: ALL_DOCUMENTS_RULE,
  inspection_report: ALL_DOCUMENTS_RULE,
  history_card: ALL_DOCUMENTS_RULE,
  other: ALL_DOCUMENTS_RULE,
  validation_vendor_attachment: ALL_DOCUMENTS_RULE,
  validation_test_data: ALL_DOCUMENTS_RULE,
  inspection_photo: IMAGE_RULE,
  inspection_graph: IMAGE_RULE,
  measurement_data: ALL_DOCUMENTS_RULE,
};

/** 파일 업로드 제한 */
export const FILE_UPLOAD_LIMITS = {
  /** 최대 파일 크기 (bytes) — 10MB */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** 최대 파일 개수 */
  MAX_FILE_COUNT: 10,
} as const;

// ============================================================
// 양식 템플릿 전용 규칙 (UL-QP-18 form templates)
// ============================================================

/**
 * UL-QP-18 양식 템플릿으로 업로드 가능한 파일 규칙.
 *
 * 절차서가 Office Open XML 포맷(.docx / .xlsx)만 요구하므로 FILE_TYPES에서
 * 해당 두 MIME만 필터링하여 파생합니다. 확장자나 MIME 문자열을 어디에서도
 * 하드코딩하지 않도록 백엔드/프론트엔드 모두 이 상수를 사용합니다.
 */
export const FORM_TEMPLATE_FILE_RULE: DocumentFileRule = buildRule(
  (m) =>
    m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
);

/** 양식 템플릿 허용 확장자 (점 포함, 소문자). 프론트엔드 `<input accept>`, 백엔드 Zod 검증 공용 */
export const FORM_TEMPLATE_ALLOWED_EXTENSIONS: readonly string[] =
  FORM_TEMPLATE_FILE_RULE.mimes.flatMap((m) => MIME_TO_EXTENSIONS.get(m) ?? []);

/** 양식 템플릿 허용 MIME 타입 */
export const FORM_TEMPLATE_ALLOWED_MIMES: readonly string[] = FORM_TEMPLATE_FILE_RULE.mimes;

/**
 * 업로드된 파일의 MIME 또는 원본 파일명으로부터 정규화된 확장자(점 포함, 소문자)를 반환합니다.
 * 1순위: MIME → extension 매핑 (서버 신뢰 가능한 출처)
 * 2순위: 파일명의 확장자 (fallback)
 * 3순위: `.docx` 기본값
 */
export function resolveFormTemplateExtension(mime: string, filename: string): string {
  const byMime = MIME_TO_EXTENSIONS.get(mime);
  if (byMime && byMime.length > 0) return byMime[0];
  const dotIdx = filename.lastIndexOf('.');
  if (dotIdx >= 0) {
    const ext = filename.slice(dotIdx).toLowerCase();
    if (FORM_TEMPLATE_ALLOWED_EXTENSIONS.includes(ext)) return ext;
  }
  return '.docx';
}

// ============================================================
// 리포트 내보내기 포맷별 MIME 타입
// ============================================================

/**
 * 리포트 내보내기 포맷 → MIME 타입 매핑
 *
 * 백엔드 report-export.service.ts, 프론트엔드 reports-api.ts 공통 사용
 */
export const REPORT_EXPORT_MIME: Readonly<Record<string, string>> = {
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv; charset=utf-8',
  pdf: 'application/pdf',
} as const;

// ============================================================
// MIME 타입 카테고리 (프론트엔드 아이콘/미리보기 매핑용)
// ============================================================

export type MimeCategory = 'pdf' | 'image' | 'spreadsheet' | 'document' | 'other';

/** MIME 타입 → 카테고리 매핑 (FILE_TYPES 기반 자동 생성) */
export const MIME_TO_CATEGORY: ReadonlyMap<string, MimeCategory> = new Map([
  ...FILE_TYPES.filter((ft) => ft.mime === 'application/pdf').map(
    (ft) => [ft.mime, 'pdf' as MimeCategory] as const
  ),
  ...FILE_TYPES.filter((ft) => ft.mime.startsWith('image/')).map(
    (ft) => [ft.mime, 'image' as MimeCategory] as const
  ),
  ...FILE_TYPES.filter((ft) => ft.mime.includes('spreadsheet') || ft.mime.includes('ms-excel')).map(
    (ft) => [ft.mime, 'spreadsheet' as MimeCategory] as const
  ),
  ...FILE_TYPES.filter(
    (ft) => ft.mime.includes('msword') || ft.mime.includes('wordprocessingml')
  ).map((ft) => [ft.mime, 'document' as MimeCategory] as const),
]);

/** MIME 타입의 카테고리를 반환합니다 */
export function getMimeCategory(mime: string): MimeCategory {
  return MIME_TO_CATEGORY.get(mime) ?? 'other';
}
