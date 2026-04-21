import http from 'k6/http';
import { check, sleep } from 'k6';

// k6는 Node.js 런타임이 아니므로 @equipment-management/shared-constants를 import할 수 없음.
// 아래 경로는 packages/shared-constants/src/api-endpoints.ts의 값을 수동으로 동기화한 복사본.
// 양식 경로 변경 시 두 곳을 함께 수정해야 한다.
const BASE = __ENV.API_BASE ?? 'http://localhost:3001';
const ENDPOINTS = {
  LOGIN: `${BASE}/api/auth/login`,
  LIST_ALL: `${BASE}/api/software-validations`,
};

// p95 < 500ms 근거: DB 인덱스 조회 기준 목표치.
// 측정 기준: 로컬 4-core 환경에서 p50 ~80ms, 여유율 6× 적용.
// SLA 기준 설정 시 이 값을 업데이트할 것.
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '60s', target: 20 },
    { duration: '60s', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{type:list}': ['p(95)<500'],
    'http_req_failed{type:list}': ['rate<0.01'],
  },
};

function parseLoginResponse(res) {
  if (res.status !== 200) {
    throw new Error(`Login failed: HTTP ${res.status} — ${res.body}`);
  }
  let body;
  try {
    body = res.json();
  } catch (_) {
    throw new Error(
      `Login HTTP 200 but response is not JSON (got HTML?): ${String(res.body).slice(0, 200)}`
    );
  }
  if (!body || !body.accessToken) {
    throw new Error('Login succeeded but accessToken missing in response body');
  }
  return body.accessToken;
}

export function setup() {
  if (!__ENV.K6_USER_EMAIL || !__ENV.K6_USER_PASSWORD) {
    throw new Error('K6_USER_EMAIL and K6_USER_PASSWORD env vars are required');
  }

  const res = http.post(
    ENDPOINTS.LOGIN,
    JSON.stringify({
      email: __ENV.K6_USER_EMAIL,
      password: __ENV.K6_USER_PASSWORD,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  return { token: parseLoginResponse(res) };
}

export default function (data) {
  const res = http.get(ENDPOINTS.LIST_ALL, {
    headers: { Authorization: `Bearer ${data.token}` },
    tags: { type: 'list' },
  });

  check(res, {
    'status 200': (r) => r.status === 200,
    'has body': (r) => r.body && r.body.length > 2,
  });

  sleep(0.1);
}
