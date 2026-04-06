'use client';

import { useMemo, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ChevronDown, Info, Upload, Trash2, Pen, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/api-client';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import {
  API_ENDPOINTS,
  getPermissions,
  PERMISSION_CATEGORIES,
  PERMISSION_CATEGORY_KEYS,
} from '@equipment-management/shared-constants';
import { type UserProfile } from '@equipment-management/schemas';
import {
  SETTINGS_CARD_HEADER_TOKENS,
  SETTINGS_PROFILE_HERO_TOKENS,
  SETTINGS_PROFILE_GRID_TOKENS,
  SETTINGS_PERMISSIONS_CARD_TOKENS,
  SETTINGS_PROFILE_BADGE_TOKENS,
  SETTINGS_SPACING_TOKENS,
  SETTINGS_FORM_ITEM_TOKENS,
  SETTINGS_SAVE_INDICATOR_TOKENS,
  getSettingsCardClasses,
  getSettingsCardHeaderClasses,
  getSettingsPermissionsTriggerClasses,
  getSettingsFormItemClasses,
  TRANSITION_PRESETS,
} from '@/lib/design-tokens';

function GridCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={SETTINGS_PROFILE_GRID_TOKENS.cell}>
      <p className={SETTINGS_PROFILE_GRID_TOKENS.label}>{label}</p>
      {children}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <Card className={getSettingsCardClasses()}>
        <CardHeader className={getSettingsCardHeaderClasses()}>
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-56 mt-1" />
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="flex items-start gap-4 p-5 border-b border-border/50">
            <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-52" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </div>
          <div className={SETTINGS_PROFILE_GRID_TOKENS.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={SETTINGS_PROFILE_GRID_TOKENS.cell}>
                <Skeleton className="h-3 w-14 mb-1" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Permissions skeleton */}
      <Card className={getSettingsCardClasses()}>
        <CardHeader className={getSettingsCardHeaderClasses()}>
          <div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-48 mt-1" />
          </div>
        </CardHeader>
        <CardContent className="py-4 px-5">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-16 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * SignatureCard — 전자서명 업로드/삭제 카드
 *
 * Design tokens: SETTINGS_FORM_ITEM_TOKENS, TRANSITION_PRESETS
 * Accessibility: focus-visible, aria-label, Loader2 스피너
 */
function SignatureCard({
  profile,
}: {
  profile: UserProfile & { signatureImagePath?: string | null };
}) {
  const t = useTranslations('settings');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post(API_ENDPOINTS.USERS.SIGNATURE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.profile() });
      toast({ description: t('profile.signature.uploadSuccess') });
    },
    onError: () => {
      toast({ variant: 'destructive', description: t('profile.signature.uploadError') });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete(API_ENDPOINTS.USERS.SIGNATURE);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.profile() });
      setConfirmingDelete(false);
      toast({ description: t('profile.signature.deleteSuccess') });
    },
    onError: () => {
      toast({ variant: 'destructive', description: t('profile.signature.deleteError') });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    e.target.value = '';
  };

  const hasSignature = !!profile.signatureImagePath;
  const isLoading = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <Card className={getSettingsCardClasses()}>
      <CardHeader className={getSettingsCardHeaderClasses()}>
        <div className={SETTINGS_CARD_HEADER_TOKENS.titleWrapper}>
          <CardTitle className={SETTINGS_CARD_HEADER_TOKENS.title}>
            {t('profile.signature.title')}
          </CardTitle>
          <CardDescription className={SETTINGS_CARD_HEADER_TOKENS.description}>
            {t('profile.signature.description')}
          </CardDescription>
        </div>
        {isLoading && (
          <Loader2 className={SETTINGS_SAVE_INDICATOR_TOKENS.saving} aria-hidden="true" />
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleFileSelect}
          aria-label={t('profile.signature.upload')}
        />

        {hasSignature ? (
          <div className={`${getSettingsFormItemClasses()} ${SETTINGS_FORM_ITEM_TOKENS.layout}`}>
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="rounded-md border border-border/50 bg-muted/30 p-3 flex items-center justify-center shadow-sm">
                <img
                  src={`/api/files/${profile.signatureImagePath}`}
                  alt={t('profile.signature.title')}
                  className="max-h-12 max-w-[160px] object-contain"
                />
              </div>
              <div className={SETTINGS_FORM_ITEM_TOKENS.labelWrapper}>
                <p className={SETTINGS_FORM_ITEM_TOKENS.label}>{t('profile.signature.title')}</p>
                <p className={`${SETTINGS_FORM_ITEM_TOKENS.description} text-muted-foreground`}>
                  {t('profile.signature.uploadHint')}
                </p>
              </div>
            </div>
            <div className={SETTINGS_FORM_ITEM_TOKENS.actionArea}>
              {confirmingDelete ? (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate()}
                    disabled={isLoading}
                  >
                    {t('profile.signature.delete')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={isLoading}
                  >
                    ✕
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Pen className="h-3.5 w-3.5 mr-1.5" />
                    {t('profile.signature.change')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingDelete(true)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">{t('profile.signature.delete')}</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={[
              'w-full rounded-lg border-2 border-dashed border-border/50 p-8',
              'flex flex-col items-center gap-2.5 cursor-pointer',
              'hover:border-primary/30 hover:bg-accent/30',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              TRANSITION_PRESETS.fastBorderBg,
            ].join(' ')}
          >
            <div className="rounded-full bg-muted/50 p-3">
              <Upload className="h-6 w-6 text-muted-foreground/70" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{t('profile.signature.upload')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('profile.signature.uploadHint')}
              </p>
            </div>
          </button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * ProfileDisplay — 프레젠테이션 레이어
 *
 * profile이 확정된 상태에서만 마운트되므로
 * useMemo 등 모든 Hook이 항상 동일 순서로 호출됨 (Rules of Hooks 보장)
 */
function ProfileDisplay({ profile }: { profile: UserProfile }) {
  const t = useTranslations('settings');
  const tNav = useTranslations('navigation');
  const tEquip = useTranslations('equipment');
  const locale = useLocale();
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const permissionLabels = t.raw('profile.permissions.labels') as Record<string, string>;

  // 권한을 카테고리별로 그룹화 (SSOT: PERMISSION_CATEGORIES)
  const permissionsByCategory = useMemo(() => {
    const userPerms = new Set(getPermissions(profile.role));
    return PERMISSION_CATEGORY_KEYS.map((key) => ({
      key,
      permissions: PERMISSION_CATEGORIES[key].filter((p) => userPerms.has(p)),
    })).filter((cat) => cat.permissions.length > 0);
  }, [profile.role]);

  const totalPermissions = useMemo(
    () => permissionsByCategory.reduce((sum, cat) => sum + cat.permissions.length, 0),
    [permissionsByCategory]
  );

  // i18n을 통한 역할/사이트 라벨 (SSOT: navigation.roles.* / equipment.siteLabel.*)
  const roleLabel = tNav(`roles.${profile.role}` as Parameters<typeof tNav>[0]);
  const siteLabel = profile.site
    ? tEquip(`siteLabel.${profile.site}` as Parameters<typeof tEquip>[0])
    : undefined;

  // 이니셜 생성: 이름 단어별 첫 글자 최대 2자
  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // 마지막 로그인 포맷 (locale 기반)
  const localeTag = locale === 'ko' ? 'ko-KR' : 'en-US';
  const lastLoginFormatted = profile.lastLogin
    ? new Date(profile.lastLogin).toLocaleString(localeTag, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className={SETTINGS_SPACING_TOKENS.pageContent}>
      {/* Profile Card — Plain header (wireframe v2) */}
      <Card className={getSettingsCardClasses()}>
        <CardHeader className={getSettingsCardHeaderClasses()}>
          <div className={SETTINGS_CARD_HEADER_TOKENS.titleWrapper}>
            <CardTitle className={SETTINGS_CARD_HEADER_TOKENS.title}>
              {t('profile.title')}
            </CardTitle>
            <CardDescription className={SETTINGS_CARD_HEADER_TOKENS.description}>
              {t('profile.description')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-0 pb-0">
          {/* 아바타 히어로 섹션 */}
          <div className={`${SETTINGS_PROFILE_HERO_TOKENS.container} px-6 pt-5`}>
            <div className={SETTINGS_PROFILE_HERO_TOKENS.avatar} aria-hidden="true">
              {initials}
            </div>
            <div>
              <p className={SETTINGS_PROFILE_HERO_TOKENS.name}>{profile.name}</p>
              <p className={SETTINGS_PROFILE_HERO_TOKENS.email}>{profile.email}</p>
              <div className={SETTINGS_PROFILE_HERO_TOKENS.badgeRow}>
                <Badge variant="secondary" className={SETTINGS_PROFILE_BADGE_TOKENS.role}>
                  {roleLabel}
                </Badge>
                {profile.isActive ? (
                  <Badge variant="outline" className={SETTINGS_PROFILE_BADGE_TOKENS.active}>
                    {t('profile.active')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className={SETTINGS_PROFILE_BADGE_TOKENS.inactive}>
                    {t('profile.inactive')}
                  </Badge>
                )}
                {siteLabel && (
                  <Badge variant="outline" className={SETTINGS_PROFILE_BADGE_TOKENS.site}>
                    {siteLabel}
                  </Badge>
                )}
              </div>
            </div>
            {/* B-3: 마지막 로그인 (히어로 우측 상단) */}
            <div className={SETTINGS_PROFILE_HERO_TOKENS.lastLogin.container}>
              <p className={SETTINGS_PROFILE_HERO_TOKENS.lastLogin.label}>
                {t('profile.lastLogin')}
              </p>
              <p className={SETTINGS_PROFILE_HERO_TOKENS.lastLogin.value}>
                {lastLoginFormatted ?? t('profile.lastLoginNever')}
              </p>
            </div>
          </div>

          {/* 히어로에 이름/이메일/역할/활성/사이트 표시 → 그리드는 보완 필드만 */}
          <div className={SETTINGS_PROFILE_GRID_TOKENS.grid}>
            <GridCell label={t('profile.fields.department')}>
              {profile.department ? (
                <p className={SETTINGS_PROFILE_GRID_TOKENS.valueNormal}>{profile.department}</p>
              ) : (
                <p className={SETTINGS_PROFILE_GRID_TOKENS.valueEmpty}>
                  {t('profile.notRegistered')}
                </p>
              )}
            </GridCell>
            <GridCell label={t('profile.fields.team')}>
              {profile.teamName ? (
                <p className={SETTINGS_PROFILE_GRID_TOKENS.valueNormal}>{profile.teamName}</p>
              ) : (
                <p className={SETTINGS_PROFILE_GRID_TOKENS.valueEmpty}>
                  {t('profile.notRegistered')}
                </p>
              )}
            </GridCell>
            <GridCell label={t('profile.fields.position')}>
              {profile.position ? (
                <p className={SETTINGS_PROFILE_GRID_TOKENS.valueNormal}>{profile.position}</p>
              ) : (
                <p className={SETTINGS_PROFILE_GRID_TOKENS.valueEmpty}>
                  {t('profile.notRegistered')}
                </p>
              )}
            </GridCell>
            <GridCell label={t('profile.fields.phone')}>
              {profile.phoneNumber ? (
                <p className={SETTINGS_PROFILE_GRID_TOKENS.value}>{profile.phoneNumber}</p>
              ) : (
                <p className={SETTINGS_PROFILE_GRID_TOKENS.valueEmpty}>
                  {t('profile.notRegistered')}
                </p>
              )}
            </GridCell>
            <GridCell label={t('profile.fields.employeeId')}>
              {profile.employeeId ? (
                <p className={SETTINGS_PROFILE_GRID_TOKENS.value}>{profile.employeeId}</p>
              ) : (
                <p className={SETTINGS_PROFILE_GRID_TOKENS.valueEmpty}>
                  {t('profile.notRegistered')}
                </p>
              )}
            </GridCell>
            <GridCell label={t('profile.fields.userId')}>
              <p className={SETTINGS_PROFILE_GRID_TOKENS.value}>{profile.id.slice(0, 12)}</p>
            </GridCell>
          </div>
        </CardContent>
      </Card>

      {/* Signature Card */}
      <SignatureCard profile={profile} />

      {/* Permissions Card — 읽기 전용 Collapsible */}
      <Card className={getSettingsCardClasses()}>
        <Collapsible open={permissionsOpen} onOpenChange={setPermissionsOpen}>
          <CollapsibleTrigger asChild>
            <button type="button" className={getSettingsPermissionsTriggerClasses()}>
              <div className={SETTINGS_PERMISSIONS_CARD_TOKENS.triggerLabel}>
                <div>
                  <CardTitle className={SETTINGS_CARD_HEADER_TOKENS.title}>
                    {t('profile.permissions.title')}
                  </CardTitle>
                  <CardDescription className={SETTINGS_CARD_HEADER_TOKENS.description}>
                    {t('profile.permissions.description')}
                  </CardDescription>
                </div>
                <Badge variant="outline" className={SETTINGS_PERMISSIONS_CARD_TOKENS.readOnlyBadge}>
                  {t('profile.permissions.readOnly')}
                </Badge>
                <span className={SETTINGS_PERMISSIONS_CARD_TOKENS.triggerCount}>
                  {totalPermissions}
                </span>
              </div>
              <ChevronDown
                className={`${SETTINGS_PERMISSIONS_CARD_TOKENS.chevron.base} ${SETTINGS_PERMISSIONS_CARD_TOKENS.chevron.transition} ${permissionsOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className={SETTINGS_PERMISSIONS_CARD_TOKENS.content}>
              {permissionsByCategory.map((category) => (
                <div
                  key={category.key}
                  className={SETTINGS_PERMISSIONS_CARD_TOKENS.categorySection}
                >
                  <p className={SETTINGS_PERMISSIONS_CARD_TOKENS.categoryLabel}>
                    {t(`profile.permissions.categories.${category.key}` as Parameters<typeof t>[0])}
                  </p>
                  <div
                    className={SETTINGS_PERMISSIONS_CARD_TOKENS.badgeWrap}
                    role="list"
                    aria-label={t(
                      `profile.permissions.categories.${category.key}` as Parameters<typeof t>[0]
                    )}
                  >
                    {category.permissions.map((permission) => (
                      <Badge
                        key={permission}
                        variant="secondary"
                        className={SETTINGS_PERMISSIONS_CARD_TOKENS.badge}
                        role="listitem"
                      >
                        {permissionLabels[permission] ?? permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              <p className={SETTINGS_PERMISSIONS_CARD_TOKENS.totalCount}>
                {t('profile.permissions.totalCount', { count: totalPermissions })}
              </p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Info Alert */}
      <Alert
        className="border-info/30 bg-info/5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
        style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
      >
        <Info className="h-4 w-4 text-info-foreground" aria-hidden="true" />
        <AlertDescription className="text-sm leading-relaxed">
          {t.rich('profile.azureAdNote', {
            strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
          })}
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * ProfileContent — 데이터 페칭 레이어
 *
 * 역할: useQuery로 프로필 로드 → 로딩/에러 분기 → ProfileDisplay에 위임
 * Hook이 early return 전에만 존재하므로 Rules of Hooks 위반 없음
 */
export default function ProfileContent() {
  const t = useTranslations('settings');

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<UserProfile>({
    queryKey: queryKeys.settings.profile(),
    queryFn: async () => {
      const res = await apiClient.get<UserProfile>(API_ENDPOINTS.USERS.ME);
      return res.data;
    },
    staleTime: CACHE_TIMES.MEDIUM,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
        <ProfileSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        variant="destructive"
        className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300"
      >
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>{t('profile.loadError')}</AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return null;
  }

  return <ProfileDisplay profile={profile} />;
}
