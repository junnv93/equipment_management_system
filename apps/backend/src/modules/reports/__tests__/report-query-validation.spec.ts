import {
  calibrationStatusQuerySchema,
  exportEquipmentInventoryQuerySchema,
  exportCalibrationStatusQuerySchema,
  exportUtilizationQuerySchema,
  exportAuditLogsQuerySchema,
  exportEquipmentUsageQuerySchema,
  equipmentUsageQuerySchema,
} from '../dto/report-query.dto';

describe('report query schemas — Query DTO trim/max + enum SSOT', () => {
  describe('dateRangeFields — optionalIsoDateString SSOT (verify-zod Step 20)', () => {
    it.each(['2026-05-05', '2026-05-05T10:30:00Z'])('accepts ISO format: %s', (val) => {
      expect(equipmentUsageQuerySchema.safeParse({ startDate: val }).success).toBe(true);
    });
    it.each(['2026/05/05', 'invalid', '99999999'])('rejects invalid: %s', (val) => {
      expect(equipmentUsageQuerySchema.safeParse({ startDate: val }).success).toBe(false);
    });
    it('whitespace → undefined', () => {
      const r = equipmentUsageQuerySchema.safeParse({ startDate: '   ' });
      if (r.success) expect(r.data.startDate).toBeUndefined();
    });
    it('max + 1 → reject', () => {
      expect(equipmentUsageQuerySchema.safeParse({ startDate: 'a'.repeat(31) }).success).toBe(
        false
      );
    });
  });

  describe('calibrationStatusQuery — status enum SSOT', () => {
    it.each(['scheduled', 'in_progress', 'completed', 'cancelled'])('accepts: %s', (status) => {
      expect(calibrationStatusQuerySchema.safeParse({ status }).success).toBe(true);
    });
    it.each(['unknown', 'INVALID', 'SQL; DROP'])('rejects: %s', (status) => {
      expect(calibrationStatusQuerySchema.safeParse({ status }).success).toBe(false);
    });
  });

  describe('exportEquipmentInventoryQuery — status enum SSOT (EquipmentStatus)', () => {
    it.each(['available', 'checked_out', 'non_conforming', 'spare'])('accepts: %s', (status) => {
      expect(
        exportEquipmentInventoryQuerySchema.safeParse({ format: 'excel', status }).success
      ).toBe(true);
    });
    it.each(['unknown_status', 'sql; DROP', 'AVAILABLE'])('rejects: %s', (status) => {
      expect(
        exportEquipmentInventoryQuerySchema.safeParse({ format: 'excel', status }).success
      ).toBe(false);
    });
  });

  describe('exportCalibrationStatusQuery — status enum SSOT', () => {
    it('accepts: scheduled', () => {
      expect(
        exportCalibrationStatusQuerySchema.safeParse({ format: 'excel', status: 'scheduled' })
          .success
      ).toBe(true);
    });
    it('rejects unknown', () => {
      expect(
        exportCalibrationStatusQuerySchema.safeParse({ format: 'excel', status: 'invalid' }).success
      ).toBe(false);
    });
  });

  describe('exportUtilizationQuery — period enum SSOT (REPORT_PERIOD_VALUES)', () => {
    it.each(['week', 'month', 'quarter', 'year'])('accepts: %s', (period) => {
      expect(exportUtilizationQuerySchema.safeParse({ format: 'excel', period }).success).toBe(
        true
      );
    });
    it.each(['decade', 'INVALID'])('rejects: %s', (period) => {
      expect(exportUtilizationQuerySchema.safeParse({ format: 'excel', period }).success).toBe(
        false
      );
    });
  });

  describe('exportAuditLogs / exportEquipmentUsage — date validation 회귀', () => {
    it('exportAuditLogs invalid startDate → reject', () => {
      expect(
        exportAuditLogsQuerySchema.safeParse({ format: 'excel', startDate: 'invalid' }).success
      ).toBe(false);
    });
    it('exportEquipmentUsage valid date → accept', () => {
      expect(
        exportEquipmentUsageQuerySchema.safeParse({
          format: 'excel',
          startDate: '2026-05-05',
        }).success
      ).toBe(true);
    });
  });
});
