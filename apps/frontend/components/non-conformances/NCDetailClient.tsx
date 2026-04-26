'use client';

import { useState, useRef, useCallback, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useCasGuardedMutation } from '@/hooks/use-cas-guarded-mutation';
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
  CalendarCheck,
} from 'lucide-react';
import nonConformancesApi, { type NonConformance } from '@/lib/api/non-conformances-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { NonConformanceCacheInvalidation } from '@/lib/api/cache-invalidation';
import NCEditDialog from '@/components/non-conformances/NCEditDialog';
import NCRepairDialog from '@/components/non-conformances/NCRepairDialog';
import { NCDocumentsSection } from '@/components/non-conformances/NCDocumentsSection';
import { GuidanceCallout } from '@/components/non-conformances/GuidanceCallout';
import { EmptyState } from '@/components/shared/EmptyState';
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
  URGENT_BADGE_TOKENS,
  NC_REPAIR_DETAIL_TOKENS,
  getNCElapsedDaysClasses,
  isNCLongOverdue,
  NC_SPACING_TOKENS,
  ANIMATION_PRESETS,
  getStaggerFadeInStyle,
} from '@/lib/design-tokens';
import { deriveGuidance } from '@/lib/non-conformances/guidance';
import { getNCMessageKey } from '@/lib/i18n/get-nc-message-key';
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
  // 헤더 편집 버튼도 canCloseNC와 동일 경계 사용 — UL-QP-18 §14: 기술책임자만 NC 전체 수정 가능
  const canEditNC = canCloseNC;
  // calibrationLink CTA는 CREATE_CALIBRATION 보유자(시험실무자/기술책임자)에게만 표시
  // quality_manager는 canCloseNC=false → operator guidance 받지만 CREATE_CALIBRATION 없음
  const canCreateCalibration = can(Permission.CREATE_CALIBRATION);
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

  const fetchNcVersion = () => nonConformancesApi.getNonConformance(ncId).then((r) => r.version);
  // VERSION_CONFLICT(409)는 useCasGuardedMutation 내부에서 isConflictError로 처리됨.
  // onError는 비-충돌 에러만 수신하므로 중복 처리 불필요.

  // 상태 변경 (open→corrected)
  const updateMutation = useCasGuardedMutation<
    NonConformance,
    { status: Exclude<NonConformanceStatus, 'closed'>; correctionContent?: string }
  >({
    fetchCasVersion: fetchNcVersion,
    mutationFn: (vars, casVersion) =>
      nonConformancesApi.updateNonConformance(ncId, {
        version: casVersion,
        status: vars.status,
        correctionContent: vars.correctionContent,
        correctionDate:
          vars.status === NCVal.CORRECTED ? new Date().toISOString().split('T')[0] : undefined,
        // correctedBy는 서버에서 JWT로 추출 (Rule 2: 클라이언트 body 신뢰 금지)
      }),
    onSuccess: (data) => {
      toast({ title: t('toasts.statusChangeSuccess') });
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        ncId,
        data.equipmentId
      );
    },
    onError: () => {
      toast({ title: t('toasts.statusChangeError'), variant: 'destructive' });
    },
  });

  // 내용 저장 (조치 — 상태 변경 없이)
  const saveMutation = useCasGuardedMutation<NonConformance, { correctionContent?: string }>({
    fetchCasVersion: fetchNcVersion,
    mutationFn: (vars, casVersion) =>
      nonConformancesApi.updateNonConformance(ncId, { version: casVersion, ...vars }),
    onSuccess: () => {
      toast({ title: t('toasts.saveSuccess') });
      setEditingCorrection(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.nonConformances.lists() });
    },
    onError: () => {
      toast({ title: t('toasts.saveError'), variant: 'destructive' });
    },
  });

  // 종결
  const closeMutation = useCasGuardedMutation<NonConformance, { closureNotes?: string }>({
    fetchCasVersion: fetchNcVersion,
    mutationFn: (vars, casVersion) =>
      nonConformancesApi.closeNonConformance(ncId, {
        version: casVersion,
        closureNotes: vars.closureNotes,
      }),
    onSuccess: (data) => {
      toast({ title: t('toasts.closureSuccess') });
      setShowCloseDialog(false);
      setClosureNotes('');
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        ncId,
        data.equipmentId
      );
    },
    onError: () => {
      toast({ title: t('toasts.closureError'), variant: 'destructive' });
    },
  });

  // 반려
  const rejectMutation = useCasGuardedMutation<NonConformance, { rejectionReason: string }>({
    fetchCasVersion: fetchNcVersion,
    mutationFn: (vars, casVersion) =>
      nonConformancesApi.rejectCorrection(ncId, {
        version: casVersion,
        rejectionReason: vars.rejectionReason,
      }),
    onSuccess: (data) => {
      toast({ title: t('toasts.rejectionSuccess') });
      setShowRejectDialog(false);
      setRejectionReason('');
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        ncId,
        data.equipmentId
      );
    },
    onError: () => {
      toast({ title: t('toasts.rejectionError'), variant: 'destructive' });
    },
  });

  // ── 훅: early return 이전에 선언 (Rules of Hooks) ──
  const actionBarRef = useRef<HTMLDivElement>(null);

  const scrollToActionBar = useCallback(() => {
    if (!actionBarRef.current) return;
    const rect = actionBarRef.current.getBoundingClientRect();
    const stickyHeaderHeight = parseFloat(
      document.documentElement.style.getPropertyValue('--sticky-header-height') || '0'
    );
    window.scrollBy({ top: rect.top - stickyHeaderHeight - 12, behavior: 'smooth' });
  }, []);

  const guidance = useMemo(
    () => (nc ? deriveGuidance(nc, canCloseNC, canCreateCalibration) : null),
    [nc, canCloseNC, canCreateCalibration]
  );

  if (!nc) return null;

  const currentStepIndex = NC_STATUS_STEP_INDEX[nc.status] ?? 0;
  const elapsedDays = nc.discoveryDate
    ? differenceInDays(new Date(), new Date(nc.discoveryDate))
    : 0;
  const longOverdue = isNCLongOverdue(elapsedDays);
  const isClosed = nc.status === NCVal.CLOSED;
  const { needsRepair, needsRecalibration } = guidance!;
  const hasUnmetPrerequisite = needsRepair || needsRecalibration;

  const workflowLabels: Record<(typeof NC_WORKFLOW_STEPS)[number], string> = {
    open: t('detail.workflow.open'),
    corrected: t('detail.workflow.corrected'),
    closed: t('detail.workflow.closed'),
  };

  const workflowStepDates: Record<(typeof NC_WORKFLOW_STEPS)[number], string | null> = {
    open: nc.discoveryDate ? fmtDate(nc.discoveryDate) : null,
    corrected: nc.correctionDate ? fmtDate(nc.correctionDate) : null,
    closed: nc.closedAt ? fmtDate(nc.closedAt) : null,
  };

  const workflowSteps = NC_WORKFLOW_STEPS.map((stepKey, idx) => ({
    label: workflowLabels[stepKey],
    isCurrent: idx === currentStepIndex,
    date: workflowStepDates[stepKey] ?? undefined,
  }));

  /** 조치 편집 시작 */
  const startEditCorrection = () => {
    setCorrectionText(nc.correctionContent ?? '');
    setEditingCorrection(true);
    setCorrectionOpen(true);
  };

  return (
    <div className={NC_SPACING_TOKENS.detail.pageWrapper}>
      {/* ── 상태 그룹: 헤더·반려알림·타임라인·가이던스 ── */}
      <section className={NC_SPACING_TOKENS.detail.statusGroup}>
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
                <span className={URGENT_BADGE_TOKENS.solid}>{t('detail.urgentBadge')}</span>
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
            {!isClosed && nc.status === NCVal.OPEN && canEditNC && (
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

        {/* 워크플로우 + 가이던스: closed면 Timeline full, 미완료면 Callout(mini progress 통합) */}
        {isClosed ? (
          <WorkflowTimeline nc={nc} currentStepIndex={currentStepIndex} isLongOverdue={false} />
        ) : (
          <GuidanceCallout
            guidanceKey={guidance!.key}
            workflowSteps={workflowSteps}
            isLongOverdue={longOverdue}
            onScrollToAction={scrollToActionBar}
            onRepairRegister={() => setShowRepairDialog(true)}
            onCalibrationNav={
              canCreateCalibration
                ? () => router.push(`/calibration/register?equipmentId=${nc.equipmentId}`)
                : undefined
            }
          />
        )}
      </section>

      {/* ── 컨텍스트 그룹: 정보카드·조치·종결·문서 ── */}
      <section
        className={cn(
          NC_SPACING_TOKENS.detail.contextGroup,
          NC_SPACING_TOKENS.detail.statusToContextGap
        )}
      >
        {/* 정보 카드 */}
        <div
          className={ANIMATION_PRESETS.staggerFadeInItem}
          style={getStaggerFadeInStyle(0, 'section')}
        >
          <InfoCards
            nc={nc}
            onRepairRegister={() => setShowRepairDialog(true)}
            onCalibrationRegister={() =>
              router.push(`/calibration/register?equipmentId=${nc.equipmentId}`)
            }
            onCalibrationView={() => router.push(`/equipment/${nc.equipmentId}?tab=calibration`)}
          />
        </div>

        {/* 조치 섹션 */}
        <div
          className={ANIMATION_PRESETS.staggerFadeInItem}
          style={getStaggerFadeInStyle(1, 'section')}
        >
          <CollapsibleSection
            contentId="nc-correction-section"
            title={
              <>
                <Wrench className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {t('detail.correction.sectionTitle')}
              </>
            }
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
              <EmptyState
                variant="no-data"
                icon={FileText}
                title={t('detail.correction.emptyTitle')}
                description={t('detail.correction.empty')}
                canAct={canEditNC}
                primaryAction={
                  !hasUnmetPrerequisite && nc.status === NCVal.OPEN
                    ? { label: t('detail.correction.addAction'), onClick: startEditCorrection }
                    : undefined
                }
              />
            )}
          </CollapsibleSection>
        </div>

        {/* 종결 섹션 */}
        {(nc.closureNotes || isClosed) && (
          <div
            className={ANIMATION_PRESETS.staggerFadeInItem}
            style={getStaggerFadeInStyle(2, 'section')}
          >
            <CollapsibleSection
              contentId="nc-closure-section"
              title={
                <>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {t('detail.closure.sectionTitle')}
                </>
              }
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
                <EmptyState
                  variant="no-data"
                  icon={CheckCircle2}
                  title={t('detail.closure.emptyTitle')}
                  description={t('detail.closure.empty')}
                  canAct={false}
                />
              )}
            </CollapsibleSection>
          </div>
        )}

        {/* 첨부 문서 (현장 사진 등) */}
        <div
          className={ANIMATION_PRESETS.staggerFadeInItem}
          style={getStaggerFadeInStyle(3, 'section')}
        >
          <NCDocumentsSection nonConformanceId={nc.id} />
        </div>
      </section>

      {/* 컨텍스트-액션 갭 */}
      <div className={NC_SPACING_TOKENS.detail.contextToActionGap} />

      {/* 액션 바 — sticky bottom-4로 스크롤 시 항상 노출 */}
      {!isClosed && (
        <div ref={actionBarRef} className={NC_ACTION_BAR_TOKENS.stickyWrapper}>
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
        </div>
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
      {guidance?.needsRepair && (
        <NCRepairDialog nc={nc} open={showRepairDialog} onOpenChange={setShowRepairDialog} />
      )}
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * 수평 워크플로우 타임라인 — 전체 노드+날짜 (closed 상태 전용)
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
 * 정보 카드 (1~2-column)
 *
 * 두 번째 카드는 NC 유형에 따라 분기:
 * - damage/malfunction → RepairCard (수리 이력)
 * - calibration_overdue/calibration_failure → CalibrationCard (교정 기록)
 * - 그 외 → 카드 없음 (단일 컬럼)
 */
function InfoCards({
  nc,
  onRepairRegister,
  onCalibrationRegister,
  onCalibrationView,
}: {
  nc: NonConformance;
  onRepairRegister: () => void;
  onCalibrationRegister: () => void;
  onCalibrationView: () => void;
}) {
  const { fmtDate } = useDateFormatter();
  const t = useTranslations('non-conformances');
  const hasRepairLink = !!nc.repairHistoryId;
  const hasCalibrationLink = !!nc.calibrationId;
  const prerequisiteType = getNCPrerequisite(nc.ncType);
  const needsRepair = prerequisiteType === 'repair';
  const isCalibrationRelated =
    nc.ncType === 'calibration_failure' || nc.ncType === 'calibration_overdue';

  const gridClass =
    (needsRepair && hasRepairLink) || (isCalibrationRelated && hasCalibrationLink)
      ? NC_INFO_CARD_TOKENS.gridRepairLinked
      : needsRepair || isCalibrationRelated
        ? NC_INFO_CARD_TOKENS.grid
        : 'grid grid-cols-1';

  return (
    <div className={gridClass}>
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

      {/* 수리 카드 — damage, malfunction */}
      {needsRepair && <RepairCard nc={nc} onRepairRegister={onRepairRegister} />}

      {/* 교정 카드 — calibration_overdue, calibration_failure */}
      {isCalibrationRelated && (
        <CalibrationCard
          nc={nc}
          onCalibrationRegister={onCalibrationRegister}
          onCalibrationView={onCalibrationView}
        />
      )}
    </div>
  );
}

/** 수리 연결 카드 (damage / malfunction 전용) */
function RepairCard({
  nc,
  onRepairRegister,
}: {
  nc: NonConformance;
  onRepairRegister: () => void;
}) {
  const t = useTranslations('non-conformances');
  const hasRepairLink = !!nc.repairHistoryId;

  return (
    <div
      className={cn(
        NC_INFO_CARD_TOKENS.card,
        hasRepairLink ? NC_INFO_CARD_TOKENS.repairLinkedCard : NC_INFO_CARD_TOKENS.repairNeededCard
      )}
    >
      <h3
        className={cn(
          NC_INFO_CARD_TOKENS.cardTitle,
          hasRepairLink
            ? NC_INFO_CARD_TOKENS.repairLinkedTitle
            : NC_INFO_CARD_TOKENS.repairNeededTitle
        )}
      >
        {hasRepairLink ? t('detail.infoCard.repairLinked') : t('detail.infoCard.repairNeeded')}
      </h3>
      {hasRepairLink ? (
        <RepairDetail nc={nc} />
      ) : (
        <div className="space-y-2 py-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('detail.infoCard.repairNeededDescription', {
              type: t(getNCMessageKey(`ncType.${nc.ncType}`)),
            })}
          </p>
          <button
            type="button"
            className={NC_INFO_CARD_TOKENS.registerLink}
            onClick={onRepairRegister}
          >
            <Wrench className="h-3.5 w-3.5" />
            {t('detail.infoCard.repairRegisterLink')}
          </button>
        </div>
      )}
    </div>
  );
}

/** 교정 기록 카드 (calibration_overdue / calibration_failure 전용) */
function CalibrationCard({
  nc,
  onCalibrationRegister,
  onCalibrationView,
}: {
  nc: NonConformance;
  onCalibrationRegister: () => void;
  onCalibrationView: () => void;
}) {
  const t = useTranslations('non-conformances');
  const hasCalibrationLink = !!nc.calibrationId;
  const isBlocking = nc.ncType === 'calibration_overdue';

  const cardClass = hasCalibrationLink
    ? NC_INFO_CARD_TOKENS.repairLinkedCard
    : isBlocking
      ? NC_INFO_CARD_TOKENS.repairNeededCard
      : '';

  const titleClass = hasCalibrationLink
    ? NC_INFO_CARD_TOKENS.repairLinkedTitle
    : isBlocking
      ? NC_INFO_CARD_TOKENS.repairNeededTitle
      : '';

  const title = hasCalibrationLink
    ? t('detail.infoCard.calibrationCard.overdueLinkedTitle')
    : isBlocking
      ? t('detail.infoCard.calibrationCard.overdueTitle')
      : t('detail.infoCard.calibrationCard.failureTitle');

  const typeLabel = t(getNCMessageKey(`ncType.${nc.ncType}`));

  return (
    <div className={cn(NC_INFO_CARD_TOKENS.card, cardClass)}>
      <h3 className={cn(NC_INFO_CARD_TOKENS.cardTitle, titleClass)}>{title}</h3>
      {hasCalibrationLink ? (
        <div className="flex items-center gap-2 py-2 flex-wrap">
          <CalendarCheck className="h-4 w-4 text-brand-ok" aria-hidden="true" />
          <span className={NC_REPAIR_LINKED_TOKENS.badge}>
            {t('detail.infoCard.calibrationCard.linkedBadge')}
          </span>
          <button
            type="button"
            className={cn(NC_INFO_CARD_TOKENS.registerLink, 'ml-auto')}
            onClick={onCalibrationView}
          >
            {t('detail.infoCard.calibrationCard.viewLink')}
          </button>
        </div>
      ) : (
        <div className="space-y-2 py-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(
              isBlocking
                ? 'detail.infoCard.calibrationCard.overdueDescription'
                : 'detail.infoCard.calibrationCard.failureDescription',
              { type: typeLabel }
            )}
          </p>
          <button
            type="button"
            className={NC_INFO_CARD_TOKENS.registerLink}
            onClick={onCalibrationRegister}
          >
            <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t('detail.infoCard.calibrationCard.registerLink')}
          </button>
        </div>
      )}
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
            {t(getNCMessageKey(`detail.infoCard.repairResults.${rh.repairResult}`))}
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
 *
 * grid-rows 애니메이션: isOpen && 조건부 렌더 대신 항상 DOM에 존재하며 CSS만 변경.
 * grid-rows-[0fr] → grid-rows-[1fr] + min-h-0 패턴이 height 트랜지션 가능하게 함.
 */
function CollapsibleSection({
  title,
  contentId,
  isOpen,
  onToggle,
  canEdit,
  isEditing,
  onEdit,
  children,
}: {
  title: React.ReactNode;
  contentId: string;
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
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <span className="flex items-center gap-1.5">{title}</span>
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
      <div
        id={contentId}
        className={cn(
          NC_COLLAPSIBLE_TOKENS.contentWrapper,
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className={NC_COLLAPSIBLE_TOKENS.contentInner}>
          <div className={NC_COLLAPSIBLE_TOKENS.content}>{children}</div>
        </div>
      </div>
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
            disabled={isUpdating || hasUnmetPrerequisite || !nc.correctionContent?.trim()}
            title={
              hasUnmetPrerequisite
                ? prerequisiteMessage
                : !nc.correctionContent?.trim()
                  ? t('detail.actionBar.hintNeedsContent')
                  : undefined
            }
          >
            {t('detail.actionBar.markCorrected')}
          </Button>
        )}
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
