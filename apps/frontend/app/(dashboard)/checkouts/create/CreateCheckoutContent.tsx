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
import { Search, Plus, Trash2, Ban } from 'lucide-react';
import { addDays } from 'date-fns';
import equipmentApi, { Equipment } from '@/lib/api/equipment-api';
import checkoutApi, { CreateCheckoutDto } from '@/lib/api/checkout-api';
import teamsApi, { SITE_CONFIG, type Site } from '@/lib/api/teams-api';
import { SITE_LABELS } from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
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
    queryKey: ['teams', selectedSite],
    queryFn: () => teamsApi.getTeams({ site: selectedSite as Site, pageSize: 50 }),
    enabled: purpose === 'rental' && !!selectedSite,
  });

  // 장비 목록 조회 - 상태 필터 없이 전체 조회 (목적별 선택 가능 여부는 클라이언트에서 판단)
  const equipmentTeamId = purpose === 'rental' ? selectedTeamId : userTeamId;
  const { data: equipmentsData, isLoading: equipmentsLoading } = useQuery({
    queryKey: ['equipments', 'checkout-all', searchTerm, purpose, equipmentTeamId],
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
      queryClient.invalidateQueries({ queryKey: ['checkouts'] });
      router.push(FRONTEND_ROUTES.CHECKOUTS.LIST);
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

  // 장비 선택 처리
  const handleAddEquipment = (equipment: Equipment) => {
    if (!selectedEquipments.some((e) => e.id === equipment.id)) {
      setSelectedEquipments([...selectedEquipments, equipment]);
    }
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
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">장비 반출 신청</h1>
          <p className="text-muted-foreground">사용할 장비를 선택하고 반출 정보를 입력하세요.</p>
        </div>
        <Button variant="outline" onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.LIST)}>
          반출 목록으로 돌아가기
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 장비 선택 영역 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">장비 선택</CardTitle>
            <CardDescription>반출할 장비를 검색하여 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="장비명 또는 관리번호로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>장비명</TableHead>
                        <TableHead>관리번호</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="w-16">선택</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipmentsLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            장비 목록을 불러오는 중...
                          </TableCell>
                        </TableRow>
                      ) : visibleEquipments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            장비가 없습니다.
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
                              className={!selectability.selectable ? 'opacity-50' : undefined}
                            >
                              <TableCell className="font-medium">{equipment.name}</TableCell>
                              <TableCell>{equipment.managementNumber}</TableCell>
                              <TableCell>
                                <Badge
                                  className={`${statusStyle.className} text-[10px] px-1.5 py-0`}
                                >
                                  {statusStyle.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {selectability.selectable ? (
                                  <div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAddEquipment(equipment)}
                                      disabled={isAlreadySelected}
                                      data-testid={`add-equipment-${equipment.id}`}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                    {selectability.warningMessage && (
                                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                        {selectability.warningMessage}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled
                                          data-testid={`add-equipment-${equipment.id}`}
                                        >
                                          <Ban className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{selectability.reason}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              </div>

              <div>
                <h3 className="font-medium mb-2">선택된 장비 ({selectedEquipments.length})</h3>
                {selectedEquipments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">선택된 장비가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEquipments.map((equipment) => (
                      <div
                        key={equipment.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <div>
                          <p className="font-medium">{equipment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {equipment.managementNumber}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEquipment(equipment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 반출 정보 입력 영역 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">반출 정보 입력</CardTitle>
            <CardDescription>반출에 필요한 정보를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              {/* 반출 목적 선택 (필수) */}
              <div className="space-y-2">
                <Label htmlFor="purpose">
                  반출 목적 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={purpose}
                  onValueChange={(value) =>
                    handlePurposeChange(value as 'calibration' | 'repair' | 'rental')
                  }
                >
                  <SelectTrigger id="purpose">
                    <SelectValue placeholder="반출 목적을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calibration">교정</SelectItem>
                    <SelectItem value="repair">수리</SelectItem>
                    <SelectItem value="rental">외부 대여</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 사이트/팀 선택 (목적별 분기) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site">사이트</Label>
                  {purpose === 'rental' ? (
                    <Select value={selectedSite} onValueChange={handleSiteChange}>
                      <SelectTrigger id="site">
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
                  ) : (
                    <Input
                      id="site"
                      value={
                        userSite
                          ? SITE_LABELS[userSite as keyof typeof SITE_LABELS] || userSite
                          : ''
                      }
                      disabled
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team">팀</Label>
                  {purpose === 'rental' ? (
                    <Select
                      value={selectedTeamId}
                      onValueChange={handleTeamChange}
                      disabled={!selectedSite}
                    >
                      <SelectTrigger id="team">
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
                  ) : (
                    <Input id="team" value="소속 팀 (자동)" disabled />
                  )}
                </div>
              </div>

              {/* 반출지 입력 (필수) */}
              <div className="space-y-2">
                <Label htmlFor="destination">
                  반출 장소 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="destination"
                  placeholder="반출 장소를 입력하세요 (예: 교정기관 ABC)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>

              {/* ✅ 반출 사유 입력 (필수) */}
              <div className="space-y-2">
                <Label htmlFor="reason">
                  반출 사유 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="반출 사유를 상세히 입력하세요"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ✅ 연락처 (선택) */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">연락처</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="반출 기간 동안 연락 가능한 번호"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                {/* ✅ 주소 (선택) */}
                <div className="space-y-2">
                  <Label htmlFor="address">주소</Label>
                  <Input
                    id="address"
                    placeholder="반출 장소의 상세 주소"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* ✅ 반입 예정일 (필수) - startDate는 백엔드에서 자동 설정 */}
              <div className="space-y-2">
                <Label htmlFor="expectedReturnDate">
                  반입 예정일 <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  selected={expectedReturnDate}
                  onSelect={(date) => date && setExpectedReturnDate(date)}
                  disabled={(date) => date <= new Date()} // 오늘 이후만 선택 가능
                />
                <p className="text-xs text-muted-foreground">
                  반출일은 반출 시작 시점에 자동으로 설정됩니다.
                </p>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.LIST)}
            >
              취소
            </Button>
            <Button
              type="submit"
              form="checkout-form"
              disabled={createCheckoutMutation.isPending || selectedEquipments.length === 0}
            >
              {createCheckoutMutation.isPending ? '처리 중...' : '반출 신청'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
