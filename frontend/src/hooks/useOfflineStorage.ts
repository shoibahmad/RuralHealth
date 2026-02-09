// React hook for offline storage operations
import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { Patient, Screening } from '../lib/db';
import { syncService } from '../lib/sync';

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initialize IndexedDB
    db.init().catch(console.error);

    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const savePatient = async (patient: Patient): Promise<number> => {
    const id = await db.addPatient(patient);
    if (isOnline) {
      syncService.syncData();
    }
    return id;
  };

  const saveScreening = async (screening: Screening): Promise<number> => {
    const id = await db.addScreening(screening);
    if (isOnline) {
      syncService.syncData();
    }
    return id;
  };

  const getPatients = async (): Promise<Patient[]> => {
    return await db.getPatients();
  };

  const getScreenings = async (): Promise<Screening[]> => {
    return await db.getScreenings();
  };

  const syncNow = async (): Promise<void> => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }
    setIsSyncing(true);
    try {
      await syncService.syncData();
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    isSyncing,
    savePatient,
    saveScreening,
    getPatients,
    getScreenings,
    syncNow,
    db
  };
}
