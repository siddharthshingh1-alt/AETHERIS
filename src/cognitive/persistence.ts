/**
 * Persistence Abstraction Layer for Cognitive Architecture.
 *
 * Provides a clean interface for persisting ExperienceRecords and cognitive state
 * across browser sessions, page reloads, and application restarts.
 * Supports LocalStorage (browser), IndexedDB, or In-Memory (Node/CLI/Testing) backends.
 */

export interface PersistenceAdapter<T> {
  load(): T | null;
  save(data: T): void;
  clear(): void;
}

/**
 * LocalStorage adapter with safe fallbacks for non-browser (Node.js/SSR/Testing) environments.
 */
export class LocalStorageAdapter<T> implements PersistenceAdapter<T> {
  private key: string;
  private memoryFallback: T | null = null;

  constructor(key: string) {
    this.key = key;
  }

  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  public load(): T | null {
    if (!this.isLocalStorageAvailable()) {
      return this.memoryFallback;
    }
    try {
      const raw = window.localStorage.getItem(this.key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[LocalStorageAdapter] Failed to load key "${this.key}":`, err);
      return this.memoryFallback;
    }
  }

  public save(data: T): void {
    this.memoryFallback = data;
    if (!this.isLocalStorageAvailable()) {
      return;
    }
    try {
      window.localStorage.setItem(this.key, JSON.stringify(data));
    } catch (err) {
      console.warn(`[LocalStorageAdapter] Failed to save key "${this.key}":`, err);
    }
  }

  public clear(): void {
    this.memoryFallback = null;
    if (!this.isLocalStorageAvailable()) {
      return;
    }
    try {
      window.localStorage.removeItem(this.key);
    } catch (err) {
      console.warn(`[LocalStorageAdapter] Failed to clear key "${this.key}":`, err);
    }
  }
}

/**
 * In-Memory persistence adapter (strictly for test isolation).
 */
export class MemoryPersistenceAdapter<T> implements PersistenceAdapter<T> {
  private data: T | null = null;

  constructor(initialData: T | null = null) {
    this.data = initialData;
  }

  public load(): T | null {
    return this.data;
  }

  public save(data: T): void {
    this.data = data;
  }

  public clear(): void {
    this.data = null;
  }
}
