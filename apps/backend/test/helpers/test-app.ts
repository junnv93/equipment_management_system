import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppModule } from '../../src/app.module';

export interface TestAppContext {
  app: INestApplication;
  module: TestingModule;
}

/**
 * NestJS 테스트 앱을 부트스트랩합니다.
 * 각 테스트 파일에서 독립된 앱 인스턴스를 생성합니다.
 *
 * @returns app (INestApplication) + module (TestingModule)
 */
export async function createTestApp(): Promise<TestAppContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return { app, module: moduleFixture };
}

/**
 * 테스트 앱을 안전하게 종료합니다.
 */
export async function closeTestApp(app: INestApplication | undefined): Promise<void> {
  if (app) {
    await app.close();
  }
}
