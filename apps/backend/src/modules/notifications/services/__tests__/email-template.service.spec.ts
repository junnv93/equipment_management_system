import { Test, TestingModule } from '@nestjs/testing';
import { EmailTemplateService } from '../email-template.service';

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailTemplateService],
    }).compile();

    service = module.get<EmailTemplateService>(EmailTemplateService);
  });

  describe('buildCalibrationOverdueEmail', () => {
    const data = {
      equipmentName: '멀티미터 A',
      managementNumber: 'SUW-E0001',
      nextCalibrationDate: '2025-01-01',
      linkUrl: 'https://example.com/equipment/1',
    };

    it('제목에 장비명과 관리번호가 포함된다', () => {
      const { subject } = service.buildCalibrationOverdueEmail(data);
      expect(subject).toContain('교정 기한 초과');
      expect(subject).toContain('멀티미터 A');
      expect(subject).toContain('SUW-E0001');
    });

    it('HTML에 장비 정보 테이블이 포함된다', () => {
      const { html } = service.buildCalibrationOverdueEmail(data);
      expect(html).toContain('멀티미터 A');
      expect(html).toContain('SUW-E0001');
      expect(html).toContain('2025-01-01');
    });

    it('CTA 버튼에 linkUrl이 포함된다', () => {
      const { html } = service.buildCalibrationOverdueEmail(data);
      expect(html).toContain('https://example.com/equipment/1');
      expect(html).toContain('장비 상세 보기');
    });

    it('교정 기한 초과 색상(dc2626 빨간색)이 포함된다', () => {
      const { html } = service.buildCalibrationOverdueEmail(data);
      expect(html).toContain('#dc2626');
    });

    it('Outlook 호환 table 기반 레이아웃을 포함한다', () => {
      const { html } = service.buildCalibrationOverdueEmail(data);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<table');
      expect(html).toContain('max-width:600px');
    });

    it('XSS: 특수문자를 이스케이프한다', () => {
      const { html } = service.buildCalibrationOverdueEmail({
        ...data,
        equipmentName: '<script>alert("xss")</script>',
        managementNumber: '&test<>',
      });
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&amp;test');
    });
  });

  describe('buildCalibrationDueSoonEmail', () => {
    const baseData = {
      equipmentName: '오실로스코프 B',
      managementNumber: 'UIW-E0002',
      daysLeft: 7,
      dueDate: '2025-02-01',
      linkUrl: 'https://example.com/equipment/2',
    };

    it('제목에 D-day가 포함된다', () => {
      const { subject } = service.buildCalibrationDueSoonEmail(baseData);
      expect(subject).toContain('D-7');
      expect(subject).toContain('오실로스코프 B');
    });

    it('HTML에 남은 일수가 표시된다', () => {
      const { html } = service.buildCalibrationDueSoonEmail(baseData);
      expect(html).toContain('D-7');
    });

    it('daysLeft <= 3 시 빨간색(dc2626) 긴급 색상을 사용한다', () => {
      const { html } = service.buildCalibrationDueSoonEmail({ ...baseData, daysLeft: 3 });
      expect(html).toContain('#dc2626');
    });

    it('daysLeft > 3 시 노란색(d97706) 경고 색상을 사용한다', () => {
      const { html } = service.buildCalibrationDueSoonEmail({ ...baseData, daysLeft: 7 });
      expect(html).toContain('#d97706');
    });

    it('dueDate가 HTML에 포함된다', () => {
      const { html } = service.buildCalibrationDueSoonEmail(baseData);
      expect(html).toContain('2025-02-01');
    });

    it('XSS: linkUrl 특수문자를 이스케이프한다', () => {
      const { html } = service.buildCalibrationDueSoonEmail({
        ...baseData,
        linkUrl: 'javascript:alert("xss")',
      });
      expect(html).not.toContain('javascript:alert("xss")');
      expect(html).toContain('javascript:alert(&quot;xss&quot;)');
    });
  });

  describe('buildCheckoutOverdueEmail', () => {
    const data = {
      equipmentName: '스펙트럼 분석기 C',
      managementNumber: 'PYT-E0003',
      expectedReturnDate: '2025-01-15',
      checkoutId: 'checkout-uuid-001',
      linkUrl: 'https://example.com/checkouts/001',
    };

    it('제목에 반출 기한 초과가 포함된다', () => {
      const { subject } = service.buildCheckoutOverdueEmail(data);
      expect(subject).toContain('반출 기한 초과');
      expect(subject).toContain('스펙트럼 분석기 C');
    });

    it('HTML에 반환 예정일이 빨간색으로 표시된다', () => {
      const { html } = service.buildCheckoutOverdueEmail(data);
      expect(html).toContain('2025-01-15');
      expect(html).toContain('#dc2626');
    });

    it('HTML에 반출 ID가 포함된다', () => {
      const { html } = service.buildCheckoutOverdueEmail(data);
      expect(html).toContain('checkout-uuid-001');
    });

    it('CTA 버튼 텍스트가 반출 상세 보기이다', () => {
      const { html } = service.buildCheckoutOverdueEmail(data);
      expect(html).toContain('반출 상세 보기');
    });
  });

  describe('공통 레이아웃 (wrapLayout)', () => {
    it('모든 이메일에 푸터 안내문이 포함된다', () => {
      const { html } = service.buildCalibrationOverdueEmail({
        equipmentName: 'E',
        managementNumber: 'M',
        nextCalibrationDate: '2025-01-01',
        linkUrl: 'https://example.com',
      });
      expect(html).toContain('장비 관리 시스템에서 자동 발송');
    });

    it('이메일 헤더에 navy 배경(1e40af)이 적용된다', () => {
      const { html } = service.buildCalibrationOverdueEmail({
        equipmentName: 'E',
        managementNumber: 'M',
        nextCalibrationDate: '2025-01-01',
        linkUrl: 'https://example.com',
      });
      expect(html).toContain('#1e40af');
    });

    it('한국어 폰트(Malgun Gothic)가 지정된다', () => {
      const { html } = service.buildCalibrationOverdueEmail({
        equipmentName: 'E',
        managementNumber: 'M',
        nextCalibrationDate: '2025-01-01',
        linkUrl: 'https://example.com',
      });
      expect(html).toContain('Malgun Gothic');
    });
  });
});
