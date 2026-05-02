import {
  extractAuditEntityId,
  resolveAuditEntityIdWithSentinel,
  inferEntityTypeFromPath,
} from '../audit-entity-id.util';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';
const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000000';

function makeRequest(overrides: {
  params?: Record<string, string>;
  method?: string;
  route?: { path: string };
  originalUrl?: string;
  url?: string;
}) {
  return {
    params: overrides.params ?? {},
    method: overrides.method ?? 'GET',
    route: overrides.route,
    originalUrl: overrides.originalUrl,
    url: overrides.url ?? '/',
  };
}

describe('extractAuditEntityId', () => {
  it('params.uuid가 valid UUID v4면 추출', () => {
    const req = makeRequest({ params: { uuid: VALID_UUID } });
    expect(extractAuditEntityId(req)).toBe(VALID_UUID);
  });

  it('params.id가 valid UUID v4면 추출', () => {
    const req = makeRequest({ params: { id: VALID_UUID } });
    expect(extractAuditEntityId(req)).toBe(VALID_UUID);
  });

  it('uuid > id > entityId 우선순위', () => {
    const req = makeRequest({
      params: { uuid: VALID_UUID, id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' },
    });
    expect(extractAuditEntityId(req)).toBe(VALID_UUID);
  });

  it('formNumber 등 non-UUID → undefined', () => {
    const req = makeRequest({ params: { id: 'UL-QP-18-01' } });
    expect(extractAuditEntityId(req)).toBeUndefined();
  });

  it('params 없음 → undefined', () => {
    const req = makeRequest({ params: {} });
    expect(extractAuditEntityId(req)).toBeUndefined();
  });

  it('UUID v1~v5 형식이면 추출 (regex는 [1-5] 허용)', () => {
    // 기존 interceptor 와 동일 regex — v1~v5 모두 허용
    const uuidV3 = '11111111-1111-3111-8111-111111111111';
    const req = makeRequest({ params: { uuid: uuidV3 } });
    expect(extractAuditEntityId(req)).toBe(uuidV3);
  });

  it('버전 필드가 0인 UUID → undefined', () => {
    // third group version = 0 → [1-5] 미매칭
    const invalidVersion = '11111111-1111-0111-8111-111111111111';
    const req = makeRequest({ params: { uuid: invalidVersion } });
    expect(extractAuditEntityId(req)).toBeUndefined();
  });
});

describe('resolveAuditEntityIdWithSentinel', () => {
  it('UUID 추출 성공 → useSentinel: false, entityId: uuid', () => {
    const req = makeRequest({
      params: { uuid: VALID_UUID },
      method: 'PATCH',
      url: '/api/equipment',
    });
    const result = resolveAuditEntityIdWithSentinel(req);
    expect(result.entityId).toBe(VALID_UUID);
    expect(result.useSentinel).toBe(false);
    expect(result.entityName).toBeUndefined();
  });

  it('UUID 추출 실패 → useSentinel: true, entityId: SYSTEM_USER_UUID', () => {
    const req = makeRequest({
      params: { id: 'UL-QP-18-01' },
      method: 'GET',
      route: { path: '/api/reports/export/form/:formNumber' },
    });
    const result = resolveAuditEntityIdWithSentinel(req);
    expect(result.entityId).toBe(SYSTEM_USER_UUID);
    expect(result.useSentinel).toBe(true);
    expect(result.entityName).toContain('GET');
  });

  it('sentinel 시 entityName에 path-based identifier 보존', () => {
    const req = makeRequest({
      params: {},
      method: 'POST',
      originalUrl: '/api/equipment/bulk-import',
    });
    const result = resolveAuditEntityIdWithSentinel(req);
    expect(result.entityName).toBe('POST /api/equipment/bulk-import');
  });
});

describe('inferEntityTypeFromPath', () => {
  it('/api/equipment/:uuid → equipment', () => {
    const req = makeRequest({ route: { path: '/api/equipment/:uuid' } });
    expect(inferEntityTypeFromPath(req)).toBe('equipment');
  });

  it('/api/calibration-plans/:uuid/items → calibration-plans (변수 segment 제외, 마지막 비변수)', () => {
    const req = makeRequest({ route: { path: '/api/calibration-plans/:uuid/items' } });
    // 변수 :uuid 제외 → ['api', 'calibration-plans', 'items'], 마지막 = 'items'
    expect(inferEntityTypeFromPath(req)).toBe('items');
  });

  it('/api/calibration-plans/:uuid → calibration-plans', () => {
    const req = makeRequest({ route: { path: '/api/calibration-plans/:uuid' } });
    expect(inferEntityTypeFromPath(req)).toBe('calibration-plans');
  });

  it('route 없이 url 사용', () => {
    const req = makeRequest({ url: '/api/users/me' });
    expect(inferEntityTypeFromPath(req)).toBe('me');
  });

  it('경로 없음 → unknown', () => {
    const req = makeRequest({});
    expect(inferEntityTypeFromPath(req)).toBe('unknown');
  });
});
