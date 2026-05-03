import { BadRequestException, Controller, Get, Injectable } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorCode } from '@equipment-management/schemas';
import { GlobalExceptionFilter } from '../error.filter';
import { AuditService } from '../../../modules/audit/audit.service';

@Injectable()
class ErrorCodeProbeService {
  failClosed(): never {
    throw new BadRequestException({
      code: ErrorCode.InspectionTemplateNotFound,
      message: 'Inspection template was not found.',
    });
  }
}

@Controller('error-code-probe')
class ErrorCodeProbeController {
  constructor(private readonly service: ErrorCodeProbeService) {}

  @Get('fail-closed')
  failClosed(): never {
    return this.service.failClosed();
  }
}

function makeHost(): ArgumentsHost & { status: jest.Mock; json: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });

  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({
        method: 'GET',
        url: '/error-code-probe/fail-closed',
        originalUrl: '/error-code-probe/fail-closed',
        headers: {},
      }),
    }),
    status,
    json,
  } as unknown as ArgumentsHost & { status: jest.Mock; json: jest.Mock };
}

describe('error code HTTP serialization path', () => {
  let controller: ErrorCodeProbeController;
  let filter: GlobalExceptionFilter;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErrorCodeProbeController],
      providers: [ErrorCodeProbeService],
    }).compile();

    controller = module.get(ErrorCodeProbeController);
    filter = new GlobalExceptionFilter({ create: jest.fn() } as unknown as AuditService);
  });

  it('preserves service fail-close ErrorCode through controller and global filter body', () => {
    const host = makeHost();

    try {
      controller.failClosed();
    } catch (error) {
      filter.catch(error, host);
    }

    expect(host.status).toHaveBeenCalledWith(400);
    expect(host.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ErrorCode.InspectionTemplateNotFound,
        message: 'Inspection template was not found.',
      })
    );
    expect(typeof host.json.mock.calls[0][0].timestamp).toBe('string');
  });
});
