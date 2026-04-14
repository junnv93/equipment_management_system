/**
 * 공용 Mock Provider 팩토리
 * 서비스 생성자 변경 시 이 파일만 수정하면 모든 테스트에 반영됨
 */
export const createMockCacheService = (): Record<string, jest.Mock> => ({
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  deleteByPattern: jest.fn(),
  deleteByPrefix: jest.fn(),
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

export const createMockCacheInvalidationHelper = (): Record<string, jest.Mock> => ({
  invalidateAllDashboard: jest.fn().mockResolvedValue(undefined),
  invalidateApprovalCounts: jest.fn().mockResolvedValue(undefined),
  invalidateAllEquipment: jest.fn().mockResolvedValue(undefined),
  invalidateEquipmentDetail: jest.fn().mockResolvedValue(undefined),
  invalidateEquipmentLists: jest.fn().mockResolvedValue(undefined),
  invalidateAfterEquipmentUpdate: jest.fn().mockResolvedValue(undefined),
  invalidateAfterNonConformanceCreation: jest.fn().mockResolvedValue(undefined),
  invalidateAfterNonConformanceStatusChange: jest.fn().mockResolvedValue(undefined),
  invalidateAfterDisposal: jest.fn().mockResolvedValue(undefined),
  invalidateAfterCalibrationPlanUpdate: jest.fn().mockResolvedValue(undefined),
});

export const createMockEquipmentImportsService = (): Record<string, jest.Mock> => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
});

export const createMockFileUploadService = (): Record<string, jest.Mock> => ({
  saveFile: jest.fn().mockResolvedValue({
    fileName: 'test-file.pdf',
    originalFileName: 'test-file.pdf',
    filePath: 'equipment/test-file.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    fileHash: 'abc123',
  }),
  readFile: jest.fn().mockResolvedValue(Buffer.from('test')),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  onModuleInit: jest.fn().mockResolvedValue(undefined),
});

export const createMockEquipmentHistoryService = (): Record<string, jest.Mock> => ({
  createLocationHistoryInternal: jest.fn().mockResolvedValue(undefined),
  createLocationHistoryBatch: jest.fn().mockResolvedValue(undefined),
  getLocationHistory: jest.fn().mockResolvedValue([]),
  getMaintenanceHistory: jest.fn().mockResolvedValue([]),
  getIncidentHistory: jest.fn().mockResolvedValue([]),
});

export const createMockStorageProvider = (): Record<string, jest.Mock> => ({
  ensureContainer: jest.fn().mockResolvedValue(undefined),
  upload: jest.fn().mockResolvedValue(undefined),
  download: jest.fn().mockResolvedValue(Buffer.from('test')),
  delete: jest.fn().mockResolvedValue(undefined),
  supportsPresignedUrl: jest.fn().mockReturnValue(false),
  getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://example.com/presigned'),
});

export const createMockDocumentService = (): Record<string, jest.Mock> => ({
  createDocument: jest.fn().mockResolvedValue({ id: 'doc-uuid-1', status: 'active' }),
  createDocuments: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue({ id: 'doc-uuid-1', status: 'active' }),
  findByIdAnyStatus: jest.fn().mockResolvedValue({ id: 'doc-uuid-1', status: 'active' }),
  findByCalibrationId: jest.fn().mockResolvedValue([]),
  findByEquipmentId: jest.fn().mockResolvedValue([]),
  findAllByEquipmentId: jest.fn().mockResolvedValue([]),
  findByRequestId: jest.fn().mockResolvedValue([]),
  deleteDocument: jest.fn().mockResolvedValue(undefined),
  createRevision: jest.fn().mockResolvedValue({ id: 'doc-uuid-2', revisionNumber: 2 }),
  getRevisionHistory: jest.fn().mockResolvedValue([]),
  verifyIntegrity: jest
    .fn()
    .mockResolvedValue({ valid: true, expectedHash: 'abc', actualHash: 'abc' }),
  transferDocumentsToEquipment: jest.fn().mockResolvedValue(0),
  purgeDeletedDocuments: jest.fn().mockResolvedValue({ purged: 0, failed: 0 }),
});

export const createMockSettingsService = (): Record<string, jest.Mock> => ({
  getSystemSettings: jest.fn().mockResolvedValue({
    notificationRetentionDays: 90,
    calibrationAlertDays: 30,
  }),
  getCalibrationAlertDays: jest.fn().mockResolvedValue(30),
  updateSystemSettings: jest.fn().mockResolvedValue({}),
  updateCalibrationAlertDays: jest.fn().mockResolvedValue({}),
});

export const createMockNotificationSseService = (): Record<string, jest.Mock> => ({
  createStream: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  pushToUser: jest.fn(),
  pushToUsers: jest.fn(),
  broadcastApprovalChanged: jest.fn(),
  getActiveConnectionCount: jest.fn().mockReturnValue(0),
  disconnectUser: jest.fn(),
});

export const createMockNotificationDispatcher = (): Record<string, jest.Mock> => ({
  dispatch: jest.fn().mockResolvedValue(undefined),
});

export const createMockNotificationTemplateService = (): Record<string, jest.Mock> => ({
  render: jest.fn().mockImplementation((template: string) => template),
  buildNotification: jest.fn().mockReturnValue({
    title: '테스트 알림',
    content: '테스트 내용',
    category: 'system',
    priority: 'medium',
    entityType: 'equipment',
    entityId: 'eq-uuid-1',
    equipmentId: undefined,
    linkUrl: '/equipment/eq-uuid-1',
  }),
});

export const createMockNotificationPreferencesService = (): Record<string, jest.Mock> => ({
  getOrCreate: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
  filterEnabledUsers: jest.fn().mockImplementation((ids: string[]) => Promise.resolve(ids)),
  filterEmailEnabledUsers: jest.fn().mockImplementation((ids: string[]) => Promise.resolve(ids)),
});

export const createMockNotificationRecipientResolver = (): Record<string, jest.Mock> => ({
  resolve: jest.fn().mockResolvedValue(['user-uuid-1']),
});

export const createMockExcelParserService = (): Record<string, jest.Mock> => ({
  parseBuffer: jest.fn().mockResolvedValue([]),
  mapRows: jest.fn().mockReturnValue([]),
  parseMultiSheetBuffer: jest.fn().mockResolvedValue([]),
  generateErrorReport: jest.fn().mockResolvedValue(Buffer.from('error-report')),
  generateTemplate: jest.fn().mockResolvedValue(Buffer.from('template')),
});

export const createMockMigrationValidatorService = (): Record<string, jest.Mock> => ({
  validateBatch: jest.fn().mockResolvedValue([]),
  filterValidRows: jest.fn().mockImplementation((rows: unknown[]) => rows),
});
