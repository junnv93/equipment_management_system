'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
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
import { Search, Plus, Trash2, Ban, Package, FileText, AlertCircle } from 'lucide-react';
import { addDays } from 'date-fns';
import equipmentApi, { Equipment } from '@/lib/api/equipment-api';
import checkoutApi, { CreateCheckoutDto } from '@/lib/api/checkout-api';
import teamsApi, { SITE_CONFIG, type Site } from '@/lib/api/teams-api';
import { SITE_LABELS } from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { queryKeys } from '@/lib/api/query-config';
import { useAuth } from '@/hooks/use-auth';
import { getEquipmentStatusStyle } from '@/lib/constants/equipment-status-styles';
import {
  getEquipmentSelectability,
  filterVisibleEquipment,
} from '@/lib/utils/checkout-selectability';

export default function CreateCheckoutContent() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // 폼 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [destination, setDestination] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [purpose, setPurpose] = useState<'calibration' | 'repair' | 'rental'>('calibration');
  const [reason, setReason] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date>(addDays(new Date(), 7));

  // 외부 대여 시 사이트/팀 선택 상태
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // 사용자 소속 정보
  const userTeamId = user?.teamId;
  const userSite = user?.site;

  // 외부 대여 시 선택된 사이트의 팀 목록 조회
  const { data: teamsData } = useQuery({
    queryKey: queryKeys.teams.bySite(selectedSite),
    queryFn: () => teamsApi.getTeams({ site: selectedSite as Site, pageSize: 50 }),
    enabled: purpose === 'rental' && !!selectedSite,
  });

  // 장비 목록 조회 - 상태 필터 없이 전체 조회 (목적별 선택 가능 여부는 클라이언트에서 판단)
  const equipmentTeamId = purpose === 'rental' ? selectedTeamId : userTeamId;
  const { data: equipmentsData, isLoading: equipmentsLoading } = useQuery({
    queryKey: queryKeys.equipment.checkoutSearch(searchTerm, purpose, equipmentTeamId),
    queryFn: async () => {
      const response = await equipmentApi.getEquipmentList({
        search: searchTerm || undefined,
        teamId: equipmentTeamId || undefined,
        pageSize: 100,
      });
      return response;
    },
    enabled: purpose !== 'rental' || !!selectedTeamId,
  });

  // 운영 종료된 장비(retired, disposed 등) 필터링
  const visibleEquipments = useMemo(
    () => filterVisibleEquipment(equipmentsData?.data ?? []),
    [equipmentsData?.data]
  );

  // 반출 요청 제출 mutation
  const createCheckoutMutation = useMutation({
    mutationFn: (data: CreateCheckoutDto) => checkoutApi.createCheckout(data),
    onSuccess: () => {
      toast({
        title: '반출 신청 완료',
        description: '반출 신청이 성공적으로 접수되었습니다.',
        variant: 'default',
      });
      router.push(FRONTEND_ROUTES.CHECKOUTS.LIST);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.all });
    },
    onError: (error: unknown) => {
      toast({
        title: '반출 신청 실패',
        description: getErrorMessage(error, '반출 신청 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  // 목적 변경 시 장비 및 사이트/팀 초기화
  const handlePurposeChange = (value: 'calibration' | 'repair' | 'rental') => {
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
        title: '장비 제거됨',
        description: `${equipment.name}이(가) 선택 목록에서 제거되었습니다.`,
        variant: 'default',
      });
    } else {
      // 선택되지 않은 장비 → 추가
      setSelectedEquipments([...selectedEquipments, equipment]);
      toast({
        title: '장비 선택됨',
        description: `${equipment.name}이(가) 선택되었습니다.`,
        variant: 'default',
      });
    }
  };

  // 선택 불가 장비 클릭 시 안내 처리
  const handleBlockedEquipmentClick = (equipment: Equipment, reason: string) => {
    toast({
      title: '장비 선택 불가',
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
        title: '장비를 선택해주세요',
        description: '최소 1개 이상의 장비를 선택해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!destination) {
      toast({
        title: '반출지를 입력해주세요',
        description: '장비가 반출될 장소를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!reason || !reason.trim()) {
      toast({
        title: '반출 사유를 입력해주세요',
        description: '반출 사유는 필수입니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!purpose) {
      toast({
        title: '반출 목적을 선택해주세요',
        description: '장비 반출 목적을 선택해주세요.',
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
      ...(purpose === 'rental' && {
        lenderTeamId: selectedTeamId || undefined,
        lenderSiteId: selectedSite || undefined,
      }),
    };

    // 반출 신청 제출
    createCheckoutMutation.mutate(checkoutData);
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">장비 반출 신청</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            사용할 장비를 선택하고 반출 정보를 입력하세요.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.LIST)}
          className="w-full sm:w-auto"
        >
          반출 목록으로 돌아가기
        </Button>
      </div>

      {/* 안내 메시지 */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>반출 신청 안내</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>교정/수리 목적: 본인 팀의 장비만 선택 가능</li>
            <li>외부 대여 목적: 대여할 팀의 사이트와 팀을 선택 후 장비 선택</li>
            <li>반출 신청 후 관리자의 승인이 필요합니다</li>
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
              장비 선택
            </CardTitle>
            <CardDescription className="text-sm">
              반출할 장비를 검색하여 선택하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {/* 목적 선택 (장비 목록 필터링) */}
              {purpose === 'rental' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                    외부 대여: 아래에서 사이트와 팀을 선택하면 장비 목록이 표시됩니다
                  </p>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="장비명 또는 관리번호로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                  disabled={purpose === 'rental' && !selectedTeamId}
                />
              </div>

              <div className="border rounded-md max-h-[600px] overflow-y-auto">
                <TooltipProvider>
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                      <TableRow>
                        <TableHead>장비 정보</TableHead>
                        <TableHead className="w-32">상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipmentsLoading ? (
                        <TableRow>
                          <TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                              <span>장비 목록을 불러오는 중...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : visibleEquipments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
                            {searchTerm ? (
                              <div>
                                <p className="font-medium">검색 결과가 없습니다.</p>
                                <p className="text-sm mt-1">다른 검색어로 시도해보세요.</p>
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium">장비가 없습니다.</p>
                                {purpose === 'rental' && !selectedTeamId && (
                                  <p className="text-sm mt-1">
                                    팀을 선택하면 장비 목록이 표시됩니다.
                                  </p>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        visibleEquipments.map((equipment: Equipment) => {
                          const statusStyle = getEquipmentStatusStyle(
                            equipment.status,
                            equipment.nextCalibrationDate
                          );
                          const selectability = getEquipmentSelectability(equipment, purpose);
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
                                    selectability.reason || '선택할 수 없는 장비입니다'
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
                                  ? `${equipment.name} ${isAlreadySelected ? '선택됨' : '선택하기'}`
                                  : `${equipment.name} 선택 불가: ${selectability.reason}`
                              }
                              className={`
                                transition-all duration-200
                                ${
                                  selectability.selectable
                                    ? isAlreadySelected
                                      ? 'bg-primary/5 border-l-4 border-l-primary shadow-sm'
                                      : 'cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                                    : 'opacity-50 cursor-not-allowed'
                                }
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
                                          선택됨
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground font-mono">
                                      {equipment.managementNumber}
                                    </p>
                                    {selectability.selectable && selectability.warningMessage && (
                                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 leading-tight flex items-start gap-1">
                                        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                        {selectability.warningMessage}
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
                                        <p className="text-sm">{selectability.reason}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge
                                  className={`${statusStyle.className} text-sm whitespace-nowrap`}
                                >
                                  {statusStyle.label}
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
                    선택된 장비{' '}
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
                      전체 해제
                    </Button>
                  )}
                </div>

                {selectedEquipments.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
                    <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">선택된 장비가 없습니다</p>
                    <p className="text-xs mt-1">
                      위 목록에서 장비를 클릭하거나 Enter 키를 눌러주세요
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {selectedEquipments.map((equipment) => {
                      const statusStyle = getEquipmentStatusStyle(
                        equipment.status,
                        equipment.nextCalibrationDate
                      );

                      return (
                        <Card
                          key={equipment.id}
                          className="relative border-l-4 border-l-primary overflow-hidden hover:shadow-md transition-shadow"
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
                                    {statusStyle.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {equipment.managementNumber}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveEquipment(equipment.id)}
                                className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                                aria-label={`${equipment.name} 제거`}
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
              반출 정보 입력
            </CardTitle>
            <CardDescription className="text-sm">
              반출에 필요한 정보를 입력하세요. <span className="text-red-500">*</span> 표시는 필수
              항목입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              {/* 반출 목적 선택 (필수) */}
              <div className="space-y-2">
                <Label htmlFor="purpose" className="text-sm font-medium">
                  반출 목적 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={purpose}
                  onValueChange={(value) =>
                    handlePurposeChange(value as 'calibration' | 'repair' | 'rental')
                  }
                >
                  <SelectTrigger id="purpose" className="h-10">
                    <SelectValue placeholder="반출 목적을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calibration">
                      <div className="flex flex-col">
                        <span className="font-medium">교정</span>
                        <span className="text-xs text-muted-foreground">장비 교정 목적</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="repair">
                      <div className="flex flex-col">
                        <span className="font-medium">수리</span>
                        <span className="text-xs text-muted-foreground">장비 수리/점검 목적</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="rental">
                      <div className="flex flex-col">
                        <span className="font-medium">외부 대여</span>
                        <span className="text-xs text-muted-foreground">다른 팀에 장비 대여</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {purpose === 'rental' && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    외부 대여 시 대여받을 팀의 사이트와 팀을 선택해주세요
                  </p>
                )}
              </div>

              {/* 사이트/팀 선택 (외부 대여 시에만 표시) */}
              {purpose === 'rental' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site" className="text-sm font-medium">
                      대여받을 사이트 <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedSite} onValueChange={handleSiteChange}>
                      <SelectTrigger id="site" className="h-10">
                        <SelectValue placeholder="사이트를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SITE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team" className="text-sm font-medium">
                      대여받을 팀 <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedTeamId}
                      onValueChange={handleTeamChange}
                      disabled={!selectedSite}
                    >
                      <SelectTrigger id="team" className="h-10">
                        <SelectValue
                          placeholder={
                            selectedSite ? '팀을 선택하세요' : '사이트를 먼저 선택하세요'
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
                  반출 장소 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="destination"
                  placeholder="반출 장소를 입력하세요 (예: 교정기관 ABC)"
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
                  반출 사유 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="반출 사유를 상세히 입력하세요 (예: 교정 기한 도래로 인한 외부 교정기관 의뢰)"
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
                    연락처
                  </Label>
                  <Input
                    id="phoneNumber"
                    placeholder="반출 기간 동안 연락 가능한 번호"
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
                    주소
                  </Label>
                  <Input
                    id="address"
                    placeholder="반출 장소의 상세 주소"
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
                  반입 예정일 <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  selected={expectedReturnDate}
                  onSelect={(date) => date && setExpectedReturnDate(date)}
                  disabled={(date) => date <= new Date()} // 오늘 이후만 선택 가능
                />
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  반출일은 반출 시작 시점에 자동으로 설정됩니다.
                </p>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Separator />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                신청 후 관리자 승인이 필요합니다
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.LIST)}
                  className="flex-1 sm:flex-none"
                  disabled={createCheckoutMutation.isPending}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  form="checkout-form"
                  disabled={createCheckoutMutation.isPending || selectedEquipments.length === 0}
                  className="flex-1 sm:flex-none min-w-[120px]"
                >
                  {createCheckoutMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      처리 중...
                    </>
                  ) : (
                    '반출 신청'
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
