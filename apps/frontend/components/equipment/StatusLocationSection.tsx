'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Control, useWatch, useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { type Site, EQUIPMENT_STATUS_VALUES } from '@equipment-management/schemas';
import { EQUIPMENT_MANAGER_ELIGIBLE_ROLES } from '@equipment-management/shared-constants';
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
import usersApi, { type UserOption } from '@/lib/api/users-api';
import { getEquipmentStatusTokenStyle } from '@/lib/design-tokens';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { FORM_SECTION_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

// 장비 상태 라벨은 i18n (useTranslations('equipment').status.*)으로 관리
// 색상 스타일은 @/lib/design-tokens/getEquipmentStatusTokenStyle에서 import (SSOT)
// 운영책임자 자격 역할: SSOT — packages/shared-constants EQUIPMENT_MANAGER_ELIGIBLE_ROLES

interface StatusLocationSectionProps {
  control: Control<FormValues>;
  showSharedOptions?: boolean;
  selectedSite?: Site;
  selectedTeamId?: number | string;
  /** 등록 모드: true면 location 입력 숨기고 initialLocation이 보관 위치가 됨 */
  isCreateMode?: boolean;
}

export function StatusLocationSection({
  control,
  showSharedOptions: _showSharedOptions = false,
  selectedSite,
  selectedTeamId,
  isCreateMode = false,
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
    // 팀이 변경되면 이전 팀의 담당자/부담당자 선택값을 초기화
    setValue('managerId', null);
    setValue('deputyManagerId', null);
  }, [currentTeamId, setValue]);

  // SSOT: EQUIPMENT_MANAGER_ELIGIBLE_ROLES (technical_manager, quality_manager, lab_manager, system_admin)
  // undefined를 queryKey에 포함하면 캐시 키 불일치 → 정규화된 params 객체를 메모이제이션
  const managerQueryParams = useMemo<Record<string, string>>(() => {
    const params: Record<string, string> = {
      roles: EQUIPMENT_MANAGER_ELIGIBLE_ROLES.join(','),
    };
    if (currentSite) params.site = currentSite;
    if (currentTeamId) params.teams = String(currentTeamId);
    return params;
  }, [currentSite, currentTeamId]);

  // 운영책임자 목록 로드 (사이트/팀 기준 필터링) — useQuery SSOT 패턴
  const {
    data: eligibleManagers = [],
    isLoading: isLoadingManagers,
    isError: managersError,
  } = useQuery<UserOption[]>({
    queryKey: queryKeys.users.search(managerQueryParams),
    queryFn: () => usersApi.listForSelect(managerQueryParams),
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

          {/* 현재 위치 — 등록 모드에서는 숨김 (initialLocation에서 자동 파생) */}
          {!isCreateMode && (
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
          )}

          {/* 최초 설치 위치 — 등록 모드에서는 필수 (보관 위치로 자동 설정됨) */}
          <FormField
            control={control}
            name="initialLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.initialLocation')}{' '}
                  {isCreateMode && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.statusLocation.initialLocationPlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                {isCreateMode && (
                  <FormDescription>
                    {t('form.statusLocation.initialLocationAsStorageDescription')}
                  </FormDescription>
                )}
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

          {/* 운영책임자 (정) — UUID 저장 */}
          <FormField
            control={control}
            name="managerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.technicalManager')} <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
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
                                : t('form.statusLocation.techManagerPlaceholder')
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {eligibleManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                    {eligibleManagers.length === 0 && (
                      <SelectItem value="__none__" disabled>
                        {t('form.statusLocation.techManagerNoList')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {currentTeamId
                    ? t('form.statusLocation.techManagerDescriptionWithTeam')
                    : t('form.statusLocation.techManagerDescription')}
                </FormDescription>
                {managersError && (
                  <p className="text-xs text-destructive mt-1">
                    {t('form.statusLocation.managersLoadError')}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 부담당자 (운영 책임자 부) — UUID 저장 */}
          <FormField
            control={control}
            name="deputyManagerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.deputyManager')}</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                  value={field.value || undefined}
                  disabled={!currentSite || isLoadingManagers}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !currentSite
                            ? t('form.statusLocation.techManagerNoSite')
                            : isLoadingManagers
                              ? t('form.statusLocation.techManagerLoading')
                              : t('form.statusLocation.deputyManagerPlaceholder')
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">-</SelectItem>
                    {eligibleManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('form.statusLocation.deputyManagerDescription')}
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

          {/* 공급사 연락처 */}
          <FormField
            control={control}
            name="supplierContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.supplierContact')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.statusLocation.supplierContactPlaceholder')}
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
