import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

@Injectable()
export class HelmetConfigService {
  constructor(private configService: ConfigService) {}

  createHelmetMiddleware(): unknown {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: isProduction
            ? ["'self'", 'https://fonts.googleapis.com']
            : ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: isProduction
            ? ["'self'", this.configService.get('FRONTEND_URL') ?? "'none'"]
            : ["'self'", '*'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },

      // XSS 보호
      xssFilter: true,

      // HSTS는 Nginx(nginx.conf.template)에서 단일 관리합니다.
      // 백엔드는 Nginx 뒤에서 동작하므로 여기서 중복 설정하지 않습니다.
      hsts: false,

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
