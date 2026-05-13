/**
 * checkout UI 전용 타입 SSOT
 *
 * checkout 도메인 UI 컴포넌트 간 공유 타입을 여기에 추가.
 * 컴포넌트 로컬 정의 금지 — 타입 분산 방지.
 */
import type {
  CheckoutPurpose,
  CheckoutStatus,
  NextStepDescriptor,
  UserSelectableCheckoutPurpose,
} from '@equipment-management/schemas';

/** 드롭다운 오버플로 액션 항목 — NextStepPanel + 호출처 공통 */
export interface OverflowAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

/** CheckoutEquipmentRow 한 행에 필요한 데이터 — CheckoutGroupCard와 공유 */
export interface EquipmentRowData {
  equipmentId: string;
  equipmentName: string;
  managementNumber: string;
  purpose: CheckoutPurpose;
  status: CheckoutStatus;
  checkoutType: UserSelectableCheckoutPurpose;
  userName: string;
  checkoutId: string;
  expectedReturnDate: string | undefined;
  destination: string | undefined;
  canApproveItem: boolean;
  canSubmitConditionCheckItem: boolean;
  canBorrowerApproveItem: boolean;
  canReturnItem: boolean;
  descriptor: NextStepDescriptor | undefined;
}
