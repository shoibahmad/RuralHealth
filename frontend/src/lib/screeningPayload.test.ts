import { describe, expect, it } from "vitest";

import {
    buildAnalysisPayload,
    buildPatientPayload,
    buildScreeningPayload,
} from "./screeningPayload";
import { validateScreeningForm, type ScreeningFormData } from "./schemas";
import type { RiskResult } from "./riskUtils";

const risk: RiskResult = { score: 3, level: "Medium", notes: "Systolic BP > 130 (+1)" };

/** Parse a raw wizard form the same way the wizard does before submitting. */
const parseForm = (overrides: Record<string, unknown> = {}): ScreeningFormData => {
    const result = validateScreeningForm({
        full_name: "Ramesh Kumar",
        age: "52",
        gender: "Male",
        village: "Chandpur",
        phone: "9876543210",
        ...overrides,
    });

    if (!result.success || !result.data) {
        throw new Error(`fixture failed validation: ${JSON.stringify(result.errors)}`);
    }
    return result.data;
};

describe("buildPatientPayload", () => {
    it("carries the demographics and the owning health worker", () => {
        expect(buildPatientPayload(parseForm(), "worker-1")).toEqual({
            full_name: "Ramesh Kumar",
            age: 52,
            gender: "Male",
            village: "Chandpur",
            phone: "9876543210",
            health_worker_id: "worker-1",
        });
    });

    it("omits the health worker for a self-screening patient", () => {
        const payload = buildPatientPayload(parseForm());

        expect(payload).not.toHaveProperty("health_worker_id");
    });

    it("omits a phone number that was never entered", () => {
        const payload = buildPatientPayload(parseForm({ phone: "" }), "worker-1");

        expect(payload).not.toHaveProperty("phone");
    });
});

describe("buildScreeningPayload", () => {
    it("carries the measurements that were taken", () => {
        const payload = buildScreeningPayload(
            parseForm({ systolic_bp: "138", diastolic_bp: "88", hemoglobin: "13.4" }),
            "patient-1",
            risk,
        );

        expect(payload).toMatchObject({
            patient_id: "patient-1",
            patient_name: "Ramesh Kumar",
            systolic_bp: 138,
            diastolic_bp: 88,
            hemoglobin: 13.4,
        });
    });

    it("attaches the computed risk result", () => {
        const payload = buildScreeningPayload(parseForm(), "patient-1", risk);

        expect(payload.risk_score).toBe(3);
        expect(payload.risk_level).toBe("Medium");
        expect(payload.risk_notes).toBe("Systolic BP > 130 (+1)");
    });

    it("omits every measurement that was not taken", () => {
        const payload = buildScreeningPayload(parseForm(), "patient-1", risk);

        expect(payload).not.toHaveProperty("systolic_bp");
        expect(payload).not.toHaveProperty("glucose_level");
        expect(payload).not.toHaveProperty("hemoglobin");
    });

    it("never writes an untaken reading as zero", () => {
        const payload = buildScreeningPayload(
            parseForm({ systolic_bp: "" }),
            "patient-1",
            risk,
        ) as Record<string, unknown>;

        expect(payload.systolic_bp).toBeUndefined();
        expect(Object.values(payload)).not.toContain(0);
    });

    it("keeps a genuine zero risk score", () => {
        const payload = buildScreeningPayload(parseForm(), "patient-1", {
            score: 0,
            level: "Low",
            notes: "No significant risk factors identified.",
        });

        expect(payload.risk_score).toBe(0);
    });

    it("carries the full lab panel when it was entered", () => {
        const payload = buildScreeningPayload(
            parseForm({
                creatinine: "1.1",
                sodium: "139",
                potassium: "4.2",
                alt_sgpt: "32",
                total_bilirubin: "0.8",
            }),
            "patient-1",
            risk,
        );

        expect(payload).toMatchObject({
            creatinine: 1.1,
            sodium: 139,
            potassium: 4.2,
            alt_sgpt: 32,
            total_bilirubin: 0.8,
        });
    });
});

describe("buildAnalysisPayload", () => {
    it("adds the demographics the AI prompt needs", () => {
        const form = parseForm({ systolic_bp: "138" });
        const screening = buildScreeningPayload(form, "patient-1", risk);

        const payload = buildAnalysisPayload(form, screening);

        expect(payload.age).toBe(52);
        expect(payload.gender).toBe("Male");
        expect(payload.systolic_bp).toBe(138);
        expect(payload.risk_level).toBe("Medium");
    });
});
