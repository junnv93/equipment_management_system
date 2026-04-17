import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * Handover 토큰 용도 — 체크아웃 상태 머신의 다음 전이 단계와 1:1 매핑.
 *
 * 사용자가 QR을 발급할 때 해당 체크아웃의 현재 상태로 용도가 결정되지만,
 * 토큰 payload에 명시적으로 담아 검증 단계에서 교차 검증한다.
 */
export const HandoverTokenPurposeEnum = z.enum([
  'borrower_receive', // lender_checked → borrower_received
  'borrower_return', // checked_out → borrower_returned
  'lender_receive', // borrower_returned → lender_received
]);
export type HandoverTokenPurpose = z.infer<typeof HandoverTokenPurposeEnum>;

/**
 * 토큰 발급 요청 body. 지정하지 않으면 백엔드가 체크아웃 상태로부터 자동 판정.
 *
 * SSOT: IssueHandoverTokenSchema 하나로 validation pipe, Swagger DTO, TS 타입이 전부 파생된다.
 */
export const IssueHandoverTokenSchema = z.object({
  purpose: HandoverTokenPurposeEnum.optional(),
});
export class IssueHandoverTokenDto extends createZodDto(IssueHandoverTokenSchema) {}

/**
 * 토큰 검증 요청 body. URL 쿼리로 받은 JWT를 그대로 전달.
 */
export const VerifyHandoverTokenSchema = z.object({
  token: z.string().min(1, 'token is required'),
});
export class VerifyHandoverTokenDto extends createZodDto(VerifyHandoverTokenSchema) {}

export const IssueHandoverTokenValidationPipe = new ZodValidationPipe(IssueHandoverTokenSchema);
export const VerifyHandoverTokenValidationPipe = new ZodValidationPipe(VerifyHandoverTokenSchema);

/**
 * 토큰 발급 응답 shape.
 */
export interface IssueHandoverTokenResponse {
  token: string;
  expiresAt: string; // ISO timestamp
  purpose: HandoverTokenPurpose;
}

/**
 * 토큰 검증 응답 shape. 검증 성공 시 redirect에 필요한 최소 정보만 반환.
 */
export interface VerifyHandoverTokenResponse {
  checkoutId: string;
  purpose: HandoverTokenPurpose;
}
