'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { differenceInDays } from 'date-fns';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
  LinkIcon,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import nonConformancesApi, {
  type NonConformance,
  NON_CONFORMANCE_STATUS_LABELS,
  NON_CONFORMANCE_TYPE_LABELS,
} from '@/lib/api/non-conformances-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { NonConformanceCacheInvalidation } from '@/lib/api/cache-invalidation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { formatDate } from '@/lib/utils/date';
import {
  type NonConformanceStatus,
  NonConformanceStatusValues as NCVal,
  REPAIR_REQUIRING_NC_TYPES,
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
  NC_REPAIR_RESULT_LABELS,
  getNCElapsedDaysClasses,
  isNCLongOverdue,
  NC_INFO_NOTICE_TOKENS,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
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

/** 워크플로우 스텝 시각 정의 — NC_WORKFLOW_STEPS (SSOT) 기반 파생 */
const NC_STEP_CONFIG: Record<
  (typeof NC_WORKFLOW_STEPS)[number],
  { label: string; icon: typeof AlertTriangle }
> = {
  open: { label: '등록', icon: AlertTriangle },
  corrected: { label: '조치', icon: CheckCircle2 },
  closed: { label: '종결', icon: XCircle },
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
  const { isManager } = useAuth();
  const { toast } = useToast();

  // State for dialogs
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  if (!nc) return null;

  const currentStepIndex = NC_STATUS_STEP_INDEX[nc.status] ?? 0;
  const elapsedDays = nc.discoveryDate
    ? differenceInDays(new Date(), new Date(nc.discoveryDate))
    : 0;
  const longOverdue = isNCLongOverdue(elapsedDays);
  const isClosed = nc.status === NCVal.CLOSED;
  const needsRepair =
    (REPAIR_REQUIRING_NC_TYPES as readonly string[]).includes(nc.ncType) && !nc.repairHistoryId;

  // ============================================================================
  // Mutations
  // ============================================================================

  // 상태 변경 (open→corrected)
  const updateMutation = useOptimisticMutation<
    NonConformance,
    { status: Exclude<NonConformanceStatus, 'closed'>; correctionContent?: string },
    NonConformance
  >({
    mutationFn: (vars) =>
      nonConformancesApi.updateNonConformance(ncId, {
        version: nc.version,
        status: vars.status,
        correctionContent: vars.correctionContent,
        correctionDate:
          vars.status === NCVal.CORRECTED ? new Date().toISOString().split('T')[0] : undefined,
        // correctedBy는 서버에서 JWT로 추출 (Rule 2: 클라이언트 body 신뢰 금지)
      }),
    queryKey: queryKeys.nonConformances.detail(ncId),
    optimisticUpdate: (old, vars) => ({ ...old!, status: vars.status }),
    invalidateKeys: [queryKeys.nonConformances.lists()],
    successMessage: '상태가 변경되었습니다',
    errorMessage: '상태 변경에 실패했습니다',
    onSuccessCallback: () => {
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        ncId,
        nc.equipmentId
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
        version: nc.version,
        ...vars,
      }),
    queryKey: queryKeys.nonConformances.detail(ncId),
    optimisticUpdate: (old, vars) => ({ ...old!, ...vars }),
    invalidateKeys: [queryKeys.nonConformances.lists()],
    successMessage: '저장되었습니다',
    errorMessage: '저장에 실패했습니다',
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
        version: nc.version,
        closureNotes: vars.closureNotes,
      }),
    queryKey: queryKeys.nonConformances.detail(ncId),
    optimisticUpdate: (old) => ({ ...old!, status: NCVal.CLOSED as NonConformanceStatus }),
    invalidateKeys: [queryKeys.nonConformances.lists()],
    successMessage: '부적합이 종결되었습니다',
    errorMessage: '종결에 실패했습니다',
    onSuccessCallback: () => {
      setShowCloseDialog(false);
      setClosureNotes('');
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        ncId,
        nc.equipmentId
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
        version: nc.version,
        rejectionReason: vars.rejectionReason,
      }),
    queryKey: queryKeys.nonConformances.detail(ncId),
    optimisticUpdate: (old) => ({ ...old!, status: NCVal.OPEN as NonConformanceStatus }),
    invalidateKeys: [queryKeys.nonConformances.lists()],
    successMessage: '조치가 반려되었습니다',
    errorMessage: '반려에 실패했습니다',
    onSuccessCallback: () => {
      setShowRejectDialog(false);
      setRejectionReason('');
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        ncId,
        nc.equipmentId
      );
    },
  });

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
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className={NC_DETAIL_HEADER_TOKENS.title}>부적합 상세</h1>
            <span className={getSemanticBadgeClasses(ncStatusToSemantic(nc.status))}>
              {NON_CONFORMANCE_STATUS_LABELS[nc.status as NonConformanceStatus]}
            </span>
            {longOverdue && !isClosed && <span className={NC_URGENT_BADGE_TOKENS.badge}>긴급</span>}
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
            <span>발견일: {formatDate(nc.discoveryDate)}</span>
            {!isClosed && (
              <>
                <span>·</span>
                <span className={getNCElapsedDaysClasses(elapsedDays)}>경과 {elapsedDays}일</span>
              </>
            )}
          </div>
        </div>
        <div className={NC_DETAIL_HEADER_TOKENS.actionsGroup}>
          {!isClosed && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/equipment/${nc.equipmentId}`}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                수정
              </Link>
            </Button>
          )}
          <Link href="/non-conformances">
            <Button variant="outline" size="sm">
              목록
            </Button>
          </Link>
        </div>
      </div>

      {/* 반려 알림 */}
      {nc.rejectionReason && nc.status === NCVal.OPEN && (
        <div className={NC_REJECTION_ALERT_TOKENS.container}>
          <XCircle className={NC_REJECTION_ALERT_TOKENS.icon} />
          <div>
            <p className={NC_REJECTION_ALERT_TOKENS.title}>조치 반려 — 재조치 필요</p>
            <p className={NC_REJECTION_ALERT_TOKENS.description}>{nc.rejectionReason}</p>
            {nc.rejectedAt && (
              <p className={NC_REJECTION_ALERT_TOKENS.date}>
                반려일: {formatDate(nc.rejectedAt)}
                {nc.rejector && ` · 반려자: ${nc.rejector.name}`}
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

      {/* 수리 필요 안내 */}
      {needsRepair && !isClosed && (
        <div className={NC_INFO_NOTICE_TOKENS.container}>
          <div className="flex items-start gap-3">
            <Wrench className={NC_INFO_NOTICE_TOKENS.icon} />
            <div>
              <p className={NC_INFO_NOTICE_TOKENS.text}>
                <strong className="text-brand-warning">
                  {NON_CONFORMANCE_TYPE_LABELS[nc.ncType]}
                </strong>{' '}
                유형의 부적합입니다. 시정 조치 전 수리 이력을 등록해야 합니다.
              </p>
              <Link
                href={`/equipment/${nc.equipmentId}`}
                className="text-sm text-brand-info hover:underline mt-1 inline-block"
              >
                수리 이력 등록 →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 정보 카드 */}
      <InfoCards nc={nc} />

      {/* 조치/종결 섹션 */}
      <CollapsibleSection
        title="🔧 시정 조치"
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
              placeholder="시정 조치 내용을 입력하세요..."
              rows={4}
            />
            <div className={NC_COLLAPSIBLE_EDIT_TOKENS.saveRow}>
              <Button variant="ghost" size="sm" onClick={() => setEditingCorrection(false)}>
                취소
              </Button>
              <Button
                size="sm"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate({ correctionContent: correctionText })}
              >
                저장
              </Button>
            </div>
          </div>
        ) : nc.correctionContent ? (
          <div>
            <p className={NC_COLLAPSIBLE_TOKENS.fieldValue}>{nc.correctionContent}</p>
            {nc.correctionDate && (
              <p className={NC_COLLAPSIBLE_TOKENS.fieldMeta}>
                조치일: {formatDate(nc.correctionDate)}
                {nc.corrector && ` · 조치자: ${nc.corrector.name}`}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">아직 시정 조치 내용이 없습니다</p>
        )}
      </CollapsibleSection>

      {(nc.closureNotes || isClosed) && (
        <CollapsibleSection
          title="✅ 종결 의견"
          isOpen={closureOpen}
          onToggle={() => setClosureOpen(!closureOpen)}
        >
          {nc.closureNotes ? (
            <div>
              <p className={NC_COLLAPSIBLE_TOKENS.fieldValue}>{nc.closureNotes}</p>
              {nc.closedAt && (
                <p className={NC_COLLAPSIBLE_TOKENS.fieldMeta}>
                  종결일: {formatDate(nc.closedAt)}
                  {nc.closer && ` · 종결자: ${nc.closer.name}`}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">종결 의견이 없습니다</p>
          )}
        </CollapsibleSection>
      )}

      {/* 액션 바 */}
      {!isClosed && (
        <ActionBar
          nc={nc}
          isManager={isManager()}
          needsRepair={needsRepair}
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
            <DialogTitle>부적합 종결</DialogTitle>
            <DialogDescription>
              이 부적합 사항을 종결합니다. 종결 후에는 상태를 변경할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="종결 의견 (선택)"
            value={closureNotes}
            onChange={(e) => setClosureNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              취소
            </Button>
            <Button
              className={NC_APPROVE_BUTTON_TOKENS.approve}
              onClick={() => closeMutation.mutate({ closureNotes })}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? '처리 중...' : '종결'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반려 다이얼로그 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>조치 반려</DialogTitle>
            <DialogDescription>시정 조치를 반려하고 재조치를 요청합니다.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="반려 사유를 입력하세요"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!rejectionReason.trim()) {
                  toast({ title: '반려 사유를 입력하세요', variant: 'destructive' });
                  return;
                }
                rejectMutation.mutate({ rejectionReason });
              }}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? '처리 중...' : '반려'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  return (
    <div
      className={cn(
        NC_WORKFLOW_TOKENS.container,
        isLongOverdue && NC_WORKFLOW_TOKENS.containerUrgent
      )}
    >
      <div className={NC_WORKFLOW_TOKENS.stepsLayout}>
        {NC_WORKFLOW_STEPS.map((stepKey: NonConformanceStatus, idx: number) => {
          const config = NC_STEP_CONFIG[stepKey];
          const Icon = config.icon;
          return (
            <div key={stepKey} className={NC_WORKFLOW_TOKENS.step}>
              {/* 커넥터 (좌측) */}
              {idx > 0 && (
                <div
                  className={getNCWorkflowConnectorClasses(idx - 1, currentStepIndex)}
                  style={{
                    left: `${((idx - 1) / (NC_WORKFLOW_STEPS.length - 1)) * 100 + 100 / (NC_WORKFLOW_STEPS.length - 1) / 2}%`,
                    width: `${100 / (NC_WORKFLOW_STEPS.length - 1) - 10}%`,
                  }}
                />
              )}
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
                {config.label}
              </span>
              {/* 날짜 */}
              <StepDate nc={nc} stepKey={stepKey} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 스텝별 날짜 표시 */
function StepDate({ nc, stepKey }: { nc: NonConformance; stepKey: NonConformanceStatus }) {
  let dateStr: string | null = null;
  let actor: string | null = null;

  switch (stepKey) {
    case NCVal.OPEN:
      dateStr = nc.discoveryDate;
      actor = nc.discoverer?.name ?? null;
      break;
    case NCVal.CORRECTED:
      dateStr = nc.correctionDate;
      actor = nc.corrector?.name ?? null;
      break;
    case NCVal.CLOSED:
      dateStr = nc.closedAt;
      actor = nc.closer?.name ?? null;
      break;
  }

  if (!dateStr) return null;

  return (
    <>
      {dateStr && <span className={NC_WORKFLOW_TOKENS.date}>{formatDate(dateStr)}</span>}
      {actor && <span className={NC_WORKFLOW_TOKENS.actor}>{actor}</span>}
    </>
  );
}

/**
 * 정보 카드 (2-column)
 */
function InfoCards({ nc }: { nc: NonConformance }) {
  const hasRepairLink = !!nc.repairHistoryId;
  const needsRepair = ['damage', 'malfunction'].includes(nc.ncType);

  return (
    <div className={NC_INFO_CARD_TOKENS.grid}>
      {/* 기본 정보 */}
      <div className={NC_INFO_CARD_TOKENS.card}>
        <h3 className={NC_INFO_CARD_TOKENS.cardTitle}>기본 정보</h3>
        <InfoRow label="부적합 유형" value={NON_CONFORMANCE_TYPE_LABELS[nc.ncType] ?? nc.ncType} />
        <InfoRow label="발견자" value={nc.discoverer?.name ?? nc.discoveredBy} />
        <InfoRow label="발견일" value={formatDate(nc.discoveryDate)} />
        <div className={NC_INFO_CARD_TOKENS.infoRowVertical}>
          <span className={NC_INFO_CARD_TOKENS.infoLabel}>원인</span>
          <p className={NC_INFO_CARD_TOKENS.infoValueMultiline}>{nc.cause}</p>
        </div>
        {nc.actionPlan && (
          <div className={NC_INFO_CARD_TOKENS.infoRowVertical}>
            <span className={NC_INFO_CARD_TOKENS.infoLabel}>조치 계획</span>
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
          {hasRepairLink ? '✓ 수리 연결됨' : needsRepair ? '⚠ 수리 연결 필요' : '수리 연결'}
        </h3>
        {hasRepairLink ? (
          <RepairDetail nc={nc} />
        ) : needsRepair ? (
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-brand-warning">
                {NON_CONFORMANCE_TYPE_LABELS[nc.ncType]}
              </strong>{' '}
              유형의 부적합은 수리 이력 연결이 권장됩니다. 수리 완료 후 시정 조치를 등록할 수
              있습니다.
            </p>
            <Link
              href={`/equipment/${nc.equipmentId}`}
              className="text-sm text-brand-info hover:underline inline-flex items-center gap-1"
            >
              <Wrench className="h-3.5 w-3.5" />
              수리 이력 등록
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">수리가 필요하지 않은 유형입니다</p>
        )}

        {/* 추가 메타 */}
        <div className="mt-4 pt-3 border-t border-border/40">
          <InfoRow label="등록일" value={formatDate(nc.createdAt)} />
          <InfoRow label="최종 수정" value={formatDate(nc.updatedAt)} />
          <InfoRow label="버전" value={String(nc.version)} />
        </div>
      </div>
    </div>
  );
}

/** 수리 이력 상세 */
function RepairDetail({ nc }: { nc: NonConformance }) {
  const rh = nc.repairHistory;
  if (!rh) {
    return (
      <div className="flex items-center gap-2 py-2">
        <LinkIcon className="h-4 w-4 text-brand-ok" />
        <span className={NC_REPAIR_LINKED_TOKENS.badge}>수리 연결됨</span>
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
        <span className={NC_REPAIR_DETAIL_TOKENS.label}>수리일</span>
        <span className={NC_REPAIR_DETAIL_TOKENS.value}>{formatDate(rh.repairDate)}</span>
      </div>
      {rh.repairResult && resultBadgeClass && (
        <div className={NC_REPAIR_DETAIL_TOKENS.row}>
          <span className={NC_REPAIR_DETAIL_TOKENS.label}>수리 결과</span>
          <span className={resultBadgeClass}>
            {NC_REPAIR_RESULT_LABELS[rh.repairResult] ?? rh.repairResult}
          </span>
        </div>
      )}
      <div className="pt-1">
        <span className={cn(NC_REPAIR_DETAIL_TOKENS.label, 'block mb-1')}>수리 내용</span>
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
            편집
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
  isManager,
  needsRepair,
  onMarkCorrected,
  onClose,
  onReject,
  isUpdating,
}: {
  nc: NonConformance;
  isManager: boolean;
  needsRepair: boolean;
  onMarkCorrected: () => void;
  onClose: () => void;
  onReject: () => void;
  isUpdating: boolean;
}) {
  return (
    <div className={NC_ACTION_BAR_TOKENS.container}>
      <div className={NC_ACTION_BAR_TOKENS.left}>
        {/* 시험실무자 액션 */}
        {nc.status === NCVal.OPEN && (
          <Button
            size="sm"
            onClick={onMarkCorrected}
            disabled={isUpdating || needsRepair}
            title={needsRepair ? '수리 이력을 먼저 등록해야 합니다' : undefined}
          >
            조치 완료
          </Button>
        )}
        <span className={NC_ACTION_BAR_TOKENS.roleHint}>
          {nc.status === NCVal.OPEN &&
            (needsRepair
              ? '수리 이력을 등록한 후 조치 완료할 수 있습니다'
              : '조치를 완료하면 기술책임자의 종결 승인이 필요합니다')}
          {nc.status === NCVal.CORRECTED &&
            !isManager &&
            '기술책임자의 종결 승인을 기다리고 있습니다'}
        </span>
      </div>
      <div className={NC_ACTION_BAR_TOKENS.right}>
        {/* 기술책임자 액션 (corrected 상태만) */}
        {isManager && nc.status === NCVal.CORRECTED && (
          <>
            <Button variant="outline" size="sm" onClick={onReject} disabled={isUpdating}>
              <X className="h-3.5 w-3.5 mr-1" />
              조치 반려
            </Button>
            <Button
              size="sm"
              className={NC_APPROVE_BUTTON_TOKENS.approve}
              onClick={onClose}
              disabled={isUpdating || needsRepair}
              title={needsRepair ? '수리 이력을 먼저 등록해야 합니다' : undefined}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              종결 승인
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
