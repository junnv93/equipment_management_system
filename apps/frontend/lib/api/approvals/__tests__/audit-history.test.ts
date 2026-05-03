import type { AuditLog } from '@/lib/api/audit-api';
import type { ApprovalItem } from '../types';
import { mapAuditLogsToApprovalHistory, resolveApprovalAuditEntity } from '../audit-history';

function makeItem(overrides: Partial<ApprovalItem>): ApprovalItem {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    category: 'outgoing',
    status: 'pending',
    requesterId: 'requester-1',
    requesterName: 'Requester',
    requesterTeam: 'Team',
    requestedAt: '2026-05-01T00:00:00.000Z',
    summary: 'Summary',
    details: {},
    ...overrides,
  } as ApprovalItem;
}

function makeAuditLog(overrides: Partial<AuditLog>): AuditLog {
  return {
    id: 'log-1',
    timestamp: '2026-05-02T03:04:05.000Z',
    userId: 'user-1',
    userName: 'Reviewer',
    userRole: 'technical_manager',
    action: 'approve',
    entityType: 'checkout',
    entityId: '11111111-1111-1111-1111-111111111111',
    entityName: null,
    details: null,
    ipAddress: null,
    userSite: null,
    userTeamId: null,
    createdAt: '2026-05-02T03:04:05.000Z',
    ...overrides,
  };
}

describe('approval audit history helpers', () => {
  it('resolves incoming equipment imports separately from checkout returns', () => {
    expect(
      resolveApprovalAuditEntity(
        makeItem({
          category: 'incoming',
          details: { sourceType: 'rental' },
        })
      )
    ).toEqual({
      entityType: 'equipment_import',
      entityId: '11111111-1111-1111-1111-111111111111',
    });

    expect(resolveApprovalAuditEntity(makeItem({ category: 'incoming' }))).toEqual({
      entityType: 'checkout',
      entityId: '11111111-1111-1111-1111-111111111111',
    });
  });

  it('uses disposal equipmentId because disposal audit logs are written on equipment', () => {
    expect(
      resolveApprovalAuditEntity(
        makeItem({
          category: 'disposal_final',
          details: { equipmentId: '22222222-2222-2222-2222-222222222222' },
        })
      )
    ).toEqual({
      entityType: 'equipment',
      entityId: '22222222-2222-2222-2222-222222222222',
    });
  });

  it('maps only approval-related audit actions to approval history entries', () => {
    expect(
      mapAuditLogsToApprovalHistory([
        makeAuditLog({ action: 'update' }),
        makeAuditLog({ id: 'log-2', action: 'review', userName: 'Reviewer' }),
        makeAuditLog({ id: 'log-3', action: 'borrower_reject', userName: 'Borrower' }),
      ])
    ).toEqual([
      {
        step: 2,
        action: 'review',
        actorId: 'user-1',
        actorName: 'Reviewer',
        actorRole: 'technical_manager',
        actionAt: '2026-05-02T03:04:05.000Z',
      },
      {
        step: 3,
        action: 'reject',
        actorId: 'user-1',
        actorName: 'Borrower',
        actorRole: 'technical_manager',
        actionAt: '2026-05-02T03:04:05.000Z',
      },
    ]);
  });
});
