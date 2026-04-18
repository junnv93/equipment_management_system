'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AlertCircle, Loader2, QrCode } from 'lucide-react';
import { FRONTEND_ROUTES, HANDOVER_QR_TOKEN_PARAM } from '@equipment-management/shared-constants';
import { ErrorCode } from '@equipment-management/schemas';
import { Button } from '@/components/ui/button';
import checkoutApi from '@/lib/api/checkout-api';

type PageState =
  | { phase: 'verifying' }
  | { phase: 'redirecting' }
  | { phase: 'error'; code: string };

/**
 * QR 인수인계 중계 페이지 — **"QR은 경로" 원칙의 가장 순수한 구현**.
 *
 * 역할:
 * 1. URL `?token=...` 파라미터 추출
 * 2. `checkoutApi.verifyHandoverToken(token)` 호출 (백엔드가 jti 소비)
 * 3. 성공 시 `router.replace(FRONTEND_ROUTES.CHECKOUTS.CHECK(checkoutId))`로 redirect
 * 4. 실패 시 case별 에러 UI (재시도 불가 — 토큰 1회용)
 *
 * 이 페이지는 **condition-check 폼/로직을 일절 렌더하지 않는다.**
 * 모든 워크플로우는 기존 `/checkouts/[id]/check` 페이지로 위임.
 *
 * 1회용 토큰 보호 — StrictMode double-invoke 방지:
 * React 18+ StrictMode 개발 모드 또는 dependency 변화 시 useEffect가 2회 실행될 수 있음.
 * 각 실행이 verify 호출 → 첫 호출이 jti 소비 → 두번째 호출이 Consumed(409)로 실패하며
 * 사용자는 "이미 사용된 QR" 에러를 보게 됨. 모듈 레벨이 아닌 **useRef로 1회 실행 보장**.
 * (module-level flag는 동일 페이지 2회 방문 시 재시도 불가능 → UX 깨짐)
 */
export default function HandoverRedirectPage() {
  const t = useTranslations('qr.handover');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<PageState>({ phase: 'verifying' });
  const verifyStartedRef = useRef<string | null>(null);

  useEffect(() => {
    const token = searchParams.get(HANDOVER_QR_TOKEN_PARAM);
    if (!token) {
      setState({ phase: 'error', code: ErrorCode.HandoverTokenInvalid });
      return;
    }

    // 이미 이 토큰으로 verify를 시작했으면 재실행 금지 (React StrictMode + dependency churn 방어)
    if (verifyStartedRef.current === token) return;
    verifyStartedRef.current = token;

    let mounted = true;
    (async () => {
      try {
        const { checkoutId } = await checkoutApi.verifyHandoverToken(token);
        if (!mounted) return;
        setState({ phase: 'redirecting' });
        router.replace(FRONTEND_ROUTES.CHECKOUTS.CHECK(checkoutId));
      } catch (error) {
        if (!mounted) return;
        const code = resolveErrorCode(error);
        setState({ phase: 'error', code });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  if (state.phase === 'verifying' || state.phase === 'redirecting') {
    return (
      <div
        className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-8 text-center safe-area-bottom"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-foreground">
          {state.phase === 'verifying' ? t('verifyingTitle') : t('redirectingTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {state.phase === 'verifying' ? t('verifyingBody') : t('redirectingBody')}
        </p>
      </div>
    );
  }

  // error phase
  const titleKey = errorCodeToTitleKey(state.code);
  const bodyKey = errorCodeToBodyKey(state.code);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-8 text-center safe-area-bottom">
      <AlertCircle className="h-10 w-10 text-brand-critical" aria-hidden="true" />
      <h1 className="text-lg font-semibold text-foreground" role="alert">
        {t(titleKey)}
      </h1>
      <p className="text-sm text-muted-foreground">{t(bodyKey)}</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Link href={FRONTEND_ROUTES.CHECKOUTS.LIST}>
          <Button variant="outline" className="min-h-[var(--touch-target-min)]">
            {t('backToCheckouts')}
          </Button>
        </Link>
        <Link href={FRONTEND_ROUTES.SCAN}>
          <Button className="min-h-[var(--touch-target-min)]">
            <QrCode className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t('rescan')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * 에러 구분 우선순위:
 * 1. apiClient 인터셉터가 생성한 ApiError: statusCode 필드 사용 (401/409 명확)
 * 2. 원본 axios error: response.status / response.data.code 읽기
 * 3. 모두 실패: Invalid (안전한 기본값)
 *
 * HTTP status를 우선 기준으로 사용하는 이유:
 * - backend는 HANDOVER_TOKEN_EXPIRED → 401, HANDOVER_TOKEN_CONSUMED → 409로 매핑 (SSOT).
 * - frontend ApiError는 backend 문자열 code를 EquipmentErrorCode enum으로 narrow해 원본 손실.
 *   status는 보존되므로 이를 1차 소스로 사용 → defense-in-depth.
 */
function resolveErrorCode(error: unknown): string {
  const err = error as {
    statusCode?: number;
    response?: { status?: number; data?: { code?: string } };
  } | null;

  const status = err?.statusCode ?? err?.response?.status;
  if (status === 401) return ErrorCode.HandoverTokenExpired;
  if (status === 409) return ErrorCode.HandoverTokenConsumed;

  // fallback: backend code 직접 조회 (axios raw error 경로)
  const code = err?.response?.data?.code;
  if (code === ErrorCode.HandoverTokenExpired) return ErrorCode.HandoverTokenExpired;
  if (code === ErrorCode.HandoverTokenConsumed) return ErrorCode.HandoverTokenConsumed;

  return ErrorCode.HandoverTokenInvalid;
}

function errorCodeToTitleKey(code: string): 'expiredTitle' | 'consumedTitle' | 'invalidTitle' {
  if (code === ErrorCode.HandoverTokenExpired) return 'expiredTitle';
  if (code === ErrorCode.HandoverTokenConsumed) return 'consumedTitle';
  return 'invalidTitle';
}

function errorCodeToBodyKey(code: string): 'expiredBody' | 'consumedBody' | 'invalidBody' {
  if (code === ErrorCode.HandoverTokenExpired) return 'expiredBody';
  if (code === ErrorCode.HandoverTokenConsumed) return 'consumedBody';
  return 'invalidBody';
}
