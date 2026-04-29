/**
 * ============================================================================
 * 🔴 SSOT: 반출 신청 생성 페이지 URL 파라미터 파서 (Single Source of Truth)
 * ============================================================================
 *
 * ⚠️ 이 파일은 /checkouts/create 의 URL 쿼리 파라미터 파싱의 유일한 소스입니다.
 * 컴포넌트에서 직접 searchParams.get('equipmentId') 하지 마세요!
 *
 * 사용처:
 * - app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx (Client)
 *
 * ============================================================================
 */

import { CHECKOUT_QUERY_PARAMS, FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import {
  UserSelectableCheckoutPurposeEnum,
  type UserSelectableCheckoutPurpose,
} from '@equipment-management/schemas';

type SearchParamsWithGet = { get(key: string): string | null };
type SearchParamsInput = SearchParamsWithGet | Record<string, string | string[] | undefined>;

function getParam(sp: SearchParamsInput, key: string): string | null {
  if (typeof (sp as SearchParamsWithGet).get === 'function') {
    return (sp as SearchParamsWithGet).get(key);
  }
  const val = (sp as Record<string, string | string[] | undefined>)[key];
  if (Array.isArray(val)) return val[0] ?? null;
  return (val as string | undefined) ?? null;
}

export interface CheckoutCreateParams {
  equipmentId: string | null;
  purpose: UserSelectableCheckoutPurpose | null;
}

/**
 * /checkouts/create URL 파라미터를 파싱합니다.
 *
 * - `equipmentId`: 비어있지 않은 trim된 문자열만 반환, 그 외 null
 * - `purpose`: UserSelectableCheckoutPurpose 화이트리스트 통과한 값만 반환, 그 외 null
 *   (zod safeParse로 유효하지 않은 URL 값 방어)
 *
 * 서버/클라이언트 양쪽에서 사용 가능 (equipment-filter-utils.ts 패턴 답습).
 */
export function parseCheckoutCreateParams(sp: SearchParamsInput): CheckoutCreateParams {
  const rawEquipmentId = getParam(sp, CHECKOUT_QUERY_PARAMS.EQUIPMENT_ID)?.trim() ?? null;
  const equipmentId = rawEquipmentId && rawEquipmentId.length > 0 ? rawEquipmentId : null;

  const rawPurpose = getParam(sp, CHECKOUT_QUERY_PARAMS.PURPOSE);
  const purposeResult = rawPurpose
    ? UserSelectableCheckoutPurposeEnum.safeParse(rawPurpose)
    : { success: false as const };
  const purpose = purposeResult.success ? purposeResult.data : null;

  return { equipmentId, purpose };
}

/**
 * /checkouts/create URL을 빌드합니다.
 * equipmentId가 없으면 purpose만, 둘 다 없으면 베이스 URL을 반환합니다.
 */
export function buildCreateCheckoutUrl(params: {
  equipmentId?: string | null;
  purpose?: UserSelectableCheckoutPurpose | null;
}): string {
  const sp = new URLSearchParams();
  if (params.equipmentId) sp.set(CHECKOUT_QUERY_PARAMS.EQUIPMENT_ID, params.equipmentId);
  if (params.purpose) sp.set(CHECKOUT_QUERY_PARAMS.PURPOSE, params.purpose);
  const query = sp.toString();
  return `${FRONTEND_ROUTES.CHECKOUTS.CREATE}${query ? `?${query}` : ''}`;
}
