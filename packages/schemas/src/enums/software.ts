import { z } from 'zod';

/**
 * SINGLE SOURCE OF TRUTH: 소프트웨어 타입 열거형
 *
 * 표준 타입값 (소문자 + 언더스코어):
 * - measurement: 측정 소프트웨어 (EMC32, DASY6 SAR 등)
 * - analysis: 분석 소프트웨어
 * - control: 제어 소프트웨어
 * - other: 기타
 */
export const SOFTWARE_TYPE_VALUES = [
  'measurement', // 측정 소프트웨어
  'analysis', // 분석 소프트웨어
  'control', // 제어 소프트웨어
  'other', // 기타
] as const;

export const SoftwareTypeEnum = z.enum(SOFTWARE_TYPE_VALUES as readonly [string, ...string[]]);
export type SoftwareType = z.infer<typeof SoftwareTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 소프트웨어 변경 승인 상태 열거형
 *
 * 표준 상태값 (소문자):
 * - pending: 승인 대기 (변경 요청)
 * - approved: 승인됨 (기술책임자가 승인)
 * - rejected: 반려됨
 */
export const SOFTWARE_APPROVAL_STATUS_VALUES = [
  'pending', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const SoftwareApprovalStatusEnum = z.enum(SOFTWARE_APPROVAL_STATUS_VALUES);
export type SoftwareApprovalStatus = z.infer<typeof SoftwareApprovalStatusEnum>;
