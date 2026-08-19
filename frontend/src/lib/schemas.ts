import { z } from "zod";

/**
 * Validation schemas for screening data.
 *
 * The wizard collects every field as a string (form inputs, OCR output and
 * speech transcription all arrive as text), so these schemas coerce and
 * range-check before anything is written to Firestore. Bounds mirror the
 * server-side checks in backend/api/serializers.py so the two agree.
 */

export const GENDERS = ["Male", "Female", "Other"] as const;
export const SMOKING_STATUSES = ["Never", "Former", "Current"] as const;
export const ALCOHOL_USAGES = ["None", "Occasional", "Moderate", "Heavy", "Frequent"] as const;
export const PHYSICAL_ACTIVITIES = ["Sedentary", "Low", "Moderate", "High", "Active"] as const;
export const RISK_LEVELS = ["Low", "Medium", "High"] as const;

export type Gender = (typeof GENDERS)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

/** Digits with optional country code and the usual separators. */
const PHONE_PATTERN = /^\+?[0-9][0-9\s\-()]{5,19}$/;

/**
 * Build an optional numeric field that accepts the empty string.
 *
 * Wizard inputs start out as "", which must mean "not measured" rather than
 * zero — `Number("")` is 0, so a plain coercion would invent readings.
 */
const optionalNumber = (min: number, max: number, label: string) =>
    z
        .union([z.string(), z.number(), z.null(), z.undefined()])
        .transform((value) => {
            if (value === "" || value === null || value === undefined) return undefined;
            const parsed = typeof value === "number" ? value : Number(value);
            return Number.isNaN(parsed) ? NaN : parsed;
        })
        .refine((value) => value === undefined || !Number.isNaN(value), {
            message: `${label} must be a number`,
        })
        .refine((value) => value === undefined || (value >= min && value <= max), {
            message: `${label} must be between ${min} and ${max}`,
        })
        // Zod cannot see through a transform chain to infer optionality, so the
        // key has to be marked optional explicitly or it reads as required.
        .optional();

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T, label: string) =>
    z
        .union([z.string(), z.null(), z.undefined()])
        .transform((value) => (value === "" || value === null ? undefined : value))
        .refine((value) => value === undefined || values.includes(value as T[number]), {
            message: `${label} must be one of: ${values.join(", ")}`,
        })
        .transform((value) => value as T[number] | undefined)
        .optional();

export const PatientDemographicsSchema = z.object({
    full_name: z
        .string()
        .trim()
        .min(1, "Patient name is required")
        .max(255, "Patient name is too long"),
    age: z
        .union([z.string(), z.number()])
        .transform((value) => (typeof value === "number" ? value : Number(value)))
        .refine((value) => Number.isInteger(value), { message: "Age must be a whole number" })
        .refine((value) => value >= 0 && value <= 130, {
            message: "Age must be between 0 and 130",
        }),
    gender: z.enum(GENDERS, { message: "Select a gender" }),
    village: z.string().trim().min(1, "Village is required").max(255),
    phone: z
        .union([z.string(), z.null(), z.undefined()])
        .transform((value) => {
            const trimmed = (value ?? "").trim();
            return trimmed === "" ? undefined : trimmed;
        })
        .refine((value) => value === undefined || PHONE_PATTERN.test(value), {
            message: "Enter a valid phone number (6-20 digits, optional +country code)",
        })
        .optional(),
});

export const VitalsSchema = z.object({
    height_cm: optionalNumber(30, 275, "Height"),
    weight_kg: optionalNumber(1, 500, "Weight"),
    systolic_bp: optionalNumber(40, 300, "Systolic BP"),
    diastolic_bp: optionalNumber(20, 200, "Diastolic BP"),
    heart_rate: optionalNumber(20, 250, "Heart rate"),
});

export const LifestyleSchema = z.object({
    smoking_status: optionalEnum(SMOKING_STATUSES, "Smoking status"),
    alcohol_usage: optionalEnum(ALCOHOL_USAGES, "Alcohol usage"),
    physical_activity: optionalEnum(PHYSICAL_ACTIVITIES, "Physical activity"),
});

export const LabResultsSchema = z.object({
    glucose_level: optionalNumber(10, 1500, "Glucose"),
    cholesterol_level: optionalNumber(10, 1000, "Cholesterol"),
    hemoglobin: optionalNumber(1, 30, "Hemoglobin"),
    rbc_count: optionalNumber(0.5, 15, "RBC count"),
    wbc_count: optionalNumber(0.1, 200, "WBC count"),
    platelet_count: optionalNumber(1, 2000, "Platelet count"),
    blood_urea_nitrogen: optionalNumber(1, 300, "Blood urea nitrogen"),
    creatinine: optionalNumber(0.1, 30, "Creatinine"),
    sodium: optionalNumber(80, 200, "Sodium"),
    potassium: optionalNumber(1, 15, "Potassium"),
    chloride: optionalNumber(50, 200, "Chloride"),
    calcium: optionalNumber(2, 20, "Calcium"),
    alt_sgpt: optionalNumber(1, 5000, "ALT (SGPT)"),
    ast_sgot: optionalNumber(1, 5000, "AST (SGOT)"),
    albumin: optionalNumber(0.5, 10, "Albumin"),
    total_bilirubin: optionalNumber(0.05, 60, "Total bilirubin"),
});

/**
 * The complete wizard payload.
 *
 * `superRefine` enforces the one cross-field rule: diastolic pressure has to
 * be below systolic, which no single field can check on its own.
 */
export const ScreeningFormSchema = PatientDemographicsSchema.extend(VitalsSchema.shape)
    .extend(LifestyleSchema.shape)
    .extend(LabResultsSchema.shape)
    .superRefine((data, ctx) => {
        const { systolic_bp: systolic, diastolic_bp: diastolic } = data;
        if (systolic !== undefined && diastolic !== undefined && diastolic >= systolic) {
            ctx.addIssue({
                code: "custom",
                path: ["diastolic_bp"],
                message: "Diastolic pressure must be lower than systolic",
            });
        }
    });

export type ScreeningFormInput = z.input<typeof ScreeningFormSchema>;
export type ScreeningFormData = z.output<typeof ScreeningFormSchema>;
export type PatientDemographics = z.output<typeof PatientDemographicsSchema>;
export type Vitals = z.output<typeof VitalsSchema>;

/**
 * Raw wizard form state.
 *
 * Every field is held as a string because inputs, OCR output and speech
 * transcription all arrive as text; ScreeningFormSchema coerces on submit.
 */
export type ScreeningFormValues = Record<string, string>;

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    /** Field name -> first error message, ready to render beside each input. */
    errors: Record<string, string>;
}

/**
 * Run a schema and flatten its issues into a field -> message map.
 *
 * Zod's native error shape is awkward to render next to form inputs; this keeps
 * the first message per field, which is what the wizard displays.
 */
export function validate<TSchema extends z.ZodType>(
    schema: TSchema,
    value: unknown,
): ValidationResult<z.output<TSchema>> {
    const result = schema.safeParse(value);

    if (result.success) {
        return { success: true, data: result.data, errors: {} };
    }

    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
        const field = issue.path.join(".") || "_form";
        if (!(field in errors)) {
            errors[field] = issue.message;
        }
    }

    return { success: false, errors };
}

/** Validate a full screening submission. */
export function validateScreeningForm(value: unknown): ValidationResult<ScreeningFormData> {
    return validate(ScreeningFormSchema, value);
}

/**
 * Strip keys whose value is `undefined`.
 *
 * Firestore rejects documents containing undefined, and optional measurements
 * legitimately end up undefined once the schema has parsed them.
 */
export function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(value).filter(([, entry]) => entry !== undefined),
    ) as Partial<T>;
}
