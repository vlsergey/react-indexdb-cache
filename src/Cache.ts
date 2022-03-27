
export type CacheListener<Value> = (cacheKey: string, value: Value | undefined) => unknown;

export default interface Cache< Value> {

  clear: () => Promise<void>;

  memoryCache: Record<string, Value>;

  memoryCacheStamp: number;

  invalidate: (cacheKey: string) => unknown;

  queue: (cacheKey: string) => unknown;

  queued: Readonly< Set<string>>;

  queuedStamp: number;

  registerListener: (listener: CacheListener<Value>) => unknown;

  requeue: (cacheKey: string) => unknown;

  unregisterListener: (listener: CacheListener<Value>) => unknown;

}
