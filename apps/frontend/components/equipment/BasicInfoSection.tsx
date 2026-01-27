'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Control, useWatch, useFormContext } from 'react-hook-form';
import {
  type EquipmentStatus,
  type CalibrationMethod,
  type Site,
  type SpecMatch,
  type CalibrationRequired,
  type Classification,
} from '@equipment-management/schemas';
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
import { apiClient } from '@/lib/api/api-client';
import {
  SITE_OPTIONS,
  CLASSIFICATION_OPTIONS,
  SITE_TO_CODE,
  CLASSIFICATION_TO_CODE,
  generateManagementNumber,
  formatSerialNumber,
  isValidManagementNumber,
} from '@/lib/constants/management-number';

/**
 * 팀 타입 → 분류코드 매핑
 * ✅ 팀 이름 = 분류 이름 (통일)
 */
const TEAM_TYPE_TO_CLASSIFICATION: Record<string, Classification> = {
  FCC_EMC_RF: 'fcc_emc_rf',     // E
  GENERAL_EMC: 'general_emc',   // R
  GENERAL_RF: 'general_rf',     // W
  SAR: 'sar',                   // S
  AUTOMOTIVE_EMC: 'automotive_emc', // A
  SOFTWARE: 'software',         // P
  // 레거시 호환성
  RF: 'fcc_emc_rf',
  EMC: 'general_emc',
  AUTO: 'automotive_emc',
};

/**
 * 사이트별 팀 매핑 (폴백용 - API 응답이 없을 때 사용)
 * ✅ 팀 이름 = 분류 이름 (통일)
 * - 수원(SUW): FCC EMC/RF, General EMC, SAR, Automotive EMC
 * - 의왕(UIW): General RF
 * - 평택(PYT): Automotive EMC
 */
const SITE_TEAMS: Record<Site, Array<{ value: string; label: string; type: string }>> = {
  suwon: [
    { value: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1', label: 'FCC EMC/RF', type: 'FCC_EMC_RF' },
    { value: 'bb6c860d-9d7c-4e2d-b289-2b2e416ec289', label: 'General EMC', type: 'GENERAL_EMC' },
    { value: '7fd28076-fd5e-4d36-b051-bbf8a97b82db', label: 'SAR', type: 'SAR' },
    { value: 'f0a32655-00f9-4ecd-b43c-af4faed499b6', label: 'Automotive EMC', type: 'AUTOMOTIVE_EMC' },
  ],
  uiwang: [
    { value: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789', label: 'General RF', type: 'GENERAL_RF' },
  ],
  pyeongtaek: [
    { value: 'b2c3d4e5-f6a7-4890-bcde-f01234567890', label: 'Automotive EMC', type: 'AUTOMOTIVE_EMC' },
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
  teamId?: number | string;
  site?: Site;
  // 관리번호 생성용 필드
  classification?: Classification;
  managementSerialNumberStr?: string; // 일련번호 (4자리 문자열)
  supplier?: string;
  contactInfo?: string;
  softwareVersion?: string;
  firmwareVersion?: string;
  manualLocation?: string;
  accessories?: string;
  technicalManager?: string;
  initialLocation?: string;
  installationDate?: string;
  status?: EquipmentStatus;
  calibrationResult?: string;
  correctionFactor?: string;
}

interface Team {
  id: string;  // UUID 형식
  uuid?: string;  // 하위 호환성
  name: string;
  type: string;  // RF, SAR, EMC, AUTO, SOFTWARE
  site: Site;
  classificationCode?: string;  // E, R, S, A, P
}

interface BasicInfoSectionProps {
  control: Control<FormValues>;
  isEdit?: boolean;
  selectedSite?: Site;
  onSiteChange?: (site: Site) => void;
}

export function BasicInfoSection({
  control,
  isEdit = false,
  selectedSite,
  onSiteChange,
}: BasicInfoSectionProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [filteredTeams, setFilteredTeams] = useState<Array<{ value: string; label: string; type: string }>>([]);

  // 관리번호 자동 생성용 상태
  const [selectedClassification, setSelectedClassification] = useState<Classification | undefined>();
  const [serialNumberInput, setSerialNumberInput] = useState('');
  const { setValue, watch } = useFormContext<FormValues>();

  /**
   * 팀 선택 시 분류코드 자동 설정 핸들러
   * 팀이 분류코드를 결정하므로, 팀 선택 시 자동으로 분류 설정
   */
  const handleTeamChange = useCallback((teamId: string) => {
    // API에서 가져온 팀 목록에서 찾기
    const selectedTeam = teams.find((t) => t.id === teamId);
    if (selectedTeam) {
      const classification = TEAM_TYPE_TO_CLASSIFICATION[selectedTeam.type];
      if (classification) {
        setSelectedClassification(classification);
        setValue('classification', classification);
      }
      return;
    }

    // 폴백: SITE_TEAMS에서 찾기
    if (selectedSite) {
      const fallbackTeam = SITE_TEAMS[selectedSite]?.find((t) => t.value === teamId);
      if (fallbackTeam) {
        const classification = TEAM_TYPE_TO_CLASSIFICATION[fallbackTeam.type];
        if (classification) {
          setSelectedClassification(classification);
          setValue('classification', classification);
        }
      }
    }
  }, [teams, selectedSite, setValue]);

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

  // 관리번호 자동 업데이트 (새 장비 등록 시만)
  // 주의: managementSerialNumberStr는 여기서 업데이트하지 않음 (입력 중 값 덮어쓰기 방지)
  useEffect(() => {
    if (!isEdit && managementNumberPreview) {
      setValue('managementNumber', managementNumberPreview);
      setValue('classification', selectedClassification);
    }
  }, [managementNumberPreview, isEdit, setValue, selectedClassification]);

  // 팀 목록 로드
  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoadingTeams(true);
      try {
        const response = await apiClient.get('/api/teams');
        const teamData = response.data || response;
        setTeams(Array.isArray(teamData) ? teamData : []);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        setTeams([]);
      } finally {
        setIsLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  // 사이트 변경 시 팀 필터링
  useEffect(() => {
    if (selectedSite && teams.length > 0) {
      const siteTeams = teams
        .filter((team) => team.site === selectedSite)
        .map((team) => ({
          value: String(team.id),
          label: team.name,
          type: team.type,
        }));
      setFilteredTeams(siteTeams.length > 0 ? siteTeams : SITE_TEAMS[selectedSite] || []);
    } else if (selectedSite) {
      setFilteredTeams(SITE_TEAMS[selectedSite] || []);
    } else {
      setFilteredTeams([]);
    }
  }, [selectedSite, teams]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            1
          </span>
          기본 정보
        </CardTitle>
        <CardDescription>장비의 기본 정보를 입력하세요</CardDescription>
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
                  장비명 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="예: Receiver" {...field} />
                </FormControl>
                <FormDescription>장비의 이름을 입력하세요</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 관리번호 - 자동생성 UI (등록 시) 또는 수동입력 (수정 시) */}
          {isEdit ? (
            // 수정 모드: 직접 입력
            <FormField
              control={control}
              name="managementNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    관리번호 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="예: SUW-E0001" {...field} />
                  </FormControl>
                  <FormDescription>고유한 관리번호 (형식: XXX-XYYYY)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            // 등록 모드: 자동 생성 UI
            <div className="space-y-2">
              <FormLabel>
                관리번호 <span className="text-destructive">*</span>
              </FormLabel>
              {/* 프리뷰 및 자동 조합 표시 */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                <Badge variant="outline" className="font-mono text-sm">
                  {selectedSite ? SITE_TO_CODE[selectedSite] : 'XXX'}
                </Badge>
                <span className="text-muted-foreground">-</span>
                <Badge variant="outline" className="font-mono text-sm">
                  {selectedClassification ? CLASSIFICATION_TO_CODE[selectedClassification] : 'X'}
                </Badge>
                <Badge variant="outline" className="font-mono text-sm">
                  {serialNumberInput ? formatSerialNumber(serialNumberInput) || '????'  : '????'}
                </Badge>
                {managementNumberPreview && (
                  <span className="ml-auto text-sm font-semibold text-green-600">
                    → {managementNumberPreview}
                  </span>
                )}
              </div>
              {/* 숨겨진 필드 (폼 제출용) */}
              <FormField
                control={control}
                name="managementNumber"
                render={({ field }) => (
                  <input type="hidden" {...field} />
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
                  사이트 <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    onSiteChange?.(value as Site);
                  }}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="사이트를 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SITE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} ({option.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>장비가 위치한 사이트를 선택하세요</FormDescription>
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
                  <FormLabel>분류 (자동)</FormLabel>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50">
                    {selectedClassification ? (
                      <>
                        <Badge variant="secondary" className="font-mono">
                          {CLASSIFICATION_TO_CODE[selectedClassification]}
                        </Badge>
                        <span className="text-sm">
                          {CLASSIFICATION_OPTIONS.find((o) => o.value === selectedClassification)?.label}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">팀을 선택하면 자동 설정됩니다</span>
                    )}
                  </div>
                  <input type="hidden" {...field} />
                  <FormDescription>팀 선택에 따라 분류코드가 자동 결정됩니다</FormDescription>
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
                    관리번호 일련번호 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="예: 0001"
                      maxLength={4}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(value);
                        setSerialNumberInput(value);
                      }}
                      onBlur={(e) => {
                        // 포커스가 벗어날 때만 4자리로 포맷팅 (입력 중 방해 방지)
                        const formatted = formatSerialNumber(e.target.value);
                        if (formatted) {
                          field.onChange(formatted);
                          setSerialNumberInput(formatted);
                        }
                        field.onBlur?.();
                      }}
                    />
                  </FormControl>
                  <FormDescription>관리번호 마지막 4자리 숫자 (0001~9999)</FormDescription>
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
                  팀 <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);  // UUID 문자열로 저장
                    handleTeamChange(value);  // 분류코드 자동 설정
                  }}
                  value={field.value ? String(field.value) : undefined}
                  disabled={!selectedSite || isLoadingTeams}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedSite
                            ? '먼저 사이트를 선택하세요'
                            : isLoadingTeams
                              ? '로딩 중...'
                              : '팀을 선택하세요'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredTeams.map((team) => (
                      <SelectItem key={team.value} value={team.value}>
                        {team.label} ({CLASSIFICATION_TO_CODE[TEAM_TYPE_TO_CLASSIFICATION[team.type]] || '?'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  팀 선택 시 분류코드가 자동 설정됩니다
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
                <FormLabel>자산번호</FormLabel>
                <FormControl>
                  <Input placeholder="예: ASSET-001" {...field} />
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
                  모델명 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="예: MS2720A" {...field} />
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
                  제조사 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="예: Anritsu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 제조사 연락처 (신규) */}
          <FormField
            control={control}
            name="manufacturerContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>제조사 연락처</FormLabel>
                <FormControl>
                  <Input placeholder="예: 02-1234-5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 제조사 시리얼번호 (장비 고유 식별번호) */}
          <FormField
            control={control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  제조사 시리얼번호 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="예: SN123456" {...field} />
                </FormControl>
                <FormDescription>제조사에서 부여한 고유 식별번호</FormDescription>
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
                <FormLabel>구입년도</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="예: 2023"
                    min={1990}
                    max={2100}
                    {...field}
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

        {/* 장비사양 (라벨 변경: 설명 → 장비사양) */}
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>장비사양</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="장비의 상세 사양을 입력하세요 (주요 기능, 성능 등)"
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
                <FormLabel>시방일치 여부</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="시방일치 여부를 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="match">일치</SelectItem>
                    <SelectItem value="mismatch">불일치</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>장비 사양이 시방과 일치하는지 여부</FormDescription>
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
                <FormLabel>교정필요 여부</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="교정필요 여부를 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="required">필요</SelectItem>
                    <SelectItem value="not_required">불필요</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>장비에 교정이 필요한지 여부</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
