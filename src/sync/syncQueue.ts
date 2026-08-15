import { LocalStore } from '../store/localStore';
import {
  SyncQueueItem,
  SyncOperation,
  ConflictLog,
  SyncStatus,
} from '../types/sync';

/**
 * Sync Queue - Manages offline-first write queue
 *
 * Writes go local-first, then enqueued here for background sync to Supabase.
 * The UI never waits for network calls - updates are instant from local store.
 */

const SYNC_QUEUE_KEY = 'sync_queue';
const CONFLICT_LOG_KEY = 'conflict_log';
const SYNC_STATUS_KEY = 'sync_status';

export const SyncQueue = {
  /**
   * Add a write operation to the sync queue
   */
  async enqueue(
    operation: SyncOperation,
    table: string,
    data: Record<string, any>
  ): Promise<string> {
    const queue = await this.getQueue();

    const item: SyncQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation,
      table,
      data,
      localTimestamp: Date.now(),
      retryCount: 0,
      lastAttempt: null,
      synced: false,
      error: null,
    };

    queue.push(item);
    await LocalStore.set(SYNC_QUEUE_KEY, queue);

    // Update pending count
    await this.updateStatus({ pendingCount: queue.length });

    return item.id;
  },

  /**
   * Get the entire sync queue
   */
  async getQueue(): Promise<SyncQueueItem[]> {
    const queue = await LocalStore.get<SyncQueueItem[]>(SYNC_QUEUE_KEY);
    return queue || [];
  },

  /**
   * Get unsynced items from the queue
   */
  async getUnsynced(): Promise<SyncQueueItem[]> {
    const queue = await this.getQueue();
    return queue.filter((item) => !item.synced);
  },

  /**
   * Mark a queue item as synced
   */
  async markAsSynced(itemId: string): Promise<void> {
    const queue = await this.getQueue();
    const updated = queue.map((item) =>
      item.id === itemId ? { ...item, synced: true, error: null } : item
    );
    await LocalStore.set(SYNC_QUEUE_KEY, updated);
    await this.updateStatus({
      pendingCount: updated.filter((i) => !i.synced).length,
      lastSuccessfulSync: Date.now(),
    });
  },

  /**
   * Mark a queue item as failed with error
   */
  async markAsFailed(itemId: string, error: string): Promise<void> {
    const queue = await this.getQueue();
    const updated = queue.map((item) =>
      item.id === itemId
        ? {
            ...item,
            retryCount: item.retryCount + 1,
            lastAttempt: Date.now(),
            error,
          }
        : item
    );
    await LocalStore.set(SYNC_QUEUE_KEY, updated);
  },

  /**
   * Remove synced items from the queue (cleanup)
   */
  async pruneSynced(): Promise<void> {
    const queue = await this.getQueue();
    const unsynced = queue.filter((item) => !item.synced);
    await LocalStore.set(SYNC_QUEUE_KEY, unsynced);
    await this.updateStatus({ pendingCount: unsynced.length });
  },

  /**
   * Clear the entire queue (use with caution)
   */
  async clear(): Promise<void> {
    await LocalStore.set(SYNC_QUEUE_KEY, []);
    await this.updateStatus({ pendingCount: 0 });
  },

  /**
   * Log a conflict for debugging
   */
  async logConflict(
    table: string,
    localData: Record<string, any>,
    remoteData: Record<string, any>,
    resolution: 'local_wins' | 'remote_wins'
  ): Promise<void> {
    const conflicts = await LocalStore.get<ConflictLog[]>(CONFLICT_LOG_KEY);
    const log: ConflictLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      table,
      localData,
      remoteData,
      resolution,
      timestamp: Date.now(),
    };

    const updated = [...(conflicts || []), log];
    await LocalStore.set(CONFLICT_LOG_KEY, updated);

    console.warn('Sync conflict detected:', {
      table,
      resolution,
      timestamp: new Date(log.timestamp).toISOString(),
    });
  },

  /**
   * Get conflict logs
   */
  async getConflictLogs(): Promise<ConflictLog[]> {
    const logs = await LocalStore.get<ConflictLog[]>(CONFLICT_LOG_KEY);
    return logs || [];
  },

  /**
   * Get sync status
   */
  async getStatus(): Promise<SyncStatus> {
    const status = await LocalStore.get<SyncStatus>(SYNC_STATUS_KEY);
    return (
      status || {
        isOnline: true,
        isSyncing: false,
        pendingCount: 0,
        lastSyncAttempt: null,
        lastSuccessfulSync: null,
      }
    );
  },

  /**
   * Update sync status
   */
  async updateStatus(updates: Partial<SyncStatus>): Promise<void> {
    const current = await this.getStatus();
    const updated = { ...current, ...updates };
    await LocalStore.set(SYNC_STATUS_KEY, updated);
  },
};
