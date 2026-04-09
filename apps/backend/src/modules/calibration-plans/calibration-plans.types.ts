/**
 * CalibrationPlans 서비스 반환 타입
 *
 * Drizzle $inferSelect로부터 파생 — DB 스키마 변경 시 자동 반영.
 * 하드코딩 금지: primitive 타입을 직접 선언하지 않고 Pick<$inferSelect, ...>으로 도출.
 */
import type {
  calibrationPlans,
  calibrationPlanItems,
} from '@equipment-management/db/schema/calibration-plans';
import type { equipment } from '@equipment-management/db/schema/equipment';

/** 교정계획서 항목 단독 반환 타입 (confirmItem/updateItem) */
export type CalibrationPlanItem = typeof calibrationPlanItems.$inferSelect;

/** 교정계획서 삭제 결과 */
export type CalibrationPlanDeleteResult = { uuid: string; deleted: true };

/** 외부교정 대상 장비 (findExternalEquipment 반환 타입) */
export type ExternalCalibrationEquipment = Pick<
  typeof equipment.$inferSelect,
  | 'id'
  | 'name'
  | 'managementNumber'
  | 'modelName'
  | 'manufacturer'
  | 'location'
  | 'site'
  | 'lastCalibrationDate'
  | 'nextCalibrationDate'
  | 'calibrationCycle'
  | 'calibrationAgency'
>;

/** 교정계획서 버전 히스토리 단건 (getVersionHistory 반환 타입) */
export type CalibrationPlanVersionHistoryItem = Pick<
  typeof calibrationPlans.$inferSelect,
  | 'id'
  | 'year'
  | 'siteId'
  | 'status'
  | 'version'
  | 'isLatestVersion'
  | 'createdBy'
  | 'createdAt'
  | 'approvedBy'
  | 'approvedAt'
>;

/** findOne()의 장비 스냅샷 — 실제 SELECT 대상 컬럼과 1:1 동기화 */
export type CalibrationPlanEquipmentSnapshot = Pick<
  typeof equipment.$inferSelect,
  | 'id'
  | 'name'
  | 'managementNumber'
  | 'modelName'
  | 'manufacturer'
  | 'location'
  | 'lastCalibrationDate'
  | 'nextCalibrationDate'
  | 'calibrationCycle'
  | 'calibrationAgency'
>;

/** 교정계획서 항목 (장비 스냅샷 포함) */
export type CalibrationPlanItemDetail = typeof calibrationPlanItems.$inferSelect & {
  equipment: CalibrationPlanEquipmentSnapshot;
};

/** 교정계획서 상세 — findOne() 반환 타입 */
export type CalibrationPlanDetail = typeof calibrationPlans.$inferSelect & {
  authorName: string | null;
  teamName: string | null;
  approvedByName: string | null;
  reviewedByName: string | null;
  rejectedByName: string | null;
  items: CalibrationPlanItemDetail[];
};

/** 교정계획서 목록 단건 — findAll() 반환 타입 내부 */
export type CalibrationPlanListItem = typeof calibrationPlans.$inferSelect & {
  authorName: string | null;
  teamName: string | null;
  approvedByName: string | null;
  reviewedByName: string | null;
  rejectedByName: string | null;
};

/** 교정계획서 상태별 요약 통계 — findAll(includeSummary=true) */
export type CalibrationPlanSummary = {
  total: number;
  draft: number;
  pending_review: number;
  pending_approval: number;
  approved: number;
  rejected: number;
};

/** 교정계획서 목록 — findAll() 반환 타입 */
export type CalibrationPlanListResult = {
  items: CalibrationPlanListItem[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
  summary?: CalibrationPlanSummary;
};
