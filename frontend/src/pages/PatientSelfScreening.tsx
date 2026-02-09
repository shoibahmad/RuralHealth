import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../context/AuthContext";
import { firestoreService } from "../services/firestoreService";
import { riskUtils } from "../lib/riskUtils";

const STEPS = [
    { label: "Vitals", description: "Basic measurements" },
    { label: "Lifestyle", description: "Habits & activities" },
    { label: "Lab Results", description: "Optional lab data" },
];

export function PatientSelfScreening() {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        height_cm: "",
        weight_kg: "",
        systolic_bp: "",
        diastolic_bp: "",
        heart_rate: "",
        smoking_status: "Never",
        alcohol_usage: "None",
        physical_activity: "Moderate",
        glucose_level: "",
        cholesterol_level: "",
    });
    const navigate = useNavigate();

    const updateField = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            if (!user) throw new Error("You must be logged in.");

            // Get profile for age (needed for risk calc)
            const patientProfile = await firestoreService.getPatient(user.uid);
            const age = patientProfile?.age || 30;

            // Calculate Risk
            const riskResult = riskUtils.calculateRisk({
                age: age,
                systolic_bp: parseInt(formData.systolic_bp) || undefined,
                diastolic_bp: parseInt(formData.diastolic_bp) || undefined,
                smoking_status: formData.smoking_status
            });

            const screeningData = {
                patient_id: user.uid,
                patient_name: user.displayName || user.full_name || "Self",
                height_cm: parseFloat(formData.height_cm) || undefined,
                weight_kg: parseFloat(formData.weight_kg) || undefined,
                systolic_bp: parseInt(formData.systolic_bp) || undefined,
                diastolic_bp: parseInt(formData.diastolic_bp) || undefined,
                heart_rate: parseInt(formData.heart_rate) || undefined,
                smoking_status: formData.smoking_status,
                alcohol_usage: formData.alcohol_usage,
                physical_activity: formData.physical_activity,
                glucose_level: parseFloat(formData.glucose_level) || undefined,
                cholesterol_level: parseFloat(formData.cholesterol_level) || undefined,
                risk_score: riskResult.score,
                risk_level: riskResult.level as 'Low' | 'Medium' | 'High',
                risk_notes: riskResult.notes
            };

            await firestoreService.addScreening(screeningData);
            navigate("/patient/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to submit screening");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="glass-card p-6 rounded-xl border border-white/5">
                <h1 className="text-3xl font-bold text-white mb-2">New Health Screening</h1>
                <p className="text-slate-400">Complete your health assessment</p>
            </div>

            {/* Progress Steps */}
            <div className="glass-card p-6 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-8">
                    {STEPS.map((step, index) => (
                        <div key={index} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                                <div
                                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all ${index <= currentStep
                                        ? "bg-pink-500 text-white"
                                        : "bg-white/5 text-slate-400"
                                        }`}
                                >
                                    {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                                </div>
                                <p className="text-sm font-medium text-white mt-2">{step.label}</p>
                                <p className="text-xs text-slate-400">{step.description}</p>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={`h-1 flex-1 mx-2 rounded ${index < currentStep ? "bg-pink-500" : "bg-white/5"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="space-y-6">
                    {/* Step 0: Vitals */}
                    {currentStep === 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white mb-4">Vital Signs</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="height_cm">Height (cm)</Label>
                                    <Input
                                        id="height_cm"
                                        type="number"
                                        value={formData.height_cm}
                                        onChange={(e) => updateField("height_cm", e.target.value)}
                                        placeholder="e.g., 170"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="weight_kg">Weight (kg)</Label>
                                    <Input
                                        id="weight_kg"
                                        type="number"
                                        value={formData.weight_kg}
                                        onChange={(e) => updateField("weight_kg", e.target.value)}
                                        placeholder="e.g., 70"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="systolic_bp">Systolic BP (mmHg)</Label>
                                    <Input
                                        id="systolic_bp"
                                        type="number"
                                        value={formData.systolic_bp}
                                        onChange={(e) => updateField("systolic_bp", e.target.value)}
                                        placeholder="e.g., 120"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="diastolic_bp">Diastolic BP (mmHg)</Label>
                                    <Input
                                        id="diastolic_bp"
                                        type="number"
                                        value={formData.diastolic_bp}
                                        onChange={(e) => updateField("diastolic_bp", e.target.value)}
                                        placeholder="e.g., 80"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                                    <Input
                                        id="heart_rate"
                                        type="number"
                                        value={formData.heart_rate}
                                        onChange={(e) => updateField("heart_rate", e.target.value)}
                                        placeholder="e.g., 72"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Lifestyle */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white mb-4">Lifestyle Information</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <Label htmlFor="smoking_status">Smoking Status</Label>
                                    <Select
                                        value={formData.smoking_status}
                                        onValueChange={(value) => updateField("smoking_status", value)}
                                    >
                                        <SelectTrigger id="smoking_status" className="bg-slate-900/50 border-white/10 text-white">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Never">Never</SelectItem>
                                            <SelectItem value="Former">Former</SelectItem>
                                            <SelectItem value="Current">Current</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="alcohol_usage">Alcohol Usage</Label>
                                    <Select
                                        value={formData.alcohol_usage}
                                        onValueChange={(value) => updateField("alcohol_usage", value)}
                                    >
                                        <SelectTrigger id="alcohol_usage" className="bg-slate-900/50 border-white/10 text-white">
                                            <SelectValue placeholder="Select usage" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="None">None</SelectItem>
                                            <SelectItem value="Occasional">Occasional</SelectItem>
                                            <SelectItem value="Moderate">Moderate</SelectItem>
                                            <SelectItem value="Heavy">Heavy</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="physical_activity">Physical Activity</Label>
                                    <Select
                                        value={formData.physical_activity}
                                        onValueChange={(value) => updateField("physical_activity", value)}
                                    >
                                        <SelectTrigger id="physical_activity" className="bg-slate-900/50 border-white/10 text-white">
                                            <SelectValue placeholder="Select activity level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sedentary">Sedentary</SelectItem>
                                            <SelectItem value="Light">Light</SelectItem>
                                            <SelectItem value="Moderate">Moderate</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Very Active">Very Active</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Lab Results */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white mb-4">Lab Results (Optional)</h2>
                            <p className="text-slate-400 text-sm mb-4">
                                If you have recent lab results, you can enter them here. Otherwise, you can skip this step.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="glucose_level">Glucose Level (mg/dL)</Label>
                                    <Input
                                        id="glucose_level"
                                        type="number"
                                        value={formData.glucose_level}
                                        onChange={(e) => updateField("glucose_level", e.target.value)}
                                        placeholder="e.g., 100"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="cholesterol_level">Cholesterol Level (mg/dL)</Label>
                                    <Input
                                        id="cholesterol_level"
                                        type="number"
                                        value={formData.cholesterol_level}
                                        onChange={(e) => updateField("cholesterol_level", e.target.value)}
                                        placeholder="e.g., 180"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 0 || isSubmitting}
                        className="text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>

                    {currentStep < STEPS.length - 1 ? (
                        <Button
                            onClick={handleNext}
                            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
                        >
                            Next
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Submit Screening
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
