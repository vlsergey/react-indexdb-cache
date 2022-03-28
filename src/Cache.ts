
export type ValidCacheKey = string | number | symbol;

export type CacheListener<Key, Value> = (cacheKey: Key, value: Value | undefined) => unknown;

export default interface Cache<Key extends ValidCacheKey, Value> {

  clear: () => Promise<void>;

  memoryCache: Readonly< Record<Key, Value>>;

  memoryCacheStamp: number;

  invalidate: (cacheKey: Key) => unknown;

  queue: (cacheKey: Key) => unknown;

  queued: Readonly<Set<Key>>;

  queuedStamp: number;

  registerListener: (listener: CacheListener<Key, Value>) => unknown;

  requeue: (cacheKey: Key) => unknown;

  unregisterListener: (listener: CacheListener<Key, Value>) => unknown;

}
