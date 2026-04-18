import { safeCallback } from '../lib/safe-callback';

describe('safeCallback', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('undefined fn이면 아무것도 하지 않는다', async () => {
    await expect(safeCallback(undefined, 'test')).resolves.toBeUndefined();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('sync 함수를 정상 실행한다', async () => {
    const fn = jest.fn().mockReturnValue('ok');
    await safeCallback(fn, 'test');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('async 함수를 await하고 정상 완료한다', async () => {
    const fn = jest.fn().mockResolvedValue('async-ok');
    await safeCallback(fn, 'test');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('sync 함수가 throw해도 resolve하고 에러를 로깅한다', async () => {
    const fn = jest.fn().mockImplementation(() => {
      throw new Error('sync error');
    });
    await expect(safeCallback(fn, 'myLabel')).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith('[myLabel]', 'sync error');
  });

  it('async 함수가 reject해도 resolve하고 에러를 로깅한다', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('async error'));
    await expect(safeCallback(fn, 'asyncLabel')).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith('[asyncLabel]', 'async error');
  });

  it('비-Error 객체가 throw되어도 로깅하고 resolve한다', async () => {
    const fn = jest.fn().mockRejectedValue('string-reject');
    await expect(safeCallback(fn, 'strLabel')).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith('[strLabel]', 'string-reject');
  });
});
