'use client';

import { ArrowLeft, Edit, Trash2, FileOutput, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SharedEquipmentBadge } from './SharedEquipmentBadge';
import type { Equipment } from '@/lib/api/equipment-api';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface EquipmentHeaderProps {
  equipment: Equipment;
}

/**
 * 장비 상세 페이지 헤더
 *
 * UL Solutions 브랜딩:
 * - 배경: UL Midnight Blue 그라데이션
 * - 텍스트: 흰색
 * - 상태 뱃지: UL 색상 팔레트
 * - 액션 버튼: 권한별 표시/숨김
 */
export function EquipmentHeader({ equipment }: EquipmentHeaderProps) {
  const router = useRouter();
  const { user, hasRole } = useAuth();

  // 권한 확인
  const canEdit =
    hasRole(['technical_manager', 'lab_manager', 'system_admin']) &&
    !equipment.isShared &&
    equipment.approvalStatus !== 'approved';
  const canDelete =
    hasRole(['lab_manager', 'system_admin']) &&
    !equipment.isShared &&
    equipment.approvalStatus !== 'approved';
  const canCheckout =
    equipment.status === 'available';

  // 상태별 색상 및 라벨
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; label: string }> = {
      available: {
        color: 'text-green-800 dark:text-green-300',
        bg: 'bg-green-100 dark:bg-green-900/30 border-green-300',
        label: '사용 가능',
      },
      in_use: {
        color: 'text-blue-800 dark:text-blue-300',
        bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300',
        label: '사용 중',
      },
      checked_out: {
        color: 'text-ul-midnight dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200',
        label: '반출 중',
      },
      calibration_scheduled: {
        color: 'text-blue-700 dark:text-blue-400',
        bg: 'bg-ul-info/20 dark:bg-blue-900/20 border-blue-200',
        label: '교정 예정',
      },
      calibration_overdue: {
        color: 'text-ul-red dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30 border-red-300',
        label: '교정 기한 초과',
      },
      non_conforming: {
        color: 'text-ul-red dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30 border-red-300',
        label: '부적합',
      },
      spare: {
        color: 'text-gray-700 dark:text-gray-400',
        bg: 'bg-gray-100 dark:bg-gray-800/30 border-gray-300',
        label: '여분',
      },
      retired: {
        color: 'text-gray-600 dark:text-gray-500',
        bg: 'bg-gray-200 dark:bg-gray-800/50 border-gray-400',
        label: '폐기',
      },
    };

    return (
      configs[status] || {
        color: 'text-gray-800',
        bg: 'bg-gray-100 border-gray-300',
        label: status,
      }
    );
  };

  const statusConfig = getStatusConfig(equipment.status || 'available');

  return (
    <div className="bg-gradient-to-r from-ul-midnight via-ul-midnight-dark to-ul-midnight text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
        </div>

        <div className="space-y-6">
          {/* 장비명 및 기본 정보 */}
          <div>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              {/* 왼쪽: 장비명, 모델명, 관리번호 */}
              <div className="space-y-3 flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  {equipment.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-white/80">
                  <span className="text-base">
                    모델: <span className="font-medium text-white">{equipment.modelName}</span>
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-base">
                    관리번호:{' '}
                    <span className="font-mono font-medium text-white">
                      {equipment.managementNumber}
                    </span>
                  </span>
                  {equipment.serialNumber && (
                    <>
                      <span className="text-white/40">•</span>
                      <span className="text-base">
                        S/N: <span className="font-mono font-medium text-white">{equipment.serialNumber}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* 오른쪽: 액션 버튼 */}
              <div className="flex flex-wrap gap-2">
                {canCheckout && (
                  <Link href={`/equipment/${equipment.uuid}/checkout`}>
                    <Button
                      variant="default"
                      className="bg-white text-ul-midnight hover:bg-gray-100 shadow-lg"
                    >
                      <FileOutput className="h-4 w-4 mr-2" />
                      반출 신청
                    </Button>
                  </Link>
                )}
                {canEdit && (
                  <Link href={`/equipment/${equipment.uuid}/edit`}>
                    <Button
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      수정
                    </Button>
                  </Link>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    className="border-red-300/50 text-red-200 hover:bg-red-500/20 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                )}
              </div>
            </div>

            {/* 상태 뱃지 및 공용장비 뱃지 */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Badge
                variant="outline"
                className={cn(
                  'px-3 py-1.5 text-sm font-semibold border-2',
                  statusConfig.bg,
                  statusConfig.color
                )}
              >
                {statusConfig.label}
              </Badge>
              {equipment.isShared && (
                <SharedEquipmentBadge
                  sharedSource={equipment.sharedSource}
                  size="default"
                />
              )}
            </div>
          </div>

          {/* 운영책임자 정보 - 나중에 구현 */}
        </div>
      </div>
    </div>
  );
}
