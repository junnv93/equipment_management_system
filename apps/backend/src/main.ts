import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HelmetConfigService } from './common/middleware/helmet-config';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { json, urlencoded } from 'express';
import { LoggerService } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { MonitoringService } from './modules/monitoring/monitoring.service';
import { GlobalExceptionFilter } from './common/filters/error.filter';
import { FormTemplateService } from './modules/reports/form-template.service';

// NestJS app 참조 — process 핸들러에서 graceful close에 사용
let appRef: Awaited<ReturnType<typeof NestFactory.create>> | null = null;

// 프로세스 수준 예외 핸들러 — 스케줄러, 이벤트 리스너 등 비동기 컨텍스트에서
// 잡히지 않는 예외를 포착하여 NestJS graceful shutdown 후 종료
process.on('uncaughtException', async (error) => {
  console.error('[FATAL] Uncaught exception:', error);
  if (appRef) {
    try {
      await appRef.close(); // OnModuleDestroy 훅 실행, DB 풀 정리
    } catch {
      /* 종료 중 에러 무시 */
    }
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  // unhandledRejection은 프로세스 상태를 손상시키지 않으므로 로그만 남기고 계속 실행
  // Node.js 15+에서 기본 동작(crash)을 오버라이드하여 서비스 안정성 확보
  // enableShutdownHooks()가 SIGTERM/SIGINT를 담당하므로 여기서 exit 불필요
  console.error('[WARN] Unhandled promise rejection:', reason);
});

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  appRef = app;

  // 기본 서비스 및 설정 초기화
  const configService = app.get(ConfigService);
  // LoggerService는 Scope.TRANSIENT이므로 resolve() 사용
  const loggerService = await app.resolve(LoggerService);
  const helmetConfigService = app.get(HelmetConfigService);

  app.useLogger(loggerService);

  // 보안 미들웨어 설정
  app.use(helmetConfigService.createHelmetMiddleware());
  app.use(cookieParser());
  app.use(compression());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // API 검증 파이프
  //
  // ✅ Single Source of Truth 원칙: 모든 검증은 Zod 스키마를 사용합니다.
  //
  // 검증 전략:
  // 1. 모든 모듈은 @equipment-management/schemas 패키지의 Zod 스키마를 사용
  // 2. 각 컨트롤러 메서드에서 @UsePipes(ZodValidationPipe)로 명시적 검증
  // 3. 전역 ValidationPipe는 제거하여 ZodValidationPipe와의 충돌 방지
  //
  // 장점:
  // - 타입 안전성: Zod 스키마에서 TypeScript 타입 자동 추론
  // - 일관성: 프론트엔드와 백엔드가 동일한 스키마 사용
  // - 유지보수성: 한 곳(@equipment-management/schemas)에서 스키마 관리
  // - 중복 제거: class-validator 의존성 제거, Zod 단일 검증 체계
  //
  // 참고:
  // - DTO 클래스는 Swagger 문서화(@ApiProperty)와 타입 힌트용으로만 사용
  // - 실제 검증은 ZodValidationPipe가 담당
  //
  // 전역 ValidationPipe 제거됨 - 모든 검증은 ZodValidationPipe로 처리

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
  const nodeEnv = configService.get('NODE_ENV');
  const frontendUrl = configService.get('FRONTEND_URL');

  if (nodeEnv === 'production' && !frontendUrl) {
    throw new Error('[SECURITY] FRONTEND_URL environment variable must be set in production');
  }

  app.enableCors({
    origin: frontendUrl || 'http://localhost:3000',
    credentials: true,
    // 파일 다운로드 시 클라이언트(axios)가 서버 SSOT 파일명/타입을 읽을 수 있도록 노출.
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
  });

  // 글로벌 접두사
  app.setGlobalPrefix('api');

  // Swagger 설정 (프로덕션에서는 ENABLE_SWAGGER=true 명시 필요)
  const isSwaggerEnabled =
    nodeEnv !== 'production' || configService.get('ENABLE_SWAGGER') === 'true';
  if (isSwaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('장비 관리 시스템 API')
      .setDescription('장비 관리 시스템의 RESTful API 문서입니다.')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'JWT 토큰을 입력하세요',
          in: 'header',
        },
        'JWT-auth'
      )
      .addTag('장비 관리', '장비 CRUD 및 관리 기능')
      .addTag('인증', '사용자 인증 및 권한 관리')
      .addTag('팀 관리', '팀 정보 관리')
      .addTag('사용자 관리', '사용자 정보 관리')
      .addTag('대여 관리', '장비 대여 및 반납 관리')
      .addTag('교정 관리', '장비 교정 일정 및 이력 관리')
      .addTag('알림', '시스템 알림 관리')
      .addTag('보고서', '통계 및 보고서 생성')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // Graceful Shutdown — SIGTERM(ts-node-dev 재시작, PM2, K8s) 처리
  // enableShutdownHooks(): SIGTERM/SIGINT 수신 시 OnApplicationShutdown 훅 실행 후 포트 반납
  // 미설정 시: 구 프로세스가 포트를 점유한 채로 재시작 → EADDRINUSE
  app.enableShutdownHooks();

  // 양식 템플릿 시드: 파일시스템 → 스토리지 (최초 1회)
  const formTemplateService = app.get(FormTemplateService);
  await formTemplateService.seedFromFilesystem('../../docs/procedure/template');

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  loggerService.log(`Application is running on: http://localhost:${port}/api`);
  if (isSwaggerEnabled) {
    loggerService.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
