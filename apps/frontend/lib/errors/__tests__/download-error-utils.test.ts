import { getDownloadErrorToast } from '../download-error-utils';
import { ApiError, EquipmentErrorCode, ErrorCode, mapBackendErrorCode } from '../equipment-errors';

describe('getDownloadErrorToast', () => {
  const fallback = '양식 다운로드에 실패했습니다.';

  it('FORM_TEMPLATE_NOT_FOUND → 카탈로그 title + 백엔드 메시지 description', () => {
    const err = new ApiError(
      '양식 템플릿 파일이 스토리지에 없습니다. 관리자에게 문의하세요. (UL-QP-18-01)',
      EquipmentErrorCode.FORM_TEMPLATE_NOT_FOUND,
      404
    );
    const result = getDownloadErrorToast(err, fallback);
    expect(result.title).toBe('양식 파일 없음');
    expect(result.description).toContain('스토리지에 없습니다');
    expect(result.description).toContain('UL-QP-18-01');
  });

  it('EQUIPMENT_NOT_FOUND → 카탈로그 title + 백엔드 메시지 사용', () => {
    const err = new ApiError(
      '요청하신 장비를 찾을 수 없습니다.',
      EquipmentErrorCode.EQUIPMENT_NOT_FOUND,
      404
    );
    const result = getDownloadErrorToast(err, fallback);
    expect(result.title).toBe('장비를 찾을 수 없음');
    expect(result.description).toContain('장비를 찾을 수 없습니다');
  });

  it('서버 메시지가 비어있으면 카탈로그 기본 메시지 사용', () => {
    const err = new ApiError('', EquipmentErrorCode.FORM_TEMPLATE_NOT_FOUND, 404);
    const result = getDownloadErrorToast(err, fallback);
    expect(result.description).toBe('양식 템플릿 파일이 스토리지에 없습니다.');
  });

  it('DOCUMENT_NOT_FOUND → 문서 전용 카탈로그 title + 백엔드 메시지 사용', () => {
    expect(mapBackendErrorCode(ErrorCode.DocumentNotFound)).toBe(
      EquipmentErrorCode.DOCUMENT_NOT_FOUND
    );

    const err = new ApiError(
      '요청한 문서가 존재하지 않습니다.',
      EquipmentErrorCode.DOCUMENT_NOT_FOUND,
      404
    );
    const result = getDownloadErrorToast(err, fallback);
    expect(result.title).toBe('문서를 찾을 수 없음');
    expect(result.description).toBe('요청한 문서가 존재하지 않습니다.');
  });

  it('FILE_NOT_FOUND → 파일 전용 카탈로그 title + 기본 메시지 사용', () => {
    expect(mapBackendErrorCode(ErrorCode.FileNotFound)).toBe(EquipmentErrorCode.FILE_NOT_FOUND);

    const err = new ApiError('', EquipmentErrorCode.FILE_NOT_FOUND, 404);
    const result = getDownloadErrorToast(err, fallback);
    expect(result.title).toBe('파일을 찾을 수 없음');
    expect(result.description).toBe('문서 파일이 스토리지에 없습니다.');
  });

  it('raw axios DOCUMENT_NOT_FOUND 응답도 document mapper로 처리', () => {
    const result = getDownloadErrorToast(
      {
        response: {
          data: {
            code: ErrorCode.DocumentNotFound,
          },
        },
      },
      fallback
    );
    expect(result.title).toBe('문서를 찾을 수 없음');
    expect(result.description).toBe('요청한 문서를 찾을 수 없습니다.');
  });

  it('UNKNOWN_ERROR 코드 → fallback description 사용 (title 없음)', () => {
    const err = new ApiError('random error', EquipmentErrorCode.UNKNOWN_ERROR, 500);
    const result = getDownloadErrorToast(err, fallback);
    expect(result.title).toBeUndefined();
    expect(result.description).toBe(fallback);
  });

  it('ApiError가 아닌 일반 Error → fallback 사용', () => {
    const result = getDownloadErrorToast(new Error('network down'), fallback);
    expect(result.title).toBeUndefined();
    expect(result.description).toBe(fallback);
  });

  it('unknown 타입 입력 → fallback 사용', () => {
    expect(getDownloadErrorToast(null, fallback).description).toBe(fallback);
    expect(getDownloadErrorToast(undefined, fallback).description).toBe(fallback);
    expect(getDownloadErrorToast('error string', fallback).description).toBe(fallback);
  });
});
