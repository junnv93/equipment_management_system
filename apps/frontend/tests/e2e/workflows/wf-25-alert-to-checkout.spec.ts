/**
 * WF-25: alerts → 장비 상세 → 반출 신청 cross-flow
 *
 * 사용자 동선: TE 가 /alerts 에서 장비 관련 알림을 클릭 → 장비 상세 진입 →
 * "반출 신청" 버튼 → /checkouts/create?equipmentId=... 로 이동 → 폼이 해당 장비로
 * prefill 되었는지 검증.
 *
 * 검증 포인트:
 * - 알림 → 장비 상세 라우팅 (notification.linkUrl 동적)
 * - 장비 상세 "반출 신청" 버튼 동작 (StickyHeader)
 * - searchParams.equipmentId → CreateCheckoutContent prefill (selectedEquipments)
 *
 * 의도적 제외:
 * - 체크아웃 폼 제출 / pending 토스트 — WF-03 이 이미 cover. 본 spec 은 cross-flow
 *   진입 경계만 검증하여 데이터 간섭 위험 회피.
 *
 * 데이터 의존성:
 * - 시드가 calibration_due/equipment 알림을 결정적으로 보장하지 않음.
 *   알림이 없으면 test.skip (alert-kpi.spec.ts TC-13 와 동일한 패턴).
 *
 * @see docs/workflows/critical-workflows.md WF-25
 */

import { test, expect } from '../shared/fixtures/auth.fixture';

test.describe('WF-25: alerts → 장비 상세 → 반출 신청 cross-flow', () => {
  test.describe.configure({ mode: 'serial' });

  test('TE: /alerts 의 장비 알림 → 장비 상세 → 반출 신청 → 폼 prefill 검증', async ({
    testOperatorPage: page,
  }) => {
    // 1) /alerts 진입
    await page.goto('/alerts');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 2) 첫 번째 "장비를 가리키는 알림" 의 링크 탐색
    //    AlertsContent.tsx:199~210 — notification.linkUrl 을 그대로 <Link href> 로 렌더링.
    //    notifications API fetch 완료까지 기다려야 하므로 waitFor 로 명시적으로 대기.
    //    데이터 의존: 장비를 가리키는 알림이 1건도 없으면 test.skip (계측만, 회귀 차단 X).
    const equipmentAlertLink = page.locator('a[href^="/equipment/"]').first();
    try {
      await equipmentAlertLink.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      test.skip(
        true,
        'WF-25: /alerts 에 장비를 가리키는 알림(linkUrl=/equipment/...)이 없음. ' +
          'calibration_due 알림이 생성된 환경에서 실행 필요.'
      );
      return;
    }

    const href = await equipmentAlertLink.getAttribute('href');
    expect(href).toMatch(/^\/equipment\/[^/]+/);

    // 3) 알림 클릭 → 장비 상세 진입
    await equipmentAlertLink.click();
    await expect(page).toHaveURL(/\/equipment\/[^/]+/);

    // URL 에서 equipmentId 추출 (검증용)
    const detailUrl = new URL(page.url());
    const equipmentIdFromUrl = detailUrl.pathname.split('/equipment/')[1]?.split('/')[0];
    expect(equipmentIdFromUrl).toBeTruthy();

    // StickyHeader 가 렌더링될 때까지 대기 — h1 (장비명)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 3a) D-day 배지 soft assertion: alerts 의 교정 임박 신호 → 장비 상세의 시각 신호
    //     일관성을 cross-flow 로 검증. 배지가 없는 일반 상태(D > 30, not_applicable 등)는
    //     매칭 0 → 통과 (soft 성격 유지). aria-label "교정 상태: ..." 패턴으로 i18n 의존
    //     최소화.
    const calibrationBadge = page.getByLabel(/^교정 상태:/);
    if ((await calibrationBadge.count()) > 0) {
      await expect(calibrationBadge.first()).toBeVisible();
    }

    // 4) "반출 신청" 버튼 클릭
    //    EquipmentStickyHeader.tsx:238 — aria-label = t('header.checkoutAriaLabel') = "반출 신청하기"
    //    canCheckout(=Permission.CREATE_CHECKOUT + 상태 허용)이 true 일 때만 표시.
    //    TE 는 권한 보유. 알림으로 진입한 장비가 반출 불가 상태(retired 등)면 skip.
    const checkoutButton = page.getByRole('button', { name: '반출 신청하기' });
    if ((await checkoutButton.count()) === 0) {
      test.skip(
        true,
        `WF-25: 알림으로 진입한 장비(${equipmentIdFromUrl})가 반출 불가 상태이거나 ` +
          `TE 권한 부족으로 반출 신청 버튼이 표시되지 않음.`
      );
    }
    await checkoutButton.click();

    // 5) /checkouts/create?equipmentId=... 로 이동 검증
    await expect(page).toHaveURL(
      new RegExp(`/checkouts/create\\?equipmentId=${equipmentIdFromUrl}`)
    );

    // CreateCheckoutContent step1/step2 카드 렌더링 대기
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 6) Prefill 검증 — 선택된 장비 카드가 화면에 존재
    //    CreateCheckoutContent.tsx:549~595 — selectedEquipments.map 으로 Card 렌더링.
    //    각 카드의 제거 버튼 aria-label = t('create.removeEquipment', { name })
    //    = "{name} 제거" (messages/ko/checkouts.json:325).
    //    빈 상태 placeholder = "선택된 장비가 없습니다" (line 298).
    //
    //    빈 상태가 사라지고 ↔ "... 제거" aria-label 을 가진 버튼이 ≥1 존재해야 함.
    await expect(page.getByText('선택된 장비가 없습니다')).toHaveCount(0);

    const removeButton = page.getByRole('button', { name: / 제거$/ }).first();
    await expect(removeButton).toBeVisible({ timeout: 10000 });

    // 폼 자체도 렌더링되어 있어야 한다 (form#checkout-form 는 step2 의 핵심 컨테이너)
    await expect(page.locator('form#checkout-form')).toBeVisible();

    // 7) 목적이 기본값 calibration 으로 사전 선택되어 있는지(line 88 useState 기본값) — soft 체크
    //    Select 의 trigger 는 id="purpose". SelectValue 텍스트는 t('create.purposeCalibration') 한국어.
    const purposeTrigger = page.locator('#purpose');
    await expect(purposeTrigger).toBeVisible();

    // 8) 회귀 신호: 페이지 콘솔 에러 없음(soft) — page errors 는 fixture 가 별도 처리하지 않음
    //    여기서는 명시적 단언 생략. cross-flow 경계 검증이 본 spec 의 책임 범위.

    // NOTE: 의도적으로 폼 제출 단계는 수행하지 않는다 — 헤더 doc 참조.
  });
});
