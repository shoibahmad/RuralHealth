/**
 * Mapping helpers for AI-extracted screening data.
 *
 * The lab-report OCR and speech-transcription endpoints return loosely shaped
 * JSON: keys may be nested under section headings, use alternate names, or
 * carry blood pressure as a single "120/80" string. These helpers normalise all
 * of that into the flat, string-valued shape the wizard form holds.
 */

export type OcrValue = string | number | boolean | null | undefined;
export type FlatOcrData = Record<string, OcrValue>;

/** Alternate key -> canonical form field. */
export const FIELD_ALIASES: Record<string, string> = {
    patient_name: "full_name",
    fullname: "full_name",
    patient: "full_name",
    name: "full_name",
    height: "height_cm",
    weight: "weight_kg",
    pulse: "heart_rate",
    heartrate: "heart_rate",
    heart_beat: "heart_rate",
    cholesterol: "cholesterol_level",
    glucose: "glucose_level",
    sugar: "glucose_level",
    hb: "hemoglobin",
};

/** Keys that may carry a combined "systolic/diastolic" reading. */
const BLOOD_PRESSURE_KEYS = ["blood_pressure", "bp", "systolic_over_diastolic"];

/** Values the model uses to mean "absent" that must not overwrite a real entry. */
const EMPTY_VALUES = new Set(["", "null", "n/a", "na", "none", "-", "--"]);

const isEmpty = (value: OcrValue): boolean =>
    value === null ||
    value === undefined ||
    (typeof value === "string" && EMPTY_VALUES.has(value.trim().toLowerCase()));

/**
 * Collapse a nested object into a single level.
 *
 * The model often groups results under headings ("Demographics", "Liver"), so
 * `{ Liver: { albumin: 4 } }` has to become `{ albumin: 4 }`. Arrays are kept
 * whole because no form field expects one.
 */
export function flattenObject(obj: unknown): FlatOcrData {
    let flattened: FlatOcrData = {};

    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
        return flattened;
    }

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            flattened = { ...flattened, ...flattenObject(value) };
        } else {
            flattened[key] = value as OcrValue;
        }
    }

    return flattened;
}

/**
 * Split a combined blood-pressure reading.
 *
 * Returns `null` when the value does not hold two numbers, so the caller can
 * leave the existing systolic/diastolic entries untouched.
 */
export function parseBloodPressure(
    value: OcrValue,
): { systolic: string; diastolic: string } | null {
    if (typeof value !== "string" || isEmpty(value)) return null;

    const parts = value
        .split(/[/\s]+/)
        .map((part) => part.trim())
        .filter((part) => part !== "" && !Number.isNaN(Number(part)));

    if (parts.length < 2) return null;

    return { systolic: parts[0], diastolic: parts[1] };
}

/** Pull the patient name out of extracted data, trying each known alias. */
export function extractPatientName(data: FlatOcrData): string {
    for (const key of ["full_name", "patient_name", "fullname", "name"]) {
        const value = data[key];
        if (!isEmpty(value)) return String(value).trim();
    }
    return "";
}

export interface OcrMappingResult<T> {
    /** The form data with extracted values merged in. */
    data: T;
    /** True when at least one field was populated. */
    applied: boolean;
}

/**
 * Merge AI-extracted values into the current form state.
 *
 * Only keys the form already knows about are written, so stray model output
 * cannot inject arbitrary fields. Direct matches win over aliases, and aliases
 * only fill fields that are still blank.
 */
export function applyOcrData<T extends Record<string, unknown>>(
    current: T,
    incoming: unknown,
): OcrMappingResult<T> {
    const flat = flattenObject(incoming);
    const updated = { ...current } as Record<string, unknown>;
    let applied = false;

    // 1. Direct key matches.
    for (const [key, value] of Object.entries(flat)) {
        if (isEmpty(value)) continue;
        if (Object.prototype.hasOwnProperty.call(updated, key)) {
            updated[key] = String(value);
            applied = true;
        }
    }

    // 2. Aliases, which only fill fields still left blank.
    for (const [alias, target] of Object.entries(FIELD_ALIASES)) {
        const value = flat[alias];
        if (isEmpty(value)) continue;
        if (!Object.prototype.hasOwnProperty.call(updated, target)) continue;
        if (updated[target]) continue;

        updated[target] = String(value);
        applied = true;
    }

    // 3. Combined blood pressure readings.
    for (const key of BLOOD_PRESSURE_KEYS) {
        const parsed = parseBloodPressure(flat[key]);
        if (!parsed) continue;

        updated.systolic_bp = parsed.systolic;
        updated.diastolic_bp = parsed.diastolic;
        applied = true;
        break;
    }

    return { data: updated as T, applied };
}

/**
 * Unwrap an extraction response.
 *
 * The backend returns `{success, data}` while some paths return the fields
 * directly, so both shapes have to be accepted.
 */
export function unwrapExtractionResponse(response: unknown): {
    ok: boolean;
    payload: unknown;
    error?: string;
} {
    if (typeof response !== "object" || response === null) {
        return { ok: false, payload: {}, error: "Empty response" };
    }

    const envelope = response as { success?: boolean; data?: unknown; error?: string };

    if (envelope.success === false) {
        return { ok: false, payload: {}, error: envelope.error };
    }

    return { ok: true, payload: envelope.data ?? response };
}
