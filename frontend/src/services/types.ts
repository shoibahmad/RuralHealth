import type { Timestamp } from "firebase/firestore";
import type { RiskLevel } from "../lib/schemas";

/** Domain types for the Firestore collections backing the app. */

export interface User {
    uid: string;
    email: string;
    full_name: string;
    role: string;
    village?: string;
    phone?: string;
    is_active?: boolean;
    created_at?: string;
    last_login?: string;
}

/** A health worker plus the caseload counters shown on the workers page. */
export interface HealthWorkerWithStats extends User {
    id: string;
    stats: WorkerCaseloadStats;
}

export interface WorkerCaseloadStats {
    total_patients: number;
    total_screenings: number;
    high_risk_patients: number;
}

export interface Patient {
    id?: string;
    full_name: string;
    age: number;
    gender: string;
    village: string;
    phone?: string;
    /** Reference to the User id of the owning health worker. */
    health_worker_id?: string;
    created_at: string | Timestamp;
    /** Denormalised counters maintained when a screening is recorded. */
    screening_count?: number;
    latest_risk_level?: RiskLevel;
}

export interface Screening {
    id?: string;
    patient_id: string;
    /** Denormalised for display without a second read. */
    patient_name?: string;
    height_cm?: number;
    weight_kg?: number;
    systolic_bp?: number;
    diastolic_bp?: number;
    heart_rate?: number;
    glucose_level?: number;
    cholesterol_level?: number;
    smoking_status?: string;
    alcohol_usage?: string;
    physical_activity?: string;
    hemoglobin?: number;
    rbc_count?: number;
    wbc_count?: number;
    platelet_count?: number;
    blood_urea_nitrogen?: number;
    creatinine?: number;
    sodium?: number;
    potassium?: number;
    chloride?: number;
    calcium?: number;
    alt_sgpt?: number;
    ast_sgot?: number;
    albumin?: number;
    total_bilirubin?: number;
    risk_score: number;
    risk_level: RiskLevel;
    risk_notes?: string;
    ai_insights?: string | AiInsights;
    created_at: string | Timestamp;
}

/** The structured analysis returned by the backend's /api/ai/analyze endpoint. */
export interface AiInsights {
    summary?: string;
    summary_hi?: string;
    concerns?: string[];
    concerns_hi?: string[];
    recommendations?: string[];
    recommendations_hi?: string[];
    formatted_insights?: string;
    formatted_insights_hi?: string;
    risk_level?: RiskLevel;
}

export interface Appointment {
    id?: string;
    patient_id: string;
    health_worker_id: string;
    /** ISO 8601 string. */
    scheduled_date: string;
    reason: string;
    notes?: string;
    status: "scheduled" | "completed" | "cancelled" | "missed";
    created_at: string | Timestamp;
}

export interface Recommendation {
    id?: string;
    patient_id: string;
    screening_id?: string;
    category: "diet" | "exercise" | "medication" | "lifestyle" | "followup";
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    is_completed?: boolean;
    created_at: string | Timestamp;
}

/** A patient together with the records shown on their detail view. */
export interface PatientDetail extends Patient {
    screenings: Screening[];
    appointments: Appointment[];
    recommendations: Recommendation[];
}

export interface VillageStats {
    village: string;
    total: number;
    high_risk: number;
}

export interface WorkerPerformance {
    worker_name: string;
    patients: number;
    screenings: number;
    completion_rate: number;
}

export interface DashboardStats {
    total_patients: number;
    total_screenings: number;
    high_risk_count: number;
    pending_appointments: number;
    risk_distribution: Record<RiskLevel, number>;
    age_distribution: Record<string, number>;
    gender_distribution: { gender: string; count: number }[];
    geographic_distribution: VillageStats[];
    risk_factor_prevalence: Record<string, number>;
    worker_performance: WorkerPerformance[];
    recent_screenings: Screening[];
    weekly_screenings: unknown[];
}

/** Payload for creating a health worker's Firestore profile document. */
export type HealthWorkerInput = Pick<User, "email" | "full_name"> &
    Partial<Pick<User, "village" | "phone">>;
