import { NotificationTemplateService } from '../services/notification-template.service';
import { NOTIFICATION_REGISTRY } from '../config/notification-registry';

describe('NotificationTemplateService', () => {
  let service: NotificationTemplateService;

  beforeEach(() => {
    service = new NotificationTemplateService();
  });

  // ─── render ───────────────────────────────────────────────────────────────

  describe('render()', () => {
    it('{{변수}} 패턴을 값으로 치환한다', () => {
      const result = service.render('{{name}}님의 요청입니다.', { name: '홍길동' });

      expect(result).toBe('홍길동님의 요청입니다.');
    });

    it('값이 없는 변수는 빈 문자열로 치환한다', () => {
      const result = service.render('{{name}}님', {});

      expect(result).toBe('님');
    });

    it('null 값은 빈 문자열로 치환한다', () => {
      const result = service.render('{{actor}}', { actor: null });

      expect(result).toBe('');
    });

    it('변수가 없는 템플릿은 그대로 반환한다', () => {
      const template = '반출 요청이 제출되었습니다.';
      const result = service.render(template, { name: '홍길동' });

      expect(result).toBe(template);
    });

    it('같은 변수를 여러 번 치환한다', () => {
      const result = service.render('{{x}} + {{x}} = {{y}}', { x: '1', y: '2' });

      expect(result).toBe('1 + 1 = 2');
    });
  });

  // ─── buildNotification ────────────────────────────────────────────────────

  describe('buildNotification()', () => {
    // NOTIFICATION_REGISTRY에서 실제 등록된 이벤트 중 하나 사용
    const REGISTERED_EVENTS = Object.keys(NOTIFICATION_REGISTRY);

    it('등록된 이벤트에서 알림 객체를 빌드한다', () => {
      // 첫 번째 등록된 이벤트 사용
      const eventName = REGISTERED_EVENTS[0];
      const config = NOTIFICATION_REGISTRY[eventName];

      // entityIdField에 맞는 페이로드 구성
      const payload: Record<string, unknown> = {
        actorName: '홍길동',
        [config.entityIdField]: 'entity-uuid-1',
      };
      if (config.equipmentIdField) {
        payload[config.equipmentIdField] = 'eq-uuid-1';
      }

      const result = service.buildNotification(eventName, payload);

      expect(result.title).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.category).toBe(config.category);
      expect(result.priority).toBe(config.priority);
      expect(result.entityType).toBe(config.entityType);
    });

    it('미등록 이벤트명에서 Error를 던진다', () => {
      expect(() => {
        service.buildNotification('UNKNOWN_EVENT', {});
      }).toThrow(Error);
    });

    it('모든 등록된 이벤트가 정상적으로 빌드된다', () => {
      for (const eventName of REGISTERED_EVENTS) {
        const config = NOTIFICATION_REGISTRY[eventName];
        const payload: Record<string, unknown> = {
          actorName: '시스템',
          [config.entityIdField]: 'entity-uuid-1',
        };
        if (config.equipmentIdField) {
          payload[config.equipmentIdField] = 'eq-uuid-1';
        }

        expect(() => {
          service.buildNotification(eventName, payload);
        }).not.toThrow();
      }
    });

    it('equipmentIdField가 없는 이벤트는 equipmentId=undefined를 반환한다', () => {
      // equipmentIdField가 없는 이벤트를 찾아서 테스트
      const eventWithoutEquipment = REGISTERED_EVENTS.find(
        (name) => !NOTIFICATION_REGISTRY[name].equipmentIdField
      );

      if (eventWithoutEquipment) {
        const config = NOTIFICATION_REGISTRY[eventWithoutEquipment];
        const payload = {
          actorName: '홍길동',
          [config.entityIdField]: 'entity-uuid-1',
        };

        const result = service.buildNotification(eventWithoutEquipment, payload);

        expect(result.equipmentId).toBeUndefined();
      }
    });
  });
});
