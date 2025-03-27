import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/utils/date"
import { OverdueRental } from "@/lib/api/dashboard-api"
import { AlertCircle, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface OverdueRentalsListProps {
  data: OverdueRental[]
  loading?: boolean
}

export function OverdueRentalsList({ data, loading = false }: OverdueRentalsListProps) {
  const router = useRouter()

  // 대여 상세 페이지로 이동
  const handleViewRental = (id: string) => {
    router.push(`/rentals/${id}`)
  }

  // 모든 연체 대여 목록 페이지로 이동
  const handleViewAll = () => {
    router.push("/rentals?status=overdue")
  }

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
            <CardDescription>
              대여 기한이 지난 장비 목록입니다
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <p>기한이 초과된 대여가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 3).map((rental) => (
              <div key={rental.id} className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium line-clamp-1">{rental.equipmentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {rental.userName} · {formatDateTime(rental.expectedReturnDate)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Badge variant="destructive" className="text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {rental.daysOverdue}일 초과
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-1"
                    onClick={() => handleViewRental(rental.id)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {data.length > 3 && (
              <Button
                variant="link"
                size="sm"
                className="w-full mt-2"
                onClick={handleViewAll}
              >
                모든 기한 초과 대여 보기 ({data.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 