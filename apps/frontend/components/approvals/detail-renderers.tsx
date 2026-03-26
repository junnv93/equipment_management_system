'use client';

import { useTranslations } from 'next-intl';
import {
  CALIBRATION_RESULT_LABELS,
  CHECKOUT_PURPOSE_LABELS,
  NON_CONFORMANCE_TYPE_LABELS,
  DISPOSAL_REASON_LABELS,
} from '@equipment-management/schemas';
import { TAB_META, REQUEST_TYPES, type ApprovalCategory } from '@/lib/api/approvals-api';
import { useDateFormatter } from '@/hooks/use-date-formatter';
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

function DateRow({
  label,
  value,
  fmtDate,
}: {
  label: string;
  value?: unknown;
  fmtDate: (date: string | Date) => string;
}) {
  if (!value || typeof value !== 'string') return null;
  return <DetailRow label={label} value={fmtDate(value)} />;
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
type FmtDate = (date: string | Date) => string;

/**
 * 카테고리 배지 컴포넌트
 */
export function CategoryBadge({ category }: { category: ApprovalCategory }) {
  const t = useTranslations('approvals');
  const meta = TAB_META[category];
  if (!meta) return null;
  return (
    <Badge variant="outline" className="text-xs">
      {t(meta.labelKey as Parameters<typeof t>[0])}
    </Badge>
  );
}

// ============================================================================
// 카테고리별 렌더러 (t 함수를 통해 i18n 적용)
// ============================================================================

/** 장비 등록/수정/삭제 */
function renderEquipmentDetails(details: Record<string, unknown>, t: TFunc) {
  const requestTypeLabels = Object.fromEntries(
    REQUEST_TYPES.map((key) => [key, t(`requestTypes.${key}` as Parameters<typeof t>[0])])
  );

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
function renderCalibrationDetails(details: Record<string, unknown>, t: TFunc, fmtDate: FmtDate) {
  return (
    <>
      <DetailRow label={t('detailRows.equipmentId')} value={details.equipmentId} />
      <DateRow
        label={t('detailRows.calibrationDate')}
        value={details.calibrationDate}
        fmtDate={fmtDate}
      />
      <DateRow
        label={t('detailRows.nextCalibrationDate')}
        value={details.nextCalibrationDate}
        fmtDate={fmtDate}
      />
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
function renderCheckoutDetails(details: Record<string, unknown>, t: TFunc, fmtDate: FmtDate) {
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
      <DateRow
        label={t('detailRows.expectedReturnDate')}
        value={details.expectedReturnDate}
        fmtDate={fmtDate}
      />
    </>
  );
}

/** 부적합 재개 */
function renderNonConformityDetails(details: Record<string, unknown>, t: TFunc, fmtDate: FmtDate) {
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
      <DateRow
        label={t('detailRows.correctionDate')}
        value={details.correctionDate}
        fmtDate={fmtDate}
      />
      <DetailRow label={t('detailRows.actionPlan')} value={details.actionPlan} />
      {details.rejectionReason && (
        <div className={`mt-2 pt-2 ${APPROVAL_TIMELINE_TOKENS.rejectionBorder}`}>
          <DetailRow
            label={t('detailRows.previousRejectionReason')}
            value={details.rejectionReason}
          />
          <DateRow
            label={t('detailRows.rejectionDate')}
            value={details.rejectedAt}
            fmtDate={fmtDate}
          />
        </div>
      )}
    </>
  );
}

/** 폐기 검토 / 최종 승인 */
function renderDisposalDetails(
  details: Record<string, unknown>,
  isFinal: boolean,
  t: TFunc,
  fmtDate: FmtDate
) {
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
        <DateRow label={t('detailRows.reviewDate')} value={details.reviewedAt} fmtDate={fmtDate} />
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
function renderInspectionDetails(details: Record<string, unknown>, t: TFunc, fmtDate: FmtDate) {
  const equipment = details.equipment as Record<string, unknown> | undefined;
  const equipmentName = equipment?.name;

  return (
    <>
      {equipmentName && <DetailRow label={t('detailRows.equipment')} value={equipmentName} />}
      <DateRow
        label={t('detailRows.inspectionDate')}
        value={details.nextIntermediateCheckDate}
        fmtDate={fmtDate}
      />
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
  const { fmtDate } = useDateFormatter();

  switch (category) {
    case 'equipment':
      return renderEquipmentDetails(details, t);
    case 'calibration':
      return renderCalibrationDetails(details, t, fmtDate);
    case 'outgoing':
    case 'incoming':
      return renderCheckoutDetails(details, t, fmtDate);
    case 'nonconformity':
      return renderNonConformityDetails(details, t, fmtDate);
    case 'disposal_review':
      return renderDisposalDetails(details, false, t, fmtDate);
    case 'disposal_final':
      return renderDisposalDetails(details, true, t, fmtDate);
    case 'plan_review':
    case 'plan_final':
      return renderPlanDetails(details, t);
    case 'software':
      return renderSoftwareDetails(details, t);
    case 'inspection':
      return renderInspectionDetails(details, t, fmtDate);
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
