import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

@Injectable()
export class HelmetConfigService {
  constructor(private configService: ConfigService) {}

  createHelmetMiddleware() {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", isProduction ? this.configService.get('FRONTEND_URL') : '*'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },

      // XSS 보호
      xssFilter: true,

      // HTTPS 강제
      hsts: {
        maxAge: 31536000, // 1년
        includeSubDomains: true,
        preload: true,
      },

      // 프레임 설정
      frameguard: {
        action: 'deny',
      },

      // MIME 스니핑 방지
      noSniff: true,

      // 리퍼러 정책
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },

      // IE에서 XSS 필터 활성화
      ieNoOpen: true,

      // 캐시 제어
      hidePoweredBy: true,
    });
  }
}
