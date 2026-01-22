'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileOutput } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';

interface CheckoutHistoryTabProps {
  equipment: Equipment;
}

export function CheckoutHistoryTab({ equipment }: CheckoutHistoryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileOutput className="h-5 w-5 text-ul-midnight" />
          반출 이력
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <FileOutput className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>반출 이력 기능은 준비 중입니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}
