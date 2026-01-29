// 예약 상태 타입
export type ReservationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'COMPLETED';

// ✅ SSOT: @equipment-management/schemas에서 타입 import
import type {
  UserRole as SchemaUserRole,
  EquipmentStatus,
} from '@equipment-management/schemas';

// Re-export for convenience
export type { SchemaUserRole as UserRole };

// 사용자 타입
export interface User {
  id: string;
  name: string;
  email: string;
  role: SchemaUserRole;
  teamId?: string;
}

// ✅ SSOT: 장비 타입 (packages/schemas의 EquipmentStatus 사용)
export interface Equipment {
  id: string;
  name: string;
  managementNumber: string;
  description?: string;
  status: EquipmentStatus;
}

// 예약 타입
export interface Reservation {
  id: string;
  equipmentId: string;
  userId: string;
  approvedById?: string;
  purpose: string;
  startDate: string | Date;
  endDate: string | Date;
  status: ReservationStatus;
  rejectionReason?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// 확장된 예약 타입 (user, equipment, approvedBy 정보 포함)
export interface ExpandedReservation extends Reservation {
  user?: User;
  equipment?: Equipment;
  approvedBy?: User;
}

// 예약 생성 DTO 타입
export interface CreateReservationDto {
  equipmentId: string;
  userId?: string;
  purpose: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

// 예약 업데이트 DTO 타입
export interface UpdateReservationDto {
  purpose?: string;
  startDate?: string;
  endDate?: string;
  status?: ReservationStatus;
  approvedById?: string;
  rejectionReason?: string;
  notes?: string;
}

// 예약 조회 쿼리 타입
export interface ReservationQuery {
  status?: string;
  equipmentId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// 기본 데이터 타입
export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ✅ SSOT: PaginatedResponse는 api/types.ts에서 정의 (schemas 패키지 기반)
// Re-export for backward compatibility
export type { PaginatedResponse } from '../api/types';

export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
  };
}

// 상태 관련 타입
export interface FilterState {
  search?: string;
  status?: string;
  category?: string;
  team?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 알림 관련 타입
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  userId: string;
}

// 이벤트 관련 타입
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resourceId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  color?: string;
}

// 보고서 관련 타입
export interface ReportData {
  id: string;
  name: string;
  type: 'excel' | 'csv' | 'pdf';
  generatedAt: string;
  url: string;
  parameters?: Record<string, unknown>;
}

// UI 컴포넌트 타입
export type { SeparatorProps } from "@/components/ui/separator";
export type { ToasterToast, ToastProps, ToastActionElement } from "@/components/ui/toast";
export type { InputProps } from "@/components/ui/input";
export type { BadgeProps } from "@/components/ui/badge"; 