'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, AlertCircle } from 'lucide-react';
import { FRONTEND_ROUTES, parseEquipmentQRUrl } from '@equipment-management/shared-constants';
import { parseManagementNumber } from '@equipment-management/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ManualEntryFallbackProps {
  /** 진입 원인 힌트 (카메라 거부 / QR 훼손 / 의도적 전환) — 제목 분기용. */
  reason: 'denied' | 'unavailable' | 'user_choice';
  /** 부모에서 카메라 재요청을 원할 때 (일부 시나리오) — 미제공 시 재시도 버튼 숨김. */
  onRetryCamera?: () => void;
}

/**
 * QR 스캐너 수동 입력 fallback.
 *
 * 입력 허용 형식:
 * - 관리번호 그대로 (`SUW-E0001`)
 * - 전체 URL (`https://app/e/SUW-E0001`)
 *
 * 검증은 SSOT 2단계:
 * 1) `parseEquipmentQRUrl(url)` — URL 형태면 관리번호 추출
 * 2) `parseManagementNumber(value)` — 순수 관리번호 검증
 *
 * 성공 시 `FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(mgmt)`로 네비게이트.
 * 접근성: label 연결, 에러 메시지 `aria-live="polite"`, 제출 버튼 `type="submit"`.
 */
export function ManualEntryFallback({ reason, onRetryCamera }: ManualEntryFallbackProps) {
  const t = useTranslations('qr.scanner');
  const router = useRouter();
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) {
        setError(t('invalidFormat'));
        return;
      }

      // URL 형태면 먼저 파싱 시도
      const parsedUrl = parseEquipmentQRUrl(trimmed);
      if (parsedUrl) {
        router.push(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(parsedUrl.managementNumber));
        return;
      }

      // 관리번호 직접 입력
      if (parseManagementNumber(trimmed)) {
        router.push(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(trimmed));
        return;
      }

      setError(t('invalidFormat'));
    },
    [value, router, t]
  );

  const title =
    reason === 'denied'
      ? t('cameraDenied')
      : reason === 'unavailable'
        ? t('cameraUnavailable')
        : t('manualEntryTitle');

  const body =
    reason === 'denied'
      ? t('cameraDeniedBody')
      : reason === 'unavailable'
        ? t('cameraUnavailableBody')
        : t('manualEntryBody');

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-lg border border-border bg-background p-4 safe-area-bottom">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-mgmt-input" className="text-sm">
            {t('manualEntryLabel')}
          </Label>
          <Input
            id="manual-mgmt-input"
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={t('manualEntryPlaceholder')}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'manual-mgmt-error' : undefined}
            className="min-h-[var(--touch-target-min)]"
          />
          {error && (
            <p
              id="manual-mgmt-error"
              role="alert"
              aria-live="polite"
              className="flex items-center gap-1 text-xs text-brand-critical"
            >
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="min-h-[var(--touch-target-min)]"
          disabled={value.trim().length === 0}
        >
          <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t('manualEntrySubmit')}
        </Button>

        {onRetryCamera && (
          <Button
            type="button"
            variant="outline"
            onClick={onRetryCamera}
            className="min-h-[var(--touch-target-min)]"
          >
            {t('retryCamera')}
          </Button>
        )}
      </form>
    </div>
  );
}
