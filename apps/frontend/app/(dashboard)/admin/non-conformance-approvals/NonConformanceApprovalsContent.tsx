'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import nonConformancesApi, {
  NonConformance,
  NON_CONFORMANCE_STATUS_LABELS,
  NON_CONFORMANCE_STATUS_COLORS,
} from '@/lib/api/non-conformances-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { getErrorMessage } from '@/lib/api/error';
import { useToast } from '@/components/ui/use-toast';

export default function NonConformanceApprovalsContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closureNotes, setClosureNotes] = useState<Record<string, string>>({});

  // ✅ TanStack Query로 서버 상태 관리 (useState + useEffect 패턴 제거)
  const {
    data: nonConformances = [],
    isLoading: loading,
    isError,
  } = useQuery<NonConformance[]>({
    queryKey: [...queryKeys.nonConformances.lists(), { status: 'corrected' }],
    queryFn: async () => {
      const data = await nonConformancesApi.getPendingCloseNonConformances();
      return data.data;
    },
    ...QUERY_CONFIG.PENDING_APPROVALS,
  });

  // ✅ useMutation으로 종료 처리
  const closeMutation = useMutation({
    mutationFn: async ({ id, version, notes }: { id: string; version: number; notes?: string }) => {
      return nonConformancesApi.closeNonConformance(id, {
        version,
        closureNotes: notes || undefined,
      });
    },
    onSuccess: (_data, variables) => {
      toast({ title: '사용 재개 승인 완료', description: '부적합이 종료되었습니다.' });
      setClosureNotes((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
    },
    onError: (error: unknown) => {
      toast({
        title: '종료 처리 실패',
        description: getErrorMessage(error, '종료 처리에 실패했습니다.'),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setClosingId(null);
      // ✅ SSOT: 서버 동기화는 onSettled에서
      queryClient.invalidateQueries({ queryKey: queryKeys.nonConformances.all });
    },
  });

  const handleClose = (id: string) => {
    const nc = nonConformances.find((n) => n.id === id);
    if (!nc) return;
    setClosingId(id);
    closeMutation.mutate({
      id,
      version: nc.version,
      notes: closureNotes[id],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          데이터를 불러오는데 실패했습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">부적합 재개 승인</h1>
        <p className="text-gray-600 mt-1">
          조치 완료된 부적합 장비의 사용 재개를 승인합니다. (기술책임자 전용)
        </p>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              아래 목록은 조치 완료(corrected) 상태인 부적합 기록입니다.
              <br />
              종료 승인 시 해당 장비는 다시 사용 가능 상태로 변경됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 부적합 목록 */}
      {nonConformances.length === 0 ? (
        <div className="bg-gray-50 text-gray-500 p-8 rounded-lg text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>승인 대기 중인 부적합 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {nonConformances.map((nc) => (
            <div key={nc.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${NON_CONFORMANCE_STATUS_COLORS[nc.status]}`}
                    >
                      {NON_CONFORMANCE_STATUS_LABELS[nc.status]}
                    </span>
                    <span className="text-sm text-gray-500">
                      발견일: {new Date(nc.discoveryDate).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <Link
                    href={`/equipment/${nc.equipmentId}`}
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    장비 상세 보기
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">부적합 원인</h4>
                  <p className="text-gray-900 mt-1">{nc.cause}</p>
                </div>

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
                  </div>
                )}

                {nc.correctionDate && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">조치 완료일</h4>
                    <p className="text-gray-900 mt-1">
                      {new Date(nc.correctionDate).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>

              {/* 종료 승인 영역 */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료 메모 (선택)
                    </label>
                    <input
                      type="text"
                      value={closureNotes[nc.id] || ''}
                      onChange={(e) =>
                        setClosureNotes((prev) => ({
                          ...prev,
                          [nc.id]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="종료 메모를 입력하세요."
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => handleClose(nc.id)}
                      disabled={closingId === nc.id}
                      className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {closingId === nc.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          처리 중...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          사용 재개 승인
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
