'use client';

import { useMemo } from 'react';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileOutput,
  Package,
  CheckCircle,
  Play,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Archive,
  Ban,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SharedEquipmentBadge } from './SharedEquipmentBadge';
import type { Equipment } from '@/lib/api/equipment-api';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { shouldDisplayCalibrationStatus } from '@/lib/constants/equipment-status-styles';

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
  const { hasRole } = useAuth();

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(equipment.id);

  /**
   * 권한 확인 (UL-QP-18 기준)
   *
   * 수정 권한:
   * - 모든 역할이 장비 수정 요청 가능 (시험실무자는 승인 필요)
   * - 공용장비(isShared)만 수정 불가
   * - 폐기(retired) 상태 장비는 수정 불가
   *
   * 삭제 권한:
   * - lab_manager, system_admin만 삭제 가능
   * - 공용장비(isShared)는 삭제 불가
   * - 승인 전(pending_approval) 또는 반려(rejected) 상태만 삭제 가능
   */
  const canEdit =
    !equipment.isShared &&
    equipment.status !== 'retired';
  const canDelete =
    hasRole(['lab_manager', 'system_admin']) &&
    !equipment.isShared &&
    (equipment.approvalStatus === 'pending_approval' || equipment.approvalStatus === 'rejected');
  /**
   * 반출 가능 상태 확인
   *
   * UL-QP-18 기준:
   * - 반출 중(checked_out), 폐기(retired), 사용 중(in_use)인 장비는 반출 불가
   * - 부적합(non_conforming), 교정기한초과(calibration_overdue)도 교정/수리 목적 반출 가능
   */
  const STATUS_NOT_ALLOWED_FOR_CHECKOUT = ['checked_out', 'retired', 'in_use'];
  const currentStatus = equipment.status || 'available';
  const canCheckout = !STATUS_NOT_ALLOWED_FOR_CHECKOUT.includes(currentStatus);

  /**
   * 교정 상태 계산 (동적)
   *
   * 기본 상태(가용성)와 별도로 교정 상태를 계산하여 복합 상태 표현 가능
   * - 폐기(retired) 장비는 교정 상태 표시 안함
   * - 부적합, 여분 등 다른 상태에서도 교정 상태 표시 가능
   */
  const calibrationStatus = useMemo(() => {
    // 교정 상태 표시가 의미 없는 장비 상태 체크 (SSOT: equipment-status-styles.ts)
    if (!shouldDisplayCalibrationStatus(equipment.status)) {
      return null;
    }

    // 교정 불필요 장비
    if (!equipment.calibrationRequired || equipment.calibrationMethod === 'not_applicable') {
      return null;
    }

    const nextCalibrationDate = equipment.nextCalibrationDate
      ? new Date(equipment.nextCalibrationDate)
      : null;

    if (!nextCalibrationDate) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextCalibrationDate.setHours(0, 0, 0, 0);

    const diffTime = nextCalibrationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // 교정 기한 초과
      return {
        type: 'overdue' as const,
        days: Math.abs(diffDays),
        label: `교정 기한 초과 (${Math.abs(diffDays)}일)`,
        color: 'text-red-100',
        bg: 'bg-red-600/90 border-red-400',
        icon: AlertCircle,
      };
    } else if (diffDays <= 30) {
      // 30일 이내 교정 만료
      return {
        type: 'upcoming' as const,
        days: diffDays,
        label: diffDays === 0 ? '오늘 교정 만료' : `${diffDays}일 후 교정 만료`,
        color: diffDays <= 7 ? 'text-orange-100' : 'text-yellow-100',
        bg: diffDays <= 7 ? 'bg-orange-500/90 border-orange-400' : 'bg-yellow-600/90 border-yellow-400',
        icon: diffDays <= 7 ? AlertTriangle : Calendar,
      };
    }

    // 30일 초과 - 정상
    return null;
  }, [equipment.status, equipment.calibrationRequired, equipment.calibrationMethod, equipment.nextCalibrationDate]);

  /**
   * 기본 상태 설정 (가용성 기준)
   *
   * calibration_scheduled, calibration_overdue는 별도 배지로 표시하므로
   * 기본 상태로는 available로 처리
   */
  const getStatusConfig = (status: string) => {
    // calibration_scheduled는 available로 처리 (교정 상태는 별도 배지)
    const normalizedStatus = status === 'calibration_scheduled' ? 'available' : status;
    // calibration_overdue도 available로 처리 (교정 상태는 별도 배지)
    const finalStatus = normalizedStatus === 'calibration_overdue' ? 'available' : normalizedStatus;

    const configs: Record<
      string,
      {
        color: string;
        bg: string;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      available: {
        color: 'text-green-800 dark:text-green-300',
        bg: 'bg-green-100 dark:bg-green-900/30 border-green-500',
        label: '사용 가능',
        icon: CheckCircle,
      },
      in_use: {
        color: 'text-blue-800 dark:text-blue-300',
        bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-500',
        label: '사용 중',
        icon: Play,
      },
      checked_out: {
        color: 'text-ul-midnight dark:text-blue-300',
        bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-400',
        label: '반출 중',
        icon: FileOutput,
      },
      non_conforming: {
        color: 'text-red-700 dark:text-red-300',
        bg: 'bg-red-100 dark:bg-red-900/30 border-red-500',
        label: '부적합',
        icon: XCircle,
      },
      spare: {
        color: 'text-gray-700 dark:text-gray-300',
        bg: 'bg-gray-100 dark:bg-gray-800/30 border-gray-400',
        label: '여분',
        icon: Archive,
      },
      retired: {
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-200 dark:bg-gray-800/50 border-gray-500',
        label: '폐기',
        icon: Ban,
      },
    };

    return (
      configs[finalStatus] || {
        color: 'text-gray-800 dark:text-gray-300',
        bg: 'bg-gray-100 dark:bg-gray-800 border-gray-400',
        label: status,
        icon: Package,
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

              {/* 오른쪽: 액션 버튼 - 시각적 계층구조 준수 */}
              <div className="flex flex-wrap gap-3">
                {canCheckout && (
                  <Link href={`/equipment/${equipmentId}/checkout`}>
                    <Button
                      variant="default"
                      className="bg-white text-ul-midnight hover:bg-gray-100 shadow-lg font-semibold
                        transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      aria-label="반출 신청하기"
                    >
                      <FileOutput className="h-4 w-4 mr-2" aria-hidden="true" />
                      반출 신청
                    </Button>
                  </Link>
                )}
                {canEdit && (
                  <Link href={`/equipment/${equipmentId}/edit`}>
                    <Button
                      variant="outline"
                      className="bg-white/10 border-white/60 text-white hover:bg-white/20 hover:border-white
                        font-medium shadow-md backdrop-blur-sm
                        transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      aria-label="장비 정보 수정하기"
                    >
                      <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                      수정
                    </Button>
                  </Link>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    className="bg-red-500/10 border-red-300/70 text-red-100
                      hover:bg-red-500/30 hover:border-red-200 hover:text-white
                      font-medium shadow-md backdrop-blur-sm
                      transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    aria-label="장비 삭제하기"
                  >
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    삭제
                  </Button>
                )}
              </div>
            </div>

            {/* 상태 뱃지 (접근성: 아이콘+텍스트로 색상 외 상태 구분) */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {/* 기본 상태 배지 (가용성) */}
              <Badge
                variant="outline"
                className={cn(
                  'px-3 py-1.5 text-sm font-semibold border-2 inline-flex items-center gap-1.5',
                  statusConfig.bg,
                  statusConfig.color
                )}
                role="status"
                aria-label={`장비 상태: ${statusConfig.label}`}
              >
                <statusConfig.icon className="h-4 w-4" aria-hidden="true" />
                <span>{statusConfig.label}</span>
              </Badge>

              {/* 교정 상태 배지 (별도 표시) - 복합 상태 지원 */}
              {calibrationStatus && (
                <Badge
                  variant="outline"
                  className={cn(
                    'px-3 py-1.5 text-sm font-semibold border-2 inline-flex items-center gap-1.5',
                    'animate-pulse',
                    calibrationStatus.bg,
                    calibrationStatus.color
                  )}
                  role="status"
                  aria-label={`교정 상태: ${calibrationStatus.label}`}
                >
                  <calibrationStatus.icon className="h-4 w-4" aria-hidden="true" />
                  <span>{calibrationStatus.label}</span>
                </Badge>
              )}

              {/* 공용장비 배지 */}
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
