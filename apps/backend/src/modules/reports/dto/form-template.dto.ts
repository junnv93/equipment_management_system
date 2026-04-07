import {
  formTemplateCreateBodySchema,
  formTemplateReplaceBodySchema,
  formTemplateHistoryQuerySchema,
  formTemplateSearchQuerySchema,
  formTemplateRevisionsQuerySchema,
  type FormTemplateCreateBody,
  type FormTemplateReplaceBody,
  type FormTemplateHistoryQuery,
  type FormTemplateSearchQuery,
  type FormTemplateRevisionsQuery,
} from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * 양식 템플릿 모듈 DTO + 검증 파이프 (SSOT: @equipment-management/schemas)
 *
 * 모든 입력 검증은 공유 Zod 스키마에서 파생됩니다. 컨트롤러는 이 파이프를 통해
 * 자동 검증만 수행하고, 수동 if-throw 패턴을 쓰지 않습니다.
 */

export type CreateFormTemplateDto = FormTemplateCreateBody;
export type ReplaceFormTemplateDto = FormTemplateReplaceBody;
export type FormTemplateHistoryQueryDto = FormTemplateHistoryQuery;
export type FormTemplateSearchQueryDto = FormTemplateSearchQuery;
export type FormTemplateRevisionsQueryDto = FormTemplateRevisionsQuery;

/** POST /form-templates — 최초/개정 등록 */
export const CreateFormTemplatePipe = new ZodValidationPipe(formTemplateCreateBodySchema);

/** POST /form-templates/replace — 동일 formNumber 파일 교체 */
export const ReplaceFormTemplatePipe = new ZodValidationPipe(formTemplateReplaceBodySchema);

/** GET /form-templates/history?formName=... */
export const FormTemplateHistoryQueryPipe = new ZodValidationPipe(formTemplateHistoryQuerySchema, {
  targets: ['query'],
});

/** GET /form-templates/search?formNumber=... */
export const FormTemplateSearchQueryPipe = new ZodValidationPipe(formTemplateSearchQuerySchema, {
  targets: ['query'],
});

/** GET /form-templates/revisions?formName=... */
export const FormTemplateRevisionsQueryPipe = new ZodValidationPipe(
  formTemplateRevisionsQuerySchema,
  { targets: ['query'] }
);
