import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils/date';
import { OverdueCheckout } from '@/lib/api/dashboard-api';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

/**
 * 반납 기한 초과 반출 목록 컴포넌트
 *
 * 대여/교정/수리 등 반출된 장비 중 반납 기한이 초과된 항목을 표시합니다.
 */
interface OverdueCheckoutsListProps {
  data: OverdueCheckout[];
  loading?: boolean;
}

export function OverdueCheckoutsList({ data, loading = false }: OverdueCheckoutsListProps) {
  const router = useRouter();

  // 반출 상세 페이지로 이동
  const handleViewCheckout = (id: string) => {
    router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id));
  };

  // 모든 연체 반출 목록 페이지로 이동
  const handleViewAll = () => {
    router.push(`${FRONTEND_ROUTES.CHECKOUTS.LIST}?status=overdue`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-medium flex items-center">
              반납 기한 초과
              {!loading && data.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {data.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>반출 기한이 지난 장비 목록입니다</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <p>기한이 초과된 반출이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 3).map((checkout) => (
              <div key={checkout.id} className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium line-clamp-1">
                    {checkout.equipment?.name || '알 수 없음'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {checkout.user?.name || '알 수 없음'} ·{' '}
                    {formatDateTime(checkout.expectedReturnDate)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Badge variant="destructive" className="text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {checkout.daysOverdue}일 초과
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-1"
                    onClick={() => handleViewCheckout(checkout.id)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {data.length > 3 && (
              <Button variant="link" size="sm" className="w-full mt-2" onClick={handleViewAll}>
                모든 기한 초과 반출 보기 ({data.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * @deprecated Use OverdueCheckoutsList instead
 */
export const OverdueRentalsList = OverdueCheckoutsList;
