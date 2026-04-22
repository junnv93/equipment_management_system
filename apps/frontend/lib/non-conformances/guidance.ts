import {
  getNCPrerequisite,
  NonConformanceStatusValues as NCVal,
} from '@equipment-management/schemas';
import { resolveNCGuidanceKey, type NCGuidanceKeyReachable } from '@/lib/design-tokens';
import type { NonConformance } from '@/lib/api/non-conformances-api';

export function deriveGuidance(
  nc: NonConformance,
  canCloseNC: boolean
): {
  key: NCGuidanceKeyReachable;
  needsRepair: boolean;
  needsRecalibration: boolean;
} {
  const prerequisite = getNCPrerequisite(nc.ncType);
  const needsRepair = prerequisite === 'repair' && !nc.repairHistoryId;
  const needsRecalibration = prerequisite === 'recalibration' && !nc.calibrationId;
  const key = resolveNCGuidanceKey({
    status: nc.status,
    canCloseNC,
    needsRepair,
    needsRecalibration,
    hasRejection: nc.status === NCVal.OPEN && !!nc.rejectionReason,
  });
  return { key, needsRepair, needsRecalibration };
}
