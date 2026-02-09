/**
 * Offline Context for managing online/offline state across the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';
import { useAuth } from './AuthContext';

interface OfflineContextType {
    isOnline: boolean;
    pendingSyncCount: number;
    syncStatus: 'idle' | 'syncing' | 'error' | 'success';
    syncNow: () => Promise<void>;
    refreshPendingCount: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');

    // Update sync service token when auth changes - DEPRECATED for Firebase
    /*
    useEffect(() => {
        syncService.setToken(token);
    }, [token]);
    */

    // Listen for online/offline events
    useEffect(() => {
        const handleOnline = () => {
            console.log('Device is online');
            setIsOnline(true);
            // Auto-sync when coming online
            if (user) {
                syncNow();
            }
        };

        const handleOffline = () => {
            console.log('Device is offline');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [user]);

    // Subscribe to sync status changes
    useEffect(() => {
        const unsubscribe = syncService.subscribe((status) => {
            setSyncStatus(status);
            if (status === 'success' || status === 'error') {
                refreshPendingCount();
            }
        });

        return unsubscribe;
    }, []);

    // Initial pending count
    useEffect(() => {
        refreshPendingCount();
    }, []);

    const refreshPendingCount = useCallback(async () => {
        try {
            const count = await syncService.getPendingCount();
            setPendingSyncCount(count);
        } catch (error) {
            console.error('Failed to get pending sync count:', error);
        }
    }, []);

    const syncNow = useCallback(async () => {
        if (!isOnline || !user) return;

        try {
            await syncService.syncAll();
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }, [isOnline, user]);

    return (
        <OfflineContext.Provider
            value={{
                isOnline,
                pendingSyncCount,
                syncStatus,
                syncNow,
                refreshPendingCount,
            }}
        >
            {children}
        </OfflineContext.Provider>
    );
}

export function useOffline() {
    const context = useContext(OfflineContext);
    if (context === undefined) {
        throw new Error('useOffline must be used within an OfflineProvider');
    }
    return context;
}
