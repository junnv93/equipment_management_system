import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TestAuthController } from '../test-auth.controller';
import { AuthService } from '../auth.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';

/**
 * forge-handover-token 엔드포인트 보안 가드 테스트.
 *
 * 검증 범위:
 * - NODE_ENV fail-closed 방어 (undefined, 빈값, production, staging)
 * - checkoutId 필수 검증
 * - HANDOVER_TOKEN_SECRET 미설정 시 차단
 * - 정상 발급 시 토큰 구조(exp가 과거)
 */
describe('TestAuthController — forgeHandoverToken', () => {
  let controller: TestAuthController;
  let configService: ConfigService;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestAuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { loginByEmail: jest.fn(), validateTestUser: jest.fn() },
        },
        {
          provide: SimpleCacheService,
          useValue: { size: jest.fn().mockReturnValue(0), clear: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'HANDOVER_TOKEN_SECRET') return 'test-secret-key-32bytes-min!!';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<TestAuthController>(TestAuthController);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('NODE_ENV 보안 가드', () => {
    it('NODE_ENV=production → ForbiddenException', async () => {
      process.env.NODE_ENV = 'production';
      await expect(
        controller.forgeHandoverToken({ checkoutId: 'c1', expSecondsAgo: 60 })
      ).rejects.toThrow(ForbiddenException);
    });

    it('NODE_ENV=staging → ForbiddenException', async () => {
      process.env.NODE_ENV = 'staging';
      await expect(
        controller.forgeHandoverToken({ checkoutId: 'c1', expSecondsAgo: 60 })
      ).rejects.toThrow(ForbiddenException);
    });

    it('NODE_ENV 미설정(undefined) → 기본값 production → ForbiddenException', async () => {
      delete process.env.NODE_ENV;
      await expect(
        controller.forgeHandoverToken({ checkoutId: 'c1', expSecondsAgo: 60 })
      ).rejects.toThrow(ForbiddenException);
    });

    it('NODE_ENV="" (빈 문자열) → 기본값 production → ForbiddenException', async () => {
      process.env.NODE_ENV = '';
      await expect(
        controller.forgeHandoverToken({ checkoutId: 'c1', expSecondsAgo: 60 })
      ).rejects.toThrow(ForbiddenException);
    });

    it('NODE_ENV=" Development " (공백+대소문자 혼용) → trim+lowercase → 통과', async () => {
      process.env.NODE_ENV = ' Development ';
      const result = await controller.forgeHandoverToken({
        checkoutId: 'c1',
        expSecondsAgo: 60,
      });
      expect(result.token).toBeDefined();
    });

    it('NODE_ENV=test → 정상 통과', async () => {
      process.env.NODE_ENV = 'test';
      const result = await controller.forgeHandoverToken({
        checkoutId: 'c1',
        expSecondsAgo: 60,
      });
      expect(result.token).toBeDefined();
    });
  });

  describe('입력 검증', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('checkoutId 누락 → ForbiddenException', async () => {
      await expect(controller.forgeHandoverToken({})).rejects.toThrow(ForbiddenException);
    });

    it('HANDOVER_TOKEN_SECRET 미설정 → ForbiddenException', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      await expect(
        controller.forgeHandoverToken({ checkoutId: 'c1', expSecondsAgo: 60 })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('토큰 구조', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('발급된 토큰의 exp는 과거 시점', async () => {
      const result = await controller.forgeHandoverToken({
        checkoutId: 'c1',
        expSecondsAgo: 120,
      });

      const jwt = new JwtService({ secret: 'test-secret-key-32bytes-min!!' });
      // ignoreExpiration: 만료된 토큰이지만 디코딩은 가능해야 함
      const payload = jwt.verify(result.token, { ignoreExpiration: true }) as Record<
        string,
        unknown
      >;

      expect(payload.checkoutId).toBe('c1');
      expect(payload.purpose).toBe('borrower_receive');
      expect(payload.iss).toBe('test-auth-forge');
      expect(typeof payload.jti).toBe('string');
      // exp는 현재 시간보다 과거
      expect(payload.exp).toBeLessThan(Math.floor(Date.now() / 1000));
    });

    it('expSecondsAgo 미지정 시 기본 60초 전', async () => {
      const result = await controller.forgeHandoverToken({ checkoutId: 'c1' });

      const jwt = new JwtService({ secret: 'test-secret-key-32bytes-min!!' });
      const payload = jwt.verify(result.token, { ignoreExpiration: true }) as Record<
        string,
        unknown
      >;

      const nowSec = Math.floor(Date.now() / 1000);
      // exp는 약 60초 전 (±2초 허용)
      expect(nowSec - (payload.exp as number)).toBeGreaterThanOrEqual(58);
      expect(nowSec - (payload.exp as number)).toBeLessThanOrEqual(62);
    });
  });
});
