import { describe, expect, it } from "vitest";

import {
    LabResultsSchema,
    LifestyleSchema,
    PatientDemographicsSchema,
    VitalsSchema,
    stripUndefined,
    validate,
    validateScreeningForm,
} from "./schemas";

const validDemographics = {
    full_name: "Ramesh Kumar",
    age: "52",
    gender: "Male",
    village: "Chandpur",
    phone: "9876543210",
};

describe("PatientDemographicsSchema", () => {
    it("accepts a complete demographics block and coerces age", () => {
        const result = validate(PatientDemographicsSchema, validDemographics);

        expect(result.success).toBe(true);
        expect(result.data?.age).toBe(52);
        expect(result.data?.full_name).toBe("Ramesh Kumar");
    });

    it("trims surrounding whitespace from the name and village", () => {
        const result = validate(PatientDemographicsSchema, {
            ...validDemographics,
            full_name: "  Ramesh Kumar  ",
            village: "  Chandpur  ",
        });

        expect(result.data?.full_name).toBe("Ramesh Kumar");
        expect(result.data?.village).toBe("Chandpur");
    });

    it("rejects a blank name", () => {
        const result = validate(PatientDemographicsSchema, {
            ...validDemographics,
            full_name: "   ",
        });

        expect(result.success).toBe(false);
        expect(result.errors.full_name).toBe("Patient name is required");
    });

    it("rejects a missing village", () => {
        const result = validate(PatientDemographicsSchema, {
            ...validDemographics,
            village: "",
        });

        expect(result.success).toBe(false);
        expect(result.errors.village).toBeDefined();
    });

    it.each([-1, 131, 500])("rejects an implausible age of %s", (age) => {
        const result = validate(PatientDemographicsSchema, { ...validDemographics, age });

        expect(result.success).toBe(false);
        expect(result.errors.age).toBe("Age must be between 0 and 130");
    });

    it("rejects a non-numeric age", () => {
        const result = validate(PatientDemographicsSchema, {
            ...validDemographics,
            age: "fifty",
        });

        expect(result.success).toBe(false);
        expect(result.errors.age).toBeDefined();
    });

    it("rejects an unknown gender", () => {
        const result = validate(PatientDemographicsSchema, {
            ...validDemographics,
            gender: "Unknown",
        });

        expect(result.success).toBe(false);
        expect(result.errors.gender).toBeDefined();
    });

    it.each(["abc", "12", "'; drop table patients"])(
        "rejects the malformed phone number %s",
        (phone) => {
            const result = validate(PatientDemographicsSchema, {
                ...validDemographics,
                phone,
            });

            expect(result.success).toBe(false);
            expect(result.errors.phone).toContain("valid phone number");
        },
    );

    it("accepts an international phone number", () => {
        const result = validate(PatientDemographicsSchema, {
            ...validDemographics,
            phone: "+91 98765-43210",
        });

        expect(result.success).toBe(true);
    });

    it("treats an empty phone as absent rather than invalid", () => {
        const result = validate(PatientDemographicsSchema, {
            ...validDemographics,
            phone: "",
        });

        expect(result.success).toBe(true);
        expect(result.data?.phone).toBeUndefined();
    });
});

describe("VitalsSchema", () => {
    it("coerces numeric strings", () => {
        const result = validate(VitalsSchema, {
            height_cm: "170",
            weight_kg: "68.5",
            systolic_bp: "118",
            diastolic_bp: "76",
            heart_rate: "72",
        });

        expect(result.success).toBe(true);
        expect(result.data?.height_cm).toBe(170);
        expect(result.data?.weight_kg).toBe(68.5);
    });

    it("treats empty strings as not measured rather than zero", () => {
        const result = validate(VitalsSchema, {
            height_cm: "",
            weight_kg: "",
            systolic_bp: "",
            diastolic_bp: "",
            heart_rate: "",
        });

        expect(result.success).toBe(true);
        expect(result.data?.height_cm).toBeUndefined();
        expect(result.data?.systolic_bp).toBeUndefined();
    });

    it.each([
        ["systolic_bp", 500],
        ["systolic_bp", 10],
        ["diastolic_bp", 400],
        ["heart_rate", 0],
        ["heart_rate", 900],
        ["height_cm", 5],
        ["height_cm", 400],
        ["weight_kg", 900],
    ])("rejects %s of %s", (field, value) => {
        const result = validate(VitalsSchema, { [field]: value });

        expect(result.success).toBe(false);
        expect(result.errors[field]).toContain("must be between");
    });

    it("rejects a non-numeric reading", () => {
        const result = validate(VitalsSchema, { systolic_bp: "high" });

        expect(result.success).toBe(false);
        expect(result.errors.systolic_bp).toBe("Systolic BP must be a number");
    });
});

describe("LifestyleSchema", () => {
    it("accepts the known choices", () => {
        const result = validate(LifestyleSchema, {
            smoking_status: "Current",
            alcohol_usage: "Moderate",
            physical_activity: "Sedentary",
        });

        expect(result.success).toBe(true);
        expect(result.data?.smoking_status).toBe("Current");
    });

    it("treats unanswered questions as absent", () => {
        const result = validate(LifestyleSchema, {
            smoking_status: "",
            alcohol_usage: "",
            physical_activity: "",
        });

        expect(result.success).toBe(true);
        expect(result.data?.smoking_status).toBeUndefined();
    });

    it("rejects an unknown smoking status", () => {
        const result = validate(LifestyleSchema, { smoking_status: "Sometimes" });

        expect(result.success).toBe(false);
        expect(result.errors.smoking_status).toContain("must be one of");
    });
});

describe("LabResultsSchema", () => {
    it("accepts a full panel", () => {
        const result = validate(LabResultsSchema, {
            glucose_level: "110",
            hemoglobin: "13.4",
            creatinine: "1.1",
            sodium: "139",
            alt_sgpt: "32",
            total_bilirubin: "0.8",
        });

        expect(result.success).toBe(true);
        expect(result.data?.hemoglobin).toBe(13.4);
    });

    it.each([
        ["glucose_level", 99999],
        ["hemoglobin", 500],
        ["sodium", 5],
        ["potassium", 200],
        ["creatinine", 0.001],
    ])("rejects %s of %s", (field, value) => {
        const result = validate(LabResultsSchema, { [field]: value });

        expect(result.success).toBe(false);
        expect(result.errors[field]).toBeDefined();
    });
});

describe("ScreeningFormSchema", () => {
    it("accepts a full wizard payload", () => {
        const result = validateScreeningForm({
            ...validDemographics,
            height_cm: "170",
            weight_kg: "68",
            systolic_bp: "118",
            diastolic_bp: "76",
            heart_rate: "72",
            smoking_status: "Never",
            physical_activity: "Moderate",
            glucose_level: "95",
        });

        expect(result.success).toBe(true);
        expect(result.errors).toEqual({});
    });

    it("accepts demographics alone when nothing was measured", () => {
        const result = validateScreeningForm(validDemographics);

        expect(result.success).toBe(true);
    });

    it("rejects diastolic pressure at or above systolic", () => {
        const result = validateScreeningForm({
            ...validDemographics,
            systolic_bp: "120",
            diastolic_bp: "130",
        });

        expect(result.success).toBe(false);
        expect(result.errors.diastolic_bp).toBe("Diastolic pressure must be lower than systolic");
    });

    it("allows an equal-looking pair only when systolic is higher", () => {
        const result = validateScreeningForm({
            ...validDemographics,
            systolic_bp: "121",
            diastolic_bp: "120",
        });

        expect(result.success).toBe(true);
    });

    it("reports the first error per field", () => {
        const result = validateScreeningForm({
            full_name: "",
            age: "999",
            gender: "Unknown",
            village: "",
        });

        expect(result.success).toBe(false);
        expect(Object.keys(result.errors).sort()).toEqual([
            "age",
            "full_name",
            "gender",
            "village",
        ]);
    });

    it("does not expose parsed data when validation fails", () => {
        const result = validateScreeningForm({ ...validDemographics, age: "999" });

        expect(result.data).toBeUndefined();
    });

    it("ignores unknown keys the wizard carries internally", () => {
        const result = validateScreeningForm({
            ...validDemographics,
            _ocr_extracted_name: "Ramesh Kumar",
        });

        expect(result.success).toBe(true);
        expect(result.data).not.toHaveProperty("_ocr_extracted_name");
    });
});

describe("stripUndefined", () => {
    it("removes undefined values that Firestore would reject", () => {
        expect(stripUndefined({ a: 1, b: undefined, c: "x", d: null })).toEqual({
            a: 1,
            c: "x",
            d: null,
        });
    });

    it("keeps falsy values that are genuine readings", () => {
        expect(stripUndefined({ score: 0, notes: "" })).toEqual({ score: 0, notes: "" });
    });

    it("returns an empty object when everything is undefined", () => {
        expect(stripUndefined({ a: undefined, b: undefined })).toEqual({});
    });
});
