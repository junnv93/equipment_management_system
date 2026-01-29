'use client';

import { useState } from 'react';
import { Wrench, CheckCircle, AlertTriangle, Clock, Trash2, Edit, Plus } from 'lucide-react';
import type { RepairHistory } from '@/lib/api/repair-history-api';

interface RepairHistoryTimelineProps {
  repairs: RepairHistory[];
  onEdit?: (repair: RepairHistory) => void;
  onDelete?: (repair: RepairHistory) => void;
  onAdd?: () => void;
  isLoading?: boolean;
  canEdit?: boolean;
}

// 수리 결과 라벨
const REPAIR_RESULT_LABELS: Record<string, string> = {
  completed: '수리 완료',
  partial: '부분 수리',
  failed: '수리 실패',
};

// 수리 결과 색상
const REPAIR_RESULT_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
};

export default function RepairHistoryTimeline({
  repairs,
  onEdit,
  onDelete,
  onAdd,
  isLoading = false,
  canEdit = false,
}: RepairHistoryTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (uuid: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(uuid)) {
      newExpanded.delete(uuid);
    } else {
      newExpanded.add(uuid);
    }
    setExpandedItems(newExpanded);
  };

  const getResultIcon = (result?: string) => {
    switch (result) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'partial':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Wrench className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (repairs.length === 0) {
    return (
      <div className="text-center py-12">
        <Wrench className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">수리 이력 없음</h3>
        <p className="mt-2 text-sm text-gray-500">이 장비의 수리 이력이 없습니다.</p>
        {canEdit && onAdd && (
          <button
            onClick={onAdd}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            수리 이력 추가
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 상단 액션 버튼 */}
      {canEdit && onAdd && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            수리 이력 추가
          </button>
        </div>
      )}

      {/* 타임라인 */}
      <div className="flow-root">
        <ul className="-mb-8">
          {repairs.map((repair, idx) => (
            <li key={repair.uuid}>
              <div className="relative pb-8">
                {/* 연결선 */}
                {idx !== repairs.length - 1 && (
                  <span
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex items-start space-x-3">
                  {/* 아이콘 */}
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                      {getResultIcon(repair.repairResult)}
                    </div>
                  </div>

                  {/* 내용 */}
                  <div className="min-w-0 flex-1">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      {/* 헤더 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(repair.repairDate)}
                          </span>
                          {repair.repairResult && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${REPAIR_RESULT_COLORS[repair.repairResult]}`}
                            >
                              {REPAIR_RESULT_LABELS[repair.repairResult]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {repair.cost !== undefined && repair.cost !== null && (
                            <span className="text-sm font-semibold text-blue-600">
                              {formatCurrency(repair.cost)}
                            </span>
                          )}
                          {canEdit && (
                            <div className="flex gap-1">
                              {onEdit && (
                                <button
                                  onClick={() => onEdit(repair)}
                                  className="p-1 text-gray-400 hover:text-blue-500 rounded"
                                  title="수정"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => onDelete(repair)}
                                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                                  title="삭제"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 수리 내용 */}
                      <p
                        className={`mt-2 text-sm text-gray-700 ${
                          !expandedItems.has(repair.uuid) ? 'line-clamp-2' : ''
                        }`}
                      >
                        {repair.repairDescription}
                      </p>
                      {repair.repairDescription.length > 100 && (
                        <button
                          onClick={() => toggleExpanded(repair.uuid)}
                          className="mt-1 text-xs text-blue-600 hover:underline"
                        >
                          {expandedItems.has(repair.uuid) ? '간략히' : '더 보기'}
                        </button>
                      )}

                      {/* 상세 정보 */}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                        {repair.repairedBy && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">담당자:</span>
                            {repair.repairedBy}
                          </span>
                        )}
                        {repair.repairCompany && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">수리업체:</span>
                            {repair.repairCompany}
                          </span>
                        )}
                      </div>

                      {/* 비고 */}
                      {repair.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          <span className="font-medium">비고: </span>
                          {repair.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
