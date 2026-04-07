import { z } from 'zod';

/**
 * 양식 템플릿(form_templates) 입력 검증 스키마 — SSOT
 *
 * UL-QP-18 양식 관리 도메인:
 * - `formName`: 안정 식별자(절차서 공식 명칭). 변경되지 않음.
 * - `formNumber`: 가변 번호. 개정마다 재발급되며 역사적으로 전역 유니크.
 *
 * 본 파일은 백엔드(ZodValidationPipe)와 프론트엔드(타입 추론) 양쪽에서 사용됩니다.
 */

// ─── primitives ──────────────────────────────────────────────────────────────

/**
 * 양식 번호 포맷. 대문자/숫자/하이픈만 허용.
 * 예) UL-QP-18-01, UL-QP-26-02, UL-QP-2026-01
 *
 * 보안: storageKey 경로에 직접 삽입되므로 path traversal(`..`, `/`, `\`) 원천 차단.
 * 길이 상한 30은 DB 스키마(`varchar(30)`)와 일치.
 */
export const formNumberSchema = z
  .string()
  .trim()
  .min(1, 'formNumber는 비어 있을 수 없습니다')
  .max(30, 'formNumber는 30자를 초과할 수 없습니다')
  .regex(/^[A-Z0-9-]+$/, '양식 번호는 대문자, 숫자, 하이픈만 사용할 수 있습니다');

/**
 * 양식명. FORM_CATALOG에 등록된 양식명만 허용해야 하지만,
 * 카탈로그 의존을 순환시키지 않기 위해 런타임에서 추가 검증합니다.
 * 여기서는 기본적인 길이/공백 검증만 수행.
 */
export const formNameSchema = z
  .string()
  .trim()
  .min(1, '양식명은 비어 있을 수 없습니다')
  .max(200, '양식명은 200자를 초과할 수 없습니다');

// ─── request bodies / queries ────────────────────────────────────────────────

/**
 * 양식 템플릿 버전 생성 (개정 또는 최초 등록 공통).
 *
 * 서비스 레이어가 기존 현행 row의 존재 여부로 "최초 등록"인지 "개정"인지 자동 판단합니다.
 * 이 엔드포인트 하나로 두 경우를 모두 처리 → 프론트엔드/백엔드 계약 단순화.
 */
export const formTemplateCreateBodySchema = z.object({
  formName: formNameSchema,
  formNumber: formNumberSchema,
});
export type FormTemplateCreateBody = z.infer<typeof formTemplateCreateBodySchema>;

/** 동일 formNumber 내 파일 교체 (이력 보존 없음, UL-QP-18 절차서에서 요구하지 않음) */
export const formTemplateReplaceBodySchema = z.object({
  formName: formNameSchema,
});
export type FormTemplateReplaceBody = z.infer<typeof formTemplateReplaceBodySchema>;

/** 양식명 기준 이력 조회 */
export const formTemplateHistoryQuerySchema = z.object({
  formName: formNameSchema,
});
export type FormTemplateHistoryQuery = z.infer<typeof formTemplateHistoryQuerySchema>;

/** 과거 formNumber로 검색 */
export const formTemplateSearchQuerySchema = z.object({
  formNumber: formNumberSchema,
});
export type FormTemplateSearchQuery = z.infer<typeof formTemplateSearchQuerySchema>;
