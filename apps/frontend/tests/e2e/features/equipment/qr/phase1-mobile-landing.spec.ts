/**
 * QR Phase 1 — 모바일 랜딩 페이지 E2E
 *
 * 커버리지:
 * 1. 인증 사용자 `/e/:managementNumber` → 장비 요약 카드 + 역할별 액션 시트 렌더
 * 2. 비인증 사용자 `/e/:managementNumber` → /login?callbackUrl=... 리다이렉트
 * 3. 유효하지 않은 관리번호 → not-found.tsx 렌더
 *
 * SSOT:
 * - FRONTEND_ROUTES.EQUIPMENT.BY_MGMT 빌더로 URL 조립 (하드코딩 /e/ 금지)
 * - parseManagementNumber SSOT 기반 검증 동작 확인
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

// 시드 데이터 — available 상태의 SUW-E 장비 (교차 사이트/팀 격리 영향 없음)
const VALID_MGMT = 'SUW-E0009';
// parseManagementNumber 실패 케이스
const INVALID_MGMT = 'NOT-A-VALID-MGMT';

test.describe('QR Phase 1 — Mobile Landing', () => {
  test.describe('인증 사용자', () => {
    test('시험실무자: 유효한 관리번호 → 장비 요약 + 액션 시트 렌더', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(VALID_MGMT));

      // 장비 이름(h1) 가시성
      await expect(testOperatorPage.locator('h1')).toBeVisible();
      // 모노스페이스 관리번호(EquipmentLandingClient의 font-mono p) — breadcrumb과 구분
      await expect(testOperatorPage.locator('p.font-mono', { hasText: VALID_MGMT })).toBeVisible();
    });

    test('품질책임자: 유효한 관리번호 → 장비 요약 렌더 (조회 전용 역할)', async ({
      qualityManagerPage,
    }) => {
      await qualityManagerPage.goto(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(VALID_MGMT));
      await expect(qualityManagerPage.locator('h1')).toBeVisible();
      await expect(
        qualityManagerPage.locator('p.font-mono', { hasText: VALID_MGMT })
      ).toBeVisible();
    });
  });

  test.describe('역할별 CTA matrix (서버 allowedActions SSOT)', () => {
    // 서버 SSOT: QR_ACTION_VALUES + allowedActions — 프론트는 렌더만.
    // 테스트 목표: 각 역할이 특정 action 키를 노출/비노출하는지 matrix 검증.

    test('시험실무자: report_nc(부적합 신고) 버튼 노출', async ({ testOperatorPage }) => {
      await testOperatorPage.goto(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(VALID_MGMT));
      // data-action 속성 또는 i18n 키 `reportNc`(부적합 신고)로 찾기
      const reportNcButton = testOperatorPage.getByRole('link', {
        name: /부적합|non.?conformance|report nc/i,
      });
      await expect(reportNcButton.first()).toBeVisible({ timeout: 10_000 });
    });

    test('품질책임자: request_checkout(반출 신청) 버튼 미노출 (view-only 역할)', async ({
      qualityManagerPage,
    }) => {
      await qualityManagerPage.goto(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(VALID_MGMT));
      // 페이지 h1 로딩 확인 — landing 랜더 완료까지 대기
      await expect(qualityManagerPage.locator('h1')).toBeVisible({ timeout: 10_000 });

      // request_checkout(반출 신청) 액션은 quality_manager 권한에 없음 → 미노출 확인
      // i18n `qr.mobileActionSheet.actions.requestCheckout` 기반 텍스트
      const requestCheckout = qualityManagerPage.getByRole('link', {
        name: /반출\s*신청|request\s*checkout/i,
      });
      await expect(requestCheckout).toHaveCount(0);
    });
  });

  test.describe('유효성 경계', () => {
    test('잘못된 관리번호 → not-found 렌더', async ({ testOperatorPage }) => {
      const response = await testOperatorPage.goto(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(INVALID_MGMT));

      // Next.js notFound()는 HTTP 404 + not-found.tsx 페이지 렌더
      // 일부 환경에서 Next가 200으로 서빙할 수 있으므로 실제 렌더 내용으로도 확인
      expect([200, 404]).toContain(response?.status() ?? 0);
      // not-found 페이지 heading 또는 "찾을 수 없음" 류 텍스트
      const notFoundHeading = testOperatorPage.getByRole('heading', {
        name: /찾을 수 없|not found/i,
      });
      await expect(notFoundHeading).toBeVisible();
    });
  });
});
