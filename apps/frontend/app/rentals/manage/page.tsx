'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Search, CheckCircle, XCircle, ArrowLeftRight, CalendarX } from 'lucide-react';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import rentalApi, { Rental } from '@/lib/api/rental-api';
import equipmentApi from '@/lib/api/equipment-api';
import { useAuth } from '@/hooks/use-auth';

export default function ManageRentalsPage() {
  const router = useRouter();
  const { user } = useAuth(); // ✅ JWT에서 사용자 ID 가져오기
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);

  // 렌탈 목록 쿼리
  const { data: rentals, isLoading } = useQuery({
    queryKey: ['rentals', currentTab, searchTerm],
    queryFn: async () => {
      let status: string | undefined;

      switch (currentTab) {
        case 'pending':
          status = 'pending';
          break;
        case 'approved':
          status = 'approved';
          break;
        case 'rejected':
          status = 'rejected';
          break;
        case 'returned':
          status = 'returned';
          break;
        default:
          status = undefined;
      }

      return rentalApi.getRentals({
        status,
        search: searchTerm || undefined,
        pageSize: 100,
      });
    },
  });

  // 대여 승인 뮤테이션
  // ✅ 백엔드 API에 맞게 수정: approverId 필수
  const approveRentalMutation = useMutation({
    mutationFn: (rentalId: string) => {
      const approverId = user?.id;
      if (!approverId) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }
      return rentalApi.approveRental(rentalId, approverId);
    },
    onSuccess: () => {
      toast({
        title: '대여 승인 완료',
        description: '대여 요청이 성공적으로 승인되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
    },
    onError: (error) => {
      toast({
        title: '대여 승인 실패',
        description: '대여 승인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  // 대여 거절 뮤테이션
  // ✅ 백엔드 API에 맞게 수정: approverId 선택 (JWT에서 가져올 수 있음)
  const rejectRentalMutation = useMutation({
    mutationFn: ({ rentalId, reason }: { rentalId: string; reason: string }) => {
      const approverId = user?.id;
      return rentalApi.rejectRental(rentalId, reason, approverId);
    },
    onSuccess: () => {
      toast({
        title: '대여 거절 완료',
        description: '대여 요청이 거절되었습니다.',
      });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
    },
    onError: (error) => {
      toast({
        title: '대여 거절 실패',
        description: '대여 거절 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  // 반납 처리 뮤테이션
  // ✅ 백엔드 API에 맞게 수정: completeRental 사용
  const returnRentalMutation = useMutation({
    mutationFn: ({ rentalId }: { rentalId: string; notes?: string }) =>
      rentalApi.completeRental(rentalId),
    onSuccess: () => {
      toast({
        title: '반납 처리 완료',
        description: '대여 장비가 성공적으로 반납 처리되었습니다.',
      });
      setIsReturnDialogOpen(false);
      setReturnNotes('');
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
    },
    onError: (error) => {
      toast({
        title: '반납 처리 실패',
        description: '반납 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  // 렌탈 상태에 따른 배지 색상과 텍스트
  const getRentalStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          text: '승인 대기',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        };
      case 'approved':
        return {
          text: '대여 중',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };
      case 'rejected':
        return {
          text: '거절됨',
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
      case 'returned':
        return {
          text: '반납 완료',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        };
      default:
        return {
          text: '알 수 없음',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        };
    }
  };

  // 대여 상태에 따른 레이블 반환
  const getOverdueStatus = (rental: Rental) => {
    const today = new Date();
    const returnDate = parseISO(rental.expectedReturnDate);

    if (rental.status === 'returned') {
      return null;
    }

    if (rental.status === 'approved' && isAfter(today, returnDate)) {
      return {
        text: '반납 기한 초과',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      };
    }

    return null;
  };

  // 대여 항목 필터링
  // ✅ 중첩 객체 구조 사용: equipment?.name, user?.name 등
  const getFilteredRentals = () => {
    if (!rentals?.data) return [];

    return rentals.data.filter((rental) => {
      // 검색어 필터링
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const hasMatch =
          rental.equipment?.name?.toLowerCase().includes(searchLower) ||
          false ||
          rental.user?.name?.toLowerCase().includes(searchLower) ||
          false ||
          rental.equipment?.managementNumber?.toLowerCase().includes(searchLower) ||
          false;

        if (!hasMatch) return false;
      }

      return true;
    });
  };

  // 승인 핸들러
  const handleApproveRental = (rentalId: string) => {
    approveRentalMutation.mutate(rentalId);
  };

  // 거절 다이얼로그 열기
  const openRejectDialog = (rental: Rental) => {
    setSelectedRental(rental);
    setIsRejectDialogOpen(true);
  };

  // 거절 처리 핸들러
  const handleRejectRental = () => {
    if (!selectedRental || !rejectionReason.trim()) return;

    rejectRentalMutation.mutate({
      rentalId: selectedRental.id,
      reason: rejectionReason.trim(),
    });
  };

  // 반납 다이얼로그 열기
  const openReturnDialog = (rental: Rental) => {
    setSelectedRental(rental);
    setIsReturnDialogOpen(true);
  };

  // 반납 처리 핸들러
  const handleReturnRental = () => {
    if (!selectedRental) return;

    returnRentalMutation.mutate({
      rentalId: selectedRental.id,
      notes: returnNotes.trim() || undefined,
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">대여 관리</h1>
        <p className="text-muted-foreground">장비 대여 요청을 승인하고 대여 상태를 관리합니다.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pt-6 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>대여 요청 목록</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-60">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="장비명, 사용자명 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button onClick={() => router.push('/rentals/create')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  대여 신청
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="pending"
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="pending">승인 대기</TabsTrigger>
                <TabsTrigger value="approved">대여 중</TabsTrigger>
                <TabsTrigger value="rejected">거절됨</TabsTrigger>
                <TabsTrigger value="returned">반납 완료</TabsTrigger>
              </TabsList>

              <TabsContent value={currentTab} className="mt-0">
                {isLoading ? (
                  <div className="text-center py-8">대여 요청 목록을 불러오는 중...</div>
                ) : getFilteredRentals().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? '검색 결과가 없습니다.' : '대여 요청이 없습니다.'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>장비명</TableHead>
                        <TableHead>신청자</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>대여일</TableHead>
                        <TableHead>반납 예정일</TableHead>
                        <TableHead>신청일</TableHead>
                        <TableHead className="text-right">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredRentals().map((rental) => {
                        const statusBadge = getRentalStatusBadge(rental.status);
                        const overdueStatus = getOverdueStatus(rental);

                        return (
                          <TableRow key={rental.id}>
                            <TableCell className="font-medium">
                              {rental.equipment?.name || '알 수 없음'}
                              <div className="text-sm text-muted-foreground">
                                관리번호: {rental.equipment?.managementNumber || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>{rental.user?.name || '알 수 없음'}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`px-2 py-1 rounded text-xs inline-flex items-center w-fit ${statusBadge.color}`}
                                >
                                  {statusBadge.text}
                                </span>
                                {overdueStatus && (
                                  <span
                                    className={`px-2 py-1 rounded text-xs inline-flex items-center w-fit ${overdueStatus.color}`}
                                  >
                                    {overdueStatus.text}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {rental.startDate
                                ? format(parseISO(rental.startDate), 'yyyy-MM-dd', { locale: ko })
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {rental.expectedReturnDate
                                ? format(parseISO(rental.expectedReturnDate), 'yyyy-MM-dd', {
                                    locale: ko,
                                  })
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {rental.requestDate
                                ? format(parseISO(rental.requestDate), 'yyyy-MM-dd', { locale: ko })
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {rental.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleApproveRental(rental.id)}
                                      className="h-8 px-2 text-green-600"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" /> 승인
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openRejectDialog(rental)}
                                      className="h-8 px-2 text-red-600"
                                    >
                                      <XCircle className="h-4 w-4 mr-1" /> 거절
                                    </Button>
                                  </>
                                )}
                                {rental.status === 'approved' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openReturnDialog(rental)}
                                    className="h-8 px-2"
                                  >
                                    <ArrowLeftRight className="h-4 w-4 mr-1" /> 반납 처리
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 거절 사유 입력 다이얼로그 */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>대여 요청 거절</AlertDialogTitle>
            <AlertDialogDescription>
              다음 대여 요청을 거절하려고 합니다:
              <div className="mt-2 p-3 bg-muted rounded">
                <div>
                  <strong>장비:</strong> {selectedRental?.equipment?.name || '알 수 없음'}
                </div>
                <div>
                  <strong>신청자:</strong> {selectedRental?.user?.name || '알 수 없음'}
                </div>
                <div>
                  <strong>대여 기간:</strong>{' '}
                  {selectedRental?.startDate && selectedRental?.expectedReturnDate
                    ? `${format(parseISO(selectedRental.startDate), 'yyyy-MM-dd')} ~ ${format(parseISO(selectedRental.expectedReturnDate), 'yyyy-MM-dd')}`
                    : '정보 없음'}
                </div>
              </div>
              <div className="mt-4 mb-2">거절 사유를 입력해주세요:</div>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="거절 사유를 입력하세요"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectRental}
              disabled={!rejectionReason.trim() || rejectRentalMutation.isPending}
            >
              {rejectRentalMutation.isPending ? '처리 중...' : '확인'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 반납 처리 다이얼로그 */}
      <AlertDialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>장비 반납 처리</AlertDialogTitle>
            <AlertDialogDescription>
              다음 장비의 반납을 처리하려고 합니다:
              <div className="mt-2 p-3 bg-muted rounded">
                <div>
                  <strong>장비:</strong> {selectedRental?.equipment?.name || '알 수 없음'}
                </div>
                <div>
                  <strong>사용자:</strong> {selectedRental?.user?.name || '알 수 없음'}
                </div>
                <div>
                  <strong>대여 기간:</strong>{' '}
                  {selectedRental?.startDate && selectedRental?.expectedReturnDate
                    ? `${format(parseISO(selectedRental.startDate), 'yyyy-MM-dd')} ~ ${format(parseISO(selectedRental.expectedReturnDate), 'yyyy-MM-dd')}`
                    : '정보 없음'}
                </div>
              </div>
              <div className="mt-4 mb-2">반납 시 참고사항을 입력해주세요 (선택사항):</div>
              <Textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="반납 상태, 특이사항 등을 입력하세요"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReturnRental}
              disabled={returnRentalMutation.isPending}
            >
              {returnRentalMutation.isPending ? '처리 중...' : '반납 완료'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
