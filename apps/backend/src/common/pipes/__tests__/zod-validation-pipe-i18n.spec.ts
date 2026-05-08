/**
 * ZodValidationPipe issues array + PII redact spec (ADR-0008)
 *
 * Round 1: 응답 payload 에 `issues: BackendValidationIssue[]` 포함
 * Round 1: top-level `code: 'VALIDATION_ERROR'` 포함 (ErrorCode SSOT 정합)
 * Round 3: production 환경에서 `invalid_format.pattern` redact
 * Round 3: development 환경에서 pattern 노출 (디버깅)
 */
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../zod-validation.pipe';
import { ErrorCode } from '@equipment-management/schemas';

const REDACTED = '[REDACTED]';

function captureBadRequest(fn: () => unknown): BadRequestException {
  try {
    fn();
  } catch (err) {
    if (err instanceof BadRequestException) return err;
  }
  throw new Error('expected BadRequestException');
}

describe('ZodValidationPipe — Round 1 issues array 응답 shape', () => {
  it('top-level code = VALIDATION_ERROR', () => {
    const pipe = new ZodValidationPipe(z.object({ name: z.string().min(3) }));
    const ex = captureBadRequest(() => pipe.transform({ name: 'a' }, { type: 'body' } as never));
    const response = ex.getResponse() as Record<string, unknown>;
    expect(response.code).toBe(ErrorCode.ValidationError);
  });

  it('issues 배열 포함 (BackendValidationIssue[] shape)', () => {
    const pipe = new ZodValidationPipe(z.object({ name: z.string().min(3) }));
    const ex = captureBadRequest(() => pipe.transform({ name: 'a' }, { type: 'body' } as never));
    const response = ex.getResponse() as { issues: Array<Record<string, unknown>> };
    expect(Array.isArray(response.issues)).toBe(true);
    expect(response.issues).toHaveLength(1);
    expect(response.issues[0]).toMatchObject({
      code: 'too_small',
      path: ['name'],
    });
    expect(response.issues[0].params).toMatchObject({
      origin: 'string',
      minimum: 3,
    });
  });

  it('legacy `errors` 필드 유지 (기존 e2e 호환)', () => {
    const pipe = new ZodValidationPipe(z.object({ name: z.string().min(3) }));
    const ex = captureBadRequest(() => pipe.transform({ name: 'a' }, { type: 'body' } as never));
    const response = ex.getResponse() as { errors: unknown[] };
    expect(Array.isArray(response.errors)).toBe(true);
    expect(response.errors).toHaveLength(1);
  });

  it('다중 issue 모두 캡처', () => {
    const pipe = new ZodValidationPipe(
      z.object({ name: z.string().min(3), age: z.number().int() })
    );
    const ex = captureBadRequest(() =>
      pipe.transform({ name: 'a', age: 'oops' }, { type: 'body' } as never)
    );
    const response = ex.getResponse() as { issues: Array<Record<string, unknown>> };
    expect(response.issues.length).toBeGreaterThanOrEqual(2);
  });
});

describe('ZodValidationPipe — Round 3 PII redact (production)', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  beforeEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
  });

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: ORIGINAL_NODE_ENV, writable: true });
  });

  it('invalid_format.pattern 은 production 에서 [REDACTED]', () => {
    const pipe = new ZodValidationPipe(z.object({ email: z.email() }));
    const ex = captureBadRequest(() =>
      pipe.transform({ email: 'notanemail' }, { type: 'body' } as never)
    );
    const response = ex.getResponse() as { issues: Array<{ params?: Record<string, unknown> }> };
    const issue = response.issues[0];
    expect(issue.params?.pattern).toBe(REDACTED);
    // format / origin 은 그대로 (PII 아님)
    expect(issue.params?.format).toBe('email');
  });
});

describe('ZodValidationPipe — Round 3 PII redact (development)', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  beforeEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
  });

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: ORIGINAL_NODE_ENV, writable: true });
  });

  it('invalid_format.pattern 은 development 에서 그대로 노출 (디버깅)', () => {
    const pipe = new ZodValidationPipe(z.object({ email: z.email() }));
    const ex = captureBadRequest(() =>
      pipe.transform({ email: 'notanemail' }, { type: 'body' } as never)
    );
    const response = ex.getResponse() as { issues: Array<{ params?: Record<string, unknown> }> };
    const issue = response.issues[0];
    expect(issue.params?.pattern).not.toBe(REDACTED);
    expect(typeof issue.params?.pattern).toBe('string');
  });
});

describe('ZodValidationPipe — non-Zod error 도 ErrorCode 포함', () => {
  it('throw 한 일반 Error 는 BadRequestException + ErrorCode.ValidationError', () => {
    const schema = {
      parse: () => {
        throw new Error('totally unexpected');
      },
    } as unknown as z.ZodType;
    const pipe = new ZodValidationPipe(schema);
    const ex = captureBadRequest(() => pipe.transform({}, { type: 'body' } as never));
    const response = ex.getResponse() as Record<string, unknown>;
    expect(response.code).toBe(ErrorCode.ValidationError);
  });
});
