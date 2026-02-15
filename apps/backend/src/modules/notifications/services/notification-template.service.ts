import { Injectable } from '@nestjs/common';
import { NOTIFICATION_REGISTRY, type NotificationCategory } from '../config/notification-registry';

/**
 * 알림 메시지 템플릿 엔진
 *
 * {{변수}} 패턴의 Mustache-style 치환.
 * 레지스트리의 titleTemplate/contentTemplate/linkTemplate을 렌더링한다.
 */

export interface BuiltNotification {
  title: string;
  content: string;
  category: NotificationCategory;
  priority: string;
  entityType: string;
  entityId: string;
  equipmentId: string | undefined;
  linkUrl: string;
}

@Injectable()
export class NotificationTemplateService {
  /**
   * Mustache-style {{변수}} 치환
   */
  render(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const value = variables[key];
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  /**
   * 이벤트명 + 페이로드로 알림 객체를 빌드한다.
   *
   * @throws Error 미등록 이벤트명
   */
  buildNotification(eventName: string, payload: Record<string, unknown>): BuiltNotification {
    const config = NOTIFICATION_REGISTRY[eventName];
    if (!config) {
      throw new Error(`Unknown notification event: ${eventName}`);
    }

    return {
      title: this.render(config.titleTemplate, payload),
      content: this.render(config.contentTemplate, payload),
      category: config.category,
      priority: config.priority,
      entityType: config.entityType,
      entityId: (payload[config.entityIdField] as string) ?? '',
      equipmentId: config.equipmentIdField
        ? (payload[config.equipmentIdField] as string)
        : undefined,
      linkUrl: this.render(config.linkTemplate, payload),
    };
  }
}
