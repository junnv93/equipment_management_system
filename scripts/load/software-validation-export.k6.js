import http from 'k6/http';
import { check, sleep } from 'k6';

// k6는 Node.js 런타임이 아니므로 @equipment-management/shared-constants를 import할 수 없음.
// 아래 경로는 packages/shared-constants/src/api-endpoints.ts의 값을 수동으로 동기화한 복사본.
// 양식 경로 변경 시 두 곳을 함께 수정해야 한다.
const BASE = __ENV.API_BASE ?? 'http://localhost:3001';
const ENDPOINTS = {
  LOGIN: `${BASE}/api/auth/login`,
  EXPORT: `${BASE}/api/reports/export/form/UL-QP-18-09`,
};

export const options = {
  stages: [
    { duration: '30s', target: 3 },
    { duration: '60s', target: 5 },
    { duration: '60s', target: 3 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // Export는 DOCX 생성 포함이므로 목표치 완화 (p95 < 2000ms)
    'http_req_duration{type:export}': ['p(95)<2000'],
    'http_req_failed{type:export}': ['rate<0.02'],
  },
};

export function setup() {
  if (!__ENV.K6_USER_EMAIL || !__ENV.K6_USER_PASSWORD) {
    throw new Error('K6_USER_EMAIL and K6_USER_PASSWORD env vars are required');
  }
  if (!__ENV.K6_VALIDATION_ID) {
    throw new Error(
      'K6_VALIDATION_ID env var is required (UUID of an existing software-validation record)'
    );
  }

  const res = http.post(
    ENDPOINTS.LOGIN,
    JSON.stringify({
      email: __ENV.K6_USER_EMAIL,
      password: __ENV.K6_USER_PASSWORD,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (res.status !== 200) {
    throw new Error(`Login failed: HTTP ${res.status} — ${res.body}`);
  }

  const body = res.json();
  if (!body.accessToken) {
    throw new Error('Login succeeded but accessToken missing in response body');
  }

  return {
    token: body.accessToken,
    validationId: __ENV.K6_VALIDATION_ID,
  };
}

export default function (data) {
  const url = `${ENDPOINTS.EXPORT}?validationId=${data.validationId}`;
  const res = http.get(url, {
    headers: { Authorization: `Bearer ${data.token}` },
    tags: { type: 'export' },
  });

  check(res, {
    'status 200': (r) => r.status === 200,
    'is docx': (r) =>
      (r.headers['Content-Type'] ?? '').includes('application/vnd.openxmlformats-officedocument'),
  });

  sleep(0.5);
}
