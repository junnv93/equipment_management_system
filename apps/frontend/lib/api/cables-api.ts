import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { PaginatedResponse } from './types';
import { transformPaginatedResponse } from './utils/response-transformers';

// ============================================================================
// Cable (UL-QP-18-08)
// ============================================================================

export interface Cable {
  id: string;
  managementNumber: string;
  length: string | null;
  connectorType: string | null;
  frequencyRangeMin: number | null;
  frequencyRangeMax: number | null;
  serialNumber: string | null;
  location: string | null;
  site: string | null;
  status: string;
  lastMeasurementDate: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CableMeasurement {
  id: string;
  cableId: string;
  measurementDate: string;
  measuredBy: string | null;
  notes: string | null;
  createdAt: string;
  dataPoints?: CableDataPoint[];
}

export interface CableDataPoint {
  id: string;
  frequencyMhz: number;
  lossDb: string;
}

export interface CableQuery {
  search?: string;
  connectorType?: string;
  status?: string;
  site?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateCableDto {
  length?: string;
  connectorType?: string;
  frequencyRangeMin?: number;
  frequencyRangeMax?: number;
  serialNumber?: string;
  location?: string;
  site?: string;
}

export interface UpdateCableDto extends Partial<CreateCableDto> {
  version: number;
}

export interface CreateMeasurementDto {
  measurementDate: string;
  notes?: string;
  dataPoints: { frequencyMhz: number; lossDb: string }[];
}

// API methods
const cablesApi = {
  list: async (query: CableQuery = {}): Promise<PaginatedResponse<Cable>> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
    });
    const url = `${API_ENDPOINTS.CABLES.LIST}${params.toString() ? `?${params}` : ''}`;
    return apiClient.get(url).then((res) => transformPaginatedResponse<Cable>(res));
  },
  get: async (id: string): Promise<Cable> => {
    return apiClient.get(API_ENDPOINTS.CABLES.GET(id)).then((res) => res.data);
  },
  create: async (data: CreateCableDto): Promise<Cable> => {
    return apiClient.post(API_ENDPOINTS.CABLES.CREATE, data).then((res) => res.data);
  },
  update: async (id: string, data: UpdateCableDto): Promise<Cable> => {
    return apiClient.patch(API_ENDPOINTS.CABLES.UPDATE(id), data).then((res) => res.data);
  },
  addMeasurement: async (
    cableId: string,
    data: CreateMeasurementDto
  ): Promise<CableMeasurement> => {
    return apiClient
      .post(API_ENDPOINTS.CABLES.MEASUREMENTS.CREATE(cableId), data)
      .then((res) => res.data);
  },
  getMeasurements: async (cableId: string): Promise<CableMeasurement[]> => {
    return apiClient.get(API_ENDPOINTS.CABLES.MEASUREMENTS.LIST(cableId)).then((res) => res.data);
  },
  getMeasurementDetail: async (measurementId: string): Promise<CableMeasurement> => {
    return apiClient
      .get(API_ENDPOINTS.CABLES.MEASUREMENTS.GET(measurementId))
      .then((res) => res.data);
  },
};

export { cablesApi };
export default cablesApi;
