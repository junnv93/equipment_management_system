import {
  calibrationStatusQuerySchema,
  exportEquipmentInventoryQuerySchema,
  exportCalibrationStatusQuerySchema,
  exportUtilizationQuerySchema,
  exportAuditLogsQuerySchema,
  exportEquipmentUsageQuerySchema,
  exportTeamEquipmentQuerySchema,
  exportMaintenanceQuerySchema,
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

  // ── Round 3 closure: 3 export pipe spec coverage 보강 ───────────────────
  describe('exportEquipmentUsageQuery — format enum + date range SSOT', () => {
    it('accepts valid format=excel with date range', () => {
      expect(
        exportEquipmentUsageQuerySchema.safeParse({
          format: 'excel',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        }).success
      ).toBe(true);
    });
    it('rejects invalid format value', () => {
      expect(
        exportEquipmentUsageQuerySchema.safeParse({ format: 'png', startDate: '2026-01-01' })
          .success
      ).toBe(false);
    });
    it('rejects invalid endDate', () => {
      expect(
        exportEquipmentUsageQuerySchema.safeParse({
          format: 'pdf',
          endDate: 'not-a-date',
        }).success
      ).toBe(false);
    });
    it('accepts format=pdf without optional dates', () => {
      expect(exportEquipmentUsageQuerySchema.safeParse({ format: 'pdf' }).success).toBe(true);
    });
  });

  describe('exportTeamEquipmentQuery — format + site + teamId UUID SSOT', () => {
    it('accepts valid format=excel + site + teamId UUID', () => {
      expect(
        exportTeamEquipmentQuerySchema.safeParse({
          format: 'excel',
          site: 'suwon',
          teamId: '550e8400-e29b-41d4-a716-446655440000',
        }).success
      ).toBe(true);
    });
    it('rejects invalid teamId (non-UUID)', () => {
      expect(
        exportTeamEquipmentQuerySchema.safeParse({
          format: 'excel',
          teamId: 'not-a-uuid',
        }).success
      ).toBe(false);
    });
    it('rejects invalid site enum', () => {
      expect(
        exportTeamEquipmentQuerySchema.safeParse({
          format: 'excel',
          site: 'unknown-site',
        }).success
      ).toBe(false);
    });
    it('accepts minimal format-only payload', () => {
      expect(exportTeamEquipmentQuerySchema.safeParse({ format: 'pdf' }).success).toBe(true);
    });
  });

  describe('exportMaintenanceQuery — format + date range + equipmentId UUID SSOT', () => {
    it('accepts valid format=excel + date range + equipmentId', () => {
      expect(
        exportMaintenanceQuerySchema.safeParse({
          format: 'excel',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          equipmentId: '550e8400-e29b-41d4-a716-446655440001',
        }).success
      ).toBe(true);
    });
    it('rejects invalid equipmentId (non-UUID)', () => {
      expect(
        exportMaintenanceQuerySchema.safeParse({
          format: 'excel',
          equipmentId: 'invalid-uuid',
        }).success
      ).toBe(false);
    });
    it('rejects invalid startDate format', () => {
      expect(
        exportMaintenanceQuerySchema.safeParse({
          format: 'pdf',
          startDate: '2026/05/05',
        }).success
      ).toBe(false);
    });
    it('accepts minimal format-only payload', () => {
      expect(exportMaintenanceQuerySchema.safeParse({ format: 'excel' }).success).toBe(true);
    });
  });
});
