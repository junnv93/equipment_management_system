/**
 * CSP violation wire E2E (proxy.ts → backend ingest)
 *
 * Verify the end-to-end Content-Security-Policy loop:
 *   (1) proxy.ts emits Content-Security-Policy + Report-To headers on auth-success path
 *   (2) report-uri / report-to point to API_ENDPOINTS.SECURITY.CSP_REPORT (SSOT)
 *   (3) backend POST /api/security/csp-report accepts both legacy (csp-report)
 *       and Reporting API (csp-violation) payload shapes
 *   (4) [SHOULD] real DOM violation triggers ingest (best-effort, brittle on directives)
 *
 * Authentication model: storageState (lab-manager) — proxy.ts only emits CSP on the
 * auth-success path. Unauthenticated requests redirect to /login without CSP headers.
 *
 * chromium 단독 실행 — webkit/firefox 는 CSP report-uri/report-to 처리 차이로
 * 본 spec scope 외 (cross-browser 검증은 후속 sprint).
 *
 * 관련 unit tests (controller dispatch 로직):
 *   apps/backend/src/modules/security/__tests__/security.controller.spec.ts
 *
 * 관련 ADR / Memory:
 *   - ADR-0006 (frontend-backend routing model — same-origin proxy)
 *   - feedback_no_fabricate_domain_data.md (이 spec 은 mock 0건, 실 wire 검증)
 */

import { test, expect } from '@playwright/test';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { BASE_URLS } from '../shared/constants/shared-test-data';

const CSP_REPORT_PATH = API_ENDPOINTS.SECURITY.CSP_REPORT;
const CSP_REPORT_URL = `${BASE_URLS.BACKEND}${CSP_REPORT_PATH}`;

// RFC 6761 reserved invalid TLD — intentional violation trigger (will never resolve)
const FORBIDDEN_HOST = 'forbidden.example.invalid';

test.describe('CSP wire — proxy.ts header emit + backend ingest', () => {
  test.use({ storageState: 'tests/e2e/.auth/lab-manager.json' });

  // ───────────────────────────────────────────────────────────────────────
  // TC-1 (MUST): dashboard route → Content-Security-Policy header present
  //              with key directives (script-src, default-src, report-uri,
  //              report-to). report-uri value must end with the SSOT path.
  // ───────────────────────────────────────────────────────────────────────
  test('Content-Security-Policy header — emitted with directives + report-uri SSOT', async ({
    page,
  }) => {
    const response = await page.goto('/equipment');
    expect(response).not.toBeNull();

    const cspHeader = response!.headers()['content-security-policy'];
    expect(cspHeader, 'CSP header must be present on dashboard route').toBeTruthy();

    // Key directives from proxy.ts buildCspHeader
    expect(cspHeader).toContain('default-src');
    expect(cspHeader).toContain('script-src');
    expect(cspHeader).toContain('frame-ancestors');
    expect(cspHeader).toContain('report-uri');
    expect(cspHeader).toContain('report-to csp-endpoint');

    // report-uri value must reference the SSOT path (no hardcoded path drift)
    const reportUriMatch = cspHeader.match(/report-uri\s+(\S+)/);
    expect(reportUriMatch).not.toBeNull();
    expect(reportUriMatch![1]).toContain(CSP_REPORT_PATH);
  });

  // ───────────────────────────────────────────────────────────────────────
  // TC-2 (MUST): Report-To header JSON points to API_ENDPOINTS.SECURITY.CSP_REPORT
  //              (RFC 8941 absolute URL). SSOT regression guard.
  // ───────────────────────────────────────────────────────────────────────
  test('Report-To header — endpoint URL absolute + CSP_REPORT SSOT', async ({ page }) => {
    const response = await page.goto('/equipment');
    expect(response).not.toBeNull();

    const reportToRaw = response!.headers()['report-to'];
    expect(reportToRaw, 'Report-To header must be present').toBeTruthy();

    const reportTo = JSON.parse(reportToRaw);
    expect(reportTo.group).toBe('csp-endpoint');
    expect(Array.isArray(reportTo.endpoints)).toBe(true);
    expect(reportTo.endpoints.length).toBeGreaterThan(0);

    const endpointUrl = reportTo.endpoints[0].url;
    // Must be absolute URL ending with the SSOT path (proxy.ts uses request.nextUrl.origin)
    expect(endpointUrl).toMatch(/^https?:\/\//);
    expect(endpointUrl).toContain(CSP_REPORT_PATH);
  });

  // ───────────────────────────────────────────────────────────────────────
  // TC-3 (MUST): backend /api/security/csp-report accepts BOTH payload shapes
  //              - legacy report-uri: { "csp-report": { ... } }
  //              - Reporting API report-to: [{ type: "csp-violation", body: { ... } }]
  //              Endpoint is @Public() — no auth required (request fixture).
  //              Throttle is 10/min/IP — sequential calls with small delay.
  // ───────────────────────────────────────────────────────────────────────
  test('backend csp-report endpoint — accepts legacy + Reporting API shapes', async ({
    request,
  }) => {
    // Legacy report-uri shape
    const legacyResponse = await request.post(CSP_REPORT_URL, {
      headers: { 'content-type': 'application/csp-report' },
      data: {
        'csp-report': {
          'document-uri': `${BASE_URLS.FRONTEND}/equipment`,
          'violated-directive': 'img-src',
          'blocked-uri': `http://${FORBIDDEN_HOST}/x.png`,
          'line-number': 1,
        },
      },
    });
    expect(legacyResponse.status()).toBe(204);

    // Small delay to avoid coincidental dedupe / throttle interaction
    await new Promise((resolve) => setTimeout(resolve, 250));

    // Reporting API csp-violation shape
    const reportingApiResponse = await request.post(CSP_REPORT_URL, {
      headers: { 'content-type': 'application/reports+json' },
      data: [
        {
          type: 'csp-violation',
          age: 0,
          url: `${BASE_URLS.FRONTEND}/equipment`,
          user_agent: 'playwright-test',
          body: {
            documentURL: `${BASE_URLS.FRONTEND}/equipment`,
            effectiveDirective: 'img-src',
            blockedURL: `http://${FORBIDDEN_HOST}/x.png`,
            lineNumber: 1,
            disposition: 'enforce',
          },
        },
      ],
    });
    expect(reportingApiResponse.status()).toBe(204);
  });

  // ───────────────────────────────────────────────────────────────────────
  // TC-4 (SHOULD): Real DOM violation triggers POST to /csp-report.
  //                Best-effort — img-src 'self' violation should fire a report
  //                on chromium, but timing/directive support varies.
  //                If flaky, registered as tech-debt + skipped (loop-non-blocking).
  // ───────────────────────────────────────────────────────────────────────
  test('real DOM violation — img-src violation triggers /csp-report POST', async ({ page }) => {
    let cspReportPostSeen = false;
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes(CSP_REPORT_PATH)) {
        cspReportPostSeen = true;
      }
    });

    await page.goto('/equipment');

    // Inject an <img> with a forbidden src — violates img-src 'self' directive
    await page.evaluate((forbiddenHost) => {
      const img = document.createElement('img');
      img.src = `http://${forbiddenHost}/violation-trigger.png`;
      document.body.appendChild(img);
    }, FORBIDDEN_HOST);

    // Browser fires report asynchronously — poll up to 5s
    await expect.poll(() => cspReportPostSeen, { timeout: 5000, intervals: [200] }).toBe(true);
  });
});
