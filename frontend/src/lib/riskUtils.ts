export interface RiskFactors {
    age: number;
    systolic_bp?: number;
    diastolic_bp?: number;
    smoking_status?: string;
    bmi?: number; // derived from height/weight
}

export interface RiskResult {
    score: number;
    level: 'Low' | 'Medium' | 'High';
    notes: string;
}

export const riskUtils = {
    calculateRisk(data: RiskFactors): RiskResult {
        let score = 0;
        const notes: string[] = [];

        // Age factor
        if (data.age > 50) {
            score += 1;
            notes.push("Age > 50 (+1)");
        }

        // Smoking
        if (data.smoking_status === 'smoker') {
            score += 2;
            notes.push("Smoker (+2)");
        }

        // Blood Pressure
        if (data.systolic_bp && data.systolic_bp > 140) {
            score += 2;
            notes.push("Systolic BP > 140 (+2)");
        } else if (data.systolic_bp && data.systolic_bp > 130) {
            score += 1;
            notes.push("Systolic BP > 130 (+1)");
        }

        if (data.diastolic_bp && data.diastolic_bp > 90) {
            score += 1;
            notes.push("Diastolic BP > 90 (+1)");
        }

        // Determine Level
        let level: 'Low' | 'Medium' | 'High' = 'Low';
        if (score >= 4) level = 'High';
        else if (score >= 2) level = 'Medium';

        return {
            score,
            level,
            notes: notes.join(", ") || "No significant risk factors identified."
        };
    },

    calculateBMI(heightCm: number, weightKg: number): number | undefined {
        if (!heightCm || !weightKg) return undefined;
        const heightM = heightCm / 100;
        const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
        return bmi;
    },

    generateInsights(data: RiskFactors & { riskLevel: string, bmi?: number, glucose?: number }): string {
        let insights = `**AI Health Assessment**\n\nBased on the screening data, the patient is categorized as **${data.riskLevel} Risk**.\n\n**Key Observations:**\n`;

        if (data.age > 50) insights += `- Patient age (${data.age}) increases susceptibility to chronic conditions.\n`;
        if (data.bmi && data.bmi > 25) insights += `- BMI of ${data.bmi} indicates overweight/obesity, a major risk factor.\n`;
        if (data.systolic_bp && data.systolic_bp > 130) insights += `- Elevated Systolic BP (${data.systolic_bp} mmHg) suggests hypertension.\n`;
        if (data.smoking_status === 'smoker') insights += `- Smoking history significantly elevates cardiovascular risk.\n`;
        if (data.glucose && data.glucose > 140) insights += `- Random glucose level of ${data.glucose} mg/dL requires further diabetes screening.\n`;

        insights += `\n**Recommendations:**\n`;
        if (data.riskLevel === 'High') {
            insights += `1. **Immediate Referral**: Schedule appointment with Medical Officer within 24 hours.\n`;
            insights += `2. **BP Monitoring**: Daily blood pressure checks recommended.\n`;
        } else if (data.riskLevel === 'Medium') {
            insights += `1. **Lifestyle Change**: Reduce salt intake and increase physical activity.\n`;
            insights += `2. **Follow-up**: Re-screen in 1 month.\n`;
        } else {
            insights += `1. **Maintenance**: Continue healthy habits.\n`;
            insights += `2. **Screening**: Routine check-up in 6 months.\n`;
        }

        return insights;
    }
};
