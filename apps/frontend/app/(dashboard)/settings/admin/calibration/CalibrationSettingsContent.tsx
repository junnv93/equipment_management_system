'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Check, X, Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/api-client';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { API_ENDPOINTS, SITE_FILTER_OPTIONS } from '@equipment-management/shared-constants';
import type { Site } from '@equipment-management/schemas';

const AVAILABLE_DAYS = [0, 1, 3, 7, 14, 30, 60, 90] as const;

interface CalibrationSettings {
  alertDays: number[];
}

/**
 * URL searchParams에서 site 파라미터 파싱
 * "전체" = 파라미터 생략 (프로젝트 통일 규칙)
 */
function parseSiteFromSearchParams(searchParams: URLSearchParams): Site | undefined {
  const raw = searchParams.get('site');
  if (!raw) return undefined;
  // SSOT: SITE_FILTER_OPTIONS에서 유효한 값인지 검증
  return SITE_FILTER_OPTIONS.some((opt) => opt.value === raw) ? (raw as Site) : undefined;
}

export default function CalibrationSettingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // URL에서 사이트 파싱 (SSOT — useState 대신 URL 파라미터)
  const siteParam = parseSiteFromSearchParams(searchParams);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // 사이트 변경 → URL 업데이트
  const handleSiteChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams();
      if (value !== '_all') {
        params.set('site', value);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname]
  );

  const { data, isLoading } = useQuery<CalibrationSettings>({
    queryKey: queryKeys.settings.calibration(siteParam),
    queryFn: () => {
      const url = siteParam
        ? `${API_ENDPOINTS.SETTINGS.CALIBRATION}?site=${siteParam}`
        : API_ENDPOINTS.SETTINGS.CALIBRATION;
      return apiClient.get(url);
    },
    staleTime: CACHE_TIMES.MEDIUM,
  });

  useEffect(() => {
    if (data?.alertDays) {
      setSelectedDays([...data.alertDays]);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (alertDays: number[]) => {
      // site는 query parameter로 전송 (백엔드 @Query('site') 매칭)
      const url = siteParam
        ? `${API_ENDPOINTS.SETTINGS.CALIBRATION}?site=${siteParam}`
        : API_ENDPOINTS.SETTINGS.CALIBRATION;
      return apiClient.patch(url, { alertDays });
    },
    onSuccess: () => {
      toast.success('교정 알림 설정이 저장되었습니다.');
    },
    onError: () => {
      toast.error('설정 저장에 실패했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.calibration(siteParam) });
    },
  });

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => b - a)
    );
  };

  const hasChanges =
    data?.alertDays &&
    (selectedDays.length !== data.alertDays.length ||
      selectedDays.some((d, i) => d !== data.alertDays[i]));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent dark:from-primary/10 dark:via-primary/5 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
            <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>교정 알림 설정</CardTitle>
            <CardDescription>
              교정 및 중간점검 기한 임박 시 알림을 발송할 시점을 설정합니다. 선택한 D-day에 해당하는
              날짜에 알림이 발송됩니다.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 사이트 셀렉터 — URL-driven SSOT */}
        <div>
          <p className="text-sm font-medium mb-2">적용 사이트</p>
          <Select value={siteParam ?? '_all'} onValueChange={handleSiteChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="사이트 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">전체 (기본)</SelectItem>
              {SITE_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {siteParam
              ? '선택한 사이트에만 적용되는 오버라이드 설정입니다.'
              : '모든 사이트에 적용되는 기본 설정입니다.'}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">알림 발송 시점</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_DAYS.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium select-none motion-safe:transition-colors motion-reduce:transition-none',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'border bg-background hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => toggleDay(day)}
                  aria-pressed={isSelected}
                >
                  {isSelected ? (
                    <X className="mr-1 h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
                  )}
                  {day === 0 ? '당일 (D-day)' : `D-${day}`}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            현재 선택:{' '}
            {selectedDays.length > 0
              ? selectedDays.map((d) => (d === 0 ? '당일' : `D-${d}`)).join(', ')
              : '선택 없음'}
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-muted/30">
          <p className="text-sm font-medium mb-1">알림 동작 방식</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>선택한 D-day에 교정/중간점검 예정 장비에 대해 알림이 발송됩니다</li>
            <li>중복 알림은 자동으로 방지됩니다 (24시간 이내 동일 알림 차단)</li>
            <li>교정 기한 초과 시 장비는 자동으로 부적합으로 전환됩니다 (유예 기간 없음)</li>
          </ul>
        </div>

        <Button
          onClick={() => mutation.mutate(selectedDays)}
          disabled={mutation.isPending || !hasChanges || selectedDays.length === 0}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
              저장 중...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
              저장
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
