interface CacheOptions {
  maxAge?: number;
  maxSize?: number;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  size: number;
}

export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxAge: number;
  private maxSize: number;
  private currentSize = 0;

  constructor(options: CacheOptions = {}) {
    this.maxAge = options.maxAge || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100; // 100 items default
  }

  set(key: string, value: T): void {
    this.cleanup();

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      size: this.calculateSize(value)
    };

    // If adding this item would exceed maxSize, remove oldest entries
    while (this.currentSize + entry.size > this.maxSize) {
      const oldestKey = this.getOldestKey();
      if (!oldestKey) break;
      this.delete(oldestKey);
    }

    this.cache.set(key, entry);
    this.currentSize += entry.size;
  }

  get<D = T>(key: string): D | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.delete(key);
      return null;
    }

    return entry.value as D;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.delete(key);
      }
    }
  }

  private getOldestKey(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private calculateSize(value: T): number {
    if (typeof value === 'string') {
      return value.length;
    }
    if (Array.isArray(value)) {
      return value.length;
    }
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length;
    }
    return 1;
  }
}