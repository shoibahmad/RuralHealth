import { useState, useEffect, useMemo } from "react";
import { firestoreService } from "../services/firestoreService";
import { createLogger } from "../lib/logger";

const log = createLogger("OfficerDashboard");

/** Officer overview, assembled from the raw collections. */
export interface OfficerDashboardStats {
    overview: {
        total_patients: number;
        total_screenings: number;
        high_risk_count: number;
        total_workers: number;
        active_workers: number;
    };
    risk_distribution: Record<"Low" | "Medium" | "High", number>;
    monthly_trend: { month: string; screenings: number; patients: number }[];
    village_stats: { village: string; patient_count: number }[];
    top_workers: { name: string; screenings: number }[];
}

export interface RiskDataPoint {
    name: string;
    value: number;
    color: string;
}

const RISK_COLORS = {
    Low: "#10b981",
    Medium: "#f59e0b",
    High: "#ef4444",
} as const;

export interface UseOfficerDashboardStatsResult {
    stats: OfficerDashboardStats | null;
    loading: boolean;
    villageStats: OfficerDashboardStats["village_stats"];
    riskData: RiskDataPoint[];
    riskColors: typeof RISK_COLORS;
}

export function useOfficerDashboardStats(): UseOfficerDashboardStatsResult {
    const [stats, setStats] = useState<OfficerDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const [patients, screenings, workers] = await Promise.all([
                    firestoreService.getPatients(),
                    firestoreService.getScreenings(),
                    firestoreService.getHealthWorkers(),
                ]);

                // Overview
                const highRisk = screenings.filter((s) => s.risk_level === "High").length;
                const overview = {
                    total_patients: patients.length,
                    total_screenings: screenings.length,
                    high_risk_count: highRisk,
                    total_workers: workers.length,
                    active_workers: workers.filter((w) => w.is_active).length,
                };

                // Risk Dist
                const riskDist = { Low: 0, Medium: 0, High: 0 };
                screenings.forEach((s) => {
                    if (s.risk_level && s.risk_level in riskDist)
                        riskDist[s.risk_level as keyof typeof riskDist]++;
                });

                // Monthly Trend
                const trendMap: Record<string, { screenings: number; patients: number }> = {};
                screenings.forEach((s) => {
                    const m = new Date(s.created_at as string).toLocaleString("default", {
                        month: "short",
                    });
                    if (!trendMap[m]) trendMap[m] = { screenings: 0, patients: 0 };
                    trendMap[m].screenings++;
                });
                patients.forEach((p) => {
                    const m = new Date(p.created_at as string).toLocaleString("default", {
                        month: "short",
                    });
                    if (!trendMap[m]) trendMap[m] = { screenings: 0, patients: 0 };
                    trendMap[m].patients++;
                });
                const monthly_trend = Object.entries(trendMap).map(([k, v]) => ({
                    month: k,
                    ...v,
                }));

                // Village Stats
                const villageMap: Record<string, number> = {};
                patients.forEach((p) => {
                    const v = p.village || "Unknown";
                    villageMap[v] = (villageMap[v] || 0) + 1;
                });
                const village_stats = Object.entries(villageMap)
                    .map(([k, v]) => ({ village: k, patient_count: v }))
                    .sort((a, b) => b.patient_count - a.patient_count)
                    .slice(0, 10);

                // Top Workers
                const workerMap: Record<string, number> = {};
                patients.forEach((p) => {
                    if (p.health_worker_id) {
                        const pScreenings = screenings.filter(
                            (s) => s.patient_id === p.id,
                        ).length;
                        workerMap[p.health_worker_id] =
                            (workerMap[p.health_worker_id] || 0) + pScreenings;
                    }
                });
                const top_workers = workers
                    .map((w) => ({
                        name: w.full_name,
                        screenings: workerMap[w.uid] || 0,
                    }))
                    .sort((a, b) => b.screenings - a.screenings)
                    .slice(0, 5);

                setStats({
                    overview,
                    risk_distribution: riskDist,
                    monthly_trend,
                    village_stats,
                    top_workers,
                });
            } catch (error) {
                log.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardStats();
    }, []);

    const villageStats = stats?.village_stats ?? [];

    const riskData: RiskDataPoint[] = useMemo(
        () =>
            stats?.risk_distribution
                ? [
                      {
                          name: "Low Risk",
                          value: stats.risk_distribution.Low,
                          color: RISK_COLORS.Low,
                      },
                      {
                          name: "Medium Risk",
                          value: stats.risk_distribution.Medium,
                          color: RISK_COLORS.Medium,
                      },
                      {
                          name: "High Risk",
                          value: stats.risk_distribution.High,
                          color: RISK_COLORS.High,
                      },
                  ]
                : [],
        [stats],
    );

    return {
        stats,
        loading,
        villageStats,
        riskData,
        riskColors: RISK_COLORS,
    };
}
