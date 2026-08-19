import { useState, useEffect, useMemo } from "react";
import { Users, Activity, AlertTriangle, Calendar, type LucideIcon } from "lucide-react";
import { firestoreService } from "../services/firestoreService";
import type { DashboardStats } from "../services/types";
import { useAuth } from "../context/useAuth";
import { createLogger } from "../lib/logger";

const log = createLogger("DashboardHome");

export interface StatCard {
    label: string;
    value: string;
    icon: LucideIcon;
    color: string;
    bg: string;
}

export interface RiskSlice {
    name: string;
    value: number;
    color: string;
}

export interface UseDashboardStatsResult {
    stats: DashboardStats | null;
    loading: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    statCards: StatCard[];
    riskDistribution: RiskSlice[];
    totalRisk: number;
    filteredRecentScreenings: DashboardStats["recent_screenings"];
    /** Placeholder local stats. */
    localStats: { localPatients: number; localScreenings: number };
}

export function useDashboardStats(): UseDashboardStatsResult {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const loadStats = async () => {
            // Pass user ID only if it's a health worker to filter data
            // If user is Admin/Officer, they see global stats (conceptually)
            // For now, firestoreService.getDashboardStats handles some of this logic
            try {
                const data = await firestoreService.getDashboardStats(
                    user?.role === "health_worker" ? user.uid : undefined,
                );
                setStats(data);
            } catch (error) {
                log.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [user]);

    const riskDistribution: RiskSlice[] = useMemo(
        () =>
            stats
                ? [
                      { name: "Low Risk", value: stats.risk_distribution.Low || 0, color: "#10b981" },
                      { name: "Medium", value: stats.risk_distribution.Medium || 0, color: "#f59e0b" },
                      { name: "High Risk", value: stats.risk_distribution.High || 0, color: "#ef4444" },
                  ]
                : [],
        [stats],
    );

    const totalRisk = useMemo(
        () => riskDistribution.reduce((sum, item) => sum + item.value, 0),
        [riskDistribution],
    );

    const statCards: StatCard[] = useMemo(
        () =>
            stats
                ? [
                      {
                          label: "Total Patients",
                          value: stats.total_patients.toLocaleString(),
                          icon: Users,
                          color: "text-blue-400",
                          bg: "bg-blue-500/10",
                      },
                      {
                          label: "Total Screenings",
                          value: stats.total_screenings.toLocaleString(),
                          icon: Activity,
                          color: "text-teal-400",
                          bg: "bg-teal-500/10",
                      },
                      {
                          label: "High Risk Cases",
                          value: stats.high_risk_count.toLocaleString(),
                          icon: AlertTriangle,
                          color: "text-red-400",
                          bg: "bg-red-500/10",
                      },
                      {
                          label: "Pending Appointments",
                          value: stats.pending_appointments.toLocaleString(),
                          icon: Calendar,
                          color: "text-amber-400",
                          bg: "bg-amber-500/10",
                      },
                  ]
                : [],
        [stats],
    );

    const filteredRecentScreenings = useMemo(
        () =>
            stats?.recent_screenings.filter((s) =>
                s.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()),
            ) || [],
        [stats, searchTerm],
    );

    return {
        stats,
        loading,
        searchTerm,
        setSearchTerm,
        statCards,
        riskDistribution,
        totalRisk,
        filteredRecentScreenings,
        localStats: { localPatients: 0, localScreenings: 0 },
    };
}
