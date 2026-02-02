/**
 * Sync Service for handling online/offline data synchronization
 */

import { db } from './db';
import type { LocalPatient, LocalScreening, SyncQueueItem } from './db';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
}

class SyncService {
    private isSyncing: boolean = false;
    private listeners: Set<(status: SyncStatus) => void> = new Set();
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
    }

    isOnline(): boolean {
        return navigator.onLine;
    }

    // Subscribe to sync status changes
    subscribe(callback: (status: SyncStatus) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    private notifyListeners(status: SyncStatus) {
        this.listeners.forEach(cb => cb(status));
    }

    // Save patient locally (for offline use)
    async savePatientLocally(patientData: any): Promise<string> {
        const localId = db.generateId();
        const localPatient: LocalPatient = {
            localId,
            synced: false,
            data: {
                full_name: patientData.full_name,
                age: parseInt(patientData.age) || 0,
                gender: patientData.gender,
                village: patientData.village,
                phone: patientData.phone || undefined,
            },
            createdAt: new Date(),
        };

        await db.savePatient(localPatient);
        await db.addToSyncQueue({
            type: 'patient',
            action: 'create',
            localId,
            data: localPatient.data,
        });

        console.log('Patient saved locally:', localId);
        return localId;
    }

    // Save screening locally (for offline use)
    async saveScreeningLocally(screeningData: any, patientLocalId: string): Promise<string> {
        const localId = db.generateId();
        const localScreening: LocalScreening = {
            localId,
            patientLocalId,
            synced: false,
            data: {
                height_cm: parseFloat(screeningData.height_cm) || undefined,
                weight_kg: parseFloat(screeningData.weight_kg) || undefined,
                systolic_bp: parseInt(screeningData.systolic_bp) || undefined,
                diastolic_bp: parseInt(screeningData.diastolic_bp) || undefined,
                heart_rate: parseInt(screeningData.heart_rate) || undefined,
                smoking_status: screeningData.smoking_status || undefined,
                alcohol_usage: screeningData.alcohol_usage || undefined,
                physical_activity: screeningData.physical_activity || undefined,
                glucose_level: parseFloat(screeningData.glucose_level) || undefined,
                cholesterol_level: parseFloat(screeningData.cholesterol_level) || undefined,
            },
            createdAt: new Date(),
        };

        await db.saveScreening(localScreening);
        await db.addToSyncQueue({
            type: 'screening',
            action: 'create',
            localId,
            data: { ...localScreening.data, patientLocalId },
        });

        console.log('Screening saved locally:', localId);
        return localId;
    }

    // Sync all pending data to server
    async syncAll(): Promise<SyncResult> {
        if (this.isSyncing) {
            console.log('Sync already in progress');
            return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
        }

        if (!this.isOnline()) {
            console.log('Cannot sync: offline');
            return { success: false, synced: 0, failed: 0, errors: ['Device is offline'] };
        }

        if (!this.token) {
            console.log('Cannot sync: no auth token');
            return { success: false, synced: 0, failed: 0, errors: ['Not authenticated'] };
        }

        this.isSyncing = true;
        this.notifyListeners('syncing');

        const result: SyncResult = {
            success: true,
            synced: 0,
            failed: 0,
            errors: [],
        };

        try {
            const queue = await db.getSyncQueue();
            console.log(`Syncing ${queue.length} items...`);

            // Map to store local ID -> server ID mappings
            const patientIdMap = new Map<string, number>();

            // First, get existing mappings from already synced patients
            const patients = await db.getAllPatients();
            patients.forEach(p => {
                if (p.serverId) {
                    patientIdMap.set(p.localId, p.serverId);
                }
            });

            for (const item of queue) {
                try {
                    if (item.type === 'patient') {
                        const serverId = await this.syncPatient(item);
                        if (serverId) {
                            patientIdMap.set(item.localId, serverId);
                            await db.updatePatientServerId(item.localId, serverId);
                            await db.removeFromSyncQueue(item.id);
                            result.synced++;
                        }
                    } else if (item.type === 'screening') {
                        // Get patient server ID
                        const patientLocalId = item.data.patientLocalId;
                        let patientServerId = patientIdMap.get(patientLocalId);

                        // If patient not yet synced, try to find it
                        if (!patientServerId) {
                            const patient = await db.getPatient(patientLocalId);
                            patientServerId = patient?.serverId;
                        }

                        if (!patientServerId) {
                            // Patient not synced yet, skip this screening
                            console.log('Skipping screening - patient not yet synced:', patientLocalId);
                            continue;
                        }

                        const serverId = await this.syncScreening(item, patientServerId);
                        if (serverId) {
                            await db.updateScreeningServerId(item.localId, serverId, patientServerId);
                            await db.removeFromSyncQueue(item.id);
                            result.synced++;
                        }
                    }
                } catch (error: any) {
                    console.error(`Failed to sync item ${item.id}:`, error);
                    item.attempts++;
                    item.lastAttempt = new Date();
                    item.error = error.message;
                    await db.updateSyncQueueItem(item);
                    result.failed++;
                    result.errors.push(`${item.type}: ${error.message}`);
                }
            }

            result.success = result.failed === 0;
            this.notifyListeners(result.success ? 'success' : 'error');
        } catch (error: any) {
            console.error('Sync failed:', error);
            result.success = false;
            result.errors.push(error.message);
            this.notifyListeners('error');
        } finally {
            this.isSyncing = false;
            setTimeout(() => this.notifyListeners('idle'), 3000);
        }

        console.log('Sync result:', result);
        return result;
    }

    private async syncPatient(item: SyncQueueItem): Promise<number | null> {
        const response = await fetch('/api/screening/patients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`,
            },
            body: JSON.stringify(item.data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to sync patient');
        }

        const patient = await response.json();
        return patient.id;
    }

    private async syncScreening(item: SyncQueueItem, patientServerId: number): Promise<number | null> {
        const { patientLocalId, ...screeningData } = item.data;

        const response = await fetch('/api/screening/screenings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`,
            },
            body: JSON.stringify({
                ...screeningData,
                patient_id: patientServerId,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to sync screening');
        }

        const screening = await response.json();
        return screening.id;
    }

    // Get pending sync count
    async getPendingCount(): Promise<number> {
        return db.getSyncQueueCount();
    }

    // Get all local data (for offline dashboard)
    async getLocalStats(): Promise<{
        localPatients: number;
        localScreenings: number;
        pendingSync: number;
    }> {
        const [patients, screenings, pendingSync] = await Promise.all([
            db.getAllPatients(),
            db.getAllScreenings(),
            db.getSyncQueueCount(),
        ]);

        return {
            localPatients: patients.length,
            localScreenings: screenings.length,
            pendingSync,
        };
    }
}

// Export singleton instance
export const syncService = new SyncService();
