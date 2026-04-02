/**
 * 장비 선택 컴포넌트
 *
 * ✅ 재사용 가능한 컴포넌트: 여러 create 페이지에서 공통으로 사용
 * ✅ 타입 안전성: Equipment 타입 사용
 * ✅ API_STANDARDS 준수: equipmentApi 사용
 */

'use client';
import { useTranslations } from 'next-intl';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { TRANSITION_PRESETS } from '@/lib/design-tokens';
import { useEquipmentList } from '@/hooks/use-equipment';
import type { Equipment } from '@/lib/api/equipment-api';
import type { EquipmentStatus } from '@equipment-management/schemas';

export interface EquipmentSelectorProps {
  /** 선택된 장비 ID */
  selectedEquipmentId: string | null;
  /** 장비 선택 핸들러 */
  onSelect: (equipmentId: string) => void;
  /** 필터링할 장비 상태 (기본값: "available") */
  statusFilter?: EquipmentStatus;
  /** 검색어 초기값 */
  initialSearchTerm?: string;
  /** 최대 높이 (기본값: 400px) */
  maxHeight?: string;
  /** 추가 필터 옵션 */
  additionalFilters?: {
    pageSize?: number;
  };
}

export function EquipmentSelector({
  selectedEquipmentId,
  onSelect,
  statusFilter = 'available',
  initialSearchTerm = '',
  maxHeight = '400px',
  additionalFilters = {},
}: EquipmentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const tEquipment = useTranslations('equipment.selector');

  // 장비 목록 조회
  const { data: equipmentData, isLoading: equipmentLoading } = useEquipmentList({
    status: statusFilter,
    search: searchTerm || undefined,
    pageSize: additionalFilters.pageSize || 100,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tEquipment('title')}</CardTitle>
        <CardDescription>{tEquipment('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tEquipment('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="space-y-2" style={{ maxHeight, overflowY: 'auto' }}>
          {equipmentLoading ? (
            <div className="text-center py-8">{tEquipment('loading')}</div>
          ) : equipmentData?.data?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{tEquipment('noResults')}</div>
          ) : (
            equipmentData?.data?.map((equipment: Equipment) => (
              <div
                key={equipment.id}
                className={`p-3 border rounded-md cursor-pointer ${TRANSITION_PRESETS.fastColor} ${
                  selectedEquipmentId === String(equipment.id)
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onSelect(String(equipment.id))}
              >
                <div className="font-medium">{equipment.name}</div>
                <div className="text-sm text-muted-foreground">
                  {tEquipment('managementNumber', { number: equipment.managementNumber })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {tEquipment('location', {
                    location: equipment.location || tEquipment('noLocationInfo'),
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
