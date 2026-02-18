'use client';

import { useTranslations } from 'next-intl';
import {
  CALIBRATION_RESULT_LABELS,
  CHECKOUT_PURPOSE_LABELS,
  NON_CONFORMANCE_TYPE_LABELS,
  DISPOSAL_REASON_LABELS,
} from '@equipment-management/schemas';
import { TAB_META, type ApprovalCategory } from '@/lib/api/approvals-api';
import { formatDate } from '@/lib/utils/date';
import { Badge } from '@/components/ui/badge';
import { APPROVAL_TIMELINE_TOKENS } from '@/lib/design-tokens';

// ============================================================================
// 공통 컴포넌트
// ============================================================================

function DetailRow({ label, value }: { label: string; value?: unknown }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{String(value)}</span>
    </div>
  );
}

function DateRow({ label, value }: { label: string; value?: unknown }) {
  if (!value || typeof value !== 'string') return null;
  return <DetailRow label={label} value={formatDate(value, 'yyyy-MM-dd')} />;
}

/**
 * SSOT 라벨을 적용한 DetailRow
 * labels 맵에서 value를 찾아 라벨로 변환, 없으면 원본 표시
 */
function LabeledRow({
  label,
  value,
  labels,
}: {
  label: string;
  value?: unknown;
  labels: Record<string, string>;
}) {
  if (value === null || value === undefined || value === '') return null;
  const key = String(value);
  return <DetailRow label={label} value={labels[key] || key} />;
}

// Translation function type
type TFunc = (key: string) => string;

/**
 * 카테고리 배지 컴포넌트
 */
export function CategoryBadge({ category }: { category: ApprovalCategory }) {
  const meta = TAB_META[category];
  if (!meta) return null;
  return (
    <Badge variant="outline" className="text-xs">
      {meta.label}
    </Badge>
  );
}

// ============================================================================
// 카테고리별 렌더러 (t 함수를 통해 i18n 적용)
// ============================================================================

/** 장비 등록/수정/삭제 */
function renderEquipmentDetails(details: Record<string, unknown>, t: TFunc) {
  const requestTypeLabels: Record<string, string> = {
    create: t('requestTypes.create'),
    update: t('requestTypes.update'),
    delete: t('requestTypes.delete'),
  };

  const requestType = String(details.requestType || '');

  // equipment 객체에서 장비 정보 추출
  const eq = details.equipment as Record<string, unknown> | undefined;

  // requestData에서 추가 정보 추출 (신규 등록 시 equipment가 없을 수 있음)
  let requestData: Record<string, unknown> | null = null;
  if (details.requestData) {
    try {
      requestData =
        typeof details.requestData === 'string'
          ? JSON.parse(details.requestData)
          : (details.requestData as Record<string, unknown>);
    } catch {
      // JSON 파싱 실패 무시
    }
  }

  const name = eq?.name || requestData?.name || requestData?.equipmentName;
  const managementNumber = eq?.managementNumber || requestData?.managementNumber;
  const modelName = eq?.modelName || requestData?.modelName;
  const serialNumber = eq?.serialNumber || requestData?.serialNumber;
  const manufacturer = eq?.manufacturer || requestData?.manufacturer;
  const purchaseYear = eq?.purchaseYear || requestData?.purchaseYear;
  const description = eq?.description || requestData?.description;

  return (
    <>
      <LabeledRow label={t('detailRows.type')} value={requestType} labels={requestTypeLabels} />
      <DetailRow label={t('detailRows.managementNumber')} value={managementNumber} />
      <DetailRow label={t('detailRows.equipmentName')} value={name} />
      <DetailRow label={t('detailRows.modelName')} value={modelName} />
      <DetailRow label={t('detailRows.serialNumber')} value={serialNumber} />
      <DetailRow label={t('detailRows.manufacturer')} value={manufacturer} />
      <DetailRow label={t('detailRows.purchaseYear')} value={purchaseYear} />
      <DetailRow label={t('detailRows.specification')} value={description} />
    </>
  );
}

/** 교정 기록 */
function renderCalibrationDetails(details: Record<string, unknown>, t: TFunc) {
  return (
    <>
      <DetailRow label={t('detailRows.equipmentId')} value={details.equipmentId} />
      <DateRow label={t('detailRows.calibrationDate')} value={details.calibrationDate} />
      <DateRow label={t('detailRows.nextCalibrationDate')} value={details.nextCalibrationDate} />
      <LabeledRow
        label={t('detailRows.calibrationResult')}
        value={details.result}
        labels={CALIBRATION_RESULT_LABELS}
      />
      <DetailRow
        label={t('detailRows.calibrationOrganization')}
        value={details.calibrationAgency}
      />
      <DetailRow label={t('detailRows.certificateNumber')} value={details.certificateNumber} />
    </>
  );
}

/** 반출 / 반입 / 공용장비 */
function renderCheckoutDetails(details: Record<string, unknown>, t: TFunc) {
  // equipment 배열에서 장비 이름 목록 추출
  const equipmentList = details.equipment as Array<Record<string, unknown>> | undefined;
  const equipmentNames = equipmentList
    ?.map((e) => e.name || e.managementNumber)
    .filter(Boolean)
    .join(', ');

  return (
    <>
      {equipmentNames && <DetailRow label={t('detailRows.equipment')} value={equipmentNames} />}
      <LabeledRow
        label={t('detailRows.checkoutPurpose')}
        value={details.purpose}
        labels={CHECKOUT_PURPOSE_LABELS}
      />
      <DetailRow label={t('detailRows.destination')} value={details.destination} />
      <DateRow label={t('detailRows.expectedReturnDate')} value={details.expectedReturnDate} />
    </>
  );
}

/** 부적합 재개 */
function renderNonConformityDetails(details: Record<string, unknown>, t: TFunc) {
  return (
    <>
      <DetailRow label={t('detailRows.equipmentId')} value={details.equipmentId} />
      <LabeledRow
        label={t('detailRows.ncType')}
        value={details.ncType}
        labels={NON_CONFORMANCE_TYPE_LABELS}
      />
      <DetailRow label={t('detailRows.cause')} value={details.cause} />
      <DetailRow label={t('detailRows.correctionContent')} value={details.correctionContent} />
      <DateRow label={t('detailRows.correctionDate')} value={details.correctionDate} />
      <DetailRow label={t('detailRows.analysisContent')} value={details.analysisContent} />
      <DetailRow label={t('detailRows.actionPlan')} value={details.actionPlan} />
      {details.rejectionReason && (
        <div className={`mt-2 pt-2 ${APPROVAL_TIMELINE_TOKENS.rejectionBorder}`}>
          <DetailRow
            label={t('detailRows.previousRejectionReason')}
            value={details.rejectionReason}
          />
          <DateRow label={t('detailRows.rejectionDate')} value={details.rejectedAt} />
        </div>
      )}
    </>
  );
}

/** 폐기 검토 / 최종 승인 */
function renderDisposalDetails(details: Record<string, unknown>, isFinal: boolean, t: TFunc) {
  const eq = details.equipment as Record<string, unknown> | undefined;
  const equipmentLabel = eq
    ? `${eq.name || ''}${eq.managementNumber ? ` (${eq.managementNumber})` : ''}`
    : undefined;

  return (
    <>
      {equipmentLabel && <DetailRow label={t('detailRows.equipment')} value={equipmentLabel} />}
      <LabeledRow
        label={t('detailRows.disposalReason')}
        value={details.reason}
        labels={DISPOSAL_REASON_LABELS}
      />
      <DetailRow label={t('detailRows.detailedReason')} value={details.reasonDetail} />
      {isFinal && details.reviewOpinion && (
        <DetailRow label={t('detailRows.reviewOpinion')} value={details.reviewOpinion} />
      )}
      {isFinal && details.reviewedAt && (
        <DateRow label={t('detailRows.reviewDate')} value={details.reviewedAt} />
      )}
    </>
  );
}

/** 교정계획서 검토 / 최종 승인 */
function renderPlanDetails(details: Record<string, unknown>, t: TFunc) {
  const site = details.site as Record<string, unknown> | undefined;
  const siteName = site?.name;

  return (
    <>
      <DetailRow label={t('detailRows.year')} value={details.year} />
      <DetailRow label={t('detailRows.site')} value={siteName} />
    </>
  );
}

/** 소프트웨어 */
function renderSoftwareDetails(details: Record<string, unknown>, t: TFunc) {
  return (
    <>
      <DetailRow label={t('detailRows.softwareName')} value={details.softwareName} />
      <DetailRow
        label={t('detailRows.changeReason')}
        value={details.changeReason || details.reason}
      />
    </>
  );
}

/** 중간점검 */
function renderInspectionDetails(details: Record<string, unknown>, t: TFunc) {
  const equipment = details.equipment as Record<string, unknown> | undefined;
  const equipmentName = equipment?.name;

  return (
    <>
      {equipmentName && <DetailRow label={t('detailRows.equipment')} value={equipmentName} />}
      <DateRow label={t('detailRows.inspectionDate')} value={details.nextIntermediateCheckDate} />
    </>
  );
}

// ============================================================================
// 진입점 — React 컴포넌트 (useTranslations 사용)
// ============================================================================

/**
 * 카테고리별 상세 정보를 렌더링하는 React 컴포넌트
 *
 * useTranslations('approvals')를 사용하여 i18n 적용.
 * 각 카테고리의 details 구조에 맞게 SSOT 라벨을 적용합니다.
 */
export function CategoryDetails({
  category,
  details,
}: {
  category: ApprovalCategory;
  details: Record<string, unknown>;
}) {
  const t = useTranslations('approvals');

  switch (category) {
    case 'equipment':
      return renderEquipmentDetails(details, t);
    case 'calibration':
      return renderCalibrationDetails(details, t);
    case 'outgoing':
    case 'incoming':
      return renderCheckoutDetails(details, t);
    case 'nonconformity':
      return renderNonConformityDetails(details, t);
    case 'disposal_review':
      return renderDisposalDetails(details, false, t);
    case 'disposal_final':
      return renderDisposalDetails(details, true, t);
    case 'plan_review':
    case 'plan_final':
      return renderPlanDetails(details, t);
    case 'software':
      return renderSoftwareDetails(details, t);
    case 'inspection':
      return renderInspectionDetails(details, t);
    default:
      // 알 수 없는 카테고리: fallback으로 기본 Object.entries 렌더링
      return (
        <>
          {Object.entries(details)
            .filter(
              ([, value]) => value !== null && value !== undefined && typeof value !== 'object'
            )
            .map(([key, value]) => (
              <DetailRow key={key} label={key} value={value} />
            ))}
        </>
      );
  }
}

/**
 * @deprecated CategoryDetails 컴포넌트를 사용하세요
 */
export function renderCategoryDetails(
  category: ApprovalCategory,
  details: Record<string, unknown>
): React.ReactNode {
  // Fallback: 하드코딩 라벨 (backward compat)
  const fallbackT: TFunc = (key: string) => {
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1];
    const fallbacks: Record<string, string> = {
      type: '요청 유형',
      managementNumber: '관리번호',
      equipmentName: '장비명',
      modelName: '모델명',
      serialNumber: '일련번호',
      manufacturer: '제조사',
      purchaseYear: '구입년도',
      specification: '장비사양',
      equipmentId: '장비 ID',
      calibrationDate: '교정일',
      nextCalibrationDate: '다음 교정일',
      calibrationResult: '교정 결과',
      calibrationOrganization: '교정 기관',
      certificateNumber: '성적서 번호',
      checkoutPurpose: '반출 목적',
      destination: '목적지',
      expectedReturnDate: '예상 반입일',
      reason: '사유',
      ncType: '부적합 유형',
      ncDescription: '부적합 내용',
      resolution: '처리 방법',
      cause: '원인',
      correctionContent: '조치 내용',
      correctionDate: '조치일',
      analysisContent: '분석 내용',
      actionPlan: '조치 계획',
      previousRejectionReason: '이전 반려 사유',
      rejectionDate: '반려일',
      disposalReason: '폐기 사유',
      disposalMethod: '폐기 방법',
      detailedReason: '상세 사유',
      reviewOpinion: '검토 의견',
      reviewDate: '검토일',
      softwareName: '소프트웨어명',
      softwareVersion: '버전',
      year: '연도',
      site: '사이트',
      changeReason: '변경 사유',
      equipment: '장비',
      inspectionDate: '점검 예정일',
      planPeriod: '교정 기간',
      planScope: '교정 범위',
      create: '등록',
      update: '수정',
      delete: '삭제',
    };
    return fallbacks[lastPart] || lastPart;
  };

  switch (category) {
    case 'equipment':
      return renderEquipmentDetails(details, fallbackT);
    case 'calibration':
      return renderCalibrationDetails(details, fallbackT);
    case 'outgoing':
    case 'incoming':
      return renderCheckoutDetails(details, fallbackT);
    case 'nonconformity':
      return renderNonConformityDetails(details, fallbackT);
    case 'disposal_review':
      return renderDisposalDetails(details, false, fallbackT);
    case 'disposal_final':
      return renderDisposalDetails(details, true, fallbackT);
    case 'plan_review':
    case 'plan_final':
      return renderPlanDetails(details, fallbackT);
    case 'software':
      return renderSoftwareDetails(details, fallbackT);
    case 'inspection':
      return renderInspectionDetails(details, fallbackT);
    default:
      return Object.entries(details)
        .filter(([, value]) => value !== null && value !== undefined && typeof value !== 'object')
        .map(([key, value]) => <DetailRow key={key} label={key} value={value} />);
  }
}
