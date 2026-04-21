import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

type ResourceType =
  | 'checkout'
  | 'non-conformance'
  | 'calibration-factor'
  | 'equipment'
  | 'cable'
  | 'location-history'
  | 'maintenance-history'
  | 'incident-history';

interface TrackedResource {
  type: ResourceType;
  id: string;
  version?: number;
}

/**
 * SSOT: API_ENDPOINTS에서 리소스별 삭제 경로를 도출합니다.
 * 경로를 하드코딩하지 않고 shared-constants에서 가져옵니다.
 */
const RESOURCE_DELETE_PATH: Record<ResourceType, (id: string) => string> = {
  checkout: (id) => API_ENDPOINTS.CHECKOUTS.DELETE(id),
  'non-conformance': (id) => API_ENDPOINTS.NON_CONFORMANCES.DELETE(id),
  'calibration-factor': (id) => API_ENDPOINTS.CALIBRATION_FACTORS.DELETE(id),
  equipment: (id) => API_ENDPOINTS.EQUIPMENT.DELETE(id),
  cable: (id) => API_ENDPOINTS.CABLES.GET(id),
  'location-history': (id) => API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.DELETE(id),
  'maintenance-history': (id) => API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.DELETE(id),
  'incident-history': (id) => API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.DELETE(id),
};

/**
 * SSOT: CAS 엔티티의 상세 조회 경로 — DELETE 전 version 조회에 사용.
 * version이 없는 DELETE 호출은 CAS 계약 위반이므로, GET으로 현재 version을 얻습니다.
 */
const RESOURCE_DETAIL_PATH: Partial<Record<ResourceType, (id: string) => string>> = {
  'non-conformance': (id) => API_ENDPOINTS.NON_CONFORMANCES.GET(id),
  'calibration-factor': (id) => API_ENDPOINTS.CALIBRATION_FACTORS.GET(id),
  equipment: (id) => API_ENDPOINTS.EQUIPMENT.GET(id),
};

/** CAS version이 필요한 리소스 타입 */
const CAS_RESOURCE_TYPES: ReadonlySet<ResourceType> = new Set([
  'non-conformance',
  'calibration-factor',
  'equipment',
]);

/** 리소스 타입별 삭제 우선순위 (FK 제약 조건 반영 — 낮을수록 먼저 삭제) */
const DELETE_PRIORITY: Record<ResourceType, number> = {
  'location-history': 0,
  'maintenance-history': 0,
  'incident-history': 0,
  checkout: 1,
  'non-conformance': 2,
  'calibration-factor': 3,
  equipment: 4,
  cable: 5,
};

/**
 * 테스트에서 생성된 리소스를 추적하고 afterAll에서 일괄 정리합니다.
 * FK 제약 조건을 고려하여 의존 리소스부터 역순으로 삭제합니다.
 */
export class ResourceTracker {
  private resources: TrackedResource[] = [];

  /** 생성된 리소스를 추적에 등록합니다. version은 선택 — 미제공 시 cleanup에서 GET으로 조회. */
  track(type: ResourceType, id: string, version?: number): void {
    this.resources.push({ type, id, version });
  }

  /**
   * 추적된 모든 리소스를 정리합니다.
   * FK 제약 조건 순서대로 삭제하며, CAS 엔티티는 version을 포함합니다.
   */
  async cleanupAll(app: INestApplication, token: string): Promise<void> {
    const sorted = [...this.resources].sort(
      (a, b) => DELETE_PRIORITY[a.type] - DELETE_PRIORITY[b.type],
    );

    for (const { type, id, version } of sorted) {
      try {
        if (type === 'cable') {
          // cables는 DELETE 엔드포인트가 없으므로 retired로 마킹
          const detailPath = API_ENDPOINTS.CABLES.GET(id);
          const updatePath = API_ENDPOINTS.CABLES.UPDATE(id);

          const detail = await request(app.getHttpServer())
            .get(detailPath)
            .set('Authorization', `Bearer ${token}`);

          if (detail.status === 200) {
            await request(app.getHttpServer())
              .patch(updatePath)
              .set('Authorization', `Bearer ${token}`)
              .send({ version: detail.body.version, status: 'retired' });
          }
        } else {
          let effectiveVersion = version;

          // CAS 엔티티이고 version이 없으면 GET으로 조회
          if (CAS_RESOURCE_TYPES.has(type) && effectiveVersion === undefined) {
            const detailPathFn = RESOURCE_DETAIL_PATH[type];
            if (detailPathFn) {
              const detail = await request(app.getHttpServer())
                .get(detailPathFn(id))
                .set('Authorization', `Bearer ${token}`);

              if (detail.status === 200 && detail.body.version !== undefined) {
                effectiveVersion = detail.body.version;
              }
            }
          }

          const deletePath = RESOURCE_DELETE_PATH[type](id);
          const deleteUrl =
            effectiveVersion !== undefined
              ? `${deletePath}?version=${effectiveVersion}`
              : deletePath;

          await request(app.getHttpServer())
            .delete(deleteUrl)
            .set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // cleanup 실패는 무시
      }
    }

    this.resources = [];
  }
}
