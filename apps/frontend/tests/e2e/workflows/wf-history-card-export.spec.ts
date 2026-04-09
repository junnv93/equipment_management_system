/**
 * Suite: QP-18-02 시험설비 이력카드 내보내기 검증
 *
 * SUW-E0001 (스펙트럼 분석기)의 이력카드를 브라우저에서 다운로드하고
 * DOCX 내용을 파싱하여 모든 섹션이 올바르게 렌더링되는지 검증합니다.
 *
 * 검증 대상:
 * - 기본정보 (관리번호, 장비명, 시방일치, 교정필요 등)
 * - 위치 변동 이력 (3건)
 * - 교정 이력
 * - 유지보수 내역 (2건)
 * - 사고이력 (1건)
 * - 각 섹션이 올바른 순서로 배치 (상단 유출 없음)
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { expectFileDownload } from '../shared/helpers/download-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import fs from 'fs';
import PizZip from 'pizzip';

test.describe.configure({ mode: 'serial' });

test.describe('QP-18-02 이력카드 내보내기', () => {
  const equipmentId = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;
  const detailUrl = `/equipment/${equipmentId}`;

  test('이력카드 다운로드 → DOCX 파일 수신', async ({ techManagerPage: page }) => {
    await page.goto(detailUrl);

    // 이력카드 버튼 찾기
    const historyCardBtn = page.getByRole('button', { name: /이력카드/ });
    await expect(historyCardBtn).toBeVisible();

    // 다운로드 트리거: 파일명 = 관리번호_장비명_시험설비이력카드.docx
    const download = await expectFileDownload(page, () => historyCardBtn.click(), {
      filenamePattern: /SUW-E0001.*시험설비이력카드\.docx$/,
    });

    expect(download.suggestedFilename()).toMatch(/\.docx$/);
  });

  test('이력카드 DOCX 내용 — 기본정보 섹션', async ({ techManagerPage: page }) => {
    await page.goto(detailUrl);

    const historyCardBtn = page.getByRole('button', { name: /이력카드/ });
    const download = await expectFileDownload(page, () => historyCardBtn.click());

    // DOCX 파싱
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const buf = fs.readFileSync(filePath!);
    const zip = new PizZip(buf);
    const xml = zip.file('word/document.xml')!.asText();
    const fullText = [...xml.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)].map((m) => m[1]).join(' ');

    // 기본정보 검증
    expect(fullText).toContain('SUW-E0001');
    expect(fullText).toContain('스펙트럼 분석기');

    // 시방일치 체크박스 변환
    const hasSpecMatch = fullText.includes('■일치') || fullText.includes('■불일치');
    expect(hasSpecMatch).toBe(true);

    // 교정필요 체크박스 변환
    const hasCalRequired = fullText.includes('■필요') || fullText.includes('■불필요');
    expect(hasCalRequired).toBe(true);
  });

  test('이력카드 DOCX 내용 — 이력 섹션 순서 및 데이터 배치', async ({ techManagerPage: page }) => {
    await page.goto(detailUrl);

    const historyCardBtn = page.getByRole('button', { name: /이력카드/ });
    const download = await expectFileDownload(page, () => historyCardBtn.click());

    const filePath = await download.path();
    const buf = fs.readFileSync(filePath!);
    const zip = new PizZip(buf);
    const xml = zip.file('word/document.xml')!.asText();
    const fullText = [...xml.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)].map((m) => m[1]).join(' ');

    // 섹션 헤더 위치 확인 (올바른 순서)
    const locationSectionPos = fullText.indexOf('장비 위치 변동 이력');
    const calibrationSectionPos = fullText.indexOf('장비 교정 이력');
    const maintenanceSectionPos = fullText.indexOf('장비 유지보수 내역');
    const incidentSectionPos = fullText.indexOf('장비 손상, 오작동');

    expect(locationSectionPos).toBeGreaterThan(-1);
    expect(calibrationSectionPos).toBeGreaterThan(locationSectionPos);
    expect(maintenanceSectionPos).toBeGreaterThan(calibrationSectionPos);
    expect(incidentSectionPos).toBeGreaterThan(maintenanceSectionPos);

    // 위치 변동 이력 데이터가 해당 섹션 뒤에 존재
    const locationData = fullText.indexOf('수원 본관 3층 RF 시험실');
    expect(locationData).toBeGreaterThan(locationSectionPos);

    // 유지보수 데이터가 유지보수 섹션 뒤에 존재 (상단 유출 방지)
    const maintData = fullText.indexOf('팬 필터 청소');
    expect(maintData).toBeGreaterThan(maintenanceSectionPos);

    // 사고이력 데이터가 사고 섹션 뒤에 존재
    const incidentData = fullText.indexOf('RF 입력 포트 접촉 불량');
    expect(incidentData).toBeGreaterThan(incidentSectionPos);

    // 기본정보 영역(관리번호)이 이력 섹션보다 앞에 위치
    const managementNumPos = fullText.indexOf('SUW-E0001');
    expect(managementNumPos).toBeLessThan(locationSectionPos);
  });
});
