/**
 * @jest-environment node
 *
 * Node 환경에서 실행 — jsdom의 Blob 구현은 MessageChannel 내부 참조로 인해
 * Jest 객체 비교 시 deep cycle 로 crash 발생. Node 18+ Blob 은 안전.
 */
import { parseBlobErrorData, createApiError } from '../response-transformers';
import { EquipmentErrorCode } from '../../../errors/equipment-errors';

describe('parseBlobErrorData', () => {
  it('Blob이 JSON { code, message } 본문이면 일반 객체로 치환', async () => {
    const blob = new Blob(
      [JSON.stringify({ code: 'FORM_TEMPLATE_NOT_FOUND', message: '양식 없음' })],
      { type: 'application/json' }
    );
    const error = { response: { data: blob as unknown } };

    await parseBlobErrorData(error);

    const parsed = error.response.data as { code?: string; message?: string };
    expect(parsed.code).toBe('FORM_TEMPLATE_NOT_FOUND');
    expect(parsed.message).toBe('양식 없음');
  });

  it('Blob이 JSON 아닌 plain text면 { message: text }로 치환', async () => {
    const blob = new Blob(['Internal Server Error'], { type: 'text/plain' });
    const error = { response: { data: blob as unknown } };

    await parseBlobErrorData(error);

    const parsed = error.response.data as { message?: string };
    expect(parsed.message).toBe('Internal Server Error');
  });

  it('Blob이 비어있으면 {} 로 치환', async () => {
    const blob = new Blob([], { type: 'application/json' });
    const error = { response: { data: blob as unknown } };

    await parseBlobErrorData(error);

    expect(error.response.data).toEqual({});
  });

  it('data가 Blob이 아니면 no-op', async () => {
    const error = { response: { data: { code: 'EXISTING', message: 'm' } } };

    await parseBlobErrorData(error);

    const value = error.response.data as { code: string; message: string };
    expect(value.code).toBe('EXISTING');
    expect(value.message).toBe('m');
  });

  it('response 필드 자체가 없으면 no-op', async () => {
    const error = { other: 'field' };
    await expect(parseBlobErrorData(error)).resolves.toBeUndefined();
    expect((error as { other: string }).other).toBe('field');
  });

  it('파싱 후 createApiError에 전달하면 백엔드 코드가 ApiError.code로 매핑됨', async () => {
    const blob = new Blob(
      [
        JSON.stringify({
          code: 'FORM_TEMPLATE_NOT_FOUND',
          message: '양식 템플릿 파일이 스토리지에 없습니다.',
        }),
      ],
      { type: 'application/json' }
    );
    const axiosError = {
      response: { data: blob as unknown, status: 404 },
      isAxiosError: true,
    };

    await parseBlobErrorData(axiosError);
    const apiError = createApiError(axiosError);

    expect(apiError.code).toBe(EquipmentErrorCode.FORM_TEMPLATE_NOT_FOUND);
    expect(apiError.statusCode).toBe(404);
    expect(apiError.message).toContain('스토리지에 없습니다');
  });
});
