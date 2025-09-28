/**
 * High-performance caching system with metrics
 */

import { EventEmitter } from 'events';
import { CacheMetrics } from '../types/performance.types';

export interface CacheOptions {
    maxSize: number;
    ttl: number; // Time to live in milliseconds
    checkInterval: number; // Cleanup interval
    enableMetrics: boolean;
}

export interface CacheEntry<T> {
    value: T;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
    size: number;
}

export class PerformanceCache<T = any> extends EventEmitter {
    private cache: Map<string, CacheEntry<T>> = new Map();
    private options: CacheOptions;
    private cleanupTimer?: NodeJS.Timeout;
    private metrics: CacheMetrics;

    constructor(private name: string, options: Partial<CacheOptions> = {}) {
        super();

        this.options = {
            maxSize: 1000,
            ttl: 5 * 60 * 1000, // 5 minutes
            checkInterval: 60 * 1000, // 1 minute
            enableMetrics: true,
            ...options
        };

        this.metrics = {
            hitRate: 0,
            missRate: 0,
            size: 0,
            maxSize: this.options.maxSize,
            evictions: 0,
            averageAccessTime: 0
        };

        this.startCleanup();
    }

    /**
     * Get value from cache
     */
    public get(key: string): T | undefined {
        const startTime = performance.now();
        const entry = this.cache.get(key);

        if (!entry) {
            this.recordMiss();
            return undefined;
        }

        // Check if expired
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.recordMiss();
            return undefined;
        }

        // Update access info
        entry.accessCount++;
        entry.lastAccessed = Date.now();

        this.recordHit();
        this.updateAccessTime(performance.now() - startTime);

        return entry.value;
    }

    /**
     * Set value in cache
     */
    public set(key: string, value: T, customTtl?: number): void {
        const size = this.calculateSize(value);
        const timestamp = Date.now();

        // Check if we need to evict
        if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }

        const entry: CacheEntry<T> = {
            value,
            timestamp,
            accessCount: 0,
            lastAccessed: timestamp,
            size
        };

        this.cache.set(key, entry);
        this.updateMetrics();

        this.emit('cache-set', { key, size });
    }

    /**
     * Delete value from cache
     */
    public delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.updateMetrics();
            this.emit('cache-delete', { key });
        }
        return deleted;
    }

    /**
     * Clear all cache entries
     */
    public clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.updateMetrics();
        this.emit('cache-clear', { clearedEntries: size });
    }

    /**
     * Check if key exists and is not expired
     */
    public has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Get cache metrics
     */
    public getMetrics(): CacheMetrics {
        return { ...this.metrics };
    }

    /**
     * Get cache statistics
     */
    public getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        missRate: number;
        totalRequests: number;
        evictions: number;
    } {
        const totalRequests = this.metrics.hitRate + this.metrics.missRate;
        return {
            size: this.cache.size,
            maxSize: this.options.maxSize,
            hitRate: totalRequests > 0 ? (this.metrics.hitRate / totalRequests) * 100 : 0,
            missRate: totalRequests > 0 ? (this.metrics.missRate / totalRequests) * 100 : 0,
            totalRequests,
            evictions: this.metrics.evictions
        };
    }

    /**
     * Get or set with factory function
     */
    public async getOrSet(
        key: string,
        factory: () => Promise<T>,
        customTtl?: number
    ): Promise<T> {
        const cached = this.get(key);
        if (cached !== undefined) {
            return cached;
        }

        const value = await factory();
        this.set(key, value, customTtl);
        return value;
    }

    /**
     * Memoize a function with caching
     */
    public memoize<Args extends any[], Return extends T>(
        fn: (...args: Args) => Promise<Return>,
        keyGenerator?: (...args: Args) => string
    ): (...args: Args) => Promise<Return> {
        return async (...args: Args): Promise<Return> => {
            const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
            return this.getOrSet(key, () => fn(...args)) as Promise<Return>;
        };
    }

    /**
     * Warm up cache with data
     */
    public warmUp(data: Map<string, T>): void {
        data.forEach((value, key) => {
            this.set(key, value);
        });
        this.emit('cache-warmed', { entries: data.size });
    }

    /**
     * Export cache data
     */
    public export(): Map<string, T> {
        const data = new Map<string, T>();
        this.cache.forEach((entry, key) => {
            if (!this.isExpired(entry)) {
                data.set(key, entry.value);
            }
        });
        return data;
    }

    /**
     * Cleanup expired entries
     */
    public cleanup(): number {
        const initialSize = this.cache.size;
        const now = Date.now();

        const keysToDelete: string[] = [];
        this.cache.forEach((entry, key) => {
            if (this.isExpired(entry)) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.cache.delete(key));

        const cleaned = initialSize - this.cache.size;
        if (cleaned > 0) {
            this.updateMetrics();
            this.emit('cache-cleanup', { cleaned });
        }

        return cleaned;
    }

    /**
     * Destroy cache and cleanup resources
     */
    public destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.clear();
        this.removeAllListeners();
    }

    private isExpired(entry: CacheEntry<T>): boolean {
        return Date.now() - entry.timestamp > this.options.ttl;
    }

    private evictLRU(): void {
        let oldestKey: string | undefined;
        let oldestTime = Date.now();

        this.cache.forEach((entry, key) => {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        });

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.metrics.evictions++;
            this.emit('cache-evict', { key: oldestKey, reason: 'lru' });
        }
    }

    private calculateSize(value: T): number {
        // Simplified size calculation
        if (typeof value === 'string') {
            return value.length * 2; // UTF-16
        }
        if (typeof value === 'object') {
            return JSON.stringify(value).length * 2;
        }
        return 8; // Primitive types
    }

    private recordHit(): void {
        this.metrics.hitRate++;
    }

    private recordMiss(): void {
        this.metrics.missRate++;
    }

    private updateAccessTime(time: number): void {
        const totalRequests = this.metrics.hitRate + this.metrics.missRate;
        this.metrics.averageAccessTime =
            (this.metrics.averageAccessTime * (totalRequests - 1) + time) / totalRequests;
    }

    private updateMetrics(): void {
        this.metrics.size = this.cache.size;
        this.metrics.maxSize = this.options.maxSize;

        if (this.options.enableMetrics) {
            this.emit('metrics-updated', this.metrics);
        }
    }

    private startCleanup(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.options.checkInterval);
    }
}

/**
 * Multi-level cache with L1 (memory) and L2 (persistent) storage
 */
export class MultiLevelCache<T = any> extends EventEmitter {
    private l1Cache: PerformanceCache<T>;
    private l2Cache?: Map<string, string>; // Serialized storage

    constructor(
        name: string,
        private options: {
            l1Options: Partial<CacheOptions>;
            l2Options?: {
                enabled: boolean;
                maxSize: number;
                serializer?: (value: T) => string;
                deserializer?: (value: string) => T;
            };
        }
    ) {
        super();

        this.l1Cache = new PerformanceCache(`${name}-l1`, options.l1Options);

        if (options.l2Options?.enabled) {
            this.l2Cache = new Map();
        }

        // Forward L1 events
        this.l1Cache.on('metrics-updated', (metrics) => {
            this.emit('l1-metrics', metrics);
        });
    }

    /**
     * Get value from multi-level cache
     */
    public async get(key: string): Promise<T | undefined> {
        // Try L1 first
        let value = this.l1Cache.get(key);
        if (value !== undefined) {
            this.emit('l1-hit', { key });
            return value;
        }

        // Try L2 if available
        if (this.l2Cache) {
            const serialized = this.l2Cache.get(key);
            if (serialized) {
                try {
                    value = this.options.l2Options?.deserializer
                        ? this.options.l2Options.deserializer(serialized)
                        : JSON.parse(serialized);

                    // Promote to L1 (only if value is not undefined)
                    if (value !== undefined) {
                        this.l1Cache.set(key, value);
                    }
                    this.emit('l2-hit', { key });
                    return value;
                } catch (error) {
                    this.emit('l2-error', { key, error });
                }
            }
        }

        this.emit('cache-miss', { key });
        return undefined;
    }

    /**
     * Set value in multi-level cache
     */
    public async set(key: string, value: T): Promise<void> {
        // Set in L1
        this.l1Cache.set(key, value);

        // Set in L2 if available
        if (this.l2Cache) {
            try {
                const serialized = this.options.l2Options?.serializer
                    ? this.options.l2Options.serializer(value)
                    : JSON.stringify(value);

                this.l2Cache.set(key, serialized);
                this.emit('l2-set', { key });
            } catch (error) {
                this.emit('l2-error', { key, error });
            }
        }
    }

    /**
     * Delete value from multi-level cache
     */
    public async delete(key: string): Promise<boolean> {
        const l1Deleted = this.l1Cache.delete(key);
        let l2Deleted = false;

        if (this.l2Cache) {
            l2Deleted = this.l2Cache.delete(key);
        }

        return l1Deleted || l2Deleted;
    }

    /**
     * Clear all caches
     */
    public async clear(): Promise<void> {
        this.l1Cache.clear();
        if (this.l2Cache) {
            this.l2Cache.clear();
        }
    }

    /**
     * Get cache statistics
     */
    public getStats(): {
        l1: ReturnType<PerformanceCache<T>['getStats']>;
        l2?: { size: number; maxSize: number };
    } {
        return {
            l1: this.l1Cache.getStats(),
            l2: this.l2Cache ? {
                size: this.l2Cache.size,
                maxSize: this.options.l2Options?.maxSize || 0
            } : undefined
        };
    }

    /**
     * Destroy multi-level cache
     */
    public destroy(): void {
        this.l1Cache.destroy();
        if (this.l2Cache) {
            this.l2Cache.clear();
        }
        this.removeAllListeners();
    }
}