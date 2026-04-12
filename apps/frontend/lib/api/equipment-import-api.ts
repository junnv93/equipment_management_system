import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { transformSingleResponse, transformPaginatedResponse } from './utils/response-transformers';
import type { PaginatedResponse } from './types';
import type {
  EquipmentImportSource,
  EquipmentImportStatus,
  Classification,
} from '@equipment-management/schemas';

/**
 * ============================================================================
 * Equipment Import API - Unified API for External Rental and Internal Shared
 * ============================================================================
 *
 * This API client supports both import types through discriminated unions:
 * - sourceType: 'rental' → External rental from vendors
 * - sourceType: 'internal_shared' → Internal shared from departments (e.g., Safety Lab)
 *
 * Type safety is enforced through TypeScript discriminated unions and
 * backend Zod validation with conditional field requirements.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Base equipment import type (common fields)
 */
interface BaseEquipmentImport {
  id: string;
  requesterId: string;
  site: string;
  teamId: string;
  equipmentName: string;
  modelName: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  description: string | null;
  classification: Classification;
  usagePeriodStart: string;
  usagePeriodEnd: string;
  reason: string;
  status: EquipmentImportStatus;
  approverId: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  receivedBy: string | null;
  receivedAt: string | null;
  receivingCondition: ReceivingCondition | null;
  equipmentId: string | null;
  returnCheckoutId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  // Relation 필드 (findAll with 절에서 반환)
  requester?: {
    id: string;
    name: string;
    email: string;
    team: { id: string; name: string } | null;
  } | null;
}

/**
 * Rental import type (external vendor)
 */
export interface RentalImport extends BaseEquipmentImport {
  sourceType: 'rental';
  vendorName: string;
  vendorContact: string | null;
  externalIdentifier: string | null;
  ownerDepartment: null;
  internalContact: null;
  borrowingJustification: null;
}

/**
 * Internal shared import type (internal department)
 */
export interface InternalSharedImport extends BaseEquipmentImport {
  sourceType: 'internal_shared';
  vendorName: null;
  vendorContact: null;
  externalIdentifier: string | null;
  ownerDepartment: string;
  internalContact: string | null;
  borrowingJustification: string | null;
}

/**
 * Discriminated union of all import types
 */
export type EquipmentImport = RentalImport | InternalSharedImport;

/**
 * Receiving condition check (common for both types)
 */
export interface ReceivingCondition {
  appearance: 'normal' | 'abnormal';
  operation: 'normal' | 'abnormal';
  accessories: 'complete' | 'incomplete';
  notes?: string;
}

// ============================================================================
// DTO Types (Create/Update)
// ============================================================================

/**
 * Base create DTO (common fields)
 */
interface BaseCreateDto {
  equipmentName: string;
  modelName?: string;
  manufacturer?: string;
  serialNumber?: string;
  description?: string;
  classification: string;
  usagePeriodStart: string;
  usagePeriodEnd: string;
  reason: string;
}

/**
 * Create rental import DTO (requires vendor fields)
 */
export interface CreateRentalImportDto extends BaseCreateDto {
  sourceType: 'rental';
  vendorName: string;
  vendorContact?: string;
  externalIdentifier?: string;
}

/**
 * Create internal shared import DTO (requires department fields)
 */
export interface CreateInternalSharedImportDto extends BaseCreateDto {
  sourceType: 'internal_shared';
  ownerDepartment: string;
  internalContact?: string;
  borrowingJustification?: string;
}

/**
 * Discriminated union for create operations
 */
export type CreateEquipmentImportDto = CreateRentalImportDto | CreateInternalSharedImportDto;

/**
 * Receive equipment import DTO (common for both types)
 */
export interface ReceiveEquipmentImportDto {
  version: number;
  receivingCondition: ReceivingCondition;
  calibrationInfo?: {
    managementMethod: string;
    calibrationCycle?: number;
    lastCalibrationDate?: string;
    calibrationAgency?: string;
  };
}

/**
 * Query parameters for list endpoint
 */
export interface EquipmentImportQuery {
  page?: number;
  limit?: number;
  sourceType?: EquipmentImportSource; // Filter by source type
  status?: EquipmentImportStatus;
  site?: string;
  teamId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response format
 */
export interface EquipmentImportListResponse {
  items: EquipmentImport[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

// ============================================================================
// API Client Methods
// ============================================================================

/**
 * Equipment Import API Client
 */
class EquipmentImportApi {
  /**
   * Get list of equipment imports with optional filters
   *
   * @param query - Query parameters including sourceType filter
   * @returns Paginated list of equipment imports
   *
   * @example
   * // Get all imports
   * const all = await equipmentImportApi.getList();
   *
   * // Get only rental imports
   * const rentals = await equipmentImportApi.getList({ sourceType: 'rental' });
   *
   * // Get only internal shared imports
   * const internal = await equipmentImportApi.getList({ sourceType: 'internal_shared' });
   */
  async getList(query?: EquipmentImportQuery): Promise<PaginatedResponse<EquipmentImport>> {
    const params = new URLSearchParams();

    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.sourceType) params.append('sourceType', query.sourceType);
    if (query?.status) params.append('status', query.status);
    if (query?.site) params.append('site', query.site);
    if (query?.teamId) params.append('teamId', query.teamId);
    if (query?.search) params.append('search', query.search);
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

    const queryString = params.toString();
    const url = `${API_ENDPOINTS.EQUIPMENT_IMPORTS.LIST}${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);
    return transformPaginatedResponse<EquipmentImport>(response);
  }

  /**
   * Get a single equipment import by ID
   *
   * @param id - Equipment import UUID
   * @returns Equipment import details (rental or internal shared)
   */
  async getOne(id: string): Promise<EquipmentImport> {
    const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT_IMPORTS.GET(id));
    return transformSingleResponse<EquipmentImport>(response);
  }

  /**
   * Create a new equipment import
   *
   * Supports both rental and internal shared imports through discriminated union.
   * The backend validates conditional fields based on sourceType.
   *
   * @param dto - Create DTO (rental or internal shared)
   * @returns Created equipment import
   *
   * @example
   * // Create rental import
   * const rental = await equipmentImportApi.create({
   *   sourceType: 'rental',
   *   equipmentName: 'Test Equipment',
   *   vendorName: 'ABC Rental',
   *   classification: 'fcc_emc_rf',
   *   usagePeriodStart: '2026-03-01T00:00:00Z',
   *   usagePeriodEnd: '2026-06-01T00:00:00Z',
   *   reason: 'For EMC testing',
   * });
   *
   * // Create internal shared import
   * const internal = await equipmentImportApi.create({
   *   sourceType: 'internal_shared',
   *   equipmentName: 'Spectrum Analyzer',
   *   ownerDepartment: 'Safety Lab',
   *   classification: 'fcc_emc_rf',
   *   usagePeriodStart: '2026-03-01T00:00:00Z',
   *   usagePeriodEnd: '2026-06-01T00:00:00Z',
   *   reason: 'For special EMC testing',
   * });
   */
  async create(dto: CreateEquipmentImportDto): Promise<EquipmentImport> {
    const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT_IMPORTS.CREATE, dto);
    return transformSingleResponse<EquipmentImport>(response);
  }

  /**
   * Approve an equipment import
   *
   * Approver is extracted from the authenticated session (backend).
   * Works for both rental and internal shared imports.
   *
   * @param id - Equipment import UUID
   * @param version - Version for optimistic locking
   * @param comment - Optional approval comment
   * @returns Updated equipment import
   */
  async approve(id: string, version: number, comment?: string): Promise<EquipmentImport> {
    const response = await apiClient.patch(API_ENDPOINTS.EQUIPMENT_IMPORTS.APPROVE(id), {
      version,
      comment,
    });
    return transformSingleResponse<EquipmentImport>(response);
  }

  /**
   * Reject an equipment import
   *
   * Works for both rental and internal shared imports.
   *
   * @param id - Equipment import UUID
   * @param version - Version for optimistic locking
   * @param reason - Rejection reason (required)
   * @returns Updated equipment import
   */
  async reject(id: string, version: number, reason: string): Promise<EquipmentImport> {
    const response = await apiClient.patch(API_ENDPOINTS.EQUIPMENT_IMPORTS.REJECT(id), {
      version,
      rejectionReason: reason,
    });
    return transformSingleResponse<EquipmentImport>(response);
  }

  /**
   * Receive equipment (auto-create equipment record)
   *
   * After receiving:
   * - Rental imports: equipment.sharedSource = 'external'
   * - Internal shared imports: equipment.sharedSource = 'internal_shared'
   *
   * Equipment owner is set to:
   * - Rental: vendorName
   * - Internal shared: ownerDepartment
   *
   * @param id - Equipment import UUID
   * @param dto - Receiving condition and calibration info
   * @returns Updated equipment import
   */
  async receive(
    id: string,
    dto: ReceiveEquipmentImportDto,
    files?: File[]
  ): Promise<EquipmentImport> {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('data', JSON.stringify(dto));
      files.forEach((file) => formData.append('files', file));
      const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT_IMPORTS.RECEIVE(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return transformSingleResponse<EquipmentImport>(response);
    }
    const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT_IMPORTS.RECEIVE(id), dto);
    return transformSingleResponse<EquipmentImport>(response);
  }

  /**
   * Initiate return process (create return checkout)
   *
   * Return destination is determined by sourceType:
   * - Rental: vendorName
   * - Internal shared: ownerDepartment
   *
   * @param id - Equipment import UUID
   * @returns Created checkout ID for return tracking
   */
  async initiateReturn(id: string, version: number): Promise<EquipmentImport> {
    const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT_IMPORTS.INITIATE_RETURN(id), {
      version,
    });
    return transformSingleResponse<EquipmentImport>(response);
  }

  /**
   * Cancel an equipment import
   *
   * Only allowed for 'pending' or 'approved' status.
   * Works for both rental and internal shared imports.
   *
   * @param id - Equipment import UUID
   * @param version - Version for optimistic locking (CAS)
   * @param reason - Cancellation reason (optional)
   * @returns Updated equipment import
   */
  async cancel(id: string, version: number, reason?: string): Promise<EquipmentImport> {
    const response = await apiClient.patch(API_ENDPOINTS.EQUIPMENT_IMPORTS.CANCEL(id), {
      version,
      reason,
    });
    return transformSingleResponse<EquipmentImport>(response);
  }
}

// Export singleton instance
const equipmentImportApi = new EquipmentImportApi();
export default equipmentImportApi;

// Re-export types for convenience
export type { EquipmentImportSource, EquipmentImportStatus } from '@equipment-management/schemas';
