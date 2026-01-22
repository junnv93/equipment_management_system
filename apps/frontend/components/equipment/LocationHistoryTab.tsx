'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MapPin, Calendar, User, FileText } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import equipmentApi, { type LocationHistoryItem } from '@/lib/api/equipment-api';
import dayjs from 'dayjs';
import { useAuth } from '@/hooks/use-auth';

interface LocationHistoryTabProps {
  equipment: Equipment;
}

/**
 * 위치 변동 이력 탭 - 타임라인 UI
 *
 * UL Solutions 브랜딩:
 * - 타임라인: 세로 레이아웃, 날짜 + 내용 + 담당자
 * - 색상: UL Midnight Blue 포인트
 */
export function LocationHistoryTab({ equipment }: LocationHistoryTabProps) {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  // 위치 변동 이력 조회
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['location-history', equipment.uuid],
    queryFn: () => equipmentApi.getLocationHistory(equipment.uuid),
    enabled: !!equipment.uuid,
  });

  // 위치 변동 이력 삭제
  const deleteMutation = useMutation({
    mutationFn: (historyId: string) => equipmentApi.deleteLocationHistory(historyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-history', equipment.uuid] });
    },
  });

  const handleDelete = async (historyId: string) => {
    if (confirm('이 위치 변동 이력을 삭제하시겠습니까?')) {
      await deleteMutation.mutateAsync(historyId);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            위치 변동 이력
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
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

  // 빈 상태
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-ul-midnight" />
            위치 변동 이력
          </CardTitle>
          {hasRole(['test_engineer', 'technical_manager', 'lab_manager', 'system_admin']) && (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              위치 변경 등록
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>등록된 위치 변동 이력이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-ul-midnight" />
          위치 변동 이력
        </CardTitle>
        {hasRole(['test_engineer', 'technical_manager', 'lab_manager', 'system_admin']) && (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            위치 변경 등록
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* 타임라인 */}
        <div className="relative space-y-6">
          {/* 타임라인 세로선 */}
          <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-800" />

          {history.map((item, index) => (
            <div key={item.id} className="relative flex gap-4">
              {/* 타임라인 점 */}
              <div className="relative flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ul-midnight text-white shadow-lg">
                  <MapPin className="h-6 w-6" />
                </div>
                {index === 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-ul-red text-white px-1.5 py-0.5 text-xs">
                    최신
                  </Badge>
                )}
              </div>

              {/* 컨텐츠 */}
              <div className="flex-1 pb-8">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 헤더: 날짜 및 위치 */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{dayjs(item.changedAt).format('YYYY-MM-DD')}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-ul-midnight dark:text-white">
                            {item.newLocation}
                          </h4>
                        </div>
                        {hasRole(['technical_manager', 'lab_manager', 'system_admin']) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteMutation.isPending}
                          >
                            삭제
                          </Button>
                        )}
                      </div>

                      {/* 비고 */}
                      {item.notes && (
                        <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <p>{item.notes}</p>
                        </div>
                      )}

                      {/* 담당자 */}
                      {(item.changedBy || item.changedByName) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>변경자: {item.changedByName || item.changedBy}</span>
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
