/**
 * Sync Service for handling online/offline data synchronization
 */

import { db } from './db';
import type {
    LocalPatient,
    LocalScreening,
    QueuedScreeningData,
    SyncQueueItem,
} from './db';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
}

/**
 * Raw form input awaiting sync.
 *
 * Values arrive as strings from the wizard inputs but may already be numbers
 * when they come from an OCR extraction, so both are accepted and coerced.
 */
export type OfflineFormInput = Record<string, string | number | undefined | null>;

/** Extract the message from an unknown thrown value. */
function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Coerce a form value to a number, treating blank and unparseable input as
 * "not recorded" rather than zero.
 */
function toFloat(value: string | number | undefined | null): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
}

function toInt(value: string | number | undefined | null): number | undefined {
    const parsed = toFloat(value);
    return parsed === undefined ? undefined : Math.trunc(parsed);
}

function toText(value: string | number | undefined | null): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value);
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
    async savePatientLocally(patientData: OfflineFormInput): Promise<string> {
        const localId = db.generateId();
        const localPatient: LocalPatient = {
            localId,
            synced: false,
            data: {
                full_name: String(patientData.full_name ?? ''),
                age: toInt(patientData.age) ?? 0,
                gender: String(patientData.gender ?? ''),
                village: String(patientData.village ?? ''),
                phone: patientData.phone ? String(patientData.phone) : undefined,
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
    async saveScreeningLocally(
        screeningData: OfflineFormInput,
        patientLocalId: string,
    ): Promise<string> {
        const localId = db.generateId();
        const localScreening: LocalScreening = {
            localId,
            patientLocalId,
            synced: false,
            data: {
                height_cm: toFloat(screeningData.height_cm),
                weight_kg: toFloat(screeningData.weight_kg),
                systolic_bp: toInt(screeningData.systolic_bp),
                diastolic_bp: toInt(screeningData.diastolic_bp),
                heart_rate: toInt(screeningData.heart_rate),
                smoking_status: toText(screeningData.smoking_status),
                alcohol_usage: toText(screeningData.alcohol_usage),
                physical_activity: toText(screeningData.physical_activity),
                glucose_level: toFloat(screeningData.glucose_level),
                cholesterol_level: toFloat(screeningData.cholesterol_level),
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
                        const { patientLocalId } = item.data as QueuedScreeningData;
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
                } catch (error: unknown) {
                    const message = errorMessage(error);
                    console.error(`Failed to sync item ${item.id}:`, error);
                    item.attempts++;
                    item.lastAttempt = new Date();
                    item.error = message;
                    await db.updateSyncQueueItem(item);
                    result.failed++;
                    result.errors.push(`${item.type}: ${message}`);
                }
            }

            result.success = result.failed === 0;
            this.notifyListeners(result.success ? 'success' : 'error');
        } catch (error: unknown) {
            console.error('Sync failed:', error);
            result.success = false;
            result.errors.push(errorMessage(error));
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
        // patientLocalId is an offline-only key and must not reach the server.
        const { patientLocalId: _localId, ...screeningData } =
            item.data as QueuedScreeningData;

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
