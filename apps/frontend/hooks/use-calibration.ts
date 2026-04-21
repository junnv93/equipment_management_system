import { useQuery } from '@tanstack/react-query';
import calibrationApi from '@/lib/api/calibration-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';

export function useCalibrationDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.calibrations.detail(id ?? ''),
    queryFn: () => calibrationApi.getCalibration(id!),
    enabled: !!id,
    ...QUERY_CONFIG.CALIBRATION_DETAIL,
  });
}
