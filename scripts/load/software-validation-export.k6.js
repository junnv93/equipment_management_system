import http from 'k6/http';
import { check, sleep } from 'k6';

// SSOT: packages/shared-constants/src/api-endpoints.ts
//   API_ENDPOINTS.AUTH.LOGIN
//   API_ENDPOINTS.REPORTS.EXPORT.FORM_TEMPLATE('UL-QP-18-09')
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
  const res = http.post(
    ENDPOINTS.LOGIN,
    JSON.stringify({
      email: __ENV.K6_USER_EMAIL,
      password: __ENV.K6_USER_PASSWORD,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  const body = res.json();
  return {
    token: body.accessToken,
    // K6_VALIDATION_ID: 테스트 DB에 존재하는 validationId (README 참조)
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
