// spec: 장비 상세 기본정보 탭 — 필드 완전성 및 정보 순서 검증
// 변경사항: 누락 필드 14개 추가, 사진/매뉴얼 섹션을 기본정보 카드 아래로 이동

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../../shared/constants/shared-test-data';

const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

/**
 * exact text matcher for dt (term) elements
 * hasText는 부분 매칭이므로 '제조사'가 '제조사 연락처'도 매칭함.
 * getByText(exact: true)로 정확한 dt를 찾은 뒤 visible 확인.
 */
function termExact(page: import('@playwright/test').Page, text: string) {
  return page.getByRole('term').filter({ has: page.getByText(text, { exact: true }) });
}

test.describe('장비 상세 - 기본정보 탭 필드 완전성', () => {
  test('TC-01: 기본정보 3개 카드 섹션이 모두 표시된다', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);
    await expect(page.getByText('장비 기본 정보')).toBeVisible();
    await expect(page.getByText('교정 정보')).toBeVisible();
    await expect(page.getByText('위치 및 관리 정보')).toBeVisible();
  });

  test('TC-02: 장비 기본정보 카드에 핵심 + 신규 필드가 표시된다', async ({
    techManagerPage: page,
  }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);

    // 기존 필드
    await expect(termExact(page, '장비명')).toBeVisible();
    await expect(termExact(page, '관리번호')).toBeVisible();
    await expect(termExact(page, '모델명')).toBeVisible();
    await expect(termExact(page, '제조사')).toBeVisible();
    await expect(termExact(page, '시리얼번호')).toBeVisible();
    await expect(termExact(page, '구입년도')).toBeVisible();

    // 신규 필드: 제조사 연락처, 부속품
    await expect(termExact(page, '제조사 연락처')).toBeVisible();
    await expect(page.getByText('02-1234-5678')).toBeVisible();
    await expect(termExact(page, '부속품')).toBeVisible();
    await expect(page.getByText('RF 케이블 3m x2')).toBeVisible();
  });

  test('TC-03: 교정 카드에 중간점검 관련 필드가 모두 표시된다', async ({
    techManagerPage: page,
  }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);

    // 기존 교정 필드
    await expect(termExact(page, '교정 필요 여부')).toBeVisible();
    await expect(termExact(page, '교정 기관')).toBeVisible();

    // 신규: 교정 결과, 보정계수
    await expect(termExact(page, '교정 결과')).toBeVisible();
    await expect(page.getByText('적합', { exact: true })).toBeVisible();
    await expect(termExact(page, '보정계수')).toBeVisible();
    await expect(page.getByText('0.98')).toBeVisible();

    // 신규: 중간점검 관련 필드
    await expect(termExact(page, '중간점검 대상')).toBeVisible();
    await expect(termExact(page, '중간점검 주기')).toBeVisible();
    await expect(termExact(page, '최종 중간 점검일')).toBeVisible();
    await expect(termExact(page, '차기 중간 점검일')).toBeVisible();
  });

  test('TC-04: 위치 카드에 기존 + 신규 필드가 표시된다', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);

    // 기존 필드
    await expect(termExact(page, '사이트')).toBeVisible();
    await expect(termExact(page, '팀')).toBeVisible();
    await expect(termExact(page, '보관 위치')).toBeVisible();
    await expect(termExact(page, '시방일치 여부')).toBeVisible();

    // 신규: 기술책임자, 최초 설치 위치, 설치 일시, 매뉴얼 보관 위치
    await expect(termExact(page, '기술책임자')).toBeVisible();
    await expect(page.getByText('김기술')).toBeVisible();
    await expect(termExact(page, '최초 설치 위치')).toBeVisible();
    await expect(page.getByText('SUWON Lab A-201')).toBeVisible();
    await expect(termExact(page, '설치 일시')).toBeVisible();
    await expect(termExact(page, '매뉴얼 보관 위치').first()).toBeVisible();
    await expect(page.getByText('A동 201호 캐비닛').first()).toBeVisible();
  });

  test('TC-04b: 구매 및 관리 정보 카드가 표시된다', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);

    await expect(page.getByText('구매 및 관리 정보')).toBeVisible();

    await expect(termExact(page, '공급사')).toBeVisible();
    await expect(page.getByText('Keysight Technologies Korea')).toBeVisible();
    await expect(termExact(page, '연락처')).toBeVisible();
    await expect(page.getByText('031-987-6543')).toBeVisible();
  });

  test('TC-05: 정보 순서 — 기본정보 카드가 사진/매뉴얼보다 먼저 나온다', async ({
    techManagerPage: page,
  }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);

    const basicInfoSection = page.getByText('장비 기본 정보');
    const photoSection = page.getByText('장비 사진', { exact: true });

    await expect(basicInfoSection).toBeVisible();
    await expect(photoSection).toBeVisible();

    // 기본정보가 사진보다 위에 있는지 y좌표로 검증
    const basicInfoBox = await basicInfoSection.boundingBox();
    const photoBox = await photoSection.boundingBox();

    expect(basicInfoBox).toBeTruthy();
    expect(photoBox).toBeTruthy();
    expect(basicInfoBox!.y).toBeLessThan(photoBox!.y);
  });
});
