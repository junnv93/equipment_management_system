/**
 * GlobalExceptionFilter Zod 분기 spec (ADR-0008)
 *
 * - ZodError 직접 throw → 응답 shape 에 issues 포함
 * - HttpException(BadRequestException) issues 필드 → top-level passthrough
 * - errorCodeToStatusCode[ValidationError] === 400 결빙
 */
import { BadRequestException, HttpException } from '@nestjs/common';
import { z } from 'zod';
import type { ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from '../error.filter';
import { AuditService } from '../../../modules/audit/audit.service';
import { MetricsService } from '../../metrics/metrics.service';
import { ErrorCode, errorCodeToStatusCode } from '@equipment-management/schemas';

function makeHost(
  request: Record<string, unknown>
): ArgumentsHost & { _status: jest.Mock; _json: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => request,
    }),
    _status: status,
    _json: json,
  } as unknown as ArgumentsHost & { _status: jest.Mock; _json: jest.Mock };
}

function makeRequest(): Record<string, unknown> {
  return {
    method: 'POST',
    url: '/api/equipment',
    originalUrl: '/api/equipment',
    params: {},
    headers: {},
    ip: '10.0.0.1',
    route: { path: '/api/equipment' },
  };
}

describe('GlobalExceptionFilter — ZodError 직접 throw 분기', () => {
  let filter: GlobalExceptionFilter;
  const mockAudit = {
    create: jest.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;

  beforeEach(() => {
    filter = new GlobalExceptionFilter(mockAudit);
  });

  it('응답 status 400 + code = VALIDATION_ERROR + issues 배열 포함', () => {
    const zodError = (() => {
      try {
        z.object({ name: z.string().min(5) }).parse({ name: 'a' });
      } catch (err) {
        return err as z.ZodError;
      }
      throw new Error('expected ZodError');
    })();

    const host = makeHost(makeRequest());
    filter.catch(zodError, host);

    expect(host._status).toHaveBeenCalledWith(400);
    const payload = host._json.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.code).toBe(ErrorCode.ValidationError);
    expect(Array.isArray(payload.issues)).toBe(true);
    expect(payload.issues as unknown[]).toHaveLength(1);
    const issue = (payload.issues as Array<Record<string, unknown>>)[0];
    expect(issue.code).toBe('too_small');
    expect(issue.path).toEqual(['name']);
  });
});

describe('GlobalExceptionFilter — HttpException issues passthrough', () => {
  let filter: GlobalExceptionFilter;
  const mockAudit = {
    create: jest.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;

  beforeEach(() => {
    filter = new GlobalExceptionFilter(mockAudit);
  });

  it('BadRequestException 의 issues 필드는 top-level 로 forward', () => {
    const exception = new BadRequestException({
      code: ErrorCode.ValidationError,
      message: '입력 데이터 검증 실패',
      issues: [
        {
          code: 'invalid_type',
          path: ['email'],
          params: { expected: 'string' },
        },
      ],
    });

    const host = makeHost(makeRequest());
    filter.catch(exception, host);

    expect(host._status).toHaveBeenCalledWith(400);
    const payload = host._json.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.code).toBe(ErrorCode.ValidationError);
    expect(payload.issues).toEqual([
      { code: 'invalid_type', path: ['email'], params: { expected: 'string' } },
    ]);
  });

  it('issues 미포함 BadRequestException 은 issues 필드 없이 passthrough', () => {
    const exception = new BadRequestException({
      message: 'Some validation error',
    });

    const host = makeHost(makeRequest());
    filter.catch(exception, host);

    expect(host._status).toHaveBeenCalledWith(400);
    const payload = host._json.mock.calls[0][0] as Record<string, unknown>;
    expect('issues' in payload ? payload.issues : undefined).toBeUndefined();
  });

  it('비-Zod HttpException(NotFound 등) 도 정상 라우팅 (issues 없음)', () => {
    const exception = new HttpException('Not found', 404);
    const host = makeHost(makeRequest());
    filter.catch(exception, host);
    expect(host._status).toHaveBeenCalledWith(404);
    const payload = host._json.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.issues).toBeUndefined();
  });
});

describe('GlobalExceptionFilter — MetricsService telemetry (ADR-0008 §4)', () => {
  let filter: GlobalExceptionFilter;
  const mockAudit = {
    create: jest.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;
  const mockMetrics = {
    observeZodIssueCount: jest.fn(),
  } as unknown as MetricsService;

  beforeEach(() => {
    filter = new GlobalExceptionFilter(mockAudit, undefined, mockMetrics);
    jest.clearAllMocks();
  });

  it('ZodError 분기 — observeZodIssueCount 가 (normalizedRoute, issueCount) 인자로 호출', () => {
    const zodError = (() => {
      try {
        z.object({ name: z.string().min(5), age: z.number().min(18) }).parse({
          name: 'a',
          age: 10,
        });
      } catch (err) {
        return err as z.ZodError;
      }
      throw new Error('expected ZodError');
    })();

    const host = makeHost(makeRequest());
    filter.catch(zodError, host);

    expect(mockMetrics.observeZodIssueCount).toHaveBeenCalledTimes(1);
    expect(mockMetrics.observeZodIssueCount).toHaveBeenCalledWith('/api/equipment', 2);
  });

  it('ZodError issue 0개 시 observeZodIssueCount 호출 안 함 (guard)', () => {
    // 빈 ZodError — 실제로 발생하기 어려우나 방어 검증
    const zodError = new z.ZodError([]);
    const host = makeHost(makeRequest());
    filter.catch(zodError, host);
    expect(mockMetrics.observeZodIssueCount).not.toHaveBeenCalled();
  });
});

describe('errorCodeToStatusCode SSOT 정합', () => {
  it('VALIDATION_ERROR ↔ 400 결빙', () => {
    expect(errorCodeToStatusCode[ErrorCode.ValidationError]).toBe(400);
  });
});
