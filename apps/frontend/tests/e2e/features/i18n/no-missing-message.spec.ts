/**
 * i18n 호출지 ↔ messages JSON 런타임 회귀 차단 smoke spec
 *
 * 본 회귀 (commit a16d95cd, 2026-04-21): "legacy 정리" 커밋이 활성 키 70+개를
 * 통째 삭제 → `/equipment/[id]/non-conformance` 등에서 38건 `MISSING_MESSAGE` 폭주.
 * 정적 검증(`scripts/check-i18n-call-sites.mjs`)이 빌드 타임에 차단하나, 런타임
 * 단에서도 다음 라우트 진입 시 console.error에 missing message 0건임을 보장.
 *
 * 시드 의존성 회피:
 *   - 특정 장비 UUID가 필요한 `/equipment/[id]/non-conformance` 라우트는 제외
 *   - 대신 system-wide list 라우트만 사용 (`/checkouts`, `/equipment`, `/non-conformances`)
 *   - 표면 회귀 발생지(`/checkouts` NextStepPanel) + 동일 namespace 페이지(`/non-conformances`)로
 *     본 회귀의 의미적 표면(NextStepPanel atom + non-conformances ns) 모두 cover
 *
 * 검출 패턴:
 *   - next-intl `MissingMessageError` 또는 `Could not resolve` 콘솔 에러
 *   - 본문 텍스트에 raw key 노출 (`management.title` 같은 dot.case 패턴)
 *
 * 실행:
 *   pnpm exec playwright test no-missing-message --project=chromium --workers=1
 */
import { test, expect, type ConsoleMessage } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '..', '..', '.auth');

// 가장 기본 권한 역할로 충분 — i18n 키 해석은 권한과 무관
test.use({ storageState: path.join(AUTH_DIR, 'test-engineer.json') });

/**
 * 정찰 대상 라우트 (시드 비의존):
 * - `/checkouts`: NextStepPanel (표면 회귀 발생지) + checkouts.fsm namespace
 * - `/equipment`: 대시보드 진입 후 가장 빈도 높은 라우트 + equipment namespace
 * - `/non-conformances`: 본 회귀의 핵심 namespace (`non-conformances.management.*` 38건 폭주의 동일 ns)
 */
const ROUTES_TO_SMOKE = ['/checkouts', '/equipment', '/non-conformances'] as const;

/**
 * MISSING_MESSAGE 검출 정규식.
 * next-intl 4.x의 메시지 형식:
 *   - "MISSING_MESSAGE: Could not resolve `xxx.yyy` in messages for locale `ko`."
 *   - "Could not resolve" (general fallback)
 */
const MISSING_MESSAGE_PATTERN = /MISSING_MESSAGE|Could not resolve/i;

/** 본문에 노출된 raw key 후보 정규식 (a.b.c 또는 a.bC.dE 같은 dot.case). */
const RAW_KEY_PATTERN = /^[a-z][a-zA-Z0-9_]+\.[a-zA-Z0-9_.]+$/;

interface ConsoleViolation {
  type: ReturnType<ConsoleMessage['type']>;
  text: string;
  location?: string;
}

test.describe('i18n smoke — no missing message at runtime', () => {
  for (const route of ROUTES_TO_SMOKE) {
    test(`${route} — 콘솔 missing message 0건 + raw key 노출 0건`, async ({ page }) => {
      const violations: ConsoleViolation[] = [];

      // 1) Listener: navigate 전에 등록 — 첫 SSR/hydration 에러도 캐치
      page.on('console', (msg) => {
        if (msg.type() !== 'error' && msg.type() !== 'warning') return;
        const text = msg.text();
        if (MISSING_MESSAGE_PATTERN.test(text)) {
          violations.push({ type: msg.type(), text, location: route });
        }
      });

      // pageerror도 캐치 — next-intl이 throw하면 React error boundary 진입 직전 emit
      page.on('pageerror', (err) => {
        const text = err.message;
        if (MISSING_MESSAGE_PATTERN.test(text)) {
          violations.push({ type: 'error', text, location: `${route} (pageerror)` });
        }
      });

      // 2) Navigate
      await page.goto(route, { waitUntil: 'networkidle' });

      // 3) Hydration 후 마운트된 모든 컴포넌트가 렌더링 완료할 시간 확보
      // useEffect/useQuery 마운트 시 fetched 텍스트가 SSR 단계에선 없을 수 있음
      await page.waitForLoadState('networkidle');

      // 4) 본문에 raw key가 텍스트로 노출됐는지 — body의 visible text 추출
      const bodyText = await page.locator('body').innerText();
      const rawKeyHits = bodyText
        .split(/\s+/)
        .filter((token) => RAW_KEY_PATTERN.test(token))
        // 정상 텍스트 후보(이메일 도메인, 파일 확장자 등) 휴리스틱 제외
        .filter(
          (token) =>
            !token.includes('@') && // email
            !token.endsWith('.com') &&
            !token.endsWith('.kr') &&
            !token.endsWith('.co.kr') &&
            !/\.(png|jpg|jpeg|svg|pdf|json)$/i.test(token) // file extension
        );

      // 5) 검증
      expect(
        violations,
        `Console에 MISSING_MESSAGE 패턴 ${violations.length}건 발견 (route ${route}):\n` +
          violations.map((v) => `  - [${v.type}] ${v.text}`).join('\n')
      ).toEqual([]);

      expect(
        rawKeyHits,
        `본문에 raw key 노출 후보 ${rawKeyHits.length}건 (route ${route}):\n` +
          rawKeyHits.slice(0, 10).join('\n')
      ).toEqual([]);
    });
  }
});
