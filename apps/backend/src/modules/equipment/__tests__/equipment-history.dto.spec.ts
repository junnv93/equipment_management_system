import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';
import {
  createIncidentHistorySchema,
  createLocationHistorySchema,
  createMaintenanceHistorySchema,
} from '../dto/equipment-history.dto';

describe('equipment history DTO schemas', () => {
  it('위치 이력 위치는 trim 후 빈 문자열이면 실패한다', () => {
    const result = createLocationHistorySchema.safeParse({
      changedAt: '2026-05-03',
      newLocation: '   ',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(VM.required('위치'));
    }
  });

  it('위치 이력 위치는 trim 후 값이 있으면 trimmed value를 반환한다', () => {
    const result = createLocationHistorySchema.safeParse({
      changedAt: '2026-05-03',
      newLocation: '  RF Lab  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.newLocation).toBe('RF Lab');
    }
  });

  it('유지보수 내용은 trim 후 빈 문자열이면 실패하고 정상 값은 trim한다', () => {
    const reject = createMaintenanceHistorySchema.safeParse({
      performedAt: '2026-05-03',
      content: '   ',
    });
    expect(reject.success).toBe(false);

    const accept = createMaintenanceHistorySchema.safeParse({
      performedAt: '2026-05-03',
      content: '  분기 점검 완료  ',
    });
    expect(accept.success).toBe(true);
    if (accept.success) {
      expect(accept.data.content).toBe('분기 점검 완료');
    }
  });

  it('손상 이력 내용은 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = createIncidentHistorySchema.safeParse({
      occurredAt: '2026-05-03',
      incidentType: 'damage',
      content: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('내용', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });

  it('손상 이력 조치 계획은 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = createIncidentHistorySchema.safeParse({
      occurredAt: '2026-05-03',
      incidentType: 'damage',
      content: '내용',
      actionPlan: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('조치 계획', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });
});
