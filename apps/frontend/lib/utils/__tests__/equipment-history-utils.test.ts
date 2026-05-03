import calibrationApi from '@/lib/api/calibration-api';
import equipmentApi from '@/lib/api/equipment-api';
import { saveHistoryInParallel } from '../equipment-history-utils';
import type { PendingHistoryData } from '@/components/equipment/EquipmentForm';

jest.mock('@/lib/api/equipment-api', () => ({
  __esModule: true,
  default: {
    createLocationHistory: jest.fn(),
    createMaintenanceHistory: jest.fn(),
    createIncidentHistory: jest.fn(),
  },
}));

jest.mock('@/lib/api/calibration-api', () => ({
  __esModule: true,
  default: {
    createHistoricalCalibration: jest.fn(),
  },
}));

const mockEquipmentApi = equipmentApi as jest.Mocked<typeof equipmentApi>;
const mockCalibrationApi = calibrationApi as jest.Mocked<typeof calibrationApi>;

describe('saveHistoryInParallel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEquipmentApi.createLocationHistory.mockResolvedValue({} as never);
    mockEquipmentApi.createMaintenanceHistory.mockResolvedValue({} as never);
    mockEquipmentApi.createIncidentHistory.mockResolvedValue({} as never);
    mockCalibrationApi.createHistoricalCalibration.mockResolvedValue({} as never);
  });

  it('stores pending calibration history through the historical calibration API', async () => {
    const pendingHistory: PendingHistoryData = {
      locationHistory: [],
      maintenanceHistory: [],
      incidentHistory: [],
      calibrationHistory: [
        {
          calibrationDate: '2024-01-01',
          nextCalibrationDate: '2025-01-01',
          calibrationAgency: '한국교정',
          calibrationCycle: 12,
          result: 'pass',
          notes: 'initial history',
        },
      ],
    };

    const result = await saveHistoryInParallel('equipment-uuid', pendingHistory, 'save failed');

    expect(mockCalibrationApi.createHistoricalCalibration).toHaveBeenCalledWith('equipment-uuid', {
      calibrationDate: '2024-01-01',
      nextCalibrationDate: '2025-01-01',
      calibrationAgency: '한국교정',
      result: 'pass',
      notes: 'initial history',
    });
    expect(result).toEqual([{ type: 'calibration', index: 0, status: 'fulfilled' }]);
  });

  it('reports calibration history save failures instead of silently marking them fulfilled', async () => {
    mockCalibrationApi.createHistoricalCalibration.mockRejectedValueOnce(new Error('boom'));

    const result = await saveHistoryInParallel(
      'equipment-uuid',
      {
        locationHistory: [],
        maintenanceHistory: [],
        incidentHistory: [],
        calibrationHistory: [
          {
            calibrationDate: '2024-01-01',
            nextCalibrationDate: '2025-01-01',
            calibrationAgency: '한국교정',
            calibrationCycle: 12,
            result: 'pass',
          },
        ],
      },
      'save failed'
    );

    expect(result).toEqual([
      { type: 'calibration', index: 0, status: 'rejected', error: 'save failed' },
    ]);
  });
});
