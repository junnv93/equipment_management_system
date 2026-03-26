'use client';

import { useEffect, useRef } from 'react';
import { Control, useWatch, useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { type Site, EQUIPMENT_STATUS_VALUES } from '@equipment-management/schemas';
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
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { getEquipmentStatusTokenStyle } from '@/lib/design-tokens';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { FORM_SECTION_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

// 장비 상태 라벨은 i18n (useTranslations('equipment').status.*)으로 관리
// 색상 스타일은 @/lib/design-tokens/getEquipmentStatusTokenStyle에서 import (SSOT)

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
  isEdit: _isEdit = false,
  showSharedOptions: _showSharedOptions = false,
  selectedSite,
  selectedTeamId,
}: StatusLocationSectionProps) {
  const { setValue } = useFormContext<FormValues>();
  const t = useTranslations('equipment');

  // 폼에서 사이트와 팀 감시
  const watchedSite = useWatch({ control, name: 'site' });
  const watchedTeamId = useWatch({ control, name: 'teamId' });

  const currentSite = selectedSite || watchedSite;
  const currentTeamId = selectedTeamId || watchedTeamId;

  // 팀 변경 시 기술책임자 선택 초기화 (첫 렌더 제외)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // 팀이 변경되면 이전 팀의 기술책임자 선택값을 초기화
    setValue('technicalManager', '');
  }, [currentTeamId, setValue]);

  // 기술책임자 목록 로드 (사이트/팀 기준 필터링) — useQuery SSOT 패턴
  const { data: technicalManagers = [], isLoading: isLoadingManagers } = useQuery({
    queryKey: queryKeys.users.search({
      roles: 'technical_manager',
      site: currentSite,
      teams: currentTeamId ? String(currentTeamId) : undefined,
    }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('roles', 'technical_manager');
      params.append('site', currentSite!);
      if (currentTeamId) {
        params.append('teams', String(currentTeamId));
      }

      const response = await apiClient.get(`${API_ENDPOINTS.USERS.LIST}?${params.toString()}`);
      type UserResponse = { data?: { items?: TechnicalManager[] }; items?: TechnicalManager[] };
      const responseData = response as UserResponse;
      const userData = responseData.data?.items || responseData.items || [];
      return Array.isArray(userData) ? userData : [];
    },
    enabled: !!currentSite,
    ...QUERY_CONFIG.USERS,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={FORM_SECTION_TOKENS.badge}>3</span>
          {t('form.statusLocation.title')}
        </CardTitle>
        <CardDescription>{t('form.statusLocation.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 장비 상태 */}
          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.statusLocation.equipmentStatusLabel')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.statusLocation.statusPlaceholder')}>
                        {field.value && (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getEquipmentStatusTokenStyle(field.value).className}
                            >
                              {t(`status.${field.value}` as Parameters<typeof t>[0])}
                            </Badge>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EQUIPMENT_STATUS_VALUES.map((value) => {
                      const style = getEquipmentStatusTokenStyle(value);
                      return (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={style.className}>
                              {t(`status.${value}` as Parameters<typeof t>[0])}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
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
                  {t('form.statusLocation.currentLocationLabel')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.statusLocation.locationPlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>{t('form.statusLocation.locationDescription')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 최초 설치 위치 */}
          <FormField
            control={control}
            name="initialLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.initialLocation')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.statusLocation.initialLocationPlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 설치 일시 */}
          <FormField
            control={control}
            name="installationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.installationDate')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 기술책임자 */}
          <FormField
            control={control}
            name="technicalManager"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.technicalManager')} <span className="text-destructive">*</span>
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
                            ? t('form.statusLocation.techManagerNoSite')
                            : !currentTeamId
                              ? t('form.statusLocation.techManagerNoTeam')
                              : isLoadingManagers
                                ? t('form.statusLocation.techManagerLoading')
                                : technicalManagers.length === 0
                                  ? t('form.statusLocation.techManagerDirectInput')
                                  : t('form.statusLocation.techManagerPlaceholder')
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {technicalManagers.map((manager) => (
                      <SelectItem
                        key={manager.uuid ?? `manager-${manager.id}`}
                        value={manager.name}
                      >
                        {manager.name}
                      </SelectItem>
                    ))}
                    {technicalManagers.length === 0 && (
                      <SelectItem value="__placeholder__" disabled>
                        {t('form.statusLocation.techManagerNoList')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {technicalManagers.length === 0 && currentSite && !isLoadingManagers && (
                  <Input
                    placeholder={t('form.statusLocation.techManagerDirectInputPlaceholder')}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="mt-2"
                  />
                )}
                <FormDescription>
                  {currentTeamId
                    ? t('form.statusLocation.techManagerDescriptionWithTeam')
                    : t('form.statusLocation.techManagerDescription')}
                </FormDescription>
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
                <FormLabel>{t('fields.supplier')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.statusLocation.supplierPlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
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
                <FormLabel>{t('fields.contactInfo')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.statusLocation.contactPlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
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
                <FormLabel>{t('form.statusLocation.swVersionLabel')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.statusLocation.swVersionPlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
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
                <FormLabel>{t('fields.firmwareVersion')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.statusLocation.fwVersionPlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
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
              <FormLabel>{t('form.statusLocation.manualLocationLabel')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('form.statusLocation.manualLocationPlaceholder')}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                {t('form.statusLocation.manualLocationDescription')}
              </FormDescription>
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
              <FormLabel>{t('fields.accessories')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('form.statusLocation.accessoriesPlaceholder')}
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ''}
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
