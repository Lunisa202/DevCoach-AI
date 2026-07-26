/**
 * Simple in-memory cache for API responses.
 * Avoids re-fetching on every mount/navigation.
 * TTL-based: data expires after a set time.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL = 30_000 // 30 seconds

/**
 * Get cached data if it exists and hasn't expired.
 */
export function getCached<T>(key: string, ttl = DEFAULT_TTL): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key)
    return null
  }
  return entry.data
}

/**
 * Store data in cache.
 */
export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

/**
 * Invalidate a specific cache key.
 */
export function invalidateCache(key: string): void {
  cache.delete(key)
}

/**
 * Invalidate all cache entries.
 */
export function clearCache(): void {
  cache.clear()
}
