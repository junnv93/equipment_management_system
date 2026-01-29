'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';

interface CalibrationFactorsTabProps {
  equipment: Equipment;
}

export function CalibrationFactorsTab({ equipment: _equipment }: CalibrationFactorsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-ul-midnight" />
          보정계수
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <Gauge className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>보정계수 기능은 준비 중입니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}
