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
}

/**
 * API_ENDPOINTS는 `/api/` globalPrefix를 포함하지만,
 * E2E 테스트 앱(createTestApp)은 globalPrefix를 설정하지 않습니다.
 * 이 유틸리티가 해당 차이를 중앙화하여 단일 변환 지점을 제공합니다.
 */
export const toTestPath = (apiPath: string): string => apiPath.replace(/^\/api/, '');

/**
 * SSOT: API_ENDPOINTS에서 리소스별 삭제 경로를 도출합니다.
 * 경로를 하드코딩하지 않고 shared-constants에서 가져옵니다.
 */
const RESOURCE_DELETE_PATH: Record<ResourceType, (id: string) => string> = {
  checkout: (id) => toTestPath(API_ENDPOINTS.CHECKOUTS.DELETE(id)),
  'non-conformance': (id) => toTestPath(API_ENDPOINTS.NON_CONFORMANCES.DELETE(id)),
  'calibration-factor': (id) => toTestPath(API_ENDPOINTS.CALIBRATION_FACTORS.DELETE(id)),
  equipment: (id) => toTestPath(API_ENDPOINTS.EQUIPMENT.DELETE(id)),
  cable: (id) => toTestPath(API_ENDPOINTS.CABLES.GET(id)),
  'location-history': (id) => toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.DELETE(id)),
  'maintenance-history': (id) => toTestPath(API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.DELETE(id)),
  'incident-history': (id) => toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.DELETE(id)),
};

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

  /** 생성된 리소스를 추적에 등록합니다. */
  track(type: ResourceType, id: string): void {
    this.resources.push({ type, id });
  }

  /**
   * 추적된 모든 리소스를 정리합니다.
   * FK 제약 조건 순서대로 삭제하며, 실패는 무시합니다.
   */
  async cleanupAll(app: INestApplication, token: string): Promise<void> {
    const sorted = [...this.resources].sort(
      (a, b) => DELETE_PRIORITY[a.type] - DELETE_PRIORITY[b.type],
    );

    for (const { type, id } of sorted) {
      try {
        if (type === 'cable') {
          // cables는 DELETE 엔드포인트가 없으므로 retired로 마킹
          const detailPath = RESOURCE_DELETE_PATH[type](id);
          const updatePath = toTestPath(API_ENDPOINTS.CABLES.UPDATE(id));

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
          const deletePath = RESOURCE_DELETE_PATH[type](id);
          await request(app.getHttpServer())
            .delete(deletePath)
            .set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // cleanup 실패는 무시
      }
    }

    this.resources = [];
  }
}
