/**
 * Turn a validated wizard form into the documents written to Firestore.
 *
 * Keeping this separate from the wizard component means the shape of what gets
 * persisted can be asserted directly, without rendering six steps of UI.
 */
import type { Patient, Screening } from "../services/firestoreService";
import type { ScreeningFormData } from "./schemas";
import { stripUndefined } from "./schemas";
import type { RiskResult } from "./riskUtils";

/** Measurement fields carried from the form onto the screening document. */
const MEASUREMENT_FIELDS = [
    "height_cm",
    "weight_kg",
    "systolic_bp",
    "diastolic_bp",
    "heart_rate",
    "smoking_status",
    "alcohol_usage",
    "physical_activity",
    "glucose_level",
    "cholesterol_level",
    "hemoglobin",
    "rbc_count",
    "wbc_count",
    "platelet_count",
    "blood_urea_nitrogen",
    "creatinine",
    "sodium",
    "potassium",
    "chloride",
    "calcium",
    "alt_sgpt",
    "ast_sgot",
    "albumin",
    "total_bilirubin",
] as const;

/** Build the patient document from the demographics step. */
export function buildPatientPayload(
    form: ScreeningFormData,
    healthWorkerId?: string,
): Omit<Patient, "id" | "created_at"> {
    return stripUndefined({
        full_name: form.full_name,
        age: form.age,
        gender: form.gender,
        village: form.village,
        phone: form.phone,
        health_worker_id: healthWorkerId,
    }) as Omit<Patient, "id" | "created_at">;
}

/**
 * Build the screening document.
 *
 * Measurements that were never taken are dropped rather than written as zero,
 * so an untaken reading is never mistaken for a real one.
 */
export function buildScreeningPayload(
    form: ScreeningFormData,
    patientId: string,
    risk: RiskResult,
): Omit<Screening, "id" | "created_at"> {
    const measurements: Record<string, unknown> = {};
    for (const field of MEASUREMENT_FIELDS) {
        measurements[field] = form[field];
    }

    return stripUndefined({
        ...measurements,
        patient_id: patientId,
        patient_name: form.full_name,
        risk_score: risk.score,
        risk_level: risk.level,
        risk_notes: risk.notes,
    }) as Omit<Screening, "id" | "created_at">;
}

/** Build the payload posted to the backend's /api/ai/analyze endpoint. */
export function buildAnalysisPayload(
    form: ScreeningFormData,
    screening: Omit<Screening, "id" | "created_at">,
): Record<string, unknown> {
    return {
        ...screening,
        age: form.age,
        gender: form.gender,
    };
}
