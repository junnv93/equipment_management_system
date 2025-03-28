import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 전역 접두사 설정
  app.setGlobalPrefix('api');

  // 유효성 검사 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 데코레이터가 없는 속성 제거
      forbidNonWhitelisted: true, // 화이트리스트에 없는 속성이 있으면 요청 자체를 거부
      transform: true, // 타입 변환 활성화
    }),
  );

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('장비 관리 시스템 API')
    .setDescription('장비 대여, 교정, 반출 관리를 위한 API')
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
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // 서버 시작
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log(`Swagger 문서: http://localhost:${port}/api/docs`);
}

bootstrap();
