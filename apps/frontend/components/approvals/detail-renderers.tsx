import {
  CALIBRATION_RESULT_LABELS,
  CHECKOUT_PURPOSE_LABELS,
  NON_CONFORMANCE_TYPE_LABELS,
  DISPOSAL_REASON_LABELS,
} from '@equipment-management/schemas';
import { TAB_META, type ApprovalCategory } from '@/lib/api/approvals-api';
import { formatDate } from '@/lib/utils/date';
import { Badge } from '@/components/ui/badge';

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
 * labels 맵에서 value를 찾아 한글 라벨로 변환, 없으면 원본 표시
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
// 카테고리별 렌더러
// ============================================================================

/** 장비 등록/수정/삭제 */
function renderEquipmentDetails(details: Record<string, unknown>) {
  const requestTypeLabels: Record<string, string> = {
    create: '등록',
    update: '수정',
    delete: '삭제',
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
      <LabeledRow label="요청 유형" value={requestType} labels={requestTypeLabels} />
      <DetailRow label="관리번호" value={managementNumber} />
      <DetailRow label="장비명" value={name} />
      <DetailRow label="모델명" value={modelName} />
      <DetailRow label="일련번호" value={serialNumber} />
      <DetailRow label="제조사" value={manufacturer} />
      <DetailRow label="구입년도" value={purchaseYear} />
      <DetailRow label="장비사양" value={description} />
    </>
  );
}

/** 교정 기록 */
function renderCalibrationDetails(details: Record<string, unknown>) {
  return (
    <>
      <DetailRow label="장비 ID" value={details.equipmentId} />
      <DateRow label="교정일" value={details.calibrationDate} />
      <DateRow label="다음 교정일" value={details.nextCalibrationDate} />
      <LabeledRow label="교정 결과" value={details.result} labels={CALIBRATION_RESULT_LABELS} />
      <DetailRow label="교정 기관" value={details.calibrationAgency} />
      <DetailRow label="성적서 번호" value={details.certificateNumber} />
    </>
  );
}

/** 반출 / 반입 / 공용장비 */
function renderCheckoutDetails(details: Record<string, unknown>) {
  // equipment 배열에서 장비 이름 목록 추출
  const equipmentList = details.equipment as Array<Record<string, unknown>> | undefined;
  const equipmentNames = equipmentList
    ?.map((e) => e.name || e.managementNumber)
    .filter(Boolean)
    .join(', ');

  return (
    <>
      {equipmentNames && <DetailRow label="장비" value={equipmentNames} />}
      <LabeledRow label="반출 목적" value={details.purpose} labels={CHECKOUT_PURPOSE_LABELS} />
      <DetailRow label="목적지" value={details.destination} />
      <DateRow label="예상 반입일" value={details.expectedReturnDate} />
    </>
  );
}

/** 부적합 재개 */
function renderNonConformityDetails(details: Record<string, unknown>) {
  return (
    <>
      <DetailRow label="장비 ID" value={details.equipmentId} />
      <LabeledRow label="부적합 유형" value={details.ncType} labels={NON_CONFORMANCE_TYPE_LABELS} />
      <DetailRow label="원인" value={details.cause} />
      <DetailRow label="조치 내용" value={details.correctionContent} />
      <DateRow label="조치일" value={details.correctionDate} />
      <DetailRow label="분석 내용" value={details.analysisContent} />
      <DetailRow label="조치 계획" value={details.actionPlan} />
      {details.rejectionReason && (
        <div className="mt-2 pt-2 border-t border-red-200">
          <DetailRow label="이전 반려 사유" value={details.rejectionReason} />
          <DateRow label="반려일" value={details.rejectedAt} />
        </div>
      )}
    </>
  );
}

/** 폐기 검토 / 최종 승인 */
function renderDisposalDetails(details: Record<string, unknown>, isFinal: boolean) {
  const eq = details.equipment as Record<string, unknown> | undefined;
  const equipmentLabel = eq
    ? `${eq.name || ''}${eq.managementNumber ? ` (${eq.managementNumber})` : ''}`
    : undefined;

  return (
    <>
      {equipmentLabel && <DetailRow label="장비" value={equipmentLabel} />}
      <LabeledRow label="폐기 사유" value={details.reason} labels={DISPOSAL_REASON_LABELS} />
      <DetailRow label="상세 사유" value={details.reasonDetail} />
      {isFinal && details.reviewOpinion && (
        <DetailRow label="검토 의견" value={details.reviewOpinion} />
      )}
      {isFinal && details.reviewedAt && <DateRow label="검토일" value={details.reviewedAt} />}
    </>
  );
}

/** 교정계획서 검토 / 최종 승인 */
function renderPlanDetails(details: Record<string, unknown>) {
  const site = details.site as Record<string, unknown> | undefined;
  const siteName = site?.name;

  return (
    <>
      <DetailRow label="연도" value={details.year} />
      <DetailRow label="사이트" value={siteName} />
    </>
  );
}

/** 소프트웨어 */
function renderSoftwareDetails(details: Record<string, unknown>) {
  return (
    <>
      <DetailRow label="소프트웨어명" value={details.softwareName} />
      <DetailRow label="변경 사유" value={details.changeReason || details.reason} />
    </>
  );
}

/** 중간점검 */
function renderInspectionDetails(details: Record<string, unknown>) {
  const equipment = details.equipment as Record<string, unknown> | undefined;
  const equipmentName = equipment?.name;

  return (
    <>
      {equipmentName && <DetailRow label="장비" value={equipmentName} />}
      <DateRow label="점검 예정일" value={details.nextIntermediateCheckDate} />
    </>
  );
}

// ============================================================================
// 진입점
// ============================================================================

/**
 * 카테고리별 상세 정보를 렌더링합니다.
 *
 * 각 카테고리의 details 구조에 맞게 한글 라벨과 SSOT 라벨을 적용합니다.
 */
export function renderCategoryDetails(
  category: ApprovalCategory,
  details: Record<string, unknown>
): React.ReactNode {
  switch (category) {
    case 'equipment':
      return renderEquipmentDetails(details);
    case 'calibration':
      return renderCalibrationDetails(details);
    case 'outgoing':
    case 'incoming':
      return renderCheckoutDetails(details);
    case 'nonconformity':
      return renderNonConformityDetails(details);
    case 'disposal_review':
      return renderDisposalDetails(details, false);
    case 'disposal_final':
      return renderDisposalDetails(details, true);
    case 'plan_review':
    case 'plan_final':
      return renderPlanDetails(details);
    case 'software':
      return renderSoftwareDetails(details);
    case 'inspection':
      return renderInspectionDetails(details);
    default:
      // 알 수 없는 카테고리: fallback으로 기본 Object.entries 렌더링
      return Object.entries(details)
        .filter(([, value]) => value !== null && value !== undefined && typeof value !== 'object')
        .map(([key, value]) => <DetailRow key={key} label={key} value={value} />);
  }
}
