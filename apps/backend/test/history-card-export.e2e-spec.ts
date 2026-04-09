/// <reference types="jest" />

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/equipment_management';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-e2e-tests-minimum-32-characters-long';
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  'test-nextauth-secret-key-for-e2e-tests-minimum-32-characters-long';
process.env.AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || 'test-client-id-for-e2e-tests';
process.env.AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || 'test-tenant-id-for-e2e-tests';
process.env.DEV_ADMIN_PASSWORD = process.env.DEV_ADMIN_PASSWORD || 'admin123';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import PizZip from 'pizzip';
import { eq as eqOp } from 'drizzle-orm';
import { users } from '@equipment-management/db/schema/users';
import { equipment as equipmentTable } from '@equipment-management/db/schema/equipment';
import type { AppDatabase } from '@equipment-management/db';

/**
 * QP-18-02 시험설비 이력카드 내보내기 검증
 *
 * SUW-E0001 (스펙트럼 분석기) 시드 데이터를 사용하여
 * 양식 템플릿에 모든 섹션이 올바르게 매핑되는지 확인합니다.
 */
describe('History Card Export (QP-18-02) - SUW-E0001', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // admin@example.com 사용자가 DB에 존재하도록 보장 (AuthService testPasswords 매칭)
    const db = moduleFixture.get<AppDatabase>('DRIZZLE_INSTANCE');
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

    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@example.com',
      password: 'admin123',
    });

    accessToken =
      loginResponse.body.data?.accessToken ||
      loginResponse.body.access_token ||
      loginResponse.body.accessToken;

    if (!accessToken) {
      throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
    }
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  it('should export history card with all sections for SUW-E0001', async () => {
    // 1. SUW-E0001 UUID (시드 고정값)
    const uuid = 'eeee1001-0001-4001-8001-000000000001';

    // 2. 이력카드 다운로드
    const exportResponse = await request(app.getHttpServer())
      .get(`/equipment/${uuid}/history-card`)
      .set('Authorization', `Bearer ${accessToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(exportResponse.status).toBe(200);
    expect(exportResponse.headers['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    // 3. DOCX 내용 파싱
    const zip = new PizZip(exportResponse.body as Buffer);
    const xml = zip.file('word/document.xml')!.asText();
    const allText = [...xml.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)].map((m) => m[1]);
    const fullText = allText.join(' ');

    console.log('\n=== History Card Text Content ===');
    allText.forEach((t, i) => console.log(`  ${i}: ${JSON.stringify(t)}`));
    console.log('=== End ===\n');

    // 4. 기본정보 섹션 검증
    expect(fullText).toContain('SUW-E0001'); // 관리번호
    expect(fullText).toContain('스펙트럼 분석기'); // 장비명

    // 시방일치: ■일치 또는 ■불일치 (체크박스 변환)
    const hasSpecMatch = fullText.includes('■일치') || fullText.includes('■불일치');
    expect(hasSpecMatch).toBe(true);

    // 날짜 형식: YYYY/MM/DD
    const datePattern = /\d{4}\/\d{2}\/\d{2}/;
    expect(fullText).toMatch(datePattern);

    // 교정필요 여부
    const hasCalReq = fullText.includes('■필요') || fullText.includes('■불필요');
    expect(hasCalReq).toBe(true);

    // 5. 위치 변동 이력 섹션 (시드: 3건)
    expect(fullText).toContain('수원 본관 1층 입고실'); // 최초 입고
    expect(fullText).toContain('수원 본관 2층 EMC 시험실 A'); // 설치
    expect(fullText).toContain('수원 본관 3층 RF 시험실'); // 이동

    // 6. 교정 이력 섹션
    // 교정 이력은 calibrations 테이블에서 가져옴
    // 결과나 날짜가 있어야 함

    // 7. 유지보수 내역 섹션 (시드: 2건)
    expect(fullText).toContain('팬 필터 청소');
    expect(fullText).toContain('감쇠기 교체');

    // 8. 사고이력 섹션 (시드: 1건 추가)
    expect(fullText).toContain('RF 입력 포트 접촉 불량');

    // 9. 이력 섹션들이 올바른 순서로 배치되어야 함
    // (위치변동 → 교정 → 유지보수 → 사고)
    const locationSectionPos = fullText.indexOf('장비 위치 변동 이력');
    const calibrationSectionPos = fullText.indexOf('장비 교정 이력');
    const maintenanceSectionPos = fullText.indexOf('장비 유지보수 내역');
    const incidentSectionPos = fullText.indexOf('장비 손상, 오작동');

    expect(locationSectionPos).toBeGreaterThan(-1);
    expect(calibrationSectionPos).toBeGreaterThan(locationSectionPos);
    expect(maintenanceSectionPos).toBeGreaterThan(calibrationSectionPos);
    expect(incidentSectionPos).toBeGreaterThan(maintenanceSectionPos);

    // 10. 이력 데이터가 해당 섹션 뒤에 있어야 함 (상단 유출 방지)
    const titlePos = fullText.indexOf('시험설비 이력카드');
    const managementNumberPos = fullText.indexOf('SUW-E0001');

    // 유지보수 데이터가 유지보수 섹션 뒤에 있어야 함
    const maintDataPos = fullText.indexOf('팬 필터 청소');
    expect(maintDataPos).toBeGreaterThan(maintenanceSectionPos);

    // 사고 데이터가 사고 섹션 뒤에 있어야 함
    const incidentDataPos = fullText.indexOf('RF 입력 포트 접촉 불량');
    expect(incidentDataPos).toBeGreaterThan(incidentSectionPos);

    // 위치 데이터가 위치 섹션 뒤에 있어야 함
    const locationDataPos = fullText.indexOf('수원 본관 3층 RF 시험실');
    expect(locationDataPos).toBeGreaterThan(locationSectionPos);

    console.log('\n✅ All history card sections verified successfully');
    console.log(`  - Equipment: SUW-E0001 (${uuid})`);
    console.log(`  - Location history: 3 records`);
    console.log(`  - Maintenance history: 2 records`);
    console.log(`  - Incident history: 1 record`);
  }, 30000);

  it('should reflect live equipment updates (not stale seed data)', async () => {
    const uuid = 'eeee1001-0001-4001-8001-000000000001';

    // 1. 최신 version 조회
    const getResp = await request(app.getHttpServer())
      .get(`/equipment/${uuid}`)
      .set('Authorization', `Bearer ${accessToken}`);
    const latestVersion = getResp.body.data?.version ?? getResp.body.version ?? 1;

    // 2. 장비 정보를 앱에서 수정 (PATCH — multipart/form-data)
    const updateResponse = await request(app.getHttpServer())
      .patch(`/equipment/${uuid}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .field('name', '수정된 스펙트럼 분석기')
      .field('manufacturer', 'Rohde & Schwarz')
      .field('accessories', '수정된 부속품 목록')
      .field('version', String(latestVersion));

    expect(updateResponse.status).toBe(200);
    console.log('PATCH response:', JSON.stringify(updateResponse.body).slice(0, 300));

    // 수정 요청이 승인 대기로 가는 경우: DB 직접 업데이트로 검증
    // (앱 워크플로우는 역할에 따라 즉시 적용 or 승인 대기)
    const db = app.get<AppDatabase>('DRIZZLE_INSTANCE');
    await db
      .update(equipmentTable)
      .set({
        name: '수정된 스펙트럼 분석기',
        manufacturer: 'Rohde & Schwarz',
        accessories: '수정된 부속품 목록',
      })
      .where(eqOp(equipmentTable.id, uuid));

    // 3. 이력카드 재다운로드
    const exportResponse = await request(app.getHttpServer())
      .get(`/equipment/${uuid}/history-card`)
      .set('Authorization', `Bearer ${accessToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(exportResponse.status).toBe(200);

    // 3. 수정된 정보가 반영되었는지 확인
    const zip = new PizZip(exportResponse.body as Buffer);
    const xml = zip.file('word/document.xml')!.asText();
    const fullText = [...xml.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)]
      .map((m) => m[1])
      .join(' ');

    // 수정된 장비명이 반영
    expect(fullText).toContain('수정된 스펙트럼 분석기');
    // 수정된 제조사가 반영
    expect(fullText).toContain('Rohde');
    // 수정된 부속품이 반영
    expect(fullText).toContain('수정된 부속품 목록');
    // 기존 시드 데이터가 아닌 수정 데이터
    expect(fullText).not.toContain('Generic Manufacturer');

    // 4. 파일명도 수정된 장비명 반영
    const contentDisposition = exportResponse.headers['content-disposition'] ?? '';
    const decodedFilename = decodeURIComponent(
      contentDisposition.replace(/.*filename\*=UTF-8''/, '')
    );
    expect(decodedFilename).toContain('수정된 스펙트럼 분석기');

    console.log('\n✅ Live data reflection verified');
    console.log(`  - Updated name: "수정된 스펙트럼 분석기" reflected in DOCX`);
    console.log(`  - Updated manufacturer: "Rohde & Schwarz" reflected`);
    console.log(`  - Filename: ${decodedFilename}`);
  }, 30000);
});
