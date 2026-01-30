'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowRight, CheckCircle2, Equal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConditionCheck } from '@/lib/api/checkout-api';
import {
  CONDITION_CHECK_STEP_LABELS,
  CONDITION_STATUS_LABELS,
  ACCESSORIES_STATUS_LABELS,
  ConditionCheckStep,
} from '@equipment-management/schemas';

interface ConditionComparisonCardProps {
  conditionChecks: ConditionCheck[];
}

/**
 * 상태 비교 쌍 정의
 * - ①단계(반출 전)와 ④단계(반입 시) 비교
 * - ②단계(인수 시)와 ③단계(반납 전) 비교
 */
const COMPARISON_PAIRS: [ConditionCheckStep, ConditionCheckStep][] = [
  ['lender_checkout', 'lender_return'], // 빌려주는 측: 반출 전 vs 반입 시
  ['borrower_receive', 'borrower_return'], // 빌리는 측: 인수 시 vs 반납 전
];

/**
 * 상태 확인 전후 비교 카드
 *
 * 대여 목적 반출 시 양측 4단계 확인 기록을 비교합니다:
 * - 빌려주는 측: 반출 전(①) vs 반입 시(④)
 * - 빌리는 측: 인수 시(②) vs 반납 전(③)
 *
 * 상태가 변경된 경우 강조 표시합니다.
 */
export default function ConditionComparisonCard({ conditionChecks }: ConditionComparisonCardProps) {
  // 단계별 확인 기록 찾기
  const getCheckByStep = (step: ConditionCheckStep): ConditionCheck | undefined => {
    return conditionChecks.find((check) => check.step === step);
  };

  // 비교 가능한 쌍 필터링
  const availablePairs = COMPARISON_PAIRS.filter(([before, after]) => {
    return getCheckByStep(before) && getCheckByStep(after);
  });

  if (availablePairs.length === 0) {
    return null;
  }

  // 상태 변경 여부 확인
  const hasChange = (
    before: ConditionCheck,
    after: ConditionCheck
  ): { appearance: boolean; operation: boolean; accessories: boolean } => {
    return {
      appearance: before.appearanceStatus !== after.appearanceStatus,
      operation: before.operationStatus !== after.operationStatus,
      accessories:
        before.accessoriesStatus !== undefined &&
        after.accessoriesStatus !== undefined &&
        before.accessoriesStatus !== after.accessoriesStatus,
    };
  };

  // 상태 악화 여부 확인
  const isWorsened = (before: string, after: string): boolean => {
    if (before === 'normal' && after === 'abnormal') return true;
    if (before === 'complete' && after === 'incomplete') return true;
    return false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">상태 전후 비교</CardTitle>
        <CardDescription>대여 전후 장비 상태 비교입니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {availablePairs.map(([beforeStep, afterStep]) => {
          const beforeCheck = getCheckByStep(beforeStep)!;
          const afterCheck = getCheckByStep(afterStep)!;
          const changes = hasChange(beforeCheck, afterCheck);
          const hasAnyChange = changes.appearance || changes.operation || changes.accessories;

          return (
            <div key={`${beforeStep}-${afterStep}`} className="space-y-4">
              {/* 비교 헤더 */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <Badge variant="outline">{CONDITION_CHECK_STEP_LABELS[beforeStep]}</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">{CONDITION_CHECK_STEP_LABELS[afterStep]}</Badge>
                {hasAnyChange ? (
                  <Badge variant="destructive" className="ml-auto">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    변경됨
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-auto">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    동일
                  </Badge>
                )}
              </div>

              {/* 상태 비교 테이블 */}
              <div className="grid gap-3">
                {/* 외관 상태 */}
                <div
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    changes.appearance
                      ? isWorsened(beforeCheck.appearanceStatus, afterCheck.appearanceStatus)
                        ? 'bg-red-50'
                        : 'bg-yellow-50'
                      : 'bg-muted/50'
                  )}
                >
                  <span className="text-sm text-muted-foreground">외관 상태</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        beforeCheck.appearanceStatus === 'normal' ? 'default' : 'destructive'
                      }
                    >
                      {CONDITION_STATUS_LABELS[beforeCheck.appearanceStatus]}
                    </Badge>
                    {changes.appearance ? (
                      <ArrowRight className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Equal className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Badge
                      variant={afterCheck.appearanceStatus === 'normal' ? 'default' : 'destructive'}
                    >
                      {CONDITION_STATUS_LABELS[afterCheck.appearanceStatus]}
                    </Badge>
                  </div>
                </div>

                {/* 작동 상태 */}
                <div
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    changes.operation
                      ? isWorsened(beforeCheck.operationStatus, afterCheck.operationStatus)
                        ? 'bg-red-50'
                        : 'bg-yellow-50'
                      : 'bg-muted/50'
                  )}
                >
                  <span className="text-sm text-muted-foreground">작동 상태</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={beforeCheck.operationStatus === 'normal' ? 'default' : 'destructive'}
                    >
                      {CONDITION_STATUS_LABELS[beforeCheck.operationStatus]}
                    </Badge>
                    {changes.operation ? (
                      <ArrowRight className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Equal className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Badge
                      variant={afterCheck.operationStatus === 'normal' ? 'default' : 'destructive'}
                    >
                      {CONDITION_STATUS_LABELS[afterCheck.operationStatus]}
                    </Badge>
                  </div>
                </div>

                {/* 부속품 상태 */}
                {beforeCheck.accessoriesStatus && afterCheck.accessoriesStatus && (
                  <div
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      changes.accessories
                        ? isWorsened(beforeCheck.accessoriesStatus, afterCheck.accessoriesStatus)
                          ? 'bg-red-50'
                          : 'bg-yellow-50'
                        : 'bg-muted/50'
                    )}
                  >
                    <span className="text-sm text-muted-foreground">부속품 상태</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          beforeCheck.accessoriesStatus === 'complete' ? 'default' : 'secondary'
                        }
                      >
                        {ACCESSORIES_STATUS_LABELS[beforeCheck.accessoriesStatus]}
                      </Badge>
                      {changes.accessories ? (
                        <ArrowRight className="h-4 w-4 text-orange-500" />
                      ) : (
                        <Equal className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge
                        variant={
                          afterCheck.accessoriesStatus === 'complete' ? 'default' : 'secondary'
                        }
                      >
                        {ACCESSORIES_STATUS_LABELS[afterCheck.accessoriesStatus]}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* 비교 메모 */}
              {afterCheck.comparisonWithPrevious && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">비교 메모</p>
                  <p className="text-sm">{afterCheck.comparisonWithPrevious}</p>
                </div>
              )}

              {/* 이상 내용 (후단계) */}
              {afterCheck.abnormalDetails && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-800 font-medium mb-1">이상 내용</p>
                  <p className="text-sm text-red-700">{afterCheck.abnormalDetails}</p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
