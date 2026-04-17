/**
 * EquipmentController 반환 타입
 *
 * Drizzle $inferSelect로부터 파생 — DB 스키마 변경 시 자동 반영.
 * 서비스 레이어가 이미 명시적 타입을 가지므로, 컨트롤러는 서비스 반환 타입을
 * 조합/변환하는 최소한의 타입만 정의합니다.
 */
import type { Equipment } from '@equipment-management/db/schema/equipment';
import type { EquipmentRequest } from '@equipment-management/db/schema/equipment-requests';
import type { EquipmentAttachment } from '@equipment-management/db/schema/equipment-attachments';
import type { users, equipment as equipmentTable } from '@equipment-management/db/schema';
import type { QRAllowedAction } from '@equipment-management/shared-constants';

type UserSelect = typeof users.$inferSelect;
type EquipmentSelect = typeof equipmentTable.$inferSelect;

/** create() / update() — 역할에 따라 즉시 생성 또는 승인 요청 */
export type EquipmentCreateOrRequestResult =
  | Equipment
  | {
      message: string;
      requestUuid: string;
      request: EquipmentRequest;
    };

/** findOne() — 장비 상세 + teamName (team relation → teamName 변환) */
export type EquipmentDetailResult = Omit<Equipment, never> & {
  teamName: string | null;
};

/**
 * findByManagementNumber() — QR 모바일 랜딩 전용 상세.
 *
 * 기존 상세 shape에 서버 계산 `allowedActions` 배열을 추가. 프론트는 배열을
 * 순회하며 CTA 렌더링 — 역할/권한 중복 판정 금지.
 */
export type EquipmentQRLandingResult = EquipmentDetailResult & {
  allowedActions: QRAllowedAction[];
};

/** findRequestByUuid() — 요청 상세 + Relations */
export type EquipmentRequestDetailResult = EquipmentRequest & {
  requester?: UserSelect | null;
  approver?: UserSelect | null;
  equipment?: EquipmentSelect | null;
  attachments?: EquipmentAttachment[];
};
