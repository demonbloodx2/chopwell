import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../services/supabase';
import { SyncQueue } from './syncQueue';
import { SyncQueueItem } from '../types/sync';

/**
 * Sync Engine - Processes the sync queue in the background
 *
 * Handles:
 * - Background syncing when connectivity is available
 * - Last-write-wins conflict resolution
 * - Retry logic for failed syncs
 * - Network status monitoring
 */

const MAX_RETRY_COUNT = 5;
const SYNC_INTERVAL_MS = 30000; // 30 seconds

export class SyncEngine {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  /**
   * Start the sync engine
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log('Sync engine started');

    // Listen to network state changes
    NetInfo.addEventListener((state) => {
      SyncQueue.updateStatus({ isOnline: state.isConnected || false });

      // Trigger immediate sync when coming back online
      if (state.isConnected) {
        this.sync();
      }
    });

    // Start periodic sync
    this.syncInterval = setInterval(() => {
      this.sync();
    }, SYNC_INTERVAL_MS);

    // Initial sync
    this.sync();
  }

  /**
   * Stop the sync engine
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('Sync engine stopped');
  }

  /**
   * Perform a sync operation
   */
  async sync(): Promise<void> {
    const status = await SyncQueue.getStatus();

    // Don't sync if offline or already syncing
    if (!status.isOnline || status.isSyncing) {
      return;
    }

    try {
      await SyncQueue.updateStatus({
        isSyncing: true,
        lastSyncAttempt: Date.now(),
      });

      const unsynced = await SyncQueue.getUnsynced();

      if (unsynced.length === 0) {
        await SyncQueue.updateStatus({ isSyncing: false });
        return;
      }

      console.log(`Syncing ${unsynced.length} items...`);

      // Process each item
      for (const item of unsynced) {
        // Skip items that have exceeded retry count
        if (item.retryCount >= MAX_RETRY_COUNT) {
          console.error(
            `Item ${item.id} exceeded max retry count, skipping`,
            item.error
          );
          continue;
        }

        await this.syncItem(item);
      }

      // Cleanup synced items periodically
      await SyncQueue.pruneSynced();

      await SyncQueue.updateStatus({ isSyncing: false });
    } catch (error) {
      console.error('Sync error:', error);
      await SyncQueue.updateStatus({ isSyncing: false });
    }
  }

  /**
   * Sync a single queue item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    try {
      switch (item.operation) {
        case 'INSERT':
          await this.syncInsert(item);
          break;
        case 'UPDATE':
          await this.syncUpdate(item);
          break;
        case 'DELETE':
          await this.syncDelete(item);
          break;
        default:
          throw new Error(`Unknown operation: ${item.operation}`);
      }

      await SyncQueue.markAsSynced(item.id);
      console.log(`Synced item ${item.id} (${item.operation} ${item.table})`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to sync item ${item.id}:`, errorMessage);
      await SyncQueue.markAsFailed(item.id, errorMessage);
    }
  }

  /**
   * Sync an INSERT operation
   */
  private async syncInsert(item: SyncQueueItem): Promise<void> {
    const { error } = await supabase.from(item.table).insert(item.data);

    if (error) {
      throw error;
    }
  }

  /**
   * Sync an UPDATE operation
   * Uses last-write-wins conflict resolution
   */
  private async syncUpdate(item: SyncQueueItem): Promise<void> {
    // Extract ID from data (assumes 'id' field exists)
    const { id, ...updateData } = item.data;

    if (!id) {
      throw new Error('Cannot update without an ID');
    }

    // Fetch current remote data
    const { data: remoteData, error: fetchError } = await supabase
      .from(item.table)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // If remote was updated after our local write, log a conflict
    // Last-write-wins: we still proceed with our update
    if (remoteData && remoteData.updated_at > item.localTimestamp) {
      await SyncQueue.logConflict(
        item.table,
        item.data,
        remoteData,
        'local_wins' // Our update wins
      );
    }

    // Perform the update
    const { error: updateError } = await supabase
      .from(item.table)
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }
  }

  /**
   * Sync a DELETE operation
   */
  private async syncDelete(item: SyncQueueItem): Promise<void> {
    const { id } = item.data;

    if (!id) {
      throw new Error('Cannot delete without an ID');
    }

    const { error } = await supabase.from(item.table).delete().eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Force an immediate sync
   */
  async forceSyncNow(): Promise<void> {
    console.log('Force sync triggered');
    await this.sync();
  }
}

// Export a singleton instance
export const syncEngine = new SyncEngine();
