import { Injectable } from '@nestjs/common';
import type { EmailContent } from '../config/notification-registry';
import { CALIBRATION_THRESHOLDS } from '@equipment-management/shared-constants';

/** 배치 이메일에 포함될 개별 장비 정보 */
export interface OverdueEquipmentItem {
  equipmentName: string;
  managementNumber: string;
  dueDate: string;
}

/** 배치 이메일에 포함될 개별 반출 정보 */
export interface OverdueCheckoutItem {
  equipmentName: string;
  managementNumber: string;
  expectedReturnDate: string;
}

/** 교정 예정 장비 정보 */
export interface CalibrationDueSoonItem {
  equipmentName: string;
  managementNumber: string;
  daysLeft: number;
  dueDate: string;
}

/**
 * 이메일 템플릿 서비스
 *
 * 보안 원칙: 이메일에 URL/버튼을 포함하지 않는다 (피싱 방지).
 * 배치 원칙: 같은 유형의 다건 알림은 1통으로 요약한다.
 * 테이블 기반 레이아웃으로 Outlook 호환 HTML 이메일을 생성한다.
 */
@Injectable()
export class EmailTemplateService {
  /**
   * 교정 기한 초과 배치 이메일
   *
   * 여러 장비의 교정 기한 초과를 하나의 요약 테이블로 표시.
   * 1건이든 N건이든 동일한 템플릿 사용 (단수/복수 문구 자동 처리).
   */
  buildCalibrationOverdueBatchEmail(items: OverdueEquipmentItem[]): EmailContent {
    const count = items.length;
    return {
      subject: `[교정 기한 초과] ${count}건의 장비에 즉시 조치가 필요합니다`,
      html: this.wrapLayout(
        '교정 기한 초과 알림',
        `
        <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.6;">
          다음 <strong>${count}건</strong>의 장비에서 교정 기한이 초과되었습니다.<br>
          즉시 조치가 필요합니다.
        </p>
        ${this.buildEquipmentTable(
          ['장비명', '관리번호', '교정 기한'],
          items.map((item) => [
            this.escapeHtml(item.equipmentName),
            this.escapeHtml(item.managementNumber),
            `<span style="color:#dc2626;font-weight:600;">${this.escapeHtml(item.dueDate)}</span>`,
          ])
        )}
        ${this.buildSystemGuide()}
        `
      ),
    };
  }

  /**
   * 교정 예정 사전 알림 배치 이메일
   *
   * D-day별 긴급도 색상 자동 적용.
   */
  buildCalibrationDueSoonBatchEmail(items: CalibrationDueSoonItem[]): EmailContent {
    const count = items.length;
    const minDays = Math.min(...items.map((i) => i.daysLeft));
    return {
      subject: `[교정 예정] ${count}건의 장비 교정이 곧 도래합니다 (최소 D-${minDays})`,
      html: this.wrapLayout(
        '교정 기한 사전 알림',
        `
        <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.6;">
          다음 <strong>${count}건</strong>의 장비 교정 기한이 곧 도래합니다.<br>
          교정 일정을 확인해 주세요.
        </p>
        ${this.buildEquipmentTable(
          ['장비명', '관리번호', '남은 기간', '교정 기한'],
          items.map((item) => {
            const urgencyColor =
              item.daysLeft <= CALIBRATION_THRESHOLDS.URGENT_DAYS ? '#dc2626' : '#d97706';
            return [
              this.escapeHtml(item.equipmentName),
              this.escapeHtml(item.managementNumber),
              `<span style="color:${urgencyColor};font-weight:600;">D-${item.daysLeft}</span>`,
              this.escapeHtml(item.dueDate),
            ];
          })
        )}
        ${this.buildSystemGuide()}
        `
      ),
    };
  }

  /**
   * 반출 기한 초과 배치 이메일
   */
  buildCheckoutOverdueBatchEmail(items: OverdueCheckoutItem[]): EmailContent {
    const count = items.length;
    return {
      subject: `[반출 기한 초과] ${count}건의 반출 반환 기한이 초과되었습니다`,
      html: this.wrapLayout(
        '반출 기한 초과 알림',
        `
        <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.6;">
          다음 <strong>${count}건</strong>의 장비 반출 반환 기한이 초과되었습니다.<br>
          반입 처리를 진행해 주세요.
        </p>
        ${this.buildEquipmentTable(
          ['장비명', '관리번호', '반환 예정일'],
          items.map((item) => [
            this.escapeHtml(item.equipmentName),
            this.escapeHtml(item.managementNumber),
            `<span style="color:#dc2626;font-weight:600;">${this.escapeHtml(item.expectedReturnDate)}</span>`,
          ])
        )}
        ${this.buildSystemGuide()}
        `
      ),
    };
  }

  /**
   * 즉시 이메일 (승인 요청/결과)
   *
   * 레지스트리의 titleTemplate/contentTemplate 렌더링 결과를 이메일로 변환.
   * 별도 빌더 없이 모든 immediate 이벤트에 범용으로 사용.
   */
  buildImmediateEmail(title: string, content: string): EmailContent {
    return {
      subject: `[알림] ${title}`,
      html: this.wrapLayout(
        title,
        `
        <p style="margin:0 0 20px;color:#333333;font-size:15px;line-height:1.6;">
          ${this.escapeHtml(content)}
        </p>
        ${this.buildSystemGuide('장비 관리 시스템에 접속하여 확인 및 처리를 진행해 주세요.')}
        `
      ),
    };
  }

  /**
   * 일간 다이제스트 이메일
   *
   * 여러 섹션(교정 초과, 교정 예정, 반출 초과)을 하나의 이메일로 통합.
   * 해당 없는 섹션은 자동으로 생략.
   */
  buildDailyDigestEmail(
    date: string,
    sections: {
      calibrationOverdue?: OverdueEquipmentItem[];
      calibrationDueSoon?: CalibrationDueSoonItem[];
      checkoutOverdue?: OverdueCheckoutItem[];
    }
  ): EmailContent {
    const parts: string[] = [];

    if (sections.calibrationOverdue && sections.calibrationOverdue.length > 0) {
      parts.push(`
        <h2 style="margin:0 0 12px;color:#dc2626;font-size:16px;font-weight:700;">교정 기한 초과 (${sections.calibrationOverdue.length}건)</h2>
        ${this.buildEquipmentTable(
          ['장비명', '관리번호', '교정 기한'],
          sections.calibrationOverdue.map((item) => [
            this.escapeHtml(item.equipmentName),
            this.escapeHtml(item.managementNumber),
            `<span style="color:#dc2626;font-weight:600;">${this.escapeHtml(item.dueDate)}</span>`,
          ])
        )}
      `);
    }

    if (sections.calibrationDueSoon && sections.calibrationDueSoon.length > 0) {
      parts.push(`
        <h2 style="margin:0 0 12px;color:#d97706;font-size:16px;font-weight:700;">교정 예정 (${sections.calibrationDueSoon.length}건)</h2>
        ${this.buildEquipmentTable(
          ['장비명', '관리번호', '남은 기간', '교정 기한'],
          sections.calibrationDueSoon.map((item) => {
            const urgencyColor =
              item.daysLeft <= CALIBRATION_THRESHOLDS.URGENT_DAYS ? '#dc2626' : '#d97706';
            return [
              this.escapeHtml(item.equipmentName),
              this.escapeHtml(item.managementNumber),
              `<span style="color:${urgencyColor};font-weight:600;">D-${item.daysLeft}</span>`,
              this.escapeHtml(item.dueDate),
            ];
          })
        )}
      `);
    }

    if (sections.checkoutOverdue && sections.checkoutOverdue.length > 0) {
      parts.push(`
        <h2 style="margin:0 0 12px;color:#dc2626;font-size:16px;font-weight:700;">반출 기한 초과 (${sections.checkoutOverdue.length}건)</h2>
        ${this.buildEquipmentTable(
          ['장비명', '관리번호', '반환 예정일'],
          sections.checkoutOverdue.map((item) => [
            this.escapeHtml(item.equipmentName),
            this.escapeHtml(item.managementNumber),
            `<span style="color:#dc2626;font-weight:600;">${this.escapeHtml(item.expectedReturnDate)}</span>`,
          ])
        )}
      `);
    }

    const totalCount =
      (sections.calibrationOverdue?.length ?? 0) +
      (sections.calibrationDueSoon?.length ?? 0) +
      (sections.checkoutOverdue?.length ?? 0);

    return {
      subject: `[장비 관리 일간 리포트] ${date} — ${totalCount}건 확인 필요`,
      html: this.wrapLayout(
        `장비 관리 일간 리포트 — ${this.escapeHtml(date)}`,
        `
        ${parts.join('<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">')}
        ${this.buildSystemGuide('장비 관리 시스템에 접속하여 확인 및 조치를 진행해 주세요.')}
        `
      ),
    };
  }

  /**
   * HTML 특수문자 이스케이프 (XSS 방지)
   */
  escapeHtml(text: string): string {
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
   * 다건 장비 요약 테이블 (Outlook 호환)
   */
  private buildEquipmentTable(headers: string[], rows: string[][]): string {
    const headerCells = headers
      .map(
        (h) =>
          `<td style="padding:10px 12px;background-color:#1e40af;color:#ffffff;font-weight:600;font-size:13px;border-bottom:2px solid #1e3a8a;">${h}</td>`
      )
      .join('');

    const dataRows = rows
      .map(
        (cells, idx) =>
          `<tr>${cells
            .map(
              (c) =>
                `<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#333333;font-size:14px;${idx % 2 === 1 ? 'background-color:#f9fafb;' : ''}">${c}</td>`
            )
            .join('')}</tr>`
      )
      .join('');

    return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:4px;border-collapse:collapse;">
      <tr>${headerCells}</tr>
      ${dataRows}
    </table>`;
  }

  /**
   * 시스템 안내 문구 (URL/버튼 대체)
   *
   * 보안: 피싱 방지를 위해 이메일에 링크를 포함하지 않는다.
   * 사용자가 직접 시스템에 접속하여 처리하도록 안내.
   */
  private buildSystemGuide(
    message = '장비 관리 시스템에 접속하여 확인 및 조치를 진행해 주세요.'
  ): string {
    return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
      <tr>
        <td style="padding:16px;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;">
          <p style="margin:0;color:#1e40af;font-size:14px;line-height:1.6;font-weight:500;">
            ${this.escapeHtml(message)}
          </p>
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
