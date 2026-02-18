import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email.service';

// nodemailer 모킹
const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: (...args: [object]) => mockCreateTransport(...args),
}));

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;

  const baseConfig: Record<string, unknown> = {
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: 587,
    SMTP_SECURE: false,
    SMTP_USER: 'user@example.com',
    SMTP_PASSWORD: 'password123',
    SMTP_FROM: 'noreply@example.com',
  };

  beforeEach(async () => {
    mockSendMail.mockReset();
    mockCreateTransport.mockReset();
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });

    const mockGet = jest.fn((key: string) => baseConfig[key]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: { get: mockGet },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);
  });

  describe('SMTP 미설정 시 (SMTP_HOST 없음)', () => {
    beforeEach(() => {
      (configService.get as jest.Mock).mockImplementation((key: string) =>
        key === 'SMTP_HOST' ? undefined : baseConfig[key]
      );
    });

    it('이메일 발송을 건너뛰고 에러를 던지지 않는다', async () => {
      await expect(
        service.sendMail({ to: 'test@example.com', subject: '제목', html: '<p>내용</p>' })
      ).resolves.not.toThrow();

      expect(mockCreateTransport).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('두 번 호출해도 한 번만 초기화를 시도한다 (lazy init)', async () => {
      await service.sendMail({ to: 'a@b.com', subject: 's', html: 'h' });
      await service.sendMail({ to: 'c@d.com', subject: 's2', html: 'h2' });

      // SMTP_HOST 없으므로 transporter 생성 안 됨
      expect(mockCreateTransport).not.toHaveBeenCalled();
    });
  });

  describe('SMTP 설정 완료 시', () => {
    it('첫 번째 sendMail 호출 시 transporter를 생성한다 (lazy init)', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'msg-1' });

      await service.sendMail({
        to: 'recipient@example.com',
        subject: '테스트',
        html: '<p>테스트</p>',
      });

      expect(mockCreateTransport).toHaveBeenCalledTimes(1);
      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          auth: { user: 'user@example.com', pass: 'password123' },
        })
      );
    });

    it('두 번째 호출 시 transporter를 재생성하지 않는다', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'msg-1' });

      await service.sendMail({ to: 'a@b.com', subject: 's', html: 'h' });
      await service.sendMail({ to: 'c@d.com', subject: 's2', html: 'h2' });

      expect(mockCreateTransport).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it('단일 수신자에게 이메일을 발송한다', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'msg-1' });

      await service.sendMail({
        to: 'recipient@example.com',
        subject: '교정 기한 초과 알림',
        html: '<p>알림 내용</p>',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@example.com',
          to: 'recipient@example.com',
          subject: '교정 기한 초과 알림',
          html: '<p>알림 내용</p>',
        })
      );
    });

    it('복수 수신자에게 comma-join으로 발송한다', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'msg-1' });

      await service.sendMail({
        to: ['a@b.com', 'c@d.com', 'e@f.com'],
        subject: '일괄 알림',
        html: '<p>내용</p>',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'a@b.com, c@d.com, e@f.com',
        })
      );
    });

    it('SMTP_FROM 미설정 시 SMTP_USER를 from으로 사용한다', async () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'SMTP_FROM') return undefined;
        return baseConfig[key];
      });
      mockSendMail.mockResolvedValue({ messageId: 'msg-1' });

      await service.sendMail({ to: 'r@e.com', subject: 's', html: 'h' });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'user@example.com' })
      );
    });

    it('발송 실패 시 에러를 던지지 않는다 (fire-and-forget)', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));

      await expect(
        service.sendMail({ to: 'r@e.com', subject: 's', html: 'h' })
      ).resolves.not.toThrow();
    });

    it('SMTP_USER/PASSWORD 미설정 시 auth 없이 transporter 생성', async () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'SMTP_USER' || key === 'SMTP_PASSWORD') return undefined;
        return baseConfig[key];
      });
      mockSendMail.mockResolvedValue({ messageId: 'msg-1' });

      await service.sendMail({ to: 'r@e.com', subject: 's', html: 'h' });

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.not.objectContaining({ auth: expect.anything() })
      );
    });
  });
});
