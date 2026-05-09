/**
 * ICheckoutCreator — common 레이어 SSOT.
 *
 * Layer 정합성:
 *  - EquipmentImportsService(module)는 반입 승인 시 return_to_vendor checkout을 생성해야 함.
 *  - 하지만 equipment-imports → checkouts 직접 의존은 checkouts → equipment-imports와 함께
 *    양방향 circular dependency를 형성.
 *  - Solution: 최소 인터페이스 + Symbol DI 토큰 → common 레이어에 정의,
 *    CheckoutsModule이 provide/export, EquipmentImportsModule이 import하여 소비.
 *
 * Pattern: TOKEN_BLACKLIST / ISystemErrorEventProvider 패턴 동일.
 */

import type { CheckoutPurpose } from '@equipment-management/schemas';

// Symbol 토큰 — NestJS DI가 interface를 reflect 못하므로 Symbol 필요.
export const CHECKOUT_CREATOR = Symbol('CHECKOUT_CREATOR');

/** equipment-imports → checkouts 방향에서 필요한 최소 반출 생성 파라미터 */
export interface CreateCheckoutParams {
  equipmentIds: string[];
  purpose: CheckoutPurpose;
  destination: string;
  reason: string;
  expectedReturnDate: string;
}

/**
 * 반출 생성 추상화 인터페이스.
 * equipment-imports는 newCheckout.id만 필요하므로 { id: string } 최소 반환.
 */
export interface ICheckoutCreator {
  create(
    dto: CreateCheckoutParams,
    requesterId: string,
    userTeamId?: string | null
  ): Promise<{ id: string }>;
}
