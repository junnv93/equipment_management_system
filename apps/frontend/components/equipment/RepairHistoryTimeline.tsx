'use client';

import { useState } from 'react';
import { Wrench, CheckCircle, AlertTriangle, Clock, Trash2, Edit } from 'lucide-react';
import type { RepairHistory } from '@/lib/api/repair-history-api';

interface RepairHistoryTimelineProps {
  repairs: RepairHistory[];
  onEdit?: (repair: RepairHistory) => void;
  onDelete?: (repair: RepairHistory) => void;
  isLoading?: boolean;
  canEdit?: boolean;
}

// 수리 결과 라벨
const REPAIR_RESULT_LABELS: Record<string, string> = {
  completed: '수리 완료',
  partial: '부분 수리',
  failed: '수리 실패',
};

// 수리 결과 색상 (dark mode 지원)
const REPAIR_RESULT_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export default function RepairHistoryTimeline({
  repairs,
  onEdit,
  onDelete,
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
        return (
          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" aria-hidden="true" />
        );
      case 'partial':
        return (
          <Clock className="h-5 w-5 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
        );
      case 'failed':
        return (
          <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />
        );
      default:
        return <Wrench className="h-5 w-5 text-muted-foreground" aria-hidden="true" />;
    }
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
      <div className="motion-safe:animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (repairs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block motion-safe:animate-gentle-bounce">
          <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Wrench className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
        <h3 className="mt-4 text-lg font-medium tracking-tight text-foreground">수리 이력 없음</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          이 장비의 수리 이력이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 타임라인 */}
      <div className="flow-root">
        <ul className="-mb-8">
          {repairs.map((repair, idx) => (
            <li key={repair.uuid}>
              <div className="relative pb-8">
                {/* 연결선 */}
                {idx !== repairs.length - 1 && (
                  <span
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-border"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex items-start space-x-3">
                  {/* 아이콘 원형 배경 (P1) */}
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center ring-8 ring-background">
                      {getResultIcon(repair.repairResult)}
                    </div>
                  </div>

                  {/* 내용 */}
                  <div className="min-w-0 flex-1">
                    <div className="bg-card rounded-lg border border-border p-4 hover:shadow-md motion-safe:transition-shadow motion-safe:duration-200 motion-reduce:transition-none">
                      {/* 헤더 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <time
                            dateTime={repair.repairDate}
                            className="text-sm font-medium text-foreground"
                          >
                            {formatDate(repair.repairDate)}
                          </time>
                          {repair.repairResult && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${REPAIR_RESULT_COLORS[repair.repairResult]}`}
                            >
                              {REPAIR_RESULT_LABELS[repair.repairResult]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <div className="flex gap-1">
                              {onEdit && (
                                <button
                                  onClick={() => onEdit(repair)}
                                  className="p-1 text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400 rounded motion-safe:transition-colors motion-reduce:transition-none"
                                  title="수정"
                                  aria-label="수리 이력 수정"
                                >
                                  <Edit className="h-4 w-4" aria-hidden="true" />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => onDelete(repair)}
                                  className="p-1 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 rounded motion-safe:transition-colors motion-reduce:transition-none"
                                  title="삭제"
                                  aria-label="수리 이력 삭제"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 수리 내용 */}
                      <p
                        className={`mt-2 text-sm text-foreground/80 leading-relaxed ${
                          !expandedItems.has(repair.uuid) ? 'line-clamp-2' : ''
                        }`}
                      >
                        {repair.repairDescription}
                      </p>
                      {repair.repairDescription.length > 100 && (
                        <button
                          onClick={() => toggleExpanded(repair.uuid)}
                          className="mt-1 text-xs text-primary hover:underline"
                        >
                          {expandedItems.has(repair.uuid) ? '간략히' : '더 보기'}
                        </button>
                      )}

                      {/* 비고 */}
                      {repair.notes && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
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
