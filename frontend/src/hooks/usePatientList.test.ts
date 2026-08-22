import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePatientList } from "./usePatientList";
import { firestoreService, type Patient } from "../services/firestoreService";

vi.mock("../services/firestoreService", () => ({
    firestoreService: {
        getPatients: vi.fn(),
        deletePatient: vi.fn(),
        updatePatient: vi.fn(),
    },
}));

const mockPatients: Patient[] = [
    {
        id: "p1",
        full_name: "Anita Sharma",
        age: 34,
        gender: "Female",
        village: "Rampur",
        phone: "+919876543210",
        created_at: "2026-01-01T10:00:00Z",
        latest_risk_level: "High",
        screening_count: 2,
    },
    {
        id: "p2",
        full_name: "Rahul Verma",
        age: 45,
        gender: "Male",
        village: "Shyampur",
        phone: "+919876543211",
        created_at: "2026-01-02T10:00:00Z",
        latest_risk_level: "Low",
        screening_count: 1,
    },
    {
        id: "p3",
        full_name: "Sunita Devi",
        age: 52,
        gender: "Female",
        village: "Rampur",
        phone: "+919876543212",
        created_at: "2026-01-03T10:00:00Z",
        latest_risk_level: "Medium",
        screening_count: 3,
    },
];

describe("usePatientList hook", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(firestoreService.getPatients).mockResolvedValue(mockPatients);
    });

    it("fetches and returns all patients on mount", async () => {
        const { result } = renderHook(() => usePatientList());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.patients).toHaveLength(3);
        expect(result.current.totalCount).toBe(3);
        expect(result.current.error).toBeNull();
    });

    it("filters patients by search term (name, village, phone)", async () => {
        const { result } = renderHook(() => usePatientList());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Search by name
        act(() => {
            result.current.setSearchTerm("Anita");
        });
        expect(result.current.patients).toHaveLength(1);
        expect(result.current.patients[0].full_name).toBe("Anita Sharma");

        // Search by village
        act(() => {
            result.current.setSearchTerm("Rampur");
        });
        expect(result.current.patients).toHaveLength(2);

        // Search by phone
        act(() => {
            result.current.setSearchTerm("3211");
        });
        expect(result.current.patients).toHaveLength(1);
        expect(result.current.patients[0].full_name).toBe("Rahul Verma");
    });

    it("filters patients by risk level", async () => {
        const { result } = renderHook(() => usePatientList());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.setRiskFilter("High");
        });
        expect(result.current.patients).toHaveLength(1);
        expect(result.current.patients[0].latest_risk_level).toBe("High");

        act(() => {
            result.current.setRiskFilter("Low");
        });
        expect(result.current.patients).toHaveLength(1);
        expect(result.current.patients[0].latest_risk_level).toBe("Low");
    });

    it("combines search term and risk filter", async () => {
        const { result } = renderHook(() => usePatientList());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.setSearchTerm("Rampur");
            result.current.setRiskFilter("High");
        });

        expect(result.current.patients).toHaveLength(1);
        expect(result.current.patients[0].full_name).toBe("Anita Sharma");
    });

    it("supports pagination with pageSize and page navigation", async () => {
        const { result } = renderHook(() =>
            usePatientList({ pageSize: 2, initialPage: 1 }),
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.totalCount).toBe(3);
        expect(result.current.totalPages).toBe(2);
        expect(result.current.patients).toHaveLength(2);
        expect(result.current.patients[0].id).toBe("p1");
        expect(result.current.patients[1].id).toBe("p2");

        act(() => {
            result.current.setPage(2);
        });

        expect(result.current.patients).toHaveLength(1);
        expect(result.current.patients[0].id).toBe("p3");
    });

    it("handles successful patient deletion", async () => {
        vi.mocked(firestoreService.deletePatient).mockResolvedValue(undefined);

        const { result } = renderHook(() => usePatientList());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        let success = false;
        await act(async () => {
            success = await result.current.deletePatient("p1");
        });

        expect(success).toBe(true);
        expect(firestoreService.deletePatient).toHaveBeenCalledWith("p1");
        expect(result.current.patients).toHaveLength(2);
        expect(result.current.patients.find((p) => p.id === "p1")).toBeUndefined();
    });

    it("handles deletion errors gracefully", async () => {
        vi.mocked(firestoreService.deletePatient).mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => usePatientList());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        let success = true;
        await act(async () => {
            success = await result.current.deletePatient("p1");
        });

        expect(success).toBe(false);
        expect(result.current.error).toBe("Network error");
        expect(result.current.patients).toHaveLength(3);
    });

    it("handles successful patient update", async () => {
        vi.mocked(firestoreService.updatePatient).mockResolvedValue({
            id: "p2",
            full_name: "Rahul Verma",
            village: "New Village",
        });

        const { result } = renderHook(() => usePatientList());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        let success = false;
        await act(async () => {
            success = await result.current.updatePatient("p2", { village: "New Village" });
        });

        expect(success).toBe(true);
        expect(firestoreService.updatePatient).toHaveBeenCalledWith("p2", { village: "New Village" });
        expect(result.current.patients.find((p) => p.id === "p2")?.village).toBe("New Village");
    });

    it("handles update errors gracefully", async () => {
        vi.mocked(firestoreService.updatePatient).mockRejectedValue(new Error("Update failed"));

        const { result } = renderHook(() => usePatientList());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        let success = true;
        await act(async () => {
            success = await result.current.updatePatient("p2", { village: "New Village" });
        });

        expect(success).toBe(false);
        expect(result.current.error).toBe("Update failed");
    });

    it("handles fetch errors gracefully", async () => {
        vi.mocked(firestoreService.getPatients).mockRejectedValue(new Error("Failed to load"));

        const { result } = renderHook(() => usePatientList());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe("Failed to load");
        expect(result.current.patients).toHaveLength(0);
    });
});
