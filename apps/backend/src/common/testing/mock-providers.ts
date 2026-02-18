/**
 * 공용 Mock Provider 팩토리
 * 서비스 생성자 변경 시 이 파일만 수정하면 모든 테스트에 반영됨
 */
export const createMockCacheService = (): Record<string, jest.Mock> => ({
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  deleteByPattern: jest.fn(),
  getOrSet: jest.fn().mockImplementation((_k: unknown, f: () => unknown) => f()),
  invalidatePattern: jest.fn(),
  clear: jest.fn(),
  size: jest.fn().mockReturnValue(0),
});

export const createMockEventEmitter = (): Record<string, jest.Mock> => ({
  emit: jest.fn(),
  emitAsync: jest.fn().mockResolvedValue([]),
  on: jest.fn(),
});

export const createMockPermissionsGuard = (): Record<string, jest.Mock> => ({
  canActivate: jest.fn().mockReturnValue(true),
});

export const createMockConfigService = (): Record<string, jest.Mock> => ({
  get: jest.fn().mockReturnValue('AUDIT'),
});

export const createMockEquipmentImportsService = (): Record<string, jest.Mock> => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
});
