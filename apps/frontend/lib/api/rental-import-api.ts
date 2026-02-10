/**
 * ============================================================================
 * Rental Import API - Legacy Proxy
 * ============================================================================
 *
 * @deprecated Use equipment-import-api.ts instead
 *
 * This file is maintained for backward compatibility only.
 * All methods proxy to the unified equipment-import-api with sourceType='rental'.
 *
 * Migration guide:
 * - Replace `import rentalImportApi from './rental-import-api'`
 * - With `import equipmentImportApi from './equipment-import-api'`
 * - Update DTO to include `sourceType: 'rental'`
 * ============================================================================
 */

import equipmentImportApi from './equipment-import-api';
import type {
  EquipmentImport,
  RentalImport,
  CreateRentalImportDto,
  ReceiveEquipmentImportDto,
  EquipmentImportQuery,
  EquipmentImportListResponse,
} from './equipment-import-api';

// Re-export types for backward compatibility
export type { RentalImport };
export type ReceivingCondition = ReceiveEquipmentImportDto['receivingCondition'];
export type ReceiveRentalImportPayload = ReceiveEquipmentImportDto;

/**
 * @deprecated Use CreateRentalImportDto from equipment-import-api.ts
 */
export interface CreateRentalImportDtoLegacy {
  equipmentName: string;
  modelName?: string;
  manufacturer?: string;
  serialNumber?: string;
  description?: string;
  classification: string;
  vendorName: string;
  vendorContact?: string;
  externalIdentifier?: string;
  usagePeriodStart: string;
  usagePeriodEnd: string;
  reason: string;
}

/**
 * @deprecated Use EquipmentImportQuery from equipment-import-api.ts
 */
export interface RentalImportQuery {
  page?: number;
  limit?: number;
  status?: string;
  site?: string;
  teamId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * @deprecated Use EquipmentImportListResponse from equipment-import-api.ts
 */
export interface RentalImportListResponse {
  items: RentalImport[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

/**
 * Legacy Rental Import API (proxies to equipment-import-api)
 */
class RentalImportApi {
  /**
   * @deprecated Use equipmentImportApi.getList({ sourceType: 'rental' })
   */
  async getList(query?: RentalImportQuery): Promise<RentalImportListResponse> {
    // Force rental filter
    return equipmentImportApi.getList({
      ...query,
      sourceType: 'rental',
    }) as Promise<RentalImportListResponse>;
  }

  /**
   * @deprecated Use equipmentImportApi.getOne(id)
   */
  async getOne(id: string): Promise<RentalImport> {
    const result = await equipmentImportApi.getOne(id);
    // Runtime check: ensure it's a rental import
    if (result.sourceType !== 'rental') {
      throw new Error(`Expected rental import but got ${result.sourceType}`);
    }
    return result as RentalImport;
  }

  /**
   * @deprecated Use equipmentImportApi.create() with sourceType='rental'
   */
  async create(dto: CreateRentalImportDtoLegacy): Promise<RentalImport> {
    const createDto: CreateRentalImportDto = {
      ...dto,
      sourceType: 'rental',
    };
    return equipmentImportApi.create(createDto) as Promise<RentalImport>;
  }

  /**
   * @deprecated Use equipmentImportApi.approve(id, comment)
   */
  async approve(id: string): Promise<RentalImport> {
    return equipmentImportApi.approve(id) as Promise<RentalImport>;
  }

  /**
   * @deprecated Use equipmentImportApi.reject(id, reason)
   */
  async reject(id: string, rejectionReason: string): Promise<RentalImport> {
    return equipmentImportApi.reject(id, rejectionReason) as Promise<RentalImport>;
  }

  /**
   * @deprecated Use equipmentImportApi.receive(id, payload)
   */
  async receive(id: string, payload: ReceiveRentalImportPayload): Promise<RentalImport> {
    return equipmentImportApi.receive(id, payload) as Promise<RentalImport>;
  }

  /**
   * @deprecated Use equipmentImportApi.initiateReturn(id)
   */
  async initiateReturn(id: string): Promise<RentalImport> {
    const result = await equipmentImportApi.initiateReturn(id);
    // Get updated import record
    return this.getOne(id);
  }

  /**
   * @deprecated Use equipmentImportApi.cancel(id, reason)
   */
  async cancel(id: string, reason: string = 'Cancelled by user'): Promise<RentalImport> {
    return equipmentImportApi.cancel(id, reason) as Promise<RentalImport>;
  }
}

const rentalImportApi = new RentalImportApi();
export default rentalImportApi;
