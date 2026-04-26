'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import {
  CHECKOUT_FORM_TOKENS,
  getEquipmentStatusTokenStyle,
  TRANSITION_PRESETS,
  getPageContainerClasses,
  getSemanticContainerColorClasses,
  getSemanticContainerTextClasses,
} from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Trash2, Ban, AlertCircle } from 'lucide-react';
import { addDays } from 'date-fns';
import equipmentApi, { Equipment } from '@/lib/api/equipment-api';
import checkoutApi, { CreateCheckoutDto } from '@/lib/api/checkout-api';
import teamsApi, { type Site } from '@/lib/api/teams-api';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
import {
  CheckoutPurposeValues as CPVal,
  type EquipmentStatus,
  type UserSelectableCheckoutPurpose,
} from '@equipment-management/schemas';
import {
  FRONTEND_ROUTES,
  SELECTOR_PAGE_SIZE,
  Permission,
} from '@equipment-management/shared-constants';
import { queryKeys } from '@/lib/api/query-config';
import { useAuth } from '@/hooks/use-auth';
import {
  getEquipmentSelectability,
  filterVisibleEquipment,
} from '@/lib/utils/checkout-selectability';
import { getDisplayStatus } from '@/lib/constants/equipment-status-styles';

export default function CreateCheckoutContent() {
  const t = useTranslations('checkouts');
  const tEquip = useTranslations('equipment');
  const siteLabels = useSiteLabels();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, can } = useAuth();
  const canCreate = can(Permission.CREATE_CHECKOUT);
  const hasPreselected = useRef(false);

  // URL searchParams에서 프리셀렉션 equipmentId 읽기
  const searchParams = useSearchParams();
  const preselectedEquipmentId = searchParams.get('equipmentId');

  // 폼 ���태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [destination, setDestination] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [purpose, setPurpose] = useState<UserSelectableCheckoutPurpose>('calibration');
  const [reason, setReason] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date>(addDays(new Date(), 7));

  // 외부 대여 시 사이트/팀 선택 상태
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // 사용자 소속 정보
  const userTeamId = user?.teamId;

  // URL에서 전달된 equipmentId로 장비 프리셀렉션
  const { data: preselectedEquipment } = useQuery({
    queryKey: queryKeys.equipment.detail(preselectedEquipmentId ?? ''),
    queryFn: () => equipmentApi.getEquipment(preselectedEquipmentId!),
    enabled: !!preselectedEquipmentId,
  });

  useEffect(() => {
    if (preselectedEquipment && !hasPreselected.current) {
      hasPreselected.current = true;
      setSelectedEquipments([preselectedEquipment]);
    }
  }, [preselectedEquipment]);

  // 외부 대여 시 선택된 사이트의 팀 목록 조회
  const { data: teamsData } = useQuery({
    queryKey: queryKeys.teams.bySite(selectedSite),
    queryFn: () => teamsApi.getTeams({ site: selectedSite as Site, pageSize: 50 }),
    enabled: purpose === CPVal.RENTAL && !!selectedSite,
  });

  // 장비 목록 조회 - 상태 필터 없이 전체 조회 (목적별 선택 가능 여부는 클라이언트에서 판단)
  const equipmentTeamId = purpose === CPVal.RENTAL ? selectedTeamId : userTeamId;
  const {
    data: equipmentsData,
    isLoading: equipmentsLoading,
    isError: equipmentsError,
  } = useQuery({
    queryKey: queryKeys.equipment.checkoutSearch(searchTerm, purpose, equipmentTeamId),
    queryFn: async () => {
      const response = await equipmentApi.getEquipmentList({
        search: searchTerm || undefined,
        teamId: equipmentTeamId || undefined,
        pageSize: SELECTOR_PAGE_SIZE,
      });
      return response;
    },
    enabled: purpose !== CPVal.RENTAL || !!selectedTeamId,
  });

  // 운영 종료된 장비(retired, disposed 등) 필터링
  const visibleEquipments = useMemo(
    () => filterVisibleEquipment(equipmentsData?.data ?? []),
    [equipmentsData?.data]
  );

  // 반출 요청 제출 mutation
  const createCheckoutMutation = useMutation({
    mutationFn: (data: CreateCheckoutDto) => checkoutApi.createCheckout(data),
    onSuccess: async () => {
      toast({
        title: t('toasts.createSuccessTitle'),
        description: t('toasts.createSuccessDescription'),
        variant: 'default',
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.view.all() });
      router.push(FRONTEND_ROUTES.CHECKOUTS.LIST);
    },
    onError: (error: unknown) => {
      toast({
        title: t('toasts.createErrorTitle'),
        description: getErrorMessage(error, t('toasts.createError')),
        variant: 'destructive',
      });
    },
  });

  // 목적 변경 시 장비 및 사이트/팀 초기화
  const handlePurposeChange = (value: UserSelectableCheckoutPurpose) => {
    setPurpose(value);
    setSelectedEquipments([]);
    setSelectedSite('');
    setSelectedTeamId('');
  };

  // 사이트 변경 시 팀 초기화
  const handleSiteChange = (value: string) => {
    setSelectedSite(value);
    setSelectedTeamId('');
    setSelectedEquipments([]);
  };

  // 팀 변경 시 장비 초기화
  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value);
    setSelectedEquipments([]);
  };

  // 장비 선택/해제 토글 처리
  const handleAddEquipment = (equipment: Equipment) => {
    const isAlreadySelected = selectedEquipments.some((e) => e.id === equipment.id);

    if (isAlreadySelected) {
      // 이미 선택된 장비 → 제거
      setSelectedEquipments(selectedEquipments.filter((e) => e.id !== equipment.id));
      toast({
        title: t('toasts.equipmentRemoved'),
        description: t('toasts.equipmentRemovedDesc', { name: equipment.name }),
        variant: 'default',
      });
    } else {
      // 선택되지 않은 장비 → 추가
      setSelectedEquipments([...selectedEquipments, equipment]);
      toast({
        title: t('toasts.equipmentSelected'),
        description: t('toasts.equipmentSelectedDesc', { name: equipment.name }),
        variant: 'default',
      });
    }
  };

  // 선택 불가 장비 클릭 시 안내 처리
  const handleBlockedEquipmentClick = (_equipment: Equipment, reason: string) => {
    toast({
      title: t('toasts.equipmentNotSelectable'),
      description: reason,
      variant: 'destructive',
    });
  };

  // 장비 제거 처리
  const handleRemoveEquipment = (equipmentId: string | number) => {
    setSelectedEquipments(selectedEquipments.filter((e) => String(e.id) !== String(equipmentId)));
  };

  // 반출 신청 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEquipments.length === 0) {
      toast({
        title: t('toasts.selectEquipment'),
        description: t('toasts.selectEquipmentDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (!destination) {
      toast({
        title: t('toasts.enterDestination'),
        description: t('toasts.enterDestinationDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (!reason || !reason.trim()) {
      toast({
        title: t('toasts.enterReason'),
        description: t('toasts.enterReasonDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (!purpose) {
      toast({
        title: t('toasts.selectPurpose'),
        description: t('toasts.selectPurposeDesc'),
        variant: 'destructive',
      });
      return;
    }

    const checkoutData: CreateCheckoutDto = {
      equipmentIds: selectedEquipments.map((e) => String(e.id)),
      destination,
      phoneNumber: phoneNumber || undefined,
      address: address || undefined,
      purpose,
      reason: reason.trim(),
      expectedReturnDate: expectedReturnDate.toISOString(),
      ...(purpose === CPVal.RENTAL && {
        lenderTeamId: selectedTeamId || undefined,
        lenderSiteId: selectedSite || undefined,
      }),
    };

    // 반출 신청 제출
    createCheckoutMutation.mutate(checkoutData);
  };

  // UL-QP-18 직무분리: 권한 없는 역할은 목록으로 리다이렉트 (hooks 이후)
  useEffect(() => {
    if (!canCreate) {
      router.replace(FRONTEND_ROUTES.CHECKOUTS.LIST);
    }
  }, [canCreate, router]);

  if (!canCreate) return null;

  return (
    <div className={getPageContainerClasses()}>
      <PageHeader
        title={t('create.title')}
        subtitle={t('create.subtitle')}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.LIST)}
            className="w-full sm:w-auto"
          >
            {t('actions.backToCheckouts')}
          </Button>
        }
      />

      {/* 안내 메시지 */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('create.guideTitle')}</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>{t('create.guideCalibration')}</li>
            <li>{t('create.guideRental')}</li>
            <li>{t('create.guideApproval')}</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* 장비 선택 영역 */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </span>
              {t('create.step1Title')}
            </CardTitle>
            <CardDescription className="text-sm">{t('create.step1Desc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {/* 목적 선택 (장비 목록 필터링) */}
              {purpose === CPVal.RENTAL && (
                <div
                  className={`p-3 border rounded-md ${getSemanticContainerColorClasses('warning')}`}
                >
                  <p
                    className={`text-xs font-medium ${getSemanticContainerTextClasses('warning')}`}
                  >
                    {t('create.rentalNotice')}
                  </p>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('create.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                  disabled={purpose === CPVal.RENTAL && !selectedTeamId}
                />
              </div>

              <div className="border rounded-md max-h-[600px] overflow-y-auto">
                <TooltipProvider>
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                      <TableRow>
                        <TableHead>{t('create.equipmentInfo')}</TableHead>
                        <TableHead className="w-32">{t('create.equipmentStatus')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipmentsError ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-center text-sm text-destructive py-4"
                          >
                            {t('create.loadError')}
                          </TableCell>
                        </TableRow>
                      ) : equipmentsLoading ? (
                        <TableRow>
                          <TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                              <span>{t('create.loading')}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : visibleEquipments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
                            {searchTerm ? (
                              <div>
                                <p className="font-medium">{t('create.noResults')}</p>
                                <p className="text-sm mt-1">{t('create.noResultsHint')}</p>
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium">{t('create.noEquipment')}</p>
                                {purpose === CPVal.RENTAL && !selectedTeamId && (
                                  <p className="text-sm mt-1">{t('create.selectTeamHint')}</p>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        visibleEquipments.map((equipment: Equipment) => {
                          const statusStyle = getEquipmentStatusTokenStyle(
                            equipment.status,
                            equipment.nextCalibrationDate
                          );
                          const selectability = getEquipmentSelectability(equipment, purpose);
                          // reasonParams.statusLabel이 equipment 네임스페이스의 i18n 키인 경우 resolve
                          const resolvedReasonParams = selectability.reasonParams?.statusLabel
                            ? {
                                ...selectability.reasonParams,
                                statusLabel: tEquip(
                                  selectability.reasonParams.statusLabel as Parameters<
                                    typeof tEquip
                                  >[0]
                                ),
                              }
                            : selectability.reasonParams;
                          const isAlreadySelected = selectedEquipments.some(
                            (e) => e.id === equipment.id
                          );

                          return (
                            <TableRow
                              key={equipment.id}
                              data-testid={`equipment-${equipment.id}`}
                              tabIndex={selectability.selectable ? 0 : -1}
                              role={selectability.selectable ? 'button' : undefined}
                              onClick={() => {
                                if (selectability.selectable) {
                                  handleAddEquipment(equipment);
                                } else {
                                  handleBlockedEquipmentClick(
                                    equipment,
                                    selectability.reasonKey
                                      ? t(
                                          selectability.reasonKey as Parameters<typeof t>[0],
                                          resolvedReasonParams
                                        )
                                      : t('create.notSelectable')
                                  );
                                }
                              }}
                              onKeyDown={(e) => {
                                if (
                                  selectability.selectable &&
                                  (e.key === 'Enter' || e.key === ' ')
                                ) {
                                  e.preventDefault();
                                  handleAddEquipment(equipment);
                                }
                              }}
                              aria-label={
                                selectability.selectable
                                  ? `${equipment.name} ${isAlreadySelected ? t('create.selected') : t('create.step1Title')}`
                                  : `${equipment.name} ${t('create.notSelectable')}: ${selectability.reasonKey ? t(selectability.reasonKey as Parameters<typeof t>[0], resolvedReasonParams) : ''}`
                              }
                              className={`
                                ${
                                  selectability.selectable
                                    ? isAlreadySelected
                                      ? `${CHECKOUT_FORM_TOKENS.selectableRow.selected} border-l-4 shadow-sm`
                                      : CHECKOUT_FORM_TOKENS.selectableRow.hoverable
                                    : CHECKOUT_FORM_TOKENS.selectableRow.disabled
                                } ${CHECKOUT_FORM_TOKENS.selectableRow.base}
                              `}
                            >
                              <TableCell className="py-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p
                                        className="font-medium text-base truncate"
                                        title={equipment.name}
                                      >
                                        {equipment.name}
                                      </p>
                                      {isAlreadySelected && (
                                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                          {t('create.selected')}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground font-mono">
                                      {equipment.managementNumber}
                                    </p>
                                    {selectability.selectable && selectability.warningKey && (
                                      <p className="text-xs text-brand-warning mt-1.5 leading-tight flex items-start gap-1">
                                        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                        {t(
                                          selectability.warningKey as Parameters<typeof t>[0],
                                          selectability.warningParams
                                        )}
                                      </p>
                                    )}
                                  </div>
                                  {!selectability.selectable && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex-shrink-0">
                                          <Ban className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="left" className="max-w-xs">
                                        <p className="text-sm">
                                          {selectability.reasonKey
                                            ? t(
                                                selectability.reasonKey as Parameters<typeof t>[0],
                                                resolvedReasonParams
                                              )
                                            : t('create.notSelectable')}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge
                                  className={`${statusStyle.className} text-sm whitespace-nowrap`}
                                >
                                  {tEquip(
                                    `status.${getDisplayStatus((equipment.status || 'available') as EquipmentStatus)}` as Parameters<
                                      typeof tEquip
                                    >[0]
                                  )}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              </div>

              <Separator className="my-4" />

              {/* 선택된 장비 요약 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base">
                    {t('create.selectedEquipment')}{' '}
                    <Badge variant="secondary" className="ml-2 text-xs px-2 py-0.5">
                      {selectedEquipments.length}
                    </Badge>
                  </h3>
                  {selectedEquipments.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEquipments([])}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive"
                    >
                      {t('actions.selectAll')}
                    </Button>
                  )}
                </div>

                {selectedEquipments.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
                    <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">{t('create.noSelectedEquipment')}</p>
                    <p className="text-xs mt-1">{t('create.noSelectedEquipmentHint')}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {selectedEquipments.map((equipment) => {
                      const statusStyle = getEquipmentStatusTokenStyle(
                        equipment.status,
                        equipment.nextCalibrationDate
                      );

                      return (
                        <Card
                          key={equipment.id}
                          className={`relative border-l-4 border-l-primary overflow-hidden hover:shadow-md ${TRANSITION_PRESETS.fastShadow}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <p
                                    className="font-semibold text-base truncate"
                                    title={equipment.name}
                                  >
                                    {equipment.name}
                                  </p>
                                  <Badge className={`${statusStyle.className} text-xs`}>
                                    {tEquip(
                                      `status.${getDisplayStatus((equipment.status || 'available') as EquipmentStatus)}` as Parameters<
                                        typeof tEquip
                                      >[0]
                                    )}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {equipment.managementNumber}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('create.removeEquipment', { name: equipment.name })}
                                onClick={() => handleRemoveEquipment(equipment.id)}
                                className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 반출 정보 입력 영역 */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </span>
              {t('create.step2Title')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('create.step2Desc', { required: '*' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              {/* 반출 목적 선택 (필수) */}
              <div className="space-y-2">
                <Label htmlFor="purpose" className="text-sm font-medium">
                  {t('create.purposeLabel')} <span className="text-brand-critical">*</span>
                </Label>
                <Select
                  value={purpose}
                  onValueChange={(value) =>
                    handlePurposeChange(value as UserSelectableCheckoutPurpose)
                  }
                >
                  <SelectTrigger id="purpose" className="h-10">
                    <SelectValue placeholder={t('create.purposePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calibration">
                      <div className="flex flex-col">
                        <span className="font-medium">{t('create.purposeCalibration')}</span>
                        <span className="text-xs text-muted-foreground">
                          {t('create.purposeCalibrationDesc')}
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="repair">
                      <div className="flex flex-col">
                        <span className="font-medium">{t('create.purposeRepair')}</span>
                        <span className="text-xs text-muted-foreground">
                          {t('create.purposeRepairDesc')}
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="rental">
                      <div className="flex flex-col">
                        <span className="font-medium">{t('create.purposeRental')}</span>
                        <span className="text-xs text-muted-foreground">
                          {t('create.purposeRentalDesc')}
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {purpose === CPVal.RENTAL && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {t('create.rentalSiteTeamHint')}
                  </p>
                )}
              </div>

              {/* 사이트/팀 선택 (외부 대여 시에만 표시) */}
              {purpose === CPVal.RENTAL && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site" className="text-sm font-medium">
                      {t('create.lenderSite')} <span className="text-brand-critical">*</span>
                    </Label>
                    <Select value={selectedSite} onValueChange={handleSiteChange}>
                      <SelectTrigger id="site" className="h-10">
                        <SelectValue placeholder={t('create.selectSitePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(siteLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team" className="text-sm font-medium">
                      {t('create.lenderTeam')} <span className="text-brand-critical">*</span>
                    </Label>
                    <Select
                      value={selectedTeamId}
                      onValueChange={handleTeamChange}
                      disabled={!selectedSite}
                    >
                      <SelectTrigger id="team" className="h-10">
                        <SelectValue
                          placeholder={
                            selectedSite
                              ? t('create.selectTeamPlaceholder')
                              : t('create.selectSiteFirst')
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {teamsData?.data?.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 반출지 입력 (필수) */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-sm font-medium">
                  {t('create.destinationLabel')} <span className="text-brand-critical">*</span>
                </Label>
                <Input
                  id="destination"
                  placeholder={t('create.destinationPlaceholder')}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  className="h-10"
                  autoComplete="organization"
                />
              </div>

              {/* 반출 사유 입력 (필수) */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium">
                  {t('create.reasonLabel')} <span className="text-brand-critical">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder={t('create.reasonPlaceholder')}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 연락처 (선택) */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    {t('create.phoneLabel')}
                  </Label>
                  <Input
                    id="phoneNumber"
                    placeholder={t('create.phonePlaceholder')}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-10"
                    type="tel"
                    autoComplete="tel"
                  />
                </div>

                {/* 주소 (선택) */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    {t('create.addressLabel')}
                  </Label>
                  <Input
                    id="address"
                    placeholder={t('create.addressPlaceholder')}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-10"
                    autoComplete="street-address"
                  />
                </div>
              </div>

              {/* 반입 예정일 (필수) */}
              <div className="space-y-2">
                <Label htmlFor="expectedReturnDate" className="text-sm font-medium">
                  {t('create.expectedReturnLabel')} <span className="text-brand-critical">*</span>
                </Label>
                <DatePicker
                  selected={expectedReturnDate}
                  onSelect={(date) => date && setExpectedReturnDate(date)}
                  disabled={(date) => date <= new Date()} // 오늘 이후만 선택 가능
                />
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {t('create.expectedReturnNote')}
                </p>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Separator />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {t('create.approvalRequired')}
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.LIST)}
                  className="flex-1 sm:flex-none"
                  disabled={createCheckoutMutation.isPending}
                >
                  {t('actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  form="checkout-form"
                  disabled={
                    createCheckoutMutation.isPending ||
                    selectedEquipments.length === 0 ||
                    equipmentsError
                  }
                  className="flex-1 sm:flex-none min-w-[120px]"
                >
                  {createCheckoutMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      {t('actions.processing')}
                    </>
                  ) : (
                    t('actions.create')
                  )}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
