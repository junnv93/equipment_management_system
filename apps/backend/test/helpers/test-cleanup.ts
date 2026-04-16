import { INestApplication } from '@nestjs/common';
import request from 'supertest';

type ResourceType = 'checkout' | 'non-conformance' | 'calibration-factor' | 'equipment' | 'cable';

interface TrackedResource {
  type: ResourceType;
  id: string;
}

/** 리소스 타입별 API 경로 */
const RESOURCE_ENDPOINTS: Record<ResourceType, string> = {
  checkout: '/checkouts',
  'non-conformance': '/non-conformances',
  'calibration-factor': '/calibration-factors',
  equipment: '/equipment',
  cable: '/cables',
};

/** 리소스 타입별 삭제 우선순위 (FK 제약 조건 반영 — 낮을수록 먼저 삭제) */
const DELETE_PRIORITY: Record<ResourceType, number> = {
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
    // 우선순위로 정렬 (의존 리소스 먼저 삭제)
    const sorted = [...this.resources].sort(
      (a, b) => DELETE_PRIORITY[a.type] - DELETE_PRIORITY[b.type],
    );

    for (const { type, id } of sorted) {
      try {
        const endpoint = RESOURCE_ENDPOINTS[type];

        if (type === 'cable') {
          // cables는 DELETE 엔드포인트가 없으므로 retired로 마킹
          const detail = await request(app.getHttpServer())
            .get(`${endpoint}/${id}`)
            .set('Authorization', `Bearer ${token}`);

          if (detail.status === 200) {
            await request(app.getHttpServer())
              .patch(`${endpoint}/${id}`)
              .set('Authorization', `Bearer ${token}`)
              .send({ version: detail.body.version, status: 'retired' });
          }
        } else {
          await request(app.getHttpServer())
            .delete(`${endpoint}/${id}`)
            .set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // cleanup 실패는 무시
      }
    }

    this.resources = [];
  }
}
