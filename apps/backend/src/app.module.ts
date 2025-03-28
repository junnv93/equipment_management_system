import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { initializeDatabase, closeDatabase } from './db';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // NestJS 애플리케이션 시작 시 DB 연결 초기화
    await initializeDatabase();
  }

  async onModuleDestroy() {
    // NestJS 애플리케이션 종료 시 DB 연결 해제
    await closeDatabase();
  }
}
