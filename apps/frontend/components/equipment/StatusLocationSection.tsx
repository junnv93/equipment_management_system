'use client';

import { useEffect, useState } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { type EquipmentStatus, type Site } from '@equipment-management/schemas';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormValues } from './BasicInfoSection';
import { apiClient } from '@/lib/api/api-client';

/**
 * 장비 상태값 한글 라벨 매핑
 */
const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: '사용 가능',
  in_use: '사용 중',
  checked_out: '반출 중',
  calibration_scheduled: '교정 예정',
  calibration_overdue: '교정 기한 초과',
  non_conforming: '부적합',
  spare: '여분',
  retired: '폐기',
};

/**
 * 장비 상태별 색상 매핑
 */
const EQUIPMENT_STATUS_COLORS: Record<EquipmentStatus, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  in_use: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  checked_out: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  calibration_scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  calibration_overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  non_conforming: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  spare: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  retired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

interface TechnicalManager {
  id: number;
  uuid: string;
  name: string;
  email: string;
  site: Site;
  teamId?: number;
}

interface StatusLocationSectionProps {
  control: Control<FormValues>;
  isEdit?: boolean;
  showSharedOptions?: boolean;
  selectedSite?: Site;
  selectedTeamId?: number | string;
}

export function StatusLocationSection({
  control,
  isEdit = false,
  showSharedOptions = false,
  selectedSite,
  selectedTeamId,
}: StatusLocationSectionProps) {
  const [technicalManagers, setTechnicalManagers] = useState<TechnicalManager[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);

  // 폼에서 사이트와 팀 감시
  const watchedSite = useWatch({ control, name: 'site' });
  const watchedTeamId = useWatch({ control, name: 'teamId' });

  const currentSite = selectedSite || watchedSite;
  const currentTeamId = selectedTeamId || watchedTeamId;

  // 기술책임자 목록 로드 (사이트/팀 기준 필터링)
  useEffect(() => {
    const fetchTechnicalManagers = async () => {
      if (!currentSite) return;

      setIsLoadingManagers(true);
      try {
        // API에서 기술책임자 역할을 가진 사용자 조회
        const params = new URLSearchParams();
        params.append('role', 'technical_manager');
        params.append('site', currentSite);
        if (currentTeamId) {
          params.append('teamId', String(currentTeamId));
        }

        const response = await apiClient.get(`/api/users?${params.toString()}`);
        const responseData = response as any;
        const userData = responseData.data?.items || responseData.items || responseData.data || responseData;
        setTechnicalManagers(Array.isArray(userData) ? userData : []);
      } catch (error) {
        console.error('Failed to fetch technical managers:', error);
        setTechnicalManagers([]);
      } finally {
        setIsLoadingManagers(false);
      }
    };

    fetchTechnicalManagers();
  }, [currentSite, currentTeamId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            3
          </span>
          상태 및 위치
        </CardTitle>
        <CardDescription>장비의 현재 상태와 위치 정보를 입력하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 장비 상태 */}
          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>장비 상태</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="상태를 선택하세요">
                        {field.value && (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={EQUIPMENT_STATUS_COLORS[field.value as EquipmentStatus]}
                            >
                              {EQUIPMENT_STATUS_LABELS[field.value as EquipmentStatus]}
                            </Badge>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={EQUIPMENT_STATUS_COLORS[value as EquipmentStatus]}
                          >
                            {label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 현재 위치 */}
          <FormField
            control={control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  현재 위치 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="예: RF1 Room" {...field} />
                </FormControl>
                <FormDescription>장비가 현재 위치한 장소를 입력하세요</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 최초 설치 위치 (신규) */}
          <FormField
            control={control}
            name="initialLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>최초 설치 위치</FormLabel>
                <FormControl>
                  <Input placeholder="예: RF1 Room" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 설치 일시 (신규) */}
          <FormField
            control={control}
            name="installationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>설치 일시</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 기술책임자 (사이트/팀 기준 필터링 Select) */}
          <FormField
            control={control}
            name="technicalManager"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  기술책임자 <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                  disabled={!currentSite || isLoadingManagers}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !currentSite
                            ? '먼저 사이트를 선택하세요'
                            : isLoadingManagers
                              ? '로딩 중...'
                              : technicalManagers.length === 0
                                ? '직접 입력하세요'
                                : '기술책임자를 선택하세요'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {technicalManagers.map((manager) => (
                      <SelectItem key={manager.uuid} value={manager.name}>
                        {manager.name}
                      </SelectItem>
                    ))}
                    {/* 직접 입력 옵션 */}
                    {technicalManagers.length === 0 && (
                      <SelectItem value="__placeholder__" disabled>
                        기술책임자 목록 없음 - 직접 입력하세요
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {/* 목록이 없으면 직접 입력 가능 */}
                {technicalManagers.length === 0 && currentSite && !isLoadingManagers && (
                  <Input
                    placeholder="예: 홍길동"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="mt-2"
                  />
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 공급사 */}
          <FormField
            control={control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>공급사</FormLabel>
                <FormControl>
                  <Input placeholder="예: ABC 공급사" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 연락처 */}
          <FormField
            control={control}
            name="contactInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>연락처</FormLabel>
                <FormControl>
                  <Input placeholder="예: 02-1234-5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* S/W 버전 */}
          <FormField
            control={control}
            name="softwareVersion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>S/W 버전</FormLabel>
                <FormControl>
                  <Input placeholder="예: v1.0.0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 펌웨어 버전 */}
          <FormField
            control={control}
            name="firmwareVersion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>펌웨어 버전</FormLabel>
                <FormControl>
                  <Input placeholder="예: v2.1.0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 메뉴얼 위치 */}
        <FormField
          control={control}
          name="manualLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메뉴얼 위치</FormLabel>
              <FormControl>
                <Input placeholder="예: /docs/manuals/equipment-001.pdf 또는 서버 경로" {...field} />
              </FormControl>
              <FormDescription>메뉴얼 파일의 저장 경로를 입력하세요</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 부속품 */}
        <FormField
          control={control}
          name="accessories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>부속품</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="부속품 목록을 입력하세요 (예: 케이블 3개, 안테나 1개, 어댑터 2개)"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
