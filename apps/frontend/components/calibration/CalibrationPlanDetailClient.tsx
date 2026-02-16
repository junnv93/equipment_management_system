'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import calibrationPlansApi, {
  type CalibrationPlan,
  type CalibrationPlanItem,
  CALIBRATION_PLAN_STATUS_LABELS,
  CALIBRATION_PLAN_STATUS_COLORS,
  SITE_LABELS,
} from '@/lib/api/calibration-plans-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { CalibrationPlansCacheInvalidation } from '@/lib/api/cache-invalidation';
import { CalibrationPlanStatusValues as CPStatus } from '@equipment-management/schemas';
import { formatDate } from '@/lib/utils/date';
import {
  ArrowLeft,
  Send,
  Trash2,
  CheckCircle2,
  Edit2,
  Save,
  X,
  AlertCircle,
  FileText,
  Download,
  Circle,
  XCircle,
  ClipboardCheck,
  UserCheck,
  Loader2,
  Plus,
  ChevronUp,
  Check,
} from 'lucide-react';
import type { UserRole } from '@equipment-management/schemas';

interface CalibrationPlanDetailClientProps {
  /**
   * Server Component에서 전달받은 교정계획서 UUID
   */
  planUuid: string;
  /**
   * Server Component에서 프리페치한 초기 데이터
   * placeholderData로 사용 → 항상 stale 취급 → 백그라운드 refetch 보장
   */
  initialData?: CalibrationPlan;
}

/**
 * 교정계획서 상세 Client Component
 *
 * Next.js 16 패턴:
 * - Server Component(page.tsx)에서 planUuid를 전달받음
 * - 모든 인터랙티브 로직(useState, useMutation)을 담당
 */
export function CalibrationPlanDetailClient({
  planUuid,
  initialData,
}: CalibrationPlanDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingAgency, setEditingAgency] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewComment, setShowReviewComment] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // ✅ queryKeys 팩토리 사용
  const planQueryKey = queryKeys.calibrationPlans.detail(planUuid);

  // 계획서 상세 조회
  const {
    data: plan,
    isLoading,
    isError,
  } = useQuery({
    queryKey: planQueryKey,
    queryFn: () => calibrationPlansApi.getCalibrationPlan(planUuid),
    enabled: !!planUuid,
    // 서버 프리페치 데이터를 placeholderData로 사용
    // placeholderData는 항상 stale 취급 → 백그라운드에서 최신 데이터 refetch 보장
    placeholderData: initialData,
    ...QUERY_CONFIG.CALIBRATION_PLAN_DETAIL,
  });

  // 브레드크럼 동적 라벨 설정
  useEffect(() => {
    if (plan) {
      // 교정 계획서 정보를 사용해서 의미있는 라벨 생성
      const siteLabel = plan.siteId ? SITE_LABELS[plan.siteId] || plan.siteId : '';
      const yearLabel = plan.year ? `${plan.year}년` : '';
      const label = `${siteLabel} ${yearLabel} 교정계획서`.trim();

      setDynamicLabel(planUuid, label);
    }

    // 컴포넌트 언마운트 시 라벨 제거
    return () => {
      clearDynamicLabel(planUuid);
    };
  }, [plan, planUuid, setDynamicLabel, clearDynamicLabel]);

  /**
   * 상태 변경 후 공통 캐시 무효화
   */
  const invalidateAfterChange = () =>
    CalibrationPlansCacheInvalidation.invalidateAfterStatusChange(queryClient, planUuid);

  // ✅ userId 제거 (서버에서 JWT 추출), casVersion 추가

  // 검토 요청 뮤테이션 (기술책임자 → 품질책임자)
  const submitForReviewMutation = useMutation({
    mutationFn: () =>
      calibrationPlansApi.submitForReview(planUuid, {
        casVersion: plan?.casVersion ?? 0,
      }),
    onSuccess: () => {
      toast({
        title: '검토 요청 완료',
        description: '교정계획서가 품질책임자에게 검토 요청되었습니다.',
      });
      invalidateAfterChange();
      setIsSubmitDialogOpen(false);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: '검토 요청 실패',
        description: error.response?.data?.message || '검토 요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      invalidateAfterChange();
    },
  });

  // 확인 완료 뮤테이션 (품질책임자)
  const reviewMutation = useMutation({
    mutationFn: () =>
      calibrationPlansApi.reviewCalibrationPlan(planUuid, {
        casVersion: plan?.casVersion ?? 0,
        reviewComment: reviewComment || undefined,
      }),
    onSuccess: () => {
      toast({
        title: '확인 완료',
        description: '품질책임자 확인이 완료되어 시험소장에게 승인 요청되었습니다.',
      });
      invalidateAfterChange();
      setShowReviewComment(false);
      setReviewComment('');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: '확인 완료 실패',
        description: error.response?.data?.message || '확인 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      invalidateAfterChange();
    },
  });

  // 최종 승인 뮤테이션 (시험소장)
  const approveMutation = useMutation({
    mutationFn: () =>
      calibrationPlansApi.approveCalibrationPlan(planUuid, {
        casVersion: plan?.casVersion ?? 0,
      }),
    onSuccess: () => {
      toast({
        title: '승인 완료',
        description: '교정계획서가 최종 승인되었습니다.',
      });
      invalidateAfterChange();
      setIsApproveDialogOpen(false);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: '승인 실패',
        description: error.response?.data?.message || '승인 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      invalidateAfterChange();
    },
  });

  // 반려 뮤테이션 (품질책임자 또는 시험소장)
  const rejectMutation = useMutation({
    mutationFn: () =>
      calibrationPlansApi.rejectCalibrationPlan(planUuid, {
        casVersion: plan?.casVersion ?? 0,
        rejectionReason,
      }),
    onSuccess: () => {
      toast({
        title: '반려 완료',
        description: '교정계획서가 반려되었습니다.',
      });
      invalidateAfterChange();
      setIsRejectDialogOpen(false);
      setRejectionReason('');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: '반려 실패',
        description: error.response?.data?.message || '반려 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      invalidateAfterChange();
    },
  });

  // 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: () => calibrationPlansApi.deleteCalibrationPlan(planUuid),
    onSuccess: () => {
      toast({
        title: '삭제 완료',
        description: '교정계획서가 삭제되었습니다.',
      });
      router.push('/calibration-plans');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: '삭제 실패',
        description: error.response?.data?.message || '삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 항목 수정 뮤테이션
  const updateItemMutation = useMutation({
    mutationFn: ({
      itemUuid,
      data,
    }: {
      itemUuid: string;
      data: { plannedCalibrationAgency?: string; notes?: string };
    }) => calibrationPlansApi.updatePlanItem(planUuid, itemUuid, data),
    onSuccess: () => {
      toast({
        title: '항목 수정 완료',
        description: '항목이 수정되었습니다.',
      });
      CalibrationPlansCacheInvalidation.invalidatePlan(queryClient, planUuid);
      setEditingItemId(null);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: '항목 수정 실패',
        description: error.response?.data?.message || '항목 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 항목 확인 뮤테이션
  const confirmItemMutation = useMutation({
    mutationFn: (itemUuid: string) =>
      calibrationPlansApi.confirmPlanItem(planUuid, itemUuid, {
        casVersion: plan?.casVersion ?? 0,
      }),
    onSuccess: () => {
      toast({
        title: '확인 완료',
        description: '항목이 확인되었습니다.',
      });
      CalibrationPlansCacheInvalidation.invalidatePlan(queryClient, planUuid);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast({
        title: '확인 실패',
        description: error.response?.data?.message || '항목 확인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      CalibrationPlansCacheInvalidation.invalidatePlan(queryClient, planUuid);
    },
  });

  const handleStartEdit = (item: CalibrationPlanItem) => {
    setEditingItemId(item.id);
    setEditingAgency(item.plannedCalibrationAgency || '');
    setEditingNotes(item.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingItemId) return;
    updateItemMutation.mutate({
      itemUuid: editingItemId,
      data: {
        plannedCalibrationAgency: editingAgency,
        notes: editingNotes,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingAgency('');
    setEditingNotes('');
  };

  const handlePrintView = () => {
    calibrationPlansApi.openPrintView(planUuid);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>교정계획서를 불러오는 중 오류가 발생했습니다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ✅ SSOT 상태 상수 사용
  const isDraft = plan.status === CPStatus.DRAFT;
  const isRejected = plan.status === CPStatus.REJECTED;
  const isPendingReview = plan.status === CPStatus.PENDING_REVIEW;
  const isPendingApproval = plan.status === CPStatus.PENDING_APPROVAL;
  const isApproved = plan.status === CPStatus.APPROVED;
  const items = plan.items || [];

  // 사용자 역할 확인
  const userRole = session?.user?.role as UserRole | undefined;
  const isTechnicalManager = userRole === 'technical_manager';
  const isQualityManager = userRole === 'quality_manager';
  const isLabManager = userRole === 'lab_manager';

  // 역할별 액션 가능 여부
  const canSubmitForReview = (isDraft || isRejected) && (isTechnicalManager || isLabManager);
  const canReview = isPendingReview && (isQualityManager || isLabManager);
  const canApprove = isPendingApproval && isLabManager;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/calibration-plans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {plan.year}년 {SITE_LABELS[plan.siteId]} 교정계획서
              </h1>
              <Badge className={CALIBRATION_PLAN_STATUS_COLORS[plan.status]}>
                {CALIBRATION_PLAN_STATUS_LABELS[plan.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              작성자: {plan.createdBy} | 작성일:{' '}
              <time dateTime={plan.createdAt}>{formatDate(plan.createdAt, 'yyyy-MM-dd')}</time>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isApproved && (
            <Button variant="outline" onClick={handlePrintView}>
              <Download className="h-4 w-4 mr-2" />
              인쇄/PDF
            </Button>
          )}
          {/* 작성 중/반려됨 상태: 삭제 및 검토 요청 (기술책임자/시험소장) */}
          {(isDraft || isRejected) && (
            <>
              {isDraft && (
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
              )}
              {canSubmitForReview && (
                <Button
                  onClick={() => setIsSubmitDialogOpen(true)}
                  disabled={submitForReviewMutation.isPending || !plan}
                >
                  <Send className="h-4 w-4 mr-2" />
                  검토 요청
                </Button>
              )}
            </>
          )}
          {/* 확인 대기 상태: 품질책임자는 타임라인에서 원클릭 확인 */}
          {/* 승인 대기 상태: 최종 승인/반려 (시험소장) */}
          {canApprove && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsRejectDialogOpen(true)}
                disabled={rejectMutation.isPending || !plan}
              >
                <XCircle className="h-4 w-4 mr-2" />
                반려
              </Button>
              <Button
                onClick={() => setIsApproveDialogOpen(true)}
                disabled={approveMutation.isPending || !plan}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                최종 승인
              </Button>
            </>
          )}
          {/* 승인 대기 상태에서 품질책임자도 반려 가능 */}
          {isPendingApproval && isQualityManager && !isLabManager && (
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={rejectMutation.isPending || !plan}
            >
              <XCircle className="h-4 w-4 mr-2" />
              반려
            </Button>
          )}
        </div>
      </div>

      {/* 3단계 승인 타임라인 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {/* 1단계: 작성 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDraft
                    ? 'bg-blue-500 dark:bg-blue-600 text-white'
                    : 'bg-green-500 dark:bg-green-600 text-white'
                }`}
              >
                {isDraft ? <Circle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
              <span className="mt-2 text-sm font-medium">1. 작성</span>
              <span className="text-xs text-muted-foreground">기술책임자</span>
              {plan.submittedAt && (
                <time dateTime={plan.submittedAt} className="text-xs text-muted-foreground">
                  {formatDate(plan.submittedAt, 'MM/dd HH:mm')}
                </time>
              )}
            </div>

            {/* 연결선 1-2 */}
            <div
              className={`h-0.5 flex-1 ${
                isPendingReview || isPendingApproval || isApproved
                  ? 'bg-green-500 dark:bg-green-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />

            {/* 2단계: 확인 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isPendingReview
                    ? 'bg-yellow-500 dark:bg-yellow-600 text-white motion-safe:animate-pulse'
                    : isPendingApproval || isApproved
                      ? 'bg-green-500 dark:bg-green-600 text-white'
                      : isRejected && plan.rejectionStage === 'review'
                        ? 'bg-red-500 dark:bg-red-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}
              >
                {isPendingReview ? (
                  <Circle className="h-5 w-5" />
                ) : isPendingApproval || isApproved ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isRejected && plan.rejectionStage === 'review' ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <span className="mt-2 text-sm font-medium">2. 확인</span>
              <span className="text-xs text-muted-foreground">품질책임자</span>
              {plan.reviewedAt && (
                <time dateTime={plan.reviewedAt} className="text-xs text-muted-foreground">
                  {formatDate(plan.reviewedAt, 'MM/dd HH:mm')}
                </time>
              )}

              {/* 품질책임자용 인라인 확인 버튼 */}
              {canReview && (
                <div className="mt-3 flex flex-col items-center gap-1">
                  <Button
                    size="sm"
                    onClick={() => reviewMutation.mutate()}
                    disabled={reviewMutation.isPending || !plan}
                    className="w-24"
                    aria-label="교정계획서 확인 완료"
                  >
                    {reviewMutation.isPending ? (
                      <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        확인 완료
                      </>
                    )}
                  </Button>

                  {/* 확장 가능한 의견란 */}
                  <Collapsible open={showReviewComment} onOpenChange={setShowReviewComment}>
                    <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1">
                      {showReviewComment ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          의견 접기
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          의견 추가
                        </>
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <Input
                        placeholder="간단한 의견 (선택)"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-32 text-xs h-8"
                      />
                    </CollapsibleContent>
                  </Collapsible>

                  <button
                    type="button"
                    onClick={() => setIsRejectDialogOpen(true)}
                    className="text-xs text-muted-foreground hover:text-destructive underline mt-1"
                    disabled={rejectMutation.isPending || !plan}
                  >
                    반려
                  </button>
                </div>
              )}
            </div>

            {/* 연결선 2-3 */}
            <div
              className={`h-0.5 flex-1 ${
                isPendingApproval || isApproved
                  ? 'bg-green-500 dark:bg-green-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />

            {/* 3단계: 승인 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isPendingApproval
                    ? 'bg-blue-500 dark:bg-blue-600 text-white'
                    : isApproved
                      ? 'bg-green-500 dark:bg-green-600 text-white'
                      : isRejected && plan.rejectionStage === 'approval'
                        ? 'bg-red-500 dark:bg-red-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}
              >
                {isPendingApproval ? (
                  <Circle className="h-5 w-5" />
                ) : isApproved ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isRejected && plan.rejectionStage === 'approval' ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <span className="mt-2 text-sm font-medium">3. 승인</span>
              <span className="text-xs text-muted-foreground">시험소장</span>
              {plan.approvedAt && (
                <time dateTime={plan.approvedAt} className="text-xs text-muted-foreground">
                  {formatDate(plan.approvedAt, 'MM/dd HH:mm')}
                </time>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 반려 사유 표시 */}
      {isRejected && plan.rejectionReason && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            반려됨 ({plan.rejectionStage === 'review' ? '확인 단계' : '승인 단계'})
          </AlertTitle>
          <AlertDescription>{plan.rejectionReason}</AlertDescription>
        </Alert>
      )}

      {/* 확인 의견 표시 */}
      {plan.reviewComment && (isPendingApproval || isApproved) && (
        <Alert>
          <ClipboardCheck className="h-4 w-4" />
          <AlertTitle>확인 의견</AlertTitle>
          <AlertDescription>{plan.reviewComment}</AlertDescription>
        </Alert>
      )}

      {/* 승인 정보 */}
      {plan.approvedAt && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 text-sm">
              <span>승인자: {plan.approvedBy}</span>
              <span>
                승인일:{' '}
                <time dateTime={plan.approvedAt}>
                  {formatDate(plan.approvedAt, 'yyyy-MM-dd HH:mm')}
                </time>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 항목 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>교정 계획 항목</CardTitle>
          <CardDescription>총 {items.length}개의 장비가 포함되어 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>계획서에 포함된 장비가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">순번</TableHead>
                    <TableHead>관리번호</TableHead>
                    <TableHead>장비명</TableHead>
                    <TableHead className="text-center" colSpan={3}>
                      현황 (스냅샷)
                    </TableHead>
                    <TableHead className="text-center" colSpan={3}>
                      계획
                    </TableHead>
                    <TableHead>비고</TableHead>
                    {(isDraft || isApproved) && <TableHead className="w-[100px]">액션</TableHead>}
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead>유효일자</TableHead>
                    <TableHead>교정주기</TableHead>
                    <TableHead>교정기관</TableHead>
                    <TableHead>교정일자</TableHead>
                    <TableHead>교정기관</TableHead>
                    <TableHead>확인</TableHead>
                    <TableHead>실제교정일</TableHead>
                    {(isDraft || isApproved) && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: CalibrationPlanItem) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.sequenceNumber}</TableCell>
                      <TableCell className="font-mono">
                        {item.equipment?.managementNumber || '-'}
                      </TableCell>
                      <TableCell>{item.equipment?.name || '-'}</TableCell>
                      <TableCell>
                        {item.snapshotValidityDate
                          ? formatDate(item.snapshotValidityDate, 'yyyy-MM-dd')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {item.snapshotCalibrationCycle
                          ? `${item.snapshotCalibrationCycle}개월`
                          : '-'}
                      </TableCell>
                      <TableCell>{item.snapshotCalibrationAgency || '-'}</TableCell>
                      <TableCell>
                        {item.plannedCalibrationDate
                          ? formatDate(item.plannedCalibrationDate, 'yyyy-MM-dd')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {editingItemId === item.id ? (
                          <Input
                            value={editingAgency}
                            onChange={(e) => setEditingAgency(e.target.value)}
                            className="w-[100px]"
                          />
                        ) : (
                          item.plannedCalibrationAgency || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {item.confirmedBy ? (
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            확인됨
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItemId === item.id ? (
                          <Input
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                            placeholder="비고"
                            className="w-[100px]"
                          />
                        ) : (
                          <>
                            {item.actualCalibrationDate
                              ? formatDate(item.actualCalibrationDate, 'yyyy-MM-dd')
                              : item.notes || '-'}
                          </>
                        )}
                      </TableCell>
                      {(isDraft || isApproved) && (
                        <TableCell>
                          {editingItemId === item.id ? (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={updateItemMutation.isPending}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              {isDraft && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEdit(item)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                              {isApproved && !item.confirmedBy && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => confirmItemMutation.mutate(item.id)}
                                  disabled={confirmItemMutation.isPending}
                                  title="확인"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>계획서 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 교정계획서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 검토 요청 확인 다이얼로그 (기술책임자 → 품질책임자) */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>검토 요청</DialogTitle>
            <DialogDescription>
              교정계획서를 품질책임자에게 검토 요청하시겠습니까? 검토 요청 후에는 수정이 불가합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => submitForReviewMutation.mutate()}
              disabled={submitForReviewMutation.isPending}
            >
              검토 요청
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 최종 승인 다이얼로그 (시험소장) */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>최종 승인</DialogTitle>
            <DialogDescription>
              교정계획서를 최종 승인하시겠습니까? 승인 후에는 계획에 따라 교정이 진행됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
              최종 승인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반려 다이얼로그 (품질책임자/시험소장) */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반려</DialogTitle>
            <DialogDescription>
              교정계획서를 반려하시겠습니까? 반려 사유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">반려 사유 (필수)</label>
            <textarea
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
              placeholder="반려 사유를 입력하세요"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
