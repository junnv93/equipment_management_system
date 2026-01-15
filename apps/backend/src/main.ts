import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { testConnection } from './database/drizzle';
import { HelmetConfigService } from './common/middleware/helmet-config';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { LoggerService } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { MonitoringService } from './modules/monitoring/monitoring.service';
import { GlobalExceptionFilter } from './common/filters/error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // 기본 서비스 및 설정 초기화
  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);
  const helmetConfigService = app.get(HelmetConfigService);
  
  app.useLogger(loggerService);
  
  // 보안 미들웨어 설정
  app.use(helmetConfigService.createHelmetMiddleware());
  app.use(cookieParser());
  app.use(compression());
  
  // API 검증 파이프
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // 모니터링 서비스 초기화 (의존성 주입 문제로 인해 나중에 초기화)
  const monitoringService = app.get(MonitoringService);
  
  // 글로벌 인터셉터 등록
  app.useGlobalInterceptors(
    new LoggingInterceptor(loggerService, monitoringService),
    new ErrorInterceptor(loggerService, monitoringService)
  );
  
  // 글로벌 예외 필터 등록
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // CORS 설정
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
    credentials: true,
  });
  
  // 글로벌 접두사
  app.setGlobalPrefix('api');
  
  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  
  loggerService.log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});