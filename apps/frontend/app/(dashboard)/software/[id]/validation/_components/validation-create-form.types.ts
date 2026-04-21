import type {
  AcquisitionOrProcessingItem,
  ControlItem,
  ValidationType,
} from '@equipment-management/schemas';

export interface CreateFormState {
  validationType: ValidationType | '';
  softwareVersion: string;
  testDate: string;
  vendorName: string;
  vendorSummary: string;
  receivedBy: string;
  receivedDate: string;
  attachmentNote: string;
  referenceDocuments: string;
  operatingUnitDescription: string;
  softwareComponents: string;
  hardwareComponents: string;
  performedBy: string;
  acquisitionFunctions: AcquisitionOrProcessingItem[];
  processingFunctions: AcquisitionOrProcessingItem[];
  controlFunctions: ControlItem[];
}
