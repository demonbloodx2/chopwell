import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local Store - Offline-first source of truth
 *
 * This is the primary data store for the application. All reads come from here,
 * never directly from Supabase. Supabase is the sync target, not a live dependency
 * for rendering.
 *
 * Architecture principle: The UI never waits on network calls to display data.
 */

const STORE_PREFIX = '@chopwell:';

export const LocalStore = {
  /**
   * Get an item from local storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(`${STORE_PREFIX}${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error reading from local store (${key}):`, error);
      return null;
    }
  },

  /**
   * Set an item in local storage
   */
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(
        `${STORE_PREFIX}${key}`,
        JSON.stringify(value)
      );
      return true;
    } catch (error) {
      console.error(`Error writing to local store (${key}):`, error);
      return false;
    }
  },

  /**
   * Remove an item from local storage
   */
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(`${STORE_PREFIX}${key}`);
      return true;
    } catch (error) {
      console.error(`Error removing from local store (${key}):`, error);
      return false;
    }
  },

  /**
   * Get multiple items at once
   */
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const prefixedKeys = keys.map((key) => `${STORE_PREFIX}${key}`);
      const values = await (AsyncStorage as any).multiGet(prefixedKeys);

      return values.reduce(
        (
          acc: Record<string, T | null>,
          [key, value]: [string, string | null]
        ) => {
          const originalKey = key.replace(STORE_PREFIX, '');
          acc[originalKey] = value ? JSON.parse(value) : null;
          return acc;
        },
        {} as Record<string, T | null>
      );
    } catch (error) {
      console.error('Error reading multiple items from local store:', error);
      return {};
    }
  },

  /**
   * Clear all data from local storage (use with caution)
   */
  async clear(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chopwellKeys = keys.filter((key) => key.startsWith(STORE_PREFIX));
      await (AsyncStorage as any).multiRemove(chopwellKeys);
      return true;
    } catch (error) {
      console.error('Error clearing local store:', error);
      return false;
    }
  },

  /**
   * Get all keys in the store
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter((key) => key.startsWith(STORE_PREFIX))
        .map((key) => key.replace(STORE_PREFIX, ''));
    } catch (error) {
      console.error('Error getting all keys from local store:', error);
      return [];
    }
  },
};
