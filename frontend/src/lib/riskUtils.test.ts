import { describe, expect, it } from "vitest";

import { riskUtils } from "./riskUtils";

describe("calculateRisk", () => {
    it("scores an unremarkable profile as low risk", () => {
        const result = riskUtils.calculateRisk({ age: 30 });

        expect(result.score).toBe(0);
        expect(result.level).toBe("Low");
        expect(result.notes).toBe("No significant risk factors identified.");
    });

    it("adds a point for age over 50", () => {
        expect(riskUtils.calculateRisk({ age: 51 }).score).toBe(1);
    });

    it("does not add a point at exactly 50", () => {
        expect(riskUtils.calculateRisk({ age: 50 }).score).toBe(0);
    });

    it("adds two points for a smoker", () => {
        const result = riskUtils.calculateRisk({ age: 30, smoking_status: "smoker" });

        expect(result.score).toBe(2);
        expect(result.level).toBe("Medium");
    });

    it.each([
        [120, 0],
        [135, 1],
        [150, 2],
    ])("scores systolic %s as %s points", (systolic_bp, expected) => {
        expect(riskUtils.calculateRisk({ age: 30, systolic_bp }).score).toBe(expected);
    });

    it("adds a point for diastolic pressure over 90", () => {
        expect(riskUtils.calculateRisk({ age: 30, diastolic_bp: 95 }).score).toBe(1);
    });

    it("accumulates independent factors into a high-risk score", () => {
        const result = riskUtils.calculateRisk({
            age: 60,
            systolic_bp: 150,
            diastolic_bp: 95,
            smoking_status: "smoker",
        });

        expect(result.score).toBe(6);
        expect(result.level).toBe("High");
    });

    it.each([
        [0, "Low"],
        [1, "Low"],
        [2, "Medium"],
        [3, "Medium"],
        [4, "High"],
    ])("maps a score of %s to %s", (score, level) => {
        // Age alone contributes at most 1, so build the score from BP and smoking.
        const factors = { age: 30, systolic_bp: 0, diastolic_bp: 0 } as Record<
            string,
            number
        >;
        if (score >= 2) factors.systolic_bp = 150;
        if (score >= 3) factors.diastolic_bp = 95;

        const result = riskUtils.calculateRisk({
            age: score === 1 || score >= 4 ? 60 : 30,
            systolic_bp: factors.systolic_bp || undefined,
            diastolic_bp: factors.diastolic_bp || undefined,
            smoking_status: score >= 4 ? "smoker" : undefined,
        });

        expect(result.level).toBe(level);
    });

    it("lists every contributing factor in the notes", () => {
        const result = riskUtils.calculateRisk({
            age: 60,
            systolic_bp: 150,
            smoking_status: "smoker",
        });

        expect(result.notes).toContain("Age > 50");
        expect(result.notes).toContain("Smoker");
        expect(result.notes).toContain("Systolic BP > 140");
    });
});

describe("calculateBMI", () => {
    it("computes BMI to one decimal place", () => {
        expect(riskUtils.calculateBMI(170, 72.25)).toBe(25);
    });

    it("rounds to one decimal", () => {
        expect(riskUtils.calculateBMI(175, 80)).toBe(26.1);
    });

    it.each([
        [0, 70],
        [170, 0],
    ])("returns undefined for height %s and weight %s", (height, weight) => {
        expect(riskUtils.calculateBMI(height, weight)).toBeUndefined();
    });
});

describe("generateInsights", () => {
    it("states the risk level in the header", () => {
        const insights = riskUtils.generateInsights({ age: 40, riskLevel: "Medium" });

        expect(insights).toContain("**Medium Risk**");
    });

    it("calls out each abnormal observation", () => {
        const insights = riskUtils.generateInsights({
            age: 62,
            riskLevel: "High",
            bmi: 31.2,
            systolic_bp: 145,
            smoking_status: "smoker",
            glucose: 180,
        });

        expect(insights).toContain("Patient age (62)");
        expect(insights).toContain("BMI of 31.2");
        expect(insights).toContain("145 mmHg");
        expect(insights).toContain("Smoking history");
        expect(insights).toContain("180 mg/dL");
    });

    it("omits observations for values in range", () => {
        const insights = riskUtils.generateInsights({
            age: 30,
            riskLevel: "Low",
            bmi: 22,
            systolic_bp: 115,
            glucose: 90,
        });

        expect(insights).not.toContain("BMI of");
        expect(insights).not.toContain("hypertension");
        expect(insights).not.toContain("diabetes screening");
    });

    it("recommends immediate referral for high risk", () => {
        const insights = riskUtils.generateInsights({ age: 40, riskLevel: "High" });

        expect(insights).toContain("Immediate Referral");
    });

    it("recommends a one-month recheck for medium risk", () => {
        const insights = riskUtils.generateInsights({ age: 40, riskLevel: "Medium" });

        expect(insights).toContain("Re-screen in 1 month");
    });

    it("recommends routine follow-up for low risk", () => {
        const insights = riskUtils.generateInsights({ age: 40, riskLevel: "Low" });

        expect(insights).toContain("Routine check-up in 6 months");
    });
});
