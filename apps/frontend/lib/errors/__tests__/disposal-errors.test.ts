import { ErrorCode } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { extractErrorCode, mapDisposalErrorToToast } from '../disposal-errors';

describe('disposal error mapper', () => {
  it('extracts ErrorCode from ApiError-like and nested response shapes', () => {
    expect(extractErrorCode({ code: ErrorCode.DisposalReviewedNotFound })).toBe(
      ErrorCode.DisposalReviewedNotFound
    );
    expect(
      extractErrorCode({
        response: { data: { code: ErrorCode.DisposalRejectCommentRequired } },
      })
    ).toBe(ErrorCode.DisposalRejectCommentRequired);
    expect(extractErrorCode(new Error('plain'))).toBeNull();
  });

  it('maps reject comment ErrorCode to parameterized i18n toast', () => {
    const t = jest.fn((key: string, values?: Record<string, string | number | Date>) =>
      values ? `${key}:${JSON.stringify(values)}` : key
    );

    const toast = mapDisposalErrorToToast(
      { response: { data: { code: ErrorCode.DisposalRejectCommentRequired } } },
      t
    );

    expect(toast.title).toBe('errors.title');
    expect(toast.description).toBe(
      `errors.rejectCommentRequired:${JSON.stringify({
        min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
      })}`
    );
  });

  it('falls back to the Error message for unmapped errors', () => {
    const t = jest.fn((key: string) => key);

    expect(mapDisposalErrorToToast(new Error('backend message'), t)).toEqual({
      title: 'errors.title',
      description: 'backend message',
    });
  });
});
