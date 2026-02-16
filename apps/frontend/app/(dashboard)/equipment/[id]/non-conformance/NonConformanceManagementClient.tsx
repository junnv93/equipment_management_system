'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  Wrench,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import nonConformancesApi, {
  NonConformance,
  NonConformanceType,
  NON_CONFORMANCE_STATUS_LABELS,
  NON_CONFORMANCE_STATUS_COLORS,
  NON_CONFORMANCE_TYPE_LABELS,
  RESOLUTION_TYPE_LABELS,
} from '@/lib/api/non-conformances-api';
import equipmentApi, { type Equipment } from '@/lib/api/equipment-api';
import { queryKeys } from '@/lib/api/query-config';
import { useAuth } from '@/hooks/use-auth';
import type { PaginatedResponse } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NonConformanceManagementClientProps {
  equipmentId: string;
  /** 서버 프리페치된 장비 데이터 (placeholderData로 사용) */
  initialEquipment?: Equipment;
  /** 서버 프리페치된 부적합 목록 (placeholderData로 사용) */
  initialNonConformances?: PaginatedResponse<NonConformance>;
}

export default function NonConformanceManagementClient({
  equipmentId,
  initialEquipment,
  initialNonConformances,
}: NonConformanceManagementClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { isManager } = useAuth();

  // 현재 로그인한 사용자 ID (세션에서 가져옴)
  const currentUserId = session?.user?.id ?? '';

  // React Query로 데이터 조회
  // 서버 프리페치 데이터를 placeholderData로 사용 → 즉시 표시 + 백그라운드 refetch
  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId),
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    placeholderData: initialEquipment,
  });

  const {
    data: nonConformancesData,
    isLoading: ncLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.nonConformances.byEquipment(equipmentId),
    queryFn: () => nonConformancesApi.getNonConformances({ equipmentId }),
    placeholderData: initialNonConformances,
  });

  const nonConformances = nonConformancesData?.data || [];
  const loading = equipmentLoading || ncLoading;

  // 부적합 등록 폼 상태
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    cause: '',
    ncType: 'other' as NonConformanceType,
    actionPlan: '',
  });
  const [creating, setCreating] = useState(false);

  // 업데이트 폼 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updateForm, setUpdateForm] = useState({
    analysisContent: '',
    correctionContent: '',
    status: '' as 'open' | 'analyzing' | 'corrected' | '',
  });
  const [updating, setUpdating] = useState(false);

  // 부적합 등록 mutation - Optimistic Update 패턴
  const createMutation = useOptimisticMutation<
    NonConformance,
    {
      equipmentId: string;
      discoveryDate: string;
      discoveredBy: string;
      cause: string;
      ncType: NonConformanceType;
      actionPlan?: string;
    },
    { data: NonConformance[] }
  >({
    mutationFn: (data) => nonConformancesApi.createNonConformance(data),
    queryKey: queryKeys.nonConformances.byEquipment(equipmentId),
    optimisticUpdate: (old, data) => {
      const newItem: NonConformance = {
        id: 'temp-' + Date.now(),
        ...data,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as NonConformance;

      return {
        data: [...(old?.data || []), newItem],
      };
    },
    invalidateKeys: [queryKeys.equipment.detail(equipmentId)],
    successMessage: '부적합이 등록되었습니다.',
    errorMessage: '부적합 등록에 실패했습니다.',
    onSuccessCallback: () => {
      setShowCreateForm(false);
      setCreateForm({ cause: '', ncType: 'other', actionPlan: '' });
      setCreating(false);
      router.refresh();
    },
    onErrorCallback: () => {
      setCreating(false);
    },
  });

  const handleCreate = () => {
    if (!createForm.cause.trim()) {
      alert('부적합 원인을 입력해주세요.');
      return;
    }

    setCreating(true);
    createMutation.mutate({
      equipmentId,
      discoveryDate: new Date().toISOString().split('T')[0],
      discoveredBy: currentUserId,
      cause: createForm.cause,
      ncType: createForm.ncType,
      actionPlan: createForm.actionPlan || undefined,
    });
  };

  // 부적합 수정 mutation - Optimistic Update + CAS 패턴
  const updateMutation = useOptimisticMutation<
    NonConformance,
    {
      id: string;
      updateData: {
        version: number;
        analysisContent?: string;
        correctionContent?: string;
        correctionDate?: string;
        correctedBy?: string;
        status?: 'open' | 'analyzing' | 'corrected';
      };
    },
    { data: NonConformance[] }
  >({
    mutationFn: ({ id, updateData }) => nonConformancesApi.updateNonConformance(id, updateData),
    queryKey: queryKeys.nonConformances.byEquipment(equipmentId),
    optimisticUpdate: (old, { id, updateData }) => {
      if (!old?.data) return { data: [] };

      return {
        data: old.data.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updateData,
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      };
    },
    invalidateKeys: [queryKeys.equipment.detail(equipmentId)],
    successMessage: '부적합 기록이 수정되었습니다.',
    errorMessage: '업데이트에 실패했습니다.',
    onSuccessCallback: () => {
      setEditingId(null);
      setUpdateForm({ analysisContent: '', correctionContent: '', status: '' });
      setUpdating(false);
      router.refresh();
    },
    onErrorCallback: () => {
      setUpdating(false);
    },
  });

  const handleUpdate = (id: string) => {
    const nc = nonConformances.find((n) => n.id === id);
    if (!nc) return;

    if (
      ['damage', 'malfunction'].includes(nc.ncType) &&
      !nc.repairHistoryId &&
      updateForm.status === 'corrected'
    ) {
      const userChoice = window.confirm(
        '손상/오작동 유형은 수리 기록 연결이 필요합니다.\n\n' +
          '수리 이력 페이지로 이동하시겠습니까?\n' +
          '(취소 시 상태 변경이 진행되지 않습니다)'
      );

      if (userChoice) {
        router.push(`/equipment/${equipmentId}/repair-history`);
        return;
      } else {
        return;
      }
    }

    setUpdating(true);
    const updateData: {
      version: number;
      analysisContent?: string;
      correctionContent?: string;
      correctionDate?: string;
      correctedBy?: string;
      status?: 'open' | 'analyzing' | 'corrected';
    } = { version: nc.version };
    if (updateForm.analysisContent) updateData.analysisContent = updateForm.analysisContent;
    if (updateForm.correctionContent) {
      updateData.correctionContent = updateForm.correctionContent;
      updateData.correctionDate = new Date().toISOString().split('T')[0];
      updateData.correctedBy = currentUserId;
    }
    if (updateForm.status) updateData.status = updateForm.status;

    updateMutation.mutate({ id, updateData });
  };

  const startEditing = (nc: NonConformance) => {
    setEditingId(nc.id);
    setUpdateForm({
      analysisContent: nc.analysisContent || '',
      correctionContent: nc.correctionContent || '',
      status: '',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />
        );
      case 'analyzing':
        return (
          <FileText className="h-5 w-5 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
        );
      case 'corrected':
        return <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" aria-hidden="true" />;
      case 'closed':
        return (
          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" aria-hidden="true" />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-32 ml-auto" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-6 bg-destructive/10 border-destructive/20 dark:bg-destructive/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">데이터 로딩 실패</h3>
                <p className="text-sm text-muted-foreground">데이터를 불러오는데 실패했습니다.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              재시도
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/equipment/${equipmentId}`}
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 motion-safe:transition-colors motion-reduce:transition-none"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          장비 상세로 돌아가기
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">부적합 관리</h1>
            {equipment && (
              <p className="text-muted-foreground mt-1">
                {equipment.name} ({equipment.managementNumber})
              </p>
            )}
          </div>
          {equipment?.status !== 'non_conforming' && (
            <Button variant="destructive" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              부적합 등록
            </Button>
          )}
        </div>
      </div>

      {/* 부적합 등록 폼 */}
      {showCreateForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold tracking-tight mb-4">부적합 등록</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nc-type">
                부적합 유형 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={createForm.ncType}
                onValueChange={(v) =>
                  setCreateForm({ ...createForm, ncType: v as NonConformanceType })
                }
              >
                <SelectTrigger id="nc-type" className="mt-1.5">
                  <SelectValue placeholder="유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damage">손상 (물리적 파손)</SelectItem>
                  <SelectItem value="malfunction">오작동 (기능 이상)</SelectItem>
                  <SelectItem value="calibration_failure">교정 실패</SelectItem>
                  <SelectItem value="measurement_error">측정 오류</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">
                손상/오작동 유형은 수리 기록이 필요합니다.
              </p>
            </div>
            <div>
              <Label htmlFor="nc-cause">
                부적합 원인 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="nc-cause"
                value={createForm.cause}
                onChange={(e) => setCreateForm({ ...createForm, cause: e.target.value })}
                rows={3}
                className="mt-1.5"
                placeholder="부적합 원인을 상세히 기술해주세요."
              />
            </div>
            <div>
              <Label htmlFor="nc-action-plan">조치 계획</Label>
              <Textarea
                id="nc-action-plan"
                value={createForm.actionPlan}
                onChange={(e) => setCreateForm({ ...createForm, actionPlan: e.target.value })}
                rows={2}
                className="mt-1.5"
                placeholder="조치 계획을 입력해주세요. (선택)"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={handleCreate} disabled={creating}>
                {creating ? '등록 중...' : '등록'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({ cause: '', ncType: 'other', actionPlan: '' });
                }}
              >
                취소
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 부적합 목록 */}
      <div className="space-y-4">
        {nonConformances.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="inline-block motion-safe:animate-gentle-bounce">
              <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </div>
            </div>
            <h3 className="mt-4 text-base font-medium tracking-tight text-foreground">
              부적합 기록 없음
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              등록된 부적합 기록이 없습니다.
            </p>
          </Card>
        ) : (
          nonConformances.map((nc, index) => (
            <Card
              key={nc.id}
              className="p-6 motion-safe:animate-[staggerFadeIn_0.3s_ease-out_forwards]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {getStatusIcon(nc.status)}
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${NON_CONFORMANCE_STATUS_COLORS[nc.status]}`}
                  >
                    {NON_CONFORMANCE_STATUS_LABELS[nc.status]}
                  </span>
                </div>
                <time dateTime={nc.discoveryDate} className="text-sm text-muted-foreground">
                  발견일: {new Date(nc.discoveryDate).toLocaleDateString('ko-KR')}
                </time>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                    {NON_CONFORMANCE_TYPE_LABELS[nc.ncType]}
                  </span>
                  {nc.resolutionType && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded">
                      해결: {RESOLUTION_TYPE_LABELS[nc.resolutionType]}
                    </span>
                  )}
                  {nc.repairHistoryId && (
                    <Link
                      href={`/equipment/${equipmentId}/repair-history`}
                      className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/30 motion-safe:transition-colors motion-reduce:transition-none"
                    >
                      수리 기록 연결됨
                    </Link>
                  )}
                </div>

                {/* 반려 사유 배너 */}
                {nc.status === 'analyzing' && nc.rejectionReason && (
                  <div className="rounded-md border p-4 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <XCircle
                        className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-medium text-red-900 dark:text-red-300">조치 반려됨</p>
                        <p className="text-sm text-red-800 dark:text-red-400 mt-1 leading-relaxed">
                          {nc.rejectionReason}
                        </p>
                        {nc.rejectedAt && (
                          <time
                            dateTime={nc.rejectedAt}
                            className="text-xs text-red-600 dark:text-red-500 mt-1 block"
                          >
                            반려일: {new Date(nc.rejectedAt).toLocaleDateString('ko-KR')}
                          </time>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">부적합 원인</h4>
                  <p className="text-foreground mt-1 leading-relaxed">{nc.cause}</p>
                </div>

                {nc.actionPlan && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">조치 계획</h4>
                    <p className="text-foreground mt-1 leading-relaxed">{nc.actionPlan}</p>
                  </div>
                )}

                {nc.analysisContent && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">원인 분석</h4>
                    <p className="text-foreground mt-1 leading-relaxed">{nc.analysisContent}</p>
                  </div>
                )}

                {nc.correctionContent && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">조치 내용</h4>
                    <p className="text-foreground mt-1 leading-relaxed">{nc.correctionContent}</p>
                    {nc.correctionDate && (
                      <time
                        dateTime={nc.correctionDate}
                        className="text-sm text-muted-foreground mt-1 block"
                      >
                        조치일: {new Date(nc.correctionDate).toLocaleDateString('ko-KR')}
                      </time>
                    )}
                  </div>
                )}

                {nc.closureNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">종료 메모</h4>
                    <p className="text-foreground mt-1 leading-relaxed">{nc.closureNotes}</p>
                    {nc.closedAt && (
                      <time
                        dateTime={nc.closedAt}
                        className="text-sm text-muted-foreground mt-1 block"
                      >
                        종료일: {new Date(nc.closedAt).toLocaleDateString('ko-KR')}
                      </time>
                    )}
                  </div>
                )}
              </div>

              {/* 수리 안내 카드 */}
              {nc.status !== 'closed' && ['damage', 'malfunction'].includes(nc.ncType) && (
                <div className="mt-4 pt-4 border-t border-border">
                  {!nc.repairHistoryId ? (
                    <div className="rounded-md border p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-yellow-900 dark:text-yellow-100">
                            수리 기록 필요
                          </p>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1 leading-relaxed">
                            {NON_CONFORMANCE_TYPE_LABELS[nc.ncType]} 유형은 부적합 종료 전 수리
                            기록이 필요합니다.
                          </p>
                          <Button
                            variant="default"
                            size="sm"
                            className="mt-3 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-500"
                            asChild
                          >
                            <Link
                              href={`/equipment/${equipmentId}/repair-history?ncId=${nc.id}&autoOpen=true`}
                            >
                              <Wrench className="h-4 w-4 mr-2" aria-hidden="true" />
                              수리 이력 등록하기
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                      수리 기록 연결됨 - 종료 승인 가능
                      <Link
                        href={`/equipment/${equipmentId}/repair-history`}
                        className="text-primary hover:underline ml-2"
                      >
                        수리 내역 보기 →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* 수정 폼 */}
              {editingId === nc.id && nc.status !== 'closed' && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  <div>
                    <Label htmlFor={`analysis-${nc.id}`}>원인 분석</Label>
                    <Textarea
                      id={`analysis-${nc.id}`}
                      value={updateForm.analysisContent}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, analysisContent: e.target.value })
                      }
                      rows={2}
                      className="mt-1.5"
                      placeholder="원인 분석 내용을 입력하세요."
                    />
                  </div>
                  <div>
                    <Label htmlFor={`correction-${nc.id}`}>조치 내용</Label>
                    <Textarea
                      id={`correction-${nc.id}`}
                      value={updateForm.correctionContent}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, correctionContent: e.target.value })
                      }
                      rows={2}
                      className="mt-1.5"
                      placeholder="조치 내용을 입력하세요."
                    />
                  </div>
                  <div>
                    <Label htmlFor={`status-${nc.id}`}>상태 변경</Label>
                    <Select
                      value={updateForm.status || '_keep'}
                      onValueChange={(v) =>
                        setUpdateForm({
                          ...updateForm,
                          status: v === '_keep' ? '' : (v as 'open' | 'analyzing' | 'corrected'),
                        })
                      }
                    >
                      <SelectTrigger id={`status-${nc.id}`} className="mt-1.5">
                        <SelectValue placeholder="상태 유지" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_keep">상태 유지</SelectItem>
                        <SelectItem value="analyzing">분석 중</SelectItem>
                        <SelectItem value="corrected">조치 완료</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => handleUpdate(nc.id)} disabled={updating}>
                      {updating ? '저장 중...' : '저장'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setUpdateForm({ analysisContent: '', correctionContent: '', status: '' });
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              {nc.status !== 'closed' && editingId !== nc.id && isManager() && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="secondary" size="sm" onClick={() => startEditing(nc)}>
                    <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                    기록 수정
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
