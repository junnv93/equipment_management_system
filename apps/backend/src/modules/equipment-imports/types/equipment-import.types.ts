import type { EquipmentImport } from '@equipment-management/db/schema/equipment-imports';
import type { EquipmentImportSource } from '@equipment-management/schemas';

/**
 * TypeScript Discriminated Union Types for Equipment Imports
 *
 * These types provide compile-time type safety based on sourceType discriminator.
 * Use type guards (isRentalImport, isInternalSharedImport) to narrow types at runtime.
 */

// Base fields common to all import types
export interface BaseEquipmentImport extends Omit<EquipmentImport, 'sourceType'> {
  sourceType: EquipmentImportSource;
}

// Rental import (외부 렌탈 업체)
export interface RentalImport extends BaseEquipmentImport {
  sourceType: 'rental';
  vendorName: string; // Required
  vendorContact: string | null;
  externalIdentifier: string | null;
  // Internal shared fields are null for rental
  ownerDepartment: null;
  internalContact: null;
  borrowingJustification: null;
}

// Internal shared import (내부 공용장비)
export interface InternalSharedImport extends BaseEquipmentImport {
  sourceType: 'internal_shared';
  ownerDepartment: string; // Required
  internalContact: string | null;
  borrowingJustification: string | null;
  // Vendor fields are null for internal shared
  vendorName: null;
  vendorContact: null;
  externalIdentifier: null;
}

// Discriminated union type
export type EquipmentImportUnion = RentalImport | InternalSharedImport;

/**
 * Type guard: Check if import is rental type
 */
export function isRentalImport(equipmentImport: EquipmentImport): equipmentImport is RentalImport {
  return equipmentImport.sourceType === 'rental';
}

/**
 * Type guard: Check if import is internal shared type
 */
export function isInternalSharedImport(
  equipmentImport: EquipmentImport
): equipmentImport is InternalSharedImport {
  return equipmentImport.sourceType === 'internal_shared';
}

/**
 * Get destination for return checkout based on source type
 */
export function getReturnDestination(equipmentImport: EquipmentImport): string {
  if (isRentalImport(equipmentImport)) {
    return equipmentImport.vendorName;
  } else if (isInternalSharedImport(equipmentImport)) {
    return equipmentImport.ownerDepartment;
  }
  throw new Error(`Unknown source type: ${equipmentImport.sourceType}`);
}

/**
 * Get owner name for equipment registration based on source type
 */
export function getOwnerName(equipmentImport: EquipmentImport): string {
  if (isRentalImport(equipmentImport)) {
    return equipmentImport.vendorName;
  } else if (isInternalSharedImport(equipmentImport)) {
    return equipmentImport.ownerDepartment;
  }
  throw new Error(`Unknown source type: ${equipmentImport.sourceType}`);
}

/**
 * Get sharedSource value for equipment registration based on source type
 */
export function getSharedSource(equipmentImport: EquipmentImport): 'external' | 'internal_shared' {
  if (isRentalImport(equipmentImport)) {
    return 'external';
  } else if (isInternalSharedImport(equipmentImport)) {
    return 'internal_shared';
  }
  throw new Error(`Unknown source type: ${equipmentImport.sourceType}`);
}
