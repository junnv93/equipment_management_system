'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Calendar, Wrench, AlertTriangle, Clock } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import { formatDate, toDate } from '@/lib/utils/date';
import { differenceInDays } from 'date-fns';
import { useTranslations } from 'next-intl';

interface EquipmentHistorySummaryProps {
  equipment: Equipment;
}

export function EquipmentHistorySummary({ equipment }: EquipmentHistorySummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations('disposal.historySummary');

  const purchaseDate = toDate(equipment.purchaseDate);
  const usagePeriod = purchaseDate ? differenceInDays(new Date(), purchaseDate) : 0;

  const usageYears = Math.floor(usagePeriod / 365);
  const usageMonths = Math.floor((usagePeriod % 365) / 30);

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">{t('title')}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? t('collapse') : t('expand')}
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
                <p className="text-xs text-gray-500">{t('lastCalibration')}</p>
                <p className="text-sm font-medium">
                  {equipment.lastCalibrationDate
                    ? formatDate(equipment.lastCalibrationDate)
                    : t('noRecord')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Wrench className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">{t('repairHistory')}</p>
                <p className="text-sm font-medium">{t('noInfo')}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">{t('ncHistory')}</p>
                <p className="text-sm font-medium">{t('noInfo')}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">{t('usagePeriod')}</p>
                <p className="text-sm font-medium">
                  {usageYears > 0 && t('years', { count: usageYears })}
                  {usageMonths > 0 && t('months', { count: usageMonths })}
                  {usagePeriod === 0 && t('noInfo')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
