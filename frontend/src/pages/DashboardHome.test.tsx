import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardHome } from "./DashboardHome";
import { Users, Activity, AlertTriangle, Calendar } from "lucide-react";

const mockNavigate = vi.fn();
const mockSyncNow = vi.fn();
const mockSetSearchTerm = vi.fn();

const offlineState = {
    isOnline: true,
    pendingSyncCount: 0,
    syncStatus: "idle",
    syncNow: mockSyncNow,
};

const dashboardState = {
    stats: {
        total_patients: 120,
        total_screenings: 250,
        high_risk_count: 15,
        pending_appointments: 8,
        weekly_screenings: [{ name: "Mon", screenings: 25, highRisk: 2, date: "2026-02-01" }],
        recent_screenings: [
            {
                id: "s1",
                patient_name: "Aarav Sharma",
                patient_village: "Rampur",
                risk_level: "High",
                created_at: "2026-02-01T10:00:00Z",
            },
        ],
    },
    loading: false,
    searchTerm: "",
    setSearchTerm: mockSetSearchTerm,
    statCards: [
        {
            label: "Total Patients",
            value: "120",
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
        },
        {
            label: "Total Screenings",
            value: "250",
            icon: Activity,
            color: "text-teal-400",
            bg: "bg-teal-500/10",
        },
        {
            label: "High Risk Cases",
            value: "15",
            icon: AlertTriangle,
            color: "text-red-400",
            bg: "bg-red-500/10",
        },
        {
            label: "Pending Appointments",
            value: "8",
            icon: Calendar,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
        },
    ],
    riskDistribution: [
        { name: "Low Risk", value: 150, color: "#10b981" },
        { name: "Medium", value: 85, color: "#f59e0b" },
        { name: "High Risk", value: 15, color: "#ef4444" },
    ],
    totalRisk: 250,
    filteredRecentScreenings: [
        {
            id: "s1",
            patient_name: "Aarav Sharma",
            patient_village: "Rampur",
            risk_level: "High",
            created_at: "2026-02-01T10:00:00Z",
        },
    ],
    localStats: { localPatients: 0, localScreenings: 0 },
};

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("../context/useOffline", () => ({
    useOffline: () => offlineState,
}));

vi.mock("../hooks/useDashboardStats", () => ({
    useDashboardStats: () => dashboardState,
}));

// Mock recharts responsive container for jsdom
vi.mock("recharts", async () => {
    const actual = await vi.importActual("recharts");
    return {
        ...actual,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
            <div style={{ width: 400, height: 300 }}>{children}</div>
        ),
    };
});

describe("DashboardHome", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        offlineState.isOnline = true;
        offlineState.pendingSyncCount = 0;
        dashboardState.loading = false;
    });

    it("renders loading spinner when data is loading", () => {
        dashboardState.loading = true;

        render(
            <BrowserRouter>
                <DashboardHome />
            </BrowserRouter>,
        );

        expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("renders stat cards, recent screenings, and quick actions", () => {
        render(
            <BrowserRouter>
                <DashboardHome />
            </BrowserRouter>,
        );

        expect(screen.getByText("Total Patients")).toBeInTheDocument();
        expect(screen.getByText("120")).toBeInTheDocument();
        expect(screen.getByText("Total Screenings")).toBeInTheDocument();
        expect(screen.getAllByText("250").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("High Risk Cases")).toBeInTheDocument();
        expect(screen.getByText("Aarav Sharma")).toBeInTheDocument();
        expect(screen.getByText("New Screening")).toBeInTheDocument();
    });

    it("shows offline sync banner when offline or pending sync items exist", () => {
        offlineState.isOnline = false;
        offlineState.pendingSyncCount = 3;

        render(
            <BrowserRouter>
                <DashboardHome />
            </BrowserRouter>,
        );

        expect(screen.getByText("You're Offline")).toBeInTheDocument();
    });

    it("triggers navigation when New Screening button is clicked", async () => {
        const user = userEvent.setup();

        render(
            <BrowserRouter>
                <DashboardHome />
            </BrowserRouter>,
        );

        const newScreeningBtn = screen.getByRole("button", { name: /New Screening/i });
        await user.click(newScreeningBtn);

        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/screen");
    });
});
