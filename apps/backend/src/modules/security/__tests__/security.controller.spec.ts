import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SecurityController } from '../security.controller';

describe('SecurityController', () => {
  let controller: SecurityController;
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecurityController],
    }).compile();

    controller = module.get<SecurityController>(SecurityController);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('handleReport()', () => {
    it('Legacy report-uri 형식 파싱 — blocked-uri/violated-directive 구조적 로깅', () => {
      const legacyPayload = {
        'csp-report': {
          'blocked-uri': 'https://evil.com/script.js',
          'violated-directive': "script-src 'self'",
          'document-uri': 'https://app.example.com/dashboard',
          'source-file': 'https://app.example.com/main.js',
          'line-number': 42,
        },
      };

      controller.handleReport(legacyPayload);

      expect(warnSpy).toHaveBeenCalledWith('CSP violation (legacy)', {
        blockedUri: 'https://evil.com/script.js',
        violatedDirective: "script-src 'self'",
        documentUri: 'https://app.example.com/dashboard',
        sourceFile: 'https://app.example.com/main.js',
        lineNumber: 42,
      });
    });

    it('Reporting API 형식 파싱 — type=csp-violation + body 구조', () => {
      const modernPayload = [
        {
          type: 'csp-violation',
          body: {
            blockedURL: 'inline',
            effectiveDirective: 'script-src-elem',
            documentURL: 'https://app.example.com/',
            sourceFile: null,
            lineNumber: 0,
          },
        },
      ];

      controller.handleReport(modernPayload);

      expect(warnSpy).toHaveBeenCalledWith('CSP violation (reporting-api)', {
        blockedUrl: 'inline',
        effectiveDirective: 'script-src-elem',
        documentUrl: 'https://app.example.com/',
        sourceFile: null,
        lineNumber: 0,
      });
    });

    it('알 수 없는 형식 — 원본을 unknown shape로 로깅', () => {
      const unknownPayload = { foo: 'bar', unexpected: true };

      controller.handleReport(unknownPayload);

      expect(warnSpy).toHaveBeenCalledWith('CSP violation (unknown shape)', {
        entry: unknownPayload,
      });
    });

    it('배열 payload — 복수 report를 각각 개별 처리', () => {
      const batchPayload = [
        {
          'csp-report': {
            'blocked-uri': 'https://tracker.com/a.js',
            'violated-directive': "script-src 'self'",
          },
        },
        {
          type: 'csp-violation',
          body: {
            blockedURL: 'eval',
            effectiveDirective: 'script-src-elem',
          },
        },
      ];

      controller.handleReport(batchPayload);

      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledWith(
        'CSP violation (legacy)',
        expect.objectContaining({ blockedUri: 'https://tracker.com/a.js' })
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'CSP violation (reporting-api)',
        expect.objectContaining({ blockedUrl: 'eval' })
      );
    });

    it('빈 객체 payload — unknown shape로 로깅 (crash 없음)', () => {
      controller.handleReport({});
      expect(warnSpy).toHaveBeenCalledWith('CSP violation (unknown shape)', {
        entry: {},
      });
    });

    it('빈 배열 payload — 로깅 없음 (crash 없음)', () => {
      controller.handleReport([]);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
