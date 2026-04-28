'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationPendingBegin } from './use-navigation-pending';

interface NavigateOptions {
  replace?: boolean;
  scroll?: boolean;
}

/**
 * `router.push`/`router.replace` wrapper — L3 GlobalProgressBar가 보일 수 있도록
 * navigation pending counter를 begin/end + React useTransition으로 감쌈.
 *
 * 사용 시점 (룰):
 * - 사용자 클릭으로 인한 router.push (탭, 검색결과, 카드 등)
 * - mutation 성공 후 redirect
 *
 * 사용 X 시점:
 * - useEffect 안 자동 redirect (auth check)
 * - query string sync (replace) — 콘텐츠 변경 없음
 *
 * 안전망: navigation 시작 후 1.5초 안에 segment mount 안 되면 카운터 강제 감소
 * (transition cleanup이 누락되어도 progressbar 영구 표시 방지).
 */
export function useNavigateWithPending() {
  const router = useRouter();
  const begin = useNavigationPendingBegin();
  const [, startTransition] = React.useTransition();

  return React.useCallback(
    (href: string, opts?: NavigateOptions) => {
      const end = begin();
      // 안전망: 1.5s 후 강제 release (transition이 cleanup 안 부르는 케이스 방어)
      const safety = setTimeout(end, 1500);

      startTransition(() => {
        const fn = opts?.replace ? router.replace : router.push;
        fn(href, { scroll: opts?.scroll });
      });

      // segment mount 후 transition cleanup이 호출됨 — 그때 end 실행됨.
      // 안전망 timer는 항상 cleanup하여 leak 없음.
      // (end 자체가 idempotent — 중복 호출 안전)
      return () => {
        clearTimeout(safety);
        end();
      };
    },
    [router, begin]
  );
}
