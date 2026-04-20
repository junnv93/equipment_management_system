'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import equipmentApi, { type Equipment } from '@/lib/api/equipment-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { SELECTOR_PAGE_SIZE, Permission } from '@equipment-management/shared-constants';
import { EquipmentStatusValues as ESVal } from '@equipment-management/schemas';
import {
  getEquipmentSelectionClasses,
  CALIBRATION_SELECTION,
  CALIBRATION_EMPTY_STATE,
  getPageContainerClasses,
} from '@/lib/design-tokens';
import { CalibrationForm } from '@/components/calibration/CalibrationForm';
import type { Calibration } from '@/lib/api/calibration-api';
import { useAuth } from '@/hooks/use-auth';

export function CalibrationRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = useAuth();
  const t = useTranslations('calibration');

  const equipmentIdFromUrl = searchParams.get('equipmentId');
  const canRegisterCalibration = can(Permission.CREATE_CALIBRATION);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(equipmentIdFromUrl);

  const {
    data: equipmentData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.equipment.list({ pageSize: SELECTOR_PAGE_SIZE }),
    queryFn: () => equipmentApi.getEquipmentList({ pageSize: SELECTOR_PAGE_SIZE }),
    ...QUERY_CONFIG.EQUIPMENT_LIST,
  });

  const selectedEquipment = selectedEquipmentId
    ? equipmentData?.data?.find((item: Equipment) => item.id === selectedEquipmentId)
    : null;

  const filteredEquipment =
    equipmentData?.data?.filter(
      (eq: Equipment) =>
        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.managementNumber.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? [];

  const handleSuccess = (_calibration: Calibration) => {
    router.push('/calibration');
  };

  return (
    <div className={getPageContainerClasses()}>
      <PageHeader title={t('register.title')} />

      {!canRegisterCalibration && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('register.unauthorized')}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 장비 선택 패널 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('register.equipmentSelection.title')}</CardTitle>
            <CardDescription>{t('register.equipmentSelection.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t('register.equipmentSelection.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <p>{t('register.equipmentSelection.loading')}</p>
                </div>
              ) : isError ? (
                <div className="flex justify-center items-center h-full text-destructive">
                  <p>{t('register.equipmentSelection.error')}</p>
                </div>
              ) : filteredEquipment.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <p>{t('register.equipmentSelection.noResults')}</p>
                </div>
              ) : (
                <ul className="divide-y" role="listbox">
                  {filteredEquipment.map((equipment: Equipment) => {
                    const isSelected = selectedEquipmentId === String(equipment.id);
                    return (
                      <li
                        key={equipment.id}
                        className={getEquipmentSelectionClasses(isSelected)}
                        onClick={() => setSelectedEquipmentId(String(equipment.id))}
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedEquipmentId(String(equipment.id));
                          }
                        }}
                      >
                        <div className="font-medium">{equipment.name}</div>
                        <div className={CALIBRATION_SELECTION.infoText}>
                          {t('register.equipmentSelection.managementNumber')}:{' '}
                          {equipment.managementNumber}
                        </div>
                        <div className={CALIBRATION_SELECTION.infoText}>
                          {t('register.equipmentSelection.currentStatus')}:{' '}
                          {equipment.status === ESVal.AVAILABLE
                            ? t('register.equipmentSelection.statusAvailable')
                            : t('register.equipmentSelection.statusInUse')}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 교정 정보 등록 폼 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('register.form.title')}</CardTitle>
            <CardDescription>{t('register.form.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedEquipment ? (
              <div className={CALIBRATION_EMPTY_STATE.container}>
                <p className={CALIBRATION_EMPTY_STATE.description}>
                  {t('register.form.selectEquipment')}
                </p>
              </div>
            ) : (
              <>
                {/* 선택된 장비 요약 */}
                <div className="bg-muted p-3 rounded-md mb-4 text-sm">
                  <p className="font-medium">
                    {t('register.form.selectedEquipment')}: {selectedEquipment.name}
                  </p>
                  <p className="text-muted-foreground">
                    {t('register.form.managementNumber')}: {selectedEquipment.managementNumber}
                  </p>
                </div>

                <CalibrationForm
                  mode="page"
                  equipmentId={selectedEquipment.id}
                  onSuccess={handleSuccess}
                  disabled={!canRegisterCalibration}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
