import { HistoryValidatorService } from '../services/history-validator.service';
import type { MappedRow } from '../types/data-migration.types';

// 공통 더미 MappedRow 생성 헬퍼
function makeMappedRow(rowNumber: number, data: Record<string, unknown>): MappedRow {
  return { rowNumber, mappedData: data, unmappedColumns: [] };
}

const VALID_MGMT_NUMBERS = new Set(['SUW-E0001', 'SUW-E0002']);

describe('HistoryValidatorService', () => {
  let service: HistoryValidatorService;

  beforeEach(() => {
    service = new HistoryValidatorService();
  });

  // ─── validateCalibrationBatch ─────────────────────────────────────────────

  describe('validateCalibrationBatch()', () => {
    it('유효한 교정 행은 valid 상태를 반환한다', () => {
      const rows = [
        makeMappedRow(2, {
          managementNumber: 'SUW-E0001',
          calibrationDate: new Date('2024-01-15'),
          agencyName: '한국교정',
          certificateNumber: 'CERT-001',
        }),
      ];

      const result = service.validateCalibrationBatch(rows, VALID_MGMT_NUMBERS);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('valid');
      expect(result[0].errors).toHaveLength(0);
    });

    it('managementNumber가 없으면 error 상태를 반환한다', () => {
      const rows = [
        makeMappedRow(2, {
          calibrationDate: new Date('2024-01-15'),
        }),
      ];

      const result = service.validateCalibrationBatch(rows, VALID_MGMT_NUMBERS);

      expect(result[0].status).toBe('error');
      expect(result[0].errors.length).toBeGreaterThan(0);
    });

    it('calibrationDate가 없으면 error 상태를 반환한다', () => {
      const rows = [
        makeMappedRow(2, {
          managementNumber: 'SUW-E0001',
          // calibrationDate 누락
        }),
      ];

      const result = service.validateCalibrationBatch(rows, VALID_MGMT_NUMBERS);

      expect(result[0].status).toBe('error');
    });

    it('장비 시트에 없는 관리번호는 warning을 포함한다', () => {
      const rows = [
        makeMappedRow(2, {
          managementNumber: 'UNKNOWN-001',
          calibrationDate: new Date('2024-01-15'),
        }),
      ];

      const result = service.validateCalibrationBatch(rows, VALID_MGMT_NUMBERS);

      // 경고 상태 또는 warnings에 메시지 포함
      const hasWarning =
        result[0].status === 'warning' || result[0].warnings.some((w) => w.includes('UNKNOWN-001'));
      expect(hasWarning).toBe(true);
    });

    it('빈 validManagementNumbers Set이면 크로스 검증을 건너뛴다', () => {
      const rows = [
        makeMappedRow(2, {
          managementNumber: 'UNKNOWN-001',
          calibrationDate: new Date('2024-01-15'),
        }),
      ];

      // 빈 Set: 크로스시트 검증 건너뜀 → 경고 없이 valid
      const result = service.validateCalibrationBatch(rows, new Set());

      expect(result[0].warnings).toHaveLength(0);
      expect(result[0].status).toBe('valid');
    });
  });

  // ─── validateRepairBatch ──────────────────────────────────────────────────

  describe('validateRepairBatch()', () => {
    it('유효한 수리 행은 valid 상태를 반환한다', () => {
      const rows = [
        makeMappedRow(2, {
          managementNumber: 'SUW-E0001',
          repairDate: new Date('2024-02-10'),
          repairDescription: '센서 교체',
          repairResult: 'completed',
        }),
      ];

      const result = service.validateRepairBatch(rows, VALID_MGMT_NUMBERS);

      expect(result[0].status).toBe('valid');
      expect(result[0].errors).toHaveLength(0);
    });

    it('repairDescription이 없으면 error 상태를 반환한다', () => {
      const rows = [
        makeMappedRow(2, {
          managementNumber: 'SUW-E0001',
          repairDate: new Date('2024-02-10'),
          // repairDescription 누락
        }),
      ];

      const result = service.validateRepairBatch(rows, VALID_MGMT_NUMBERS);

      expect(result[0].status).toBe('error');
    });

    it('repairDate가 없으면 error 상태를 반환한다', () => {
      const rows = [
        makeMappedRow(2, {
          managementNumber: 'SUW-E0001',
          repairDescription: '수리 내용',
          // repairDate 누락
        }),
      ];

      const result = service.validateRepairBatch(rows, VALID_MGMT_NUMBERS);

      expect(result[0].status).toBe('error');
    });

    it('여러 행 중 일부만 유효한 경우 각각 독립적으로 검증한다', () => {
      const rows = [
        makeMappedRow(2, {
          managementNumber: 'SUW-E0001',
          repairDate: new Date('2024-02-10'),
          repairDescription: '정상 수리',
        }),
        makeMappedRow(3, {
          // 필수 필드 누락
          managementNumber: 'SUW-E0002',
        }),
      ];

      const result = service.validateRepairBatch(rows, VALID_MGMT_NUMBERS);

      expect(result[0].status).toBe('valid');
      expect(result[1].status).toBe('error');
    });
  });

  // ─── validateIncidentBatch ────────────────────────────────────────────────

  describe('validateIncidentBatch()', () => {
    it('유효한 사고 행은 valid 상태를 반환한다', () => {
      const rows = [
        makeMappedRow(2, {
          managementNumber: 'SUW-E0001',
          occurredAt: new Date('2024-03-01'),
          incidentType: 'damage',
          content: '장비 파손',
        }),
      ];

      const result = service.validateIncidentBatch(rows, VALID_MGMT_NUMBERS);

      expect(result[0].status).toBe('valid');
    });

    it('잘못된 incidentType은 error 상태를 반환한다', () => {
      const rows = [
        makeMappedRow(2, {
          managementNumber: 'SUW-E0001',
          occurredAt: new Date('2024-03-01'),
          incidentType: 'INVALID_TYPE',
          content: '장비 파손',
        }),
      ];

      const result = service.validateIncidentBatch(rows, VALID_MGMT_NUMBERS);

      expect(result[0].status).toBe('error');
    });

    it('content가 없으면 error 상태를 반환한다', () => {
      const rows = [
        makeMappedRow(2, {
          managementNumber: 'SUW-E0001',
          occurredAt: new Date('2024-03-01'),
          incidentType: 'damage',
          // content 누락
        }),
      ];

      const result = service.validateIncidentBatch(rows, VALID_MGMT_NUMBERS);

      expect(result[0].status).toBe('error');
    });

    it('빈 배열 입력 시 빈 배열을 반환한다', () => {
      const result = service.validateIncidentBatch([], VALID_MGMT_NUMBERS);
      expect(result).toHaveLength(0);
    });
  });
});
