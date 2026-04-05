import { z } from 'zod';

/**
 * SINGLE SOURCE OF TRUTH: 케이블 커넥터 타입 열거형
 *
 * 표준 타입값 (대문자/소문자):
 * - K: K-type 커넥터
 * - SMA: SMA 커넥터
 * - N: N-type 커넥터
 * - other: 기타
 */
export const CABLE_CONNECTOR_TYPE_VALUES = [
  'K', // K-type 커넥터
  'SMA', // SMA 커넥터
  'N', // N-type 커넥터
  'other', // 기타
] as const;

export const CableConnectorTypeEnum = z.enum(CABLE_CONNECTOR_TYPE_VALUES);
export type CableConnectorType = z.infer<typeof CableConnectorTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 케이블 상태 열거형
 *
 * 표준 상태값 (소문자):
 * - active: 사용 중
 * - retired: 폐기/퇴역
 */
export const CABLE_STATUS_VALUES = [
  'active', // 사용 중
  'retired', // 폐기/퇴역
] as const;

export const CableStatusEnum = z.enum(CABLE_STATUS_VALUES);
export type CableStatus = z.infer<typeof CableStatusEnum>;
