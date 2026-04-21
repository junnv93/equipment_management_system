import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import type { Request } from 'express';
import { SecurityController } from '../security.controller';
import { SecurityService } from '../security.service';

const mockReq = {
  headers: { 'user-agent': 'test-browser' },
  socket: { remoteAddress: '127.0.0.1' },
} as unknown as Request;

const mockSecurityService = { saveReport: jest.fn().mockResolvedValue(undefined) };

describe('SecurityController', () => {
  let controller: SecurityController;
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecurityController],
      providers: [{ provide: SecurityService, useValue: mockSecurityService }],
    }).compile();

    controller = module.get<SecurityController>(SecurityController);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.clearAllMocks();
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

      controller.handleReport(legacyPayload, mockReq);

      expect(warnSpy).toHaveBeenCalledWith('CSP violation (legacy)', {
        blockedUri: 'https://evil.com/script.js',
        violatedDirective: "script-src 'self'",
      });
      expect(mockSecurityService.saveReport).toHaveBeenCalledWith(
        expect.objectContaining({ reportShape: 'legacy', blockedUri: 'https://evil.com/script.js' })
      );
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

      controller.handleReport(modernPayload, mockReq);

      expect(warnSpy).toHaveBeenCalledWith('CSP violation (reporting-api)', {
        blockedUri: 'inline',
        violatedDirective: 'script-src-elem',
      });
      expect(mockSecurityService.saveReport).toHaveBeenCalledWith(
        expect.objectContaining({ reportShape: 'reporting-api', blockedUri: 'inline' })
      );
    });

    it('알 수 없는 형식 — 원본을 unknown shape로 로깅', () => {
      const unknownPayload = { foo: 'bar', unexpected: true };

      controller.handleReport(unknownPayload, mockReq);

      expect(warnSpy).toHaveBeenCalledWith('CSP violation (unknown shape)', {
        entry: unknownPayload,
      });
      expect(mockSecurityService.saveReport).toHaveBeenCalledWith(
        expect.objectContaining({ reportShape: 'unknown' })
      );
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

      controller.handleReport(batchPayload, mockReq);

      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledWith(
        'CSP violation (legacy)',
        expect.objectContaining({ blockedUri: 'https://tracker.com/a.js' })
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'CSP violation (reporting-api)',
        expect.objectContaining({ blockedUri: 'eval' })
      );
    });

    it('빈 객체 payload — unknown shape로 로깅 (crash 없음)', () => {
      controller.handleReport({}, mockReq);
      expect(warnSpy).toHaveBeenCalledWith('CSP violation (unknown shape)', {
        entry: {},
      });
    });

    it('빈 배열 payload — 로깅 없음 (crash 없음)', () => {
      controller.handleReport([], mockReq);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('Legacy lineNumber — 숫자/숫자문자열은 integer로, 비숫자 문자열은 undefined로 파싱', () => {
      // 숫자 그대로
      controller.handleReport(
        { 'csp-report': { 'blocked-uri': 'x', 'violated-directive': 'y', 'line-number': 42 } },
        mockReq
      );
      expect(mockSecurityService.saveReport).toHaveBeenCalledWith(
        expect.objectContaining({ lineNumber: 42 })
      );

      jest.clearAllMocks();

      // Firefox 112↓ 등 일부 브라우저가 string으로 전송하는 케이스
      controller.handleReport(
        { 'csp-report': { 'blocked-uri': 'x', 'violated-directive': 'y', 'line-number': '42' } },
        mockReq
      );
      expect(mockSecurityService.saveReport).toHaveBeenCalledWith(
        expect.objectContaining({ lineNumber: 42 })
      );

      jest.clearAllMocks();

      // 비숫자 문자열 → undefined (데이터 손실 없이 명시적 처리)
      controller.handleReport(
        {
          'csp-report': {
            'blocked-uri': 'x',
            'violated-directive': 'y',
            'line-number': 'NaN-string',
          },
        },
        mockReq
      );
      expect(mockSecurityService.saveReport).toHaveBeenCalledWith(
        expect.objectContaining({ lineNumber: undefined })
      );
    });

    it('Reporting API lineNumber — 숫자 0은 0으로, null은 undefined로 파싱', () => {
      controller.handleReport(
        [
          {
            type: 'csp-violation',
            body: { blockedURL: 'inline', effectiveDirective: 'script-src-elem', lineNumber: 0 },
          },
        ],
        mockReq
      );
      expect(mockSecurityService.saveReport).toHaveBeenCalledWith(
        expect.objectContaining({ lineNumber: 0 })
      );

      jest.clearAllMocks();

      controller.handleReport(
        [
          {
            type: 'csp-violation',
            body: { blockedURL: 'inline', effectiveDirective: 'script-src-elem', lineNumber: null },
          },
        ],
        mockReq
      );
      expect(mockSecurityService.saveReport).toHaveBeenCalledWith(
        expect.objectContaining({ lineNumber: undefined })
      );
    });
  });
});
