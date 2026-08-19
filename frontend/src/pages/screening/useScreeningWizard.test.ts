import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const showToast = vi.fn();
const authState: { user: Record<string, unknown> | null } = { user: null };

vi.mock("../../context/useAuth", () => ({
    useAuth: () => authState,
}));

vi.mock("../../context/useToast", () => ({
    useToast: () => ({ showToast }),
}));

vi.mock("../../services/firestoreService", () => ({
    firestoreService: {
        addPatient: vi.fn(),
        setPatient: vi.fn(),
        getPatient: vi.fn(),
        updatePatient: vi.fn(),
        addScreening: vi.fn(),
        updateScreening: vi.fn(),
    },
}));

import { firestoreService } from "../../services/firestoreService";
import { useScreeningWizard } from "./useScreeningWizard";

const service = vi.mocked(firestoreService);

/** Fill the wizard with a complete, valid demographics step. */
const fillValidForm = (
    result: { current: ReturnType<typeof useScreeningWizard> },
    overrides: Record<string, string> = {},
) => {
    act(() => {
        result.current.updateFormData({
            ...result.current.formData,
            full_name: "Ramesh Kumar",
            age: "52",
            gender: "Male",
            village: "Chandpur",
            phone: "9876543210",
            ...overrides,
        });
    });
};

beforeEach(() => {
    vi.clearAllMocks();
    authState.user = { uid: "worker-1", role: "health_worker", full_name: "Worker One" };

    service.addPatient.mockResolvedValue({
        id: "patient-1",
        full_name: "Ramesh Kumar",
        age: 52,
        gender: "Male",
        village: "Chandpur",
        created_at: "2026-01-01T00:00:00Z",
    });
    service.addScreening.mockResolvedValue({
        id: "screening-1",
        patient_id: "patient-1",
        risk_score: 0,
        risk_level: "Low",
        created_at: "2026-01-01T00:00:00Z",
    });
    service.getPatient.mockResolvedValue(null);
    service.updatePatient.mockResolvedValue({ id: "patient-1" });
    service.setPatient.mockResolvedValue({ id: "patient-1" });
    service.updateScreening.mockResolvedValue({ id: "screening-1" });

    // No AI backend in tests; a non-ok response is the documented fallback.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
});

describe("step navigation", () => {
    it("starts on the scan step", () => {
        const { result } = renderHook(() => useScreeningWizard());

        expect(result.current.currentStep).toBe(0);
        expect(result.current.isLastStep).toBe(false);
    });

    it("advances and retreats without leaving the range", () => {
        const { result } = renderHook(() => useScreeningWizard());

        act(() => result.current.prevStep());
        expect(result.current.currentStep).toBe(0);

        for (let i = 0; i < 10; i++) act(() => result.current.nextStep());
        expect(result.current.currentStep).toBe(5);
        expect(result.current.isLastStep).toBe(true);
    });

    it("skipping the scan jumps to the identity step and clears any notice", () => {
        const { result } = renderHook(() => useScreeningWizard());

        act(() => result.current.skipInitialScan());

        expect(result.current.currentStep).toBe(1);
        expect(result.current.nameNotice).toBeNull();
    });
});

describe("OCR handling", () => {
    it("applies extracted values and moves to verification", () => {
        const { result } = renderHook(() => useScreeningWizard());

        act(() => {
            result.current.handleOcrData(
                { success: true, data: { full_name: "Ramesh Kumar", age: 52 } },
                "en",
            );
        });

        expect(result.current.formData.full_name).toBe("Ramesh Kumar");
        expect(result.current.formData.age).toBe("52");
        expect(result.current.currentStep).toBe(1);
    });

    it("asks a health worker to verify the extracted name", () => {
        const { result } = renderHook(() => useScreeningWizard());

        act(() => {
            result.current.handleOcrData({ full_name: "Ramesh Kumar" }, "en");
        });

        expect(result.current.nameNotice).toEqual({
            extracted: "Ramesh Kumar",
            expected: "",
        });
    });

    it("warns a self-screening patient whose report names someone else", () => {
        authState.user = { uid: "u1", role: "patient", full_name: "Sunita Devi" };
        const { result } = renderHook(() => useScreeningWizard());

        act(() => {
            result.current.handleOcrData({ full_name: "Ramesh Kumar" }, "en");
        });

        expect(result.current.nameNotice).toEqual({
            extracted: "Ramesh Kumar",
            expected: "Sunita Devi",
        });
        expect(showToast).toHaveBeenCalledWith(
            expect.stringContaining("Report mismatch"),
            "error",
        );
    });

    it("reports a failed extraction without touching the form", () => {
        const { result } = renderHook(() => useScreeningWizard());

        act(() => {
            result.current.handleOcrData({ success: false, error: "unreadable" }, "en");
        });

        expect(result.current.formData.full_name).toBe("");
        expect(result.current.currentStep).toBe(0);
        expect(showToast).toHaveBeenCalledWith(
            expect.stringContaining("unreadable"),
            "error",
        );
    });

    it("says so when nothing readable was found", () => {
        const { result } = renderHook(() => useScreeningWizard());

        act(() => {
            result.current.handleOcrData({ irrelevant_key: "value" }, "en");
        });

        expect(showToast).toHaveBeenCalledWith(
            expect.stringContaining("No readable fields"),
            "error",
        );
    });

    it("dismisses the notice on request", () => {
        const { result } = renderHook(() => useScreeningWizard());

        act(() => result.current.handleOcrData({ full_name: "Ramesh" }, "en"));
        act(() => result.current.dismissNameNotice());

        expect(result.current.nameNotice).toBeNull();
    });
});

describe("submission", () => {
    it("creates the patient and the screening for a health worker", async () => {
        const { result } = renderHook(() => useScreeningWizard());
        fillValidForm(result, { systolic_bp: "150", diastolic_bp: "95" });

        await act(async () => {
            await result.current.submit();
        });

        expect(service.addPatient).toHaveBeenCalledWith(
            expect.objectContaining({
                full_name: "Ramesh Kumar",
                age: 52,
                health_worker_id: "worker-1",
            }),
        );
        expect(service.addScreening).toHaveBeenCalledWith(
            expect.objectContaining({
                patient_id: "patient-1",
                patient_name: "Ramesh Kumar",
                systolic_bp: 150,
                diastolic_bp: 95,
                // age 52 (+1), systolic > 140 (+2), diastolic > 90 (+1) = 4
                risk_score: 4,
                risk_level: "High",
            }),
        );
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("updates the patient's own profile when they screen themselves", async () => {
        authState.user = { uid: "patient-9", role: "patient", full_name: "Ramesh Kumar" };
        const { result } = renderHook(() => useScreeningWizard());
        fillValidForm(result);

        await act(async () => {
            await result.current.submit();
        });

        expect(service.setPatient).toHaveBeenCalledWith(
            "patient-9",
            expect.objectContaining({ full_name: "Ramesh Kumar" }),
        );
        expect(service.addPatient).not.toHaveBeenCalled();
    });

    it("increments the denormalised screening counter", async () => {
        service.getPatient.mockResolvedValue({
            id: "patient-1",
            full_name: "Ramesh Kumar",
            age: 52,
            gender: "Male",
            village: "Chandpur",
            created_at: "2026-01-01T00:00:00Z",
            screening_count: 3,
        });

        const { result } = renderHook(() => useScreeningWizard());
        fillValidForm(result);

        await act(async () => {
            await result.current.submit();
        });

        expect(service.updatePatient).toHaveBeenCalledWith("patient-1", {
            screening_count: 4,
            latest_risk_level: "Low",
        });
    });

    it("still records the screening when the counter update fails", async () => {
        service.updatePatient.mockRejectedValue(new Error("permission-denied"));

        const { result } = renderHook(() => useScreeningWizard());
        fillValidForm(result);

        await act(async () => {
            await result.current.submit();
        });

        expect(service.addScreening).toHaveBeenCalled();
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("does not write anything when the form is invalid", async () => {
        const { result } = renderHook(() => useScreeningWizard());
        fillValidForm(result, { age: "999" });

        await act(async () => {
            await result.current.submit();
        });

        expect(service.addPatient).not.toHaveBeenCalled();
        expect(service.addScreening).not.toHaveBeenCalled();
        expect(result.current.fieldErrors.age).toBeDefined();
        expect(result.current.error).toBeTruthy();
    });

    it("rejects a screening whose diastolic exceeds its systolic", async () => {
        const { result } = renderHook(() => useScreeningWizard());
        fillValidForm(result, { systolic_bp: "120", diastolic_bp: "130" });

        await act(async () => {
            await result.current.submit();
        });

        expect(service.addScreening).not.toHaveBeenCalled();
        expect(result.current.fieldErrors.diastolic_bp).toBeDefined();
    });

    it("omits vitals that were never entered", async () => {
        const { result } = renderHook(() => useScreeningWizard());
        fillValidForm(result);

        await act(async () => {
            await result.current.submit();
        });

        const payload = service.addScreening.mock.calls[0][0];
        expect(payload).not.toHaveProperty("systolic_bp");
        expect(payload).not.toHaveProperty("glucose_level");
    });

    it("reports a Firestore failure instead of claiming success", async () => {
        service.addPatient.mockRejectedValue(new Error("network unavailable"));

        const { result } = renderHook(() => useScreeningWizard());
        fillValidForm(result);

        await act(async () => {
            await result.current.submit();
        });

        expect(result.current.error).toBe("network unavailable");
        expect(result.current.isSuccess).toBe(false);
        expect(showToast).toHaveBeenCalledWith("network unavailable", "error");
    });

    it("opens the AI modal and stores the insights when analysis succeeds", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    success: true,
                    analysis: { summary: "Stable", formatted_insights: "**Overview**" },
                }),
            }),
        );

        const { result } = renderHook(() => useScreeningWizard());
        fillValidForm(result);

        let openedModal = false;
        await act(async () => {
            openedModal = await result.current.submit();
        });

        expect(openedModal).toBe(true);
        expect(result.current.isAiModalOpen).toBe(true);
        expect(result.current.aiAnalysis).toMatchObject({ summary: "Stable" });
        expect(service.updateScreening).toHaveBeenCalledWith("screening-1", {
            ai_insights: expect.objectContaining({ summary: "Stable" }),
        });
    });

    it("succeeds without the AI modal when the analysis endpoint is unreachable", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

        const { result } = renderHook(() => useScreeningWizard());
        fillValidForm(result);

        let openedModal = true;
        await act(async () => {
            openedModal = await result.current.submit();
        });

        expect(openedModal).toBe(false);
        expect(result.current.isAiModalOpen).toBe(false);
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
});
