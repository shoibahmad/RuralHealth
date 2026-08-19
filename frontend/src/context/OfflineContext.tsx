/**
 * Offline Context for managing online/offline state across the app
 */

import React, { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';
import type { SyncStatus } from '../services/syncService';
import { useAuth } from './useAuth';
import { createLogger } from '../lib/logger';
import { OfflineContext } from './contexts';

const log = createLogger('OfflineContext');

export function OfflineProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

    // Declared before the effects that depend on them, so the dependency
    // arrays below can name them without reading a binding that is not
    // initialised yet.
    const refreshPendingCount = useCallback(async () => {
        try {
            const count = await syncService.getPendingCount();
            setPendingSyncCount(count);
        } catch (error) {
            log.error('Failed to get pending sync count', error);
        }
    }, []);

    const syncNow = useCallback(async () => {
        if (!isOnline || !user) return;

        try {
            await syncService.syncAll();
        } catch (error) {
            log.error('Sync failed', error);
        }
    }, [isOnline, user]);

    // Track connectivity, and drain the queue as soon as the device returns.
    useEffect(() => {
        const handleOnline = () => {
            log.info('Device is online');
            setIsOnline(true);
            if (user) {
                void syncNow();
            }
        };

        const handleOffline = () => {
            log.info('Device is offline');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [user, syncNow]);

    // Mirror the sync service's status, refreshing the badge when it settles.
    useEffect(() => {
        return syncService.subscribe((status) => {
            setSyncStatus(status);
            if (status === 'success' || status === 'error') {
                void refreshPendingCount();
            }
        });
    }, [refreshPendingCount]);

    // Seed the pending count on mount. refreshPendingCount only calls setState
    // after awaiting IndexedDB, so this is a subscription to an external store
    // rather than the cascading synchronous update the rule guards against.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async, see above
        void refreshPendingCount();
    }, [refreshPendingCount]);

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
