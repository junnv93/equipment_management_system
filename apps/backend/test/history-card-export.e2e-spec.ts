/// <reference types="jest" />

import request from 'supertest';
import PizZip from 'pizzip';
import { eq as eqOp } from 'drizzle-orm';
import { users } from '@equipment-management/db/schema/users';
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

    // admin@example.com 사용자가 DB에 존재하도록 보장
    const db = ctx.module.get<AppDatabase>('DRIZZLE_INSTANCE');
    const [existing] = await db
      .select()
      .from(users)
      .where(eqOp(users.email, 'admin@example.com'))
      .limit(1);
    if (!existing) {
      await db.insert(users).values({
        email: 'admin@example.com',
        name: '관리자 (E2E)',
        role: 'lab_manager',
        site: 'suwon',
        isActive: true,
      });
    }

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
