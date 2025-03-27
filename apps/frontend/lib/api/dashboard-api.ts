import { apiClient } from "./api-client"

export interface DashboardSummary {
  totalEquipment: number
  availableEquipment: number
  activeRentals: number
  activeCheckouts: number
  upcomingCalibrations: number
}

export type EquipmentByTeam = {
  id: string
  name: string
  count: number
}

export type OverdueCalibration = {
  id: string
  name: string
  dueDate: string
  equipmentId: string
}

export interface UpcomingCalibration {
  id: string
  equipmentId: string
  equipmentName: string
  dueDate: string
  daysUntilDue: number
}

export type OverdueRental = {
  id: string
  name: string
  dueDate: string
  equipmentId: string
}

export interface RecentActivity {
  id: string
  type: "rental" | "return" | "calibration" | "maintenance" | "checkout" | "checkin"
  equipmentId: string
  equipmentName: string
  userId: string
  userName: string
  timestamp: string
  details: string
}

class DashboardApi {
  async getSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get("/api/dashboard/summary")
    return response.data
  }

  async getEquipmentByTeam(): Promise<EquipmentByTeam[]> {
    const response = await apiClient.get("/api/dashboard/equipment-by-team")
    return response.data
  }

  async getOverdueCalibrations(): Promise<OverdueCalibration[]> {
    const response = await apiClient.get("/api/dashboard/overdue-calibrations")
    return response.data
  }

  async getUpcomingCalibrations(days: number): Promise<UpcomingCalibration[]> {
    const response = await apiClient.get(`/api/dashboard/upcoming-calibrations?days=${days}`)
    return response.data
  }

  async getOverdueRentals(): Promise<OverdueRental[]> {
    const response = await apiClient.get("/api/dashboard/overdue-rentals")
    return response.data
  }

  async getRecentActivities(): Promise<RecentActivity[]> {
    const response = await apiClient.get("/api/dashboard/recent-activities")
    return response.data
  }

  async getEquipmentStatusStats(): Promise<Record<string, number>> {
    const response = await apiClient.get("/api/dashboard/equipment-status-stats")
    return response.data
  }
}

export const dashboardApi = new DashboardApi() 