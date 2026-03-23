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

  describe('buildCalibrationOverdueBatchEmail', () => {
    const items = [
      { equipmentName: '멀티미터 A', managementNumber: 'SUW-E0001', dueDate: '2025-01-01' },
      { equipmentName: '오실로스코프 B', managementNumber: 'UIW-E0002', dueDate: '2025-01-03' },
    ];

    it('제목에 건수가 포함된다', () => {
      const { subject } = service.buildCalibrationOverdueBatchEmail(items);
      expect(subject).toContain('2건');
      expect(subject).toContain('교정 기한 초과');
    });

    it('1건이어도 동일한 템플릿을 사용한다', () => {
      const { subject } = service.buildCalibrationOverdueBatchEmail([items[0]]);
      expect(subject).toContain('1건');
    });

    it('HTML에 모든 장비 정보가 테이블로 포함된다', () => {
      const { html } = service.buildCalibrationOverdueBatchEmail(items);
      expect(html).toContain('멀티미터 A');
      expect(html).toContain('SUW-E0001');
      expect(html).toContain('오실로스코프 B');
      expect(html).toContain('UIW-E0002');
    });

    it('교정 기한이 빨간색(dc2626)으로 표시된다', () => {
      const { html } = service.buildCalibrationOverdueBatchEmail(items);
      expect(html).toContain('#dc2626');
    });

    it('URL/버튼이 포함되지 않는다 (피싱 방지)', () => {
      const { html } = service.buildCalibrationOverdueBatchEmail(items);
      expect(html).not.toContain('<a href');
      expect(html).not.toContain('https://');
    });

    it('시스템 안내 문구가 포함된다', () => {
      const { html } = service.buildCalibrationOverdueBatchEmail(items);
      expect(html).toContain('장비 관리 시스템에 접속하여 확인');
    });

    it('XSS: 특수문자를 이스케이프한다', () => {
      const { html } = service.buildCalibrationOverdueBatchEmail([
        {
          equipmentName: '<script>alert("xss")</script>',
          managementNumber: '&test<>',
          dueDate: '2025-01-01',
        },
      ]);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&amp;test');
    });
  });

  describe('buildCalibrationDueSoonBatchEmail', () => {
    const items = [
      {
        equipmentName: '오실로스코프 B',
        managementNumber: 'UIW-E0002',
        daysLeft: 7,
        dueDate: '2025-02-01',
      },
      {
        equipmentName: '파워미터 C',
        managementNumber: 'PYT-E0003',
        daysLeft: 3,
        dueDate: '2025-01-28',
      },
    ];

    it('제목에 건수와 최소 D-day가 포함된다', () => {
      const { subject } = service.buildCalibrationDueSoonBatchEmail(items);
      expect(subject).toContain('2건');
      expect(subject).toContain('D-3');
    });

    it('daysLeft <= 3 시 빨간색(dc2626) 긴급 색상을 사용한다', () => {
      const { html } = service.buildCalibrationDueSoonBatchEmail(items);
      expect(html).toContain('#dc2626'); // daysLeft: 3
    });

    it('daysLeft > 3 시 노란색(d97706) 경고 색상을 사용한다', () => {
      const { html } = service.buildCalibrationDueSoonBatchEmail(items);
      expect(html).toContain('#d97706'); // daysLeft: 7
    });

    it('모든 장비가 테이블에 포함된다', () => {
      const { html } = service.buildCalibrationDueSoonBatchEmail(items);
      expect(html).toContain('오실로스코프 B');
      expect(html).toContain('파워미터 C');
      expect(html).toContain('D-7');
      expect(html).toContain('D-3');
    });

    it('URL/버튼이 포함되지 않는다 (피싱 방지)', () => {
      const { html } = service.buildCalibrationDueSoonBatchEmail(items);
      expect(html).not.toContain('<a href');
    });
  });

  describe('buildCheckoutOverdueBatchEmail', () => {
    const items = [
      {
        equipmentName: '스펙트럼 분석기 C',
        managementNumber: 'PYT-E0003',
        expectedReturnDate: '2025-01-15',
      },
    ];

    it('제목에 반출 기한 초과 건수가 포함된다', () => {
      const { subject } = service.buildCheckoutOverdueBatchEmail(items);
      expect(subject).toContain('반출 기한 초과');
      expect(subject).toContain('1건');
    });

    it('HTML에 반환 예정일이 빨간색으로 표시된다', () => {
      const { html } = service.buildCheckoutOverdueBatchEmail(items);
      expect(html).toContain('2025-01-15');
      expect(html).toContain('#dc2626');
    });

    it('URL/버튼이 포함되지 않는다 (피싱 방지)', () => {
      const { html } = service.buildCheckoutOverdueBatchEmail(items);
      expect(html).not.toContain('<a href');
      expect(html).not.toContain('https://');
    });
  });

  describe('공통 레이아웃', () => {
    it('모든 이메일에 푸터 안내문이 포함된다', () => {
      const { html } = service.buildCalibrationOverdueBatchEmail([
        { equipmentName: 'E', managementNumber: 'M', dueDate: '2025-01-01' },
      ]);
      expect(html).toContain('장비 관리 시스템에서 자동 발송');
    });

    it('이메일 헤더에 navy 배경(1e40af)이 적용된다', () => {
      const { html } = service.buildCalibrationOverdueBatchEmail([
        { equipmentName: 'E', managementNumber: 'M', dueDate: '2025-01-01' },
      ]);
      expect(html).toContain('#1e40af');
    });

    it('한국어 폰트(Malgun Gothic)가 지정된다', () => {
      const { html } = service.buildCalibrationOverdueBatchEmail([
        { equipmentName: 'E', managementNumber: 'M', dueDate: '2025-01-01' },
      ]);
      expect(html).toContain('Malgun Gothic');
    });

    it('Outlook 호환 table 기반 레이아웃을 포함한다', () => {
      const { html } = service.buildCalibrationOverdueBatchEmail([
        { equipmentName: 'E', managementNumber: 'M', dueDate: '2025-01-01' },
      ]);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<table');
      expect(html).toContain('max-width:600px');
    });
  });
});
