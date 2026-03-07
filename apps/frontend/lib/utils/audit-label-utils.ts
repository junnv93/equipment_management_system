import type { useTranslations } from 'next-intl';

type AuditT = ReturnType<typeof useTranslations<'audit'>>;

/**
 * i18n 기반 감사 로그 라벨 조회 팩토리
 *
 * `t.raw()`로 messages 객체를 추출해 O(1) 룩업합니다.
 * enum에 없는 레거시/미지 DB 값은 raw 문자열로 폴백합니다.
 *
 * @remarks
 * 백엔드(reports.service, audit.service, dashboard.service)는 next-intl을 사용할 수 없으므로
 * `packages/schemas`의 `AUDIT_ACTION_LABELS` / `AUDIT_ENTITY_TYPE_LABELS`를 직접 사용합니다.
 * 이 유틸리티는 **프론트엔드 전용**입니다.
 *
 * @example
 * ```tsx
 * const t = useTranslations('audit');
 * const { getActionLabel, getEntityTypeLabel } = createAuditLabelFns(t);
 *
 * <span>{getActionLabel(log.action)}</span>
 * <span>{getEntityTypeLabel(log.entityType)}</span>
 * ```
 */
export function createAuditLabelFns(t: AuditT) {
  const actions = t.raw('actions') as Record<string, string>;
  const entityTypes = t.raw('entityTypes') as Record<string, string>;

  return {
    /** 액션 라벨 반환. 미등록 값(레거시 DB)은 raw 문자열 폴백. */
    getActionLabel: (action: string): string => actions[action] ?? action,
    /** 엔티티 타입 라벨 반환. 미등록 값(레거시 DB)은 raw 문자열 폴백. */
    getEntityTypeLabel: (entityType: string): string => entityTypes[entityType] ?? entityType,
  };
}
