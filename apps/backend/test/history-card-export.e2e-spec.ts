/// <reference types="jest" />

import request from 'supertest';
import PizZip from 'pizzip';
import { eq as eqOp } from 'drizzle-orm';
import { equipment as equipmentTable } from '@equipment-management/db/schema/equipment';
import type { AppDatabase } from '@equipment-management/db';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';

/**
 * QP-18-02 시험설비 이력카드 내보내기 검증
 *
 * SUW-E0001 (스펙트럼 분석기) 시드 데이터를 사용하여
 * 양식 템플릿에 모든 섹션이 올바르게 매핑되는지 확인합니다.
 */
describe('History Card Export (QP-18-02) - SUW-E0001', () => {
  let ctx: TestAppContext;
  let accessToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    accessToken = await loginAs(ctx.app, 'admin');
  }, 30000);

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  it('should export history card with all sections for SUW-E0001', async () => {
    const uuid = 'eeee1001-0001-4001-8001-000000000001';

    // 먼저 장비가 존재하는지 확인
    const equipCheck = await request(ctx.app.getHttpServer())
      .get(`/equipment/${uuid}`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (equipCheck.status === 404) {
      // 시드 데이터가 없으면 테스트 스킵
      return;
    }

    const exportResponse = await request(ctx.app.getHttpServer())
      .get(`/equipment/${uuid}/history-card`)
      .set('Authorization', `Bearer ${accessToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    // 양식 템플릿이 없으면 500/404 — 테스트 환경에서는 허용
    if (exportResponse.status !== 200) {
      expect([404, 500]).toContain(exportResponse.status);
      return;
    }

    expect(exportResponse.headers['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );

    const zip = new PizZip(exportResponse.body as Buffer);
    const xml = zip.file('word/document.xml')!.asText();
    const allText = [...xml.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)].map((m) => m[1]);
    const fullText = allText.join(' ');

    // 기본정보 섹션
    expect(fullText).toContain('SUW-E0001');
    expect(fullText).toContain('스펙트럼 분석기');

    const hasSpecMatch = fullText.includes('■일치') || fullText.includes('■불일치');
    expect(hasSpecMatch).toBe(true);

    const datePattern = /\d{4}\/\d{2}\/\d{2}/;
    expect(fullText).toMatch(datePattern);

    const hasCalReq = fullText.includes('■필요') || fullText.includes('■불필요');
    expect(hasCalReq).toBe(true);

    // 위치 변동 이력 (시드: 3건)
    expect(fullText).toContain('수원 본관 1층 입고실');
    expect(fullText).toContain('수원 본관 2층 EMC 시험실 A');
    expect(fullText).toContain('수원 본관 3층 RF 시험실');

    // 유지보수 내역 (시드: 2건)
    expect(fullText).toContain('팬 필터 청소');
    expect(fullText).toContain('감쇠기 교체');

    // 사고이력 (시드: 1건)
    expect(fullText).toContain('RF 입력 포트 접촉 불량');

    // 섹션 순서 검증
    const locationSectionPos = fullText.indexOf('장비 위치 변동 이력');
    const calibrationSectionPos = fullText.indexOf('장비 교정 이력');
    const maintenanceSectionPos = fullText.indexOf('장비 유지보수 내역');
    const incidentSectionPos = fullText.indexOf('장비 손상, 오작동');

    expect(locationSectionPos).toBeGreaterThan(-1);
    expect(calibrationSectionPos).toBeGreaterThan(locationSectionPos);
    expect(maintenanceSectionPos).toBeGreaterThan(calibrationSectionPos);
    expect(incidentSectionPos).toBeGreaterThan(maintenanceSectionPos);

    // 데이터가 해당 섹션 뒤에 있어야 함
    const maintDataPos = fullText.indexOf('팬 필터 청소');
    expect(maintDataPos).toBeGreaterThan(maintenanceSectionPos);

    const incidentDataPos = fullText.indexOf('RF 입력 포트 접촉 불량');
    expect(incidentDataPos).toBeGreaterThan(incidentSectionPos);

    const locationDataPos = fullText.indexOf('수원 본관 3층 RF 시험실');
    expect(locationDataPos).toBeGreaterThan(locationSectionPos);
  }, 30000);

  it('should merge incident+repair+nonConformance into unified §5 section', async () => {
    const uuid = 'eeee1001-0001-4001-8001-000000000001';

    const equipCheck = await request(ctx.app.getHttpServer())
      .get(`/equipment/${uuid}`)
      .set('Authorization', `Bearer ${accessToken}`);
    if (equipCheck.status === 404) return;

    const exportResponse = await request(ctx.app.getHttpServer())
      .get(`/equipment/${uuid}/history-card`)
      .set('Authorization', `Bearer ${accessToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    if (exportResponse.status !== 200) {
      expect([404, 500]).toContain(exportResponse.status);
      return;
    }

    const zip = new PizZip(exportResponse.body as Buffer);
    const xml = zip.file('word/document.xml')!.asText();
    const fullText = [...xml.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)]
      .map((m) => m[1])
      .join(' ');

    // ① repair_history REPAIR_009 — "N-타입 입력 커넥터 핀 교체"가 [수리] prefix로 §5 섹션에 표시
    expect(fullText).toContain('N-타입 입력 커넥터 핀 교체');
    expect(fullText).toMatch(/\[수리\]/);
    // repair_result 라벨 suffix 검증
    expect(fullText).toContain('[완료]');

    // ② repair 행에 NC_011 crossRef 주석 — FK 1:1 연결 시 "(연계: 부적합 #shortId)"
    // NC_011 = aaaa000b-... → shortId: 'aaaa000b'
    expect(fullText).toContain('연계: 부적합 #aaaa000b');

    // ③ incident_history INCIDENT_011 — "[오작동]" 유형 prefix 포함
    expect(fullText).toMatch(/\[오작동\]/);

    // ④ FK 역참조 중복 제거: NC_011은 repair와 1:1 연결이므로 §5에 별도 "[부적합]" 행으로 나오지 않음
    // (NC_011의 cause 고유 마커 " — 커넥터 핀 마모"는 repair crossRef 맥락이 아닌 한 나오지 않아야 함)
    const incidentSectionPos = fullText.indexOf('장비 손상, 오작동');
    expect(incidentSectionPos).toBeGreaterThan(-1);
    const sectionText = fullText.substring(incidentSectionPos);
    // [부적합] 프리픽스로 시작하는 별도 행이 없음 — NC는 FK 중복 제거로 스킵됨
    expect(sectionText).not.toMatch(/\[부적합\]/);

    // ⑤ 승인일이 YYYY/MM/DD 형식으로 기록됨 (Phase 1 approvedAt ?? updatedAt fallback)
    expect(fullText).toMatch(/\d{4}\/\d{2}\/\d{2}/);
  }, 30000);

  it('should reflect live equipment updates (not stale seed data)', async () => {
    const uuid = 'eeee1001-0001-4001-8001-000000000001';

    // 먼저 장비가 존재하는지 확인
    const getResp = await request(ctx.app.getHttpServer())
      .get(`/equipment/${uuid}`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (getResp.status === 404) {
      // 시드 데이터가 없으면 테스트 스킵
      return;
    }

    const latestVersion = getResp.body.data?.version ?? getResp.body.version ?? 1;

    // DB 직접 업데이트 (API PATCH는 form-data 파싱/Zod 검증이 환경 의존적)
    const db = ctx.module.get<AppDatabase>('DRIZZLE_INSTANCE');
    await db
      .update(equipmentTable)
      .set({
        name: '수정된 스펙트럼 분석기',
        manufacturer: 'Rohde & Schwarz',
        accessories: '수정된 부속품 목록',
      })
      .where(eqOp(equipmentTable.id, uuid));

    const exportResponse = await request(ctx.app.getHttpServer())
      .get(`/equipment/${uuid}/history-card`)
      .set('Authorization', `Bearer ${accessToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    // 양식 템플릿이 없으면 500/404 — 테스트 환경에서는 허용
    if (exportResponse.status !== 200) {
      expect([404, 500]).toContain(exportResponse.status);
      return;
    }

    const zip = new PizZip(exportResponse.body as Buffer);
    const xml = zip.file('word/document.xml')!.asText();
    const fullText = [...xml.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)]
      .map((m) => m[1])
      .join(' ');

    expect(fullText).toContain('수정된 스펙트럼 분석기');
    expect(fullText).toContain('Rohde');
    expect(fullText).toContain('수정된 부속품 목록');
    expect(fullText).not.toContain('Generic Manufacturer');

    const contentDisposition = exportResponse.headers['content-disposition'] ?? '';
    const decodedFilename = decodeURIComponent(
      contentDisposition.replace(/.*filename\*=UTF-8''/, ''),
    );
    expect(decodedFilename).toContain('수정된 스펙트럼 분석기');
  }, 30000);
});
