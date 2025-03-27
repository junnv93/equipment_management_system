"use client";

import { UserIcon, Clock, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { dashboardApi, OverdueLoan as OverdueLoanType } from "@/lib/api";
import { Card } from "@/components/ui/card";

interface OverdueLoan {
  id: string;
  equipmentName: string;
  managementNumber: string;
  borrower: {
    id: string;
    name: string;
    team: string;
  };
  loanDate: string;
  dueDate: string;
  daysOverdue: number;
}

export default function OverdueLoans() {
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await dashboardApi.getOverdueLoans();
        
        // API 응답 데이터를 컴포넌트 형식에 맞게 변환
        const transformedData: OverdueLoan[] = data.map(loan => ({
          id: loan.id,
          equipmentName: loan.equipmentName,
          managementNumber: loan.equipmentId, // ID를 관리 번호로 사용
          borrower: {
            id: loan.borrowerId,
            name: loan.borrowerName,
            team: loan.borrowerTeam || '',
          },
          loanDate: loan.startDate || '',
          dueDate: loan.dueDate,
          daysOverdue: loan.daysOverdue
        }));
        
        setOverdueLoans(transformedData);
        setError(null);
      } catch (err) {
        console.error("연체 대여 데이터를 불러오는 중 오류 발생:", err);
        setError("데이터를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center p-3 border border-gray-200 rounded-md"
          >
            <div className="mr-3 flex-shrink-0">
              <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/6 animate-pulse"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/5 animate-pulse"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch (e) {
      return dateString; // 날짜 형식이 안맞으면 원본 반환
    }
  };

  return (
    <div className="space-y-3">
      {overdueLoans.map((loan) => (
        <div
          key={loan.id}
          className="flex items-center p-3 border border-red-100 bg-red-50 rounded-md"
        >
          <div className="mr-3 flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between">
              <h4 className="font-medium text-sm">{loan.equipmentName}</h4>
              <span className="text-xs text-red-600 font-medium">
                {loan.daysOverdue}일 초과
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <div className="text-gray-500">{loan.managementNumber}</div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatDate(loan.dueDate)}</span>
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <UserIcon className="h-3 w-3 mr-1" />
              <span>
                {loan.borrower.name} {loan.borrower.team ? `(${loan.borrower.team})` : ''}
              </span>
            </div>
          </div>
        </div>
      ))}
      {overdueLoans.length === 0 && (
        <div className="flex justify-center items-center h-24 text-gray-400">
          미반납 장비가 없습니다
        </div>
      )}
    </div>
  );
} 