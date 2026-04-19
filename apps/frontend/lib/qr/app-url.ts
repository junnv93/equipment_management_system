/**
 * 앱 기본 URL 반환 — NEXT_PUBLIC_APP_URL 우선, 없으면 window.location.origin fallback.
 *
 * Web Worker 컨텍스트에서는 window가 없으므로 worker에 appUrl을 메시지로 전달.
 * 컴포넌트/클라이언트 컨텍스트 전용.
 */
export function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
