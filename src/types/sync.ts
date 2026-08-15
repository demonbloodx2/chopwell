/**
 * Sync Queue Types
 *
 * Defines the structure for offline-first write queue and conflict resolution
 */

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SyncQueueItem {
  id: string; // Unique ID for this queue item
  operation: SyncOperation;
  table: string; // Supabase table name
  data: Record<string, any>; // The data to sync
  localTimestamp: number; // When the write happened locally
  retryCount: number;
  lastAttempt: number | null;
  synced: boolean;
  error: string | null;
}

export interface ConflictLog {
  id: string;
  table: string;
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  resolution: 'local_wins' | 'remote_wins';
  timestamp: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAttempt: number | null;
  lastSuccessfulSync: number | null;
}
