import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save, Loader2, CheckCircle2, AlertCircle, Sparkles, WifiOff, Cloud } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useOffline } from "../context/OfflineContext";
import { syncService } from "../services/syncService";

import { WizardSteppers } from "../components/ui/wizard-steppers";
import { PatientDemographicsForm } from "../components/screening/PatientDemographicsForm";
import { VitalsEntryForm } from "../components/screening/VitalsEntryForm";
import { LifestyleSurveyForm } from "../components/screening/LifestyleSurveyForm";
import { LabResultsUploadForm } from "../components/screening/LabResultsUploadForm";
import { RiskAssessmentReview } from "../components/screening/RiskAssessmentReview";
import { motion } from "framer-motion";



const STEPS = [
    { label: "Patient Identity", description: "Demographics & Location" },
    { label: "Vitals Check", description: "BP, BMI, Heart Rate" },
    { label: "Lifestyle Survey", description: "Habits & History" },
    { label: "Lab Reports", description: "OCR Upload" },
    { label: "Risk Assessment", description: "Final Analysis" }
];

export function ScreeningWizard() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [savedOffline, setSavedOffline] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [formData, setFormData] = useState<any>({
        // Patient
        full_name: "",
        age: "",
        gender: "",
        village: "",
        phone: "",
        // Vitals
        height_cm: "",
        weight_kg: "",
        systolic_bp: "",
        diastolic_bp: "",
        heart_rate: "",
        // Lifestyle
        smoking_status: "",
        alcohol_usage: "",
        physical_activity: "",
        // Lab
        glucose_level: "",
        cholesterol_level: "",
    });
    const navigate = useNavigate();
    const { token } = useAuth();
    const { isOnline, refreshPendingCount } = useOffline();

    const updateFormData = (newData: any) => {
        setFormData(newData);
    };

    const handleSubmitOnline = async () => {
        try {
            // Step 1: Create patient
            const patientResponse = await fetch("/api/screening/patients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    age: parseInt(formData.age) || 0,
                    gender: formData.gender,
                    village: formData.village,
                    phone: formData.phone || null,
                }),
            });

            if (!patientResponse.ok) {
                const errorData = await patientResponse.json();
                throw new Error(errorData.detail || "Failed to create patient");
            }

            const patient = await patientResponse.json();
            console.log("Patient created:", patient);

            // Step 2: Create screening with vitals and lab data
            const screeningResponse = await fetch("/api/screening/screenings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    patient_id: patient.id,
                    height_cm: parseFloat(formData.height_cm) || null,
                    weight_kg: parseFloat(formData.weight_kg) || null,
                    systolic_bp: parseInt(formData.systolic_bp) || null,
                    diastolic_bp: parseInt(formData.diastolic_bp) || null,
                    heart_rate: parseInt(formData.heart_rate) || null,
                    smoking_status: formData.smoking_status || null,
                    alcohol_usage: formData.alcohol_usage || null,
                    physical_activity: formData.physical_activity || null,
                    glucose_level: parseFloat(formData.glucose_level) || null,
                    cholesterol_level: parseFloat(formData.cholesterol_level) || null,
                }),
            });

            if (!screeningResponse.ok) {
                const errorData = await screeningResponse.json();
                throw new Error(errorData.detail || "Failed to create screening");
            }

            const screening = await screeningResponse.json();
            console.log("Screening created:", screening);

            // Step 3: Get AI analysis
            try {
                const aiResponse = await fetch("/api/ai/analyze", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ...formData,
                        age: parseInt(formData.age) || 0,
                    }),
                });

                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    if (aiData.success) {
                        setAiAnalysis(aiData.analysis);
                    }
                }
            } catch (aiError) {
                console.log("AI analysis not available:", aiError);
            }

            return true;
        } catch (err: any) {
            throw err;
        }
    };

    const handleSubmitOffline = async () => {
        try {
            // Save patient locally
            const patientLocalId = await syncService.savePatientLocally({
                full_name: formData.full_name,
                age: formData.age,
                gender: formData.gender,
                village: formData.village,
                phone: formData.phone,
            });

            // Save screening locally
            await syncService.saveScreeningLocally(formData, patientLocalId);

            // Update pending count
            await refreshPendingCount();

            setSavedOffline(true);
            return true;
        } catch (err: any) {
            throw err;
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            if (isOnline) {
                await handleSubmitOnline();
            } else {
                await handleSubmitOffline();
            }

            setIsSuccess(true);

            // Redirect after showing success
            setTimeout(() => {
                navigate("/dashboard");
            }, 3000);
        } catch (err: any) {
            console.error("Submission error:", err);
            setError(err.message || "An error occurred while saving data");
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            handleSubmit();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    // Render Step Content
    const renderStep = () => {
        if (isSuccess) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-12 animate-in fade-in zoom-in duration-500">
                    <div className={`h-20 w-20 ${savedOffline ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'} rounded-full flex items-center justify-center mb-6`}>
                        {savedOffline ? <WifiOff className="h-10 w-10" /> : <CheckCircle2 className="h-10 w-10" />}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {savedOffline ? 'Saved Locally!' : 'Screening Completed!'}
                    </h2>
                    <p className="text-slate-400 mb-6">
                        {savedOffline
                            ? 'Data saved to your device. It will sync automatically when online.'
                            : 'Patient and screening data saved successfully.'}
                    </p>

                    {savedOffline && (
                        <div className="w-full max-w-md glass-card rounded-xl p-6 border border-amber-500/20 mt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Cloud className="h-5 w-5 text-amber-400" />
                                <h3 className="font-semibold text-white">Offline Mode</h3>
                            </div>
                            <p className="text-sm text-slate-300">
                                Your screening has been securely saved to this device.
                                When you're back online, it will automatically sync to the server.
                            </p>
                        </div>
                    )}

                    {aiAnalysis && !savedOffline && (
                        <div className="w-full max-w-md glass-card rounded-xl p-6 border border-white/10 mt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="h-5 w-5 text-teal-400" />
                                <h3 className="font-semibold text-white">AI Analysis Summary</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Risk Level:</span>
                                    <span className={`font-medium ${aiAnalysis.risk_level === 'High' ? 'text-red-400' :
                                            aiAnalysis.risk_level === 'Medium' ? 'text-amber-400' :
                                                'text-green-400'
                                        }`}>{aiAnalysis.risk_level}</span>
                                </div>
                                {aiAnalysis.summary && (
                                    <p className="text-slate-300">{aiAnalysis.summary.substring(0, 200)}...</p>
                                )}
                            </div>
                        </div>
                    )}

                    <p className="text-slate-500 text-sm mt-6">Redirecting to dashboard...</p>
                </div>
            )
        }

        if (isSubmitting) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-12 animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mb-6">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {isOnline ? 'Saving & Analyzing...' : 'Saving Locally...'}
                    </h2>
                    <p className="text-slate-400 mb-8">
                        {isOnline
                            ? 'Gemini AI is analyzing patient vitals and lab reports...'
                            : 'Saving data to your device for offline access...'}
                    </p>

                    <div className="w-full max-w-md h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-blue-500 animate-progress-indeterminate" />
                    </div>
                </div>
            )
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-12">
                    <div className="h-20 w-20 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Error Occurred</h2>
                    <p className="text-red-400 mb-4">{error}</p>
                    <Button onClick={() => setError(null)} variant="outline">
                        Try Again
                    </Button>
                </div>
            )
        }

        switch (currentStep) {
            case 0:
                return <PatientDemographicsForm data={formData} updateData={updateFormData} />;
            case 1:
                return <VitalsEntryForm data={formData} updateData={updateFormData} />;
            case 2:
                return <LifestyleSurveyForm data={formData} updateData={updateFormData} />;
            case 3:
                return <LabResultsUploadForm data={formData} updateData={updateFormData} />;
            case 4:
                return <RiskAssessmentReview data={formData} />;
            default:
                return <div className="p-8 text-center text-slate-500">Coming Soon... Step {currentStep + 1}</div>;
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-6"
        >
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-300 hover:text-white hover:bg-white/10">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold text-white">New Screening</h1>
                    <p className="text-sm md:text-base text-slate-400">Complete the workflow to assess health risk.</p>
                </div>
                {/* Offline indicator */}
                {!isOnline && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">
                        <WifiOff className="h-4 w-4" />
                        <span>Offline Mode</span>
                    </div>
                )}
            </div>

            <div className="glass-card rounded-2xl shadow-xl overflow-hidden border border-white/5">
                <div className="p-6">
                    <WizardSteppers steps={STEPS} currentStep={currentStep} />
                </div>
                <div className="p-6 min-h-[400px]">
                    {renderStep()}
                </div>
                <div className="p-6 border-t border-white/5 flex justify-between bg-black/20">
                    {!isSubmitting && !isSuccess && !error && (
                        <>
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className="text-slate-300 hover:text-white hover:bg-white/10"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={nextStep}
                                className="min-w-[120px] bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-teal-500/25 transition-all duration-300"
                            >
                                {currentStep === STEPS.length - 1 ? (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isOnline ? 'Finish' : 'Save Offline'}
                                    </>
                                ) : (
                                    <>
                                        Next <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
