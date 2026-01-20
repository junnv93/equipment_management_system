'use client';

import { AlertTriangle, FileText, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { NonConformance } from '@/lib/api/non-conformances-api';
import {
  NON_CONFORMANCE_STATUS_LABELS,
  NON_CONFORMANCE_STATUS_COLORS,
} from '@/lib/api/non-conformances-api';

interface NonConformanceBannerProps {
  equipmentId: string;
  nonConformances: NonConformance[];
  showDetails?: boolean;
}

export default function NonConformanceBanner({
  equipmentId,
  nonConformances,
  showDetails = false,
}: NonConformanceBannerProps) {
  // 열린 부적합만 필터링 (closed 제외)
  const openNonConformances = nonConformances.filter((nc) => nc.status !== 'closed');

  if (openNonConformances.length === 0) {
    return null;
  }

  // 가장 최근 부적합
  const latestNonConformance = openNonConformances[0];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-5 w-5" />;
      case 'analyzing':
        return <FileText className="h-5 w-5" />;
      case 'corrected':
        return <Clock className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-semibold text-red-800">
            부적합 상태
            {openNonConformances.length > 1 && (
              <span className="ml-2 text-sm font-normal">({openNonConformances.length}건)</span>
            )}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p className="font-medium">이 장비는 현재 부적합 상태입니다.</p>
            <p className="mt-1">부적합 처리가 완료될 때까지 대여 및 반출이 제한됩니다.</p>
          </div>

          {showDetails && (
            <div className="mt-4 space-y-3">
              {openNonConformances.map((nc) => (
                <div key={nc.id} className="bg-white p-3 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(nc.status)}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${NON_CONFORMANCE_STATUS_COLORS[nc.status]}`}
                      >
                        {NON_CONFORMANCE_STATUS_LABELS[nc.status]}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      발견일: {new Date(nc.discoveryDate).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 line-clamp-2">{nc.cause}</p>
                  {nc.actionPlan && (
                    <p className="mt-1 text-xs text-gray-500">조치 계획: {nc.actionPlan}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <Link
              href={`/equipment/${equipmentId}/non-conformance`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              부적합 관리
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
