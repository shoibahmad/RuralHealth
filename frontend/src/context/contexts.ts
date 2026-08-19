/**
 * React context objects, kept apart from their provider components.
 *
 * A module that exports both a component and a context defeats fast refresh,
 * so each *Context.tsx file exports only its provider and the context objects
 * live here.
 */
import { createContext } from "react";

import type { ReactNode } from "react";
import type { User } from "./AuthContext";
import type { SyncStatus } from "../services/syncService";

// Referenced by the declarations below; re-exported for convenience.
export type { ReactNode, User };

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isHealthOfficer: boolean;
    isHealthWorker: boolean;
    isPatient: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Visual style of a toast notification. */
export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export interface OfflineContextType {
    isOnline: boolean;
    pendingSyncCount: number;
    syncStatus: SyncStatus;
    syncNow: () => Promise<void>;
    refreshPendingCount: () => Promise<void>;
}

export const OfflineContext = createContext<OfflineContextType | undefined>(undefined);
