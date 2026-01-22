'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Calendar } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import calibrationApi from '@/lib/api/calibration-api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';

interface CalibrationHistoryTabProps {
  equipment: Equipment;
}

export function CalibrationHistoryTab({ equipment }: CalibrationHistoryTabProps) {
  const { data: calibrations, isLoading } = useQuery({
    queryKey: ['calibrations', 'equipment', equipment.uuid],
    queryFn: () => calibrationApi.getEquipmentCalibrations(equipment.uuid),
    enabled: !!equipment.uuid,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!calibrations || calibrations.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-ul-midnight" />
            교정 이력
          </CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            교정 등록
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>등록된 교정 이력이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-ul-midnight" />
          교정 이력
        </CardTitle>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          교정 등록
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>교정일</TableHead>
              <TableHead>다음 교정일</TableHead>
              <TableHead>교정 기관</TableHead>
              <TableHead>결과</TableHead>
              <TableHead>비고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calibrations.map((cal: any) => (
              <TableRow key={cal.id}>
                <TableCell>{dayjs(cal.calibrationDate).format('YYYY-MM-DD')}</TableCell>
                <TableCell>{dayjs(cal.nextCalibrationDate).format('YYYY-MM-DD')}</TableCell>
                <TableCell>{cal.calibrationAgency}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      cal.calibrationResult === 'PASS' ? 'default' : 'destructive'
                    }
                  >
                    {cal.calibrationResult === 'PASS' ? '적합' : '부적합'}
                  </Badge>
                </TableCell>
                <TableCell>{cal.notes || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
