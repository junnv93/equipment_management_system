import { Logger } from '@nestjs/common';
import { SecurityService } from '../security.service';
import type { NormalizedCspReport } from '../security.types';

const minimalReport: NormalizedCspReport = {
  reportShape: 'legacy',
  blockedUri: 'https://evil.com/script.js',
  violatedDirective: "script-src 'self'",
  documentUri: 'https://app.example.com/',
  rawPayload: { 'csp-report': {} },
  userAgent: 'test-browser',
  ipAddress: '127.0.0.1',
};

describe('SecurityService', () => {
  let service: SecurityService;
  let mockDb: { insert: jest.Mock };

  beforeEach(() => {
    mockDb = { insert: jest.fn() };
    service = new SecurityService(mockDb as never);
  });

  describe('saveReport()', () => {
    it('DB INSERT 정상 경로 — void 반환', async () => {
      const mockValues = jest.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue({ values: mockValues });

      await expect(service.saveReport(minimalReport)).resolves.toBeUndefined();
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          reportShape: minimalReport.reportShape,
          blockedUri: minimalReport.blockedUri,
          violatedDirective: minimalReport.violatedDirective,
        })
      );
    });

    it('DB 오류 발생 시 throw 없이 resolve — Logger.error 호출', async () => {
      const dbError = new Error('connection refused');
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockRejectedValue(dbError),
      });
      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      await expect(service.saveReport(minimalReport)).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith('CSP report persistence failed', dbError);

      errorSpy.mockRestore();
    });
  });
});
