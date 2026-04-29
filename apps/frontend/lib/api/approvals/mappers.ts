/**
 * approvals 도메인 mapper 함수 + type guard + status 변환
 *
 * 순수 변환 함수만 포함. 외부 API 호출 없음.
 * 의존성: types.ts, internal-rows.ts, 외부 도메인 타입, 스키마 상수, 유틸
 */

import {
  type UnifiedApprovalStatus,
  UnifiedApprovalStatusValues as UASVal,
  CalibrationApprovalStatusValues as CASVal,
  CheckoutStatusValues as CSVal,
  CalibrationPlanStatusValues as CPSVal,
  EquipmentImportSourceValues as EISrcVal,
  SITE_LABELS,
} from '@equipment-management/schemas';
import type { Calibration } from '../calibration-api';
import type { Checkout } from '../checkout-api';
import type { NonConformance } from '../non-conformances-api';
import type { EquipmentImport } from '../equipment-import-api';
import { getRoleDisplayName } from '@/lib/utils/permission-helpers';
import type { ApprovalItem, ApprovalSummaryData } from './types';
import type {
  DisposalApprovalRow,
  EquipmentRequestApprovalRow,
  CalibrationPlanApprovalRow,
  SoftwareValidationApprovalRow,
  InspectionApprovalRow,
  SelfInspectionApprovalRow,
} from './internal-rows';

// ============================================================================
// Type guards
// ============================================================================

export function isCheckout(data: unknown): data is Checkout {
  if (!data || typeof data !== 'object') return false;
  return 'equipmentIds' in data || 'destination' in data || 'purpose' in data;
}

export function isEquipmentImport(data: unknown): data is EquipmentImport {
  if (!data || typeof data !== 'object') return false;
  return 'sourceType' in data && ('vendorName' in data || 'ownerDepartment' in data);
}

// ============================================================================
// Status mappers
// ============================================================================

export function mapCalibrationStatus(status?: string): UnifiedApprovalStatus {
  switch (status) {
    case CASVal.PENDING_APPROVAL:
      return UASVal.PENDING;
    case CASVal.APPROVED:
      return UASVal.APPROVED;
    case CASVal.REJECTED:
      return UASVal.REJECTED;
    default:
      return UASVal.PENDING;
  }
}

export function mapCheckoutStatus(status: string): UnifiedApprovalStatus {
  switch (status) {
    case CSVal.PENDING:
      return UASVal.PENDING;
    case CSVal.APPROVED:
      return UASVal.APPROVED;
    case CSVal.REJECTED:
      return UASVal.REJECTED;
    case CSVal.RETURNED:
      return UASVal.PENDING; // 반입 승인 대기
    default:
      return UASVal.PENDING;
  }
}

export function mapPlanStatus(status: string): UnifiedApprovalStatus {
  switch (status) {
    case CPSVal.PENDING_REVIEW:
      return UASVal.PENDING_REVIEW;
    case CPSVal.PENDING_APPROVAL:
      return UASVal.REVIEWED;
    case CPSVal.APPROVED:
      return UASVal.APPROVED;
    case CPSVal.REJECTED:
      return UASVal.REJECTED;
    default:
      return UASVal.PENDING;
  }
}

export function mapEquipmentRequestStatus(status: string): UnifiedApprovalStatus {
  switch (status) {
    case CASVal.PENDING_APPROVAL:
      return UASVal.PENDING;
    case CASVal.APPROVED:
      return UASVal.APPROVED;
    case CASVal.REJECTED:
      return UASVal.REJECTED;
    default:
      return UASVal.PENDING;
  }
}

// ============================================================================
// Entity → ApprovalItem mappers
// ============================================================================

export function mapCalibrationToApprovalItem(calibration: Calibration): ApprovalItem {
  const registeredByUser = calibration.registeredByUser;
  const team = registeredByUser?.team;

  return {
    id: calibration.id,
    category: 'calibration',
    status: mapCalibrationStatus(calibration.approvalStatus),
    requesterId: calibration.registeredBy || '',
    requesterName: registeredByUser?.name ?? getRoleDisplayName(calibration.registeredByRole),
    requesterTeam: team?.name ?? '',
    requesterSite: (team as { site?: string } | null | undefined)?.site,
    requestedAt: calibration.createdAt,
    summary: `Equipment (${calibration.equipmentId}) Calibration Record`,
    summaryData: { type: 'calibration', equipmentId: calibration.equipmentId },
    details: {
      equipmentId: calibration.equipmentId,
      calibrationDate: calibration.calibrationDate,
      nextCalibrationDate: calibration.nextCalibrationDate,
      result: calibration.result,
      calibrationAgency: calibration.calibrationAgency,
      certificateNumber: calibration.certificateNumber,
    },
    originalData: calibration,
  };
}

export function mapCheckoutToApprovalItem(
  checkout: Checkout,
  category: 'outgoing' | 'incoming'
): ApprovalItem {
  const equipmentNames = checkout.equipment?.map((e) => e.name).join(', ') || 'Equipment';
  const team = checkout.user?.team;

  return {
    id: checkout.id,
    category,
    status: mapCheckoutStatus(checkout.status),
    requesterId: checkout.requesterId || '',
    requesterName: checkout.user?.name || 'Unknown',
    requesterTeam: team?.name ?? '',
    requesterSite: team?.site,
    requestedAt: checkout.createdAt,
    summary:
      category === 'outgoing'
        ? `${equipmentNames} Checkout Request`
        : `${equipmentNames} Return Pending`,
    summaryData: { type: 'checkout', equipmentNames, direction: category },
    details: {
      equipmentIds: checkout.equipmentIds,
      equipment: checkout.equipment,
      destination: checkout.destination,
      purpose: checkout.purpose,
      expectedReturnDate: checkout.expectedReturnDate,
    },
    originalData: checkout,
  };
}

export function mapPlanToApprovalItem(
  plan: CalibrationPlanApprovalRow,
  category: 'plan_review' | 'plan_final'
): ApprovalItem {
  const siteId = plan.siteId ?? '';
  const siteLabel = SITE_LABELS[siteId as keyof typeof SITE_LABELS] || siteId;

  return {
    id: plan.id,
    category,
    status: mapPlanStatus(plan.status ?? ''),
    requesterId: plan.createdBy ?? '',
    requesterName: plan.authorName ?? 'Unknown',
    requesterTeam: plan.teamName ?? '',
    requestedAt: plan.createdAt ?? '',
    summary: `${plan.year ?? ''} ${siteLabel} Calibration Plan`,
    summaryData: { type: 'calibration_plan', year: String(plan.year ?? ''), siteId },
    details: plan,
    originalData: plan,
  };
}

export function mapSoftwareToApprovalItem(item: SoftwareValidationApprovalRow): ApprovalItem {
  return {
    id: item.id,
    category: 'software_validation',
    status: UASVal.PENDING_REVIEW,
    requesterId: item.changedBy ?? '',
    requesterName: item.changerName ?? 'Unknown',
    requesterTeam: item.teamName ?? '',
    requestedAt: item.changedAt ?? item.createdAt ?? '',
    summary: `${item.softwareName ?? 'Software'} Change Request`,
    summaryData: {
      type: 'software_validation',
      softwareName: item.softwareName ?? 'Software',
    },
    details: item,
    originalData: item,
  };
}

export function mapNonConformanceToApprovalItem(nc: NonConformance): ApprovalItem {
  const user = nc.corrector || nc.discoverer;
  const team = user?.team;

  return {
    id: nc.id,
    category: 'nonconformity',
    status: UASVal.PENDING,
    requesterId: nc.correctedBy || nc.discoveredBy || '',
    requesterName: user?.name ?? 'Unknown',
    requesterTeam: team?.name ?? '',
    requesterSite: (team as { site?: string } | null | undefined)?.site,
    requestedAt: nc.correctionDate || nc.discoveryDate,
    summary: `${nc.cause} (Corrected)`,
    summaryData: { type: 'non_conformance', cause: nc.cause } as ApprovalSummaryData,
    details: {
      equipmentId: nc.equipmentId,
      discoveryDate: nc.discoveryDate,
      cause: nc.cause,
      ncType: nc.ncType,
      correctionContent: nc.correctionContent,
      correctionDate: nc.correctionDate,
      actionPlan: nc.actionPlan,
      rejectionReason: nc.rejectionReason,
      rejectedAt: nc.rejectedAt,
    },
    originalData: nc,
  };
}

export function mapInspectionToApprovalItem(item: InspectionApprovalRow): ApprovalItem {
  return {
    id: item.calibrationId ?? item.id ?? '',
    category: 'inspection',
    status: UASVal.PENDING,
    requesterId: '',
    requesterName: 'Auto Alert',
    requesterTeam: item.teamName ?? item.team ?? '',
    requestedAt: item.nextIntermediateCheckDate ?? item.createdAt ?? '',
    summary: `${item.equipmentName ?? 'Equipment'} Intermediate Check`,
    summaryData: { type: 'inspection', equipmentName: item.equipmentName ?? 'Equipment' },
    details: item,
    originalData: item,
  };
}

export function mapSelfInspectionToApprovalItem(item: SelfInspectionApprovalRow): ApprovalItem {
  return {
    id: item.id,
    category: 'self_inspection',
    status: UASVal.PENDING,
    requesterId: '',
    requesterName: item.teamName,
    requesterTeam: item.teamName,
    requestedAt: item.submittedAt ?? '',
    summary: `${item.equipmentName} Self Inspection`,
    summaryData: { type: 'self_inspection', equipmentName: item.equipmentName },
    details: item,
    originalData: item,
  };
}

export function mapDisposalToApprovalItem(
  item: DisposalApprovalRow,
  category: 'disposal_review' | 'disposal_final'
): ApprovalItem {
  const equipment = item.equipment;
  const requester = item.requester;
  const team = requester?.team;

  return {
    id: item.id,
    category,
    status: category === 'disposal_review' ? UASVal.PENDING : UASVal.REVIEWED,
    requesterId: item.requestedBy ?? '',
    requesterName: requester?.name ?? 'Unknown',
    requesterTeam: team?.name ?? '',
    requesterSite: (team as { site?: string } | null | undefined)?.site,
    requestedAt: item.requestedAt ?? '',
    summary: `${equipment?.name ?? 'Equipment'} (${equipment?.managementNumber ?? ''}) Disposal ${category === 'disposal_review' ? 'Review' : 'Approval'}`,
    summaryData: {
      type: 'disposal',
      equipmentName: equipment?.name ?? 'Equipment',
      managementNumber: equipment?.managementNumber ?? '',
      step: category === 'disposal_review' ? ('review' as const) : ('final' as const),
    },
    details: {
      reason: item.reason,
      reasonDetail: item.reasonDetail,
      equipmentId: item.equipmentId,
      equipment,
      reviewOpinion: item.reviewOpinion,
      reviewedAt: item.reviewedAt,
    },
    originalData: item,
  };
}

export function mapEquipmentRequestToApprovalItem(item: EquipmentRequestApprovalRow): ApprovalItem {
  const requester = item.requester;
  const equipment = item.equipment;
  const requestType = item.requestType ?? 'create';

  let equipmentName = '';
  if (equipment?.name) {
    equipmentName = equipment.name;
  } else if (item.requestData) {
    try {
      const data =
        typeof item.requestData === 'string' ? JSON.parse(item.requestData) : item.requestData;
      const parsed = data as { name?: unknown; equipmentName?: unknown };
      equipmentName =
        typeof parsed.name === 'string'
          ? parsed.name
          : typeof parsed.equipmentName === 'string'
            ? parsed.equipmentName
            : '';
    } catch {
      // JSON 파싱 실패 무시
    }
  }

  const summary = equipmentName
    ? `${equipmentName} ${requestType} Request`
    : `Equipment ${requestType} Request`;

  return {
    id: item.id,
    category: 'equipment',
    status: mapEquipmentRequestStatus(item.approvalStatus ?? ''),
    requesterId: item.requestedBy ?? '',
    requesterName: requester?.name ?? 'Unknown',
    requesterTeam: requester?.team?.name ?? '',
    requesterSite: (requester?.team as { site?: string } | null | undefined)?.site,
    requestedAt: item.requestedAt ?? '',
    summary,
    summaryData: { type: 'equipment_request', equipmentName, requestType },
    details: {
      requestType,
      equipmentId: item.equipmentId,
      equipment,
      requestData: item.requestData,
    },
    originalData: item,
  };
}

export function mapEquipmentImportToApprovalItem(
  item: EquipmentImport,
  category: 'incoming'
): ApprovalItem {
  const requester = item.requester;
  const team = requester?.team;

  const isRental = item.sourceType === EISrcVal.RENTAL;
  const vendorOrDepartment = isRental
    ? String(item.vendorName || '')
    : String(item.ownerDepartment || '');
  const summary = isRental
    ? `${item.equipmentName} Rental Import (${item.vendorName})`
    : `${item.equipmentName} Shared Equipment Import (${item.ownerDepartment})`;

  return {
    id: item.id,
    category,
    status: UASVal.PENDING,
    requesterId: item.requesterId,
    requesterName: requester?.name ?? 'Requester',
    requesterTeam: team?.name ?? '',
    requesterSite: (team as { site?: string } | null | undefined)?.site,
    requestedAt: item.createdAt,
    summary,
    summaryData: {
      type: 'equipment_import',
      equipmentName: item.equipmentName,
      sourceType: isRental ? ('rental' as const) : ('internal_shared' as const),
      vendorOrDepartment,
    },
    details: {
      equipmentName: item.equipmentName,
      classification: item.classification,
      sourceType: item.sourceType,
      vendorName: item.vendorName,
      vendorContact: item.vendorContact,
      ownerDepartment: item.ownerDepartment,
      internalContact: item.internalContact,
      borrowingJustification: item.borrowingJustification,
      usagePeriodStart: item.usagePeriodStart,
      usagePeriodEnd: item.usagePeriodEnd,
      reason: item.reason,
    },
    originalData: item,
  };
}
