'use client';

import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { differenceInDays } from 'date-fns';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  Wrench,
  FileText,
  LinkIcon,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Pencil,
} from 'lucide-react';
import nonConformancesApi, { type NonConformance } from '@/lib/api/non-conformances-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { NonConformanceCacheInvalidation } from '@/lib/api/cache-invalidation';
import NCEditDialog from '@/components/non-conformances/NCEditDialog';
import NCRepairDialog from '@/components/non-conformances/NCRepairDialog';
import { NCDocumentsSection } from '@/components/non-conformances/NCDocumentsSection';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Permission } from '@equipment-management/shared-constants';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import {
  type NonConformanceStatus,
  NonConformanceStatusValues as NCVal,
  getNCPrerequisite,
} from '@equipment-management/schemas';
import {
  getSemanticBadgeClasses,
  ncStatusToSemantic,
  NC_DETAIL_HEADER_TOKENS,
  NC_WORKFLOW_TOKENS,
  NC_WORKFLOW_STEPS,
  NC_STATUS_STEP_INDEX,
  getNCWorkflowNodeClasses,
  getNCWorkflowLabelClasses,
  getNCWorkflowConnectorClasses,
  NC_INFO_CARD_TOKENS,
  NC_REPAIR_LINKED_TOKENS,
  NC_COLLAPSIBLE_TOKENS,
  NC_COLLAPSIBLE_EDIT_TOKENS,
  NC_ACTION_BAR_TOKENS,
  NC_APPROVE_BUTTON_TOKENS,
  NC_REJECTION_ALERT_TOKENS,
  NC_URGENT_BADGE_TOKENS,
  NC_REPAIR_DETAIL_TOKENS,
  getNCElapsedDaysClasses,
  isNCLongOverdue,
  NC_INFO_NOTICE_TOKENS,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { resolveDisplayName } from '@/lib/utils/display-name';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ============================================================================
// 상수
// ============================================================================

/**
 * 워크플로우 스텝 아이콘 매핑
 * - open: AlertTriangle — 미결 경고
 * - corrected: CheckCircle2 — 조치 완료 (긍정)
 * - closed: Lock — 종결/잠금 (완료 확정). XCircle은 취소/오류 의미로 업계 표준과 충돌
 */
const NC_STEP_ICONS: Record<(typeof NC_WORKFLOW_STEPS)[number], typeof AlertTriangle> = {
  open: AlertTriangle,
  corrected: CheckCircle2,
  closed: Lock,
};

// ============================================================================
// Props
// ============================================================================

interface NCDetailClientProps {
  ncId: string;
  initialData: NonConformance;
}

// ============================================================================
// Main Component
// ============================================================================

export default function NCDetailClient({ ncId, initialData }: NCDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const canCloseNC = can(Permission.CLOSE_NON_CONFORMANCE);
  const { toast } = useToast();
  const { fmtDate } = useDateFormatter();
  const t = useTranslations('non-conformances');

  // State for dialogs
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRepairDialog, setShowRepairDialog] = useState(false);
  const [closureNotes, setClosureNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Collapsible state
  const [correctionOpen, setCorrectionOpen] = useState(true);
  const [closureOpen, setClosureOpen] = useState(false);

  // Collapsible edit mode
  const [editingCorrection, setEditingCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState('');

  // ✅ TanStack Query
  const { data: nc } = useQuery({
    queryKey: queryKeys.nonConformances.detail(ncId),
    queryFn: () => nonConformancesApi.getNonConformance(ncId),
    placeholderData: initialData,
    ...QUERY_CONFIG.NON_CONFORMANCES_DETAIL,
  });

  // ============================================================================
  // Mutations (must be called unconditionally before early returns)
  // ============================================================================

  // 상태 변경 (open→corrected)
  const updateMutation = useOptimisticMutation<
    NonConformance,
    { status: Exclude<NonConformanceStatus, 'closed'>; correctionContent?: string },
    NonConformance
  >({
    mutationFn: (vars) =>
      nonConformancesApi.updateNonConformance(ncId, {
        version: nc!.version,
        status: vars.status,
        correctionContent: vars.correctionContent,
        correctionDate:
          vars.status === NCVal.CORRECTED ? new Date().toISOString().split('T')[0] : undefined,
        // correctedBy는 서버에서 JWT로 추출 (Rule 2: 클라이언트 body 신뢰 금지)
      }),
    queryKey: queryKeys.nonConformances.detail(ncId),
    optimisticUpdate: (old, vars) => ({
      ...old!,
      status: vars.status,
      version: (old?.version ?? 0) + 1,
      // open→corrected 전환 시 날짜를 즉시 채워 StepDate 깜빡임 방지 (서버는 correctedBy를 JWT로 설정)
      ...(vars.status === NCVal.CORRECTED && {
        correctionDate: new Date().toISOString().split('T')[0],
      }),
    }),
    // invalidateKeys 비움 — onSuccessCallback의 invalidateAfterStatusChange가 NC lists 포함 교차 무효화 단일 처리
    invalidateKeys: [],
    successMessage: t('toasts.statusChangeSuccess'),
    errorMessage: t('toasts.statusChangeError'),
    onSuccessCallback: () => {
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        ncId,
        nc!.equipmentId
      );
    },
  });

  // 내용 저장 (조치 — 상태 변경 없이)
  const saveMutation = useOptimisticMutation<
    NonConformance,
    { correctionContent?: string },
    NonConformance
  >({
    mutationFn: (vars) =>
      nonConformancesApi.updateNonConformance(ncId, {
        version: nc!.version,
        ...vars,
      }),
    queryKey: queryKeys.nonConformances.detail(ncId),
    optimisticUpdate: (old, vars) => ({
      ...old!,
      ...vars,
      version: (old?.version ?? 0) + 1,
    }),
    invalidateKeys: [queryKeys.nonConformances.lists()],
    successMessage: t('toasts.saveSuccess'),
    errorMessage: t('toasts.saveError'),
    onSuccessCallback: () => {
      setEditingCorrection(false);
    },
  });

  // 종결
  const closeMutation = useOptimisticMutation<
    NonConformance,
    { closureNotes?: string },
    NonConformance
  >({
    mutationFn: (vars) =>
      nonConformancesApi.closeNonConformance(ncId, {
        version: nc!.version,
        closureNotes: vars.closureNotes,
      }),
    queryKey: queryKeys.nonConformances.detail(ncId),
    optimisticUpdate: (old) => ({
      ...old!,
      status: NCVal.CLOSED as NonConformanceStatus,
      version: (old?.version ?? 0) + 1,
    }),
    invalidateKeys: [],
    successMessage: t('toasts.closureSuccess'),
    errorMessage: t('toasts.closureError'),
    onSuccessCallback: () => {
      setShowCloseDialog(false);
      setClosureNotes('');
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        ncId,
        nc!.equipmentId
      );
    },
  });

  // 반려
  const rejectMutation = useOptimisticMutation<
    NonConformance,
    { rejectionReason: string },
    NonConformance
  >({
    mutationFn: (vars) =>
      nonConformancesApi.rejectCorrection(ncId, {
        version: nc!.version,
        rejectionReason: vars.rejectionReason,
      }),
    queryKey: queryKeys.nonConformances.detail(ncId),
    optimisticUpdate: (old) => ({
      ...old!,
      status: NCVal.OPEN as NonConformanceStatus,
      version: (old?.version ?? 0) + 1,
    }),
    invalidateKeys: [],
    successMessage: t('toasts.rejectionSuccess'),
    errorMessage: t('toasts.rejectionError'),
    onSuccessCallback: () => {
      setShowRejectDialog(false);
      setRejectionReason('');
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        ncId,
        nc!.equipmentId
      );
    },
  });

  if (!nc) return null;

  const currentStepIndex = NC_STATUS_STEP_INDEX[nc.status] ?? 0;
  const elapsedDays = nc.discoveryDate
    ? differenceInDays(new Date(), new Date(nc.discoveryDate))
    : 0;
  const longOverdue = isNCLongOverdue(elapsedDays);
  const isClosed = nc.status === NCVal.CLOSED;
  const prerequisite = getNCPrerequisite(nc.ncType);
  const needsRepair = prerequisite === 'repair' && !nc.repairHistoryId;
  const needsRecalibration = prerequisite === 'recalibration' && !nc.calibrationId;
  const hasUnmetPrerequisite = needsRepair || needsRecalibration;

  /** 조치 편집 시작 */
  const startEditCorrection = () => {
    setCorrectionText(nc.correctionContent ?? '');
    setEditingCorrection(true);
    setCorrectionOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className={NC_DETAIL_HEADER_TOKENS.container}>
        <div>
          <div className={NC_DETAIL_HEADER_TOKENS.titleArea}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('detail.backButton')}
              className="h-8 w-8"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className={NC_DETAIL_HEADER_TOKENS.title}>{t('detail.title')}</h1>
            <span className={getSemanticBadgeClasses(ncStatusToSemantic(nc.status))}>
              {t('ncStatus.' + nc.status)}
            </span>
            {longOverdue && !isClosed && (
              <span className={NC_URGENT_BADGE_TOKENS.badge}>{t('detail.urgentBadge')}</span>
            )}
          </div>
          <div className={NC_DETAIL_HEADER_TOKENS.meta}>
            {nc.equipment && (
              <Link
                href={`/equipment/${nc.equipmentId}`}
                className="text-brand-info hover:underline"
              >
                {nc.equipment.name} ({nc.equipment.managementNumber})
              </Link>
            )}
            <span>·</span>
            <span>{t('detail.discoveryDateLabel', { date: fmtDate(nc.discoveryDate) })}</span>
            {!isClosed && (
              <>
                <span>·</span>
                <span className={getNCElapsedDaysClasses(elapsedDays)}>
                  {t('detail.elapsedDays', { days: elapsedDays })}
                </span>
              </>
            )}
          </div>
        </div>
        <div className={NC_DETAIL_HEADER_TOKENS.actionsGroup}>
          {!isClosed && nc.status === 'open' && canCloseNC && (
            <Button variant="ghost" size="sm" onClick={() => setShowEditDialog(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              {t('detail.editButton')}
            </Button>
          )}
          <Link href="/non-conformances">
            <Button variant="outline" size="sm">
              {t('detail.listButton')}
            </Button>
          </Link>
        </div>
      </div>

      {/* 반려 알림 */}
      {nc.rejectionReason && nc.status === NCVal.OPEN && (
        <div className={NC_REJECTION_ALERT_TOKENS.container}>
          <XCircle className={NC_REJECTION_ALERT_TOKENS.icon} />
          <div>
            <p className={NC_REJECTION_ALERT_TOKENS.title}>{t('detail.rejectionAlert.title')}</p>
            <p className={NC_REJECTION_ALERT_TOKENS.description}>{nc.rejectionReason}</p>
            {nc.rejectedAt && (
              <p className={NC_REJECTION_ALERT_TOKENS.date}>
                {t('detail.rejectionAlert.rejectedAt', { date: fmtDate(nc.rejectedAt) })}
                {nc.rejector && t('detail.rejectionAlert.rejectedBy', { name: nc.rejector.name })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 워크플로우 타임라인 */}
      <WorkflowTimeline
        nc={nc}
        currentStepIndex={currentStepIndex}
        isLongOverdue={longOverdue && !isClosed}
      />

      {/* 전제조건 미충족 안내 */}
      {hasUnmetPrerequisite && !isClosed && (
        <div className={NC_INFO_NOTICE_TOKENS.container}>
          <div className="flex items-start gap-3">
            <Wrench className={NC_INFO_NOTICE_TOKENS.icon} />
            <div>
              <p className={NC_INFO_NOTICE_TOKENS.text}>
                {t('detail.prerequisite.typeNotice', { type: t('ncType.' + nc.ncType) })}{' '}
                {needsRepair
                  ? t('detail.prerequisite.repairNeeded')
                  : t('detail.prerequisite.recalibrationNeeded')}
              </p>
              {needsRepair ? (
                <button
                  type="button"
                  className="text-sm text-brand-info hover:underline mt-1 inline-block"
                  onClick={() => setShowRepairDialog(true)}
                >
                  {t('detail.prerequisite.repairLink')}
                </button>
              ) : (
                <Link
                  href={`/equipment/${nc.equipmentId}?tab=calibration`}
                  className="text-sm text-brand-info hover:underline mt-1 inline-block"
                >
                  {t('detail.prerequisite.recalibrationLink')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 정보 카드 */}
      <InfoCards nc={nc} onRepairRegister={() => setShowRepairDialog(true)} />

      {/* 조치/종결 섹션 */}
      <CollapsibleSection
        title={'🔧 ' + t('detail.correction.sectionTitle')}
        isOpen={correctionOpen}
        onToggle={() => setCorrectionOpen(!correctionOpen)}
        canEdit={nc.status === NCVal.OPEN && !isClosed}
        isEditing={editingCorrection}
        onEdit={startEditCorrection}
      >
        {editingCorrection ? (
          <div>
            <textarea
              className={NC_COLLAPSIBLE_EDIT_TOKENS.textarea}
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              placeholder={t('detail.correction.placeholder')}
              rows={4}
            />
            <div className={NC_COLLAPSIBLE_EDIT_TOKENS.saveRow}>
              <Button variant="ghost" size="sm" onClick={() => setEditingCorrection(false)}>
                {t('detail.correction.cancel')}
              </Button>
              <Button
                size="sm"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate({ correctionContent: correctionText })}
              >
                {t('detail.correction.save')}
              </Button>
            </div>
          </div>
        ) : nc.correctionContent ? (
          <div>
            <p className={NC_COLLAPSIBLE_TOKENS.fieldValue}>{nc.correctionContent}</p>
            {nc.correctionDate && (
              <p className={NC_COLLAPSIBLE_TOKENS.fieldMeta}>
                {t('detail.correction.dateLabel', { date: fmtDate(nc.correctionDate) })}
                {nc.corrector && t('detail.correction.actorLabel', { name: nc.corrector.name })}
              </p>
            )}
          </div>
        ) : (
          <div className={NC_COLLAPSIBLE_TOKENS.emptyState}>
            <FileText className={NC_COLLAPSIBLE_TOKENS.emptyStateIcon} />
            <p className={NC_COLLAPSIBLE_TOKENS.emptyStateText}>{t('detail.correction.empty')}</p>
          </div>
        )}
      </CollapsibleSection>

      {(nc.closureNotes || isClosed) && (
        <CollapsibleSection
          title={'✅ ' + t('detail.closure.sectionTitle')}
          isOpen={closureOpen}
          onToggle={() => setClosureOpen(!closureOpen)}
        >
          {nc.closureNotes ? (
            <div>
              <p className={NC_COLLAPSIBLE_TOKENS.fieldValue}>{nc.closureNotes}</p>
              {nc.closedAt && (
                <p className={NC_COLLAPSIBLE_TOKENS.fieldMeta}>
                  {t('detail.closure.dateLabel', { date: fmtDate(nc.closedAt) })}
                  {nc.closer && t('detail.closure.actorLabel', { name: nc.closer.name })}
                </p>
              )}
            </div>
          ) : (
            <div className={NC_COLLAPSIBLE_TOKENS.emptyState}>
              <CheckCircle2 className={NC_COLLAPSIBLE_TOKENS.emptyStateIcon} />
              <p className={NC_COLLAPSIBLE_TOKENS.emptyStateText}>{t('detail.closure.empty')}</p>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* 첨부 문서 (현장 사진 등) */}
      <NCDocumentsSection nonConformanceId={nc.id} />

      {/* 액션 바 */}
      {!isClosed && (
        <ActionBar
          nc={nc}
          canCloseNC={canCloseNC}
          hasUnmetPrerequisite={hasUnmetPrerequisite}
          prerequisiteMessage={
            needsRepair
              ? t('detail.prerequisite.repairBlocked')
              : needsRecalibration
                ? t('detail.prerequisite.recalibrationBlocked')
                : undefined
          }
          onMarkCorrected={() => updateMutation.mutate({ status: NCVal.CORRECTED })}
          onClose={() => setShowCloseDialog(true)}
          onReject={() => setShowRejectDialog(true)}
          isUpdating={updateMutation.isPending}
        />
      )}

      {/* 종결 다이얼로그 */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('detail.dialog.closeTitle')}</DialogTitle>
            <DialogDescription>{t('detail.dialog.closeDescription')}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t('detail.dialog.closeNotesPlaceholder')}
            value={closureNotes}
            onChange={(e) => setClosureNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              {t('detail.dialog.closeCancel')}
            </Button>
            <Button
              className={NC_APPROVE_BUTTON_TOKENS.approve}
              onClick={() => closeMutation.mutate({ closureNotes })}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending
                ? t('detail.dialog.closeProcessing')
                : t('detail.dialog.closeSubmit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반려 다이얼로그 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('detail.dialog.rejectTitle')}</DialogTitle>
            <DialogDescription>{t('detail.dialog.rejectDescription')}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t('detail.dialog.rejectReasonPlaceholder')}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t('detail.dialog.rejectCancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!rejectionReason.trim()) {
                  toast({ title: t('toasts.rejectionReasonRequired'), variant: 'destructive' });
                  return;
                }
                rejectMutation.mutate({ rejectionReason });
              }}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending
                ? t('detail.dialog.rejectProcessing')
                : t('detail.dialog.rejectSubmit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NC 편집 다이얼로그 */}
      {nc && <NCEditDialog nc={nc} open={showEditDialog} onOpenChange={setShowEditDialog} />}

      {/* 수리이력 등록 다이얼로그 */}
      {nc && needsRepair && (
        <NCRepairDialog nc={nc} open={showRepairDialog} onOpenChange={setShowRepairDialog} />
      )}
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * 4단계 수평 워크플로우 타임라인
 */
function WorkflowTimeline({
  nc,
  currentStepIndex,
  isLongOverdue,
}: {
  nc: NonConformance;
  currentStepIndex: number;
  isLongOverdue: boolean;
}) {
  const t = useTranslations('non-conformances');
  const workflowLabels: Record<(typeof NC_WORKFLOW_STEPS)[number], string> = {
    open: t('detail.workflow.open'),
    corrected: t('detail.workflow.corrected'),
    closed: t('detail.workflow.closed'),
  };

  return (
    <div
      className={cn(
        NC_WORKFLOW_TOKENS.container,
        isLongOverdue && NC_WORKFLOW_TOKENS.containerUrgent
      )}
    >
      {/* flex sibling 패턴: 커넥터가 step div 밖 flex item — 절대 포지셔닝/z-index 전쟁 없음 */}
      <div className={NC_WORKFLOW_TOKENS.stepsLayout}>
        {NC_WORKFLOW_STEPS.map((stepKey: NonConformanceStatus, idx: number) => {
          const Icon = NC_STEP_ICONS[stepKey];
          return (
            <Fragment key={stepKey}>
              {/* 커넥터 — step div 밖 flex sibling (mt-5 = 노드 h-10 중심 맞춤) */}
              {idx > 0 && (
                <div className={getNCWorkflowConnectorClasses(idx - 1, currentStepIndex)} />
              )}
              {/* 스텝 */}
              <div className={NC_WORKFLOW_TOKENS.step}>
                {/* 노드 */}
                <div className={getNCWorkflowNodeClasses(idx, currentStepIndex, isLongOverdue)}>
                  {idx < currentStepIndex ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {/* 라벨 */}
                <span className={getNCWorkflowLabelClasses(idx, currentStepIndex, isLongOverdue)}>
                  {workflowLabels[stepKey]}
                </span>
                {/* 날짜 */}
                <StepDate nc={nc} stepKey={stepKey} />
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

/** 스텝별 날짜 표시 */
function StepDate({ nc, stepKey }: { nc: NonConformance; stepKey: NonConformanceStatus }) {
  const { fmtDate } = useDateFormatter();
  let dateStr: string | null = null;
  let actor: string | null = null;

  switch (stepKey) {
    case NCVal.OPEN:
      dateStr = nc.discoveryDate;
      actor = resolveDisplayName(nc.discoverer?.name, nc.discoveredBy);
      break;
    case NCVal.CORRECTED:
      dateStr = nc.correctionDate;
      actor = resolveDisplayName(nc.corrector?.name, nc.correctedBy);
      break;
    case NCVal.CLOSED:
      dateStr = nc.closedAt;
      actor = resolveDisplayName(nc.closer?.name, nc.closedBy);
      break;
  }

  if (!dateStr) return null;

  return (
    <>
      {dateStr && <span className={NC_WORKFLOW_TOKENS.date}>{fmtDate(dateStr)}</span>}
      {actor && <span className={NC_WORKFLOW_TOKENS.actor}>{actor}</span>}
    </>
  );
}

/**
 * 정보 카드 (2-column)
 */
function InfoCards({ nc, onRepairRegister }: { nc: NonConformance; onRepairRegister: () => void }) {
  const { fmtDate } = useDateFormatter();
  const t = useTranslations('non-conformances');
  const hasRepairLink = !!nc.repairHistoryId;
  const prerequisiteType = getNCPrerequisite(nc.ncType);
  const needsRepair = prerequisiteType === 'repair';

  return (
    <div className={NC_INFO_CARD_TOKENS.grid}>
      {/* 기본 정보 */}
      <div className={NC_INFO_CARD_TOKENS.card}>
        <h3 className={NC_INFO_CARD_TOKENS.cardTitle}>{t('detail.infoCard.basicInfo')}</h3>
        <InfoRow label={t('fields.type')} value={t('ncType.' + nc.ncType)} />
        <InfoRow
          label={t('fields.discoverer')}
          value={resolveDisplayName(nc.discoverer?.name, nc.discoveredBy)}
        />
        <InfoRow label={t('fields.discoveredAt')} value={fmtDate(nc.discoveryDate)} />
        <div className={NC_INFO_CARD_TOKENS.infoRowVertical}>
          <span className={NC_INFO_CARD_TOKENS.infoLabel}>{t('fields.cause')}</span>
          <p className={NC_INFO_CARD_TOKENS.infoValueMultiline}>{nc.cause}</p>
        </div>
        {nc.actionPlan && (
          <div className={NC_INFO_CARD_TOKENS.infoRowVertical}>
            <span className={NC_INFO_CARD_TOKENS.infoLabel}>{t('fields.actionPlan')}</span>
            <p className={NC_INFO_CARD_TOKENS.infoValueMultiline}>{nc.actionPlan}</p>
          </div>
        )}
      </div>

      {/* 수리 연결 */}
      <div
        className={cn(
          NC_INFO_CARD_TOKENS.card,
          hasRepairLink
            ? NC_INFO_CARD_TOKENS.repairLinkedCard
            : needsRepair
              ? NC_INFO_CARD_TOKENS.repairNeededCard
              : ''
        )}
      >
        <h3
          className={cn(
            NC_INFO_CARD_TOKENS.cardTitle,
            hasRepairLink
              ? NC_INFO_CARD_TOKENS.repairLinkedTitle
              : needsRepair
                ? NC_INFO_CARD_TOKENS.repairNeededTitle
                : ''
          )}
        >
          {hasRepairLink
            ? t('detail.infoCard.repairLinked')
            : needsRepair
              ? t('detail.infoCard.repairNeeded')
              : t('detail.infoCard.repairCard')}
        </h3>
        {hasRepairLink ? (
          <RepairDetail nc={nc} />
        ) : needsRepair ? (
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('detail.infoCard.repairNeededDescription', { type: t('ncType.' + nc.ncType) })}
            </p>
            <button
              type="button"
              className="text-sm text-brand-info hover:underline inline-flex items-center gap-1"
              onClick={onRepairRegister}
            >
              <Wrench className="h-3.5 w-3.5" />
              {t('detail.infoCard.repairRegisterLink')}
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            {t('detail.infoCard.repairNotNeeded')}
          </p>
        )}

        {/* 추가 메타 */}
        <div className="mt-4 pt-3 border-t border-border/40">
          <InfoRow label={t('fields.createdAt')} value={fmtDate(nc.createdAt)} />
          <InfoRow label={t('fields.updatedAt')} value={fmtDate(nc.updatedAt)} />
          <InfoRow label={t('fields.version')} value={String(nc.version)} />
        </div>
      </div>
    </div>
  );
}

/** 수리 이력 상세 */
function RepairDetail({ nc }: { nc: NonConformance }) {
  const { fmtDate } = useDateFormatter();
  const t = useTranslations('non-conformances');
  const rh = nc.repairHistory;
  if (!rh) {
    return (
      <div className="flex items-center gap-2 py-2">
        <LinkIcon className="h-4 w-4 text-brand-ok" />
        <span className={NC_REPAIR_LINKED_TOKENS.badge}>
          {t('detail.infoCard.repairLinkedBadge')}
        </span>
      </div>
    );
  }

  const resultBadgeClass = rh.repairResult
    ? (NC_REPAIR_DETAIL_TOKENS.repairResultBadge[
        rh.repairResult as keyof typeof NC_REPAIR_DETAIL_TOKENS.repairResultBadge
      ] ?? NC_REPAIR_DETAIL_TOKENS.repairResultBadge.completed)
    : null;

  return (
    <div className="py-2 space-y-1">
      <div className={NC_REPAIR_DETAIL_TOKENS.row}>
        <span className={NC_REPAIR_DETAIL_TOKENS.label}>{t('detail.infoCard.repairDate')}</span>
        <span className={NC_REPAIR_DETAIL_TOKENS.value}>{fmtDate(rh.repairDate)}</span>
      </div>
      {rh.repairResult && resultBadgeClass && (
        <div className={NC_REPAIR_DETAIL_TOKENS.row}>
          <span className={NC_REPAIR_DETAIL_TOKENS.label}>{t('detail.infoCard.repairResult')}</span>
          <span className={resultBadgeClass}>
            {t(`detail.infoCard.repairResults.${rh.repairResult}` as Parameters<typeof t>[0])}
          </span>
        </div>
      )}
      <div className="pt-1">
        <span className={cn(NC_REPAIR_DETAIL_TOKENS.label, 'block mb-1')}>
          {t('detail.infoCard.repairDescription')}
        </span>
        <p className="text-sm text-foreground leading-relaxed">{rh.repairDescription}</p>
      </div>
    </div>
  );
}

/** 정보 행 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={NC_INFO_CARD_TOKENS.infoRow}>
      <span className={NC_INFO_CARD_TOKENS.infoLabel}>{label}</span>
      <span className={NC_INFO_CARD_TOKENS.infoValue}>{value}</span>
    </div>
  );
}

/**
 * Collapsible 섹션
 */
function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  canEdit,
  isEditing,
  onEdit,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  canEdit?: boolean;
  isEditing?: boolean;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations('non-conformances');
  return (
    <div className={NC_COLLAPSIBLE_TOKENS.container}>
      <div className="flex items-center">
        <button
          type="button"
          className={cn(NC_COLLAPSIBLE_TOKENS.trigger, 'flex-1')}
          onClick={onToggle}
        >
          <span>{title}</span>
          {isOpen ? (
            <ChevronUp className={cn('h-4 w-4', NC_COLLAPSIBLE_TOKENS.triggerIcon)} />
          ) : (
            <ChevronDown className={cn('h-4 w-4', NC_COLLAPSIBLE_TOKENS.triggerIcon)} />
          )}
        </button>
        {canEdit && !isEditing && onEdit && (
          <Button variant="ghost" size="sm" className="h-7 px-2 mr-2" onClick={onEdit}>
            <Pencil className="h-3 w-3 mr-1" />
            {t('detail.actionBar.edit')}
          </Button>
        )}
      </div>
      {isOpen && <div className={NC_COLLAPSIBLE_TOKENS.content}>{children}</div>}
    </div>
  );
}

/**
 * 액션 바
 */
function ActionBar({
  nc,
  canCloseNC,
  hasUnmetPrerequisite,
  prerequisiteMessage,
  onMarkCorrected,
  onClose,
  onReject,
  isUpdating,
}: {
  nc: NonConformance;
  canCloseNC: boolean;
  hasUnmetPrerequisite: boolean;
  prerequisiteMessage?: string;
  onMarkCorrected: () => void;
  onClose: () => void;
  onReject: () => void;
  isUpdating: boolean;
}) {
  const t = useTranslations('non-conformances');
  return (
    <div className={NC_ACTION_BAR_TOKENS.container}>
      <div className={NC_ACTION_BAR_TOKENS.left}>
        {/* 시험실무자 액션 */}
        {nc.status === NCVal.OPEN && (
          <Button
            size="sm"
            onClick={onMarkCorrected}
            disabled={isUpdating || hasUnmetPrerequisite}
            title={hasUnmetPrerequisite ? prerequisiteMessage : undefined}
          >
            {t('detail.actionBar.markCorrected')}
          </Button>
        )}
        <span className={NC_ACTION_BAR_TOKENS.roleHint}>
          {nc.status === NCVal.OPEN &&
            (hasUnmetPrerequisite
              ? prerequisiteMessage
              : t('detail.actionBar.hintNeedsCorrectionApproval'))}
          {nc.status === NCVal.CORRECTED &&
            !canCloseNC &&
            t('detail.actionBar.hintWaitingApproval')}
        </span>
      </div>
      <div className={NC_ACTION_BAR_TOKENS.right}>
        {/* 기술책임자 액션 (corrected 상태만) */}
        {canCloseNC && nc.status === NCVal.CORRECTED && (
          <>
            <Button variant="outline" size="sm" onClick={onReject} disabled={isUpdating}>
              <X className="h-3.5 w-3.5 mr-1" />
              {t('detail.actionBar.reject')}
            </Button>
            <Button
              size="sm"
              className={NC_APPROVE_BUTTON_TOKENS.approve}
              onClick={onClose}
              disabled={isUpdating || hasUnmetPrerequisite}
              title={hasUnmetPrerequisite ? prerequisiteMessage : undefined}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {t('detail.actionBar.closureApprove')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
