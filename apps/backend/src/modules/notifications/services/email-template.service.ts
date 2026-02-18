import { Injectable } from '@nestjs/common';

interface CalibrationOverdueData {
  equipmentName: string;
  managementNumber: string;
  nextCalibrationDate: string;
  linkUrl: string;
}

interface CalibrationDueSoonData {
  equipmentName: string;
  managementNumber: string;
  daysLeft: number;
  dueDate: string;
  linkUrl: string;
}

interface CheckoutOverdueData {
  equipmentName: string;
  managementNumber: string;
  expectedReturnDate: string;
  checkoutId: string;
  linkUrl: string;
}

interface EmailContent {
  subject: string;
  html: string;
}

/**
 * 이메일 템플릿 서비스
 *
 * 테이블 기반 레이아웃으로 Outlook 호환 HTML 이메일을 생성한다.
 */
@Injectable()
export class EmailTemplateService {
  buildCalibrationOverdueEmail(data: CalibrationOverdueData): EmailContent {
    return {
      subject: `[교정 기한 초과] ${data.equipmentName} (${data.managementNumber})`,
      html: this.wrapLayout(
        '교정 기한 초과 알림',
        `
        <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.6;">
          다음 장비의 교정 기한이 초과되었습니다. 즉시 조치가 필요합니다.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:4px;">
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;width:140px;">장비명</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#333333;">${this.escapeHtml(data.equipmentName)}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;">관리번호</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#333333;">${this.escapeHtml(data.managementNumber)}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;font-weight:600;color:#374151;">교정 기한</td>
            <td style="padding:12px 16px;color:#dc2626;font-weight:600;">${this.escapeHtml(data.nextCalibrationDate)}</td>
          </tr>
        </table>
        ${this.buildCtaButton('장비 상세 보기', data.linkUrl)}
        `
      ),
    };
  }

  buildCalibrationDueSoonEmail(data: CalibrationDueSoonData): EmailContent {
    const urgencyColor = data.daysLeft <= 3 ? '#dc2626' : '#d97706';
    return {
      subject: `[교정 예정 D-${data.daysLeft}] ${data.equipmentName} (${data.managementNumber})`,
      html: this.wrapLayout(
        '교정 기한 사전 알림',
        `
        <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.6;">
          다음 장비의 교정 기한이 <strong style="color:${urgencyColor};">${data.daysLeft}일</strong> 후 도래합니다. 교정 일정을 확인해 주세요.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:4px;">
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;width:140px;">장비명</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#333333;">${this.escapeHtml(data.equipmentName)}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;">관리번호</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#333333;">${this.escapeHtml(data.managementNumber)}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;">남은 기간</td>
            <td style="padding:12px 16px;color:${urgencyColor};font-weight:600;">D-${data.daysLeft}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;font-weight:600;color:#374151;">교정 기한</td>
            <td style="padding:12px 16px;color:#333333;">${this.escapeHtml(data.dueDate)}</td>
          </tr>
        </table>
        ${this.buildCtaButton('장비 상세 보기', data.linkUrl)}
        `
      ),
    };
  }

  buildCheckoutOverdueEmail(data: CheckoutOverdueData): EmailContent {
    return {
      subject: `[반출 기한 초과] ${data.equipmentName} (${data.managementNumber})`,
      html: this.wrapLayout(
        '반출 기한 초과 알림',
        `
        <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.6;">
          다음 장비의 반출 반환 기한이 초과되었습니다. 반입 처리를 진행해 주세요.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:4px;">
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;width:140px;">장비명</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#333333;">${this.escapeHtml(data.equipmentName)}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;">관리번호</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#333333;">${this.escapeHtml(data.managementNumber)}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;">반출 ID</td>
            <td style="padding:12px 16px;color:#333333;">${this.escapeHtml(data.checkoutId)}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;font-weight:600;color:#374151;">반환 예정일</td>
            <td style="padding:12px 16px;color:#dc2626;font-weight:600;">${this.escapeHtml(data.expectedReturnDate)}</td>
          </tr>
        </table>
        ${this.buildCtaButton('반출 상세 보기', data.linkUrl)}
        `
      ),
    };
  }

  /**
   * HTML 특수문자 이스케이프 (XSS 방지)
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * CTA 버튼 HTML
   */
  private buildCtaButton(label: string, url: string): string {
    return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
      <tr>
        <td align="center" style="background-color:#1e40af;border-radius:6px;">
          <a href="${this.escapeHtml(url)}" target="_blank" style="display:inline-block;padding:12px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:'Malgun Gothic','맑은 고딕',sans-serif;">
            ${this.escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
  }

  /**
   * 공통 이메일 레이아웃 (테이블 기반, Outlook 호환)
   */
  private wrapLayout(title: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Malgun Gothic','맑은 고딕',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1e40af;padding:24px 32px;border-radius:8px 8px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">
                ${this.escapeHtml(title)}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:16px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.5;">
                본 메일은 장비 관리 시스템에서 자동 발송된 메일입니다.<br>
                문의사항은 시스템 관리자에게 연락해 주세요.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
