'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Control, useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import {
  type EquipmentStatus,
  type CalibrationMethod,
  type Site,
  type SpecMatch,
  type CalibrationRequired,
  type Classification,
} from '@equipment-management/schemas';
import {
  isTeamRestricted,
  API_ENDPOINTS,
  type UserRole,
} from '@equipment-management/shared-constants';
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
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/api-client';
import { type ManagementNumberCheckResult } from '@/lib/api/equipment-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import {
  SITE_OPTIONS,
  SITE_TO_CODE,
  CLASSIFICATION_TO_CODE,
  generateManagementNumber,
  formatSerialNumber,
} from '@/lib/constants/management-number';
import { FORM_SECTION_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';
import { useSiteLabels, useClassificationLabels } from '@/lib/i18n/use-enum-labels';

/**
 * 사이트별 팀 매핑 (폴백용 - API 응답이 없을 때 사용)
 * ✅ 팀 분류 = 소문자_언더스코어 (fcc_emc_rf, general_emc, ...)
 * - 수원(SUW): FCC EMC/RF, General EMC, SAR, Automotive EMC
 * - 의왕(UIW): General RF
 * - 평택(PYT): Automotive EMC
 */
const SITE_TEAMS: Record<
  Site,
  Array<{ value: string; label: string; classification: Classification }>
> = {
  suwon: [
    {
      value: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
      label: 'FCC EMC/RF',
      classification: 'fcc_emc_rf',
    },
    {
      value: 'bb6c860d-9d7c-4e2d-b289-2b2e416ec289',
      label: 'General EMC',
      classification: 'general_emc',
    },
    { value: '7fd28076-fd5e-4d36-b051-bbf8a97b82db', label: 'SAR', classification: 'sar' },
    {
      value: 'f0a32655-00f9-4ecd-b43c-af4faed499b6',
      label: 'Automotive EMC',
      classification: 'automotive_emc',
    },
  ],
  uiwang: [
    {
      value: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
      label: 'General RF',
      classification: 'general_rf',
    },
  ],
  pyeongtaek: [
    {
      value: 'b2c3d4e5-f6a7-4890-bcde-f01234567890',
      label: 'Automotive EMC',
      classification: 'automotive_emc',
    },
  ],
};

export interface FormValues {
  name?: string;
  managementNumber?: string;
  assetNumber?: string;
  modelName?: string;
  manufacturer?: string;
  manufacturerContact?: string;
  serialNumber?: string;
  location?: string;
  description?: string;
  specMatch?: SpecMatch; // 시방일치 여부
  calibrationRequired?: CalibrationRequired; // 교정필요 여부
  calibrationCycle?: number;
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
  calibrationAgency?: string;
  needsIntermediateCheck?: boolean;
  calibrationMethod?: CalibrationMethod;
  lastIntermediateCheckDate?: string;
  intermediateCheckCycle?: number;
  nextIntermediateCheckDate?: string;
  purchaseYear?: number;
  teamId?: string; // UUID 문자열 (SSOT: packages/schemas - z.string().uuid())
  site?: Site;
  // 관리번호 생성용 필드
  classification?: Classification;
  managementSerialNumberStr?: string; // 일련번호 (4자리 문자열)
  supplier?: string;
  contactInfo?: string;
  firmwareVersion?: string;
  manualLocation?: string;
  accessories?: string;
  technicalManager?: string;
  deputyManagerId?: string | null; // 부담당자 UUID
  initialLocation?: string;
  installationDate?: string;
  status?: EquipmentStatus;
  calibrationResult?: string;
  correctionFactor?: string;
  externalIdentifier?: string; // 소유처 원본 식별번호 (공용/렌탈 장비)
}

interface BasicInfoSectionProps {
  control: Control<FormValues>;
  isEdit?: boolean;
  selectedSite?: Site;
  onSiteChange?: (site: Site) => void;
  /** 현재 사용자 역할 (test_engineer이면 사이트/팀 선택 제한) */
  userRole?: string;
  /** 현재 사용자의 teamId (test_engineer이면 자동 설정) */
  userTeamId?: string;
  /** 관리번호 중복 검사 함수 (디바운스 적용) */
  onManagementNumberChange?: (managementNumber: string) => void;
  /** 관리번호 중복 검사 결과 */
  managementNumberCheckResult?: ManagementNumberCheckResult | null;
  /** 관리번호 중복 검사 중 여부 */
  isCheckingManagementNumber?: boolean;
  /** 위저드 모드: true면 섹션 번호 배지 숨김 (스테퍼가 대신 표시) */
  wizardMode?: boolean;
}

export function BasicInfoSection({
  control,
  isEdit = false,
  selectedSite,
  onSiteChange,
  userRole,
  userTeamId,
  onManagementNumberChange,
  managementNumberCheckResult,
  isCheckingManagementNumber = false,
  wizardMode = false,
}: BasicInfoSectionProps) {
  const t = useTranslations('equipment');
  const siteLabels = useSiteLabels();
  const classificationLabels = useClassificationLabels();

  // lab_manager만 사이트/팀 자유 선택 가능, 나머지는 자기 팀만
  const teamRestricted = userRole ? isTeamRestricted(userRole as UserRole) : false;

  // 팀 목록 로드 — useQuery SSOT 패턴
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: queryKeys.teams.lists(),
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.TEAMS.LIST);
      const teamData = response.data || response;
      return Array.isArray(teamData) ? teamData : [];
    },
    ...QUERY_CONFIG.TEAMS,
  });

  // 사이트별 팀 필터링 (useMemo로 최적화)
  const filteredTeams = useMemo(() => {
    if (selectedSite && teams.length > 0) {
      const siteTeams = teams
        .filter((team) => team.site === selectedSite)
        .map((team) => ({
          value: String(team.id),
          label: team.name,
          classification: team.classification as Classification,
        }));
      return siteTeams.length > 0 ? siteTeams : SITE_TEAMS[selectedSite] || [];
    } else if (selectedSite) {
      return SITE_TEAMS[selectedSite] || [];
    } else {
      return [];
    }
  }, [selectedSite, teams]);

  // 관리번호 자동 생성용 상태
  const [selectedClassification, setSelectedClassification] = useState<
    Classification | undefined
  >();
  const [serialNumberInput, setSerialNumberInput] = useState('');
  const { setValue } = useFormContext<FormValues>();

  // useEffect deps에 함수를 직접 넣으면 매 렌더링마다 새 참조 → 루프 위험
  // useRef로 최신 값을 유지하여 안정적 deps 구성
  const teamsRef = useRef(teams);
  const selectedSiteRef = useRef(selectedSite);
  useEffect(() => {
    teamsRef.current = teams;
    selectedSiteRef.current = selectedSite;
  });

  /**
   * 팀 선택 시 분류코드 자동 설정 핸들러
   * 팀이 분류코드를 결정하므로, 팀 선택 시 자동으로 분류 설정
   */
  const handleTeamChange = useCallback(
    (teamId: string) => {
      const currentTeams = teamsRef.current;
      const currentSite = selectedSiteRef.current;

      // API에서 가져온 팀 목록에서 찾기
      const selectedTeam = currentTeams.find((tm) => tm.id === teamId);
      if (selectedTeam) {
        const classification = selectedTeam.classification;
        if (classification) {
          setSelectedClassification(classification as Classification);
          setValue('classification', classification as Classification);
        }
        return;
      }

      // 폴백: SITE_TEAMS에서 찾기
      if (currentSite) {
        const fallbackTeam = SITE_TEAMS[currentSite]?.find((tm) => tm.value === teamId);
        if (fallbackTeam) {
          const classification = fallbackTeam.classification;
          if (classification) {
            setSelectedClassification(classification);
            setValue('classification', classification);
          }
        }
      }
    },
    [setValue]
  );

  // 현재 관리번호 미리보기
  const managementNumberPreview = useMemo(() => {
    if (selectedSite && selectedClassification && serialNumberInput) {
      const formatted = formatSerialNumber(serialNumberInput);
      if (formatted) {
        return generateManagementNumber(selectedSite, selectedClassification, formatted);
      }
    }
    return null;
  }, [selectedSite, selectedClassification, serialNumberInput]);

  // onManagementNumberChange를 ref로 최신화 (deps 안정화)
  const onManagementNumberChangeRef = useRef(onManagementNumberChange);
  useEffect(() => {
    onManagementNumberChangeRef.current = onManagementNumberChange;
  });

  // 관리번호 자동 업데이트 (새 장비 등록 시만)
  // selectedClassification은 managementNumberPreview useMemo에 이미 반영됨 → deps 제외
  useEffect(() => {
    if (!isEdit && managementNumberPreview) {
      setValue('managementNumber', managementNumberPreview);
      setValue('classification', selectedClassification);
      onManagementNumberChangeRef.current?.(managementNumberPreview);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managementNumberPreview, isEdit, setValue]);

  // test_engineer: 팀 자동 선택 (userTeamId가 있으면 자동 설정)
  useEffect(() => {
    if (teamRestricted && userTeamId && filteredTeams.length > 0) {
      const matchingTeam = filteredTeams.find((tm) => tm.value === userTeamId);
      if (matchingTeam) {
        setValue('teamId', userTeamId);
        handleTeamChange(userTeamId);
      }
    }
  }, [teamRestricted, userTeamId, filteredTeams, setValue, handleTeamChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {!wizardMode && <span className={FORM_SECTION_TOKENS.badge}>1</span>}
          {t('form.basicInfo.title')}
        </CardTitle>
        <CardDescription>{t('form.basicInfo.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 장비명 */}
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.name')} <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.basicInfo.namePlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>{t('form.basicInfo.nameDescription')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 관리번호 - 자동생성 UI (등록 시) 또는 수동입력 (수정 시) */}
          {isEdit ? (
            // 수정 모드: 직접 입력 + 실시간 중복 검사
            <FormField
              control={control}
              name="managementNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('fields.managementNumber')} <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder={t('form.basicInfo.managementNumberPlaceholder')}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          onManagementNumberChange?.(e.target.value);
                        }}
                        className={
                          managementNumberCheckResult?.available === false
                            ? 'border-destructive focus-visible:ring-destructive pr-10'
                            : managementNumberCheckResult?.available === true
                              ? 'border-brand-ok focus-visible:ring-brand-ok pr-10'
                              : ''
                        }
                      />
                    </FormControl>
                    {/* 검사 상태 아이콘 */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingManagementNumber ? (
                        <Loader2 className="h-4 w-4 motion-safe:animate-spin text-muted-foreground" />
                      ) : managementNumberCheckResult?.available === true ? (
                        <CheckCircle2 className="h-4 w-4 text-brand-ok" />
                      ) : managementNumberCheckResult?.available === false ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : null}
                    </div>
                  </div>
                  {/* 중복 검사 결과 메시지 */}
                  {managementNumberCheckResult?.available === false ? (
                    <p className="text-sm text-destructive">
                      {managementNumberCheckResult.message}
                      {managementNumberCheckResult.existingEquipment && (
                        <span className="ml-1 font-medium">
                          {t('form.basicInfo.existingEquipment', {
                            name: managementNumberCheckResult.existingEquipment.name,
                          })}
                        </span>
                      )}
                    </p>
                  ) : managementNumberCheckResult?.available === true ? (
                    <p className="text-sm text-brand-ok">{managementNumberCheckResult.message}</p>
                  ) : (
                    <FormDescription>
                      {t('form.basicInfo.managementNumberDescription')}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            // 등록 모드: 자동 생성 UI + 중복 검사
            <div className="space-y-2">
              <FormLabel>
                {t('fields.managementNumber')} <span className="text-destructive">*</span>
              </FormLabel>
              {/* 프리뷰 및 자동 조합 표시 */}
              <div
                className={`flex items-center gap-2 p-3 rounded-lg border ${
                  managementNumberCheckResult?.available === false
                    ? 'bg-brand-critical/10 border-destructive'
                    : managementNumberCheckResult?.available === true
                      ? 'bg-brand-ok/10 border-brand-ok'
                      : 'bg-muted/50'
                }`}
              >
                <Badge variant="outline" className="font-mono text-sm">
                  {selectedSite ? SITE_TO_CODE[selectedSite] : 'XXX'}
                </Badge>
                <span className="text-muted-foreground">-</span>
                <Badge variant="outline" className="font-mono text-sm">
                  {selectedClassification ? CLASSIFICATION_TO_CODE[selectedClassification] : 'X'}
                </Badge>
                <Badge variant="outline" className="font-mono text-sm">
                  {serialNumberInput ? formatSerialNumber(serialNumberInput) || '????' : '????'}
                </Badge>
                {managementNumberPreview && (
                  <span className="ml-auto flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        managementNumberCheckResult?.available === false
                          ? 'text-destructive'
                          : managementNumberCheckResult?.available === true
                            ? 'text-brand-ok'
                            : 'text-brand-ok'
                      }`}
                    >
                      → {managementNumberPreview}
                    </span>
                    {/* 검사 상태 아이콘 */}
                    {isCheckingManagementNumber ? (
                      <Loader2 className="h-4 w-4 motion-safe:animate-spin text-muted-foreground" />
                    ) : managementNumberCheckResult?.available === true ? (
                      <CheckCircle2 className="h-4 w-4 text-brand-ok" />
                    ) : managementNumberCheckResult?.available === false ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : null}
                  </span>
                )}
              </div>
              {/* 중복 검사 결과 메시지 */}
              {managementNumberCheckResult?.available === false ? (
                <p className="text-sm text-destructive">
                  {managementNumberCheckResult.message}
                  {managementNumberCheckResult.existingEquipment && (
                    <span className="ml-1 font-medium">
                      {t('form.basicInfo.existingEquipment', {
                        name: managementNumberCheckResult.existingEquipment.name,
                      })}
                    </span>
                  )}
                </p>
              ) : managementNumberCheckResult?.available === true ? (
                <p className="text-sm text-brand-ok">{managementNumberCheckResult.message}</p>
              ) : null}
              {/* 숨겨진 필드 (폼 제출용) */}
              <FormField
                control={control}
                name="managementNumber"
                render={({ field }) => (
                  <input
                    type="hidden"
                    name={field.name}
                    ref={field.ref}
                    value={field.value ?? ''}
                  />
                )}
              />
            </div>
          )}

          {/* 사이트 */}
          <FormField
            control={control}
            name="site"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.site')} <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    onSiteChange?.(value as Site);
                  }}
                  value={field.value}
                  disabled={teamRestricted}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.basicInfo.sitePlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SITE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {siteLabels[option.value]} ({option.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {teamRestricted
                    ? t('form.basicInfo.siteDescriptionRestricted')
                    : t('form.basicInfo.siteDescription')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 분류 (팀 선택에 따라 자동 결정됨 - 읽기 전용 표시) */}
          {!isEdit && (
            <FormField
              control={control}
              name="classification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.basicInfo.classificationLabel')}</FormLabel>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50">
                    {selectedClassification ? (
                      <>
                        <Badge variant="secondary" className="font-mono">
                          {CLASSIFICATION_TO_CODE[selectedClassification]}
                        </Badge>
                        <span className="text-sm">
                          {classificationLabels[selectedClassification]}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {t('form.basicInfo.classificationAutoSet')}
                      </span>
                    )}
                  </div>
                  <input
                    type="hidden"
                    name={field.name}
                    ref={field.ref}
                    value={field.value ?? ''}
                  />
                  <FormDescription>{t('form.basicInfo.classificationDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* 관리번호 일련번호 (등록 모드 시 관리번호 자동 생성용) */}
          {!isEdit && (
            <FormField
              control={control}
              name="managementSerialNumberStr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('form.basicInfo.managementSerialNumber')}{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder={t('form.basicInfo.serialNumberPlaceholder')}
                      maxLength={4}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(value);
                        setSerialNumberInput(value);
                      }}
                      onBlur={(e) => {
                        const formatted = formatSerialNumber(e.target.value);
                        if (formatted) {
                          field.onChange(formatted);
                          setSerialNumberInput(formatted);
                        }
                        field.onBlur?.();
                      }}
                    />
                  </FormControl>
                  <FormDescription>{t('form.basicInfo.serialNumberDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* 팀 (팀 선택 시 분류코드 자동 결정) */}
          <FormField
            control={control}
            name="teamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.team')} <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value); // UUID 문자열로 저장
                    handleTeamChange(value); // 분류코드 자동 설정
                  }}
                  value={field.value ? String(field.value) : undefined}
                  disabled={!selectedSite || isLoadingTeams || teamRestricted}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedSite
                            ? t('form.basicInfo.teamPlaceholderNoSite')
                            : isLoadingTeams
                              ? t('form.basicInfo.teamLoading')
                              : t('form.basicInfo.teamPlaceholder')
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredTeams.map((team) => (
                      <SelectItem key={team.value} value={team.value}>
                        {team.label} ({CLASSIFICATION_TO_CODE[team.classification] || '?'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {teamRestricted
                    ? t('form.basicInfo.teamDescriptionRestricted')
                    : t('form.basicInfo.teamDescription')}
                  {selectedClassification && (
                    <span className="ml-2 font-medium text-primary">
                      → {CLASSIFICATION_TO_CODE[selectedClassification]}
                    </span>
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 자산번호 */}
          <FormField
            control={control}
            name="assetNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.assetNumber')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.basicInfo.assetNumberPlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 모델명 */}
          <FormField
            control={control}
            name="modelName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.modelName')} <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.basicInfo.modelNamePlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 제조사 */}
          <FormField
            control={control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.manufacturer')} <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.basicInfo.manufacturerPlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 제조사 연락처 */}
          <FormField
            control={control}
            name="manufacturerContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.manufacturerContact')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.basicInfo.manufacturerContactPlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 제조사 시리얼번호 */}
          <FormField
            control={control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('form.basicInfo.serialNumberLabel')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.basicInfo.serialNumberInputPlaceholder')}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  {t('form.basicInfo.serialNumberInputDescription')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 구입년도 */}
          <FormField
            control={control}
            name="purchaseYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.purchaseYear')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t('form.basicInfo.purchaseYearPlaceholder')}
                    min={1990}
                    max={2100}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 장비사양 */}
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('fields.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('form.basicInfo.descriptionPlaceholder')}
                  className="min-h-[100px]"
                  value={typeof field.value === 'string' ? field.value : ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 시방일치 여부 및 교정필요 여부 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 시방일치 여부 */}
          <FormField
            control={control}
            name="specMatch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.specMatch')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.basicInfo.specMatchPlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="match">{t('form.basicInfo.specMatchMatch')}</SelectItem>
                    <SelectItem value="mismatch">
                      {t('form.basicInfo.specMatchMismatch')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{t('form.basicInfo.specMatchDescription')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 교정필요 여부 */}
          <FormField
            control={control}
            name="calibrationRequired"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fields.calibrationRequired')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('form.basicInfo.calibrationRequiredPlaceholder')}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="required">
                      {t('form.basicInfo.calibrationRequiredYes')}
                    </SelectItem>
                    <SelectItem value="not_required">
                      {t('form.basicInfo.calibrationRequiredNo')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('form.basicInfo.calibrationRequiredDescription')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
