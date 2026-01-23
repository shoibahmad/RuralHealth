import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";

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
    });
    const navigate = useNavigate();
    // const { token } = useAuth(); // for API calls

    const updateFormData = (newData: any) => {
        setFormData(newData);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate API call and Analysis
        await new Promise(resolve => setTimeout(resolve, 3000));
        setIsSubmitting(false);
        setIsSuccess(true);

        // Redirect after showing success
        setTimeout(() => {
            navigate("/dashboard");
        }, 2000);
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
                    <div className="h-20 w-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Screening Completed!</h2>
                    <p className="text-slate-400">Data saved successfully. Redirecting to dashboard...</p>
                </div>
            )
        }

        if (isSubmitting) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-12 animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mb-6">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Risk Analysis in Progress</h2>
                    <p className="text-slate-400 mb-8">Gemini AI is analyzing patient vitals and lab reports...</p>

                    <div className="w-full max-w-md h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-blue-500 animate-progress-indeterminate" />
                    </div>
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
                <div>
                    <h1 className="text-2xl font-bold text-white">New Screening</h1>
                    <p className="text-slate-400">Complete the workflow to assess health risk.</p>
                </div>
            </div>

            <div className="glass-card rounded-2xl shadow-xl overflow-hidden border border-white/5">
                <div className="p-6">
                    <WizardSteppers steps={STEPS} currentStep={currentStep} />
                </div>
                <div className="p-6 min-h-[400px]">
                    {renderStep()}
                </div>
                <div className="p-6 border-t border-white/5 flex justify-between bg-black/20">
                    {!isSubmitting && !isSuccess && (
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
                                        <Save className="mr-2 h-4 w-4" /> Finish
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
