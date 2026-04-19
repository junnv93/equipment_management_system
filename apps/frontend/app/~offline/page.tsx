import { WifiOff } from 'lucide-react';

/**
 * PWA 오프라인 fallback 페이지.
 *
 * 서비스워커가 네트워크 연결 없이 탐색 요청을 처리할 수 없을 때 제공.
 * i18n(next-intl) 없이 정적 HTML로 유지 — 오프라인 환경에서 서버 응답 필요 없도록.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <WifiOff className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">오프라인 상태입니다</h1>
          <p className="text-muted-foreground">
            인터넷 연결을 확인한 후 다시 시도해 주세요.
            <br />
            일부 페이지는 캐시에서 계속 이용할 수 있습니다.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
