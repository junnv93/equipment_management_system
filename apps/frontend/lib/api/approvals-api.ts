/**
 * approvals 도메인 공개 API — barrel
 *
 * 내부 구현: ./approvals/ (types / internal-rows / mappers / fetchers / actions)
 * 23개 caller는 이 파일 한 경로만 참조 (@/lib/api/approvals-api).
 */

// ============================================================================
// 공개 타입 + 상수 — 모든 caller 호환
// ============================================================================
export type {
  UnifiedApprovalStatus,
  ApprovalCategory,
  ApprovalItem,
  ApprovalSummaryData,
  ApprovalHistoryEntry,
  Attachment,
  PendingCountsByCategory,
  ApprovalKpiResponse,
  BulkActionResult,
  TabMeta,
  ApprovalSection,
} from './approvals/types';

export {
  ROLE_TABS,
  TAB_META,
  APPROVAL_SECTIONS,
  REJECTION_MIN_LENGTH,
  REJECTION_MAX_LENGTH,
  RejectReasonSchema,
  REQUEST_TYPES,
} from './approvals/types';

// ============================================================================
// approvalsApi facade — 기존 클래스 인스턴스와 동일한 공개 인터페이스
// ============================================================================
import { getPendingItems, getPendingCounts, getKpi, getEmptyCounts } from './approvals/fetchers';
import { approve, reject, bulkApprove, bulkReject } from './approvals/actions';

export const approvalsApi = {
  getPendingItems,
  getPendingCounts,
  getKpi,
  getEmptyCounts,
  approve,
  reject,
  bulkApprove,
  bulkReject,
};

export default approvalsApi;
