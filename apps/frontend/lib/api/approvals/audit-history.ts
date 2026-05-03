import type { AuditLog } from '@/lib/api/audit-api';
import type { ApprovalHistoryEntry, ApprovalItem } from './types';

interface ApprovalAuditEntity {
  entityType: string;
  entityId: string;
}

const AUDIT_ACTION_TO_HISTORY_ACTION: Record<string, ApprovalHistoryEntry['action'] | undefined> = {
  review: 'review',
  approve: 'approve',
  borrower_approve: 'approve',
  reject: 'reject',
  borrower_reject: 'reject',
};

function detailString(details: Record<string, unknown>, key: string): string | undefined {
  const value = details[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function resolveApprovalAuditEntity(item: ApprovalItem): ApprovalAuditEntity | null {
  switch (item.category) {
    case 'outgoing':
      return { entityType: 'checkout', entityId: item.id };
    case 'incoming':
      return detailString(item.details, 'sourceType')
        ? { entityType: 'equipment_import', entityId: item.id }
        : { entityType: 'checkout', entityId: item.id };
    case 'equipment':
      return { entityType: 'equipment', entityId: item.id };
    case 'calibration':
      return { entityType: 'calibration', entityId: item.id };
    case 'plan_review':
    case 'plan_final':
      return { entityType: 'calibration_plan', entityId: item.id };
    case 'software_validation':
      return { entityType: 'software_validation', entityId: item.id };
    case 'nonconformity':
      return { entityType: 'non_conformance', entityId: item.id };
    case 'disposal_review':
    case 'disposal_final': {
      const equipmentId = detailString(item.details, 'equipmentId');
      return equipmentId ? { entityType: 'equipment', entityId: equipmentId } : null;
    }
    case 'self_inspection':
      return { entityType: 'self_inspection', entityId: item.id };
    case 'inspection':
      return { entityType: 'intermediate_inspection', entityId: item.id };
    default:
      return null;
  }
}

export function mapAuditLogsToApprovalHistory(logs: AuditLog[]): ApprovalHistoryEntry[] {
  return logs
    .map((log, index): ApprovalHistoryEntry | null => {
      const action = AUDIT_ACTION_TO_HISTORY_ACTION[log.action];
      if (!action) return null;

      return {
        step: index + 1,
        action,
        actorId: log.userId ?? '',
        actorName: log.userName,
        actorRole: log.userRole,
        actionAt: typeof log.timestamp === 'string' ? log.timestamp : log.timestamp.toISOString(),
      };
    })
    .filter((entry): entry is ApprovalHistoryEntry => entry !== null);
}
