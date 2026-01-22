'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, AlertTriangle, Calendar, User } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import equipmentApi from '@/lib/api/equipment-api';
import dayjs from 'dayjs';
import { useAuth } from '@/hooks/use-auth';

interface IncidentHistoryTabProps {
  equipment: Equipment;
}

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  damage: '손상',
  malfunction: '오작동',
  change: '변경',
  repair: '수리',
};

const INCIDENT_TYPE_COLORS: Record<string, string> = {
  damage: 'bg-red-500',
  malfunction: 'bg-orange-500',
  change: 'bg-blue-500',
  repair: 'bg-green-500',
};

export function IncidentHistoryTab({ equipment }: IncidentHistoryTabProps) {
  const { hasRole } = useAuth();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['incident-history', equipment.uuid],
    queryFn: () => equipmentApi.getIncidentHistory(equipment.uuid),
    enabled: !!equipment.uuid,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-ul-midnight" />
            사고 이력
          </CardTitle>
          {hasRole(['test_engineer', 'technical_manager', 'lab_manager', 'system_admin']) && (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              사고 등록
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>등록된 사고 이력이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-ul-midnight" />
          사고 이력
        </CardTitle>
        {hasRole(['test_engineer', 'technical_manager', 'lab_manager', 'system_admin']) && (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            사고 등록
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-800" />

          {history.map((item, index) => (
            <div key={item.id} className="relative flex gap-4">
              <div className="relative flex-shrink-0">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${INCIDENT_TYPE_COLORS[item.incidentType] || 'bg-gray-500'} text-white shadow-lg`}
                >
                  <AlertTriangle className="h-6 w-6" />
                </div>
                {index === 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-ul-red text-white px-1.5 py-0.5 text-xs">
                    최신
                  </Badge>
                )}
              </div>

              <div className="flex-1 pb-8">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {INCIDENT_TYPE_LABELS[item.incidentType] || item.incidentType}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{dayjs(item.occurredAt).format('YYYY-MM-DD')}</span>
                            </div>
                          </div>
                          <h4 className="text-lg font-semibold text-ul-midnight dark:text-white">
                            {item.content}
                          </h4>
                        </div>
                      </div>

                      {(item.reportedBy || item.reportedByName) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>보고자: {item.reportedByName || item.reportedBy}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
