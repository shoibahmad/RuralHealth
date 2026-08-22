import { useState, useEffect, useCallback, useMemo } from "react";
import { firestoreService, type Patient } from "../services/firestoreService";
import { createLogger } from "../lib/logger";
import { errorMessage } from "../lib/errors";

const log = createLogger("usePatientList");

export interface UsePatientListOptions {
    initialSearchTerm?: string;
    initialRiskFilter?: string;
    initialPage?: number;
    pageSize?: number;
    autoFetch?: boolean;
}

export interface UsePatientListReturn {
    patients: Patient[];
    allFilteredPatients: Patient[];
    rawPatients: Patient[];
    loading: boolean;
    error: string | null;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    riskFilter: string;
    setRiskFilter: (filter: string) => void;
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    pageSize: number | undefined;
    totalCount: number;
    totalPages: number;
    refetch: () => Promise<void>;
    deletePatient: (id: string) => Promise<boolean>;
    updatePatient: (id: string, data: Partial<Patient>) => Promise<boolean>;
}

export function usePatientList(options: UsePatientListOptions = {}): UsePatientListReturn {
    const {
        initialSearchTerm = "",
        initialRiskFilter = "",
        initialPage = 1,
        pageSize,
        autoFetch = true,
    } = options;

    const [rawPatients, setRawPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(autoFetch);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [riskFilter, setRiskFilter] = useState(initialRiskFilter);
    const [page, setPage] = useState(initialPage);

    const fetchPatients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await firestoreService.getPatients();
            setRawPatients(data);
        } catch (err) {
            const msg = errorMessage(err);
            log.error("Failed to fetch patients", err);
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (autoFetch) {
            fetchPatients();
        }
    }, [autoFetch, fetchPatients]);

    const allFilteredPatients = useMemo(() => {
        let result = rawPatients;

        if (searchTerm.trim()) {
            const lower = searchTerm.trim().toLowerCase();
            result = result.filter(
                (p) =>
                    (p.full_name && p.full_name.toLowerCase().includes(lower)) ||
                    (p.village && p.village.toLowerCase().includes(lower)) ||
                    (p.phone && p.phone.includes(lower)),
            );
        }

        if (riskFilter) {
            result = result.filter((p) => p.latest_risk_level === riskFilter);
        }

        return result;
    }, [rawPatients, searchTerm, riskFilter]);

    const totalCount = allFilteredPatients.length;

    const totalPages = useMemo(() => {
        if (!pageSize || pageSize <= 0) return 1;
        return Math.max(1, Math.ceil(totalCount / pageSize));
    }, [totalCount, pageSize]);

    const patients = useMemo(() => {
        if (!pageSize || pageSize <= 0) {
            return allFilteredPatients;
        }
        const start = (page - 1) * pageSize;
        return allFilteredPatients.slice(start, start + pageSize);
    }, [allFilteredPatients, page, pageSize]);

    const deletePatient = useCallback(
        async (id: string): Promise<boolean> => {
            try {
                await firestoreService.deletePatient(id);
                setRawPatients((prev) => prev.filter((p) => p.id !== id));
                return true;
            } catch (err) {
                const msg = errorMessage(err);
                log.error("Failed to delete patient", err);
                setError(msg);
                return false;
            }
        },
        [],
    );

    const updatePatient = useCallback(
        async (id: string, data: Partial<Patient>): Promise<boolean> => {
            try {
                await firestoreService.updatePatient(id, data);
                setRawPatients((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, ...data } : p)),
                );
                return true;
            } catch (err) {
                const msg = errorMessage(err);
                log.error("Failed to update patient", err);
                setError(msg);
                return false;
            }
        },
        [],
    );

    return {
        patients,
        allFilteredPatients,
        rawPatients,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        riskFilter,
        setRiskFilter,
        page,
        setPage,
        pageSize,
        totalCount,
        totalPages,
        refetch: fetchPatients,
        deletePatient,
        updatePatient,
    };
}
