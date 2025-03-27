import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DashboardPage from "@/app/(dashboard)/page"
import { dashboardApi } from "@/lib/api/dashboard-api"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Mock socket.io-client
jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}))

// Mock dashboard API
jest.mock("@/lib/api/dashboard-api", () => ({
  dashboardApi: {
    getDashboardSummary: jest.fn(),
    getEquipmentList: jest.fn(),
    getEquipmentByTeam: jest.fn(),
    getOverdueCalibrations: jest.fn(),
    getUpcomingCalibrations: jest.fn(),
    getOverdueRentals: jest.fn(),
    getRecentActivities: jest.fn(),
    getEquipmentStatusStats: jest.fn(),
  },
}))

// Mock use-toast
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const renderWithClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe("DashboardPage", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Mock the dashboard API response
    ;(dashboardApi.getDashboardSummary as jest.Mock).mockResolvedValue({
      totalEquipment: 100,
      availableEquipment: 80,
      pendingCalibrations: 5,
      activeRentals: 15,
      pendingCheckouts: 3,
      recentActivities: []
    })

    // Mock the equipment data
    ;(dashboardApi.getEquipmentList as jest.Mock).mockResolvedValue([
      { id: 1, name: "Equipment 1", status: "Available" },
      { id: 2, name: "Equipment 2", status: "In Use" }
    ])

    // Mock other API calls
    ;(dashboardApi.getEquipmentByTeam as jest.Mock).mockResolvedValue([
      { team: "Team A", count: 30 },
      { team: "Team B", count: 20 }
    ])

    ;(dashboardApi.getOverdueCalibrations as jest.Mock).mockResolvedValue([
      { id: 1, name: "Equipment 1", dueDate: "2024-03-20" }
    ])

    ;(dashboardApi.getUpcomingCalibrations as jest.Mock).mockResolvedValue([
      { id: 2, name: "Equipment 2", dueDate: "2024-04-01" }
    ])

    ;(dashboardApi.getOverdueRentals as jest.Mock).mockResolvedValue([
      { id: 3, name: "Equipment 3", dueDate: "2024-03-19" }
    ])

    ;(dashboardApi.getRecentActivities as jest.Mock).mockResolvedValue([
      { id: 1, type: "RENTAL", equipment: "Equipment 4", date: "2024-03-20" }
    ])

    ;(dashboardApi.getEquipmentStatusStats as jest.Mock).mockResolvedValue({
      available: 80,
      inUse: 15,
      maintenance: 5
    })
  })

  it("renders dashboard page with loading state", () => {
    renderWithClient(<DashboardPage />)
    expect(screen.getByText(/대시보드/i)).toBeInTheDocument()
  })

  it("displays summary data after loading", async () => {
    renderWithClient(<DashboardPage />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/전체 장비/i)).toBeInTheDocument()
    })

    // Check if summary data is displayed
    const summaryValues = screen.getAllByTestId("stats-value")
    expect(summaryValues.length).toBeGreaterThan(0)
    expect(summaryValues.some(el => el.textContent === "100")).toBeTruthy()
    expect(summaryValues.some(el => el.textContent === "80")).toBeTruthy()
    expect(summaryValues.some(el => el.textContent === "5")).toBeTruthy()
  })

  it("switches between tabs", async () => {
    renderWithClient(<DashboardPage />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /전체/i })).toBeInTheDocument()
    })

    // Click on equipment tab
    const equipmentTab = screen.getByRole("tab", { name: /장비/i })
    await userEvent.click(equipmentTab)

    // Check if equipment tab content is displayed
    await waitFor(() => {
      expect(screen.getByTestId("equipment-tab-title")).toBeInTheDocument()
    })

    // 교정 탭으로 전환
    const calibrationTab = screen.getByRole("tab", { name: /교정/i })
    await userEvent.click(calibrationTab)

    await waitFor(() => {
      expect(screen.getByText(/Equipment 1/i)).toBeInTheDocument()
    })

    // 대여 탭으로 전환
    const rentalTab = screen.getByRole("tab", { name: /대여/i })
    await userEvent.click(rentalTab)

    await waitFor(() => {
      expect(screen.getByText(/Equipment 3/i)).toBeInTheDocument()
    })
  })
}) 