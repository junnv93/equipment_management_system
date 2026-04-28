import { NextResponse } from 'next/server';
import { INTERNAL_BACKEND_URL } from '@/lib/config/api-config';

/**
 * Frontend → Backend 헬스 체크 (Same-Origin Reverse-Proxy 모델, ADR-0006).
 *
 * 본 라우트는 server-side에서 실행되므로 backend를 직접 호출 → INTERNAL_BACKEND_URL SSOT 사용.
 * `process.env.BACKEND_URL` 같은 별칭은 SSOT 위반이므로 사용 금지 (verify-ssot 검증).
 */
export async function GET() {
  let backendHealthy = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${INTERNAL_BACKEND_URL}/api/monitoring/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    backendHealthy = res.ok;
  } catch {
    backendHealthy = false;
  }

  return NextResponse.json({
    status: 'ok',
    backend: backendHealthy ? 'ok' : 'unavailable',
    timestamp: new Date().toISOString(),
  });
}
