import http from 'k6/http';
import { check, sleep } from 'k6';

// SSOT: packages/shared-constants/src/api-endpoints.ts
//   API_ENDPOINTS.AUTH.LOGIN
//   API_ENDPOINTS.SOFTWARE_VALIDATIONS.LIST_ALL
const BASE = __ENV.API_BASE ?? 'http://localhost:3001';
const ENDPOINTS = {
  LOGIN: `${BASE}/api/auth/login`,
  LIST_ALL: `${BASE}/api/software-validations`,
};

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
  return { token: body.accessToken };
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
