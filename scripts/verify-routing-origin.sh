#!/usr/bin/env bash
# scripts/verify-routing-origin.sh
#
# ADR-0006 Same-Origin Reverse-Proxy 4-layer SSOT 회귀 방지 스크립트 (Steps 2-11)
# Step 1 (SSOT disjoint): packages/shared-constants/__tests__/api-routing.spec.ts 로 커버.
#
# 호출처: .husky/pre-push (routing 파일 변경 감지 시 자동 실행)
# 수동 실행: bash scripts/verify-routing-origin.sh
#
# 실패 시 복구: docs/references/api-routing-architecture.md 참조

set -eu
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

FAIL=0

pass() { echo "  ✔ $1"; }
fail() { echo "  ✘ $1"; FAIL=1; }

echo "▶ verify-routing-origin: ADR-0006 4-layer SSOT 검증 (Steps 2-11)"

# ── Step 2: env 절대 URL 잠입 금지 ──────────────────────────────────────────
echo ""
echo "── Step 2: env 절대 URL 금지 ──"
if grep -qE "^NEXT_PUBLIC_API_URL=https?://" \
    apps/frontend/.env.local \
    apps/frontend/.env.example \
    .env.example \
    .env.test \
    infra/compose/*.yml 2>/dev/null; then
  fail "NEXT_PUBLIC_API_URL 절대 URL 잠입 감지 (same-origin 위반)"
else
  pass "NEXT_PUBLIC_API_URL 절대 URL 없음"
fi

# ── Step 3: INTERNAL_BACKEND_URL 정의 (4개 파일) ────────────────────────────
echo ""
echo "── Step 3: INTERNAL_BACKEND_URL 정의 ──"
IURL_COUNT=$({ grep -l "^INTERNAL_BACKEND_URL=" \
    apps/frontend/.env.local \
    apps/frontend/.env.example \
    .env.example \
    .env.test 2>/dev/null || true; } | wc -l | tr -d ' ')
if [ "$IURL_COUNT" -ge 4 ]; then
  pass "INTERNAL_BACKEND_URL 4개 파일 모두 정의"
else
  fail "INTERNAL_BACKEND_URL ${IURL_COUNT}/4 파일만 정의 (SSR direct-call 경로 누락)"
fi

# ── Step 4: next.config.js rewrites ─────────────────────────────────────────
echo ""
echo "── Step 4: next.config.js rewrites 정합 ──"
if grep -qE "destination:.*\/api\/:path\*" apps/frontend/next.config.js; then
  pass "destination에 /api prefix 보존"
else
  fail "destination에 /api prefix 누락 (\${internalBackendUrl}/api/:path* 패턴 확인)"
fi

if grep -qE "csrf\|session\|providers\|signin\|signout\|callback\|error\|verify-request" \
    apps/frontend/next.config.js; then
  pass "NextAuth 핸들러 8개 제외 정규식 존재"
else
  fail "NextAuth 핸들러 8개 제외 정규식 누락 (NEXTAUTH_HANDLER_REGEX_GROUP 확인)"
fi

if ! grep -v "^\s*//" apps/frontend/next.config.js | grep -q "NEXT_PUBLIC_API_URL"; then
  pass "next.config.js에 NEXT_PUBLIC_API_URL 직접 참조 없음 (주석 제외)"
else
  fail "next.config.js에 NEXT_PUBLIC_API_URL 직접 참조 감지 (INTERNAL_BACKEND_URL 사용)"
fi

# ── Step 5: api-config.ts / api-config.server.ts SSOT 진입점 ───────────────
# api-config.ts: 클라이언트 전용 (API_BASE_URL). 클라이언트 번들 보안상 INTERNAL_BACKEND_URL 미노출.
# api-config.server.ts: 서버 전용 (INTERNAL_BACKEND_URL). Client Component import 금지.
echo ""
echo "── Step 5: api-config SSOT 분리 ──"
if grep -q "^export const API_BASE_URL" apps/frontend/lib/config/api-config.ts 2>/dev/null; then
  pass "api-config.ts export API_BASE_URL (클라이언트 baseURL SSOT)"
else
  fail "api-config.ts export API_BASE_URL 누락"
fi

if grep -q "^export const INTERNAL_BACKEND_URL" apps/frontend/lib/config/api-config.server.ts 2>/dev/null; then
  pass "api-config.server.ts export INTERNAL_BACKEND_URL (서버 전용 SSOT)"
else
  fail "api-config.server.ts export INTERNAL_BACKEND_URL 누락"
fi

if grep -q "RELATIVE_API_BASE" apps/frontend/lib/config/api-config.ts 2>/dev/null; then
  pass "api-config.ts RELATIVE_API_BASE shared-constants SSOT import"
else
  fail "api-config.ts RELATIVE_API_BASE 미사용 (shared-constants SSOT 경유 필요)"
fi

# ── Step 6: proxy.ts matcher PWA 자산 제외 ──────────────────────────────────
echo ""
echo "── Step 6: proxy.ts matcher PWA 자산 제외 ──"
if grep -qE "manifest\\.json|sw\\.js|workbox-|icons" apps/frontend/proxy.ts 2>/dev/null; then
  pass "proxy.ts matcher PWA 자산 제외 패턴 존재"
else
  fail "proxy.ts matcher PWA 자산 제외 패턴 누락"
fi

if grep -qE "_next/data" apps/frontend/proxy.ts 2>/dev/null; then
  pass "proxy.ts matcher _next/data 제외"
else
  fail "proxy.ts matcher _next/data 제외 누락"
fi

# ── Step 7: nginx NextAuth 분기 (두 파일 모두) ──────────────────────────────
echo ""
echo "── Step 7: nginx NextAuth 분기 (lan.conf + nginx.conf.template) ──"
NGINX_NEXTAUTH_COUNT=$({ grep -lE "location.*\\^/api/auth/\(csrf" \
    infra/nginx/lan.conf infra/nginx/nginx.conf.template 2>/dev/null || true; } | wc -l | tr -d ' ')
if [ "$NGINX_NEXTAUTH_COUNT" -ge 2 ]; then
  pass "nginx NextAuth location 두 파일 모두 존재"
else
  fail "nginx NextAuth location ${NGINX_NEXTAUTH_COUNT}/2 파일만 존재 (prod 배포 시 회귀)"
fi

NGINX_BACKEND_COUNT=$({ grep -lE "location.*\\^/api/auth/\(login" \
    infra/nginx/lan.conf infra/nginx/nginx.conf.template 2>/dev/null || true; } | wc -l | tr -d ' ')
if [ "$NGINX_BACKEND_COUNT" -ge 2 ]; then
  pass "nginx backend auth location 두 파일 모두 존재"
else
  fail "nginx backend auth location ${NGINX_BACKEND_COUNT}/2 파일만 존재"
fi

# ── Step 8: SW /api/* NetworkOnly ───────────────────────────────────────────
echo ""
echo "── Step 8: SW /api/* NetworkOnly ──"
if grep -qE "NetworkOnly|matcher.*\/api\/" apps/frontend/app/sw.ts 2>/dev/null; then
  pass "SW /api/* NetworkOnly 정책 존재"
else
  fail "SW /api/* NetworkOnly 정책 누락 (stale 캐시로 NextAuth 응답이 캐시될 수 있음)"
fi

# ── Step 9: backend CORS production 정책 ────────────────────────────────────
echo ""
echo "── Step 9: backend CORS 정책 ──"
if grep -A 5 "enableCors" apps/backend/src/main.ts 2>/dev/null \
    | grep -qE "frontendUrl|nodeEnv|origin"; then
  pass "backend CORS origin 환경별 분기"
else
  fail "backend CORS origin 환경별 분기 누락 (production에서 wildcard origin 위험)"
fi

# ── Step 10: axios baseURL 일관성 ───────────────────────────────────────────
echo ""
echo "── Step 10: axios baseURL 일관성 ──"
CLIENT_AXIOS_COUNT=$({ grep -l "baseURL: API_BASE_URL" \
    apps/frontend/lib/api/api-client.ts \
    apps/frontend/lib/api/authenticated-client-provider.tsx 2>/dev/null || true; } | wc -l | tr -d ' ')
if [ "$CLIENT_AXIOS_COUNT" -ge 2 ]; then
  pass "브라우저 axios 2개 클라이언트 모두 baseURL: API_BASE_URL"
else
  fail "브라우저 axios baseURL: API_BASE_URL ${CLIENT_AXIOS_COUNT}/2 (일관성 위반)"
fi

if grep -q "baseURL: INTERNAL_BACKEND_URL" apps/frontend/lib/api/server-api-client.ts 2>/dev/null; then
  pass "server-api-client.ts baseURL: INTERNAL_BACKEND_URL (SSR direct-call)"
else
  fail "server-api-client.ts INTERNAL_BACKEND_URL 미사용 (server-side는 backend 직접 호출 필요)"
fi

ABS_URL_COUNT=$({ grep -rE 'baseURL:\s*"https?://' \
    apps/frontend/lib/api/ apps/frontend/components/ 2>/dev/null \
    | { grep -v node_modules || true; } || true; } | wc -l | tr -d ' ')
if [ "$ABS_URL_COUNT" -eq 0 ]; then
  pass "axios 절대 URL baseURL 없음"
else
  fail "axios 절대 URL baseURL ${ABS_URL_COUNT}건 감지 (same-origin 위반)"
fi

# ── Step 11: localhost:300x 하드코딩 검사 ───────────────────────────────────
# 허용: lib/config/ (URL SSOT 정의 파일), __tests__/.test.ts/.spec.ts, 주석 라인 (// or *)
echo ""
echo "── Step 11: localhost:300x 하드코딩 검사 ──"
HARDCODE_COUNT=$({ grep -rnE "http://localhost:300[0-9]" \
    apps/frontend/app/ apps/frontend/components/ \
    apps/backend/src/ packages/shared-constants/src/ packages/schemas/src/ \
    2>/dev/null || true; } \
    | { grep -v \
        -e "node_modules" -e "\.next/" -e "__tests__" -e "\.test\.ts" -e "\.spec\.ts" \
        -e "DEV_FALLBACK_INTERNAL_BACKEND_URL" -e "INTERNAL_BACKEND_URL" \
        -e "'development'" -e "\"development\"" \
        -e ":[ ]*\*" -e "://[ ]" \
        || true; } \
    | wc -l | tr -d ' ')
if [ "$HARDCODE_COUNT" -eq 0 ]; then
  pass "localhost:300x 하드코딩 없음 (lib/config/ SSOT 파일 제외)"
else
  fail "localhost:300x 하드코딩 ${HARDCODE_COUNT}건 감지 (INTERNAL_BACKEND_URL SSOT 사용)"
fi

# ── 결과 요약 ────────────────────────────────────────────────────────────────
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "✔ verify-routing-origin: ALL PASS — ADR-0006 4-layer SSOT 정합"
  exit 0
else
  echo "✘ verify-routing-origin: FAIL 항목 있음"
  echo "  복구 가이드: docs/references/api-routing-architecture.md"
  echo "  ADR: docs/adr/0006-frontend-backend-routing-model.md"
  exit 1
fi
