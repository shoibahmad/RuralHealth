import { describe, expect, it } from "vitest";

import {
    applyOcrData,
    extractPatientName,
    flattenObject,
    parseBloodPressure,
    unwrapExtractionResponse,
} from "./ocrMapping";

const emptyForm = {
    full_name: "",
    age: "",
    gender: "",
    village: "",
    phone: "",
    height_cm: "",
    weight_kg: "",
    systolic_bp: "",
    diastolic_bp: "",
    heart_rate: "",
    glucose_level: "",
    cholesterol_level: "",
    hemoglobin: "",
    albumin: "",
};

describe("flattenObject", () => {
    it("returns a flat object unchanged", () => {
        expect(flattenObject({ age: 42, full_name: "Ramesh" })).toEqual({
            age: 42,
            full_name: "Ramesh",
        });
    });

    it("lifts values out of section headings", () => {
        expect(
            flattenObject({
                Demographics: { age: 42, gender: "Male" },
                Liver: { albumin: 4.1 },
            }),
        ).toEqual({ age: 42, gender: "Male", albumin: 4.1 });
    });

    it("flattens arbitrarily deep nesting", () => {
        expect(flattenObject({ a: { b: { c: { hemoglobin: 13 } } } })).toEqual({
            hemoglobin: 13,
        });
    });

    it("keeps arrays as single values rather than descending into them", () => {
        expect(flattenObject({ notes: ["one", "two"] })).toEqual({
            notes: ["one", "two"],
        });
    });

    it.each([null, undefined, "text", 42, ["a"]])(
        "returns an empty object for the non-object input %s",
        (input) => {
            expect(flattenObject(input)).toEqual({});
        },
    );
});

describe("parseBloodPressure", () => {
    it.each(["120/80", "120 / 80", "120 80"])("splits %s", (value) => {
        expect(parseBloodPressure(value)).toEqual({ systolic: "120", diastolic: "80" });
    });

    it.each([null, undefined, "", "null", "120", "high", 120])(
        "returns null for %s",
        (value) => {
            expect(parseBloodPressure(value)).toBeNull();
        },
    );
});

describe("extractPatientName", () => {
    it.each(["full_name", "patient_name", "fullname", "name"])(
        "reads the name from %s",
        (key) => {
            expect(extractPatientName({ [key]: "  Ramesh Kumar " })).toBe("Ramesh Kumar");
        },
    );

    it("prefers full_name over the aliases", () => {
        expect(
            extractPatientName({ full_name: "Canonical", patient_name: "Alias" }),
        ).toBe("Canonical");
    });

    it.each(["", "null", "N/A"])("treats the placeholder %s as no name", (value) => {
        expect(extractPatientName({ full_name: value })).toBe("");
    });

    it("returns an empty string when no name key is present", () => {
        expect(extractPatientName({ age: 42 })).toBe("");
    });
});

describe("applyOcrData", () => {
    it("fills matching fields and reports that data was applied", () => {
        const { data, applied } = applyOcrData(emptyForm, {
            full_name: "Ramesh Kumar",
            age: 52,
            hemoglobin: 13.4,
        });

        expect(applied).toBe(true);
        expect(data.full_name).toBe("Ramesh Kumar");
        expect(data.age).toBe("52");
        expect(data.hemoglobin).toBe("13.4");
    });

    it("coerces every value to a string for the form inputs", () => {
        const { data } = applyOcrData(emptyForm, { age: 52, albumin: 4.1 });

        expect(typeof data.age).toBe("string");
        expect(typeof data.albumin).toBe("string");
    });

    it("flattens section headings before matching", () => {
        const { data } = applyOcrData(emptyForm, {
            Demographics: { full_name: "Sunita" },
            Hematology: { hemoglobin: 12 },
        });

        expect(data.full_name).toBe("Sunita");
        expect(data.hemoglobin).toBe("12");
    });

    it("resolves aliases onto their canonical field", () => {
        const { data } = applyOcrData(emptyForm, {
            patient_name: "Ramesh",
            height: 170,
            pulse: 72,
            glucose: 95,
        });

        expect(data.full_name).toBe("Ramesh");
        expect(data.height_cm).toBe("170");
        expect(data.heart_rate).toBe("72");
        expect(data.glucose_level).toBe("95");
    });

    it("does not let an alias overwrite a field that already has a value", () => {
        const { data } = applyOcrData(
            { ...emptyForm, full_name: "Already Typed" },
            { patient_name: "From Report" },
        );

        expect(data.full_name).toBe("Already Typed");
    });

    it("lets a direct key match overwrite an existing value", () => {
        const { data } = applyOcrData(
            { ...emptyForm, full_name: "Already Typed" },
            { full_name: "From Report" },
        );

        expect(data.full_name).toBe("From Report");
    });

    it("splits a combined blood pressure reading", () => {
        const { data } = applyOcrData(emptyForm, { blood_pressure: "138/88" });

        expect(data.systolic_bp).toBe("138");
        expect(data.diastolic_bp).toBe("88");
    });

    it.each(["bp", "systolic_over_diastolic"])(
        "reads a combined reading from %s",
        (key) => {
            const { data } = applyOcrData(emptyForm, { [key]: "138/88" });

            expect(data.systolic_bp).toBe("138");
        },
    );

    it.each(["", "null", "N/A", "none", "-"])(
        "ignores the placeholder value %s",
        (value) => {
            const { data, applied } = applyOcrData(emptyForm, { full_name: value });

            expect(data.full_name).toBe("");
            expect(applied).toBe(false);
        },
    );

    it("ignores keys the form does not define", () => {
        const { data, applied } = applyOcrData(emptyForm, {
            unexpected_field: "surprise",
            __proto__: "polluted",
        });

        expect(data).not.toHaveProperty("unexpected_field");
        expect(applied).toBe(false);
    });

    it("reports applied=false when nothing matched", () => {
        const { applied } = applyOcrData(emptyForm, { totally_unknown: 1 });

        expect(applied).toBe(false);
    });

    it("does not mutate the form it was given", () => {
        const original = { ...emptyForm };

        applyOcrData(original, { full_name: "Ramesh" });

        expect(original.full_name).toBe("");
    });
});

describe("unwrapExtractionResponse", () => {
    it("unwraps a success envelope", () => {
        const result = unwrapExtractionResponse({ success: true, data: { age: 42 } });

        expect(result.ok).toBe(true);
        expect(result.payload).toEqual({ age: 42 });
    });

    it("accepts a flat response with no envelope", () => {
        const result = unwrapExtractionResponse({ age: 42 });

        expect(result.ok).toBe(true);
        expect(result.payload).toEqual({ age: 42 });
    });

    it("surfaces the error from a failure envelope", () => {
        const result = unwrapExtractionResponse({
            success: false,
            error: "model refused",
        });

        expect(result.ok).toBe(false);
        expect(result.error).toBe("model refused");
    });

    it.each([null, undefined, "text"])("rejects the malformed response %s", (input) => {
        expect(unwrapExtractionResponse(input).ok).toBe(false);
    });
});
