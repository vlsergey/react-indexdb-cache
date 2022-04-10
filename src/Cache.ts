
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ValidCacheKey = keyof any;

export type CacheListener<Key, Value> = (cacheKey: Key, value: Value | undefined) => unknown;

export default interface Cache<Key extends ValidCacheKey, Value> {

  clear: () => Promise<void>;

  memoryCache: Readonly< Record<Key, Value>>;

  memoryCacheStamp: number;

  invalidate: (cacheKey: Key) => unknown;

  queue: (cacheKey: Key) => unknown;

  queued: Readonly<Set<Key>>;

  queuedStamp: number;

  putToMemoryCache: (cacheKey: Key, value: Value | undefined) => unknown;

  registerListener: (listener: CacheListener<Key, Value>) => unknown;

  requeue: (cacheKey: Key) => unknown;

  unregisterListener: (listener: CacheListener<Key, Value>) => unknown;

}
