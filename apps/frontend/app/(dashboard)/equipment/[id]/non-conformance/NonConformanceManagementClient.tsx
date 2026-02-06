'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Plus, AlertTriangle, FileText, CheckCircle, Clock, Wrench } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import nonConformancesApi, {
  NonConformance,
  NonConformanceType,
  NON_CONFORMANCE_STATUS_LABELS,
  NON_CONFORMANCE_STATUS_COLORS,
  NON_CONFORMANCE_TYPE_LABELS,
  RESOLUTION_TYPE_LABELS,
} from '@/lib/api/non-conformances-api';
import equipmentApi from '@/lib/api/equipment-api';
import { useAuth } from '@/hooks/use-auth';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';

interface NonConformanceManagementClientProps {
  equipmentId: string;
}

export default function NonConformanceManagementClient({
  equipmentId,
}: NonConformanceManagementClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { isManager } = useAuth();

  // 현재 로그인한 사용자 ID (세션에서 가져옴)
  const currentUserId = session?.user?.id ?? '';

  const [equipment, setEquipment] = useState<{
    id: string;
    name: string;
    managementNumber: string;
    status: string;
  } | null>(null);
  const [nonConformances, setNonConformances] = useState<NonConformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [equipmentData, ncData] = await Promise.all([
        equipmentApi.getEquipment(equipmentId),
        nonConformancesApi.getNonConformances({ equipmentId }),
      ]);
      setEquipment({
        id: String(equipmentData.id),
        name: equipmentData.name,
        managementNumber: equipmentData.managementNumber,
        status: equipmentData.status || 'available',
      });
      setNonConformances(ncData.data);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.cause.trim()) {
      alert('부적합 원인을 입력해주세요.');
      return;
    }

    try {
      setCreating(true);
      await nonConformancesApi.createNonConformance({
        equipmentId,
        discoveryDate: new Date().toISOString().split('T')[0],
        discoveredBy: currentUserId,
        cause: createForm.cause,
        ncType: createForm.ncType,
        actionPlan: createForm.actionPlan || undefined,
      });
      setShowCreateForm(false);
      setCreateForm({ cause: '', ncType: 'other', actionPlan: '' });

      await EquipmentCacheInvalidation.invalidateAfterNonConformanceCreation(
        queryClient,
        equipmentId
      );
      await EquipmentCacheInvalidation.refetchEquipment(queryClient, equipmentId);

      await loadData();
      router.refresh();
    } catch (err) {
      alert('부적합 등록에 실패했습니다.');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const nc = nonConformances.find((n) => n.id === id);

    if (
      nc &&
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

    try {
      setUpdating(true);
      const updateData: {
        analysisContent?: string;
        correctionContent?: string;
        correctionDate?: string;
        correctedBy?: string;
        status?: 'open' | 'analyzing' | 'corrected';
      } = {};
      if (updateForm.analysisContent) updateData.analysisContent = updateForm.analysisContent;
      if (updateForm.correctionContent) {
        updateData.correctionContent = updateForm.correctionContent;
        updateData.correctionDate = new Date().toISOString().split('T')[0];
        updateData.correctedBy = currentUserId;
      }
      if (updateForm.status) updateData.status = updateForm.status;

      await nonConformancesApi.updateNonConformance(id, updateData);
      setEditingId(null);
      setUpdateForm({ analysisContent: '', correctionContent: '', status: '' });

      await EquipmentCacheInvalidation.invalidateAfterNonConformanceCreation(
        queryClient,
        equipmentId
      );
      await EquipmentCacheInvalidation.refetchEquipment(queryClient, equipmentId);

      await loadData();
      router.refresh();
    } catch (err) {
      alert('업데이트에 실패했습니다.');
      console.error(err);
    } finally {
      setUpdating(false);
    }
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
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'analyzing':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case 'corrected':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/equipment/${equipmentId}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          장비 상세로 돌아가기
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">부적합 관리</h1>
            {equipment && (
              <p className="text-gray-600 mt-1">
                {equipment.name} ({equipment.managementNumber})
              </p>
            )}
          </div>
          {equipment?.status !== 'non_conforming' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              부적합 등록
            </button>
          )}
        </div>
      </div>

      {/* 부적합 등록 폼 */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">부적합 등록</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                부적합 유형 <span className="text-red-500">*</span>
              </label>
              <select
                value={createForm.ncType}
                onChange={(e) =>
                  setCreateForm({ ...createForm, ncType: e.target.value as NonConformanceType })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="damage">손상 (물리적 파손)</option>
                <option value="malfunction">오작동 (기능 이상)</option>
                <option value="calibration_failure">교정 실패</option>
                <option value="measurement_error">측정 오류</option>
                <option value="other">기타</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                손상/오작동 유형은 수리 기록이 필요합니다.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                부적합 원인 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={createForm.cause}
                onChange={(e) => setCreateForm({ ...createForm, cause: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="부적합 원인을 상세히 기술해주세요."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">조치 계획</label>
              <textarea
                value={createForm.actionPlan}
                onChange={(e) => setCreateForm({ ...createForm, actionPlan: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="조치 계획을 입력해주세요. (선택)"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {creating ? '등록 중...' : '등록'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({ cause: '', ncType: 'other', actionPlan: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 부적합 목록 */}
      <div className="space-y-4">
        {nonConformances.length === 0 ? (
          <div className="bg-gray-50 text-gray-500 p-8 rounded-lg text-center">
            등록된 부적합 기록이 없습니다.
          </div>
        ) : (
          nonConformances.map((nc) => (
            <div key={nc.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(nc.status)}
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${NON_CONFORMANCE_STATUS_COLORS[nc.status]}`}
                  >
                    {NON_CONFORMANCE_STATUS_LABELS[nc.status]}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  발견일: {new Date(nc.discoveryDate).toLocaleDateString('ko-KR')}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    {NON_CONFORMANCE_TYPE_LABELS[nc.ncType]}
                  </span>
                  {nc.resolutionType && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      해결: {RESOLUTION_TYPE_LABELS[nc.resolutionType]}
                    </span>
                  )}
                  {nc.repairHistoryId && (
                    <Link
                      href={`/equipment/${equipmentId}/repair-history`}
                      className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      수리 기록 연결됨
                    </Link>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700">부적합 원인</h4>
                  <p className="text-gray-900 mt-1">{nc.cause}</p>
                </div>

                {nc.actionPlan && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">조치 계획</h4>
                    <p className="text-gray-900 mt-1">{nc.actionPlan}</p>
                  </div>
                )}

                {nc.analysisContent && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">원인 분석</h4>
                    <p className="text-gray-900 mt-1">{nc.analysisContent}</p>
                  </div>
                )}

                {nc.correctionContent && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">조치 내용</h4>
                    <p className="text-gray-900 mt-1">{nc.correctionContent}</p>
                    {nc.correctionDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        조치일: {new Date(nc.correctionDate).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                )}

                {nc.closureNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">종료 메모</h4>
                    <p className="text-gray-900 mt-1">{nc.closureNotes}</p>
                    {nc.closedAt && (
                      <p className="text-sm text-gray-500 mt-1">
                        종료일: {new Date(nc.closedAt).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 수리 안내 카드 */}
              {nc.status !== 'closed' && ['damage', 'malfunction'].includes(nc.ncType) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {!nc.repairHistoryId ? (
                    <div className="rounded-md border p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-yellow-900 dark:text-yellow-100">
                            수리 기록 필요
                          </p>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                            {NON_CONFORMANCE_TYPE_LABELS[nc.ncType]} 유형은 부적합 종료 전 수리
                            기록이 필요합니다.
                          </p>
                          <Link
                            href={`/equipment/${equipmentId}/repair-history?ncId=${nc.id}&autoOpen=true`}
                            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                          >
                            <Wrench className="h-4 w-4" />
                            수리 이력 등록하기
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      수리 기록 연결됨 - 종료 승인 가능
                      <Link
                        href={`/equipment/${equipmentId}/repair-history`}
                        className="text-blue-600 hover:underline ml-2"
                      >
                        수리 내역 보기 →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* 수정 폼 */}
              {editingId === nc.id && nc.status !== 'closed' && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      원인 분석
                    </label>
                    <textarea
                      value={updateForm.analysisContent}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, analysisContent: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="원인 분석 내용을 입력하세요."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      조치 내용
                    </label>
                    <textarea
                      value={updateForm.correctionContent}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, correctionContent: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="조치 내용을 입력하세요."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상태 변경
                    </label>
                    <select
                      value={updateForm.status}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          status: e.target.value as 'open' | 'analyzing' | 'corrected' | '',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">상태 유지</option>
                      <option value="analyzing">분석 중</option>
                      <option value="corrected">조치 완료</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdate(nc.id)}
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {updating ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setUpdateForm({ analysisContent: '', correctionContent: '', status: '' });
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              {nc.status !== 'closed' && editingId !== nc.id && isManager() && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => startEditing(nc)}
                    className="inline-flex items-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    기록 수정
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
