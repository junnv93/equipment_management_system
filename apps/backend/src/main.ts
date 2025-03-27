import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // 전역 프리픽스 설정
  app.setGlobalPrefix('api');
  
  // 전역 파이프 설정 (유효성 검사)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  // CORS 설정
  app.enableCors({
    origin: configService.get('NODE_ENV') === 'production' 
      ? 'https://your-production-domain.com' 
      : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  
  // 환경 변수에서 포트 가져오기
  const port = configService.get('PORT') || 3001;
  
  await app.listen(port);
  logger.log(`애플리케이션이 ${port} 포트에서 실행 중입니다.`);
  logger.log(`환경: ${configService.get('NODE_ENV')}`);
}

bootstrap(); 