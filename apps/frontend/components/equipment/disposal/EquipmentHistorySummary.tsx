'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Calendar, Wrench, AlertTriangle, Clock } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import { formatDate } from '@/lib/utils/date';
import { differenceInDays } from 'date-fns';

interface EquipmentHistorySummaryProps {
  equipment: Equipment;
}

export function EquipmentHistorySummary({ equipment }: EquipmentHistorySummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const usagePeriod = equipment.purchaseDate
    ? differenceInDays(new Date(), new Date(equipment.purchaseDate))
    : 0;

  const usageYears = Math.floor(usagePeriod / 365);
  const usageMonths = Math.floor((usagePeriod % 365) / 30);

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">장비 이력 요약</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? '장비 이력 접기' : '장비 이력 펼치기'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">마지막 교정</p>
                <p className="text-sm font-medium">
                  {equipment.lastCalibrationDate
                    ? formatDate(equipment.lastCalibrationDate)
                    : '기록 없음'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Wrench className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">수리 이력</p>
                <p className="text-sm font-medium">정보 없음</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">부적합 이력</p>
                <p className="text-sm font-medium">정보 없음</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">사용 기간</p>
                <p className="text-sm font-medium">
                  {usageYears > 0 && `${usageYears}년 `}
                  {usageMonths > 0 && `${usageMonths}개월`}
                  {usagePeriod === 0 && '정보 없음'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
