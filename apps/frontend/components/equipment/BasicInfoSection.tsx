'use client';

import { useEffect, useState } from 'react';
import { Control } from 'react-hook-form';
import {
  type EquipmentStatus,
  type CalibrationMethod,
  type Site,
  type SpecMatch,
  type CalibrationRequired,
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
import { apiClient } from '@/lib/api/api-client';

/**
 * 사이트별 팀 매핑
 */
const SITE_TEAMS: Record<Site, Array<{ value: string; label: string }>> = {
  suwon: [
    { value: 'rf', label: 'RF팀' },
    { value: 'sar', label: 'SAR팀' },
    { value: 'emc', label: 'EMC팀' },
  ],
  uiwang: [
    { value: 'auto', label: 'Automotive팀' },
    { value: 'emc', label: 'EMC팀' },
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
  id: number;
  uuid: string;
  name: string;
  code: string;
  site: Site;
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
  const [filteredTeams, setFilteredTeams] = useState<Array<{ value: string; label: string }>>([]);

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
        .map((team) => ({ value: String(team.id), label: team.name }));
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

          {/* 관리번호 */}
          <FormField
            control={control}
            name="managementNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  관리번호 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="예: SUW-E0001 (자동생성 가능)" {...field} />
                </FormControl>
                <FormDescription>고유한 관리번호를 입력하세요</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    <SelectItem value="suwon">수원</SelectItem>
                    <SelectItem value="uiwang">의왕</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>장비가 위치한 사이트를 선택하세요</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 팀 */}
          <FormField
            control={control}
            name="teamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  팀 <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
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
                        {team.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>사이트별 팀이 자동 필터링됩니다</FormDescription>
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

          {/* 일련번호 (라벨 변경: 시리얼넘버 → 일련번호) */}
          <FormField
            control={control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  일련번호 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="예: SN123456" {...field} />
                </FormControl>
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
