import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface WizardSteppersProps {
    steps: { label: string; description: string }[];
    currentStep: number;
}

export function WizardSteppers({ steps, currentStep }: WizardSteppersProps) {
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-700/50 -z-10 rounded-full" />
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-teal-500 to-blue-500 -z-10 transition-all duration-500 ease-in-out rounded-full"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <div key={index} className="flex flex-col items-center px-2 relative">
                            {/* Small background patch to hide the line behind the circle */}
                            <div className="bg-slate-900 rounded-full p-1 -my-1 z-0">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10 font-bold",
                                        isCompleted ? "bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/25" :
                                            isCurrent ? "bg-slate-900 border-teal-500 text-teal-400 shadow-md shadow-teal-500/10" : "bg-slate-900 border-slate-700 text-slate-500"
                                    )}
                                >
                                    {isCompleted ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
                                </div>
                            </div>
                            <div className="absolute top-14 left-1/2 -translate-x-1/2 w-32 text-center mt-2">
                                <p className={cn("text-xs md:text-sm font-semibold transition-colors duration-300 hidden md:block", isCurrent ? "block text-white" : "text-slate-500")}>
                                    {step.label}
                                </p>
                                <p className="text-[10px] uppercase tracking-wider font-medium text-slate-500 hidden lg:block mt-1">{step.description}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="h-12" /> {/* Spacer for absolute text */}
        </div>
    )
}
