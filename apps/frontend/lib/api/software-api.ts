import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { PaginatedResponse } from './types';
import { transformPaginatedResponse } from './utils/response-transformers';
import type {
  TestField,
  SoftwareAvailability,
  ValidationType,
  ValidationStatus,
} from '@equipment-management/schemas';

export type { TestField, SoftwareAvailability, ValidationType, ValidationStatus };

// ============================================================================
// Test Software (UL-QP-18-07)
// ============================================================================

export interface TestSoftware {
  id: string;
  managementNumber: string;
  name: string;
  softwareVersion: string | null;
  testField: TestField;
  primaryManagerId: string | null;
  secondaryManagerId: string | null;
  installedAt: string | null;
  manufacturer: string | null;
  location: string | null;
  availability: SoftwareAvailability;
  requiresValidation: boolean;
  site: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  primaryManagerName?: string;
  secondaryManagerName?: string;
}

export interface TestSoftwareQuery {
  testField?: TestField;
  availability?: SoftwareAvailability;
  search?: string;
  manufacturer?: string;
  site?: string;
  teamId?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface CreateTestSoftwareDto {
  name: string;
  softwareVersion?: string;
  testField: TestField;
  primaryManagerId?: string;
  secondaryManagerId?: string;
  installedAt?: string;
  manufacturer?: string;
  location?: string;
  availability?: SoftwareAvailability;
  requiresValidation?: boolean;
  site?: string;
}

export interface UpdateTestSoftwareDto extends Partial<CreateTestSoftwareDto> {
  version: number;
}

// ============================================================================
// Equipment Link (M:N)
// ============================================================================

export interface LinkedEquipment {
  id: string;
  managementNumber: string;
  name: string;
  modelName: string | null;
  manufacturer: string | null;
  status: string;
  site: string | null;
  notes: string | null;
  linkedAt: string;
}

// ============================================================================
// Software Validation (UL-QP-18-09)
// ============================================================================

export interface SoftwareValidation {
  id: string;
  testSoftwareId: string;
  validationType: ValidationType;
  status: ValidationStatus;
  softwareVersion: string | null;
  testDate: string | null;
  infoDate: string | null;
  softwareAuthor: string | null;
  // Vendor fields
  vendorName: string | null;
  vendorSummary: string | null;
  receivedBy: string | null;
  receivedDate: string | null;
  attachmentNote: string | null;
  // Self fields
  referenceDocuments: string | null;
  operatingUnitDescription: string | null;
  softwareComponents: string | null;
  hardwareComponents: string | null;
  acquisitionFunctions: unknown[] | null;
  processingFunctions: unknown[] | null;
  controlFunctions: unknown[] | null;
  performedBy: string | null;
  // Approval
  createdBy: string | null;
  submittedAt: string | null;
  submittedBy: string | null;
  technicalApproverId: string | null;
  technicalApprovedAt: string | null;
  qualityApproverId: string | null;
  qualityApprovedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSoftwareValidationDto {
  validationType: ValidationType;
  softwareVersion?: string;
  testDate?: string;
  // Vendor fields
  vendorName?: string;
  vendorSummary?: string;
  receivedBy?: string;
  receivedDate?: string;
  attachmentNote?: string;
  // Self fields
  referenceDocuments?: string;
  operatingUnitDescription?: string;
  softwareComponents?: string;
  hardwareComponents?: string;
  acquisitionFunctions?: Record<string, unknown>[];
  processingFunctions?: Record<string, unknown>[];
  controlFunctions?: Record<string, unknown>[];
  performedBy?: string;
}

export interface UpdateSoftwareValidationDto extends Partial<CreateSoftwareValidationDto> {
  version: number;
}

// API methods
const testSoftwareApi = {
  list: async (query: TestSoftwareQuery = {}): Promise<PaginatedResponse<TestSoftware>> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
    });
    const url = `${API_ENDPOINTS.TEST_SOFTWARE.LIST}${params.toString() ? `?${params}` : ''}`;
    return apiClient.get(url).then((res) => transformPaginatedResponse<TestSoftware>(res));
  },
  get: async (id: string): Promise<TestSoftware> => {
    return apiClient.get(API_ENDPOINTS.TEST_SOFTWARE.GET(id)).then((res) => res.data);
  },
  create: async (data: CreateTestSoftwareDto): Promise<TestSoftware> => {
    return apiClient.post(API_ENDPOINTS.TEST_SOFTWARE.CREATE, data).then((res) => res.data);
  },
  update: async (id: string, data: UpdateTestSoftwareDto): Promise<TestSoftware> => {
    return apiClient.patch(API_ENDPOINTS.TEST_SOFTWARE.UPDATE(id), data).then((res) => res.data);
  },
  toggleAvailability: async (id: string, version: number): Promise<TestSoftware> => {
    return apiClient
      .patch(API_ENDPOINTS.TEST_SOFTWARE.TOGGLE_AVAILABILITY(id), { version })
      .then((res) => res.data);
  },
  listByEquipment: async (equipmentId: string): Promise<TestSoftware[]> => {
    return apiClient
      .get(API_ENDPOINTS.TEST_SOFTWARE.BY_EQUIPMENT(equipmentId))
      .then((res) => res.data);
  },
  listLinkedEquipment: async (softwareId: string): Promise<LinkedEquipment[]> => {
    return apiClient
      .get(API_ENDPOINTS.TEST_SOFTWARE.LINKED_EQUIPMENT(softwareId))
      .then((res) => res.data);
  },
  linkEquipment: async (
    softwareId: string,
    data: { equipmentId: string; notes?: string }
  ): Promise<{ id: string }> => {
    return apiClient
      .post(API_ENDPOINTS.TEST_SOFTWARE.LINK_EQUIPMENT(softwareId), data)
      .then((res) => res.data);
  },
  unlinkEquipment: async (softwareId: string, equipmentId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.TEST_SOFTWARE.UNLINK_EQUIPMENT(softwareId, equipmentId));
  },
};

const softwareValidationApi = {
  list: async (softwareId: string): Promise<PaginatedResponse<SoftwareValidation>> => {
    return apiClient
      .get(API_ENDPOINTS.SOFTWARE_VALIDATIONS.LIST(softwareId))
      .then((res) => transformPaginatedResponse<SoftwareValidation>(res));
  },
  get: async (id: string): Promise<SoftwareValidation> => {
    return apiClient.get(API_ENDPOINTS.SOFTWARE_VALIDATIONS.GET(id)).then((res) => res.data);
  },
  create: async (
    softwareId: string,
    data: CreateSoftwareValidationDto
  ): Promise<SoftwareValidation> => {
    return apiClient
      .post(API_ENDPOINTS.SOFTWARE_VALIDATIONS.CREATE(softwareId), data)
      .then((res) => res.data);
  },
  update: async (id: string, data: UpdateSoftwareValidationDto): Promise<SoftwareValidation> => {
    return apiClient
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.UPDATE(id), data)
      .then((res) => res.data);
  },
  submit: async (id: string, version: number): Promise<SoftwareValidation> => {
    return apiClient
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.SUBMIT(id), { version })
      .then((res) => res.data);
  },
  approve: async (id: string, version: number): Promise<SoftwareValidation> => {
    return apiClient
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.APPROVE(id), { version })
      .then((res) => res.data);
  },
  qualityApprove: async (id: string, version: number): Promise<SoftwareValidation> => {
    return apiClient
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.QUALITY_APPROVE(id), { version })
      .then((res) => res.data);
  },
  reject: async (
    id: string,
    version: number,
    rejectionReason: string
  ): Promise<SoftwareValidation> => {
    return apiClient
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.REJECT(id), { version, rejectionReason })
      .then((res) => res.data);
  },
  revise: async (id: string, version: number): Promise<SoftwareValidation> => {
    return apiClient
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.REVISE(id), { version })
      .then((res) => res.data);
  },
};

export { testSoftwareApi, softwareValidationApi };
export default testSoftwareApi;
