import {
  mergeTimeline,
  incidentToTimelineEntry,
  repairToTimelineEntry,
  ncToTimelineEntry,
} from '../services/equipment-timeline.service';
import type { equipmentIncidentHistory } from '@equipment-management/db/schema/equipment-incident-history';
import type { repairHistory } from '@equipment-management/db/schema/repair-history';
import type { nonConformances } from '@equipment-management/db/schema/non-conformances';

type IncidentRow = typeof equipmentIncidentHistory.$inferSelect;
type RepairRow = typeof repairHistory.$inferSelect;
type NcRow = typeof nonConformances.$inferSelect;

const EQUIPMENT_ID = '11111111-1111-1111-1111-111111111111';

const baseIncident = (overrides: Partial<IncidentRow>): IncidentRow =>
  ({
    id: '22222222-2222-2222-2222-222222222222',
    equipmentId: EQUIPMENT_ID,
    occurredAt: new Date('2026-03-01T00:00:00Z'),
    incidentType: 'damage',
    content: '외관 손상 발견',
    reportedBy: null,
    nonConformanceId: null,
    createdAt: new Date('2026-03-01T00:00:00Z'),
    ...overrides,
  }) as IncidentRow;

const baseRepair = (overrides: Partial<RepairRow>): RepairRow =>
  ({
    id: '33333333-3333-3333-3333-333333333333',
    equipmentId: EQUIPMENT_ID,
    repairDate: new Date('2026-03-02T00:00:00Z'),
    repairDescription: 'N-타입 커넥터 교체',
    repairResult: 'completed',
    notes: null,
    attachmentPath: null,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdBy: '99999999-9999-9999-9999-999999999999',
    createdAt: new Date('2026-03-02T00:00:00Z'),
    updatedAt: new Date('2026-03-02T00:00:00Z'),
    ...overrides,
  }) as RepairRow;

const baseNc = (overrides: Partial<NcRow>): NcRow =>
  ({
    id: '44444444-4444-4444-4444-444444444444',
    equipmentId: EQUIPMENT_ID,
    discoveryDate: '2026-03-03',
    discoveredBy: null,
    cause: '측정 오차 0.5dB 초과',
    ncType: 'measurement_error',
    resolutionType: null,
    repairHistoryId: null,
    calibrationId: null,
    actionPlan: null,
    correctionContent: null,
    correctionDate: null,
    correctedBy: null,
    status: 'open',
    closedDate: null,
    closedBy: null,
    evidencePath: null,
    notes: null,
    createdAt: new Date('2026-03-03T00:00:00Z'),
    updatedAt: new Date('2026-03-03T00:00:00Z'),
    ...overrides,
  }) as unknown as NcRow;

describe('EquipmentTimelineService (pure function layer)', () => {
  describe('incidentToTimelineEntry', () => {
    it('IncidentType enum 값을 라벨로 변환', () => {
      const entry = incidentToTimelineEntry(baseIncident({ incidentType: 'malfunction' }));
      expect(entry.type).toBe('malfunction');
      expect(entry.label).toBe('오작동');
      expect(entry.sourceTable).toBe('incident');
    });

    it('nonConformanceId가 있으면 crossRef 설정', () => {
      const entry = incidentToTimelineEntry(
        baseIncident({ nonConformanceId: '55555555-5555-5555-5555-555555555555' })
      );
      expect(entry.crossRef).toEqual({
        table: 'non_conformance',
        id: '55555555-5555-5555-5555-555555555555',
      });
    });

    it('알 수 없는 incidentType이면 원본 문자열을 라벨로 사용', () => {
      const entry = incidentToTimelineEntry(
        baseIncident({ incidentType: 'unknown_legacy' as IncidentRow['incidentType'] })
      );
      expect(entry.label).toBe('unknown_legacy');
    });
  });

  describe('repairToTimelineEntry', () => {
    it('repair_result 라벨을 content suffix로 포함', () => {
      const entry = repairToTimelineEntry(baseRepair({ repairResult: 'completed' }));
      expect(entry.type).toBe('repair_record');
      expect(entry.label).toBe('수리');
      expect(entry.content).toContain('완료');
    });

    it('연계 NC가 있으면 content에 (연계: 부적합 #) 주석 + crossRef 메타', () => {
      const nc = baseNc({ id: '66666666-6666-6666-6666-666666666666' });
      const entry = repairToTimelineEntry(baseRepair({}), nc);
      expect(entry.content).toContain('연계: 부적합 #66666666');
      expect(entry.crossRef).toEqual({ table: 'non_conformance', id: nc.id });
    });
  });

  describe('ncToTimelineEntry', () => {
    it('NC 유형 라벨 + 원인을 content로 결합', () => {
      const entry = ncToTimelineEntry(baseNc({ ncType: 'damage', cause: '화재 피해' }));
      expect(entry.type).toBe('non_conformance');
      expect(entry.label).toBe('부적합');
      expect(entry.content).toBe('손상 — 화재 피해');
    });

    it('discoveryDate(string)를 Date로 정규화', () => {
      const entry = ncToTimelineEntry(baseNc({ discoveryDate: '2026-05-10' }));
      expect(entry.occurredAt).toBeInstanceOf(Date);
      expect(entry.occurredAt.getFullYear()).toBe(2026);
    });
  });

  describe('mergeTimeline', () => {
    it('occurredAt DESC 정렬 — 가장 최근 이벤트가 배열 앞', () => {
      const result = mergeTimeline(
        [baseIncident({ id: 'i1', occurredAt: new Date('2026-03-10T00:00:00Z') })],
        [baseRepair({ id: 'r1', repairDate: new Date('2026-03-20T00:00:00Z') })],
        [baseNc({ id: 'n1', discoveryDate: '2026-03-05' })],
        50
      );
      expect(result.map((e) => e.sourceId)).toEqual(['r1', 'i1', 'n1']);
    });

    it('FK 역참조 중복 제거: incident.nonConformanceId → NC 스킵', () => {
      const ncId = '77777777-7777-7777-7777-777777777777';
      const result = mergeTimeline(
        [baseIncident({ id: 'i1', nonConformanceId: ncId })],
        [],
        [baseNc({ id: ncId })],
        50
      );
      expect(result).toHaveLength(1);
      expect(result[0].sourceTable).toBe('incident');
      expect(result[0].crossRef?.id).toBe(ncId);
    });

    it('FK 역참조 중복 제거: nc.repairHistoryId → NC 스킵 (repair가 더 구체적)', () => {
      const repairId = '88888888-8888-8888-8888-888888888888';
      const result = mergeTimeline(
        [],
        [baseRepair({ id: repairId })],
        [baseNc({ id: 'n1', repairHistoryId: repairId })],
        50
      );
      expect(result).toHaveLength(1);
      expect(result[0].sourceTable).toBe('repair');
      expect(result[0].content).toContain('연계: 부적합 #n1');
    });

    it('동일 occurredAt — incident > repair > non_conformance priority 순으로 정렬', () => {
      const sameDate = new Date('2026-03-15T00:00:00Z');
      const result = mergeTimeline(
        [baseIncident({ id: 'i1', occurredAt: sameDate })],
        [baseRepair({ id: 'r1', repairDate: sameDate })],
        [baseNc({ id: 'n1', discoveryDate: '2026-03-15' })],
        50
      );
      expect(result.map((e) => e.sourceTable)).toEqual(['incident', 'repair', 'non_conformance']);
    });

    it('limit 적용 — 초과분 잘림', () => {
      const result = mergeTimeline(
        [
          baseIncident({ id: 'i1', occurredAt: new Date('2026-03-01') }),
          baseIncident({ id: 'i2', occurredAt: new Date('2026-03-02') }),
          baseIncident({ id: 'i3', occurredAt: new Date('2026-03-03') }),
        ],
        [],
        [],
        2
      );
      expect(result).toHaveLength(2);
      // 최신 2건만 남음
      expect(result.map((e) => e.sourceId)).toEqual(['i3', 'i2']);
    });

    it('빈 입력 — 빈 배열 반환', () => {
      expect(mergeTimeline([], [], [], 50)).toEqual([]);
    });
  });
});
