'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import { ArrowLeft, CheckCircle2, XCircle, Wrench, FileText, Pencil } from 'lucide-react';
import nonConformancesApi, { type NonConformance } from '@/lib/api/non-conformances-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import NCEditDialog from '@/components/non-conformances/NCEditDialog';
import NCRepairDialog from '@/components/non-conformances/NCRepairDialog';
import { NCDocumentsSection } from '@/components/non-conformances/NCDocumentsSection';
import { GuidanceCallout } from '@/components/non-conformances/GuidanceCallout';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuth } from '@/hooks/use-auth';
import { useNonConformanceMutations } from '@/hooks/use-non-conformance-mutations';
import { Permission, FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { NonConformanceStatusValues as NCVal } from '@equipment-management/schemas';
import {
  getSemanticBadgeClasses,
  ncStatusToSemantic,
  NC_DETAIL_HEADER_TOKENS,
  NC_WORKFLOW_STEPS,
  NC_STATUS_STEP_INDEX,
  NC_COLLAPSIBLE_TOKENS,
  NC_COLLAPSIBLE_EDIT_TOKENS,
  NC_ACTION_BAR_TOKENS,
  NC_APPROVE_BUTTON_TOKENS,
  NC_REJECTION_ALERT_TOKENS,
  URGENT_BADGE_TOKENS,
  getNCElapsedDaysClasses,
  isNCLongOverdue,
  NC_SPACING_TOKENS,
  ANIMATION_PRESETS,
  CSS_VAR_NAMES,
  getStaggerFadeInStyle,
} from '@/lib/design-tokens';
import { deriveGuidance } from '@/lib/non-conformances/guidance';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import RejectModal from '@/components/approvals/RejectModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WorkflowTimeline } from '@/components/non-conformances/sections/NCWorkflowTimeline';
import { InfoCards } from '@/components/non-conformances/sections/NCInfoCards';
import { CollapsibleSection } from '@/components/non-conformances/sections/NCCollapsibleSection';
import { ActionBar } from '@/components/non-conformances/sections/NCActionBar';

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
  const { can } = useAuth();
  const canCloseNC = can(Permission.CLOSE_NON_CONFORMANCE);
  // 헤더 편집 버튼도 canCloseNC와 동일 경계 사용 — UL-QP-18 §14: 기술책임자만 NC 전체 수정 가능
  const canEditNC = canCloseNC;
  // calibrationLink CTA는 CREATE_CALIBRATION 보유자(시험실무자/기술책임자)에게만 표시
  // quality_manager는 canCloseNC=false → operator guidance 받지만 CREATE_CALIBRATION 없음
  const canCreateCalibration = can(Permission.CREATE_CALIBRATION);
  const { fmtDate } = useDateFormatter();
  const t = useTranslations('non-conformances');

  // State for dialogs
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRepairDialog, setShowRepairDialog] = useState(false);
  // RejectModal SSOT 통합 (5-layer defense-in-depth) — 반려 사유 state는 RejectModal 내부 보유
  const [closureNotes, setClosureNotes] = useState('');

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

  const { updateMutation, saveMutation, closeMutation, rejectMutation } =
    useNonConformanceMutations(ncId, {
      onSaveSuccess: () => setEditingCorrection(false),
      onCloseSuccess: () => {
        setShowCloseDialog(false);
        setClosureNotes('');
      },
      onRejectSuccess: () => setShowRejectDialog(false),
    });

  // ── 훅: early return 이전에 선언 (Rules of Hooks) ──
  const actionBarRef = useRef<HTMLDivElement>(null);

  const scrollToActionBar = useCallback(() => {
    if (!actionBarRef.current) return;
    const rect = actionBarRef.current.getBoundingClientRect();
    const stickyHeaderHeight = parseFloat(
      document.documentElement.style.getPropertyValue(CSS_VAR_NAMES.stickyHeaderHeight) || '0'
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
            <Link href={FRONTEND_ROUTES.NON_CONFORMANCES.LIST}>
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
                    loading={saveMutation.isPending}
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
              loading={closeMutation.isPending}
            >
              {closeMutation.isPending
                ? t('detail.dialog.closeProcessing')
                : t('detail.dialog.closeSubmit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반려 모달 — RejectModal SSOT (mode='domain') */}
      <RejectModal
        mode="domain"
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={async (reason: string) => {
          await rejectMutation.mutateAsync({ rejectionReason: reason });
        }}
        title={t('detail.dialog.rejectTitle')}
        description={t('detail.dialog.rejectDescription')}
        submitLabel={t('detail.dialog.rejectSubmit')}
      />

      {/* NC 편집 다이얼로그 */}
      {nc && <NCEditDialog nc={nc} open={showEditDialog} onOpenChange={setShowEditDialog} />}

      {/* 수리이력 등록 다이얼로그 */}
      {guidance?.needsRepair && (
        <NCRepairDialog nc={nc} open={showRepairDialog} onOpenChange={setShowRepairDialog} />
      )}
    </div>
  );
}
