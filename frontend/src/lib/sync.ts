// Sync service for online/offline data synchronization
// import { db } from './db';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class SyncService {
  private isOnline: boolean = navigator.onLine;
  // private syncInProgress: boolean = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('App is online');
      this.syncData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('App is offline');
    });

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_DATA') {
          this.syncData();
        }
      });
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  async syncData(): Promise<void> {
    // Legacy sync is disabled as we have migrated to Firestore.
    // Firestore SDK handles offline persistence and synchronization automatically.
    console.log('Legacy sync disabled. Firestore handles offline persistence automatically.');
    return;
  }

  // Register background sync if supported
  async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // @ts-ignore
        await registration.sync.register('sync-data');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }
}

export const syncService = new SyncService();
