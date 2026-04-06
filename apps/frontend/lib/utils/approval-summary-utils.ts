import type { ApprovalItem } from '@/lib/api/approvals-api';

type TranslateFn = (key: string, params?: Record<string, string | number | Date>) => string;

/**
 * ApprovalItem의 summaryData를 사용하여 로컬라이즈된 summary 생성
 *
 * API 레이어의 summary(영어 기본값)와 분리된 렌더링 유틸리티.
 * summaryData가 없으면 item.summary를 그대로 반환 (fallback).
 *
 * @param siteLabels - i18n 사이트 라벨 맵 (useSiteLabels() 반환값). 교정계획서 summary에 사용.
 */
export function getLocalizedSummary(
  item: ApprovalItem,
  t: TranslateFn,
  siteLabels?: Record<string, string>
): string {
  if (!item.summaryData) return item.summary;

  const data = item.summaryData;
  switch (data.type) {
    case 'calibration':
      return t('summaryTemplates.calibration', { equipmentId: data.equipmentId });
    case 'checkout':
      return data.direction === 'outgoing'
        ? t('summaryTemplates.checkoutOutgoing', { equipmentNames: data.equipmentNames })
        : t('summaryTemplates.checkoutIncoming', { equipmentNames: data.equipmentNames });
    case 'calibration_plan': {
      const siteLabel = siteLabels?.[data.siteId] ?? data.siteId;
      return t('summaryTemplates.calibrationPlan', { year: data.year, site: siteLabel });
    }
    case 'equipment_request':
      return data.equipmentName
        ? t('summaryTemplates.equipmentRequest', {
            equipment: data.equipmentName,
            action: t(`requestTypes.${data.requestType}`),
          })
        : t('summaryTemplates.equipmentRequestNoName', {
            action: t(`requestTypes.${data.requestType}`),
          });
    case 'disposal':
      return t(`summaryTemplates.disposal_${data.step}`, {
        equipment: data.equipmentName,
        managementNumber: data.managementNumber,
      });
    case 'software_validation':
      return t('summaryTemplates.software_validation', { name: data.softwareName });
    case 'inspection':
      return t('summaryTemplates.inspection', { equipment: data.equipmentName });
    case 'non_conformance':
      return t('summaryTemplates.nonConformance', { cause: data.cause });
    case 'equipment_import':
      return data.sourceType === 'rental'
        ? t('summaryTemplates.equipmentImportRental', {
            equipment: data.equipmentName,
            vendor: data.vendorOrDepartment,
          })
        : t('summaryTemplates.equipmentImportShared', {
            equipment: data.equipmentName,
            department: data.vendorOrDepartment,
          });
    default:
      return item.summary;
  }
}
