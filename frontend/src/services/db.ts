/**
 * IndexedDB Service for offline data storage
 * Handles local storage of patients, screenings, and sync queue
 */

const DB_NAME = 'RuralHealthDB';
const DB_VERSION = 1;

interface LocalPatient {
    localId: string;
    serverId?: number;
    synced: boolean;
    data: {
        full_name: string;
        age: number;
        gender: string;
        village: string;
        phone?: string;
    };
    createdAt: Date;
}

interface LocalScreening {
    localId: string;
    serverId?: number;
    patientLocalId: string;
    patientServerId?: number;
    synced: boolean;
    data: {
        height_cm?: number;
        weight_kg?: number;
        systolic_bp?: number;
        diastolic_bp?: number;
        heart_rate?: number;
        smoking_status?: string;
        alcohol_usage?: string;
        physical_activity?: string;
        glucose_level?: number;
        cholesterol_level?: number;
    };
    createdAt: Date;
}

interface SyncQueueItem {
    id: string;
    type: 'patient' | 'screening';
    action: 'create' | 'update' | 'delete';
    localId: string;
    data: any;
    attempts: number;
    lastAttempt?: Date;
    error?: string;
}

class DatabaseService {
    private db: IDBDatabase | null = null;
    private dbReady: Promise<IDBDatabase>;

    constructor() {
        this.dbReady = this.initDB();
    }

    private initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Patients store
                if (!db.objectStoreNames.contains('patients')) {
                    const patientsStore = db.createObjectStore('patients', { keyPath: 'localId' });
                    patientsStore.createIndex('synced', 'synced', { unique: false });
                    patientsStore.createIndex('serverId', 'serverId', { unique: false });
                }

                // Screenings store
                if (!db.objectStoreNames.contains('screenings')) {
                    const screeningsStore = db.createObjectStore('screenings', { keyPath: 'localId' });
                    screeningsStore.createIndex('synced', 'synced', { unique: false });
                    screeningsStore.createIndex('patientLocalId', 'patientLocalId', { unique: false });
                    screeningsStore.createIndex('serverId', 'serverId', { unique: false });
                }

                // Sync queue store
                if (!db.objectStoreNames.contains('syncQueue')) {
                    const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
                    syncQueueStore.createIndex('type', 'type', { unique: false });
                    syncQueueStore.createIndex('attempts', 'attempts', { unique: false });
                }

                // Cache store for API responses
                if (!db.objectStoreNames.contains('cache')) {
                    db.createObjectStore('cache', { keyPath: 'key' });
                }

                console.log('IndexedDB schema created');
            };
        });
    }

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        return this.dbReady;
    }

    // Generate UUID for local records
    generateId(): string {
        return 'local_' + crypto.randomUUID();
    }

    // ==================== PATIENTS ====================

    async savePatient(patient: LocalPatient): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['patients'], 'readwrite');
            const store = transaction.objectStore('patients');
            const request = store.put(patient);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getPatient(localId: string): Promise<LocalPatient | undefined> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['patients'], 'readonly');
            const store = transaction.objectStore('patients');
            const request = store.get(localId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllPatients(): Promise<LocalPatient[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['patients'], 'readonly');
            const store = transaction.objectStore('patients');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getUnsyncedPatients(): Promise<LocalPatient[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['patients'], 'readonly');
            const store = transaction.objectStore('patients');
            const index = store.index('synced');
            const request = index.getAll(IDBKeyRange.only(0));

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async updatePatientServerId(localId: string, serverId: number): Promise<void> {
        const patient = await this.getPatient(localId);
        if (patient) {
            patient.serverId = serverId;
            patient.synced = true;
            await this.savePatient(patient);
        }
    }

    // ==================== SCREENINGS ====================

    async saveScreening(screening: LocalScreening): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['screenings'], 'readwrite');
            const store = transaction.objectStore('screenings');
            const request = store.put(screening);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getScreening(localId: string): Promise<LocalScreening | undefined> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['screenings'], 'readonly');
            const store = transaction.objectStore('screenings');
            const request = store.get(localId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllScreenings(): Promise<LocalScreening[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['screenings'], 'readonly');
            const store = transaction.objectStore('screenings');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getUnsyncedScreenings(): Promise<LocalScreening[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['screenings'], 'readonly');
            const store = transaction.objectStore('screenings');
            const index = store.index('synced');
            const request = index.getAll(IDBKeyRange.only(0));

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async updateScreeningServerId(localId: string, serverId: number, patientServerId: number): Promise<void> {
        const screening = await this.getScreening(localId);
        if (screening) {
            screening.serverId = serverId;
            screening.patientServerId = patientServerId;
            screening.synced = true;
            await this.saveScreening(screening);
        }
    }

    // ==================== SYNC QUEUE ====================

    async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'attempts'>): Promise<void> {
        const db = await this.getDB();
        const queueItem: SyncQueueItem = {
            ...item,
            id: this.generateId(),
            attempts: 0,
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const request = store.add(queueItem);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getSyncQueue(): Promise<SyncQueueItem[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['syncQueue'], 'readonly');
            const store = transaction.objectStore('syncQueue');
            const request = store.getAll();

            request.onsuccess = () => {
                // Sort by type (patients first) then by attempts
                const items = request.result || [];
                items.sort((a, b) => {
                    if (a.type === 'patient' && b.type !== 'patient') return -1;
                    if (a.type !== 'patient' && b.type === 'patient') return 1;
                    return a.attempts - b.attempts;
                });
                resolve(items);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const request = store.put(item);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async removeFromSyncQueue(id: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getSyncQueueCount(): Promise<number> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['syncQueue'], 'readonly');
            const store = transaction.objectStore('syncQueue');
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ==================== CACHE ====================

    async setCache(key: string, data: any, ttl: number = 3600000): Promise<void> {
        const db = await this.getDB();
        const cacheItem = {
            key,
            data,
            expiresAt: Date.now() + ttl,
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.put(cacheItem);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getCache(key: string): Promise<any | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                if (result && result.expiresAt > Date.now()) {
                    resolve(result.data);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async clearCache(): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Export singleton instance
export const db = new DatabaseService();
export type { LocalPatient, LocalScreening, SyncQueueItem };
