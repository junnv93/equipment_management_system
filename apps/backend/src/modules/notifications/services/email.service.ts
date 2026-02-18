import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * 이메일 발송 서비스
 *
 * SMTP 설정이 없으면 graceful skip (warn 로그).
 * Transporter는 lazy 초기화 (첫 번째 sendMail 호출 시).
 * 에러는 throw하지 않고 error 로그만 출력 (fire-and-forget).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Lazy 초기화: 첫 sendMail 호출 시 transporter 생성
   */
  private initTransporter(): boolean {
    if (this.initialized) return this.transporter !== null;

    this.initialized = true;

    const host = this.configService.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP_HOST가 설정되지 않았습니다. 이메일 발송이 비활성화됩니다.');
      return false;
    }

    const port = this.configService.get<number>('SMTP_PORT') ?? 587;
    const secure = this.configService.get<boolean>('SMTP_SECURE') ?? false;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });

    this.logger.log(`이메일 서비스 초기화 완료 (host=${host}, port=${port}, secure=${secure})`);
    return true;
  }

  /**
   * 이메일 발송 (fire-and-forget)
   *
   * SMTP 미설정 시 warn 로그 후 즉시 return.
   * 발송 실패 시 error 로그만 출력, throw하지 않음.
   */
  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.initTransporter()) {
      return;
    }

    const from =
      this.configService.get<string>('SMTP_FROM') ?? this.configService.get<string>('SMTP_USER');
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    try {
      await this.transporter!.sendMail({
        from,
        to: recipients,
        subject: options.subject,
        html: options.html,
        ...(options.text ? { text: options.text } : {}),
      });

      this.logger.log(`이메일 발송 성공: to=${recipients}, subject="${options.subject}"`);
    } catch (error) {
      this.logger.error(
        `이메일 발송 실패: to=${recipients}, subject="${options.subject}"`,
        error instanceof Error ? error.stack : String(error)
      );
    }
  }
}
