// IndexedDB wrapper for offline data storage
const DB_NAME = 'RuralHealthAI';
const DB_VERSION = 1;

export interface Patient {
  id?: number;
  full_name: string;
  age: number;
  gender: string;
  village: string;
  phone?: string;
  health_worker_id?: number;
  created_at?: string;
  synced?: boolean;
}

export interface Screening {
  id?: number;
  patient_id: number;
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
  risk_score?: number;
  risk_level?: string;
  risk_notes?: string;
  created_at?: string;
  synced?: boolean;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('patients')) {
          const patientStore = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
          patientStore.createIndex('synced', 'synced', { unique: false });
          patientStore.createIndex('village', 'village', { unique: false });
        }

        if (!db.objectStoreNames.contains('screenings')) {
          const screeningStore = db.createObjectStore('screenings', { keyPath: 'id', autoIncrement: true });
          screeningStore.createIndex('patient_id', 'patient_id', { unique: false });
          screeningStore.createIndex('synced', 'synced', { unique: false });
          screeningStore.createIndex('risk_level', 'risk_level', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Patient operations
  async addPatient(patient: Patient): Promise<number> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patients'], 'readwrite');
      const store = transaction.objectStore('patients');
      const patientData = { ...patient, synced: false, created_at: new Date().toISOString() };
      const request = store.add(patientData);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getPatients(): Promise<Patient[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patients'], 'readonly');
      const store = transaction.objectStore('patients');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patients'], 'readonly');
      const store = transaction.objectStore('patients');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePatient(id: number, patient: Partial<Patient>): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patients'], 'readwrite');
      const store = transaction.objectStore('patients');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = { ...getRequest.result, ...patient };
        const updateRequest = store.put(data);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Screening operations
  async addScreening(screening: Screening): Promise<number> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['screenings'], 'readwrite');
      const store = transaction.objectStore('screenings');
      const screeningData = { ...screening, synced: false, created_at: new Date().toISOString() };
      const request = store.add(screeningData);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getScreenings(): Promise<Screening[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['screenings'], 'readonly');
      const store = transaction.objectStore('screenings');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getScreeningsByPatient(patientId: number): Promise<Screening[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['screenings'], 'readonly');
      const store = transaction.objectStore('screenings');
      const index = store.index('patient_id');
      const request = index.getAll(patientId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async addToSyncQueue(type: 'patient' | 'screening', data: any): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.add({ type, data, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get unsynced data
  async getUnsyncedPatients(): Promise<Patient[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patients'], 'readonly');
      const store = transaction.objectStore('patients');
      const index = store.index('synced');
      const request = index.getAll(false as any);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedScreenings(): Promise<Screening[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['screenings'], 'readonly');
      const store = transaction.objectStore('screenings');
      const index = store.index('synced');
      const request = index.getAll(false as any);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    const stores = ['patients', 'screenings', 'sync_queue'];
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(stores, 'readwrite');
      let completed = 0;

      stores.forEach(storeName => {
        const request = transaction.objectStore(storeName).clear();
        request.onsuccess = () => {
          completed++;
          if (completed === stores.length) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }
}

export const db = new IndexedDBService();
