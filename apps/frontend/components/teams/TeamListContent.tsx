'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Search, Users, Plus, UserCheck, AlertTriangle, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import teamsApi, { type Team, SITE_CONFIG, CLASSIFICATION_CONFIG } from '@/lib/api/teams-api';
import type { PaginatedResponse } from '@/lib/api/types';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useTeamFilters } from '@/hooks/use-team-filters';
import type { UITeamFilters } from '@/lib/utils/team-filter-utils';
import type { UserRole } from '@equipment-management/schemas';
import { TEAMS_SITE_RESTRICTED_ROLES } from '@equipment-management/shared-constants';
import {
  SITE_PANEL_TOKENS,
  TEAM_ROW_TOKENS,
  CLS_PILL_TOKENS,
  getStaggerDelay,
  MOTION_PRIMITIVES,
  TRANSITION_PRESETS,
} from '@/lib/design-tokens';

interface TeamListContentProps {
  initialData?: PaginatedResponse<Team>;
  initialFilters?: UITeamFilters;
}

/**
 * 팀 목록 컴포넌트 ('use client') — v3 Site-First 리디자인
 *
 * 변경사항 (v2 → v3):
 * - Primary axis: Classification → Site (사이트당 팀이 1개뿐인 도메인 모델 반영)
 * - 좌측 필터 패널 제거 → 상단 분류 pill 필터로 교체 (lighter)
 * - TeamCard(heavy) → TeamRow(compact) — 사이트당 팀 수가 적어 row가 밀도 효율 높음
 * - 3-column site panel grid — 사이트별 팀 구성 한눈에 파악
 * - 사이트 제한 사용자: 자기 사이트 1컬럼만 표시
 *
 * SSOT 패턴:
 * - URL 파라미터 (useTeamFilters) — 필터 상태 유일한 소스
 * - SITE_PANEL_TOKENS / TEAM_ROW_TOKENS / CLS_PILL_TOKENS — 디자인 토큰
 * - CLASSIFICATION_CONFIG / SITE_CONFIG — 데이터 driven 렌더링
 */
export function TeamListContent({ initialData, initialFilters }: TeamListContentProps) {
  const router = useRouter();
  const { hasRole, user } = useAuth();
  const t = useTranslations('teams');

  const isSiteFixed = user?.role
    ? TEAMS_SITE_RESTRICTED_ROLES.includes(user.role as UserRole)
    : false;

  const { filters, apiFilters, activeCount, updateSearch, updateClassification, clearFilters } =
    useTeamFilters(initialFilters);

  // 검색어 디바운스 (300ms)
  const [searchInput, setSearchInput] = useState(filters.search);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch !== filters.search) updateSearch(debouncedSearch);
  }, [debouncedSearch, filters.search, updateSearch]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.teams.list(apiFilters),
    queryFn: () => teamsApi.getTeams(apiFilters),
    placeholderData: initialData,
    ...QUERY_CONFIG.TEAMS,
  });

  const teams = useMemo(() => data?.data || [], [data]);
  const canCreateTeam = hasRole(['lab_manager', 'system_admin', 'technical_manager']);
  const hasActiveFilters = activeCount > 0;

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    clearFilters();
  };

  // 표시할 사이트 목록 (isSiteFixed → 자기 사이트만)
  const visibleSites = useMemo(() => {
    if (isSiteFixed && user?.site) return [user.site];
    return Object.keys(SITE_CONFIG);
  }, [isSiteFixed, user?.site]);

  // 사이트별 팀 그룹핑
  const siteTeams = useMemo(() => {
    const groups: Record<string, Team[]> = {};
    Object.keys(SITE_CONFIG).forEach((site) => {
      groups[site] = [];
    });
    teams.forEach((team) => {
      const site = team.site || '';
      if (site && groups[site]) groups[site].push(team);
    });
    return groups;
  }, [teams]);

  // 전체 통계
  const totalMemberCount = useMemo(
    () => teams.reduce((acc, team) => acc + (team.memberCount || 0), 0),
    [teams]
  );
  const noLeaderCount = useMemo(() => teams.filter((team) => !team.leaderName).length, [teams]);

  if (error) {
    return (
      <ErrorAlert
        error={error as Error}
        title={t('listContent.errorLoad')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4" aria-live="polite" aria-busy={isFetching}>
      {/* ─── 상단 필터 툴바 ─── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 검색 */}
        <div className="relative flex-shrink-0">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={t('listContent.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 h-8 text-sm w-64"
            aria-label={t('listContent.searchAriaLabel')}
          />
        </div>

        {/* 구분선 */}
        <div className="h-5 w-px bg-border mx-1 flex-shrink-0" aria-hidden="true" />

        {/* 분류 pill 필터 */}
        <div
          className="flex items-center gap-1.5 flex-wrap"
          role="group"
          aria-label={t('listContent.classificationFilterAriaLabel')}
        >
          <button
            type="button"
            onClick={() => updateClassification('')}
            className={cn(
              CLS_PILL_TOKENS.pill,
              !filters.classification && CLS_PILL_TOKENS.pillActive
            )}
            aria-pressed={!filters.classification}
          >
            {t('listContent.allClassifications')}
          </button>

          {Object.entries(CLASSIFICATION_CONFIG).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                updateClassification(
                  filters.classification === key
                    ? ''
                    : (key as Parameters<typeof updateClassification>[0])
                )
              }
              className={cn(
                CLS_PILL_TOKENS.pill,
                filters.classification === key && CLS_PILL_TOKENS.pillActive
              )}
              aria-pressed={filters.classification === key}
            >
              <span
                className={CLS_PILL_TOKENS.dot}
                style={{ background: config.color }}
                aria-hidden="true"
              />
              {config.label}
            </button>
          ))}
        </div>

        {/* 필터 초기화 */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className={`ml-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground ${TRANSITION_PRESETS.instantColor} flex-shrink-0`}
          >
            {t('listContent.clearFilters')}
          </button>
        )}
      </div>

      {/* ─── 전체 통계 + 팀 추가 버튼 ─── */}
      {!isLoading && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span>{t('listContent.stats.totalTeams')}</span>
              <span className="font-mono font-semibold text-foreground tabular-nums">
                {teams.length}
              </span>
            </span>
            <span className="h-3 w-px bg-border" aria-hidden="true" />
            <span className="flex items-center gap-1.5">
              <span>{t('listContent.stats.totalMembers')}</span>
              <span className="font-mono font-semibold text-foreground tabular-nums">
                {totalMemberCount}
              </span>
            </span>
            {noLeaderCount > 0 && (
              <>
                <span className="h-3 w-px bg-border" aria-hidden="true" />
                <span className="flex items-center gap-1.5 text-brand-warning">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t('listContent.stats.noLeader')}</span>
                  <span className="font-mono font-semibold tabular-nums">{noLeaderCount}</span>
                </span>
              </>
            )}
          </div>
          {canCreateTeam && (
            <Button size="sm" onClick={() => router.push('/teams/create')}>
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {t('listContent.addTeam')}
            </Button>
          )}
        </div>
      )}

      {/* ─── 사이트 패널 그리드 ─── */}
      {isLoading ? (
        <SiteGridSkeleton visibleCount={visibleSites.length} />
      ) : teams.length === 0 && hasActiveFilters ? (
        <EmptyFilterResult onClear={handleClearFilters} t={t} searchTerm={debouncedSearch} />
      ) : (
        <div
          className={cn(
            'grid gap-4 items-start',
            visibleSites.length === 1
              ? 'grid-cols-1 max-w-sm'
              : visibleSites.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          )}
        >
          {visibleSites.map((site) => {
            const siteConfig = SITE_CONFIG[site as keyof typeof SITE_CONFIG];
            const siteTeamList = siteTeams[site] || [];
            return (
              <SitePanel
                key={site}
                siteKey={site}
                siteConfig={
                  siteConfig as (typeof SITE_CONFIG)[keyof typeof SITE_CONFIG] & { color: string }
                }
                teams={siteTeamList}
                canCreateTeam={canCreateTeam}
                onTeamClick={(team) => router.push(`/teams/${team.id}`)}
                onAddTeam={() => router.push(`/teams/create?site=${site}`)}
                t={t}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SitePanel — 사이트별 팀 목록 패널
// ─────────────────────────────────────────────────────────────────────────────

interface SiteConfig {
  label: string;
  code: string;
  color: string;
}

interface SitePanelProps {
  siteKey: string;
  siteConfig: SiteConfig;
  teams: Team[];
  canCreateTeam: boolean;
  onTeamClick: (team: Team) => void;
  onAddTeam: () => void;
  t: ReturnType<typeof useTranslations<'teams'>>;
}

function SitePanel({
  siteConfig,
  teams,
  canCreateTeam,
  onTeamClick,
  onAddTeam,
  t,
}: SitePanelProps) {
  const memberCount = useMemo(
    () => teams.reduce((acc, team) => acc + (team.memberCount || 0), 0),
    [teams]
  );
  const noLeaderCount = useMemo(() => teams.filter((team) => !team.leaderName).length, [teams]);

  return (
    <div className={SITE_PANEL_TOKENS.panel}>
      {/* 사이트 헤더 */}
      <div className={SITE_PANEL_TOKENS.header}>
        {/* 상단 accent bar — 사이트 identity 색상 */}
        <div
          className={SITE_PANEL_TOKENS.accentBar}
          style={{ background: siteConfig.color }}
          aria-hidden="true"
        />

        <div className={SITE_PANEL_TOKENS.nameRow}>
          <span className={SITE_PANEL_TOKENS.name}>{siteConfig.label}</span>
          <span
            className={SITE_PANEL_TOKENS.codeBadge}
            style={{
              color: siteConfig.color,
              borderColor: `${siteConfig.color}40`,
              background: `${siteConfig.color}08`,
            }}
          >
            {siteConfig.code}
          </span>
        </div>

        <div className={SITE_PANEL_TOKENS.metaRow}>
          <div className={SITE_PANEL_TOKENS.metaItem}>
            <Users className="h-3 w-3" aria-hidden="true" />
            <span className={SITE_PANEL_TOKENS.metaNum}>{teams.length}</span>팀
          </div>
          <div className={SITE_PANEL_TOKENS.metaItem}>
            <span className={SITE_PANEL_TOKENS.metaNum}>{memberCount}</span>명
          </div>
          {noLeaderCount > 0 && (
            <div className={cn(SITE_PANEL_TOKENS.metaItem, 'text-brand-warning')}>
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              <span className={SITE_PANEL_TOKENS.metaNumWarn}>{noLeaderCount}</span>
              {t('listContent.stats.noLeader')}
            </div>
          )}
        </div>
      </div>

      {/* 팀 목록 */}
      <div className={SITE_PANEL_TOKENS.teamList}>
        {teams.length === 0 ? (
          <EmptySitePanel t={t} />
        ) : (
          teams.map((team, index) => (
            <Fragment key={team.id}>
              {index > 0 && <div className={TEAM_ROW_TOKENS.divider} />}
              <div
                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 fill-mode-forwards"
                style={{
                  animationDelay: getStaggerDelay(index, 'list'),
                  animationDuration: `${MOTION_PRIMITIVES.duration.fast}ms`,
                }}
              >
                <TeamRow team={team} onClick={() => onTeamClick(team)} t={t} />
              </div>
            </Fragment>
          ))
        )}
      </div>

      {/* 사이트별 팀 추가 버튼 */}
      {canCreateTeam && (
        <div className={SITE_PANEL_TOKENS.footer}>
          <button type="button" onClick={onAddTeam} className={SITE_PANEL_TOKENS.addBtn}>
            <Plus className="h-3 w-3" aria-hidden="true" />
            {t('listContent.addTeam')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TeamRow — 사이트 패널 내 compact 팀 행
// ─────────────────────────────────────────────────────────────────────────────

interface TeamRowProps {
  team: Team;
  onClick: () => void;
  t: ReturnType<typeof useTranslations<'teams'>>;
}

function TeamRow({ team, onClick, t }: TeamRowProps) {
  const clsConfig =
    CLASSIFICATION_CONFIG[team.classification || 'fcc_emc_rf'] || CLASSIFICATION_CONFIG.fcc_emc_rf;

  return (
    <div
      role="button"
      tabIndex={0}
      className={TEAM_ROW_TOKENS.row}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={team.name}
    >
      {/* 분류 색상 left accent bar — hover 시 나타남 */}
      <div
        className={TEAM_ROW_TOKENS.accentBar}
        style={{ background: clsConfig.color }}
        aria-hidden="true"
      />

      {/* 분류 코드 아이콘 */}
      <div
        className={TEAM_ROW_TOKENS.clsIcon}
        style={{ background: clsConfig.bgColor, color: clsConfig.color }}
        aria-hidden="true"
      >
        {clsConfig.classificationCode}
      </div>

      {/* 팀명 + 팀장 */}
      <div className={TEAM_ROW_TOKENS.info}>
        <div className={TEAM_ROW_TOKENS.clsName}>{team.name}</div>
        <div className={TEAM_ROW_TOKENS.leaderRow}>
          {team.leaderName ? (
            <>
              <UserCheck
                className="h-[10px] w-[10px] text-brand-ok flex-shrink-0"
                aria-hidden="true"
              />
              <span className={TEAM_ROW_TOKENS.leaderName}>{team.leaderName}</span>
            </>
          ) : (
            <span className={TEAM_ROW_TOKENS.noLeaderBadge}>
              <AlertTriangle className="h-[10px] w-[10px]" aria-hidden="true" />
              {t('listContent.stats.noLeader')}
            </span>
          )}
        </div>
      </div>

      {/* KPI 칩: 팀원 수 + 장비 수 */}
      <div className={TEAM_ROW_TOKENS.kpiGroup}>
        <div className={TEAM_ROW_TOKENS.kpiChip}>
          <Users className="h-3 w-3" aria-hidden="true" />
          <span className={TEAM_ROW_TOKENS.kpiNum}>{team.memberCount ?? 0}</span>
        </div>
        <div className={TEAM_ROW_TOKENS.kpiChip}>
          <Package className="h-3 w-3" aria-hidden="true" />
          <span className={TEAM_ROW_TOKENS.kpiNum}>{team.equipmentCount ?? 0}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 빈 상태 컴포넌트들
// ─────────────────────────────────────────────────────────────────────────────

function EmptySitePanel({ t }: { t: ReturnType<typeof useTranslations<'teams'>> }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center px-4">
      <Users className="h-7 w-7 text-muted-foreground/40 mb-2" aria-hidden="true" />
      <p className="text-xs text-muted-foreground">{t('listContent.empty.noTeams')}</p>
    </div>
  );
}

function EmptyFilterResult({
  onClear,
  t,
  searchTerm,
}: {
  onClear: () => void;
  t: ReturnType<typeof useTranslations<'teams'>>;
  searchTerm?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted rounded-full p-4 mb-4">
        <Users className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-2">{t('listContent.empty.noResults')}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-5">
        {searchTerm
          ? t('listContent.empty.noResultsForSearch', { term: searchTerm })
          : t('listContent.empty.noResultsForFilter')}
      </p>
      <Button variant="outline" size="sm" onClick={onClear} type="button">
        {t('listContent.empty.clearFilters')}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 스켈레톤 — v3 구조 동기화
// ─────────────────────────────────────────────────────────────────────────────

function SiteGridSkeleton({ visibleCount }: { visibleCount: number }) {
  const colClass =
    visibleCount === 1
      ? 'grid-cols-1 max-w-sm'
      : visibleCount === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  return (
    <div className={cn('grid gap-4 items-start', colClass)}>
      {Array.from({ length: visibleCount }).map((_, si) => (
        <div
          key={si}
          className="bg-card border border-border rounded-lg overflow-hidden motion-safe:animate-pulse"
          style={{ animationDelay: `${si * 80}ms` }}
        >
          {/* Site header skeleton */}
          <div className="px-4 py-3.5 border-b border-border space-y-2">
            <div className="h-[3px] w-full bg-muted -mt-3.5 -mx-4 mb-3" />
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 bg-muted rounded" />
              <div className="h-4 w-8 bg-muted rounded" />
            </div>
            <div className="flex gap-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-3.5 w-10 bg-muted rounded" />
              ))}
            </div>
          </div>
          {/* Team row skeletons */}
          <div className="py-1.5">
            {[...Array(3)].map((_, ri) => (
              <div key={ri} className="flex items-center px-3.5 py-2.5 gap-2.5">
                <div className="h-[30px] w-[30px] rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-3.5 w-8 bg-muted rounded" />
                  <div className="h-3.5 w-8 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 팀 목록 페이지 스켈레톤 (Suspense fallback용)
 */
export function TeamListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      {/* 필터 툴바 스켈레톤 */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-64 bg-muted rounded-md motion-safe:animate-pulse" />
        <div className="h-5 w-px bg-border" />
        <div className="flex gap-1.5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-7 w-20 bg-muted rounded-full motion-safe:animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
      {/* 통계 바 스켈레톤 */}
      <div className="flex items-center gap-4">
        <div className="h-4 w-32 bg-muted rounded motion-safe:animate-pulse" />
        <div className="h-4 w-28 bg-muted rounded motion-safe:animate-pulse" />
      </div>
      {/* 사이트 패널 그리드 스켈레톤 */}
      <SiteGridSkeleton visibleCount={3} />
    </div>
  );
}
