import { ForbiddenException } from '@nestjs/common';
import { AuditController } from '../audit.controller';
import type { AuditService } from '../audit.service';
import type { AuthenticatedRequest } from '../../../types/auth';

describe('AuditController', () => {
  const createMock = jest.fn();
  let controller: AuditController;

  beforeEach(() => {
    createMock.mockReset();
    controller = new AuditController({ create: createMock } as unknown as AuditService);
  });

  const systemAdminReq = {
    user: {
      userId: '00000000-0000-0000-0000-000000000004',
      name: 'System Admin',
      roles: ['system_admin'],
      site: 'suwon',
      teamId: null,
    },
  } as unknown as AuthenticatedRequest;

  it('records SYSTEM_ADMIN role simulation as an audit log', async () => {
    await expect(
      controller.recordRoleSimulation(systemAdminReq, {
        simulatedRole: 'test_engineer',
        path: '/dashboard?simulateRole=test_engineer',
      })
    ).resolves.toEqual({ recorded: true });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '00000000-0000-0000-0000-000000000004',
        userName: 'System Admin',
        userRole: 'system_admin',
        action: 'read',
        entityType: 'user',
        entityId: '00000000-0000-0000-0000-000000000004',
        details: {
          additionalInfo: {
            event: 'role_simulation_started',
            actualRole: 'system_admin',
            simulatedRole: 'test_engineer',
            path: '/dashboard?simulateRole=test_engineer',
          },
        },
        userSite: 'suwon',
        userTeamId: null,
      })
    );
  });

  it('rejects non-system-admin role simulation audit writes', async () => {
    const req = {
      user: {
        ...systemAdminReq.user,
        roles: ['technical_manager'],
      },
    } as unknown as AuthenticatedRequest;

    await expect(
      controller.recordRoleSimulation(req, {
        simulatedRole: 'test_engineer',
        path: '/dashboard?simulateRole=test_engineer',
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(createMock).not.toHaveBeenCalled();
  });
});
