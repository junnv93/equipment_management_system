import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  let backendHealthy = false;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${backendUrl}/api/monitoring/health`, {
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
