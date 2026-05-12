'use client';

import { getNCPrerequisite } from '@equipment-management/schemas';
import type { NonConformance } from '@/lib/api/non-conformances-api';
import { NC_INFO_CARD_TOKENS } from '@/lib/design-tokens';
import { NCBasicInfoCard } from './NCBasicInfoCard';
import { NCRepairCard } from './NCRepairCard';
import { NCCalibrationCard } from './NCCalibrationCard';

export interface InfoCardsProps {
  nc: NonConformance;
  onRepairRegister: () => void;
  onCalibrationRegister: () => void;
  onCalibrationView: () => void;
}

export function InfoCards({
  nc,
  onRepairRegister,
  onCalibrationRegister,
  onCalibrationView,
}: InfoCardsProps) {
  const hasRepairLink = !!nc.repairHistoryId;
  const hasCalibrationLink = !!nc.calibrationId;
  const prerequisiteType = getNCPrerequisite(nc.ncType);
  const needsRepair = prerequisiteType === 'repair';
  const isCalibrationRelated =
    nc.ncType === 'calibration_failure' || nc.ncType === 'calibration_overdue';

  const gridClass =
    (needsRepair && hasRepairLink) || (isCalibrationRelated && hasCalibrationLink)
      ? NC_INFO_CARD_TOKENS.gridRepairLinked
      : needsRepair || isCalibrationRelated
        ? NC_INFO_CARD_TOKENS.grid
        : 'grid grid-cols-1';

  return (
    <div className={gridClass}>
      <NCBasicInfoCard nc={nc} />
      {needsRepair && <NCRepairCard nc={nc} onRepairRegister={onRepairRegister} />}
      {isCalibrationRelated && (
        <NCCalibrationCard
          nc={nc}
          onCalibrationRegister={onCalibrationRegister}
          onCalibrationView={onCalibrationView}
        />
      )}
    </div>
  );
}
