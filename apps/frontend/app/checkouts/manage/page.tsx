'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, Check, X, RotateCcw, Building, CalendarClock, Clock } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { ko } from 'date-fns/locale';
import checkoutApi, { Checkout, ReturnCheckoutDto } from '@/lib/api/checkout-api';
import { useAuth } from '@/hooks/use-auth';

export default function ManageCheckoutsPage() {
  const router = useRouter();
  const { user } = useAuth(); // ✅ JWT에서 사용자 ID 가져오기
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('pending');
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnNotes, setReturnNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);

  // 반출 목록 조회
  const { data: checkoutsData, isLoading } = useQuery({
    queryKey: ['checkouts', 'manage', currentTab, searchTerm],
    queryFn: async () => {
      const query: any = {
        pageSize: 100,
        search: searchTerm || undefined,
      };

      // 탭에 따라 다른 상태의 반출 목록 조회
      switch (currentTab) {
        case 'pending':
          query.status = 'pending';
          break;
        case 'approved':
          query.status = 'approved';
          break;
        case 'all':
          // 모든 상태 조회 (상태 필터 적용 안함)
          break;
      }

      return checkoutApi.getCheckouts(query);
    },
  });

  // 반출 1차 승인 mutation
  // ✅ 백엔드 API에 맞게 수정: approveFirst 사용, approverId 필수
  const approveFirstMutation = useMutation({
    mutationFn: ({ checkoutId, approverId }: { checkoutId: string; approverId: string }) =>
      checkoutApi.approveFirst(checkoutId, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkouts'] });
      toast({
        title: '반출 1차 승인 완료',
        description: '반출 요청이 1차 승인되었습니다.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: '반출 승인 중 오류 발생',
        description: `오류: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // 반출 최종 승인 mutation
  // ✅ 백엔드 API에 맞게 수정: approveFinal 사용, approverId 필수
  const approveFinalMutation = useMutation({
    mutationFn: ({ checkoutId, approverId }: { checkoutId: string; approverId: string }) =>
      checkoutApi.approveFinal(checkoutId, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkouts'] });
      toast({
        title: '반출 최종 승인 완료',
        description: '반출 요청이 최종 승인되었습니다.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: '반출 승인 중 오류 발생',
        description: `오류: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // 반출 거부 mutation
  // ✅ 백엔드 API에 맞게 수정: approverId 선택 (JWT에서 가져올 수 있음)
  const rejectMutation = useMutation({
    mutationFn: ({ checkoutId, reason }: { checkoutId: string; reason: string }) => {
      const approverId = user?.id;
      return checkoutApi.rejectCheckout(checkoutId, reason, approverId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkouts'] });
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedCheckout(null);
      toast({
        title: '반출 거부 완료',
        description: '반출 요청이 거부되었습니다.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: '반출 거부 중 오류 발생',
        description: `오류: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // 반입 처리 mutation
  const returnMutation = useMutation({
    mutationFn: ({
      checkoutId,
      returnData,
    }: {
      checkoutId: string;
      returnData: ReturnCheckoutDto;
    }) => checkoutApi.returnCheckout(checkoutId, returnData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkouts'] });
      setReturnDialogOpen(false);
      setReturnCondition('good');
      setReturnNotes('');
      setSelectedCheckout(null);
      toast({
        title: '반입 처리 완료',
        description: '장비 반입이 처리되었습니다.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: '반입 처리 중 오류 발생',
        description: `오류: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // 반출 상태에 따른 배지 스타일
  const getCheckoutStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">
            승인 대기중
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-50">
            반출 중
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 hover:bg-red-50">
            거부됨
          </Badge>
        );
      case 'returned':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-50">
            반입됨
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 연체 상태 확인
  const isOverdue = (checkout: Checkout) => {
    if (checkout.status !== 'final_approved' && checkout.status !== 'checked_out') return false;

    const expectedReturnDate = new Date(checkout.expectedReturnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return isAfter(today, expectedReturnDate);
  };

  // 반출 승인 처리
  // ✅ 백엔드 API에 맞게 수정: 목적에 따라 1차/최종 승인 분리
  const handleApprove = (checkout: Checkout) => {
    const approverId = user?.id;
    if (!approverId) {
      toast({
        title: '오류',
        description: '사용자 정보를 찾을 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    // 목적에 따라 다른 승인 처리
    if (checkout.purpose === 'external_rental') {
      // 외부 대여는 2단계 승인 필요
      if (checkout.status === 'pending') {
        // 1차 승인
        approveFirstMutation.mutate({ checkoutId: checkout.id, approverId });
      } else if (checkout.status === 'first_approved') {
        // 최종 승인
        approveFinalMutation.mutate({ checkoutId: checkout.id, approverId });
      }
    } else {
      // 내부 목적(calibration, repair)은 1차 승인으로 완료
      approveFirstMutation.mutate({ checkoutId: checkout.id, approverId });
    }
  };

  // 반출 거부 다이얼로그 열기
  const handleOpenRejectDialog = (checkout: Checkout) => {
    setSelectedCheckout(checkout);
    setRejectDialogOpen(true);
  };

  // 반출 거부 제출
  const handleReject = () => {
    if (!selectedCheckout || !rejectReason.trim()) return;

    rejectMutation.mutate({
      checkoutId: selectedCheckout.id,
      reason: rejectReason.trim(),
    });
  };

  // 반입 처리 다이얼로그 열기
  const handleOpenReturnDialog = (checkout: Checkout) => {
    setSelectedCheckout(checkout);
    setReturnDialogOpen(true);
  };

  // 반입 처리 제출
  const handleReturn = () => {
    if (!selectedCheckout) return;

    returnMutation.mutate({
      checkoutId: selectedCheckout.id,
      returnData: {
        actualReturnDate: new Date().toISOString(),
        returnCondition: returnCondition,
        returnNotes: returnNotes.trim(),
      },
    });
  };

  // 탭 변경 처리
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  // 검색어 변경 처리
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">반출 관리</h1>
        <p className="text-muted-foreground">반출 요청을 승인하고 반입을 처리합니다.</p>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <Tabs defaultValue="pending" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="pending">승인 대기</TabsTrigger>
            <TabsTrigger value="approved">반출 중</TabsTrigger>
            <TabsTrigger value="all">전체 보기</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="장비 또는 사용자 검색"
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
      </div>

      {/* 반출 목록 테이블 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>반출 요청 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>장비</TableHead>
                <TableHead>신청자</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>반출지</TableHead>
                <TableHead>반출일</TableHead>
                <TableHead>반입 예정일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    데이터를 불러오는 중...
                  </TableCell>
                </TableRow>
              ) : checkoutsData?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    표시할 반출 요청이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                checkoutsData?.data?.map((checkout: Checkout) => (
                  <TableRow key={checkout.id} className={isOverdue(checkout) ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">
                      {checkout.equipment && checkout.equipment.length > 0
                        ? `${checkout.equipment[0].name} ${checkout.equipment.length > 1 ? `외 ${checkout.equipment.length - 1}건` : ''}`
                        : '장비 정보 없음'}
                    </TableCell>
                    <TableCell>{checkout.user?.name || '알 수 없는 사용자'}</TableCell>
                    <TableCell>
                      {isOverdue(checkout) ? (
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-900 hover:bg-red-100"
                        >
                          기한 초과
                        </Badge>
                      ) : (
                        getCheckoutStatusBadge(checkout.status)
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-1 text-gray-500" />
                        {checkout.destination || checkout.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      {checkout.checkoutDate
                        ? format(new Date(checkout.checkoutDate), 'yyyy-MM-dd', { locale: ko })
                        : checkout.startDate
                          ? format(new Date(checkout.startDate), 'yyyy-MM-dd', { locale: ko })
                          : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CalendarClock
                          className={`h-4 w-4 mr-1 ${isOverdue(checkout) ? 'text-red-500' : 'text-gray-500'}`}
                        />
                        {format(new Date(checkout.expectedReturnDate), 'yyyy-MM-dd', {
                          locale: ko,
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {checkout.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(checkout)}
                              disabled={
                                approveFirstMutation.isPending || approveFinalMutation.isPending
                              }
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {checkout.purpose === 'external_rental' ? '1차 승인' : '승인'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenRejectDialog(checkout)}
                              disabled={rejectMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              거부
                            </Button>
                          </>
                        )}
                        {checkout.status === 'first_approved' &&
                          checkout.purpose === 'external_rental' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(checkout)}
                              disabled={approveFinalMutation.isPending}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              최종 승인
                            </Button>
                          )}
                        {(checkout.status === 'final_approved' ||
                          checkout.status === 'checked_out') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenReturnDialog(checkout)}
                            disabled={returnMutation.isPending}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            반입
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 반출 거부 다이얼로그 */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>반출 요청 거부</AlertDialogTitle>
            <AlertDialogDescription>
              반출 요청을 거부하시겠습니까? 거부 사유를 입력하세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 my-4">
            <Label htmlFor="rejectReason">거부 사유</Label>
            <Textarea
              id="rejectReason"
              placeholder="반출 요청이 거부된 이유를 입력하세요"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
                setSelectedCheckout(null);
              }}
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectMutation.isPending ? '처리 중...' : '반출 거부'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 반입 처리 다이얼로그 */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>장비 반입 처리</DialogTitle>
            <DialogDescription>장비 반입 상태 및 비고 사항을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="condition">장비 상태</Label>
              <Select value={returnCondition} onValueChange={setReturnCondition}>
                <SelectTrigger id="condition">
                  <SelectValue placeholder="장비 상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">정상</SelectItem>
                  <SelectItem value="damaged">손상됨</SelectItem>
                  <SelectItem value="missing_parts">부품 누락</SelectItem>
                  <SelectItem value="need_maintenance">점검 필요</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="returnNotes">비고 사항</Label>
              <Textarea
                id="returnNotes"
                placeholder="반입된 장비에 대한 특이사항이 있으면 입력하세요"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReturnDialogOpen(false);
                setReturnCondition('good');
                setReturnNotes('');
                setSelectedCheckout(null);
              }}
            >
              취소
            </Button>
            <Button type="button" onClick={handleReturn} disabled={returnMutation.isPending}>
              {returnMutation.isPending ? '처리 중...' : '반입 처리'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
